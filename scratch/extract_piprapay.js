const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function main() {
  const pdfPath = path.join(__dirname, '../PipraPay_Claude_Code_Integration_Guide-wgaims_260609_080428.pdf');
  const outputPath = path.join(__dirname, 'piprapay_text.txt');
  
  console.log('Reading PDF from:', pdfPath);
  const dataBuffer = fs.readFileSync(pdfPath);
  try {
    const data = await pdf(dataBuffer);
    fs.writeFileSync(outputPath, data.text, 'utf-8');
    console.log('Successfully saved PDF contents to:', outputPath);
  } catch (error) {
    console.error('Error reading PDF:', error);
  }
}

main();
