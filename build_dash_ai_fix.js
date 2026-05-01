const fs = require('fs');

let dashPath = 'd:/webmaa/src/app/dashboard/orders/page.js';
let pt = fs.readFileSync(dashPath, 'utf8');

const oldHtmlCartItem = `\${(order.items || []).map((item, i) => \`
              <tr style="border-bottom:1px solid #ccc;">
                <td style="padding:10px 12px;font-size:12px;font-weight:700;color:black">\${item.name}\${item.note ? \`<br><span style="font-size:10px;color:#555">\${item.note}</span>\` : ''}</td>`;

const newHtmlCartItem = `\${(order.items || []).map((item, i) => \`
              <tr style="border-bottom:1px solid #ccc;">
                <td style="padding:10px 12px;font-size:12px;font-weight:700;color:black">\${item.name}
                  \${item.customizedText ? \`<br><span style="font-size:10px;color:#555;font-weight:700;">→ Base: \${item.baseUnit || 'N/A'}</span><br><span style="font-size:10px;color:#9333ea;font-weight:900;">→ Customized: \${item.customizedText}</span>\` : (item.note ? \`<br><span style="font-size:10px;color:#555">\${item.note}</span>\` : '')}
                </td>`;

if (pt.includes(oldHtmlCartItem)) {
  pt = pt.replace(oldHtmlCartItem, newHtmlCartItem);
  console.log('Fixed dashboard PDF items HTML');
} else {
  console.log('NOT FOUND HTML');
}

const oldReactCartItem = `<p className="font-black text-slate-900 text-xs truncate max-w-[200px]">{item.name}</p>
                                          {item.note && <p className="text-[10px] font-bold text-slate-400 italic truncate max-w-[200px]">{item.note}</p>}`;

const newReactCartItem = `<p className="font-black text-slate-900 text-xs truncate max-w-[200px]">{item.name}</p>
                                          {item.customizedText ? (
                                            <div className="mt-0.5">
                                              {item.baseUnit && <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">→ Base: {item.baseUnit}</p>}
                                              <p className="text-[9px] font-black uppercase tracking-widest text-purple-600">→ Customized: {item.customizedText}</p>
                                            </div>
                                          ) : item.note ? (
                                            <p className="text-[10px] font-bold text-slate-400 italic truncate max-w-[200px]">{item.note}</p>
                                          ) : null}`;

if (pt.includes(oldReactCartItem)) {
  pt = pt.replace(oldReactCartItem, newReactCartItem);
  console.log('Fixed dashboard React items UI');
} else {
  // Regex
  const regex = /<p className="font-black text-slate-900 text-xs truncate max-w-\[200px\]">\{item\.name\}<\/p>\s*\{item\.note && <p className="text-\[10px\] font-bold text-slate-400 italic truncate max-w-\[200px\]">\{item\.note\}<\/p>\}/s;
  if (regex.test(pt)) {
    pt = pt.replace(regex, newReactCartItem);
    console.log('Fixed dashboard React items UI (regex)');
  } else {
    console.log('NOT FOUND React UI');
  }
}

fs.writeFileSync(dashPath, pt);
