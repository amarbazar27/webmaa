const fs = require('fs');
const path = require('path');

const baseDir = 'd:/webmaa/scratch/extracted_apk';
const dexFiles = ['classes.dex', 'classes2.dex', 'classes3.dex'];

dexFiles.forEach(file => {
  const filePath = path.join(baseDir, file);
  if (!fs.existsSync(filePath)) return;
  const dex = fs.readFileSync(filePath);
  
  const readInt = (offset) => dex.readInt32LE(offset);
  const readUShort = (offset) => dex.readUInt16LE(offset);
  
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
  
  const piprapayTypes = types.filter(t => t && t.startsWith('Lcom/tools/pipra_pay/'));
  console.log(`${file}: found ${piprapayTypes.length} types.`);
  if (piprapayTypes.length > 0) {
    console.log(piprapayTypes.slice(0, 50));
  }
});
