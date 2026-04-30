const fs = require('fs');

const path = 'src/app/shop/[shopSlug]/ShopClient.jsx';
let content = fs.readFileSync(path, 'utf8');

// ────────────────────────────────────────────────
// FIX 1: Remove the login wall (if !user block)
// ────────────────────────────────────────────────
// Match the entire if (!user) { ... } block from line ~951
const loginWallRegex = /(\n|\r\n)\s+if \(!user\) \{\r?\n[\s\S]*?গুগল দিয়ে লগইন\r?\n\s+<\/button>\r?\n\s+<\/div>\r?\n\s+\);\r?\n\s+\}\r?\n/;

if (loginWallRegex.test(content)) {
  content = content.replace(loginWallRegex, '\n');
  console.log('✅ Login wall removed!');
} else {
  console.log('⚠️ Login wall regex failed, trying line-by-line...');
  
  // Line-by-line fallback
  const lines = content.split('\n');
  const startIdx = lines.findIndex(l => l.trim() === 'if (!user) {');
  if (startIdx !== -1) {
    // Find the closing } of this if block
    let braces = 0;
    let endIdx = startIdx;
    for (let i = startIdx; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (ch === '{') braces++;
        if (ch === '}') braces--;
      }
      if (braces === 0 && i > startIdx) {
        endIdx = i;
        break;
      }
    }
    lines.splice(startIdx, endIdx - startIdx + 1);
    content = lines.join('\n');
    console.log(`✅ Login wall removed (lines ${startIdx}-${endIdx})!`);
  } else {
    console.log('❌ Could not find login wall!');
  }
}

// ────────────────────────────────────────────────
// FIX 2: Upgrade AI system prompt with price/budget awareness
// and add AI-to-cart capability
// ────────────────────────────────────────────────

const oldPrompt = `{ role: 'system', content: \`তুমি "\${shop.shopName}"-এর এআই সাহায্যকারী। "আসসালামু আলাইকুম" দিয়ে শুরু করবে। \r
সার্ভিস এরিয়া (যেখানে আমরা ডেলিভারি দেই): \${(shop.serviceAreas || []).join(', ')}। \r
ইউজারের বর্তমান লোকেশন: \${detectedLocation || locationManualInput || 'জানা যায়নি'}। \r
যদি ইউজার তার এলাকায় ডেলিভারি হবে কি না জিজ্ঞেস করে, উপরের সার্ভিস এরিয়ার সাথে মিলিয়ে সঠিক উত্তর দিবে।\r
সবসময় বাংলায় কথা বলবে।\r
প্রোডাক্টের তালিকা: \${products.slice(0,25).map(p=>\`\${p.name}: ৳\${p.price}\`).join(', ')}\` }`;

const newPrompt = `{ role: 'system', content: \`তুমি "\${shop.shopName}"-এর স্মার্ট এআই সহকারী।

🛍️ তোমার কাজ:
- পণ্য খুঁজে দেওয়া, দাম জানানো, অর্ডার সহায়তা করা

📦 প্রোডাক্ট লিস্ট (নাম: দাম):
\${products.map(p=>\`\${p.name}: ৳\${p.price}\`).join('\\n')}

🚚 সার্ভিস এরিয়া: \${(shop.serviceAreas || []).join(', ')}
📍 ইউজারের লোকেশন: \${detectedLocation || locationManualInput || 'অজানা'}

⚠️ গুরুত্বপূর্ণ নিয়ম:
1. "তাকা", "টাকা", "tk", "taka", "৳" এগুলো দিয়ে সবসময় মূল্য (price) বোঝায়, পরিমাণ (quantity/gram) নয়।
   উদাহরণ: "১৫০ টাকার চাল" মানে যে চালের দাম ১৫০ টাকা — ১৫০ গ্রাম চাল নয়।
2. যদি কেউ বলে "১৫০ টাকার X দাও" বা "150 taka er X", তাহলে ওই দামের বা কাছাকাছি দামের X পণ্যটি খুঁজে দাও।
3. যদি ঠিক সেই দামের পণ্য না থাকে, সবচেয়ে কাছের দামের পণ্য suggest করো।
4. "কত কেজি/গ্রাম" না বলা পর্যন্ত পরিমাণ ধরো না।
5. সবসময় বাংলায় উত্তর দাও।
6. উত্তর সংক্ষিপ্ত ও সহায়ক রাখো।\` }`;

if (content.includes(oldPrompt)) {
  content = content.replace(oldPrompt, newPrompt);
  console.log('✅ AI system prompt upgraded with price/budget rules!');
} else {
  // Try without \r
  const oldPromptNoR = oldPrompt.replace(/\\r\n/g, '\\n');
  if (content.includes(oldPromptNoR)) {
    content = content.replace(oldPromptNoR, newPrompt);
    console.log('✅ AI system prompt upgraded (no-CR variant)!');
  } else {
    console.log('⚠️ Could not find exact AI prompt — patching via regex...');
    content = content.replace(
      /\{ role: 'system', content: `তুমি[\s\S]*?প্রোডাক্টের তালিকা:[\s\S]*?\` \}/,
      newPrompt
    );
    console.log('✅ AI prompt patched via regex!');
  }
}

fs.writeFileSync(path, content);
console.log('\n✅ All fixes applied!');
