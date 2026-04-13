const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'shop', '[shopSlug]', 'ShopClient.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Check what we're looking for
const marker = '// Mock AI Chat Logic';
const idx = content.indexOf(marker);
console.log('Marker found at index:', idx);

if (idx === -1) {
  console.log('ERROR: Marker not found. File may have already been patched or is different.');
  process.exit(1);
}

// Find the end of the sendChatMessage function — look for the closing }; after the setTimeout
const endMarker = '  };\n\n  // \u2500\u2500\u2500 Filters';
const endIdx = content.indexOf(endMarker, idx);
console.log('End marker found at index:', endIdx);

if (endIdx === -1) {
  console.log('ERROR: End marker not found. Dumping 2000 chars around idx:');
  console.log(content.substring(idx, idx + 2000));
  process.exit(1);
}

const oldSection = content.substring(idx, endIdx);
console.log('OLD SECTION (first 100 chars):', oldSection.substring(0, 100));

const newSection = `// Smart Context-Aware AI Chat
  const [chatMessages, setChatMessages] = useState([{
    id: 1, role: 'bot',
    text: 'Hello! I am ' + (shop.aiConfig && shop.aiConfig.botName ? shop.aiConfig.botName : 'Bazar Bot') + ' \u2014 ' + shop.shopName + ' shopping assistant. Ask about products, delivery or payment!'
  }]);
  const [chatInput, setChatInput] = useState('');

  const getSmartBotReply = (text) => {
    const q = text.toLowerCase();
    const deliveryFee = (shop.deliveryConfig && shop.deliveryConfig.advanceFee) ? shop.deliveryConfig.advanceFee : 60;
    const isCOD = shop.deliveryConfig ? shop.deliveryConfig.isCOD !== false : true;
    const payNums = (shop.deliveryConfig && shop.deliveryConfig.methods) ? shop.deliveryConfig.methods : 'bKash/Nagad';

    const deliveryKW = ['delivery', 'charge', 'shipping', 'courier', 'cost', 'fee', 'how much'];
    const payKW = ['payment', 'bkash', 'nagad', 'pay', 'txn', 'transaction', 'number'];
    const returnKW = ['return', 'refund', 'exchange', 'replace'];
    const orderKW = ['order', 'status', 'track', 'where is'];
    const greetKW = ['hello', 'hi', 'hey', 'help', 'assist'];
    const listKW = ['product', 'item', 'what do', 'show me', 'available', 'sell', 'have'];

    if (deliveryKW.some(kw => q.includes(kw))) {
      return isCOD
        ? 'Delivery charge is BDT ' + deliveryFee + ' (advance only). Rest is Cash on Delivery. Pay to: ' + payNums
        : 'Full payment required upfront. Delivery: BDT ' + deliveryFee + '. Pay to: ' + payNums;
    }
    if (payKW.some(kw => q.includes(kw))) {
      return 'Pay via: ' + payNums + '. After payment, enter your Transaction ID (TxnID) in the order form.';
    }

    // Product search - search within real products
    const matched = products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
    if (matched.length > 0) {
      const names = matched.slice(0, 3).map(p => p.name + ' (BDT ' + p.price + ')').join(' | ');
      return 'Yes! We have: ' + names + '. Add to cart and order now!';
    }

    if (returnKW.some(kw => q.includes(kw))) {
      return 'Contact us within 24 hours of receiving product for any issues.' + ((shop.socialLinks && shop.socialLinks.wa) ? ' WhatsApp: wa.me/' + shop.socialLinks.wa : '');
    }
    if (greetKW.some(kw => q.includes(kw))) {
      return 'Hi there! How can I help? We have ' + products.length + ' products. Ask me anything!';
    }
    if (orderKW.some(kw => q.includes(kw))) {
      return 'To check your order status, click the profile icon (top right) and log in with Google.';
    }
    if (listKW.some(kw => q.includes(kw))) {
      const sample = products.slice(0, 4).map(p => p.name).join(', ');
      return 'We have ' + products.length + ' products including: ' + sample + '. Browse above or search!';
    }
    return 'Thanks for asking! We have ' + products.length + ' products. Type a product name and I will find it for you!';
  };

  const sendChatMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setTimeout(() => {
      const botMsg = { id: Date.now() + 1, role: 'bot', text: getSmartBotReply(text) };
      setChatMessages(prev => [...prev, botMsg]);
    }, 700);
  };

  // \u2500\u2500\u2500 Filters`;

content = content.substring(0, idx) + newSection + content.substring(endIdx + endMarker.length);
fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: Smart AI Chat applied!');
