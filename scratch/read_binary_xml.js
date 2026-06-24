const fs = require('fs');
const path = require('path');

const layoutsDir = 'd:/webmaa/scratch/extracted_apk/res/layout';
const files = ['main_layout_settings.xml', 'dialog_config_edit_form.xml', 'activity_main.xml', 'main_layout_home.xml'];

files.forEach(file => {
  const filePath = path.join(layoutsDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`${file} does not exist`);
    return;
  }
  const buffer = fs.readFileSync(filePath);
  const strings = [];
  let currentStr = '';
  
  for (let i = 0; i < buffer.length; i++) {
    const charCode = buffer[i];
    if (charCode >= 32 && charCode <= 126) {
      currentStr += String.fromCharCode(charCode);
    } else {
      if (currentStr.length >= 3) {
        strings.push(currentStr);
      }
      currentStr = '';
    }
  }
  
  console.log(`=== ${file} ===`);
  console.log(Array.from(new Set(strings)).filter(s => !s.startsWith('http') && s.length > 2));
});
