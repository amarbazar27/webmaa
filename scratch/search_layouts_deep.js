const fs = require('fs');
const path = require('path');

const layoutsDir = 'd:/webmaa/scratch/extracted_apk/res/layout';
const files = fs.readdirSync(layoutsDir);

files.forEach(file => {
  const filePath = path.join(layoutsDir, file);
  const buffer = fs.readFileSync(filePath);
  const content = buffer.toString('utf8');
  
  if (buffer.indexOf('onSetter') !== -1 || buffer.indexOf('setter') !== -1 || buffer.indexOf('Setter') !== -1) {
    console.log(`Found setter in layout: ${file}`);
  }
});
