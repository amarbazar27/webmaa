const fs = require('fs');
const dex = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');

const readInt = (offset) => dex.readInt32LE(offset);
const readUShort = (offset) => dex.readUInt16LE(offset);

const stringIdsSize = readInt(0x38);
const stringIdsOff = readInt(0x3C);
const typeIdsSize = readInt(0x40);
const typeIdsOff = readInt(0x44);
const protoIdsSize = readInt(0x48);
const protoIdsOff = readInt(0x4C);
const methodIdsSizeReal = readInt(0x58);
const methodIdsOff = readInt(0x5C);

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

const protos = [];
for (let i = 0; i < protoIdsSize; i++) {
  const shortyIdx = readInt(protoIdsOff + i * 12);
  const returnTypeIdx = readInt(protoIdsOff + i * 12 + 4);
  const parametersOff = readInt(protoIdsOff + i * 12 + 8);
  
  let paramTypes = [];
  if (parametersOff !== 0) {
    const size = readInt(parametersOff);
    for (let k = 0; k < size; k++) {
      const typeIdx = readUShort(parametersOff + 4 + k * 2);
      paramTypes.push(types[typeIdx]);
    }
  }
  protos.push({
    shorty: strings[shortyIdx],
    returnType: types[returnTypeIdx],
    params: paramTypes
  });
}

const methods = [];
for (let i = 0; i < methodIdsSizeReal; i++) {
  const classIdx = readUShort(methodIdsOff + i * 8);
  const protoIdx = readUShort(methodIdsOff + i * 8 + 2);
  const nameIdx = readInt(methodIdsOff + i * 8 + 4);
  methods.push({
    class: types[classIdx],
    proto: protos[protoIdx],
    name: strings[nameIdx]
  });
}

methods.forEach((m, idx) => {
  if (m.class.includes('MainActivity') && m.name === 'send') {
    console.log(`Method #${idx}: ${m.class} -> ${m.name}`);
    console.log(`  Return type: ${m.proto.returnType}`);
    console.log(`  Parameters: ${m.proto.params.join(', ')}`);
  }
});
