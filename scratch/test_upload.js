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
const storageBucket = 'webmaa-app.appspot.com';

console.log('Project ID:', projectId);
console.log('Client Email:', clientEmail);
console.log('Storage Bucket:', storageBucket);

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
  storageBucket
});

const bucket = admin.storage().bucket();

async function testUpload() {
  console.log('Listing all buckets...');
  const [buckets] = await admin.storage().bucket().storage.getBuckets();
  console.log('Buckets list:');
  buckets.forEach(b => {
    console.log('-', b.name);
  });
}

testUpload().catch(err => {
  console.error('❌ Upload or Signed URL generation failed:', err);
});
