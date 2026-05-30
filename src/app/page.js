"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Search, Star, ArrowRight, Phone, Store,
  X, Loader2, CheckCircle, Sparkles, Package, ChevronRight,
  ShoppingCart, Plus, Minus, Trash2, Filter, Globe, ArrowUpRight,
  MessageCircle, Mail
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logoutUser, loginWithGoogle } from '@/lib/auth';
import { subscribeGlobalConfig, getAllMarketplaceProducts } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';

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
  const [productSearch, setProductSearch] = useState('');

  // Load products & global config & cart on mount
  useEffect(() => {
    getAllMarketplaceProducts().then(data => {
      setProducts(data);
      setProductsLoading(false);
    }).catch(err => {
      console.error(err);
      setProductsLoading(false);
    });

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

  const uniqueCategories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const uniqueShops = ['All', ...Array.from(new Set(products.map(p => p.shopName).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesShop = activeShopFilter === 'All' || p.shopName === activeShopFilter;
    const matchesSearch = p.name?.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.shopName?.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.category?.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesShop && matchesSearch;
  });

  const thirdPartyItemsByShop = cart.reduce((acc, item) => {
    if (item.isThirdParty) {
      if (!acc[item.shopId]) {
        acc[item.shopId] = {
          shopName: item.shopName,
          shopSlug: item.shopSlug,
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

  // WhatsApp Link Normalization to resolve wa.me connection issues
  const getFormattedContactUrl = (url, type) => {
    if (!url) return '#';
    const cleanNum = url.replace(/[^0-9]/g, '');
    if (type === 'whatsapp' || url.includes('wa.me') || cleanNum.length >= 10) {
      const withCountry = cleanNum.startsWith('88') ? cleanNum : `88${cleanNum}`;
      return `https://wa.me/${withCountry}`;
    }
    return url;
  };

  // Amazon Category Cards grouping logic:
  // Take top 4 categories and map up to 4 items in a 2x2 grid inside a premium Amazon-like card
  const topCategories = uniqueCategories.filter(c => c !== 'All').slice(0, 4);

  return (
    <div className="min-h-screen relative bg-[#06060f] text-slate-100 selection:bg-purple-900 selection:text-white font-sans overflow-x-hidden">
      
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
            <Logo href="/" className="text-white scale-110" text="daripallah.com" />
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

      {/* ── Hero Section ── */}
      <section className="relative z-20 pt-48 pb-12 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl" style={{ minHeight: '340px' }}>
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
      </section>

      {/* ── Amazon-Style Category Grids ── */}
      {topCategories.length > 0 && (
        <section className="relative z-20 max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topCategories.map(cat => {
              // Get first 4 products in this category to construct a 2x2 grid
              const catProducts = products.filter(p => p.category === cat).slice(0, 4);
              if (catProducts.length === 0) return null;
              
              return (
                <div key={cat} className="bg-white rounded-[2rem] p-6 text-slate-900 shadow-xl border border-slate-100 flex flex-col justify-between" style={{ minHeight: '420px' }}>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-800 mb-4">{cat}</h3>
                    
                    {/* 2x2 Grid of Products */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {catProducts.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => {
                            setActiveCategory(cat);
                            const el = document.getElementById('marketplace');
                            el?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="group cursor-pointer space-y-1.5"
                        >
                          <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 relative">
                            <img 
                              src={p.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80'} 
                              alt={p.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Price label inside category grid */}
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow">
                              ৳{Number(p.price).toFixed(0)}
                            </span>
                          </div>
                          <p className="text-[10px] font-black text-slate-700 truncate px-0.5 leading-none">{p.name}</p>
                        </div>
                      ))}
                      {/* Fill empty items if category has less than 4 items */}
                      {catProducts.length < 4 && [...Array(4 - catProducts.length)].map((_, idx) => (
                        <div key={`empty-${idx}`} className="aspect-square rounded-xl bg-slate-50 border border-dashed border-slate-200" />
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setActiveCategory(cat);
                      const el = document.getElementById('marketplace');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs font-black text-purple-600 hover:text-purple-800 transition-colors text-left flex items-center gap-1 mt-2"
                  >
                    See all products <ChevronRight size={14} className="mt-0.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Marketplace Section ── */}
      <section id="marketplace" className="relative z-20 max-w-7xl mx-auto px-6 py-16 scroll-mt-24">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3">
              Explore Our Marketplace
            </h2>
            <p className="text-sm text-white/40 font-medium">
              Browse products uploaded live across all registered marchants. Real-time stock, secure shopping.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-sm shrink-0">
            <Search className="absolute left-4 top-3 text-white/30" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-white/20 transition-all"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Category & Shop Filter pills */}
        <div className="flex flex-col gap-4 mb-10 overflow-x-auto pb-2">
          {/* Categories */}
          <div className="flex gap-2 shrink-0">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest self-center mr-2">Category:</span>
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border shrink-0 ${
                  activeCategory === cat
                    ? 'bg-white text-slate-900 border-white shadow-lg'
                    : 'bg-white/[0.02] border-white/[0.05] text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Shops */}
          <div className="flex gap-2 shrink-0">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest self-center mr-2">Merchant:</span>
            {uniqueShops.map(shop => (
              <button
                key={shop}
                onClick={() => setActiveShopFilter(shop)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border shrink-0 ${
                  activeShopFilter === shop
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg'
                    : 'bg-white/[0.02] border-white/[0.05] text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                }`}
              >
                {shop === 'All' ? 'All Stores' : shop}
              </button>
            ))}
          </div>
        </div>

        {/* Product Showcase Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="glass-panel border-white/5 rounded-3xl p-4 space-y-4 animate-pulse">
                <div className="aspect-square bg-white/5 rounded-2xl w-full" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="h-6 bg-white/5 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center glass-panel rounded-3xl border-white/5">
            <ShoppingBag size={48} className="mx-auto text-white/20 mb-4" />
            <h4 className="text-lg font-black text-white/60">No products found</h4>
            <p className="text-sm text-white/30 font-medium mt-1">Try resetting your filters or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="group glass-panel border-white/5 rounded-3xl overflow-hidden hover:border-white/10 hover:shadow-[0_0_50px_rgba(139,92,246,0.05)] transition-all duration-500 flex flex-col justify-between"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-900/40">
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

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest truncate max-w-[100px]">{product.category || 'General'}</span>
                      <a href={`/shop/${product.shopSlug}`} target="_blank" rel="noreferrer" className="text-[9px] font-black text-white/40 hover:text-white truncate max-w-[120px] transition-colors">
                        🏪 {product.shopName}
                      </a>
                    </div>
                    <h3 className="font-extrabold text-white text-sm tracking-tight leading-tight line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-[10px] font-bold">Price</span>
                      <span className="text-white font-black text-sm">৳ {Number(product.price).toLocaleString()}</span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full py-2.5 bg-white/5 hover:bg-purple-600 hover:text-white border border-white/10 hover:border-purple-500 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 text-white/70 animate-fade-in"
                    >
                      <ShoppingCart size={12} /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                  <p className="text-sm text-white/40 font-bold leading-relaxed">
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

      {/* ── Footer ── */}
      <footer id="contact" className="relative z-20 border-t border-white/5 pt-20 pb-12 bg-[#04040a]">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
              
              {/* Brand Description Footer */}
              <div>
                 <Logo href="/" className="text-white scale-[1.3] origin-left mb-6" text="daripallah.com" />
                 <p className="text-sm text-white/50 leading-relaxed max-w-sm mb-6">
                    Daripallah — বাংলাদেশের সবচেয়ে আধুনিক ই-কমার্স প্ল্যাটফর্ম। কাস্টমারদের জন্য সরাসরি ভেরিফাইড লোকাল মার্চেন্ট নেটওয়ার্ক থেকে সুরক্ষিত ও দ্রুত কেনাকাটার ওয়ান-স্টপ হাব।
                 </p>
                 <span className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase">daripallah global platform © {new Date().getFullYear()}</span>
              </div>
              
              {/* Elite Showcase */}
              <div>
                 <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80 mb-6">Navigation</h4>
                 <ul className="space-y-4 text-sm font-bold text-white/50">
                    <li><Link href="/showcase" className="hover:text-white transition-colors">Live Showcase Registry</Link></li>
                    <li><a href="#marketplace" className="hover:text-white transition-colors">All Products Marketplace</a></li>
                    <li><Link href="/dashboard" className="hover:text-white transition-colors">Store Admin Portal</Link></li>
                 </ul>
              </div>

              {/* Working Contact Links (WhatsApp wa.me normalization built-in) */}
              <div>
                 <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80 mb-6">Contact Us</h4>
                 <ul className="space-y-4">
                    {globalConfig?.contactLinks?.map((link, idx) => {
                      const formattedUrl = getFormattedContactUrl(link.url, link.name?.toLowerCase());
                      const isWa = link.name?.toLowerCase().includes('whatsapp') || link.url.includes('wa.me');
                      
                      return (
                        <li key={idx}>
                           <a 
                             href={formattedUrl} 
                             target="_blank" 
                             rel="noreferrer" 
                             className="flex items-center gap-3 text-sm font-bold text-white/70 group hover:text-white transition-colors cursor-pointer"
                           >
                             <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-purple-600 transition-all shrink-0">
                                {isWa ? <MessageCircle size={16} /> : <Mail size={16} />}
                             </div>
                             <span>{link.name || 'Direct Connection'}</span>
                           </a>
                        </li>
                      );
                    })}
                    {(!globalConfig?.contactLinks || globalConfig.contactLinks.length === 0) && (
                       <li className="text-xs font-bold text-white/40 uppercase tracking-widest">No contact endpoints registered</li>
                    )}
                  </ul>
              </div>
           </div>
        </div>
      </footer>

      {/* ── Cart Drawer Overlay ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsCartOpen(false)} />
          
          {/* Drawer Body */}
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
                  {Object.entries(thirdPartyItemsByShop).map(([shopId, shopData]) => (
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
                          href={`/shop/${shopData.shopSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 active:scale-95 transition-all text-center"
                        >
                          Checkout at {shopData.shopName} (৳ {shopData.items.reduce((t, i) => t + i.price * i.quantity, 0).toLocaleString()})
                        </a>
                        <p className="text-[8px] text-center text-white/40 mt-1">অন্যান্য স্টোরের চেকআউট ঐ স্টোরে গিয়ে করতে হবে</p>
                      </div>
                    </div>
                  ))}
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

      {/* Floating Cart Button */}
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
