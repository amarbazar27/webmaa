const fs = require('fs');

const content = fs.readFileSync('d:/webmaa/scratch/all_classes_decompile.txt', 'utf8');
const lines = content.split('\n');

console.log('--- showToast calls ---');
lines.forEach((line, idx) => {
  if (line.includes('showToast') && !line.includes('Method: showToast')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
