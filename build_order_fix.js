const fs = require('fs');

// -----------------------------------------------------
// 1. UPDATE ProductDetailClient.jsx (AI Custom Order Fix)
// -----------------------------------------------------
let productPath = 'd:/webmaa/src/app/shop/[shopSlug]/product/[productId]/ProductDetailClient.jsx';
let pt = fs.readFileSync(productPath, 'utf8');

// Find the handleAddToCart function
const addToCartStr = `    const cartItem = {
      id: product.id + (variantString ? \`_\${variantString.replace(/\\s+/g, '-')}\` : '') + (customInput ? \`_custom_\${Date.now()}\` : ''),
      productId: product.id,
      name: product.name + (variantString ? \` (\${variantString})\` : ''),
      price: aiPrice !== null ? aiPrice / qty : basePrice,
      quantity: qty,
      imageUrl: product.imageUrl || '',
      note: (customInput ? \`কাস্টমাইজ: \${customInput}\` : '') + (customerNote ? (customInput ? ' | ' : '') + \`নোট: \${customerNote}\` : ''),
      isCustomized: aiPrice !== null,
      customizedPrice: aiPrice,
      variantsText: variantString // save exact variant info
    };`;

const newCartStr = `    const cartItem = {
      id: product.id + (variantString ? \`_\${variantString.replace(/\\s+/g, '-')}\` : '') + (customInput ? \`_custom_\${Date.now()}\` : ''),
      productId: product.id,
      name: product.name + (variantString ? \` (\${variantString})\` : ''),
      price: aiPrice !== null ? aiPrice / qty : basePrice,
      quantity: qty,
      imageUrl: product.imageUrl || '',
      note: customerNote || '',
      isCustomized: aiPrice !== null,
      customizedPrice: aiPrice,
      baseUnit: product.unit || '',
      customizedText: customInput || '',
      variantsText: variantString
    };`;

if (pt.includes(addToCartStr)) {
  pt = pt.replace(addToCartStr, newCartStr);
  fs.writeFileSync(productPath, pt);
  console.log('Fixed ProductDetailClient.jsx');
} else {
  console.log('NOT FOUND in ProductDetailClient.jsx');
}


// -----------------------------------------------------
// 2. CREATE A NEW PAGE: /shop/[shopSlug]/order/[orderId]/page.js (Order Summary Page)
// -----------------------------------------------------
// Wait, I will write the code for it here
