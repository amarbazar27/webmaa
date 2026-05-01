const fs = require('fs');

let shopPath = 'd:/webmaa/src/app/shop/[shopSlug]/ShopClient.jsx';
let pt = fs.readFileSync(shopPath, 'utf8');

const oldFilter = `filteredProducts = products.filter(p =>
    (activeCategory === 'All' || activeCategory === 'সব' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );`;

const newFilter = `filteredProducts = products.filter(p =>
    (activeCategory === 'All' || activeCategory === 'সব' || p.category === activeCategory) &&
    (!activeSubcategory || p.subcategory === activeSubcategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );`;

if (pt.includes(oldFilter)) {
  pt = pt.replace(oldFilter, newFilter);
  fs.writeFileSync(shopPath, pt);
  console.log('Fixed Filter Logic');
} else {
  // try regex for slightly different spacing
  const regex = /filteredProducts = products\.filter\(p =>\s*\(\s*activeCategory === 'All' \|\| activeCategory === 'সব' \|\| p\.category === activeCategory\s*\) &&\s*\(\s*p\.name\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\|\s*p\.description\?\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)\s*\)\s*\);/m;
  if (regex.test(pt)) {
    pt = pt.replace(regex, newFilter);
    fs.writeFileSync(shopPath, pt);
    console.log('Fixed Filter Logic with regex');
  } else {
    console.log('Filter not found!');
  }
}
