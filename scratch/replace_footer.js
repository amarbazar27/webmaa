const fs = require('fs');

let content = fs.readFileSync('d:/webmaa/src/app/page.js', 'utf8');

// Replace logo text
content = content.replace('text="daripallah.com"', 'text="bdretailers.com"');

// Replace description text
content = content.replace(
  'Daripallah — বাংলাদেশের সবচেয়ে আধুনিক ই-কমার্স প্ল্যাটফর্ম। কাস্টমারদের জন্য সরাসরি ভেরিফাইড লোকাল মার্চেন্ট নেটওয়ার্ক থেকে সুরক্ষিত ও দ্রুত কেনাকাটার ওয়ান-স্টপ হাব।',
  'BDRetailers — বাংলাদেশের সবচেয়ে আধুনিক ই-কমার্স প্ল্যাটফর্ম। কাস্টমারদের জন্য সরাসরি ভেরিফাইড লোকাল মার্চেন্ট নেটওয়ার্ক থেকে সুরক্ষিত ও দ্রুত কেনাকাটার ওয়ান-স্টপ হাব।'
);

// Replace global platform copyright
content = content.replace(
  'daripallah global platform',
  'bdretailers global platform'
);

fs.writeFileSync('d:/webmaa/src/app/page.js', content, 'utf8');
console.log('Successfully updated page.js footer via Node script');
