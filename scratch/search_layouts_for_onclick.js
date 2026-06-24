const fs = require('fs');
const path = require('path');

const layoutsDir = 'd:/webmaa/scratch/extracted_apk/res/layout';
const files = fs.readdirSync(layoutsDir);

files.forEach(file => {
  const filePath = path.join(layoutsDir, file);
  const buffer = fs.readFileSync(filePath);
  if (buffer.indexOf('onSetterClick') !== -1) {
    console.log(`Found in layout: ${file}`);
  }
});
