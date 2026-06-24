const fs = require('fs');

const dex = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');

const readInt = (offset) => dex.readInt32LE(offset);
const readUInt = (offset) => dex.readUInt32LE(offset);
const readUShort = (offset) => dex.readUInt16LE(offset);

// Parse Header
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

// Parse Strings
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

// Parse Types
const types = [];
for (let i = 0; i < typeIdsSize; i++) {
  const descriptorIdx = readInt(typeIdsOff + i * 4);
  types.push(strings[descriptorIdx]);
}

// Parse Fields
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

// Parse Methods
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

// Helper to read ULEB128
function readUleb128(buffer, startOffset) {
  let result = 0;
  let offset = startOffset;
  let shift = 0;
  while (true) {
    const b = buffer[offset++];
    result |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  return { value: result, bytesRead: offset - startOffset };
}

let out = '';
const log = (msg) => {
  out += msg + '\n';
};

// Parse class_defs
for (let i = 0; i < classDefsSize; i++) {
  const classDefsOffIdx = classDefsOff + i * 32;
  const classIdx = readInt(classDefsOffIdx);
  const className = types[classIdx];
  
  if (className === 'Lcom/tools/pipra_pay/MainActivity;') {
    log(`Found Class: ${className}`);
    const classDataOff = readInt(classDefsOffIdx + 24);
    if (classDataOff === 0) {
      log('No class data');
      continue;
    }
    
    // Read class_data_item
    let offset = classDataOff;
    const staticFieldsSizeInfo = readUleb128(dex, offset);
    offset += staticFieldsSizeInfo.bytesRead;
    const instanceFieldsSizeInfo = readUleb128(dex, offset);
    offset += instanceFieldsSizeInfo.bytesRead;
    const directMethodsSizeInfo = readUleb128(dex, offset);
    offset += directMethodsSizeInfo.bytesRead;
    const virtualMethodsSizeInfo = readUleb128(dex, offset);
    offset += virtualMethodsSizeInfo.bytesRead;
    
    log(`staticFields: ${staticFieldsSizeInfo.value}, instanceFields: ${instanceFieldsSizeInfo.value}, directMethods: ${directMethodsSizeInfo.value}, virtualMethods: ${virtualMethodsSizeInfo.value}`);
    
    // Skip static fields
    for (let f = 0; f < staticFieldsSizeInfo.value; f++) {
      offset += readUleb128(dex, offset).bytesRead; // field_idx_diff
      offset += readUleb128(dex, offset).bytesRead; // access_flags
    }
    // Skip instance fields
    for (let f = 0; f < instanceFieldsSizeInfo.value; f++) {
      offset += readUleb128(dex, offset).bytesRead; // field_idx_diff
      offset += readUleb128(dex, offset).bytesRead; // access_flags
    }
    
    // Read direct methods
    let methodIdx = 0;
    const readMethodsList = [];
    for (let m = 0; m < directMethodsSizeInfo.value; m++) {
      const idxDiff = readUleb128(dex, offset);
      offset += idxDiff.bytesRead;
      methodIdx += idxDiff.value;
      
      const flags = readUleb128(dex, offset);
      offset += flags.bytesRead;
      
      const codeOff = readUleb128(dex, offset);
      offset += codeOff.bytesRead;
      
      readMethodsList.push({ idx: methodIdx, codeOff: codeOff.value, type: 'direct' });
    }
    
    // Read virtual methods
    methodIdx = 0;
    for (let m = 0; m < virtualMethodsSizeInfo.value; m++) {
      const idxDiff = readUleb128(dex, offset);
      offset += idxDiff.bytesRead;
      methodIdx += idxDiff.value;
      
      const flags = readUleb128(dex, offset);
      offset += flags.bytesRead;
      
      const codeOff = readUleb128(dex, offset);
      offset += codeOff.bytesRead;
      
      readMethodsList.push({ idx: methodIdx, codeOff: codeOff.value, type: 'virtual' });
    }
    
    // Parse code items for each method
    readMethodsList.forEach(m => {
      const methodInfo = methods[m.idx];
      log(`\nMethod: ${methodInfo.name} (codeOff: ${m.codeOff})`);
      if (m.codeOff === 0) return;
      
      const registersSize = readUShort(m.codeOff);
      const insSize = readUShort(m.codeOff + 2);
      const outsSize = readUShort(m.codeOff + 4);
      const triesSize = readUShort(m.codeOff + 6);
      const debugInfoOff = readInt(m.codeOff + 8);
      const insnsSize = readInt(m.codeOff + 12);
      
      log(`  registers: ${registersSize}, insnsSize: ${insnsSize}`);
      
      const insnsOff = m.codeOff + 16;
      for (let j = 0; j < insnsSize; j++) {
        const insnOffset = insnsOff + j * 2;
        const op = dex[insnOffset];
        
        if (op === 0x1A) {
          const stringIdx = readUShort(insnOffset + 2);
          log(`    [const-string] "${strings[stringIdx]}"`);
        }
        if (op === 0x1B) {
          const stringIdx = readInt(insnOffset + 2);
          log(`    [const-string/jumbo] "${strings[stringIdx]}"`);
        }
        if (op >= 0x6E && op <= 0x72) {
          const methodIdx = readUShort(insnOffset + 2);
          const target = methods[methodIdx];
          if (target) {
            log(`    [invoke] ${target.class} -> ${target.name}`);
          }
        }
        if (op >= 0x52 && op <= 0x58) {
          const fieldIdx = readUShort(insnOffset + 2);
          const targetField = fields[fieldIdx];
          if (targetField) {
            log(`    [iget] ${targetField.class} -> ${targetField.name} : ${targetField.type}`);
          }
        }
        if (op >= 0x59 && op <= 0x5F) {
          const fieldIdx = readUShort(insnOffset + 2);
          const targetField = fields[fieldIdx];
          if (targetField) {
            log(`    [iput] ${targetField.class} -> ${targetField.name} : ${targetField.type}`);
          }
        }
      }
    });
  }
}

fs.writeFileSync('d:/webmaa/scratch/mainactivity_decompile.txt', out, 'utf8');
console.log('Saved to mainactivity_decompile.txt');
