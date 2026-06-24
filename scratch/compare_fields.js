const fs = require('fs');
const dex = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');

const readUShort = (offset) => dex.readUInt16LE(offset);

// lambda$onCreate$4 codeOff is 15220
const bytes4 = dex.slice(15220 + 16, 15220 + 16 + 50);
console.log('lambda$onCreate$4 bytes +16 to +20:', bytes4[16].toString(16), bytes4[17].toString(16), bytes4[18].toString(16), bytes4[19].toString(16));
// The field index is at offset 18 (2 bytes)
const fieldIdx4 = bytes4.readUInt16LE(18);

// lambda$onSetterClick$15 codeOff is 15616
const bytes15 = dex.slice(15616 + 16, 15616 + 16 + 50);
console.log('lambda$onSetterClick$15 bytes +16 to +20:', bytes15[16].toString(16), bytes15[17].toString(16), bytes15[18].toString(16), bytes15[19].toString(16));
const fieldIdx15 = bytes15.readUInt16LE(18);

console.log('fieldIdx4:', fieldIdx4, 'fieldIdx15:', fieldIdx15);
