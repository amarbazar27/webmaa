const fs = require('fs');

const path = 'src/app/shop/[shopSlug]/product/[productId]/ProductDetailClient.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldPromptStart = 'const systemPrompt = `তুমি একটি Bangladeshi retail shop-এর AI price calculator।';
const oldPromptEnd = '৪. কোনো অতিরিক্ত কথা বা শুভেচ্ছা ছাড়াই পয়েন্ট-টু- পয়েন্ট উত্তর দাও।`;';

const newSystemPrompt = `const systemPrompt = \\\`তুমি একটি Bangladeshi retail shop-এর AI কাস্টমাইজেশন অ্যাসিস্ট্যান্ট। তোমার কাজ হলো ইউজারের রিকোয়েস্ট অনুযায়ী সঠিক মূল্য (Price) নির্ধারণ করা।

📦 প্রোডাক্টের তথ্য:
- নাম: \${product.name}
- বেস মূল্য: ৳\${basePrice} (\${product.unit || 'প্রতি ইউনিট'})

🧠 তোমার বিচারবুদ্ধি (Logic):
১. **টাকা বনাম পরিমাণ:** ইউজার যদি "টাকা", "tk", "taka", "৳" উল্লেখ করে (যেমন: "১৫০ টাকার সয়াবিন তেল"), তবে সেটা সরাসরি মূল্য (PRICE)। সেটাকে গ্রামে রূপান্তর করবে না।
২. **পরিমাণ ভিত্তিক মূল্য:** যদি ইউজার গ্রাম, কেজি, বা পিস উল্লেখ করে (যেমন: "১৫০ গ্রাম" বা "2 kg"), তখন ঐ পরিমাণের দাম বের করো। 
   - হিসাব: (বেস মূল্য / ১০০০) * গ্রামের পরিমাণ। 
৩. **বাজেট রিকোয়েস্ট:** যদি ইউজার বলে "১৫০ টাকার তেল চাই", তাহলে তুমি বলবে: "আপনি ১৫০ টাকার তেল কিনতে চান। ঐ দামে আপনি পাবেন (১৫০ / বেস মূল্য) কেজি/গ্রাম তেল।"
৪. **উত্তর ফরম্যাট:**
   - সংক্ষেপে বাংলায় ব্যাখ্যা দাও।
   - উত্তরের শেষে অবশ্যই "PRICE: [number]" লিখবে।
   - অতিরিক্ত কোনো শুভেচ্ছা বা অপ্রাসঙ্গিক কথা বলবে না।\\\`;`;

// Find the systemPrompt block and replace it
// Since it's a template literal with variables, we use a regex or string search
const regex = /const systemPrompt = `তুমি একটি Bangladeshi retail shop-এর AI price calculator।[\s\S]*?৪\. কোনো অতিরিক্ত কথা বা শুভেচ্ছা ছাড়াই পয়েন্ট-টু- পয়েন্ট উত্তর দাও।`;/;

if (regex.test(content)) {
    content = content.replace(regex, newSystemPrompt.replace(/\\\\\\/g, '\\').replace(/\\`/g, '`'));
    console.log('✅ ProductDetailClient AI prompt updated!');
} else {
    console.log('⚠️ Could not find systemPrompt block via regex. Trying simpler match...');
    // Fallback for slight variations in whitespace/characters
    const fallbackRegex = /const systemPrompt = `[\s\S]*?PRICE: 30\)[\s\S]*?`;/;
    if (fallbackRegex.test(content)) {
        content = content.replace(fallbackRegex, newSystemPrompt.replace(/\\\\\\/g, '\\').replace(/\\`/g, '`'));
        console.log('✅ ProductDetailClient AI prompt updated (fallback)!');
    } else {
        console.log('❌ Failed to find the prompt block.');
    }
}

fs.writeFileSync(path, content);
