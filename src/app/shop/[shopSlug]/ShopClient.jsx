'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Search, X, Plus, Minus, Phone, MapPin, 
  CheckCircle, Package, ArrowRight, Loader2, ShoppingCart,
  User, Download, LogOut, ArrowUpDown, Bot, MessageCircle, AlertCircle, Share, Settings
} from 'lucide-react';
import { placeOrder } from '@/lib/firestore';
import { logoutUser, loginWithGoogle } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

function validatePhone(phone) {
  return /^01[3-9]\d{8}$/.test(phone.replace(/\s/g, ''));
}

// Deterministic bright colors for product fallbacks
const FALLBACK_COLORS = ['bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600', 'bg-fuchsia-600'];
function getFallbackColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export default function ShopClient({ initialShop, initialProducts, initialCategories }) {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [shop] = useState(initialShop);
  const [products] = useState(initialProducts);
  const [categories] = useState([{ id: 'all', name: 'সব' }, ...initialCategories]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest'); // 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest'
  
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '', note: '', txnId: '' });
  
  // 🛸 PWA Install Logic
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAppDownload = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      toast.success('অ্যাপটি ইতিমধ্যেই ইনস্টল করা আছে অথবা ব্রাউজার এটি সাপোর্ট করছে না।');
    }
  };

  // 📝 Fetch Real Order History
  useEffect(() => {
    if (user?.email && shop?.id) {
       import('@/lib/firestore').then(lib => {
          setLoadingOrders(true);
          lib.getUserOrders(shop.id, user.email)
             .then(setUserOrders)
             .finally(() => setLoadingOrders(false));
       });
    } else {
       setUserOrders([]);
    }
  }, [user, shop?.id]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('সফলভাবে লগআউট হয়েছে');
      setIsProfileOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error('লগআউট করতে সমস্যা হয়েছে');
    }
  };

  const handleGoogleLogin = async () => {
    try {
       await loginWithGoogle();
       toast.success('সফলভাবে লগইন হয়েছে!');
       setIsProfileOpen(false);
    } catch (err) {
       toast.error('লগইন করতে সমস্যা হয়েছে');
    }
  };

  // Smart Context-Aware AI Chat
  const [chatMessages, setChatMessages] = useState([{
    id: 1, role: 'bot',
    text: 'Hello! I am ' + (shop.aiConfig && shop.aiConfig.botName ? shop.aiConfig.botName : 'Bazar Bot') + ' — ' + shop.shopName + ' shopping assistant. Ask about products, delivery or payment!'
  }]);
  const [chatInput, setChatInput] = useState('');

  const getSmartBotReply = (text) => {
    const q = text.toLowerCase().trim();
    const shopName = shop.shopName || 'এই স্টোর';
    const deliveryFee = (shop.deliveryConfig && shop.deliveryConfig.advanceFee) ? shop.deliveryConfig.advanceFee : 60;
    const isCOD = shop.deliveryConfig ? shop.deliveryConfig.isCOD !== false : true;
    const payNums = (shop.deliveryConfig && shop.deliveryConfig.methods) ? shop.deliveryConfig.methods : 'bKash/Nagad';

    // ─── Keyword groups (English + Bangla) ───────────────────────
    const deliveryKW = [
      'delivery', 'charge', 'shipping', 'courier', 'cost', 'fee', 'how much',
      // বাংলা কীওয়ার্ড
      'ডেলিভারি', 'চার্জ', 'শিপিং', 'কুরিয়ার', 'কত টাকা', 'ডেলিভারি চার্জ',
      'কত দিতে হবে', 'খরচ কত', 'কত লাগবে', 'ডেলিভারি কত'
    ];
    const payKW = [
      'payment', 'bkash', 'nagad', 'pay', 'txn', 'transaction', 'number',
      // বাংলা কীওয়ার্ড
      'পেমেন্ট', 'বিকাশ', 'নগদ', 'পে', 'ট্রানজেকশন', 'কিভাবে দেব', 'টাকা দেব', 'কিভাবে পেমেন্ট'
    ];
    const returnKW = [
      'return', 'refund', 'exchange', 'replace',
      // বাংলা কীওয়ার্ড
      'রিটার্ন', 'ফেরত', 'এক্সচেঞ্জ', 'বদলানো', 'সমস্যা হলে', 'ফেরত দিতে পারব'
    ];
    const orderKW = [
      'order', 'status', 'track', 'where is',
      // বাংলা কীওয়ার্ড
      'অর্ডার', 'স্ট্যাটাস', 'ট্র্যাক', 'কোথায়', 'অর্ডার কোথায়', 'অর্ডার পেলাম না', 'অর্ডার চেক'
    ];
    const greetKW = [
      'hello', 'hi', 'hey', 'help', 'assist',
      // বাংলা কীওয়ার্ড
      'হ্যালো', 'হেলো', 'সালাম', 'আস্সালামু', 'হেল্প', 'সাহায্য', 'কেমন আছ', 'শুরু'
    ];
    const listKW = [
      'product', 'item', 'what do', 'show me', 'available', 'sell', 'have',
      // বাংলা কীওয়ার্ড
      'পণ্য', 'কি কি আছে', 'আইটেম', 'কি বিক্রি', 'দেখাও', 'লিস্ট', 'কি আছে',
      'কোনটা আছে', 'সব পণ্য', 'কোন পণ্য', 'কি পণ্য'
    ];
    const priceKW = [
      'price', 'rate', 'how much is',
      // বাংলা কীওয়ার্ড
      'দাম', 'মূল্য', 'রেট', 'কত দাম', 'দাম কত', 'এর দাম', 'কত টাকায়'
    ];

    // ─── Reply Logic ─────────────────────────────────────────────
    if (deliveryKW.some(kw => q.includes(kw))) {
      return isCOD
        ? `ডেলিভারি চার্জ: ৳${deliveryFee} (অগ্রিম)।\nবাকি Cash on Delivery। পেমেন্ট করুন: ${payNums} ✅`
        : `এই স্টোরে সম্পূর্ণ পেমেন্ট আগে দিতে হবে।\nডেলিভারি চার্জ সহ পেমেন্ট করুন: ${payNums} ✅`;
    }

    if (payKW.some(kw => q.includes(kw))) {
      return `পেমেন্ট করুন: ${payNums}\nপেমেন্টের পর Transaction ID (TxnID) অর্ডার ফর্মে দিন। 💳`;
    }

    // Product search - search within real products (name/category/description)
    const matched = products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
    if (matched.length > 0) {
      const names = matched.slice(0, 3).map(p => `${p.name} (৳${p.price})`).join('\n• ');
      return `হ্যাঁ! ${shopName}-এ আছে:\n• ${names}\n\nকার্টে যোগ করুন এবং অর্ডার করুন! 🛒`;
    }

    if (priceKW.some(kw => q.includes(kw))) {
      const sample = products.slice(0, 3).map(p => `${p.name}: ৳${p.price}`).join('\n• ');
      return products.length > 0
        ? `কিছু পণ্যের দাম:\n• ${sample}\n\nনির্দিষ্ট পণ্যের নাম লিখলে আরো সঠিক তথ্য দিতে পারব! 😊`
        : 'এই মুহূর্তে কোনো পণ্যের তথ্য নেই। দয়া করে পরে আবার চেক করুন।';
    }

    if (returnKW.some(kw => q.includes(kw))) {
      const waLink = (shop.socialLinks && shop.socialLinks.wa) ? `\nWhatsApp: wa.me/${shop.socialLinks.wa}` : '';
      return `পণ্য পাওয়ার ২৪ ঘণ্টার মধ্যে আমাদের সাথে যোগাযোগ করুন।${waLink} 🔁`;
    }

    if (greetKW.some(kw => q.includes(kw))) {
      return `আস্সালামু আলাইকুম! 👋 আমি ${shop.aiConfig?.botName || 'Bazar Bot'}।\n${shopName}-এ ${products.length}টি পণ্য আছে।\nকিভাবে সাহায্য করতে পারি?`;
    }

    if (orderKW.some(kw => q.includes(kw))) {
      return `অর্ডার স্ট্যাটাস দেখতে উপরের প্রোফাইল আইকনে (👤) ক্লিক করুন এবং Google দিয়ে লগইন করুন। 📦`;
    }

    if (listKW.some(kw => q.includes(kw))) {
      const sample = products.slice(0, 5).map(p => p.name).join(', ');
      return `${shopName}-এ মোট ${products.length}টি পণ্য আছে।\nযেমন: ${sample}${products.length > 5 ? '...' : ''}\n\nউপরে সার্চ করুন বা ক্যাটাগরি ফিল্টার করুন! 🔍`;
    }

    // Default fallback - বাংলায় উত্তর দেবে
    return `ধন্যবাদ প্রশ্নের জন্য! 😊\n"${text}" সম্পর্কে নিশ্চিত না।\n${shopName}-এ ${products.length}টি পণ্য আছে। পণ্যের নাম লিখলে খুঁজে দিতে পারব!`;
  };

  const sendChatMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setTimeout(() => {
      const botMsg = { id: Date.now() + 1, role: 'bot', text: getSmartBotReply(text) };
      setChatMessages(prev => [...prev, botMsg]);
    }, 700);
  };

  // ─── Filters & Sorting ─────────────────────
  let filteredProducts = products.filter(p =>
    (activeCategory === 'All' || activeCategory === 'সব' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  filteredProducts = filteredProducts.sort((a, b) => {
    if (sortOption === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
    if (sortOption === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
    if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
    if (sortOption === 'name_desc') return b.name.localeCompare(a.name);
    return 0;
  });

  // ─── Cart Actions ─────────────────────
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(prev => prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      toast.success(`${product.name} পরিমাণ বাড়ানো হয়েছে`);
    } else {
      setCart(prev => [...prev, { ...product, quantity: 1 }]);
      toast.success(`${product.name} কার্টে যোগ করা হয়েছে!`);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.reduce((acc, item) => {
      if (item.id !== id) return [...acc, item];
      const newQty = item.quantity + delta;
      if (newQty <= 0) return acc;
      return [...acc, { ...item, quantity: newQty }];
    }, []));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.error('কার্ট থেকে সরানো হয়েছে');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const deliveryAdvanceFee = shop.deliveryConfig?.advanceFee ? parseInt(shop.deliveryConfig.advanceFee) : 60;
  const isCOD = shop.deliveryConfig?.isCOD !== false; // true by default
  const isAdvanceRequired = !isCOD || (shop.deliveryConfig?.advanceFee && shop.deliveryConfig.advanceFee !== "0");
  const requiredAmount = isCOD ? deliveryAdvanceFee : (cartTotal + deliveryAdvanceFee);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setOrderForm(f => ({ ...f, phone: val }));
    if (val.length === 11 && !validatePhone(val)) {
      setPhoneError('বৈধ বাংলাদেশি নম্বর লিখুন (01X-XXXXXXXX)');
    } else {
      setPhoneError('');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!validatePhone(orderForm.phone)) {
      setPhoneError('বৈধ বাংলাদেশি নম্বর লিখুন। 01 দিয়ে শুরু করুন, মোট ১১ ডিজিট।');
      return;
    }
    setPlacing(true);
    try {
      const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '');
      const serialStr = Math.floor(Math.random() * 99).toString().padStart(2, '0');
      const orderIdVisual = `${serialStr}#${dateStr}`;

      await placeOrder(shop.id, {
        customerName: orderForm.name,
        customerPhone: orderForm.phone,
        customerEmail: user?.email || '', // Essential for history
        customerAddress: orderForm.address,
        customerNote: orderForm.note,
        transactionId: orderForm.txnId,
        orderIdVisual,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        total: cartTotal + deliveryAdvanceFee,
        isCOD,
        shopId: shop.id,
        shopName: shop.shopName,
      });
      toast.success('অর্ডার সফলভাবে দেওয়া হয়েছে! 🎉');
      setCart([]);
      setIsOrderOpen(false);
      setIsCartOpen(false);
      setOrderForm({ name: '', phone: '', address: '', note: '', txnId: '' });
      
      // Refresh orders in drawer
      if (user?.email) {
        import('@/lib/firestore').then(lib => {
          lib.getUserOrders(shop.id, user.email).then(setUserOrders);
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('অর্ডার দিতে ব্যর্থ হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setPlacing(false);
    }
  };

  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);
  
  // Expanded logic for profile order history
  const [expandedOrder, setExpandedOrder] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* ── Marquee Notice ── */}
      {shop.notices && (
        <div className="bg-purple-600 text-white py-2 overflow-hidden flex whitespace-nowrap border-b border-purple-700">
          <div className="animate-marquee font-bold text-sm tracking-wide">
            {shop.notices}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
            {/* Logo/Brand (Left) */}
            <div className="flex items-center gap-3">
               {shop.logoUrl ? (
                 <img src={shop.logoUrl} className="w-10 h-10 md:w-12 md:h-12 rounded-xl border border-slate-200 object-cover shadow-sm" alt="Logo" />
               ) : (
                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-sm text-xl">{shop.shopName?.[0]}</div>
               )}
               <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{shop.shopName}</h1>
            </div>

            {/* Actions (Right) */}
            <div className="flex items-center gap-3 md:gap-5">
               {/* 👨‍💼 Staff Dashboard Shortcut */}
               {userData?.role === 'staff' && userData?.accessShopId === shop.id && (
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-lg animate-pulse"
                  >
                     <Settings size={16} /> <span className="hidden sm:inline">প্যানেলে যান</span>
                  </button>
               )}

               <button onClick={handleAppDownload} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors shadow-sm">
                  <Download size={16} /> <span className="hidden sm:inline">অ্যাপ ডাউনলোড</span>
               </button>
               <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-xl transition-colors shadow-sm">
                  <ShoppingCart size={20} className="font-bold" />
                  {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-100 shadow-sm">{cartCount}</span>}
               </button>
               <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 md:w-11 md:h-11 aspect-square bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl transition-colors shadow-sm border border-purple-200 overflow-hidden flex items-center justify-center">
                  {user?.photoURL ? (
                     <img src={user.photoURL} className="w-full h-full object-cover aspect-square" alt="Profile" />
                  ) : (
                     <User size={20} className="font-bold" />
                  )}
               </button>
            </div>
         </div>
      </header>

      {/* ── Banner Section (20% height equivalent) ── */}
      <div className="relative h-[25vh] md:h-[30vh] w-full bg-slate-900 overflow-hidden border-b border-slate-200">
        {shop.coverImg ? (
           <img src={shop.coverImg} alt="Banner" className="w-full h-full object-cover opacity-85" />
        ) : (
           <div className="w-full h-full bg-gradient-to-r from-purple-800 via-purple-600 to-blue-700 flex items-center justify-center p-6 text-center shadow-inner">
              <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-xl tracking-tight">{shop.welcomeMessage || 'স্বাগতম আমাদের স্টোরে!'}</h2>
           </div>
        )}
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* ── HIGH UX: Search, Sort & Categories ON SAME ROW ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Search (Compact size) */}
          <div className="relative shrink-0 w-48 sm:w-56">
            <Search className="absolute left-3.5 top-3 text-slate-500" size={16} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="পণ্য খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 font-bold outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all text-sm placeholder:font-medium placeholder:text-slate-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Sort */}
          <div className="relative shrink-0">
             <ArrowUpDown size={14} className="absolute left-3 top-3.5 text-slate-500" strokeWidth={2.5} />
             <select 
               className="pl-9 pr-6 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 appearance-none cursor-pointer hover:bg-slate-200 transition-colors"
               value={sortOption}
               onChange={(e) => setSortOption(e.target.value)}
             >
                <option value="newest">সবচেয়ে নতুন</option>
                <option value="price_asc">কম মূল্য প্রথমে</option>
                <option value="price_desc">বেশি মূল্য প্রথমে</option>
                <option value="name_asc">নাম (A-Z)</option>
                <option value="name_desc">নাম (Z-A)</option>
             </select>
          </div>

          <div className="w-[1px] h-8 bg-slate-200 shrink-0 mx-1"></div>

          {/* Categories Row */}
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.name)}
              className={`shrink-0 whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-200 border ${
                activeCategory === c.name
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* ── Product Grid ── */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-300">
            <Package size={64} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
            <h3 className="text-2xl font-black text-slate-800">কোনো পণ্য পাওয়া যায়নি। 🥺</h3>
            <p className="text-slate-500 text-sm mt-3 font-semibold">অন্য ক্যাটাগরিতে খুঁজে দেখুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(product => {
              const cartItem = cart.find(i => i.id === product.id);
              return (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-slate-200 flex flex-col">
                  {/* Image with robust fallback matching Zatiq's exact requirement */}
                  <div className="relative h-48 sm:h-56 overflow-hidden bg-white border-b border-slate-100">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center p-4 text-center ${getFallbackColor(product.name)} bg-opacity-10 dark-fallback-bg`}>
                         <h3 className="text-xl md:text-2xl font-black text-white drop-shadow-md leading-tight">{product.name}</h3>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-xl text-sm font-black shadow-lg border border-slate-100/50">
                      ৳{product.price}
                    </div>
                  </div>

                  {/* Info + Actions */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white">
                    <h3 className="font-extrabold text-slate-900 text-[15px] leading-tight group-hover:text-purple-700 transition-colors line-clamp-2 md:line-clamp-none mb-2">{product.name}</h3>
                    <div className="flex-1"></div>
                    {/* Qty control if in cart, else Add button */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      {cartItem ? (
                        <div className="flex items-center justify-between gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-slate-900 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm font-black border border-slate-200 shrink-0"
                          ><Minus size={16} strokeWidth={2.5} /></button>
                          <span className="font-black text-purple-700 text-base w-full text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-sm font-black shrink-0"
                          ><Plus size={16} strokeWidth={2.5} /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full py-3 rounded-xl font-black text-sm bg-slate-900 text-white hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Plus size={16} strokeWidth={2.5} /> কার্টে যোগ করুন
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-300 py-12 mt-auto border-t-[6px] border-purple-600">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div>
               <h2 className="text-3xl font-black text-white">{shop.shopName}</h2>
               {shop.slogan && <p className="text-sm mt-2 font-bold text-slate-400">{shop.slogan}</p>}
            </div>
            
            <div className="space-y-4 pt-6 border-t border-slate-800 w-full max-w-md mx-auto">
               <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">আমাদের সাথে যুক্ত থাকুন</p>
               <div className="flex items-center justify-center gap-5">
                  {shop.socialLinks?.fb && <a href={shop.socialLinks.fb} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:scale-110 transition-all font-black shadow-lg">FB</a>}
                  {shop.socialLinks?.insta && <a href={shop.socialLinks.insta} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-pink-600 hover:text-white hover:scale-110 transition-all font-black shadow-lg">IG</a>}
                  {shop.socialLinks?.yt && <a href={shop.socialLinks.yt} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-red-600 hover:text-white hover:scale-110 transition-all font-black shadow-lg">YT</a>}
                  {shop.socialLinks?.wa && <a href={`https://wa.me/${shop.socialLinks.wa.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:scale-110 transition-all font-black shadow-lg">WA</a>}
               </div>
            </div>

            <div className="text-[10px] font-black uppercase tracking-[0.2em] pt-8 text-slate-600">
               &copy; {new Date().getFullYear()} {shop.shopName} - সর্বস্বত্ত্ব সংরক্ষিত।
            </div>
         </div>
      </footer>

      {/* ── AI Floating Companion ── */}
      <div className="fixed bottom-6 left-6 z-40 flex items-end gap-3 flex-row-reverse group">
         <button onClick={() => setIsAiOpen(true)} className="w-16 h-16 bg-purple-600 border-4 border-white rounded-full shadow-[0_10px_25px_rgba(147,51,234,0.5)] flex items-center justify-center animate-bounce hover:scale-110 transition-transform relative overflow-hidden group">
            <span className="text-3xl drop-shadow-md group-hover:rotate-12 transition-transform">🤖</span>
         </button>
         <div className="bg-slate-900 px-5 py-3 rounded-2xl rounded-br-none shadow-2xl border border-slate-700 text-sm font-black text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-2 ml-2">
            প্রশ্ন করুন! ✨
         </div>
      </div>

      {/* ── Modals & Drawers ── */}

      {/* App Download Modal - DELETED as per user request for direct prompt */}

      {/* AI Chat Modal (Active Logic Added) */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAiOpen(false)} />
           <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[60vh] max-h-[600px] border border-slate-200 animate-slide-in">
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b-[4px] border-purple-600">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-2xl">🤖</div>
                    <div>
                       <h3 className="font-black text-lg tracking-tight leading-tight">{shop.aiConfig?.botName || 'Bazar Bot'}</h3>
                       <p className="text-[10px] uppercase font-black text-purple-300 tracking-widest">{shop.aiConfig?.botTone === 'formal' ? 'Formal AI Assistant' : 'Friendly AI Assistant'}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsAiOpen(false)} className="hover:bg-white/20 p-2 rounded-xl text-slate-300 hover:text-white transition-colors"><X size={20} strokeWidth={2.5}/></button>
              </div>
              <div className="flex-1 p-5 bg-slate-50 flex flex-col gap-4 overflow-y-auto">
                 {chatMessages.map(msg => (
                   <div key={msg.id} className={`max-w-[85%] p-3.5 rounded-2xl text-sm font-bold shadow-sm ${msg.role === 'bot' ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none self-start' : 'bg-purple-600 text-white rounded-tr-none self-end'}`}>
                      {msg.text}
                   </div>
                 ))}
                 <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-200/50">
                    <button onClick={() => sendChatMessage("ডেলিভারি চার্জ কত?")} className="bg-white text-slate-600 hover:text-purple-700 hover:border-purple-600 px-3 py-2 rounded-lg text-[11px] font-black border border-slate-300 shadow-sm transition-all whitespace-nowrap">ডেলিভারি চার্জ কত?</button>
                    <button onClick={() => sendChatMessage("কি কি পণ্য আছে?")} className="bg-white text-slate-600 hover:text-purple-700 hover:border-purple-600 px-3 py-2 rounded-lg text-[11px] font-black border border-slate-300 shadow-sm transition-all whitespace-nowrap">কি কি পণ্য আছে?</button>
                    <button onClick={() => sendChatMessage("রিটার্ন পলিসি কী?")} className="bg-white text-slate-600 hover:text-purple-700 hover:border-purple-600 px-3 py-2 rounded-lg text-[11px] font-black border border-slate-300 shadow-sm transition-all whitespace-nowrap">রিটার্ন পলিসি</button>
                 </div>
              </div>
              <div className="p-3.5 bg-white border-t border-slate-200 flex gap-2">
                 <input 
                    type="text" 
                    placeholder="ম্যাসেজ লিখুন..." 
                    className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-colors placeholder:text-slate-400" 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage(chatInput)}
                 />
                 <button onClick={() => sendChatMessage(chatInput)} className="bg-slate-900 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors shadow-md"><MessageCircle size={20} strokeWidth={2.5}/></button>
              </div>
           </div>
        </div>
      )}

      {/* Cart Drawer - UX Fixed colors */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in border-l border-slate-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3"><ShoppingCart size={22} className="text-purple-600"/> আমার কার্ট</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-5 text-slate-300">
                  <ShoppingCart size={56} strokeWidth={1.5} />
                  <p className="font-extrabold text-slate-400">আপনার কার্ট খালি আছে</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex gap-4 items-center shadow-sm">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-slate-100">
                    {item.imageUrl
                      ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                      : <div className={`w-full h-full flex items-center justify-center ${getFallbackColor(item.name)} bg-opacity-20`}><p className="text-[10px] font-black text-white px-1 truncate leading-none text-center">{item.name}</p></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm text-slate-900 truncate">{item.name}</h4>
                    <p className="font-black text-purple-700 text-sm mt-0.5">৳{(parseFloat(item.price) * item.quantity).toLocaleString()}</p>
                    {/* Advanced Qty Controls */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <button onClick={() => updateQuantity(item.id, -5)} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-700 hover:bg-slate-100">-5</button>
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100"><Minus size={12} strokeWidth={2.5}/></button>
                      <span className="text-sm font-black text-slate-900 w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 bg-slate-900 text-white rounded flex items-center justify-center hover:bg-purple-600"><Plus size={12} strokeWidth={2.5}/></button>
                      <button onClick={() => updateQuantity(item.id, 5)} className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-black hover:bg-purple-600">+5</button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-lg">
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-600">
                    <span>প্রোডাক্ট মূল্য</span><span className="font-black text-slate-900">৳{cartTotal}</span>
                  </div>
                  <div className="flex justify-between items-end pt-3 border-t border-slate-200">
                    <span className="text-sm font-black text-slate-900">মোট (ডেলিভারি বাদে)</span>
                    <span className="text-2xl font-black text-purple-700">৳{cartTotal}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOrderOpen(true)}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-lg"
                >
                  পরবর্তী ধাপ <ArrowRight size={20} strokeWidth={2.5}/>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal - HIGH UX Forms FIX */}
      {isOrderOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOrderOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl h-[90vh] overflow-y-auto border border-slate-200 animate-slide-in">
            <div className="flex justify-between items-center sticky top-0 bg-white py-3 z-10 border-b-2 border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">চেকআউট</h2>
              <button onClick={() => setIsOrderOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-700"><X size={20} strokeWidth={2.5} /></button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-6 pt-2">
              <div className="space-y-4">
                 <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">পূর্নাঙ্গ নাম *</label>
                   <input required type="text" placeholder="আপনার নাম লিখুন..." className="w-full p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-black text-slate-900 outline-none focus:border-purple-600 focus:bg-white placeholder:font-bold placeholder:text-slate-400 transition-colors shadow-sm" value={orderForm.name} onChange={e => setOrderForm(f => ({ ...f, name: e.target.value }))} />
                 </div>
                 
                 <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">ফোন নম্বর *</label>
                   <input required type="tel" maxLength={11} placeholder="01XXXXXXXXX" className={`w-full p-3.5 rounded-xl bg-slate-50 border-2 ${phoneError ? 'border-red-500' : 'border-slate-200 focus:border-purple-600'} text-sm font-black text-slate-900 outline-none focus:bg-white placeholder:font-bold placeholder:text-slate-400 transition-colors shadow-sm`} value={orderForm.phone} onChange={handlePhoneChange} />
                   {phoneError && <p className="text-[11px] text-red-600 font-bold pl-1">{phoneError}</p>}
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">ঠিকানা *</label>
                   <textarea required rows={2} placeholder="বাসা/বাড়ি, রোড, এলাকা" className="w-full p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-black text-slate-900 outline-none focus:border-purple-600 focus:bg-white placeholder:font-bold placeholder:text-slate-400 transition-colors shadow-sm resize-none" value={orderForm.address} onChange={e => setOrderForm(f => ({ ...f, address: e.target.value }))} />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">কাস্টমার নোট (যদি থাকে)</label>
                   <textarea rows={2} placeholder="প্রোডাক্টের সাইজ, রং বা কোনো বিশেষ অনুরোধ..." className="w-full p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-black text-slate-900 outline-none focus:border-purple-600 focus:bg-white placeholder:font-bold placeholder:text-slate-400 transition-colors shadow-sm resize-none" value={orderForm.note} onChange={e => setOrderForm(f => ({ ...f, note: e.target.value }))} />
                 </div>
              </div>

              {isAdvanceRequired && (
                <div className="bg-purple-50 p-5 rounded-2xl border-2 border-purple-200 space-y-4">
                   <div className="flex items-start gap-3">
                     <AlertCircle size={20} className="text-purple-700 mt-0.5 shrink-0" strokeWidth={2.5} />
                     <p className="text-sm font-bold text-purple-900 leading-snug">
                        {isCOD 
                           ? <>আপনার অর্ডারটি নিশ্চিত করতে ডেলিভারি চার্জ বাবদ <span className="font-black text-lg text-purple-700 bg-white px-1.5 py-0.5 rounded shadow-sm mx-1">৳{deliveryAdvanceFee}</span> অগ্রিম প্রদান করতে হবে।</>
                           : <>এই স্টোরে Cash on Delivery বন্ধ আছে। অর্ডার নিশ্চিত করতে সর্বমোট <span className="font-black text-lg text-purple-700 bg-white px-1.5 py-0.5 rounded shadow-sm mx-1">৳{cartTotal + deliveryAdvanceFee}</span> পেমেন্ট করতে হবে।</>
                        }
                     </p>
                   </div>
                   <div className="bg-white px-3 py-2 rounded-xl border border-purple-100 shadow-sm inline-block">
                     <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-1">পেমেন্ট নাম্বার</p>
                     <p className="text-sm font-black text-purple-700">{shop.deliveryConfig?.methods}</p>
                   </div>
                   
                   <div className="space-y-1.5 pt-2">
                     <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">ট্রানজেকশন আইডি (TxnID) *</label>
                     <input required type="text" placeholder="বিকাশ/নগদ TxnID" className="w-full p-3.5 rounded-xl bg-white border-2 border-purple-300 text-sm font-black text-slate-900 outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/20 shadow-sm" value={orderForm.txnId} onChange={e => setOrderForm(f => ({ ...f, txnId: e.target.value }))} />
                   </div>
                </div>
              )}

              <div className="bg-slate-100 border-2 border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm text-slate-600 font-bold"><span>প্রোডাক্টস (x{cartCount})</span><span className="text-slate-900 font-black">৳{cartTotal}</span></div>
                <div className="flex justify-between text-sm text-slate-600 font-bold">
                   <span>ডেলিভারি চার্জ</span>
                   <span className="text-slate-900 font-black">৳{deliveryAdvanceFee}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200 font-black text-slate-900 text-xl">
                   <span>সর্বমোট</span><span className="text-purple-700 text-2xl">৳{cartTotal + deliveryAdvanceFee}</span>
                </div>
              </div>

              <button disabled={placing} type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-xl disabled:opacity-50 mt-4">
                {placing ? <><Loader2 className="animate-spin" size={20} /> প্রসেস হচ্ছে...</> : <><CheckCircle size={20} strokeWidth={2.5}/> অর্ডার প্লেস করুন</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Profile Modal (Expanded Details fixing readability) */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)} />
          <div className="relative w-full max-w-sm h-full bg-slate-50 shadow-2xl flex flex-col overflow-hidden animate-slide-in border-l border-slate-200">
             <div className="p-6 bg-slate-900 text-white flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl"></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                   <div className="w-16 h-16 aspect-square bg-white text-purple-700 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-white">
                      {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover aspect-square" /> : <p className="text-3xl font-black">{user?.displayName?.[0] || 'U'}</p>}
                   </div>
                   <button onClick={() => setIsProfileOpen(false)} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl transition-colors"><X size={18} strokeWidth={2.5}/></button>
                </div>
                <h3 className="text-2xl font-black relative z-10">{user ? (user.displayName || 'সম্মানিত কাস্টমার') : 'অতিথি ইউজার'}</h3>
                <div className="flex items-center justify-between relative z-10 mt-1">
                   <p className="text-sm text-slate-300 font-bold">{user ? user.email : 'লগইন করা নেই'}</p>
                   {userData?.loyaltyPoints !== undefined && (
                      <div className="flex items-center gap-1.5 bg-purple-600/40 px-2 py-1 rounded-lg border border-purple-400/30">
                         <span className="text-amber-400">✨</span>
                         <span className="text-xs font-black text-white">{userData.loyaltyPoints} Points</span>
                      </div>
                   )}
                </div>
             </div>
             
             <div className="flex-1 p-6 space-y-6 overflow-y-auto w-full">
                {!user ? (
                  <div className="flex flex-col items-center justify-center h-full gap-6 py-10">
                     <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <User size={40} />
                     </div>
                     <div className="text-center">
                        <p className="font-black text-slate-900 text-lg">আপনি লগইন করেননি</p>
                        <p className="text-xs text-slate-500 font-bold mt-1">আপনার অর্ডার ইতিহাস দেখতে গুগল দিয়ে লগইন করুন।</p>
                     </div>
                     <button onClick={handleGoogleLogin} className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center gap-3 font-black text-slate-800 hover:bg-slate-50 transition-all shadow-sm">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt=""/>
                        গুগল দিয়ে লগইন
                     </button>
                  </div>
                ) : (
                  <div className="w-full">
                     <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">ক্রয় ইতিহাস (Purchase History)</h4>
                     
                     <div className="space-y-4">
                        {loadingOrders ? (
                           <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                              <Loader2 className="animate-spin" size={24} />
                              <p className="text-[10px] font-black uppercase tracking-widest">অর্ডার লোড হচ্ছে...</p>
                           </div>
                        ) : userOrders.length === 0 ? (
                           <div className="text-center py-10 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
                              <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2" />
                              <p className="text-xs font-bold text-slate-400">কোনো অর্ডার ইতিহাস নেই</p>
                           </div>
                        ) : userOrders.map(order => (
                           <div key={order.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-purple-300 transition-colors cursor-pointer group" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                              <div className="p-4 bg-slate-50">
                                  <div className="flex justify-between items-center mb-1.5">
                                     <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-1 rounded-md border border-purple-200">#{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</span>
                                     <span className={`text-[11px] font-black px-2 py-1 rounded-md border ${
                                       order.status === 'completed' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' :
                                       order.status === 'cancelled' ? 'text-red-700 bg-red-100 border-red-200' :
                                       'text-amber-700 bg-amber-100 border-amber-200'
                                     }`}>{order.status || 'Pending'}</span>
                                  </div>
                                  <p className="font-extrabold text-slate-900 text-base">{order.items?.length || 0} Items <span className="text-purple-600">(৳{order.total?.toLocaleString()})</span></p>
                              </div>
                              {/* Expanded Area */}
                              {expandedOrder === order.id && (
                                 <div className="p-4 border-t-2 border-slate-100 space-y-4 animate-slide-in">
                                    <p className="text-xs font-bold text-slate-500 mb-2 font-mono">তারিখ: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-GB') : 'Just now'}</p>
                                    
                                    {order.returnNote && (
                                       <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">রিটেইলার বার্তা</p>
                                          <p className="text-sm font-bold text-amber-900 leading-snug">{order.returnNote}</p>
                                       </div>
                                    )}

                                    {order.deliveryCountdownFormatted && (
                                       <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                          <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">প্রত্যাশিত ডেলিভারি সময়</p>
                                          <p className="text-sm font-bold text-blue-900 leading-snug">{order.deliveryCountdownFormatted}</p>
                                       </div>
                                    )}

                                    <button onClick={() => window.open(`/shop/${shop.shopSlug}/invoice/${order.id}`, '_blank')} className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-md">
                                       <Download size={14} strokeWidth={2.5}/> ইনভয়েস ডাউনলোড (PDF)
                                    </button>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>

             {user && (
                <div className="p-5 border-t border-slate-200 bg-white">
                   <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 font-black text-sm rounded-xl hover:bg-red-600 hover:text-white border border-red-100 transition-all shadow-sm">
                      <LogOut size={18} strokeWidth={2.5}/> লগ আউট
                   </button>
                </div>
             )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes marquee { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
      ` }} />
    </div>
  );
}
