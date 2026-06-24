const fs = require('fs');

const dex = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');

const readInt = (offset) => dex.readInt32LE(offset);
const readUInt = (offset) => dex.readUInt32LE(offset);
const readUShort = (offset) => dex.readUInt16LE(offset);

const stringIdsSize = readInt(0x38);
const stringIdsOff = readInt(0x3C);
const typeIdsSize = readInt(0x40);
const typeIdsOff = readInt(0x44);
const protoIdsSize = readInt(0x48);
const protoIdsOff = readInt(0x4C);
const fieldIdsSize = readInt(0x50);
const fieldIdsOff = readInt(0x54);
const methodIdsSizeReal = readInt(0x58);
const methodIdsOff = readInt(0x5C);
const classDefsSize = readInt(0x60);
const classDefsOff = readInt(0x64);

// Parse strings
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

// Parse types
const types = [];
for (let i = 0; i < typeIdsSize; i++) {
  const descriptorIdx = readInt(typeIdsOff + i * 4);
  types.push(strings[descriptorIdx]);
}

// Parse method_ids
const methods = [];
for (let i = 0; i < methodIdsSizeReal; i++) {
  const classIdx = readUShort(methodIdsOff + i * 8);
  const protoIdx = readUShort(methodIdsOff + i * 8 + 2);
  const nameIdx = readInt(methodIdsOff + i * 8 + 4);
  methods.push({
    class: types[classIdx],
    name: strings[nameIdx]
  });
}

let out = '';
out += `stringIdsSize: ${stringIdsSize} off: ${stringIdsOff}\n`;
out += `typeIdsSize: ${typeIdsSize} off: ${typeIdsOff}\n`;
out += `methodIdsSize: ${methodIdsSizeReal} off: ${methodIdsOff}\n`;
out += `classDefsSize: ${classDefsSize} off: ${classDefsOff}\n`;

out += '\n--- ALL METHODS ---\n';
methods.forEach((m, idx) => {
  out += `${idx}: ${m.class} -> ${m.name}\n`;
});

out += '\n--- ALL STRINGS ---\n';
strings.forEach((s, idx) => {
  if (s.length > 2) {
    out += `${idx}: ${s}\n`;
  }
});

fs.writeFileSync('d:/webmaa/scratch/dex3_disassembly_utf8.txt', out, 'utf8');
console.log('Saved to dex3_disassembly_utf8.txt');
