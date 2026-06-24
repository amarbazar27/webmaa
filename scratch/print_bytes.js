const fs = require('fs');
const dex = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');

const codeOff = 13312;
const insnsOff = codeOff + 16;
const insnsSize = dex.readInt32LE(codeOff + 12);

console.log('Hex bytes of MainActivity$5.getHeaders:');
for (let j = 0; j < insnsSize * 2; j++) {
  const b = dex[insnsOff + j];
  console.log(`  +${j}: 0x${b.toString(16).toUpperCase().padStart(2, '0')}`);
}
