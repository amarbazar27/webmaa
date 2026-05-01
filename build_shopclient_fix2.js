const fs = require('fs');

let shopPath = 'd:/webmaa/src/app/shop/[shopSlug]/ShopClient.jsx';
let pt = fs.readFileSync(shopPath, 'utf8');

// Replace the accordion logic in user's order list
let startDrawer = pt.indexOf(') : userOrders.map(order => (\n                      <div key={order.id}');
if (startDrawer === -1) {
    startDrawer = pt.indexOf(') : userOrders.map(order => (\r\n                      <div key={order.id}');
}

if (startDrawer !== -1) {
  let endDrawer = pt.indexOf('                    ))}');
  if (endDrawer !== -1) {
    const oldOrderList = pt.substring(startDrawer, endDrawer + 23);
    const newOrderList = `) : userOrders.map(order => (
                      <div key={order.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-purple-300 transition-colors cursor-pointer group" onClick={() => router.push(\`/shop/\${shop.shopSlug || shop.subdomainSlug}/order/\${order.id}\`)}>
                        <div className="p-4 bg-slate-50">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-1 rounded-md border border-purple-200">#{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</span>
                            <span className={\`text-[11px] font-black px-2 py-1 rounded-md border \${order.status === 'completed' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : order.status === 'cancelled' ? 'text-red-700 bg-red-100 border-red-200' : 'text-amber-700 bg-amber-100 border-amber-200'}\`}>{order.status || 'Pending'}</span>
                          </div>
                          <p className="font-extrabold text-slate-900 text-base">{order.items?.length || 0} Items <span className="text-purple-600">(৳{order.total?.toLocaleString()})</span></p>
                        </div>
                        <div className="bg-slate-900 text-white text-center py-2 text-xs font-black group-hover:bg-purple-600 transition-colors">
                          অর্ডার বিস্তারিত দেখুন
                        </div>
                      </div>
                    ))}
`;
    pt = pt.replace(oldOrderList, newOrderList);
    console.log('Fixed Drawer Accordion');
  }
}

// Replace the Order Success popup button
let successBtnIdx = pt.indexOf('onClick={() => { generatePDF(orderSuccess); }}');
if (successBtnIdx !== -1) {
  let btnStart = pt.lastIndexOf('<button', successBtnIdx);
  let btnEnd = pt.indexOf('</button>', successBtnIdx) + 9;
  
  if (btnStart !== -1 && btnEnd !== -1) {
    const oldBtn = pt.substring(btnStart, btnEnd);
    const newSuccessButton = `<button
              onClick={() => { 
                setOrderSuccess(null); 
                router.push(\`/shop/\${shop.shopSlug || shop.subdomainSlug}/order/\${orderSuccess.id}\`); 
              }}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-purple-600 transition-all shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                অর্ডার বিস্তারিত ও ইনভয়েস
              </span>
            </button>`;
    pt = pt.replace(oldBtn, newSuccessButton);
    console.log('Fixed Success Popup');
  }
}

fs.writeFileSync(shopPath, pt);
