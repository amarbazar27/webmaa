const fs = require('fs');
const path = require('path');

const baseDir = 'd:/webmaa/scratch/extracted_apk';
const dexFiles = ['classes.dex', 'classes2.dex', 'classes3.dex'];

dexFiles.forEach(file => {
  const filePath = path.join(baseDir, file);
  if (!fs.existsSync(filePath)) return;
  const buffer = fs.readFileSync(filePath);
  const offset = buffer.indexOf('api_dialogue');
  console.log(`${file}: offset of api_dialogue = ${offset}`);
});
