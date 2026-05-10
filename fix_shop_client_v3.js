const fs = require('fs');
let c = fs.readFileSync('src/app/shop/[shopSlug]/ShopClient.jsx', 'utf8');

// Mandatory Location Check
const startOfPlaceOrder = "const handlePlaceOrder = async (e) => {";
const locationCheck = `
    if (!orderForm.coordinates) {
      toast.error('অর্ডার করতে আপনার লোকেশন (Map Button) সিলেক্ট করুন।', { icon: '📍', duration: 4000 });
      return;
    }
`;
if (c.includes(startOfPlaceOrder)) {
  c = c.replace(startOfPlaceOrder, startOfPlaceOrder + locationCheck);
  console.log('Added mandatory location check');
} else {
  console.log('Could not find start of handlePlaceOrder');
}

fs.writeFileSync('src/app/shop/[shopSlug]/ShopClient.jsx', c, 'utf8');
