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

console.log('Total extracted strings in classes.dex:', strings.length);

const keywords = ['scan', 'barcode', 'qrcode', 'camera', 'zxing'];
const matches = [];

strings.forEach((str, idx) => {
  const lower = str.toLowerCase();
  if (keywords.some(kw => lower.includes(kw))) {
    // get context
    const context = strings.slice(Math.max(0, idx - 3), Math.min(strings.length, idx + 4));
    matches.push({ match: str, context });
  }
});

console.log('Total matches found:', matches.length);
matches.slice(0, 50).forEach((m, idx) => {
  console.log(`${idx + 1}: Match: "${m.match}"`);
  console.log(`   Context: ${m.context.join(' | ')}`);
});
