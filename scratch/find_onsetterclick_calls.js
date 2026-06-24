const fs = require('fs');
const content = fs.readFileSync('d:/webmaa/scratch/all_classes_decompile.txt', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('onSetterClick') && !line.includes('Method: onSetterClick') && !line.includes('lambda$onSetterClick')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
