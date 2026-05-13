const fs = require('fs');
const file = 'src/app/shop/[shopSlug]/ShopClient.jsx';
let content = fs.readFileSync(file, 'utf8');

// Find removeFromCart function body
const funcStart = content.indexOf('const removeFromCart = (id)');
const funcEnd = content.indexOf('};', funcStart) + 2;
const existingFunc = content.substring(funcStart, funcEnd);
console.log('Existing func:', JSON.stringify(existingFunc));

const noteFunc = '\r\n\r\n  const updateItemNote = (id, note) => {\r\n    setCart(prev => prev.map(item => item.id === id ? { ...item, note } : item));\r\n  };';

// Check if already added
if (content.includes('updateItemNote')) {
  console.log('updateItemNote already exists');
} else {
  content = content.slice(0, funcEnd) + noteFunc + content.slice(funcEnd);
  fs.writeFileSync(file, content, 'utf8');
  console.log('SUCCESS: updateItemNote added after position', funcEnd);
}
