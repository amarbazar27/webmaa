const fs = require('fs');

const buffer = fs.readFileSync('d:/webmaa/scratch/extracted_apk/AndroidManifest.xml');
let out = '';
for (let i = 0; i < buffer.length; i++) {
  const b = buffer[i];
  if (b >= 32 && b <= 126) {
    out += String.fromCharCode(b);
  } else if (b === 0) {
    // skip null bytes in UTF-16
  } else {
    out += ' ';
  }
}

// split by multiple spaces
const words = out.split(/\s+/).filter(w => w.length > 2);
console.log('Words in AndroidManifest.xml:');
console.log(Array.from(new Set(words)));
