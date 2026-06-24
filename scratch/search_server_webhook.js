const fs = require('fs');
const path = require('path');

const rootDir = 'C:/Users/missi/.gemini/antigravity/brain/c0f5d2fd-92ea-43a3-98df-ce65d82813be/scratch/piprapay-server';

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== '.git' && file !== 'node_modules') {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.php') || file.endsWith('.json') || file.endsWith('.htaccess')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('webhook')) {
        console.log(`Found in: ${fullPath}`);
        // print matching lines
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes('webhook')) {
            console.log(`  ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
}

searchDir(rootDir);
