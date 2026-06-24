const fs = require('fs');
const content = fs.readFileSync('d:/webmaa/scratch/arsc_strings.txt', 'utf8');
const lines = content.split('\n');

const keywords = ['one', 'time', 'otp', 'pass', 'api', 'webhook', 'url', 'key', 'token', 'network', 'error'];
const matches = lines.filter(line => {
  const lower = line.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
});

console.log('Matches:');
console.log(matches.slice(0, 100));
