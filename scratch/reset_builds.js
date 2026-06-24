const path = require('path');

function loadEnvFile(filePath) {
  const fs = require('fs');
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
  } catch (err) {}
}

loadEnvFile(path.join(__dirname, '../.env.local'));
loadEnvFile(path.join(__dirname, '../.env'));

const admin = require('firebase-admin');
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey })
});

const db = admin.firestore();

async function resetBuildUrls() {
  // Reset try shop — old relative URLs don't work, clear them so rebuild generates fresh ones
  const tryQuery = await db.collection('shops').where('subdomainSlug', '==', 'try').limit(1).get();
  if (!tryQuery.empty) {
    const docId = tryQuery.docs[0].id;
    await db.collection('shops').doc(docId).update({
      appBuildStatus: 'not_generated',
      appBuildApkUrl: null,
      appBuildAabUrl: null,
      appBuildError: null,
      appBuildUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Reset "try" shop build status to not_generated');
  }

  // Reset messerbazar shop — old relative URLs don't work either
  const mbQuery = await db.collection('shops').where('subdomainSlug', '==', 'messerbazar').limit(1).get();
  if (!mbQuery.empty) {
    const docId = mbQuery.docs[0].id;
    await db.collection('shops').doc(docId).update({
      appBuildStatus: 'not_generated',
      appBuildApkUrl: null,
      appBuildAabUrl: null,
      appBuildError: null,
      appBuildUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Reset "messerbazar" shop build status to not_generated');
  }

  console.log('Done. Now rebuild both shops from the superadmin panel.');
}

resetBuildUrls().catch(console.error);
