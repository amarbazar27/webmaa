const fs = require('fs');
const file = 'src/app/shop/[shopSlug]/ShopClient.jsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Lines 1844-1862 (0-indexed: 1843-1861) need to be replaced
// Find exact line with "bg-slate-50 border border-slate-200 rounded-2xl p-3 flex gap-4 items-center"
let startLine = -1, endLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('rounded-2xl p-3 flex gap-4 items-center shadow-sm')) {
    startLine = i;
  }
  if (startLine > -1 && lines[i].trim() === '</div>' && i > startLine + 10 && endLine === -1) {
    // Check next line is ))
    if (lines[i+1] && lines[i+1].trim() === '))}'){ 
      endLine = i;
      break;
    }
  }
}
console.log('start:', startLine+1, 'end:', endLine+1);

if (startLine > -1 && endLine > -1) {
  const newBlock = [
    "                <div key={item.id} className=\"bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col gap-2 shadow-sm\">\r",
    "                  <div className=\"flex gap-3 items-center\">\r",
    "                    <div className=\"w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-slate-100\">\r",
    "                      {item.imageUrl ? <img src={item.imageUrl} className=\"w-full h-full object-cover\" alt=\"\" /> : <div className={`w-full h-full flex items-center justify-center ${getFallbackColor(item.name)}`}><p className=\"text-[10px] font-black text-white px-1 truncate\">{item.name}</p></div>}\r",
    "                    </div>\r",
    "                    <div className=\"flex-1 min-w-0\">\r",
    "                      <h4 className=\"font-black text-sm text-slate-900 truncate\">{item.name}</h4>\r",
    "                      <p className=\"font-black text-purple-700 text-sm mt-0.5\">\u09f3{(parseFloat(item.price) * item.quantity).toLocaleString()}</p>\r",
    "                      <div className=\"flex items-center gap-1.5 mt-1.5\">\r",
    "                        <button onClick={() => updateQuantity(item.id, -1)} className=\"w-7 h-7 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100\"><Minus size={12} strokeWidth={2.5}/></button>\r",
    "                        <input type=\"number\" min=\"0\" value={item.quantity} onChange={e => setQuantityDirect(item.id, e.target.value)} className=\"w-10 text-center text-sm font-black text-slate-900 bg-slate-50 border border-slate-200 rounded outline-none focus:border-purple-500\" />\r",
    "                        <button onClick={() => updateQuantity(item.id, 1)} className=\"w-7 h-7 bg-slate-900 text-white rounded flex items-center justify-center hover:bg-purple-600\"><Plus size={12} strokeWidth={2.5}/></button>\r",
    "                      </div>\r",
    "                    </div>\r",
    "                    <div className=\"flex flex-col gap-1\">\r",
    "                        <button onClick={() => { trackStoreEvent('select_content', { content_type: 'product', item_id: item.productId, name: item.name }); router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/product/${item.productId || item.id}`); setIsCartOpen(false); }} className=\"text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors p-2 rounded-lg\" title=\"Edit/Customize\"><Edit2 size={16} strokeWidth={2.5} /></button>\r",
    "                        <button onClick={() => removeFromCart(item.id)} className=\"text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-lg\" title=\"Remove\"><X size={16} strokeWidth={2.5} /></button>\r",
    "                    </div>\r",
    "                  </div>\r",
    "                  {/* Per-item note input - shows in order summary & PDF */}\r",
    "                  <input\r",
    "                    type=\"text\"\r",
    "                    placeholder=\"\u09aa\u09a3\u09cd\u09af\u09c7\u09b0 \u09ac\u09bf\u09b6\u09c7\u09b7 \u09a8\u09bf\u09b0\u09cd\u09a6\u09c7\u09b6... (\u09af\u09c7\u09ae\u09a8: \u09e8\u09eb\u09e6 \u0997\u09cd\u09b0\u09be\u09ae, \u09ab\u09cd\u09b0\u09c7\u09b6 \u09b0\u09be\u0996\u09ac\u09c7\u09a8)\"\r",
    "                    value={item.note || ''}\r",
    "                    onChange={e => updateItemNote(item.id, e.target.value)}\r",
    "                    className=\"w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-400 placeholder:text-slate-400\"\r",
    "                  />\r",
    "                </div>"
  ];
  
  lines.splice(startLine, endLine - startLine + 1, ...newBlock);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('SUCCESS: cart item note input added');
} else {
  console.log('Could not find block');
}
