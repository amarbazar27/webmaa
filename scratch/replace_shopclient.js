const fs = require('fs');

let content = fs.readFileSync('d:/webmaa/src/app/shop/[shopSlug]/ShopClient.jsx', 'utf8');

// Replace Reviews Link
content = content.replace('href="https://daripallah.com/reviews"', 'href="https://bdretailers.com/reviews"');

// Replace Email
content = content.replace(/'support@daripallah.com'/g, "'support@bdretailers.com'");

// Replace Become Retailer Link
content = content.replace('href="https://daripallah.com/become-retailer"', 'href="https://bdretailers.com/become-retailer"');

// Replace branding text
content = content.replace('এই ওয়েবসাইটটি দাঁড়িয়েপাল্লা (<a href="https://daripallah.com"', 'এই ওয়েবসাইটটি বিডি রিটেইলার্স (<a href="https://bdretailers.com"');
content = content.replace('daripallah.com</a>) দ্বারা তৈরি।', 'bdretailers.com</a>) দ্বারা তৈরি।');

// Replace "Made with" text
content = content.replace('বানানো হয়েছে <a href="https://daripallah.com" target="_blank" rel="noreferrer" className="underline hover:text-white font-black text-slate-500">daripallah.com</a> দিয়ে', 'বানানো হয়েছে <a href="https://bdretailers.com" target="_blank" rel="noreferrer" className="underline hover:text-white font-black text-slate-500">bdretailers.com</a> দিয়ে');

fs.writeFileSync('d:/webmaa/src/app/shop/[shopSlug]/ShopClient.jsx', content, 'utf8');
console.log('Successfully updated ShopClient.jsx footer links');
