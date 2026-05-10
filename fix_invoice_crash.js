const fs = require('fs');
let c = fs.readFileSync('src/app/shop/[shopSlug]/invoice/[orderId]/page.js', 'utf8');

c = c.replace(
  '{window.location.origin}/shop/{shopSlug}',
  "{typeof window !== 'undefined' ? window.location.origin : ''}/shop/{shopSlug}"
);

fs.writeFileSync('src/app/shop/[shopSlug]/invoice/[orderId]/page.js', c, 'utf8');
console.log('Fixed window.location.origin crash in InvoicePage');
