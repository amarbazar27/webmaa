const fs = require('fs');
const dex = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');

const readInt = (offset) => dex.readInt32LE(offset);
const readUShort = (offset) => dex.readUInt16LE(offset);

const stringIdsSize = readInt(0x38);
const stringIdsOff = readInt(0x3C);
const typeIdsSize = readInt(0x40);
const typeIdsOff = readInt(0x44);
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

const methods = [];
for (let i = 0; i < methodIdsSizeReal; i++) {
  const classIdx = readUShort(methodIdsOff + i * 8);
  const nameIdx = readInt(methodIdsOff + i * 8 + 4);
  methods.push({
    class: types[classIdx],
    name: strings[nameIdx]
  });
}

const OPCODES = {
  0x12: 'const/4',
  0x13: 'const/16',
  0x14: 'const',
  0x1A: 'const-string',
  0x1B: 'const-string/jumbo',
  0x6E: 'invoke-virtual',
  0x6F: 'invoke-super',
  0x70: 'invoke-direct',
  0x71: 'invoke-static',
  0x72: 'invoke-interface',
  0x22: 'new-instance',
  0x07: 'move-object',
  0x0c: 'move-result-object',
  0x54: 'iget-object',
  0x62: 'sget-object'
};

function decompileMethod(codeOff, methodName) {
  console.log(`\n=== METHOD: ${methodName} (offset: ${codeOff}) ===`);
  const insnsSize = readInt(codeOff + 12);
  const insnsOff = codeOff + 16;
  
  let i = 0;
  while (i < insnsSize) {
    const offset = insnsOff + i * 2;
    const op = dex[offset];
    let opName = OPCODES[op] || `op_0x${op.toString(16).toUpperCase()}`;
    let info = '';
    
    if (op === 0x1A) {
      const reg = dex[offset + 1];
      const stringIdx = readUShort(offset + 2);
      info = `v${reg}, "${strings[stringIdx]}"`;
    } else if (op === 0x1B) {
      const reg = dex[offset + 1];
      const stringIdx = readInt(offset + 2);
      info = `v${reg}, "${strings[stringIdx]}"`;
    } else if (op >= 0x6E && op <= 0x72) {
      const methodIdx = readUShort(offset + 2);
      const target = methods[methodIdx];
      if (target) info = `${target.class} -> ${target.name}`;
    }
    
    console.log(`  +${i}: [0x${op.toString(16).toUpperCase()}] ${opName} ${info}`);
    
    let len = 1;
    if (op === 0x1A || op === 0x22 || op === 0x5C || (op >= 0x52 && op <= 0x58) || (op >= 0x59 && op <= 0x5F) || (op >= 0x60 && op <= 0x6D)) {
      len = 2;
    } else if (op === 0x1B || op === 0x14 || (op >= 0x6E && op <= 0x72)) {
      len = 3;
    }
    i += len;
  }
}

decompileMethod(14484, 'lambda$checkIfActive$13');
decompileMethod(14504, 'lambda$checkIfActive$14');
