const https = require('https');
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

const slug = process.argv[2] || 'main';
const token = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;

if (!token) {
  console.error('No GITHUB_PAT found in .env.local');
  process.exit(1);
}

const postData = JSON.stringify({
  event_type: 'build-app',
  client_payload: {
    shopSlug: slug
  }
});

console.log(`Triggering GitHub Actions build for shop: ${slug}...`);

const options = {
  hostname: 'api.github.com',
  path: '/repos/amarbazar27/webmaa/dispatches',
  method: 'POST',
  headers: {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'BDRetailers-Builder',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`Response status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 204) {
      console.log('✅ GitHub Actions build triggered successfully!');
      console.log('Check live progress at: https://github.com/amarbazar27/webmaa/actions');
    } else {
      console.log('Response body:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(postData);
req.end();
