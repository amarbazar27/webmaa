const fs = require('fs');

let c = fs.readFileSync('src/components/shop/AiVoicePanel.jsx', 'utf8');

const oldErrorDisplay = '{voiceError && <p className="text-xs font-bold text-red-600 text-center">{voiceError}</p>}';
const newErrorDisplay = `{voiceError && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold text-red-600 text-center bg-red-50 px-3 py-2 rounded-xl">{voiceError}</p>
              {voiceError.includes('অনুমতি') && (
                <button onClick={() => navigator.mediaDevices.getUserMedia({ audio: true }).then(() => { toast.success('অ্যাক্সেস দেওয়া হয়েছে! এবার আবার মাইক বাটনে চাপুন।'); }).catch(() => toast.error('দয়া করে ব্রাউজার সেটিংস থেকে অনুমতি দিন।'))} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800">মাইকের অ্যাক্সেস দিন</button>
              )}
            </div>
          )}`;

c = c.replace(oldErrorDisplay, newErrorDisplay);

fs.writeFileSync('src/components/shop/AiVoicePanel.jsx', c, 'utf8');
console.log('Added Mic access button!');
