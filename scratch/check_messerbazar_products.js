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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    })
  });
}

const db = admin.firestore();

async function run() {
  const shopId = 'S8KAM6INlufrp3oaLlFv9ADOcU82';
  console.log(`Checking products for shopId: ${shopId}...`);
  const productsSnap = await db.collection('shops').doc(shopId).collection('products').get();
  console.log(`Found ${productsSnap.docs.length} products.`);
  productsSnap.docs.forEach((doc, i) => {
    console.log(`Product ${i+1} [${doc.id}]:`, doc.data());
  });

  console.log(`Checking categories for shopId: ${shopId}...`);
  const catSnap = await db.collection('shops').doc(shopId).collection('categories').get();
  console.log(`Found ${catSnap.docs.length} categories.`);
  catSnap.docs.forEach((doc, i) => {
    console.log(`Category ${i+1} [${doc.id}]:`, doc.data());
  });
}

run().catch(console.error);
