const fs = require('fs');

let c = fs.readFileSync('src/components/shop/AiVoicePanel.jsx', 'utf8');

c = c.replace(
  "const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'voice' | 'image' | 'text'",
  ""
);

c = c.replace(
  "export default function AiVoicePanel({ shop, products, onAddToCart, onDirectOrder, isOpen, onClose }) {",
  "export default function AiVoicePanel({ shop, products, onAddToCart, onDirectOrder, isOpen, onClose, activeTab }) {"
);

const tabBarStart = '{/* Tab Bar */}';
const voiceTabStart = '{/* Voice Tab */}';
const startIdx = c.indexOf(tabBarStart);
const endIdx = c.indexOf(voiceTabStart);

if (startIdx !== -1 && endIdx !== -1) {
  c = c.substring(0, startIdx) + c.substring(endIdx);
  console.log('Removed Tab Bar');
}

fs.writeFileSync('src/components/shop/AiVoicePanel.jsx', c, 'utf8');
console.log('AiVoicePanel double UI fixed!');
