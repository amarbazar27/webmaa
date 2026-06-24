const fs = require('fs');
const path = require('path');

const baseDir = 'C:/Users/missi/.gemini/antigravity/brain/c0f5d2fd-92ea-43a3-98df-ce65d82813be/scratch/piprapay-server';

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== '.git' && file !== 'node_modules') {
        searchFiles(fullPath);
      }
    } else if (file.endsWith('.php')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('$_GET[\'download\']') || content.includes('$_GET["download"]') || content.includes('download')) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('download') && (line.includes('GET') || line.includes('file') || line.includes('header'))) {
            console.log(`${fullPath}:${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchFiles(baseDir);
