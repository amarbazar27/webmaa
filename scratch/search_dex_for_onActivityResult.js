const fs = require('fs');
const path = require('path');

const baseDir = 'd:/webmaa/scratch/extracted_apk';
const dexFiles = ['classes.dex', 'classes2.dex', 'classes3.dex'];

dexFiles.forEach(file => {
  const filePath = path.join(baseDir, file);
  if (!fs.existsSync(filePath)) return;
  const buffer = fs.readFileSync(filePath);
  
  // Search for the literal bytes of "onActivityResult"
  const target = Buffer.from('onActivityResult');
  let idx = 0;
  let count = 0;
  while ((idx = buffer.indexOf(target, idx)) !== -1) {
    count++;
    idx += target.length;
  }
  console.log(`${file}: found ${count} occurrences of 'onActivityResult'`);
});
