const fs = require('fs');

const buffer = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes.dex');
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

const keywords = ['barcode', 'scanner', 'zxing', 'qrcode', 'vision', 'mlkit', 'scan', 'camera'];
const uniqueMatches = Array.from(new Set(strings.filter(s => {
  const lower = s.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
})));

console.log('Total matches:', uniqueMatches.length);
// print first 200 matches
uniqueMatches.slice(0, 200).forEach(m => {
  if (m.length < 100) console.log(m);
});
