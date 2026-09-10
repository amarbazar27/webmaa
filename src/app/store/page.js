"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Search, Store, ArrowRight, ArrowUpRight,
  ShoppingCart, Plus, Minus, X, Filter, Loader2, CheckCircle,
  Tag, ExternalLink, ChevronRight, Eye, Sparkles, ArrowLeft
} from 'lucide-react';
import { getAllMarketplaceProducts, getAllShops, subscribeGlobalConfig } from '@/lib/firestore';
import toast from 'react-hot-toast';
import Logo from '@/components/ui/Logo';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import { useAuth } from '@/context/AuthContext';

// Phonetic dictionary for bilingual searches
const COMMON_PHONETIC_DICT = {
  'alu': 'আলু', 'potol': 'পটল', 'peyaj': 'পেঁয়াজ', 'peyaz': 'পেঁয়াজ',
  'ada': 'আদা', 'roshun': 'রসুন', 'gajor': 'গাজর', 'chal': 'চাল',
  'dal': 'ডাল', 'tel': 'তেল', 'dim': 'ডিম', 'dudh': 'দুধ',
  'murgi': 'মুরগি', 'goru': 'গরু', 'khashi': 'খাসি', 'mach': 'মাছ',
  'morich': 'মরিচ', 'holud': 'হলুদ', 'jira': 'জিরা', 'lebu': 'লেবু',
  'cha': 'চা', 'coffee': 'কফি', 'shosa': 'শসা', 'tomato': 'টমেটো',
  'tshirt': 'টি-শার্ট', 'shirt': 'শার্ট', 'pant': 'প্যান্ট', 'panjabi': 'পাঞ্জাবি',
  'sharee': 'শাড়ি', 'saree': 'শাড়ি', 'shoe': 'জুতা', 'sneakers': 'স্নিকার্স'
};

function normalizePhonetic(text) {
  if (!text) return '';
  let t = text.toLowerCase().trim();
  const banglaToEnglishMap = {
    'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u',
    'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'g',
    'চ': 'ch', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'r', 'য়': 'y', 'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u',
    'ূ': 'u', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou'
  };
  let mappedStr = '';
  for (let i = 0; i < t.length; i++) {
    const char = t[i];
    mappedStr += banglaToEnglishMap[char] || char;
  }
  return mappedStr.replace(/sh/g, 's').replace(/ph/g, 'f').replace(/kh/g, 'k').replace(/ch/g, 'c');
}

