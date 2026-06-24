const fs = require('fs');

const dex = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');

const readInt = (offset) => dex.readInt32LE(offset);
const typeIdsSize = readInt(0x40);
const typeIdsOff = readInt(0x44);
const stringIdsSize = readInt(0x38);
const stringIdsOff = readInt(0x3C);

const strings = [];
for (let i = 0; i < stringIdsSize; i++) {
  const stringOff = readInt(stringIdsOff + i * 4);
  let offset = stringOff;
  let len = 0;
  let shift = 0;
  while (true) {
    const b = dex[offset++];
    len |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  let str = '';
  for (let j = 0; j < len; j++) {
    str += String.fromCharCode(dex[offset + j]);
  }
  strings.push(str);
}

const types = [];
for (let i = 0; i < typeIdsSize; i++) {
  const descriptorIdx = readInt(typeIdsOff + i * 4);
  types.push(strings[descriptorIdx]);
}

const packages = new Set();
types.forEach(t => {
  if (t.startsWith('L')) {
    const parts = t.slice(1).split('/');
    if (parts.length > 1) {
      packages.add(parts.slice(0, parts.length - 1).join('/'));
    }
  }
});

console.log('Packages in classes3.dex:');
console.log(Array.from(packages));
