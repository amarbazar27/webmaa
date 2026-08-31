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

const token = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;

const options = {
  hostname: 'api.github.com',
  path: '/repos/amarbazar27/webmaa/releases?per_page=5',
  method: 'GET',
  headers: {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'BDRetailers-Builder'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const releases = JSON.parse(data);
      console.log('Releases count:', releases.length);
      for (const r of releases) {
        console.log(`\nTag: ${r.tag_name} | Name: ${r.name} | Created: ${r.created_at}`);
        for (const asset of r.assets) {
          console.log(`  - ${asset.name}: ${asset.browser_download_url}`);
        }
      }
    } catch(e) {
      console.error(data);
    }
  });
}).on('error', console.error);
