const fs = require('fs');
const path = require('path');

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

const keywords = ['zxing', 'journeyapps', 'barcodescanner', 'barcode', 'qrcode', 'mlkit', 'google/mlkit'];
const matches = strings.filter(s => {
  const lower = s.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
});

console.log('Unique matches in classes.dex:', Array.from(new Set(matches)).slice(0, 100));
