const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('d:/webmaa/scratch/all_classes_decompile.txt', 'utf8');
const sections = content.split('=========================================');

sections.forEach(sec => {
  const lines = sec.trim().split('\n');
  const className = lines[0].replace('Class: ', '').trim();
  if (className === 'Lcom/tools/pipra_pay/SendWorker;' || className === 'Lcom/tools/pipra_pay/Background_Run;' || className === 'Lcom/tools/pipra_pay/SMSMonitor;') {
    let currentMethod = '';
    lines.forEach(line => {
      if (line.startsWith('Method:')) {
        currentMethod = line;
      }
      if (line.includes('send') || line.includes('MainActivity') || line.includes('apiToken') || line.includes('invoke')) {
        console.log(`${className}::${currentMethod}: ${line.trim()}`);
      }
    });
  }
});
