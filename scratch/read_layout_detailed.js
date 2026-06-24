const fs = require('fs');

function dumpStrings(filePath) {
  console.log(`=== ${filePath} ===`);
  const buffer = fs.readFileSync(filePath);
  const strings = [];
  let currentStr = '';
  
  for (let i = 0; i < buffer.length; i++) {
    const charCode = buffer[i];
    if (charCode >= 32 && charCode <= 126) {
      currentStr += String.fromCharCode(charCode);
    } else {
      if (currentStr.length >= 2) {
        strings.push(currentStr);
      }
      currentStr = '';
    }
  }
  console.log(Array.from(new Set(strings)));
}

dumpStrings('d:/webmaa/scratch/extracted_apk/res/layout/main_layout_settings.xml');
dumpStrings('d:/webmaa/scratch/extracted_apk/res/layout/dialog_config_edit_form.xml');
dumpStrings('d:/webmaa/scratch/extracted_apk/res/layout/api_dialogue.xml');
