const fs = require('fs');
const path = require('path');

const scPath = path.join(__dirname, 'src/app/shop/[shopSlug]/ShopClient.jsx');
let sc = fs.readFileSync(scPath, 'utf8');

// 1. Remove static banners (1129-1148 approx)
const staticBannersStart = '        {/* \u2500\u2500 Store Features / Trust Badges \u2500\u2500 */}';
const staticBannersEnd = '        {/* \u2500\u2500 AI Shopping List Upload \u2500\u2500 */}';
const startIdx = sc.indexOf(staticBannersStart);
const endIdx = sc.indexOf(staticBannersEnd);
if (startIdx !== -1 && endIdx !== -1) {
  sc = sc.substring(0, startIdx) + sc.substring(endIdx);
  console.log('[OK] Removed static banners');
}

// 2. Add Edit button to Cart item
const oldCartDelete = '<button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-lg"><X size={16} strokeWidth={2.5} /></button>';
const newCartEditDelete = `<div className="flex flex-col gap-1">
                      <button onClick={() => { trackStoreEvent('select_content', { content_type: 'product', item_id: item.productId, name: item.name }); router.push(\`/shop/\${shop.shopSlug || shop.subdomainSlug}/product/\${item.productId}\`); setIsCartOpen(false); }} className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors p-2 rounded-lg" title="Edit/Customize"><Edit2 size={16} strokeWidth={2.5} /></button>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-lg" title="Remove"><X size={16} strokeWidth={2.5} /></button>
                    </div>`;

if (sc.includes(oldCartDelete)) {
  sc = sc.replace(oldCartDelete, newCartEditDelete);
  // Also need to import Edit2 from lucide-react if not present
  if (!sc.includes('Edit2,')) {
    sc = sc.replace('import { ShoppingCart,', 'import { ShoppingCart, Edit2,');
  }
  console.log('[OK] Added Edit button to Cart');
}

// 3. Move categories above products on mobile
// In ShopClient, categories on mobile are usually in a <aside> with "hidden md:block" or similar.
// Actually, let's just make the categories scrollable horizontally on mobile, above the products.
const oldCategoriesWrapperStart = '        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start relative">';
const oldCategoriesWrapperEnd = '          {/* \u2500\u2500 Products Grid \u2500\u2500 */}';

// I need to change the aside from hidden on mobile to visible horizontally.
const oldAside = '<aside className="hidden md:block w-64 shrink-0 sticky top-24">';
const newAside = '<aside className="w-full md:w-64 shrink-0 md:sticky md:top-24 mb-6 md:mb-0">';

if (sc.includes(oldAside)) {
  sc = sc.replace(oldAside, newAside);
  console.log('[OK] Unhid categories on mobile');
}

// Change the ul to be horizontal scroll on mobile
const oldCatList = '<ul className="space-y-1.5">';
const newCatList = '<ul className="flex md:flex-col gap-2 md:gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 hide-scrollbar">';
if (sc.includes(oldCatList)) {
  sc = sc.replace(oldCatList, newCatList);
}

// Fix subcategories logic: user said "catagory te click korlei sub catagory o show hobe".
// Wait, is there subcategory logic?

// 4. Fix clientPrice payload
const oldPayloadClientPrice = 'clientPrice: i.customizedPrice || undefined';
const newPayloadClientPrice = 'clientPrice: i.clientPrice || i.price || undefined';
if (sc.includes(oldPayloadClientPrice)) {
  sc = sc.replace(oldPayloadClientPrice, newPayloadClientPrice);
  console.log('[OK] Fixed clientPrice payload');
}

// 5. Fix PWA prompt 3-dots text
const oldPwaPrompt = "toast('আপনার ব্রাউজারের 3-dot (⋮) মেনু থেকে \"Install App\" এ ক্লিক করুন।', { icon: '📱' });";
const newPwaPrompt = `
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        window.deferredPrompt = null;
      });
    } else {
      toast('আপনার ব্রাউজারের 3-dot (⋮) মেনু থেকে "Install App" বা "Add to Home screen" এ ক্লিক করুন। (iOS-এ Share > Add to Home Screen)', { icon: '📱', duration: 5000 });
    }
`;
if (sc.includes(oldPwaPrompt)) {
  sc = sc.replace(oldPwaPrompt, newPwaPrompt);
  console.log('[OK] Fixed PWA prompt logic');
}

// Ensure deferredPrompt is captured globally
if (!sc.includes('window.deferredPrompt')) {
  const globalListener = `
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
    });
  }, []);
`;
  sc = sc.replace('useEffect(() => {\r\n    const syncCart', globalListener + '\r\n  useEffect(() => {\r\n    const syncCart');
}


fs.writeFileSync(scPath, sc, 'utf8');
console.log('ShopClient fixes applied!');
