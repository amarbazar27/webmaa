const fs = require('fs');

// --- Fix 1: src/app/api/ai/route.js ---
let aiRoute = fs.readFileSync('src/app/api/ai/route.js', 'utf8');
aiRoute = aiRoute.replace(
  "const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-latest'];",
  "const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro'];"
);
aiRoute = aiRoute.replace(
  "const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;",
  "const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;"
);
fs.writeFileSync('src/app/api/ai/route.js', aiRoute, 'utf8');
console.log('Updated api/ai/route.js models and URL');

// --- Fix 2: src/app/api/ai-vision/route.js ---
let visionRoute = fs.readFileSync('src/app/api/ai-vision/route.js', 'utf8');
visionRoute = visionRoute.replace(
  "const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;",
  "const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;"
);
fs.writeFileSync('src/app/api/ai-vision/route.js', visionRoute, 'utf8');
console.log('Updated api/ai-vision/route.js model and URL');

// --- Fix 3: src/components/shop/AiVoicePanel.jsx ---
let panel = fs.readFileSync('src/components/shop/AiVoicePanel.jsx', 'utf8');

// Update Mic button
const oldMicBtn = "navigator.mediaDevices.getUserMedia({ audio: true }).then(() => { toast.success('অ্যাক্সেস দেওয়া হয়েছে! এবার আবার মাইক বাটনে চাপুন।'); }).catch(() => toast.error('দয়া করে ব্রাউজার সেটিংস থেকে অনুমতি দিন।'))";
const newMicBtn = "navigator.mediaDevices.getUserMedia({ audio: true }).then(() => { toast.success('ধন্যবাদ! এবার মাইক বাটনে চাপুন।'); setTimeout(() => window.location.reload(), 1000); }).catch(() => toast.error('ব্রাউজার সেটিংস থেকে মাইক্রোফোন অ্যাক্সেস দিন।'))";
if (panel.includes(oldMicBtn)) {
  panel = panel.replace(oldMicBtn, newMicBtn);
  console.log('Updated Mic Grant Access button');
}

fs.writeFileSync('src/components/shop/AiVoicePanel.jsx', panel, 'utf8');
