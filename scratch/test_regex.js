const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.js');
let code = fs.readFileSync(filePath, 'utf8');
let normalized = code.replace(/\r\n/g, '\n');

const pos = normalized.indexOf('</section>', 55000);
const start = pos - 120;
const end = pos + 20;
const sub = normalized.slice(start, end);

console.log("Substring:", JSON.stringify(sub));
for (let i = 0; i < sub.length; i++) {
  console.log(`${i}: ${JSON.stringify(sub[i])} (charcode: ${sub.charCodeAt(i)})`);
}
