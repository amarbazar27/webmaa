const fs = require('fs');

const buffer = fs.readFileSync('d:/webmaa/scratch/extracted_apk/res/layout/api_dialogue.xml');
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

console.log('Strings in api_dialogue.xml:');
console.log(Array.from(new Set(strings)).filter(s => !s.startsWith('http') && s.length > 2));
