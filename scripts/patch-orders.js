const fs = require('fs');

const filePath = 'd:/webmaa/src/app/dashboard/orders/page.js';
const c = fs.readFileSync(filePath, 'utf8');
const lines = c.split('\n');

console.log('Total lines before:', lines.length);
console.log('Line 261 (0-idx 260):', lines[260]);

const sp = '                                  ';
const sp2 = '                                    ';
const sp3 = '                                      ';
const sp4 = '                                        ';

const newLines = [
  sp + '<p className="text-xs font-bold text-slate-400">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString(\'en-GB\') : \'Just now\'}</p>\r',
  sp + '{/* Who confirmed / delivered this order */}\r',
  sp + '{(order.confirmedBy || order.deliveredBy || order.updatedBy) && (\r',
  sp2 + '<div className="flex flex-wrap gap-1.5 mt-1.5">\r',
  sp3 + '{order.confirmedBy && (\r',
  sp4 + '<span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">\r',
  sp4 + '  \u2713 Confirmed: {order.confirmedBy.name}\r',
  sp4 + '</span>\r',
  sp3 + ')}\r',
  sp3 + '{order.deliveredBy && (\r',
  sp4 + '<span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">\r',
  sp4 + '  \ud83d\ude9a Delivered: {order.deliveredBy.name}\r',
  sp4 + '</span>\r',
  sp3 + ')}\r',
  sp3 + '{!order.confirmedBy && !order.deliveredBy && order.updatedBy && (\r',
  sp4 + '<span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">\r',
  sp4 + '  \u21bb Updated: {order.updatedBy.name}\r',
  sp4 + '</span>\r',
  sp3 + ')}\r',
  sp2 + '</div>\r',
  sp + ')}\r',
  '                               </div>\r',
  '                            </div>\r'
];

// Line 260,261,262 are the 3 lines to replace (0-indexed)
lines.splice(260, 3, ...newLines);

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done. Total lines now:', lines.length);
