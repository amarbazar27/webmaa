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

const OPCODES = {
  0x12: 'const/4',
  0x13: 'const/16',
  0x14: 'const',
  0x1A: 'const-string',
  0x1B: 'const-string/jumbo',
  0x52: 'iget',
  0x53: 'iget-wide',
  0x54: 'iget-object',
  0x55: 'iget-boolean',
  0x56: 'iget-byte',
  0x57: 'iget-char',
  0x58: 'iget-short',
  0x59: 'iput',
  0x5A: 'iput-wide',
  0x5B: 'iput-object',
  0x5C: 'iput-boolean',
  0x5D: 'iput-byte',
  0x5E: 'iput-char',
  0x5F: 'iput-short',
  0x60: 'sget',
  0x61: 'sget-wide',
  0x62: 'sget-object',
  0x63: 'sget-boolean',
  0x67: 'sput',
  0x68: 'sput-wide',
  0x69: 'sput-object',
  0x6A: 'sput-boolean',
  0x6E: 'invoke-virtual',
  0x6F: 'invoke-super',
  0x70: 'invoke-direct',
  0x71: 'invoke-static',
  0x72: 'invoke-interface',
  0x74: 'invoke-virtual/range',
  0x75: 'invoke-super/range',
  0x76: 'invoke-direct/range',
  0x77: 'invoke-static/range',
  0x78: 'invoke-interface/range',
  0x22: 'new-instance',
  0x07: 'move-object',
  0x0c: 'move-result-object',
};

function decompileMethod(codeOff, methodName) {
  console.log(`\n=== METHOD: ${methodName} ===`);
  const insnsSize = readInt(codeOff + 12);
  const insnsOff = codeOff + 16;
  
  let i = 0;
  while (i < insnsSize) {
    const offset = insnsOff + i * 2;
    const op = dex[offset];
    let opName = OPCODES[op] || `op_0x${op.toString(16).toUpperCase()}`;
    let info = '';
    let len = 1;
    
    if (op === 0x1A) {
      const reg = dex[offset + 1];
      const stringIdx = readUShort(offset + 2);
      opName = 'const-string';
      info = `v${reg}, "${strings[stringIdx]}"`;
      len = 2;
    } else if (op === 0x1B) {
      const reg = dex[offset + 1];
      const stringIdx = readInt(offset + 2);
      opName = 'const-string/jumbo';
      info = `v${reg}, "${strings[stringIdx]}"`;
      len = 3;
    } else if (op === 0x12) {
      const regs = dex[offset + 1];
      const vA = regs & 0x0F;
      const vB = (regs & 0xF0) >> 4;
      opName = 'const/4';
      info = `v${vA}, #${vB}`;
      len = 1;
    } else if (op === 0x13) {
      const reg = dex[offset + 1];
      const val = dex.readInt16LE(offset + 2);
      opName = 'const/16';
      info = `v${reg}, #${val}`;
      len = 2;
    } else if (op === 0x14) {
      const reg = dex[offset + 1];
      const val = readInt(offset + 2);
      opName = 'const';
      info = `v${reg}, #0x${val.toString(16)}`;
      len = 3;
    } else if (op >= 0x52 && op <= 0x5F) {
      const regs = dex[offset + 1];
      const vA = regs & 0x0F;
      const vB = (regs & 0xF0) >> 4;
      const fieldIdx = readUShort(offset + 2);
      const targetField = fields[fieldIdx];
      opName = op >= 0x59 ? 'iput' : 'iget';
      if (targetField) {
        info = `v${vA}, v${vB}, ${targetField.class} -> ${targetField.name} : ${targetField.type}`;
      } else {
        info = `v${vA}, v${vB}, field#${fieldIdx}`;
      }
      len = 2;
    } else if (op >= 0x60 && op <= 0x66) {
      const reg = dex[offset + 1];
      const fieldIdx = readUShort(offset + 2);
      const targetField = fields[fieldIdx];
      opName = 'sget';
      if (targetField) {
        info = `v${reg}, ${targetField.class} -> ${targetField.name} : ${targetField.type}`;
      } else {
        info = `v${reg}, field#${fieldIdx}`;
      }
      len = 2;
    } else if (op >= 0x67 && op <= 0x6D) {
      const reg = dex[offset + 1];
      const fieldIdx = readUShort(offset + 2);
      const targetField = fields[fieldIdx];
      opName = 'sput';
      if (targetField) {
        info = `v${reg}, ${targetField.class} -> ${targetField.name} : ${targetField.type}`;
      } else {
        info = `v${reg}, field#${fieldIdx}`;
      }
      len = 2;
    } else if ((op >= 0x6E && op <= 0x72) || (op >= 0x74 && op <= 0x78)) {
      const methodIdx = readUShort(offset + 2);
      const target = methods[methodIdx];
      opName = op >= 0x74 ? 'invoke/range' : 'invoke';
      if (target) {
        info = `${target.class} -> ${target.name}`;
      } else {
        info = `method#${methodIdx}`;
      }
      len = 3;
    } else if (op === 0x22) {
      const reg = dex[offset + 1];
      const typeIdx = readUShort(offset + 2);
      opName = 'new-instance';
      info = `v${reg}, ${types[typeIdx]}`;
      len = 2;
    } else if (op === 0x07) {
      const vA = dex[offset + 1];
      const vB = readUShort(offset + 2);
      opName = 'move-object';
      info = `v${vA}, v${vB}`;
      len = 2;
    } else if (op === 0x0c) {
      const reg = dex[offset + 1];
      opName = 'move-result-object';
      info = `v${reg}`;
      len = 1;
    }
    
    console.log(`  +${i}: ${opName} ${info}`);
    i += len;
  }
}

decompileMethod(13184, 'MainActivity$4.getParams');
