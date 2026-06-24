const fs = require('fs');

const content = fs.readFileSync('d:/webmaa/scratch/all_classes_decompile.txt', 'utf8');
const lines = content.split('\n');

console.log('--- webhook_url_show references ---');
lines.forEach((line, idx) => {
  if (line.includes('webhook_url_show')) {
    console.log(`${idx + 1}: ${line.trim()}`);
    // print surrounding lines
    for (let k = Math.max(0, idx - 2); k <= Math.min(lines.length - 1, idx + 2); k++) {
      if (k !== idx) console.log(`   ${k + 1}: ${lines[k].trim()}`);
    }
    console.log('---');
  }
});

console.log('\n--- apiToken references ---');
lines.forEach((line, idx) => {
  if (line.includes('apiToken')) {
    console.log(`${idx + 1}: ${line.trim()}`);
    // print surrounding lines
    for (let k = Math.max(0, idx - 2); k <= Math.min(lines.length - 1, idx + 2); k++) {
      if (k !== idx) console.log(`   ${k + 1}: ${lines[k].trim()}`);
    }
    console.log('---');
  }
});
