const fs = require('fs');
const path = require('path');

const buffer = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');
const strings = [];
let currentStr = '';

for (let i = 0; i < buffer.length; i++) {
  const charCode = buffer[i];
  if (charCode >= 32 && charCode <= 126) {
    currentStr += String.fromCharCode(charCode);
  } else {
    if (currentStr.length >= 3) {
      strings.push(currentStr);
    }
    currentStr = '';
  }
}

console.log('Total strings:', strings.length);
fs.writeFileSync('d:/webmaa/scratch/dex3_strings.txt', strings.join('\n'));
console.log('Saved to dex3_strings.txt');
