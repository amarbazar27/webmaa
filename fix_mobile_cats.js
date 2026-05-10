const fs = require('fs');

let c = fs.readFileSync('src/app/shop/[shopSlug]/ShopClient.jsx', 'utf8');
c = c.replace(
  'className="hidden md:flex items-center gap-2 flex-nowrap overflow-x-auto scrollbar-hide"',
  'className="flex items-center gap-2 flex-nowrap overflow-x-auto scrollbar-hide w-full pb-2 md:pb-0"'
);
c = c.replace(
  '<button onClick={() => setIsCategoryMenuOpen(true)} className="md:hidden w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors shadow-sm">',
  '<button className="hidden">'
);
fs.writeFileSync('src/app/shop/[shopSlug]/ShopClient.jsx', c, 'utf8');
console.log('Mobile categories fixed!');
