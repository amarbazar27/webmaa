const fs = require('fs');

const content = fs.readFileSync('d:/webmaa/scratch/all_classes_decompile.txt', 'utf8');
const lines = content.split('\n');

for (let i = 810; i <= 840; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
