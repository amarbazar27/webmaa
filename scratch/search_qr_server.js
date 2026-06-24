const fs = require('fs');
const path = require('path');

const serverDir = 'C:/Users/missi/.gemini/antigravity/brain/c0f5d2fd-92ea-43a3-98df-ce65d82813be/scratch/piprapay-server';

function searchInDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== '.git' && file !== 'node_modules') {
        searchInDir(filePath);
      }
    } else if (file.endsWith('.php') || file.endsWith('.js') || file.endsWith('.html')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.toLowerCase().includes('qr') || content.toLowerCase().includes('canvas') || content.toLowerCase().includes('chart') || content.toLowerCase().includes('connect android')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes('qr') || line.toLowerCase().includes('chart') || line.toLowerCase().includes('connect android')) {
            console.log(`${filePath}:${idx+1}: ${line.trim().slice(0, 100)}`);
          }
        });
      }
    }
  });
}

searchInDir(serverDir);
