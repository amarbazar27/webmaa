const fs = require('fs');
const path = 'src/app/shop/[shopSlug]/ShopClient.jsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const [shop] = useState(initialShop);`;
const replacement = `  const [shop] = useState(initialShop);
  const [products] = useState(initialProducts || []);
  const [categories] = useState(initialCategories || []);`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content);
  console.log('Successfully restored products and categories state!');
} else {
  console.log('Target not found!');
}
