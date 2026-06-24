const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'docs') {
        searchFiles(fullPath);
      }
    } else if (file.endsWith('.php') || file.endsWith('.js') || file.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('qr') || content.toLowerCase().includes('chart') || content.toLowerCase().includes('google')) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes('qr') || line.toLowerCase().includes('chart') || line.toLowerCase().includes('google')) {
            // Print match
            if (line.includes('chart') || line.includes('qrcode') || line.includes('googleapis') || line.includes('qr_')) {
              console.log(`${fullPath}:${index + 1}: ${line.trim().slice(0, 120)}`);
            }
          }
        });
      }
    }
  }
}

searchFiles('C:/Users/missi/.gemini/antigravity/brain/c0f5d2fd-92ea-43a3-98df-ce65d82813be/scratch/piprapay-server');
