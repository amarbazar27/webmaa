const fs = require('fs');
const path = require('path');

const ordersPath = path.join(__dirname, 'src/app/dashboard/orders/page.js');
let c = fs.readFileSync(ordersPath, 'utf8');

// FIX 1: Add checkedItems state
c = c.replace(
  "  const [downloadingPdf, setDownloadingPdf] = useState(null);",
  "  const [checkedItems, setCheckedItems] = useState({});\n  const [downloadingPdf, setDownloadingPdf] = useState(null);"
);

// FIX 2: Replace the customer info box to include Phone, Payment Number, clickable Map link
const oldInfoBox = `                             <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                                <div className="flex items-start gap-3">
                                   <MapPin size={16} className="text-slate-400 shrink-0" />
                                   <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p><p className="text-xs font-bold text-slate-900 leading-relaxed">{order.customerAddress}</p></div>
                                </div>
                                {order.customerNote && (
                                  <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                                     <FileText size={16} className="text-amber-500 shrink-0" />
                                     <div><p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Customer Note</p><p className="text-xs font-bold text-amber-900">{order.customerNote}</p></div>
                                  </div>
                                )}
                                {order.transactionId && (
                                  <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                                     <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                     <div><p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Advance Txn ID</p><p className="text-xs font-black text-emerald-900 tracking-wider bg-emerald-100 px-2 rounded mt-1 inline-block border border-emerald-200">{order.transactionId}</p></div>
                                  </div>
                                )}
                             </div>`;

const newInfoBox = `                             <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                                <div className="flex items-start gap-3">
                                   <Phone size={16} className="text-blue-500 shrink-0" />
                                   <div><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Phone</p><a href={\`tel:\${order.customerPhone}\`} className="text-xs font-black text-blue-700 hover:underline">{order.customerPhone || 'N/A'}</a></div>
                                </div>
                                {order.paymentNumber && (
                                  <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                                     <Phone size={16} className="text-purple-500 shrink-0" />
                                     <div><p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Payment Number</p><p className="text-xs font-black text-purple-700">{order.paymentNumber}</p></div>
                                  </div>
                                )}
                                <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                                   <MapPin size={16} className="text-slate-400 shrink-0" />
                                   <div>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                                     <p className="text-xs font-bold text-slate-900 leading-relaxed">{order.customerAddress}</p>
                                     {order.coordinates?.link ? (
                                       <a href={order.coordinates.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-1.5 px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-md border border-blue-200 hover:bg-blue-100 transition-colors">
                                         <MapPin size={10} /> Google Map-\u098F \u09A6\u09C7\u0996\u09C1\u09A8
                                       </a>
                                     ) : null}
                                   </div>
                                </div>
                                {order.customerNote && (
                                  <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                                     <FileText size={16} className="text-amber-500 shrink-0" />
                                     <div><p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Customer Note</p><p className="text-xs font-bold text-amber-900">{order.customerNote}</p></div>
                                  </div>
                                )}
                                {order.transactionId && (
                                  <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                                     <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                     <div><p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Advance Txn ID</p><p className="text-xs font-black text-emerald-900 tracking-wider bg-emerald-100 px-2 rounded mt-1 inline-block border border-emerald-200">{order.transactionId}</p></div>
                                  </div>
                                )}
                             </div>`;

c = c.replace(oldInfoBox, newInfoBox);

// FIX 3: Add item checkboxes in PDF table area — replace product total line
const oldProductTotal = `                                <p className="text-xs font-black text-slate-500">{order.items?.length || 0} Products Total</p>`;
const newProductTotal = `                                {/* Item Checklist */}
                                <div className="space-y-1 mb-2">
                                  {(order.items || []).map((item, idx) => {
                                    const key = \`\${order.id}_\${idx}\`;
                                    const isChecked = checkedItems[key] || false;
                                    return (
                                      <label key={idx} className={\`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs font-bold transition-colors \${isChecked ? 'bg-emerald-50 text-emerald-700 line-through' : 'text-slate-700 hover:bg-slate-100'}\`}>
                                        <input type="checkbox" checked={isChecked} onChange={() => setCheckedItems(prev => ({...prev, [key]: !prev[key]}))} className="w-4 h-4 accent-emerald-600 rounded" />
                                        <span className="flex-1 truncate">{item.name}</span>
                                        <span className="shrink-0 font-black">×{item.quantity}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                <p className="text-xs font-black text-slate-500">{(order.items || []).filter((_, idx) => checkedItems[\`\${order.id}_\${idx}\`]).length}/{order.items?.length || 0} \u0995\u09C7\u09A8\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7</p>`;

c = c.replace(oldProductTotal, newProductTotal);

fs.writeFileSync(ordersPath, c, 'utf8');
console.log('[OK] Orders page updated: phone, payment number, map link, item checkboxes');
