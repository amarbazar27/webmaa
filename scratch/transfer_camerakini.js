const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.replace(/\\n/g, '\n');
      }
    });
  } catch (err) {
    console.warn(`Failed to read env file: ${filePath}`, err.message);
  }
}

loadEnvFile(path.join(__dirname, '../.env.local'));
loadEnvFile(path.join(__dirname, '../.env'));

const admin = require('firebase-admin');
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing Firebase environment variables.');
  process.exit(1);
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    })
  });
}

const db = admin.firestore();

const OLD_SHOP_ID = 'IrfG8l6GFQNquYH3xs0dzv2CvV53';
const NEW_SHOP_ID = 'RXHEXxuigLeeqC04Sx8TSlbIpJH2';

async function migrateCollection(subColName) {
  const oldRef = db.collection('shops').doc(OLD_SHOP_ID).collection(subColName);
  const newRef = db.collection('shops').doc(NEW_SHOP_ID).collection(subColName);
  
  const snap = await oldRef.get();
  console.log(`Migrating ${snap.size} documents from sub-collection: ${subColName}...`);
  
  for (const doc of snap.docs) {
    await newRef.doc(doc.id).set(doc.data());
  }
}

async function deleteCollection(subColName) {
  const oldRef = db.collection('shops').doc(OLD_SHOP_ID).collection(subColName);
  const snap = await oldRef.get();
  console.log(`Deleting ${snap.size} documents from sub-collection: ${subColName}...`);
  for (const doc of snap.docs) {
    await oldRef.doc(doc.id).delete();
  }
}

async function run() {
  console.log(`Starting ownership transfer rollback from ${OLD_SHOP_ID} to ${NEW_SHOP_ID}...`);
  
  const oldShopDoc = await db.collection('shops').doc(OLD_SHOP_ID).get();
  if (!oldShopDoc.exists) {
    console.error("❌ Old shop document not found!");
    return;
  }
  
  const shopData = oldShopDoc.data();
  // Update ownerId to the new UID
  shopData.ownerId = NEW_SHOP_ID;
  
  console.log("1. Creating new shop document...");
  await db.collection('shops').doc(NEW_SHOP_ID).set(shopData);
  
  console.log("2. Migrating sub-collections...");
  await migrateCollection('products');
  await migrateCollection('categories');
  await migrateCollection('orders');
  await migrateCollection('customers');
  
  console.log("3. Updating user roles in users collection...");
  // Downgrade old owner (arhamthesk8boi)
  await db.collection('users').doc(OLD_SHOP_ID).update({
    role: 'user',
    accessShopId: null,
    shopSlug: null
  }).then(() => console.log("Downgraded arhamthesk8boi to user role."))
    .catch(e => console.warn("Failed to update arhamthesk8boi user doc:", e.message));
    
  // Upgrade new owner (camerakini1)
  await db.collection('users').doc(NEW_SHOP_ID).update({
    role: 'retailer',
    shopSlug: shopData.shopSlug || 'camerakini1-600'
  }).then(() => console.log("Upgraded camerakini1 to retailer role."))
    .catch(e => {
      console.warn("camerakini1 user doc not found. Creating it...");
      return db.collection('users').doc(NEW_SHOP_ID).set({
        uid: NEW_SHOP_ID,
        email: 'camerakini1@gmail.com',
        name: 'Camerakini.com Store Owner',
        role: 'retailer',
        shopSlug: shopData.shopSlug || 'camerakini1-600',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
    });

  console.log("4. Cleaning up old shop document and its sub-collections...");
  await deleteCollection('products');
  await deleteCollection('categories');
  await deleteCollection('orders');
  await deleteCollection('customers');
  await db.collection('shops').doc(OLD_SHOP_ID).delete();
  
  console.log("🎉 Ownership rollback completed successfully!");
}

run().catch(console.error);
