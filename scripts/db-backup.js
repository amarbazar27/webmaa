const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------
// SECURE DISASTER RECOVERY SCRIPT FOR FIRESTORE
// ---------------------------------------------------------
// Usage: node scripts/db-backup.js
// Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY 
// are set in your local environment (.env.local) or CI pipeline.

require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin. Check your ENV credentials.');
    console.error(error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

// Specific collections to backup
const COLLECTIONS_TO_BACKUP = ['shops', 'users'];

async function backupCollection(collectionName) {
  console.log(`\n📦 Backing up [${collectionName}]...`);
  const snapshot = await db.collection(collectionName).get();
  
  const data = {};
  for (const doc of snapshot.docs) {
    data[doc.id] = doc.data();
    
    // For specific sub-collections (e.g., shops/{shopId}/products)
    if (collectionName === 'shops') {
      data[doc.id]._subcollections = {};
      
      const subCollections = ['products', 'orders', 'categories'];
      for (const sub of subCollections) {
        const subSnap = await db.collection(collectionName).doc(doc.id).collection(sub).get();
        if (!subSnap.empty) {
          data[doc.id]._subcollections[sub] = {};
          subSnap.forEach(subDoc => {
             data[doc.id]._subcollections[sub][subDoc.id] = subDoc.data();
          });
        }
      }
    }
  }

  return data;
}

async function runBackup() {
  console.log('🚀 Starting Webmaa Disaster Recovery DB Backup...');
  
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fullBackup = {};

  try {
    for (const col of COLLECTIONS_TO_BACKUP) {
      fullBackup[col] = await backupCollection(col);
    }

    const filename = `backup-${timestamp}.json`;
    const filePath = path.join(backupDir, filename);
    
    fs.writeFileSync(filePath, JSON.stringify(fullBackup, null, 2));
    
    console.log(`\n✅ Backup process completed successfully!`);
    console.log(`📁 File saved to: ${filePath}`);
    
  } catch (error) {
    console.error(`\n❌ Error during backup process:`, error);
    process.exit(1);
  }
}

runBackup();
