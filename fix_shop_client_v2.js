const fs = require('fs');
let c = fs.readFileSync('src/app/shop/[shopSlug]/ShopClient.jsx', 'utf8');

// 1. Fix Edit Button URL
const oldEditBtn = "router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/product/${item.productId}`);";
const newEditBtn = "router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/product/${item.productId || item.id}`);";
if (c.includes(oldEditBtn)) {
  c = c.replace(oldEditBtn, newEditBtn);
  console.log('Fixed Edit button URL');
} else {
  // Try matching with backslashes if any
  const oldEditBtnEscaped = "router.push(\`/shop/\${shop.shopSlug || shop.subdomainSlug}/product/\${item.productId}\`);";
  if (c.includes(oldEditBtnEscaped)) {
    c = c.replace(oldEditBtnEscaped, newEditBtn);
    console.log('Fixed Edit button URL (escaped match)');
  } else {
     console.log('Could not find Edit button URL to replace');
  }
}

// 2. Mandatory Location Check
const startOfPlaceOrder = "const handlePlaceOrder = async (e) => {\n    e.preventDefault();";
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
