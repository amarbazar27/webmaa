const fs = require('fs');
const pdf = require('pdf-parse');

async function readPdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    try {
        const data = await pdf(dataBuffer);
        console.log(`\n\n--- CONTENTS OF ${filePath} ---`);
        console.log(data.text);
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e);
    }
}

async function main() {
    await readPdf('../WEBMAA_GUIDE.PDF');
    await readPdf('../zatiq copy.pdf');
}

main();
