const fs = require('fs');
const files = [
  'C:/Users/missi/.gemini/antigravity/brain/c0f5d2fd-92ea-43a3-98df-ce65d82813be/scratch/piprapay-server/pp-include/pp-controller.php',
  'C:/Users/missi/.gemini/antigravity/brain/c0f5d2fd-92ea-43a3-98df-ce65d82813be/scratch/piprapay-server/pp-include/pp-model.php',
  'C:/Users/missi/.gemini/antigravity/brain/c0f5d2fd-92ea-43a3-98df-ce65d82813be/scratch/piprapay-server/pp-include/pp-view.php',
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('payment_gateway_include')) {
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
});
