const fs = require('fs');

const content = fs.readFileSync('d:/webmaa/scratch/all_classes_decompile.txt', 'utf8');
const sections = content.split('=========================================');

sections.forEach(sec => {
  const lines = sec.trim().split('\n');
  const className = lines[0].replace('Class: ', '').trim();
  if (className === 'Lcom/tools/pipra_pay/MainActivity$4;' || className === 'Lcom/tools/pipra_pay/MainActivity$5;') {
    console.log(`=== ${className} ===`);
    let printing = false;
    lines.forEach(line => {
      if (line.startsWith('Method: <init>')) {
        printing = true;
        console.log(line);
      } else if (line.startsWith('Method:')) {
        printing = false;
      }
      if (printing && !line.startsWith('Method:')) {
        console.log('  ' + line.trim());
      }
    });
  }
});
