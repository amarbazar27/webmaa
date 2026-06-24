const fs = require('fs');
const path = require('path');

const baseDir = 'd:/webmaa/scratch/extracted_apk';
const dexFiles = ['classes.dex', 'classes2.dex', 'classes3.dex'];

function findStringsInDex(filePath) {
  const buffer = fs.readFileSync(filePath);
  const strings = [];
  let currentStr = '';
  
  for (let i = 0; i < buffer.length; i++) {
    const charCode = buffer[i];
    if (charCode >= 32 && charCode <= 126) {
      currentStr += String.fromCharCode(charCode);
    } else {
      if (currentStr.length >= 4) {
        strings.push(currentStr);
      }
      currentStr = '';
    }
  }
  return strings;
}

const keywords = ['zxing', 'barcode', 'integrator', 'scan', 'camera', 'intent', 'result'];

dexFiles.forEach(file => {
  const filePath = path.join(baseDir, file);
  if (!fs.existsSync(filePath)) return;
  
  const strings = findStringsInDex(filePath);
  const matches = strings.filter(s => {
    const lower = s.toLowerCase();
    return keywords.some(kw => lower.includes(kw));
  });
  
  console.log(`${file}: found ${matches.length} scanner matches.`);
  if (matches.length > 0) {
    // print unique matches to keep clean
    const unique = Array.from(new Set(matches));
    console.log(unique.slice(0, 30));
  }
});
