const fs = require('fs');
let c = fs.readFileSync('src/components/shop/AiVoicePanel.jsx', 'utf8');

// Improve Grant Access logic in Voice Tab
const voiceAccessBtn = `
              {voiceError?.includes('অনুমতি') && (
                <button onClick={() => navigator.mediaDevices.getUserMedia({ audio: true }).then(() => { toast.success('ধন্যবাদ! এবার মাইক বাটনে চাপুন।'); window.location.reload(); }).catch(() => toast.error('ব্রাউজার সেটিংস থেকে মাইক্রোফোন অ্যাক্সেস দিন।'))} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800">মাইকের অ্যাক্সেস দিন</button>
              )}
`;

// Add Camera Access button in Image Tab
const imageTabSearch = 'বাজারের ফর্দের ছবি দিন</p>';
const cameraAccessBtn = `
            <div className="flex flex-col items-center gap-2 mt-2">
              <button onClick={() => navigator.mediaDevices.getUserMedia({ video: true }).then(() => { toast.success('ক্যামেরা অ্যাক্সেস দেওয়া হয়েছে!'); }).catch(() => toast.error('ব্রাউজার সেটিংস থেকে ক্যামেরা অ্যাক্সেস দিন।'))} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black shadow-sm hover:bg-purple-700 transition-colors">ক্যামেরা/ফাইল অ্যাক্সেস দিন</button>
            </div>
`;

if (c.includes(imageTabSearch)) {
  c = c.replace(imageTabSearch, imageTabSearch + cameraAccessBtn);
  console.log('Added Camera Access button to Image Tab');
}

fs.writeFileSync('src/components/shop/AiVoicePanel.jsx', c, 'utf8');
