const fs = require('fs');

const content = fs.readFileSync('d:/webmaa/scratch/all_classes_decompile.txt', 'utf8');
const sections = content.split('=========================================');

sections.forEach(sec => {
  const lines = sec.trim().split('\n');
  const className = lines[0].replace('Class: ', '').trim();
  if (className === 'Lcom/tools/pipra_pay/Functions;') {
    console.log(`=== ${className} ===`);
    let currentMethod = '';
    lines.forEach(line => {
      if (line.startsWith('Method:')) {
        currentMethod = line;
        console.log(`  ${currentMethod}`);
      }
      if (line.includes('[const-string]') || line.includes('[invoke]') || line.includes('[iget]') || line.includes('[iput]')) {
        console.log(`    ${line.trim()}`);
      }
    });
  }
});
