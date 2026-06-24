const fs = require('fs');
const dex = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');

const readInt = (offset) => dex.readInt32LE(offset);
const readUShort = (offset) => dex.readUInt16LE(offset);

const classDefsSize = readInt(0x60);
const classDefsOff = readInt(0x64);
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

// Find class def for MainActivity
let mainActivityDefOff = 0;
for (let i = 0; i < classDefsSize; i++) {
  const classDefsOffIdx = classDefsOff + i * 32;
  const classIdx = readInt(classDefsOffIdx);
  if (types[classIdx] === 'Lcom/tools/pipra_pay/MainActivity;') {
    mainActivityDefOff = classDefsOffIdx;
    break;
  }
}

// Read class_data_item
const classDataOff = readInt(mainActivityDefOff + 24);
let offset = classDataOff;
function readUleb128() {
  let result = 0;
  let shift = 0;
  while (true) {
    const b = dex[offset++];
    result |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  return result;
}

const staticFieldsSize = readUleb128();
const instanceFieldsSize = readUleb128();
const directMethodsSize = readUleb128();
const virtualMethodsSize = readUleb128();

// Skip fields
for (let i = 0; i < staticFieldsSize; i++) {
  readUleb128(); readUleb128();
}
for (let i = 0; i < instanceFieldsSize; i++) {
  readUleb128(); readUleb128();
}

const methodIdsOff = readInt(0x5C);
const methodIdsSizeReal = readInt(0x58);

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

// Read direct methods
let methodIdx = 0;
for (let i = 0; i < directMethodsSize; i++) {
  methodIdx += readUleb128();
  const accessFlags = readUleb128();
  const codeOff = readUleb128();
  console.log(`Direct Method: ${methods[methodIdx].name}, accessFlags: 0x${accessFlags.toString(16)}, codeOff: ${codeOff}`);
}

// Read virtual methods
methodIdx = 0; // RESET FOR VIRTUAL METHODS!
for (let i = 0; i < virtualMethodsSize; i++) {
  methodIdx += readUleb128();
  const accessFlags = readUleb128();
  const codeOff = readUleb128();
  console.log(`Virtual Method: ${methods[methodIdx].name}, accessFlags: 0x${accessFlags.toString(16)}, codeOff: ${codeOff}`);
}
