const fs = require('fs');
const path = 'src/app/shop/[shopSlug]/ShopClient.jsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `  }, [isOnline]);

  const CART_KEY = \`cart_\${initialShop.id}\`;
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(CART_KEY);
      if (local) {
        setCart(JSON.parse(local));
      } else {
        loadCartIDB(initialShop.id).then(items => {
          if (items && items.length > 0) setCart(items);
        });
      }
    }
  }, [CART_KEY, initialShop.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && cart.length > 0) {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      saveCartIDB(initialShop.id, cart);
    }
  }, [cart, CART_KEY, initialShop.id]);

  const [isCartOpen, setIsCartOpen] = useState(false);`;

content = content.replace(/},\s*\[isOnline\]\);\s*const\s*\[isCartOpen,\s*setIsCartOpen\]\s*=\s*useState\(false\);/, replacement);

fs.writeFileSync(path, content);
console.log('Replaced via regex!');
