const fs = require('fs');
const content = fs.readFileSync('d:/webmaa/scratch/dex3_disassembly_utf8.txt', 'utf8');
const lines = content.split('\n');
const matches = lines.filter(l => l.toLowerCase().includes('result') || l.toLowerCase().includes('launcher') || l.toLowerCase().includes('activity'));
console.log(matches.slice(0, 50));
