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

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  })
});

const db = admin.firestore();

async function run() {
  const query = await db.collection('shops').where('subdomainSlug', 'in', ['messerbazar', 'try']).get();
  if (query.empty) {
    console.log('No shops found.');
  } else {
    query.forEach(doc => {
      console.log(`Shop: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  }
}

run().catch(console.error);
