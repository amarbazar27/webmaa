const fs = require('fs');
const path = require('path');

const baseDir = 'd:/webmaa/scratch/extracted_apk';
const dexFiles = ['classes.dex', 'classes2.dex', 'classes3.dex'];

dexFiles.forEach(file => {
  const filePath = path.join(baseDir, file);
  if (!fs.existsSync(filePath)) return;
  const buffer = fs.readFileSync(filePath);
  
  const keywords = ['zxing', 'SCAN', 'scan', 'barcode', 'qr'];
  keywords.forEach(kw => {
    const idx = buffer.indexOf(kw);
    if (idx !== -1) {
      console.log(`${file}: found raw byte match for "${kw}" at offset ${idx}`);
    }
  });
});
