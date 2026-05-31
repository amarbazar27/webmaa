"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Search, Star, ArrowRight, Phone, Store,
  X, Loader2, CheckCircle, Sparkles, Package, ChevronRight,
  ShoppingCart, Plus, Minus, Trash2, Filter, Globe, ArrowUpRight,
  MessageCircle, Mail, ArrowUp, ArrowDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logoutUser, loginWithGoogle } from '@/lib/auth';
import { subscribeGlobalConfig, getAllMarketplaceProducts, getShopBySlug } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import AiShoppingList from '@/components/shop/AiShoppingList';

// Common Phonetic Transliteration Dictionary for English-to-Bengali product searches
const COMMON_PHONETIC_DICT = {
  'alu': 'আলু',
  'potol': 'পটল',
  'peyaj': 'পেঁয়াজ',
  'peyaz': 'পেঁয়াজ',
  'piyaj': 'পেঁয়াজ',
  'piyaz': 'পেঁয়াজ',
  'ada': 'আদা',
  'roshun': 'রসুন',
  'rosun': 'রসুন',
  'gajor': 'গাজর',
  'gajur': 'গাজর',
  'chal': 'চাল',
  'dal': 'ডাল',
  'tel': 'তেল',
  'dim': 'ডিম',
  'dudh': 'দুধ',
  'murgi': 'মুরগি',
  'goru': 'গরু',
  'khashi': 'খাসি',
  'khasi': 'খাসি',
  'mach': 'মাছ',
  'mas': 'মাছ',
  'lobon': 'লবণ',
  'nobon': 'লবণ',
  'masala': 'মসলা',
  'moshla': 'মসলা',
  'morich': 'মরিচ',
  'mors': 'মরিচ',
  'holud': 'হলুদ',
  'jira': 'জিরা',
  'lebu': 'লেবু',
  'kola': 'কলা',
  'am': 'আম',
  'kathal': 'কাঁঠাল',
  'pepe': 'পেঁপে',
  'tomato': 'টমেটো',
  'ghee': 'ঘি',
  'modhu': 'মধু',
  'chini': 'চিনি',
  'sobji': 'সবজি',
  'shobji': 'সবজি',
  'torkari': 'তরকারি',
  'gos': 'মাংস',
  'mangsho': 'মাংস',
  'pani': 'पानी',
  'jol': 'জল',
  'cha': 'চা',
  'coffee': 'কফি',
  'kopi': 'কপি',
  'cabbage': 'বাঁধাকপি',
  'bandhakopi': 'বাঁধাকপি',
  'fulkopi': 'ফুলকপি',
  'cauliflower': 'ফুলকপি',
  'lau': 'লাউ',
  'kumra': 'কুমড়া',
  'kumro': 'কুমড়া',
  'begun': 'বেগুন',
  'khero': 'ক্ষীরা',
  'shosa': 'শসা',
  'sosa': 'শসা',
  'krola': 'করলা',
  'korola': 'করলা',
  'bhendi': 'ঢেঁড়স',
  'dherosh': 'ঢেঁড়স',
  'dheros': 'ঢেঁড়স'
};

// Vowel-insensitive character normalization for phonetic translit matches
function normalizePhonetic(text) {
  if (!text) return '';
  let t = text.toLowerCase().trim();
  
  const banglaToEnglishMap = {
    'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'r',
    'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'g',
    'চ': 'ch', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'r', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
    'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'r', 'ে': 'e',
    'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', '্য': 'y', '্র': 'r', 'র্': 'r', '্ব': 'b'
  };
  
  let mappedStr = '';
  for (let i = 0; i < t.length; i++) {
    const char = t[i];
    mappedStr += banglaToEnglishMap[char] || char;
  }
  
  mappedStr = mappedStr
    .replace(/sh/g, 's')
    .replace(/ph/g, 'f')
    .replace(/kh/g, 'k')
    .replace(/bh/g, 'b')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/ch/g, 'c')
    .replace(/gh/g, 'g')
    .replace(/z/g, 'j')
    .replace(/c/g, 'k');
    
  let vowelLess = '';
  for (let i = 0; i < mappedStr.length; i++) {
    const char = mappedStr[i];
    if (!['a', 'e', 'i', 'o', 'u', 'y', 'w', 'h'].includes(char)) {
      vowelLess += char;
    }
  }
  return vowelLess;
}

