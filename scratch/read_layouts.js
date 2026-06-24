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
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`=== ${file} ===`);
  
  // Extract all android:id attributes
  const ids = [];
  const regex = /android:id="([^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    ids.push(match[1]);
  }
  console.log('IDs:', ids);
  
  // Extract all text content
  const texts = [];
  const textRegex = /android:text="([^"]+)"/g;
  while ((match = textRegex.exec(content)) !== null) {
    texts.push(match[1]);
  }
  console.log('Texts:', texts);
});
