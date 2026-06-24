const fs = require('fs');

const content = fs.readFileSync('d:/webmaa/scratch/all_classes_decompile.txt', 'utf8');
const lines = content.split('\n');

console.log('--- mediaPlayer / sound references ---');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('mediaplayer') || line.toLowerCase().includes('sound') || line.toLowerCase().includes('raw')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
