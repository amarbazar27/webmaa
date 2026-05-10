const fs = require('fs');

// 1. Fix ai-vision/route.js
let vision = fs.readFileSync('src/app/api/ai-vision/route.js', 'utf8');
vision = vision.replace(
  'v1beta/models/gemini-1.5-flash:generateContent',
  'v1/models/gemini-1.5-flash:generateContent'
);
// Fallback if the above didn't match (already updated)
vision = vision.replace(
  'v1beta/models/',
  'v1/models/'
);
fs.writeFileSync('src/app/api/ai-vision/route.js', vision, 'utf8');
console.log('Updated AI Vision API version to v1');

// 2. Fix ai/route.js
let aiText = fs.readFileSync('src/app/api/ai/route.js', 'utf8');
aiText = aiText.replace(
  'v1beta/models/',
  'v1/models/'
);
// Update modelsToTry
aiText = aiText.replace(
  "const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];",
  "const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-latest'];"
);
fs.writeFileSync('src/app/api/ai/route.js', aiText, 'utf8');
console.log('Updated AI Text models and API version');

// 3. Fix AiVoicePanel.jsx reload and improve hardware logic
let panel = fs.readFileSync('src/components/shop/AiVoicePanel.jsx', 'utf8');
panel = panel.replace(
  'window.location.reload();',
  'setVoiceError(null);'
);
fs.writeFileSync('src/components/shop/AiVoicePanel.jsx', panel, 'utf8');
console.log('Fixed AiVoicePanel reload logic');
