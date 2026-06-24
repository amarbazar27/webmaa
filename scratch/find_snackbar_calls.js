const fs = require('fs');

const content = fs.readFileSync('d:/webmaa/scratch/all_classes_decompile.txt', 'utf8');
const lines = content.split('\n');

console.log('--- showGlobalSnackbar calls ---');
lines.forEach((line, idx) => {
  if (line.includes('showGlobalSnackbar')) {
    console.log(`${idx + 1}: ${line.trim()}`);
    // print context
    for (let k = Math.max(0, idx - 2); k <= Math.min(lines.length - 1, idx + 2); k++) {
      if (k !== idx) console.log(`   ${k + 1}: ${lines[k].trim()}`);
    }
    console.log('---');
  }
});
