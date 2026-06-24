const fs = require('fs');
const dex = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');

const readInt = (offset) => dex.readInt32LE(offset);
const readUShort = (offset) => dex.readUInt16LE(offset);

const stringIdsSize = readInt(0x38);
const stringIdsOff = readInt(0x3C);
const typeIdsSize = readInt(0x40);
const typeIdsOff = readInt(0x44);
const fieldIdsSize = readInt(0x50);
const fieldIdsOff = readInt(0x54);

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

const fields = [];
for (let i = 0; i < fieldIdsSize; i++) {
  const classIdx = readUShort(fieldIdsOff + i * 8);
  const typeIdx = readUShort(fieldIdsOff + i * 8 + 2);
  const nameIdx = readInt(fieldIdsOff + i * 8 + 4);
  fields.push({
    class: types[classIdx],
    type: types[typeIdx],
    name: strings[nameIdx]
  });
}

console.log('Fields in MainActivity:');
fields.forEach(f => {
  if (f.class.includes('MainActivity')) {
    console.log(`  ${f.name} : ${f.type}`);
  }
});
