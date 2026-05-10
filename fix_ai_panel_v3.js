const fs = require('fs');
let c = fs.readFileSync('src/components/shop/AiVoicePanel.jsx', 'utf8');

// Update the access button to automatically trigger startListening/recognition
const oldBtnCode = 'onClick={() => navigator.mediaDevices.getUserMedia({ audio: true }).then(() => { toast.success(\'ধন্যবাদ! এবার মাইক বাটনে চাপুন।\'); setVoiceError(null); })';
const newBtnCode = 'onClick={() => navigator.mediaDevices.getUserMedia({ audio: true }).then(() => { toast.success(\'অ্যাক্সেস দেওয়া হয়েছে!\'); setVoiceError(null); if (recognition) { try { recognition.start(); setIsListening(true); } catch(e){} } })';

if (c.includes(oldBtnCode)) {
  c = c.replace(oldBtnCode, newBtnCode);
  console.log('Improved Voice Access button logic');
}

fs.writeFileSync('src/components/shop/AiVoicePanel.jsx', c, 'utf8');
