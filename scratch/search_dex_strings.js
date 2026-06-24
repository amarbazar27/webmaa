const fs = require('fs');
const path = require('path');

const baseDir = 'd:/webmaa/scratch/extracted_apk';
const dexFiles = ['classes.dex', 'classes2.dex', 'classes3.dex'];

function findStringsInDex(filePath) {
  const buffer = fs.readFileSync(filePath);
  const strings = [];
  let currentStr = '';
  
  for (let i = 0; i < buffer.length; i++) {
    const charCode = buffer[i];
    if (charCode >= 32 && charCode <= 126) {
      currentStr += String.fromCharCode(charCode);
    } else {
      if (currentStr.length >= 4) {
        strings.push({ str: currentStr, offset: i - currentStr.length });
      }
      currentStr = '';
    }
  }
  return strings;
}

const keywords = ['webhook', 'otp', 'pair', 'url', 'split', 'json', 'qubeplug', 'scanner', 'scan'];

dexFiles.forEach(file => {
  const filePath = path.join(baseDir, file);
  if (!fs.existsSync(filePath)) return;
  
  console.log(`Searching in ${file}...`);
  const strings = findStringsInDex(filePath);
  console.log(`Extracted ${strings.length} strings from ${file}.`);
  
  const matches = strings.filter(s => {
    const lower = s.str.toLowerCase();
    return keywords.some(kw => lower.includes(kw));
  });
  
  console.log(`Found ${matches.length} matches in ${file}:`);
  matches.slice(0, 100).forEach((m, idx) => {
    // Let's also print 3 strings before and after for context
    const strIndex = strings.indexOf(m);
    const context = [];
    for (let k = Math.max(0, strIndex - 2); k <= Math.min(strings.length - 1, strIndex + 2); k++) {
      context.push(strings[k].str);
    }
    console.log(`${idx + 1}: Match: "${m.str}"`);
    console.log(`   Context: ${context.join('  |  ')}`);
    console.log('---');
  });
});
