const fs = require('fs');
const path = 'd:/webmaa/src/app/shop/[shopSlug]/ShopClient.jsx';
let t = fs.readFileSync(path, 'utf8');

// ===========================================================
// FIX 1: cart.map - add customizedText, baseUnit; remove duplicate customerId
// ===========================================================
const oldCartMap = `      items: cart.map(i => ({ \r\n        id: i.productId || i.id, \r\n        quantity: i.quantity, \r\n        note: i.note || '',\r\n        variantsText: i.variantsText || '',\r\n        clientPrice: i.customizedPrice || undefined\r\n      })),\r\n      customerId: user.uid,\r\n      customerId: user.uid`;

const newCartMap = `      items: cart.map(i => ({ \r\n        id: i.productId || i.id, \r\n        quantity: i.quantity, \r\n        note: i.note || '',\r\n        variantsText: i.variantsText || '',\r\n        customizedText: i.customizedText || '',\r\n        baseUnit: i.baseUnit || '',\r\n        clientPrice: i.customizedPrice || undefined\r\n      })),\r\n      customerId: user.uid`;

if (t.includes(oldCartMap)) {
  t = t.replace(oldCartMap, newCartMap);
  console.log('FIX 1 OK: cart.map updated');
} else {
  console.log('FIX 1 FAIL: cart.map not found');
}

// ===========================================================
// FIX 2: onSuccess - redirect to order summary page
// ===========================================================
const oldOnSuccess = `    const onSuccess = async (payloadResp) => {\r\n      setOrderSuccess({\r\n        shopName: shop.shopName,\r\n        customerName: orderForm.name,\r\n        customerPhone: orderForm.phone,\r\n        customerAddress: orderForm.address,\r\n        items: cart,\r\n        total: payloadResp.total,\r\n        id: payloadResp.orderId,\r\n        orderIdVisual: payloadResp.orderIdVisual,\r\n        deliveryFee: effectiveDelivery,\r\n        date: \`\${dd}/\${mm}/\${yyyy}\`,\r\n      });\r\n      setCart([]);\r\n      localStorage.removeItem(CART_KEY);\r\n      toast.success('\u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u09aa\u09cd\u09b2\u09c7\u09b8 \u0995\u09b0\u09be \u09b9\u09af\u09bc\u09c7\u099b\u09c7! \ud83c\udf89');\r\n      if (user?.email) {\r\n        import('@/lib/firestore').then(lib => lib.getUserOrders(shop.id, user.email).then(setUserOrders));\r\n      }\r\n    };`;

const newOnSuccess = `    const onSuccess = async (payloadResp) => {\r\n      const orderId = payloadResp.orderId;\r\n      setCart([]);\r\n      localStorage.removeItem(CART_KEY);\r\n      toast.success('\u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u09aa\u09cd\u09b2\u09c7\u09b8 \u0995\u09b0\u09be \u09b9\u09af\u09bc\u09c7\u099b\u09c7! \ud83c\udf89');\r\n      setIsOrderOpen(false);\r\n      setPlacing(false);\r\n      if (user?.email) {\r\n        import('@/lib/firestore').then(lib => lib.getUserOrders(shop.id, user.email).then(setUserOrders));\r\n      }\r\n      router.push(\`/shop/\${shop.shopSlug || shop.subdomainSlug}/order/\${orderId}\`);\r\n    };`;

if (t.includes(oldOnSuccess)) {
  t = t.replace(oldOnSuccess, newOnSuccess);
  console.log('FIX 2 OK: onSuccess updated');
} else {
  console.log('FIX 2 FAIL: onSuccess not found - trying alternative...');
  // find and log what's around setOrderSuccess
  const idx = t.indexOf('setOrderSuccess({');
  if (idx !== -1) console.log('setOrderSuccess context:', JSON.stringify(t.substring(idx-100, idx+300)));
}

// ===========================================================
// FIX 3: User order drawer - replace accordion with nav cards
// ===========================================================
// Find the specific onClick to expand the drawer orders
const oldDrawerList = `                      <div key={order.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-purple-300 transition-colors cursor-pointer group" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>`;

if (t.includes(oldDrawerList)) {
  // Find start: ") : userOrders.map(order => (" right before the old drawer
  const drawerStart = t.indexOf(') : userOrders.map(order => (\r\n                      <div key={order.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-purple-300 transition-colors cursor-pointer group" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>');
  
  if (drawerStart !== -1) {
    // Find end: "                    ))}" after the old drawer
    const drawerEndMarker = '                    ))}\r\n                  </div>\r\n                </div>\r\n              )}\r\n            </div>';
    const drawerEnd = t.indexOf(drawerEndMarker, drawerStart);
    
    if (drawerEnd !== -1) {
      const oldBlock = t.substring(drawerStart, drawerEnd + drawerEndMarker.length);
      
      const newBlock = `) : userOrders.map(order => (\r\n                      <div\r\n                        key={order.id}\r\n                        className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-purple-300 transition-colors cursor-pointer group"\r\n                        onClick={() => { setIsProfileOpen(false); router.push(\`/shop/\${shop.shopSlug || shop.subdomainSlug}/order/\${order.id}\`); }}\r\n                      >\r\n                        <div className="p-4 bg-slate-50">\r\n                          <div className="flex justify-between items-center mb-1.5">\r\n                            <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-1 rounded-md border border-purple-200">#{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</span>\r\n                            <span className={\`text-[11px] font-black px-2 py-1 rounded-md border \${order.status === 'completed' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : order.status === 'cancelled' ? 'text-red-700 bg-red-100 border-red-200' : 'text-amber-700 bg-amber-100 border-amber-200'}\`}>{order.status || 'Pending'}</span>\r\n                          </div>\r\n                          <p className="font-extrabold text-slate-900 text-base">{order.items?.length || 0} Items <span className="text-purple-600">(৳{order.total?.toLocaleString()})</span></p>\r\n                          <p className="text-[10px] font-bold text-slate-400 mt-1">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB') : ''}</p>\r\n                        </div>\r\n                        <div className="bg-slate-900 text-white text-center py-2 text-xs font-black group-hover:bg-purple-600 transition-colors">\r\n                          বিস্তারিত ও PDF ডাউনলোড →\r\n                        </div>\r\n                      </div>\r\n                    ))}\r\n                  </div>\r\n                </div>\r\n              )}\r\n            </div>`;
      
      t = t.substring(0, drawerStart) + newBlock + t.substring(drawerEnd + drawerEndMarker.length);
      console.log('FIX 3 OK: drawer order list updated');
    } else {
      console.log('FIX 3 FAIL: drawerEndMarker not found');
      console.log('Searching from pos:', drawerStart);
    }
  } else {
    console.log('FIX 3 FAIL: drawerStart not found');
  }
} else {
  console.log('FIX 3 FAIL: oldDrawerList not found');
}

fs.writeFileSync(path, t);
console.log('Done. Lines:', t.split('\n').length);
