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

async function checkOAuth() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'webmaa-app';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  const token = await app.options.credential.getAccessToken();

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

  // Check Identity Toolkit / Auth config
  console.log('Checking Auth config...');
  const authConfig = await apiGet(`https://identitytoolkit.googleapis.com/v2/projects/${projectId}/config`);
  console.log('Identity Toolkit config status:', authConfig.status);
  console.log('Identity Toolkit config:', JSON.stringify(authConfig.body, null, 2));

  // Check Inbound SAML / IdP config
  const idpConfig = await apiGet(`https://identitytoolkit.googleapis.com/v2/projects/${projectId}/defaultSupportedIdpConfigs/google.com`);
  console.log('Google IdP config status:', idpConfig.status);
  console.log('Google IdP config:', JSON.stringify(idpConfig.body, null, 2));
}

checkOAuth().catch(console.error);
