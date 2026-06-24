const fs = require('fs');

const buffer = fs.readFileSync('d:/webmaa/scratch/extracted_apk/resources.arsc');
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

console.log('Total extracted strings in resources.arsc:', strings.length);

const keywords = ['webhook', 'password', 'token', 'error', 'scan', 'api', 'otp', 'pair', 'connect'];
const matches = strings.filter(s => {
  const lower = s.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
});

console.log('Unique matches in resources.arsc:', Array.from(new Set(matches)).slice(0, 100));
fs.writeFileSync('d:/webmaa/scratch/arsc_strings.txt', Array.from(new Set(strings)).join('\n'));
console.log('Dumped all unique strings to arsc_strings.txt');
