const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');

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

async function check() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'webmaa-app';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log('Project ID:', projectId);
  console.log('Client Email:', clientEmail);
  console.log('Has private key:', !!privateKey);

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  console.log('Firebase initialized.');

  // Let's get Google OAuth access token for service account to query Firebase Management API
  const token = await app.options.credential.getAccessToken();
  console.log('Got access token, expires in:', token.expires_in);

  // Query Firebase Management API for Android apps
  async function apiGet(url) {
    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'Accept': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch(e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }).on('error', reject);
    });
  }

  const appsRes = await apiGet(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/androidApps`);
  console.log('Android Apps status:', appsRes.status);
  console.log('Android Apps:', JSON.stringify(appsRes.body, null, 2));

  if (appsRes.body && appsRes.body.apps) {
    for (const a of appsRes.body.apps) {
      const appId = a.appId;
      console.log(`\n--- App: ${a.packageName} (${appId}) ---`);
      const shaRes = await apiGet(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/androidApps/${appId}/sha`);
      console.log('SHA certificates:', JSON.stringify(shaRes.body, null, 2));
      
      const configRes = await apiGet(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/androidApps/${appId}/config`);
      console.log('Config status:', configRes.status);
      if (configRes.body && configRes.body.configFileContents) {
        const decoded = Buffer.from(configRes.body.configFileContents, 'base64').toString('utf8');
        console.log('Decoded google-services.json from Firebase:');
        console.log(decoded);
      }
    }
  }
}

check().catch(console.error);
