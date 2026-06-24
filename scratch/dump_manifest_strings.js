const fs = require('fs');

const buffer = fs.readFileSync('d:/webmaa/scratch/extracted_apk/AndroidManifest.xml');
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

console.log('Manifest strings:');
console.log(Array.from(new Set(strings)));
