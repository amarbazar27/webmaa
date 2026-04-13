const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync(process.argv[2]);
let outPath = process.argv[3];

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync(outPath, data.text, 'utf8');
}).catch(err => {
    console.error(err);
});
