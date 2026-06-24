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

function decompileSendFull(codeOff) {
  console.log(`\n=== METHOD: MainActivity.send ===`);
  const insnsSize = readInt(codeOff + 12);
  const insnsOff = codeOff + 16;
  
  let i = 0;
  while (i < insnsSize) {
    const offset = insnsOff + i * 2;
    const op = dex[offset];
    let len = 1;
    
    // Dump instruction bytes and description
    let bytesHex = [];
    // We determine the instruction length first
    if (op === 0x1A || op === 0x22 || op === 0x5C || (op >= 0x52 && op <= 0x58) || (op >= 0x59 && op <= 0x5F) || (op >= 0x60 && op <= 0x6D)) {
      len = 2;
    } else if (op === 0x1B || op === 0x14 || (op >= 0x6E && op <= 0x72) || (op >= 0x74 && op <= 0x78)) {
      len = 3;
    }
    
    for (let k = 0; k < len * 2; k++) {
      bytesHex.push(dex[offset + k].toString(16).padStart(2, '0'));
    }
    
    let desc = '';
    if ((op >= 0x6E && op <= 0x72) || (op >= 0x74 && op <= 0x78)) {
      const methodIdx = readUShort(offset + 2);
      const target = methods[methodIdx];
      desc = `invoke method#${methodIdx} (${target ? target.class + ' -> ' + target.name : 'unknown'})`;
    } else if (op === 0x1A || op === 0x1B) {
      const stringIdx = op === 0x1A ? readUShort(offset + 2) : readInt(offset + 2);
      desc = `const-string "${strings[stringIdx]}"`;
    } else if (op >= 0x52 && op <= 0x5F) {
      const fieldIdx = readUShort(offset + 2);
      const f = fields[fieldIdx];
      desc = `field access #${fieldIdx} (${f ? f.class + ' -> ' + f.name : 'unknown'})`;
    } else if (op >= 0x60 && op <= 0x6D) {
      const fieldIdx = readUShort(offset + 2);
      const f = fields[fieldIdx];
      desc = `static field access #${fieldIdx} (${f ? f.class + ' -> ' + f.name : 'unknown'})`;
    } else if (op === 0x22) {
      const typeIdx = readUShort(offset + 2);
      desc = `new-instance type#${typeIdx} (${types[typeIdx]})`;
    } else {
      desc = `opcode 0x${op.toString(16).toUpperCase()}`;
    }
    
    console.log(`  +${i}: [${bytesHex.join(' ')}] ${desc}`);
    i += len;
  }
}

decompileSendFull(17164);
