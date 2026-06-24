const fs = require('fs');

const content = fs.readFileSync('d:/webmaa/scratch/all_classes_decompile.txt', 'utf8');
const sections = content.split('=========================================');

sections.forEach(sec => {
  const lines = sec.trim().split('\n');
  const className = lines[0].replace('Class: ', '').trim();
  if (className.startsWith('Lcom/tools/pipra_pay/MainActivity$$ExternalSyntheticLambda')) {
    console.log(`=== ${className} ===`);
    let currentMethod = '';
    lines.forEach(line => {
      if (line.startsWith('Method:')) {
        currentMethod = line;
      }
      if (line.includes('[invoke] Lcom/tools/pipra_pay/MainActivity;')) {
        console.log(`  in ${currentMethod}: ${line.trim()}`);
      }
    });
  }
});
