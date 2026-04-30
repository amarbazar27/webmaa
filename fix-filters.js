const fs = require('fs');
const path = 'src/app/shop/[shopSlug]/ShopClient.jsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const [categories] = useState(initialCategories || []);`;
const replacement = `  const [categories] = useState(initialCategories || []);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content);
  console.log('Successfully restored activeCategory, searchTerm, and sortOption!');
} else {
  console.log('Target not found!');
}
