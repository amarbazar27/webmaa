const fs = require('fs');
const path = 'd:\\webmaa\\src\\app\\dashboard\\settings\\page.js';

let content = fs.readFileSync(path, 'utf8');

// The exact pattern from the file (3 spaces indent, CRLF)
const marker = 'bKash: 017.., Nagad.."\r\n                 />\r\n                 <div className="space-y-1.5">';

const replacement = `bKash: 017.., Nagad.."\r\n                 />\r\n                 <Input\r\n                   label="📧 Ruflo Alert Email (New Orders)"\r\n                   type="email"\r\n                   value={deliveryConfig.contactEmail}\r\n                   onChange={e => setDeliveryConfig({...deliveryConfig, contactEmail: e.target.value})}\r\n                   placeholder="your@gmail.com"\r\n                 />\r\n                 <Input\r\n                   label="Minimum Order Amount (৳)"\r\n                   type="number"\r\n                   value={deliveryConfig.minOrderAmount}\r\n                   onChange={e => setDeliveryConfig({...deliveryConfig, minOrderAmount: e.target.value})}\r\n                   placeholder="0 = no limit"\r\n                 />\r\n                 <div className="space-y-1.5">`;

if (content.includes(marker)) {
  content = content.replace(marker, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('✅ Settings page patched with Ruflo email + minOrderAmount fields');
} else {
  console.log('❌ Still not found');
  const idx = content.indexOf('bKash: 017');
  if (idx >= 0) {
    console.log(JSON.stringify(content.substring(idx, idx + 120)));
  }
}