export default function StoreMarketplacePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalConfig, setGlobalConfig] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Modal & Cart States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('bdretailers_marketplace_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {}
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem('bdretailers_marketplace_cart', JSON.stringify(newCart));
    } catch (e) {}
  };

  useEffect(() => {
    const unsub = subscribeGlobalConfig((config) => {
      setGlobalConfig(config);
    });

    // Fetch all products from all shops
    const loadData = async () => {
      setLoading(true);
      try {
        const [allProds, allShopsList] = await Promise.all([
          getAllMarketplaceProducts(),
          getAllShops()
        ]);
        setProducts(allProds || []);
        setShops(allShopsList || []);
      } catch (err) {
        console.error('Error fetching marketplace data:', err);
        toast.error('পণ্য লোড করতে সমস্যা হয়েছে');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => unsub();
  }, []);

  // Helper to resolve store links
  const getStoreLink = (shopSlug, customDomain, domainStatus) => {
    if (customDomain && domainStatus === 'active') {
      return `https://${customDomain}`;
    }
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.endsWith('bdretailers.com')) {
        return `https://${shopSlug}.bdretailers.com`;
      }
      if (hostname.endsWith('daripallah.com')) {
        return `https://${shopSlug}.daripallah.com`;
      }
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${shopSlug}.localhost:${window.location.port || '3000'}`;
      }
    }
    return `/shop/${shopSlug}`;
  };

  // Categories extraction
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach(p => {
      if (p.category && typeof p.category === 'string' && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Unique shops
  const uniqueShops = useMemo(() => {
    const names = new Set();
    products.forEach(p => {
      if (p.shopName) names.add(p.shopName);
    });
    return ['All', ...Array.from(names)];
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Shop filter
    if (selectedShop !== 'All') {
      result = result.filter(p => p.shopName === selectedShop);
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Search query with transliteration
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const mappedBangla = COMMON_PHONETIC_DICT[q] || '';
      const normalizedQ = normalizePhonetic(q);

      result = result.filter(p => {
        const name = (p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const shop = (p.shopName || '').toLowerCase();

        return (
          name.includes(q) ||
          cat.includes(q) ||
          desc.includes(q) ||
          shop.includes(q) ||
          (mappedBangla && name.includes(mappedBangla)) ||
          normalizePhonetic(name).includes(normalizedQ)
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price_desc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      // 'newest' default
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    return result;
  }, [products, selectedShop, selectedCategory, searchQuery, sortBy]);

  // Cart Functions
  const handleAddToCart = (product) => {
    const existingIndex = cart.findIndex(item => item.productId === product.id);
    let newCart;
    if (existingIndex > -1) {
      newCart = cart.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: (item.quantity || 1) + 1 } : item
      );
    } else {
      newCart = [
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          shopName: product.shopName,
          shopSlug: product.shopSlug,
          customDomain: product.customDomain,
          domainStatus: product.domainStatus,
          quantity: 1,
        }
      ];
    }
    saveCart(newCart);
    toast.success(`"${product.name}" কার্টে যোগ করা হয়েছে! 🛒`);
  };

  const updateCartQty = (productId, delta) => {
    const newCart = cart.map(item => {
      if (item.productId === productId) {
        const newQty = (item.quantity || 1) + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);
    saveCart(newCart);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090E] text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-600 selection:text-white pb-20">
      
      {/* ── 1. CLEAN TOP NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Store Hub Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo size="small" />
            </Link>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-black text-xs border border-purple-200 dark:border-purple-800/50 flex items-center gap-1">
                <Store size={12} />
                <span>সেন্ট্রাল স্টোর</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold hidden md:inline">
                সকল স্টোরের পণ্য এক ছাদের নিচে
              </span>
            </div>
          </div>

          {/* Right Controls: Main Site Link, Theme Toggle, Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-all"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">মূল ওয়েবসাইট</span>
            </Link>

            <ThemeToggleButton />

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:px-3.5 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">কার্ট</span>
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 sm:static bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. DEDICATED SEARCH & FILTER HUB (ZERO CLUTTER) ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Prominent Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-3xl mx-auto">
            <div className="relative flex items-center bg-white dark:bg-slate-900 border-2 border-purple-200 hover:border-purple-400 dark:border-white/10 dark:hover:border-purple-500/50 rounded-2xl px-4 sm:px-6 py-3.5 shadow-xl shadow-purple-500/5 focus-within:border-purple-600 focus-within:ring-4 focus-within:ring-purple-500/20 transition-all">
              <Search className="text-purple-600 dark:text-purple-400 mr-3 shrink-0" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="সব স্টোরের পণ্য খুঁজুন (Search by name, shop name, category or English/Bangla)..."
                className="bg-transparent border-none focus:ring-0 w-full text-xs sm:text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter & Sorting Controls */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-4 mb-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Shop Selector Dropdown */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
              <Store size={14} className="text-purple-600 dark:text-purple-400" />
              স্টোর:
            </span>
            <div className="relative flex-1 max-w-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-purple-400 rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer transition-all">
              <select
                value={selectedShop}
                onChange={e => setSelectedShop(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              >
                <option value="All">🌐 সকল স্টোর (All Stores)</option>
                {uniqueShops.filter(s => s !== 'All').map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 truncate pr-3">
                {selectedShop === 'All' ? '🌐 সকল স্টোর (All Stores)' : `🏪 ${selectedShop}`}
              </span>
              <span className="text-[10px] text-purple-400">▼</span>
            </div>
          </div>

          {/* Sort & Count */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400">
              মোট পণ্য: <strong className="text-purple-600 dark:text-purple-400 font-mono">{filteredProducts.length}</strong>টি
            </span>

            <div className="relative bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-purple-400 rounded-xl px-3 py-2 flex items-center justify-between min-w-[140px] cursor-pointer transition-all">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              >
                <option value="newest">নতুন পণ্য (Newest)</option>
                <option value="price_asc">দাম: কম থেকে বেশি</option>
                <option value="price_desc">দাম: বেশি থেকে কম</option>
                <option value="name_asc">নাম (A → Z)</option>
                <option value="name_desc">নাম (Z → A)</option>
              </select>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate pr-3">
                {sortBy === 'newest' ? 'নতুন পণ্য' :
                 sortBy === 'price_asc' ? 'দাম: কম → বেশি' :
                 sortBy === 'price_desc' ? 'দাম: বেশি → কম' :
                 sortBy === 'name_asc' ? 'নাম: A → Z' : 'নাম: Z → A'}
              </span>
              <span className="text-[10px] text-slate-400">▼</span>
            </div>
          </div>
        </div>

        {/* Category Pills Horizontal Scroller */}
        {categories.length > 1 && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                    active
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-purple-300'
                  }`}
                >
                  {cat === 'All' ? '✨ সকল ক্যাটাগরি' : cat}
                </button>
              );
            })}
          </div>
        )}

        {/* ── 3. ALL PRODUCTS GRID ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <div key={n} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-3 space-y-3">
                <div className="aspect-square bg-slate-200 dark:bg-white/5 rounded-xl w-full" />
                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm p-6">
            <ShoppingBag size={48} className="mx-auto text-slate-300 dark:text-white/20 mb-3" />
            <h4 className="text-lg font-black text-slate-800 dark:text-white">কোনো পণ্য পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
              অন্য কোনো শব্দ দিয়ে সার্চ করুন অথবা ক্যাটাগরি ফিল্টার পরিবর্তন করুন
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
            {filteredProducts.map(product => {
              const storeLink = getStoreLink(product.shopSlug, product.customDomain, product.domainStatus);
              const cartItem = cart.find(c => c.productId === product.id);

              return (
                <div
                  key={product.id}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/40 hover:shadow-xl dark:hover:shadow-purple-950/40 transition-all duration-300 flex flex-col justify-between shadow-sm"
                >
                  {/* Image & Quick View Trigger */}
                  <div
                    onClick={() => setSelectedProduct(product)}
                    className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-950 cursor-pointer"
                  >
                    <img
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Quick View Floating Hint */}
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                        <Eye size={12} /> ভিউ
                      </span>
                    </div>

                    {product.stock === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600/90 backdrop-blur-md text-white text-[8px] font-black uppercase rounded-md shadow">
                        স্টক আউট
                      </span>
                    )}
                  </div>

                  {/* Body & Actions */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Shop Origin Link */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <a
                          href={storeLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-black text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 truncate flex items-center gap-0.5 hover:underline"
                          title={`${product.shopName} স্টোরে সরাসরি ভিজিট করুন`}
                        >
                          🏪 {product.shopName} <ArrowUpRight size={10} />
                        </a>
                        <span className="text-[9px] text-slate-400 font-bold truncate max-w-[70px]">
                          {product.category || 'General'}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3
                        onClick={() => setSelectedProduct(product)}
                        className="font-extrabold text-slate-900 dark:text-white text-xs tracking-tight leading-tight line-clamp-2 min-h-[30px] cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {product.name}
                      </h3>
                    </div>

                    {/* Price & Add to Cart */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-2 mt-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] font-bold text-slate-400">মূল্য</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                          ৳ {Number(product.price || 0).toLocaleString()}
                        </span>
                      </div>

                      {product.stock === 0 ? (
                        <div className="w-full py-1.5 rounded-xl font-bold text-[9px] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-center border border-red-200 dark:border-red-500/20">
                          🚫 স্টক শেষ
                        </div>
                      ) : cartItem ? (
                        <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/80 rounded-xl p-1 border border-purple-200 dark:border-purple-500/40">
                          <button
                            onClick={() => updateCartQty(product.id, -1)}
                            className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center text-white hover:bg-purple-500 transition-colors font-black"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(product.id, 1)}
                            className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center text-white hover:bg-purple-500 transition-colors font-black"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="flex-1 py-1.5 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-md active:scale-95 cursor-pointer"
                          >
                            <ShoppingCart size={12} /> কার্টে নিন
                          </button>
                          <a
                            href={storeLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-100 hover:bg-purple-100 dark:bg-white/5 dark:hover:bg-purple-900/30 text-slate-600 hover:text-purple-700 dark:text-slate-300 dark:hover:text-purple-300 rounded-xl border border-slate-200 dark:border-white/10 transition-colors"
                            title="এই নির্দিষ্ট স্টোরে যান"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── 4. PRODUCT DETAIL MODAL (IN-MODAL PREVIEW & STORE LINK) ── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
            >
              <X size={20} />
            </button>

            {/* Product Image */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10">
              <img
                src={selectedProduct.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Store Information */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{selectedProduct.shopName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">এই পণ্যটির রেজিস্টার্ড বিক্রেতা</p>
                </div>
              </div>
              <a
                href={getStoreLink(selectedProduct.shopSlug, selectedProduct.customDomain, selectedProduct.domainStatus)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-1 transition-all shadow-sm"
              >
                <span>স্টোর ভিজিট</span>
                <ArrowUpRight size={12} />
              </a>
            </div>

            {/* Title & Price */}
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {selectedProduct.name}
              </h2>
              <p className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-lg mt-1">
                ৳ {Number(selectedProduct.price || 0).toLocaleString()}
              </p>
            </div>

            {/* Description */}
            {selectedProduct.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                {selectedProduct.description}
              </p>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center gap-3">
              <button
                onClick={() => {
                  handleAddToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
              >
                <ShoppingCart size={15} />
                <span>কার্টে যোগ করুন</span>
              </button>

              <a
                href={getStoreLink(selectedProduct.shopSlug, selectedProduct.customDomain, selectedProduct.domainStatus)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1 transition-all border border-slate-200 dark:border-white/10"
              >
                <span>স্টোর থেকে কিনুন</span>
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. SHOPPING CART DRAWER ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-full p-5 sm:p-6 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-white/10">
            
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-purple-600" size={18} />
                  <h3 className="font-black text-sm sm:text-base">মার্কেটপ্লেস শপিং ব্যাগ ({totalCartCount})</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 font-bold text-xs space-y-2">
                    <ShoppingBag size={36} className="mx-auto text-slate-300 dark:text-white/20" />
                    <p>আপনার শপিং ব্যাগ খালি আছে</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs"
                    >
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80'}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{item.name}</p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5 truncate">
                          🏪 {item.shopName}
                        </p>
                        <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          ৳ {item.price} × {item.quantity}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateCartQty(item.productId, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center font-black hover:bg-purple-600 hover:text-white transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="font-mono font-black text-xs min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.productId, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center font-black hover:bg-purple-600 hover:text-white transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between text-sm font-black">
                  <span>সর্বমোট মূল্য:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                    ৳ {totalCartAmount.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium">
                    পণ্যসমূহ সরাসরি সংশ্লিষ্ট ভেরিফাইড মার্চেন্টদের থেকে পাঠানো হবে
                  </p>
                  
                  <button
                    onClick={() => {
                      toast.success('চেকআউট সফলভাবে শুরু হয়েছে! অর্ডার প্রসেসিং সম্পন্ন করতে সংশ্লিষ্ট মার্চেন্টের সাথে যোগাযোগ করা হচ্ছে।');
                      setIsCartOpen(false);
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    চেকআউট সম্পন্ন করুন (৳ {totalCartAmount.toLocaleString()})
                  </button>

                  <button
                    onClick={() => saveCart([])}
                    className="w-full py-2 rounded-xl text-slate-400 hover:text-red-500 text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    শপিং ব্যাগ খালি করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
