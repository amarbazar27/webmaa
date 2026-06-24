const fs = require('fs');

const content = fs.readFileSync('C:/Users/missi/.gemini/antigravity/brain/c0f5d2fd-92ea-43a3-98df-ce65d82813be/scratch/piprapay-server/pp-include/pp-resource/sms-data-devices.php', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('Download') || line.includes('apk') || line.includes('href')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
