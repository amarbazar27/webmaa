const fs = require('fs');

let shopPath = 'd:/webmaa/src/app/shop/[shopSlug]/ShopClient.jsx';
let pt = fs.readFileSync(shopPath, 'utf8');

// Replace the accordion logic in user's order list to just redirect to the new Order Summary Page
const oldOrderList = `                    ) : userOrders.map(order => (
                      <div key={order.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-purple-300 transition-colors cursor-pointer group" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                        <div className="p-4 bg-slate-50">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-1 rounded-md border border-purple-200">#{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</span>
                            <span className={\`text-[11px] font-black px-2 py-1 rounded-md border \${order.status === 'completed' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : order.status === 'cancelled' ? 'text-red-700 bg-red-100 border-red-200' : 'text-amber-700 bg-amber-100 border-amber-200'}\`}>{order.status || 'Pending'}</span>
                          </div>
                          <p className="font-extrabold text-slate-900 text-base">{order.items?.length || 0} Items <span className="text-purple-600">(৳{order.total?.toLocaleString()})</span></p>
                        </div>
                        {expandedOrder === order.id && (
                          <div className="p-4 border-t-2 border-slate-100 space-y-3">
                            <p className="text-xs font-bold text-slate-500 font-mono">তারিখ: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-GB') : 'Just now'}</p>
                            {order.deliveryETA ? (
                              <LiveCountdown deliveryETA={order.deliveryETA} />
                            ) : order.deliveryCountdownFormatted ? (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl animate-pulse">
                                <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">⏲️ ডেলিভারি সময়</p>
                                <p className="text-sm font-bold text-blue-900">ডেলিভারি সময়: <span className="font-black text-blue-700">{order.deliveryCountdownFormatted}</span></p>
                              </div>
                            ) : null}
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                              {order.paymentNumber && (
                                <p className="text-xs font-bold text-slate-600">
                                  <span className="uppercase text-[9px] tracking-widest font-black block text-slate-400">Payment Number:</span> 
                                  {order.paymentNumber}
                                </p>
                              )}
                              {order.transactionId && (
                                <p className="text-xs font-bold text-slate-600">
                                  <span className="uppercase text-[9px] tracking-widest font-black block text-slate-400">Transaction ID:</span> 
                                  <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-900">{order.transactionId}</span>
                                </p>
                              )}
                            </div>
                            {order.returnNote && (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">রিটেইলার বার্তা</p>
                                <p className="text-sm font-bold text-amber-900">{order.returnNote}</p>
                              </div>
                            )}
                            <button 
                              onClick={() => generatePDF({...order, shopName: shop.shopName, date: order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB') : ''})} 
                              disabled={isGeneratingPdf} 
                              className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-md disabled:opacity-50 relative overflow-hidden"
                            >
                              {isGeneratingPdf && <div className="absolute left-0 top-0 bottom-0 bg-purple-500/50 transition-all duration-300" style={{ width: \`\${pdfProgress}%\` }} />}
                              <span className="relative z-10 flex items-center gap-2">
                                {isGeneratingPdf ? <><Loader2 size={14} className="animate-spin" /> {pdfProgress}%</> : <><Download size={14} strokeWidth={2.5}/> ইনভয়েস ডাউনলোড (PDF)</>}
                              </span>
                            </button>


                          </div>
                        )}
                      </div>
                    ))}
                  </div>`;

const newOrderList = `                    ) : userOrders.map(order => (
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
                  </div>`;

if (pt.includes(oldOrderList)) {
  pt = pt.replace(oldOrderList, newOrderList);
  console.log('Fixed Drawer Accordion');
} else {
  console.log('NOT FOUND: Drawer Accordion');
}


// Replace the Order Success popup button
const oldSuccessButton = `            <button
              onClick={() => { generatePDF(orderSuccess); }}
              disabled={isGeneratingPdf}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-purple-600 transition-all shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] disabled:opacity-50 relative overflow-hidden"
            >
              {isGeneratingPdf && <div className="absolute left-0 top-0 bottom-0 bg-purple-500/50 transition-all duration-300" style={{ width: \`\${pdfProgress}%\` }} />}
              <span className="relative z-10 flex items-center gap-2">
                {isGeneratingPdf ? <><Loader2 size={18} className="animate-spin" /> {pdfProgress}%</> : <><Download size={18} strokeWidth={2.5}/> ইনভয়েস ডাউনলোড (PDF)</>}
              </span>
            </button>`;

const newSuccessButton = `            <button
              onClick={() => { 
                setOrderSuccess(null); 
                router.push(\`/shop/\${shop.shopSlug || shop.subdomainSlug}/order/\${orderSuccess.id}\`); 
              }}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-purple-600 transition-all shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] disabled:opacity-50 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                অর্ডার বিস্তারিত ও ইনভয়েস
              </span>
            </button>`;

if (pt.includes(oldSuccessButton)) {
  pt = pt.replace(oldSuccessButton, newSuccessButton);
  console.log('Fixed Success Popup');
} else {
  console.log('NOT FOUND: Success Popup');
}

fs.writeFileSync(shopPath, pt);