export default function Home() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [loggingIn, setLoggingIn] = useState(false);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
 
  // ── Marketplace & Cart States ──
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeShopFilter, setActiveShopFilter] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');

  // ── Superadmin own shop dynamic settings ──
  const [mainShopData, setMainShopData] = useState(null);
  const [activeBanner, setActiveBanner] = useState(0);

  // Helper to resolve custom domain redirection links
  const getStoreLink = (shopSlug, customDomain, domainStatus) => {
    if (customDomain && domainStatus === 'connected') {
      return `https://${customDomain}`;
    }
    return `/${shopSlug}`;
  };

  // Load products, global config, superadmin shop & cart on mount
  useEffect(() => {
    getAllMarketplaceProducts().then(data => {
      setProducts(data);
      setProductsLoading(false);
    }).catch(err => {
      console.error(err);
      setProductsLoading(false);
    });

    getShopBySlug('daripallah-store').then(shopData => {
      if (shopData) {
        // Normalize banners array if elements are raw image strings
        const normalized = (shopData.banners || []).map(b => {
          if (typeof b === 'string') {
            return { url: b, title: '', description: '', linkUrl: '', buttonText: '' };
          }
          return {
            url: b?.url || '',
            title: b?.title || '',
            description: b?.description || '',
            linkUrl: b?.linkUrl || '',
            buttonText: b?.buttonText || ''
          };
        });
        setMainShopData({ ...shopData, banners: normalized });
      }
    }).catch(err => console.error("Error loading superadmin settings:", err));

    const localCart = localStorage.getItem('cart_daripallah-store');
    if (localCart) {
      try {
        setCart(JSON.parse(localCart));
      } catch (e) {
        setCart([]);
      }
    }

    return subscribeGlobalConfig(setGlobalConfig);
  }, []);

  // Custom banner slider interval timer
  useEffect(() => {
    if (!mainShopData?.banners || mainShopData.banners.length <= 1) return;
    const intervalTime = (mainShopData.bannerInterval || 4) * 1000;
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % mainShopData.banners.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [mainShopData?.banners, mainShopData?.bannerInterval]);

  // Update mouse position for glowing cursor effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const getDashboardHref = () => {
    if (userData?.role === 'superadmin') return '/superadmin';
    if (userData?.role === 'retailer') return '/dashboard';
    if (userData?.role === 'staff') return '/dashboard';
    return null;
  };

  const handleSmartLogin = async () => {
    setLoggingIn(true);
    try {
      const result = await loginWithGoogle();
      if (!result) return;
      
      const role = result?.userData?.role;
      if (role === 'superadmin') router.push('/superadmin');
      else if (role === 'retailer' || role === 'staff') router.push('/dashboard');
      else toast.success(`স্বাগতম, ${result.user.displayName}!`);
    } catch (err) {
      console.error("[SmartLogin] Error:", err);
      toast.error(err.message || 'লগইন করতে সমস্যা হয়েছে।');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleAddToCart = (product) => {
    let updatedCart = [...cart];
    const existingIndex = updatedCart.findIndex(item => item.productId === product.id);
    
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({
        id: `${product.id}_${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        quantity: 1,
        imageUrl: product.imageUrl || '',
        shopId: product.shopId,
        shopName: product.shopName,
        shopSlug: product.shopSlug,
        customDomain: product.customDomain || '',
        domainStatus: product.domainStatus || '',
        isThirdParty: product.shopSlug !== 'daripallah-store'
      });
    }
    setCart(updatedCart);
    localStorage.setItem('cart_daripallah-store', JSON.stringify(updatedCart));

    // Sync to individual store cart in localStorage
    const storeCartKey = `cart_${product.shopId}`;
    try {
      const storeCart = JSON.parse(localStorage.getItem(storeCartKey) || '[]');
      const storeExistingIdx = storeCart.findIndex(item => item.productId === product.id);
      if (storeExistingIdx > -1) {
        storeCart[storeExistingIdx].quantity += 1;
      } else {
        storeCart.push({
          id: `${product.id}_${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          clientPrice: Number(product.price) || 0,
          quantity: 1,
          imageUrl: product.imageUrl || '',
          note: '',
          isCustomized: false,
          customizedText: '',
          variantsText: ''
        });
      }
      localStorage.setItem(storeCartKey, JSON.stringify(storeCart));
    } catch (err) {
      console.error('Failed to sync individual shop cart:', err);
    }

    toast.success(`${product.name} কার্টে যোগ হয়েছে! 🛒`);
  };

  const updateCartQty = (productId, amount) => {
    let updatedCart = cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);

    setCart(updatedCart);
    localStorage.setItem('cart_daripallah-store', JSON.stringify(updatedCart));

    const item = cart.find(i => i.productId === productId);
    if (item) {
      const storeCartKey = `cart_${item.shopId}`;
      try {
        let storeCart = JSON.parse(localStorage.getItem(storeCartKey) || '[]');
        storeCart = storeCart.map(si => {
          if (si.productId === productId) {
            const newQty = si.quantity + amount;
            return newQty > 0 ? { ...si, quantity: newQty } : null;
          }
          return si;
        }).filter(Boolean);
        localStorage.setItem(storeCartKey, JSON.stringify(storeCart));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const removeFromCart = (productId) => {
    const item = cart.find(i => i.productId === productId);
    const updatedCart = cart.filter(i => i.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart_daripallah-store', JSON.stringify(updatedCart));

    if (item) {
      const storeCartKey = `cart_${item.shopId}`;
      try {
        let storeCart = JSON.parse(localStorage.getItem(storeCartKey) || '[]');
        storeCart = storeCart.filter(si => si.productId !== productId);
        localStorage.setItem(storeCartKey, JSON.stringify(storeCart));
      } catch (e) {
        console.error(e);
      }
    }
    toast.success('পণ্যটি কার্ট থেকে সরানো হয়েছে');
  };

  const clearCart = () => {
    cart.forEach(item => {
      localStorage.removeItem(`cart_${item.shopId}`);
    });
    setCart([]);
    localStorage.removeItem('cart_daripallah-store');
    toast.success('কার্ট খালি করা হয়েছে');
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // Group items by shop for dynamic third-party cart segmenting
  const thirdPartyItemsByShop = cart.reduce((acc, item) => {
    if (item.isThirdParty) {
      if (!acc[item.shopId]) {
        acc[item.shopId] = {
          shopName: item.shopName,
          shopSlug: item.shopSlug,
          customDomain: item.customDomain || '',
          domainStatus: item.domainStatus || '',
          items: []
        };
      }
      acc[item.shopId].items.push(item);
    }
    return acc;
  }, {});

  const webmaaStoreItems = cart.filter(item => !item.isThirdParty);
  const webmaaStoreTotal = webmaaStoreItems.reduce((t, i) => t + i.price * i.quantity, 0);

  const handleCheckoutWebmaa = () => {
    const superadminItem = cart.find(i => !i.isThirdParty);
    const slug = superadminItem ? superadminItem.shopSlug : 'daripallah-store';
    router.push(`/shop/${slug}`);
    setIsCartOpen(false);
  };

  // Dynamic Contact Formats
  const getFormattedContactUrl = (url, type) => {
    if (!url) return '#';
    const cleanNum = url.replace(/[^0-9]/g, '');
    if (type === 'whatsapp' || url.includes('wa.me') || cleanNum.length >= 10) {
      const withCountry = cleanNum.startsWith('88') ? cleanNum : `88${cleanNum}`;
      return `https://wa.me/${withCountry}`;
    }
    return url;
  };

  // ── Merchant-Category Filter Double Flow ──
  const uniqueShops = ['All', ...Array.from(new Set(products.map(p => p.shopName).filter(Boolean)))];

  const availableCategories = ['All', ...Array.from(new Set(
    products
      .filter(p => activeShopFilter === 'All' || p.shopName === activeShopFilter)
      .map(p => p.category)
      .filter(Boolean)
  ))];

  const availableSubcategories = Array.from(new Set(
    products
      .filter(p => (activeShopFilter === 'All' || p.shopName === activeShopFilter) &&
                   (activeCategory === 'All' || p.category === activeCategory))
      .map(p => p.subcategory)
      .filter(Boolean)
  ));

  // Reset category filters if shop filter makes them invalid
  useEffect(() => {
    if (!availableCategories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [activeShopFilter, products]);

  useEffect(() => {
    if (!availableSubcategories.includes(activeSubcategory)) {
      setActiveSubcategory('');
    }
  }, [activeCategory, activeShopFilter, products]);

  // Phonetic transliteration match engine
  const matchPhoneticSearch = (product, queryText) => {
    if (!queryText) return true;
    const q = queryText.toLowerCase().trim();
    
    const prodName = (product.name || '').toLowerCase().trim();
    const prodCategory = (product.category || '').toLowerCase().trim();
    const prodShop = (product.shopName || '').toLowerCase().trim();
    
    if (prodName.includes(q) || prodCategory.includes(q) || prodShop.includes(q)) {
      return true;
    }
    
    // Check phonetic dict matches
    for (const [eng, bng] of Object.entries(COMMON_PHONETIC_DICT)) {
      if (q.includes(eng) && prodName.includes(bng)) {
        return true;
      }
    }
    
    // Vowel-insensitive character transliteration
    const qNorm = normalizePhonetic(q);
    if (qNorm.length >= 2) {
      const nameNorm = normalizePhonetic(prodName);
      const catNorm = normalizePhonetic(prodCategory);
      if (nameNorm.includes(qNorm) || catNorm.includes(qNorm)) {
        return true;
      }
    }
    
    return false;
  };

  // Compile active products list based on hierarchy & search options
  let filteredProducts = products.filter(p => {
    const matchesShop = activeShopFilter === 'All' || p.shopName === activeShopFilter;
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSubcategory = !activeSubcategory || p.subcategory === activeSubcategory;
    const matchesSearch = !productSearch || matchPhoneticSearch(p, productSearch);
    return matchesShop && matchesCategory && matchesSubcategory && matchesSearch;
  });

  // Sort products
  filteredProducts = filteredProducts.sort((a, b) => {
    if (sortOption === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
    if (sortOption === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
    if (sortOption === 'name_desc') return b.name.localeCompare(a.name, 'bn');
    if (sortOption === 'newest') return (b.createdAt ? new Date(b.createdAt) : 0) - (a.createdAt ? new Date(a.createdAt) : 0);
    return a.name.localeCompare(b.name, 'bn');
  });

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#070e24] via-[#091535] to-[#040a17] text-slate-100 selection:bg-purple-900 selection:text-white font-sans overflow-x-hidden pb-10">
      
      {/* ── Keyframe Injector ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animation-delay-2000 { animation-delay: 2.5s; }
        .animation-delay-4000 { animation-delay: 5s; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .hero-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.06) 0%, transparent 60%);
        }
      `}} />

      {/* ── Dynamic Cursor Glow ── */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.04), transparent 40%)`
        }}
      />

      {/* ── Background Blobs ── */}
      <div className="fixed inset-0 -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay" />
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] animate-blob" />
      <div className="fixed top-[-15%] right-[-5%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] animate-blob animation-delay-2000" />
      <div className="fixed bottom-[-15%] left-[10%] w-[600px] h-[600px] bg-pink-600/800 opacity-[0.05] rounded-full blur-[140px] animate-blob animation-delay-4000" />

      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center glass-panel rounded-full px-8 py-4 shadow-2xl">
          <div className="flex items-center gap-3">
            {mainShopData?.logoUrl ? (
              <img src={mainShopData.logoUrl} className="h-9 object-contain" alt="Logo" />
            ) : (
              <Logo href="/" className="text-white scale-110" text="daripallah.com" />
            )}
          </div>

          <div className="flex items-center gap-6">
            <a href="#marketplace" className="text-[11px] font-black text-white/50 hover:text-white uppercase tracking-[0.2em] transition-all hidden md:block">Marketplace</a>
            <Link href="/showcase" className="text-[11px] font-black text-white/50 hover:text-white uppercase tracking-[0.2em] transition-all">Showcase</Link>
            
            <div className="w-[1px] h-4 bg-white/10" />
            
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all hover:scale-105 flex items-center justify-center cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingCart size={16} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-1" />

            {user && getDashboardHref() ? (
              <Link href={getDashboardHref()} className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-full text-xs font-black hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                Workspace
              </Link>
            ) : !user ? (
              <button onClick={handleSmartLogin} disabled={loggingIn} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-full text-xs font-black hover:bg-purple-500 hover:scale-105 transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                {loggingIn ? "Connecting..." : "Portal Login"}
              </button>
            ) : (
              <button onClick={logoutUser} className="text-[11px] font-black text-red-400/80 hover:text-red-400 uppercase tracking-[0.2em] transition-all">Sign Out</button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section (Dynamic Banners Slider) ── */}
      <section className="relative z-20 pt-32 pb-12 px-6 overflow-hidden">
        {mainShopData?.banners && mainShopData.banners.length > 0 ? (
          <div className="max-w-7xl mx-auto relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group/banner" style={{ minHeight: '380px' }}>
            {mainShopData.banners.map((banner, i) => {
              const isActive = i === activeBanner;
              const bannerUrl = banner.url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80';
              const bannerTitle = banner.title || (mainShopData.shopName || 'Daripallah Store');
              const bannerDesc = banner.description || (mainShopData.slogan || 'Your premium shopping destination.');
              const bannerLink = banner.linkUrl || '#marketplace';
              const bannerBtn = banner.buttonText || 'কেনাকাটা করুন';
              
              return (
                <div 
                  key={i} 
                  className={`absolute inset-0 w-full h-full transition-all duration-1000 ${
                    isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 via-slate-900/60 to-blue-900/40 z-10" />
                  <img 
                    src={bannerUrl} 
                    alt={bannerTitle} 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  <div className="relative z-20 px-8 py-20 md:p-24 flex flex-col justify-center items-start h-full max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[9px] font-black text-purple-400 uppercase tracking-widest mb-6">
                      <Sparkles size={12} /> VERIFIED MERCHANDISE NETWORK
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-tight whitespace-pre-line">
                      {bannerTitle}
                    </h1>
                    <p className="text-white/70 text-sm md:text-base max-w-xl mb-8 font-bold leading-relaxed whitespace-pre-line">
                      {bannerDesc}
                    </p>
                    <a 
                      href={bannerLink} 
                      className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-purple-600 text-black hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      {bannerBtn} <ArrowRight size={16} />
                    </a>
                  </div>
                </div>
              );
            })}
            
            {/* Slider controls */}
            {mainShopData.banners.length > 1 && (
              <>
                <button 
                  onClick={() => setActiveBanner(prev => (prev === 0 ? mainShopData.banners.length - 1 : prev - 1))} 
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all opacity-0 group-hover/banner:opacity-100 hover:scale-110 active:scale-95"
                >
                  ❮
                </button>
                <button 
                  onClick={() => setActiveBanner(prev => (prev === mainShopData.banners.length - 1 ? 0 : prev + 1))} 
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all opacity-0 group-hover/banner:opacity-100 hover:scale-110 active:scale-95"
                >
                  ❯
                </button>
                
                {/* Dots indicator */}
                <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center gap-2">
                  {mainShopData.banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveBanner(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        idx === activeBanner ? 'bg-white w-6' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl animate-fade-in" style={{ minHeight: '340px' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-blue-900/40 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80" 
              alt="Daripallah Banner" 
              className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm opacity-50"
            />
            <div className="relative z-20 px-8 py-20 md:p-24 flex flex-col justify-center items-start h-full max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-6">
                <Sparkles size={12} /> verified multi-store network
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
                Shop Directly From<br />
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Verified Local Stores.</span>
              </h1>
              <p className="text-white/60 text-base md:text-lg max-w-xl mb-8 font-medium">
                Browse through our comprehensive retailer network. Products are fetched in real-time from store databases with secure checkout.
              </p>
              <a href="#marketplace" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black text-sm rounded-2xl shadow-xl hover:scale-105 transition-all">
                Start Shopping <ArrowRight size={16} />
              </a>
            </div>
          </div>
        )}
      </section>

      {/* ── Marketplace Section ── */}
      <section id="marketplace" className="relative z-20 max-w-7xl mx-auto px-6 py-12 scroll-mt-24">
        
        {/* ── AI Shopping List Integration ── */}
        {mainShopData && (
          <div className="mb-12">
            <AiShoppingList 
              shop={mainShopData} 
              products={products} 
              onAddToCart={(items) => {
                if (Array.isArray(items)) {
                  items.forEach(item => handleAddToCart(item));
                } else {
                  handleAddToCart(items);
                }
              }} 
              onDirectOrder={(items) => {
                if (Array.isArray(items)) {
                  items.forEach(item => handleAddToCart(item));
                } else {
                  handleAddToCart(items);
                }
                setIsCartOpen(true);
              }}
            />
          </div>
        )}

        {/* Header and search panel */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-6 border-b border-white/5 pb-8">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3">
              Explore Our Marketplace
            </h2>
            <p className="text-xs text-white/40 font-bold uppercase tracking-wider">
              Browse products uploaded live across all registered merchants. Real-time stock, secure shopping.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:max-w-xl items-center shrink-0">
            {/* Search bar */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-3.5 text-white/30" size={15} />
              <input
                type="text"
                placeholder="Search products (English letter/Bangla both work)..."
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-white/20 transition-all shadow-inner"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
              />
            </div>
            
            {/* Sort options */}
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer select-arrow hover:bg-white/10 shadow-inner"
            >
              <option value="name_asc" className="bg-[#0b132b]">নাম অনুযায়ী (A→Z)</option>
              <option value="price_asc" className="bg-[#0b132b]">দাম (কম থেকে বেশি)</option>
              <option value="price_desc" className="bg-[#0b132b]">দাম (বেশি থেকে কম)</option>
              <option value="name_desc" className="bg-[#0b132b]">নাম অনুযায়ী (Z→A)</option>
              <option value="newest" className="bg-[#0b132b]">নতুন পণ্য</option>
            </select>
          </div>
        </div>

        {/* ── Restructured Double Flow Filter Pills (Merchant FIRST, then Category) ── */}
        <div className="flex flex-col gap-6 mb-12 bg-white/[0.01] border border-white/5 rounded-3xl p-6 shadow-2xl">
          
          {/* 1. Merchants Filter (Top Flow) */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">১. বিক্রেতা বা মার্চেন্ট (Merchant)</span>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {uniqueShops.map(shop => {
                const isSelected = activeShopFilter === shop;
                return (
                  <button
                    key={shop}
                    onClick={() => setActiveShopFilter(shop)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border shrink-0 flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:bg-purple-500'
                        : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                    }`}
                  >
                    <Store size={12} />
                    {shop === 'All' ? 'সব স্টোর (All Stores)' : shop}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Category Filter (Second Flow - Dynamically filtered to only show active merchant's categories) */}
          <div className="flex flex-col gap-2.5 border-t border-white/5 pt-5">
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">২. ক্যাটাগরি বা শ্রেণী (Category)</span>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {availableCategories.map(cat => {
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-slate-900 border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-white/90'
                        : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                    }`}
                  >
                    {cat === 'All' ? 'সব ক্যাটাগরি (All Categories)' : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Subcategories Filter (Third Flow - show only if active merchant/category has subcategories) */}
          {availableSubcategories.length > 0 && (
            <div className="flex flex-col gap-2.5 border-t border-white/5 pt-5 animate-fade-in">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">৩. সাব-ক্যাটাগরি (Subcategory)</span>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                <button
                  onClick={() => setActiveSubcategory('')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                    !activeSubcategory
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  সব সাব-ক্যাটাগরি
                </button>
                {availableSubcategories.map(sub => {
                  const isSelected = activeSubcategory === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => setActiveSubcategory(sub)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Product Showcase Grid (Premium 6-column Layout) */}
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="glass-panel border-white/5 rounded-3xl p-4 space-y-4">
                <div className="aspect-square bg-white/5 rounded-2xl w-full" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="h-6 bg-white/5 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center glass-panel rounded-3xl border-white/5">
            <ShoppingBag size={48} className="mx-auto text-white/20 mb-4" />
            <h4 className="text-lg font-black text-white/60">কোনো পণ্য পাওয়া যায়নি</h4>
            <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">অনুগ্রহ করে ফিল্টার অথবা সার্চের শব্দ পরিবর্তন করে ট্রাই করুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredProducts.map(product => {
              const storeLink = getStoreLink(product.shopSlug, product.customDomain, product.domainStatus);
              return (
                <div
                  key={product.id}
                  className="group glass-panel border-white/5 rounded-3xl overflow-hidden hover:border-white/10 hover:shadow-[0_0_50px_rgba(139,92,246,0.08)] transition-all duration-500 flex flex-col justify-between"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-950/40 border-b border-white/5">
                    <img
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                    {product.shopSlug === 'daripallah-store' && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 bg-amber-500/95 text-[8px] font-black text-black uppercase tracking-wider rounded-md shadow-md flex items-center gap-1">
                        👑 Primary Store
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest truncate max-w-[80px]">{product.category || 'General'}</span>
                        <a 
                          href={storeLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[9px] font-black text-white/40 hover:text-purple-400 truncate max-w-[100px] transition-colors flex items-center gap-0.5"
                        >
                          🏪 {product.shopName} <ArrowUpRight size={8} />
                        </a>
                      </div>
                      <h3 className="font-extrabold text-white text-xs tracking-tight leading-tight line-clamp-2 min-h-[2rem]">{product.name}</h3>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 text-[9px] font-bold">দাম (Price)</span>
                        <span className="text-white font-black text-xs">৳ {Number(product.price).toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full py-2.5 bg-white/5 hover:bg-purple-600 hover:text-white border border-white/10 hover:border-purple-500 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 text-white/70"
                      >
                        <ShoppingCart size={11} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Promoted Shops Showcase / Registry ── */}
      {(globalConfig?.promotedLinks && globalConfig.promotedLinks.length > 0) && (
        <section id="showcase" className="relative z-20 py-24 bg-white/[0.01] border-y border-white/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-10">
               <div className="text-left">
                  <span className="inline-block px-5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 mb-6">Verified Registry</span>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase">Elite Merchants</h2>
               </div>
               <div className="md:text-right max-w-sm">
                  <p className="text-xs text-white/40 font-bold leading-relaxed">
                     A curated registry of elite retail storefronts built and hosted securely on our high-performance cloud network.
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {globalConfig.promotedLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="group relative glass-panel p-8 rounded-[2rem] flex flex-col items-start gap-6 hover:bg-white/5 transition-all hover:-translate-y-1 hover:shadow-xl border-white/5">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[1.2rem] flex items-center justify-center shadow-2xl border border-white/10 group-hover:border-purple-500/50 transition-all">
                    <Globe size={24} className="text-white/20 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black group-hover:text-white transition-all tracking-tight">{link.title}</h4>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-1.5 group-hover:text-purple-400 transition-colors">
                       Visit Store <ArrowUpRight size={12} />
                    </p>
                  </div>
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer (Dynamic contacts matching superadmin details) ── */}
      <footer id="contact" className="relative z-20 border-t border-white/5 pt-20 pb-12 bg-[#030612]">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
              
              {/* Brand Description Footer */}
              <div>
                 {mainShopData?.logoUrl ? (
                   <img src={mainShopData.logoUrl} className="h-10 object-contain mb-6" alt="Logo" />
                 ) : (
                   <Logo href="/" className="text-white scale-[1.3] origin-left mb-6" text="daripallah.com" />
                 )}
                 <p className="text-xs text-white/50 leading-relaxed max-w-sm mb-6 font-bold">
                    Daripallah — বাংলাদেশের সবচেয়ে আধুনিক ই-কমার্স প্ল্যাটফর্ম। কাস্টমারদের জন্য সরাসরি ভেরিফাইড লোকাল মার্চেন্ট নেটওয়ার্ক থেকে সুরক্ষিত ও দ্রুত কেনাকাটার ওয়ান-স্টপ হাব।
                 </p>
                 <span className="text-[9px] font-black text-white/30 tracking-[0.4em] uppercase">daripallah global platform © {new Date().getFullYear()}</span>
              </div>
              
              {/* Navigation Links */}
              <div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80 mb-6">Navigation</h4>
                 <ul className="space-y-4 text-xs font-bold text-white/50">
                    <li><Link href="/showcase" className="hover:text-white transition-colors">Live Showcase Registry</Link></li>
                    <li><a href="#marketplace" className="hover:text-white transition-colors">All Products Marketplace</a></li>
                    <li><Link href="/dashboard" className="hover:text-white transition-colors">Store Admin Portal</Link></li>
                 </ul>
              </div>

              {/* Working Contact Links */}
              <div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80 mb-6">Contact Us</h4>
                 <ul className="space-y-4">
                    {/* Render from superadmin shop settings directly */}
                    {mainShopData?.socialLinks?.wa && (
                      <li>
                        <a 
                          href={getFormattedContactUrl(mainShopData.socialLinks.wa, 'whatsapp')} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 text-xs font-bold text-white/70 group hover:text-white transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-purple-600 transition-all shrink-0">
                            <MessageCircle size={14} />
                          </div>
                          <span>WhatsApp (সরাসরি যোগাযোগ)</span>
                        </a>
                      </li>
                    )}
                    
                    {mainShopData?.ownerEmail && (
                      <li>
                        <a 
                          href={`mailto:${mainShopData.ownerEmail}`} 
                          className="flex items-center gap-3 text-xs font-bold text-white/70 group hover:text-white transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-purple-600 transition-all shrink-0">
                            <Mail size={14} />
                          </div>
                          <span>{mainShopData.ownerEmail}</span>
                        </a>
                      </li>
                    )}

                    {(!mainShopData?.socialLinks?.wa && !mainShopData?.ownerEmail) && (
                       <li className="text-[10px] font-bold text-white/40 uppercase tracking-widest">No contact endpoints registered</li>
                    )}
                  </ul>
              </div>
           </div>
        </div>
      </footer>

      {/* ── Cart Drawer Overlay ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsCartOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#09090f] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl animate-slide-in text-white z-10">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#05050a]">
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={20} className="text-purple-400 animate-pulse" />
                <div>
                  <h3 className="font-black text-lg text-white">Shopping Cart</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{cartItemCount} Products Selected</p>
                </div>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer">
                <X size={20} className="text-white/60 hover:text-white" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="py-24 text-center space-y-4">
                  <ShoppingCart size={64} className="mx-auto text-white/10" />
                  <p className="text-white/40 font-black uppercase tracking-wider text-xs">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 1. Primary Daripallah Store Section */}
                  {webmaaStoreItems.length > 0 && (
                    <div className="bg-purple-950/10 border border-purple-500/20 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                        👑 Daripallah Store Products
                      </p>
                      <div className="space-y-3 divide-y divide-purple-500/10">
                        {webmaaStoreItems.map(item => (
                          <div key={item.id} className="flex gap-4 pt-3 first:pt-0">
                            <img src={item.imageUrl} className="w-12 h-12 object-contain bg-slate-900 rounded-lg border border-white/10 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-black text-white truncate">{item.name}</h4>
                              <p className="text-[10px] text-white/50 font-bold mt-1">৳ {item.price.toLocaleString()} x {item.quantity}</p>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <button onClick={() => updateCartQty(item.productId, -1)} className="p-1 hover:bg-white/10 rounded border border-white/10 text-white/60 hover:text-white shrink-0"><Minus size={10} /></button>
                                <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateCartQty(item.productId, 1)} className="p-1 hover:bg-white/10 rounded border border-white/10 text-white/60 hover:text-white shrink-0"><Plus size={10} /></button>
                                <button onClick={() => removeFromCart(item.productId)} className="ml-auto text-[10px] font-black text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"><Trash2 size={10} /> remove</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Third-Party Shops Section */}
                  {Object.entries(thirdPartyItemsByShop).map(([shopId, shopData]) => {
                    const shopCheckoutUrl = getStoreLink(shopData.shopSlug, shopData.customDomain, shopData.domainStatus);
                    return (
                      <div key={shopId} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                          🏪 {shopData.shopName}
                        </p>
                        <div className="space-y-3 divide-y divide-white/5">
                          {shopData.items.map(item => (
                            <div key={item.id} className="flex gap-4 pt-3 first:pt-0">
                              <img src={item.imageUrl} className="w-12 h-12 object-contain bg-slate-900 rounded-lg border border-white/10 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-white truncate">{item.name}</h4>
                                <p className="text-[10px] text-white/50 font-bold mt-1">৳ {item.price.toLocaleString()} x {item.quantity}</p>
                                
                                <div className="flex items-center gap-2 mt-2">
                                  <button onClick={() => updateCartQty(item.productId, -1)} className="p-1 hover:bg-white/10 rounded border border-white/10 text-white/60 hover:text-white shrink-0"><Minus size={10} /></button>
                                  <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                  <button onClick={() => updateCartQty(item.productId, 1)} className="p-1 hover:bg-white/10 rounded border border-white/10 text-white/60 hover:text-white shrink-0"><Plus size={10} /></button>
                                  <button onClick={() => removeFromCart(item.productId)} className="ml-auto text-[10px] font-black text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"><Trash2 size={10} /> remove</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="pt-2">
                          <a
                            href={shopCheckoutUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 active:scale-95 transition-all text-center cursor-pointer"
                          >
                            Checkout at {shopData.shopName} (৳ {shopData.items.reduce((t, i) => t + i.price * i.quantity, 0).toLocaleString()})
                          </a>
                          <p className="text-[8px] text-center text-white/40 mt-1">অন্যান্য স্টোরের চেকআউট ঐ স্টোরে গিয়ে করতে হবে</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-[#05050a] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm font-bold">Subtotal Total</span>
                  <span className="text-white text-xl font-black">৳ {cartTotal.toLocaleString()}</span>
                </div>

                <div className="space-y-2">
                  {webmaaStoreItems.length > 0 && (
                    <button
                      onClick={handleCheckoutWebmaa}
                      className="w-full py-4 bg-white text-black hover:scale-[1.02] rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl cursor-pointer active:scale-95 transition-all"
                    >
                      Checkout Daripallah Products (৳ {webmaaStoreTotal.toLocaleString()})
                    </button>
                  )}
                  <button
                    onClick={clearCart}
                    className="w-full py-3 bg-red-950/20 hover:bg-red-900/30 border border-red-500/10 hover:border-red-500/30 text-red-400 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Empty Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Circular Glassy Scroll Button Group (Bottom-Left) ── */}
      <div className="fixed bottom-8 left-8 z-[120] flex flex-col gap-2 animate-fade-in">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-purple-600 border border-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
          title="Scroll to Top"
        >
          <ArrowUp size={16} />
        </button>
        <button 
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })} 
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-purple-600 border border-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
          title="Scroll to Bottom"
        >
          <ArrowDown size={16} />
        </button>
      </div>

      {/* ── Floating WhatsApp Chat Button (Bottom-Right) ── */}
      {mainShopData?.socialLinks?.wa && (
        <a
          href={getFormattedContactUrl(mainShopData.socialLinks.wa, 'whatsapp')}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-8 right-28 z-[100] w-14 h-14 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border border-emerald-400/30 cursor-pointer shadow-emerald-500/20"
          title="Chat on WhatsApp"
        >
          <MessageCircle size={24} />
        </a>
      )}

      {/* Floating Cart Trigger */}
      {cartItemCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 z-[100] w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/40 hover:scale-110 active:scale-95 transition-all border border-white/10 cursor-pointer"
        >
          <ShoppingCart size={24} />
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-lg border border-black">
            {cartItemCount}
          </span>
        </button>
      )}

    </div>
  );
}
