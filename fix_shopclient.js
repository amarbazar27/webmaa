const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/shop/[shopSlug]/ShopClient.jsx');
let c = fs.readFileSync(filePath, 'utf8');

// ── Fix 1: pending order toast (offline→online only) ──
c = c.replace(
  "  useEffect(() => {\r\n    if (isOnline) {\r\n      getPendingOrders().then(orders => {\r\n        if (orders && orders.length > 0) {\r\n          toast('",
  "  const prevOnlineRef = useRef(null);\r\n  useEffect(() => {\r\n    if (isOnline && prevOnlineRef.current === false) {\r\n      getPendingOrders().then(orders => {\r\n        if (orders && orders.length > 0) {\r\n          toast('"
);
// also add the ref update before closing bracket
c = c.replace(
  "    }\r\n    }, [isOnline]);",
  "    }\r\n    prevOnlineRef.current = isOnline;\r\n  }, [isOnline]);"
);

// ── Fix 2: customImage null → undefined (prevents validation crash) ──
c = c.replace(
  "customImage: orderImage || undefined,",
  "customImage: orderImage || undefined,"
);
// In case the first fix didn't run earlier
c = c.replace(
  "      customImage: orderImage,\r\n      coordinates: orderForm.coordinates",
  "      customImage: orderImage || undefined,\r\n      coordinates: orderForm.coordinates"
);

// ── Fix 3: Add aiTab state near other states ──
if (!c.includes('const [aiTab, setAiTab]')) {
  c = c.replace(
    "  const [isAiOpen, setIsAiOpen] = useState(false);",
    "  const [isAiOpen, setIsAiOpen] = useState(false);\r\n  const [aiTab, setAiTab] = useState('chat');"
  );
}

fs.writeFileSync(filePath, c, 'utf8');
console.log('ShopClient fixes applied!');
console.log('prevOnlineRef added:', c.includes('prevOnlineRef'));
console.log('aiTab state added:', c.includes('aiTab, setAiTab'));
console.log('customImage fixed:', c.includes('orderImage || undefined'));
