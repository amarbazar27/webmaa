const fs = require('fs');
const file = 'src/app/shop/[shopSlug]/ShopClient.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the AI prompt section - lines 495-503
// Using a regex to find and replace the block
const regex = /🔴 বিশেষ নির্দেশ \(স্মার্ট ক্যালকুলেটর\):\r?\n১\. যদি ইউজার নির্দিষ্ট টাকার[^}]+৫. বাংলায় লেখো, উত্তর সংক্ষিপ্ত কিন্তু সম্পূর্ণ রাখো\.\` \},/s;

const newPrompt = `🔴 কঠোর নির্দেশ (অবশ্যই মানতে হবে):
১. ইউজার যত গ্রাম/কেজি/পিস বলবে EXACTLY সেটাই qty তে দাও। নিজে থেকে বাড়াবে না।
   - "৪০০ গ্রাম আলু" => qty: 0.4, note: "৪০০ গ্রাম"
   - "২৫টা ডিম" => qty: 25, note: "২৫ পিস"
   - "আধা কেজি পেঁয়াজ" => qty: 0.5, note: "৫০০ গ্রাম"
২. মাছ/মাংসের পিস উল্লেখ থাকলে মোট ওজন বের করে note-এ লেখো।
৩. ইউজার কার্টে যোগ করতে বললে PRODUCTS_JSON দাও এবং নিশ্চিত করো।
৪. উত্তর শেষে সবসময় PRODUCTS_JSON দাও।

FORMAT: PRODUCTS_JSON:[{"id":"ID","qty":1,"note":"বিস্তারিত","customizedText":"ইউজারের মূল কথা"}]

৫. বাংলায় লেখো, উত্তর সংক্ষিপ্ত ও সম্পূর্ণ রাখো.\` },`;

if (regex.test(content)) {
  content = content.replace(regex, newPrompt);
  fs.writeFileSync(file, content, 'utf8');
  console.log('SUCCESS: AI prompt updated');
} else {
  console.log('REGEX NOT MATCHED - trying simpler approach');
  // Simple line-by-line replacement
  const lines = content.split('\n');
  let start = -1, end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('বিশেষ নির্দেশ') && lines[i].includes('স্মার্ট')) start = i;
    if (start > -1 && lines[i].includes('সংক্ষিপ্ত কিন্তু সম্পূর্ণ')) { end = i; break; }
  }
  console.log('start:', start, 'end:', end);
  if (start > -1 && end > -1) {
    const replacement = `🔴 কঠোর নির্দেশ (অবশ্যই মানতে হবে):\r\n১. ইউজার যত গ্রাম/কেজি/পিস বলবে EXACTLY সেটাই qty তে দাও। নিজে থেকে বাড়াবে না।\r\n   - "৪০০ গ্রাম আলু" = qty:0.4, note:"৪০০ গ্রাম"\r\n   - "২৫টা ডিম" = qty:25, note:"২৫ পিস"\r\n২. মাছ/মাংসের পিস উল্লেখ থাকলে মোট ওজন বের করে note-এ লেখো।\r\n৩. কার্টে যোগ করতে বললে PRODUCTS_JSON দাও।\r\n৪. উত্তর শেষে সবসময় PRODUCTS_JSON দাও।\r\n\r\nFORMAT: PRODUCTS_JSON:[{"id":"ID","qty":1,"note":"বিস্তারিত","customizedText":"মূল কথা"}]\r\n\r\n৫. বাংলায় লেখো, উত্তর সংক্ষিপ্ত ও সম্পূর্ণ রাখো.\` },`;
    lines.splice(start, end - start + 1, replacement);
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log('SUCCESS via line replacement');
  }
}
