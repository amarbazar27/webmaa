const fs = require('fs');
const path = require('path');

// Manually load env variables from .env.local
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

async function run() {
  const shopId = 'RXHEXxuigLeeqC04Sx8TSlbIpJH2';
  console.log(`Updating shop ${shopId} to set customDomain 'camerakini.com' and domainStatus 'connected'...`);
  
  const docRef = db.collection('shops').doc(shopId);
  await docRef.update({
    customDomain: 'camerakini.com',
    domainStatus: 'connected',
    domains: ['camerakini.com', 'www.camerakini.com']
  });
  
  console.log('✅ Shop domain status successfully updated to connected!');
  
  // Verify by fetching again
  const snap = await docRef.get();
  console.log('Updated Shop Data:', JSON.stringify(snap.data(), null, 2));
}

run().catch(console.error);
