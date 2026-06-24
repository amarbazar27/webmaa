const fs = require('fs');

const content = fs.readFileSync('d:/webmaa/scratch/all_classes_decompile.txt', 'utf8');
const sections = content.split('=========================================');

sections.forEach(sec => {
  if (sec.includes('Class: Lcom/tools/pipra_pay/MainActivity;')) {
    const lines = sec.trim().split('\n');
    let printing = false;
    lines.forEach(line => {
      if (line.startsWith('Method: checkIfActive') || line.startsWith('Method: send')) {
        printing = true;
        console.log(`\n=== ${line} ===`);
      } else if (line.startsWith('Method:')) {
        printing = false;
      }
      if (printing && !line.startsWith('Method:')) {
        console.log(line);
      }
    });
  }
});
