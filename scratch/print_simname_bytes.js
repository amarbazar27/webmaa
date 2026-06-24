const fs = require('fs');
const dex = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');

const codeOff = 11680;
const insnsOff = codeOff + 16;
const insnsSize = dex.readInt32LE(codeOff + 12);

console.log('Hex bytes of request_simName:');
for (let j = 0; j < insnsSize * 2; j++) {
  const b = dex[insnsOff + j];
  console.log(`  +${j}: 0x${b.toString(16).toUpperCase().padStart(2, '0')}`);
}
