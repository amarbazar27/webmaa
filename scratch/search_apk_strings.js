const fs = require('fs');
const path = require('path');

const apkPath = 'C:/Users/missi/.gemini/antigravity/brain/c0f5d2fd-92ea-43a3-98df-ce65d82813be/scratch/piprapay-server/docs/apps/piprapay-tool.apk';
if (!fs.existsSync(apkPath)) {
  console.error('APK file not found!');
  process.exit(1);
}

const buffer = fs.readFileSync(apkPath);
console.log('APK size:', buffer.length, 'bytes');

// Simple ASCII/UTF-8/UTF-16 string extractor
function findStrings(buf) {
  const strings = [];
  let currentStr = '';
  
  for (let i = 0; i < buf.length; i++) {
    const charCode = buf[i];
    // printable ASCII characters
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

const allStrings = findStrings(buffer);
console.log('Total extracted strings:', allStrings.length);

// Let's filter strings containing keywords
const keywords = ['webhook', 'password', 'url', 'qr', 'pair', 'otp', 'json', 'connect', 'qubeplug'];
const matches = allStrings.filter(str => {
  const lower = str.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
});

console.log('Matching strings found:', matches.length);
// Print matching strings
matches.slice(0, 250).forEach((str, idx) => {
  console.log(`${idx + 1}: ${str}`);
});
