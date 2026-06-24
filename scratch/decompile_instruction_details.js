const fs = require('fs');
const dex = fs.readFileSync('d:/webmaa/scratch/extracted_apk/classes3.dex');

const readInt = (offset) => dex.readInt32LE(offset);
const readUShort = (offset) => dex.readUInt16LE(offset);

function printMethodRaw(codeOff, name) {
  console.log(`\n=== METHOD: ${name} ===`);
  const insnsSize = readInt(codeOff + 12);
  const insnsOff = codeOff + 16;
  
  for (let i = 0; i < insnsSize; ) {
    const offset = insnsOff + i * 2;
    const op = dex[offset];
    
    let len = 1;
    if (op === 0x1A || op === 0x22 || op === 0x5C || (op >= 0x52 && op <= 0x58) || (op >= 0x59 && op <= 0x5F) || (op >= 0x60 && op <= 0x6D)) {
      len = 2;
    } else if (op === 0x1B || op === 0x14 || (op >= 0x6E && op <= 0x72)) {
      len = 3;
    }
    
    const bytes = [];
    for (let k = 0; k < len * 2; k++) {
      bytes.push(dex[offset + k].toString(16).padStart(2, '0'));
    }
    console.log(`  +${i}: ${bytes.join(' ')} (op: 0x${op.toString(16).toUpperCase()})`);
    i += len;
  }
}

printMethodRaw(14388, 'checkIfActive');
printMethodRaw(17164, 'send');
