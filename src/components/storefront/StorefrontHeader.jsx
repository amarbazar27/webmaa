'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, ShoppingBag, Bell, Menu, X, Heart, 
  MapPin, Phone, Sparkles, ChevronDown, User,
  HelpCircle, Sun, Moon, Settings, Zap, ArrowRight, ShieldCheck
} from 'lucide-react';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';

export const HEADER_PRESETS = [
  {
    id: 'classic',
    label: 'Header 01 — Classic Commerce',
    desc: 'লোগো বামে, সার্চবার মাঝে ও অ্যাকশন বাটন ডানে',
    icon: '🏛️',
    badge: 'All-Rounder'
  },
  {
    id: 'minimal',
    label: 'Header 02 — Minimal Clean',
    desc: 'সিম্পল ও ফাস্ট লোডিং স্লিম হেডার, ক্লিন স্পেসিং',
    icon: '⚡',
    badge: 'Clean & Fast'
  },
  {
    id: 'mega_nav',
    label: 'Header 03 — Mega Navigation',
    desc: 'টপ ইউটিলিটি বার, লোগো, ক্যাটাগরি স্ট্রিপ ও বড় সার্চবার',
    icon: '📑',
    badge: 'Multi-Category'
  },
  {
    id: 'search_first',
    label: 'Header 04 — Search First',
    desc: 'প্রমিনেন্ট বড় সার্চবার ও ডেলিভারি লোকেশন ব্যাজ',
    icon: '🔍',
    badge: 'Grocery / Tech'
  },
  {
    id: 'fashion_editorial',
    label: 'Header 05 — Fashion Editorial',
    desc: 'প্রিমিয়াম টাইপোগ্রাফি, স্পেসিয়াস এডিটোরিয়াল স্পেসিং',
    icon: '👗',
    badge: 'Luxury & Fashion'
  },
  {
    id: 'marketplace',
    label: 'Header 06 — Marketplace',
    desc: 'মেগা ক্যাটাগরি ড্রপডাউন, ফিল্টার্ড সার্চ, উইশলিস্ট ও কার্ট',
    icon: '🏬',
    badge: 'Superstore'
  },
  {
    id: 'grocery_quick',
    label: 'Header 07 — Grocery Quick Shop',
    desc: 'এক্সপ্রেস ডেলিভারি টাইম ব্যাজ, এরিয়া সিলেক্টর ও ইনস্ট্যান্ট সার্চ',
    icon: '🥦',
    badge: 'Fast Delivery'
  },
  {
    id: 'electronics',
    label: 'Header 08 — Electronics Pro',
    desc: 'টেক ডিলস ট্র্যাকার, ব্র্যান্ডস লিংক ও ২৪/৭ সাপোর্ট হটলাইন',
    icon: '💻',
    badge: 'Gadgets & Tech'
  },
  {
    id: 'mobile_first',
    label: 'Header 09 — Mobile First',
    desc: 'অ্যাপ-লাইক স্মার্ট টাচ নেভিগেশন ও কুইক অ্যাকশন বাটন',
    icon: '📱',
    badge: 'Mobile Optimized'
  },
  {
    id: 'transparent_hero',
    label: 'Header 10 — Transparent Hero Header',
    desc: 'হিরো ব্যানারের উপর স্বচ্ছ ফ্রস্টেড গ্লাস, স্ক্রলে সলিড হেডার',
    icon: '✨',
    badge: 'Cinematic Glass'
  },
];

export default function StorefrontHeader({
  shop = {},
  headerConfig = {},
  themeVars = {},
  categories = [],
  cartCount = 0,
  onOpenCart,
  onOpenCategories,
  onSearchChange,
  searchQuery = '',
  isPreview = false,
  user = null,
  userData = null,
  onOpenProfile,
  onOpenFaq,
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  const safeCategories = Array.isArray(categories) ? categories : [];
  const hStyle = headerConfig?.style || 'classic';
  const isWhitePill = headerConfig?.buttonStyle === 'white_pill';
  const primary = themeVars?.primaryColor || themeVars?.['--sp-primary'] || shop?.primaryColor || '#6D28D9';
  const announcementText = String(headerConfig?.announcementText || shop?.notices || '');
  const shopName = String(shop?.shopName || 'BDRetailers Store');
  const shopInitial = shopName.charAt(0) || 'B';
  const slogan = String(shop?.slogan || '');
  const rawWa = String(shop?.deliveryConfig?.contactWhatsapp || shop?.socialLinks?.wa || '01734763306');
  const displayWa = rawWa.includes('no contact') ? '+8801734763306' : rawWa;

  // Track scroll for sticky / transparent behavior
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const buttonBaseClass = isWhitePill
    ? "p-2 rounded-xl bg-white text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all font-bold cursor-pointer flex items-center justify-center"
    : "p-2 rounded-xl bg-slate-100/90 text-slate-700 hover:bg-slate-200 backdrop-blur-md border border-slate-200/50 shadow-2xs transition-all font-bold cursor-pointer flex items-center justify-center";

  // Render Announcement Bar
  const renderAnnouncementBar = () => {
    if (!announcementText) return null;
    return (
      <div 
        className="text-white text-xs py-1.5 px-4 font-bold overflow-hidden whitespace-nowrap flex items-center justify-between shadow-inner"
        style={{ background: `linear-gradient(90deg, ${primary}, #4338ca)` }}
      >
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-center text-center">
          <Sparkles size={13} className="text-amber-300 animate-pulse shrink-0" />
          <span className="truncate">{announcementText}</span>
        </div>
      </div>
    );
  };

  // Render Brand Logo and Name
  const renderBrand = (isDark = false) => (
    <Link 
      href={`/shop/${shop?.subdomainSlug || shop?.shopSlug || ''}`}
      onClick={(e) => { if (isPreview) e.preventDefault(); }}
      className="flex items-center gap-2.5 shrink-0 group select-none no-underline"
    >
      {shop?.logoUrl ? (
        <img 
          src={shop.logoUrl} 
          alt={shopName} 
          className="w-9 h-9 rounded-xl object-contain border border-slate-200/60 shadow-xs group-hover:scale-105 transition-transform" 
        />
      ) : (
        <div 
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base font-black shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform"
          style={{ background: primary }}
        >
          {shopInitial}
        </div>
      )}
      <div>
        <span className={`text-sm sm:text-base font-black leading-tight block truncate max-w-[160px] sm:max-w-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {shopName}
        </span>
        {slogan ? (
          <span className="text-[10px] text-slate-400 font-bold block truncate max-w-[160px] sm:max-w-xs">
            {slogan}
          </span>
        ) : (
          <span className="text-[10px] text-emerald-600 font-black block flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" /> ভেরিফাইড মার্চেন্ট
          </span>
        )}
      </div>
    </Link>
  );

  // Render Common Action Buttons
  const renderActionButtons = (isDark = false) => (
    <div className="flex items-center gap-1.5 shrink-0">
      {headerConfig?.showThemeToggle !== false && (
        <div className="hidden sm:block">
          <ThemeToggleButton size="sm" />
        </div>
      )}

      {headerConfig?.showNotifications !== false && (
        <button
          type="button"
          onClick={() => {}}
          className={buttonBaseClass}
          title="নোটিফিকেশন"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
      )}

      {headerConfig?.showFaqBtn !== false && (
        <button
          type="button"
          onClick={onOpenFaq}
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 text-white text-[11px] font-black shadow-xs hover:opacity-90 transition-opacity"
        >
          <HelpCircle size={13} />
          <span>FAQ</span>
        </button>
      )}

      {/* Cart Button */}
      <button 
        type="button"
        onClick={onOpenCart}
        className={`relative ${buttonBaseClass} px-3 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100`}
        aria-label="Shopping Cart"
      >
        <ShoppingBag size={16} className="text-purple-600" />
        <span className="hidden sm:inline text-xs font-black ml-1">কার্ট</span>
        {cartCount > 0 && (
          <span 
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-md animate-bounce"
            style={{ background: primary }}
          >
            {cartCount}
          </span>
        )}
      </button>

      {/* Profile Button */}
      {onOpenProfile && (
        <button
          type="button"
          onClick={onOpenProfile}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-white text-purple-700 hover:bg-purple-50 rounded-xl transition-colors shadow-2xs border border-slate-200 overflow-hidden flex items-center justify-center cursor-pointer"
          title="প্রোফাইল"
          aria-label="User Profile"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" />
          ) : (
            <User size={16} className="font-bold" />
          )}
        </button>
      )}
    </div>
  );

  // Render Search Bar
  const renderSearchBar = (placeholder = "পণ্য খুঁজুন...", extraClass = "") => {
    if (headerConfig?.showSearch === false) return null;
    return (
      <div className={`flex-1 relative ${extraClass}`}>
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs font-bold text-slate-800 rounded-2xl border border-slate-200/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all placeholder:text-slate-400"
          />
          <Search size={14} className="absolute left-3 text-slate-400" />
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════
  // HEADER 01: CLASSIC COMMERCE
  // ══════════════════════════════════════════════════════════════════
  if (hStyle === 'classic') {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
        {renderAnnouncementBar()}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={onOpenCategories}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              title="ক্যাটাগরি মেনু"
            >
              <Menu size={20} />
            </button>
            {renderBrand(false)}
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            {renderSearchBar("হাজারো পণ্যের মধ্য থেকে সার্চ করুন...")}
          </div>

          {renderActionButtons(false)}
        </div>

        {/* Mobile Search Bar Row */}
        <div className="md:hidden px-3 pb-2.5 pt-0.5">
          {renderSearchBar("পণ্য খুঁজুন...")}
        </div>
      </header>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // HEADER 02: MINIMAL CLEAN
  // ══════════════════════════════════════════════════════════════════
  if (hStyle === 'minimal') {
    return (
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 py-2 shadow-xs transition-all">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={onOpenCategories}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              <Menu size={18} />
            </button>
            {renderBrand(false)}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block w-48">
              {renderSearchBar("খুঁজুন...")}
            </div>
            {renderActionButtons(false)}
          </div>
        </div>
      </header>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // HEADER 03: MEGA NAVIGATION
  // ══════════════════════════════════════════════════════════════════
  if (hStyle === 'mega_nav') {
    return (
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-100 transition-all">
        {renderAnnouncementBar()}
        {/* Main Bar */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {renderBrand(false)}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            {renderSearchBar("পণ্য, ব্র্যান্ড বা ক্যাটাগরি সার্চ করুন...")}
          </div>
          {renderActionButtons(false)}
        </div>

        {/* Category Strip Bar */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <button 
              onClick={onOpenCategories}
              className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-black shrink-0 hover:bg-purple-700 shadow-xs"
            >
              <Menu size={13} />
              <span>সকল ক্যাটাগরি</span>
            </button>
            {safeCategories.slice(0, 8).map(c => {
              const catName = typeof c === 'object' ? (c.name || '') : String(c);
              return (
                <button
                  key={typeof c === 'object' ? (c.id || catName) : catName}
                  onClick={() => onSearchChange?.(catName)}
                  className="text-xs font-bold text-slate-600 hover:text-purple-600 hover:bg-white px-2.5 py-1 rounded-md shrink-0 transition-colors"
                >
                  {catName}
                </button>
              );
            })}
          </div>
        </div>
      </header>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // HEADER 04: SEARCH FIRST (Grocery / Tech)
  // ══════════════════════════════════════════════════════════════════
  if (hStyle === 'search_first') {
    return (
      <header className="sticky top-0 z-40 bg-white border-b-2 border-purple-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between gap-3">
            {renderBrand(false)}
            {/* Delivery badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-black">
              <MapPin size={12} className="text-emerald-600" />
              <span>ডেলিভারি এরিয়া: সমগ্র বাংলাদেশ</span>
            </div>
            <div className="md:hidden">
              {renderActionButtons(false)}
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-0 md:mx-4">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="🔍 দ্রুত যেকোনো পণ্য খুঁজে পেতে লিখুন..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 focus:bg-white text-xs font-black text-slate-800 rounded-2xl border-2 border-purple-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-xs"
              />
              <button 
                type="button" 
                className="absolute right-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 shadow-xs"
              >
                Search
              </button>
            </div>
          </div>

          <div className="hidden md:flex">
            {renderActionButtons(false)}
          </div>
        </div>
      </header>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // HEADER 05: FASHION EDITORIAL (Luxury Serif)
  // ══════════════════════════════════════════════════════════════════
  if (hStyle === 'fashion_editorial') {
    return (
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-stone-200/80 transition-all font-serif">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-6">
          <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest font-sans font-black text-stone-700">
            <button onClick={onOpenCategories} className="hover:text-stone-950 transition-colors">COLLECTIONS</button>
            <button onClick={() => onSearchChange?.('new')} className="hover:text-stone-950 transition-colors">NEW ARRIVALS</button>
            <button onClick={() => onSearchChange?.('trending')} className="hover:text-stone-950 transition-colors">EDITORIAL</button>
          </div>

          <div className="text-center mx-auto md:mx-0">
            {renderBrand(false)}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block w-36 font-sans">
              {renderSearchBar("Search look...")}
            </div>
            {renderActionButtons(false)}
          </div>
        </div>
      </header>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // HEADER 06: MARKETPLACE
  // ══════════════════════════════════════════════════════════════════
  if (hStyle === 'marketplace') {
    return (
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-lg transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
          {renderBrand(true)}

          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="w-full flex rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 focus-within:border-amber-400">
              <button 
                onClick={onOpenCategories}
                className="px-3 bg-slate-700 text-slate-200 text-xs font-black flex items-center gap-1 border-r border-slate-600 hover:bg-slate-600 shrink-0"
              >
                <span>ক্যাটাগরি</span>
                <ChevronDown size={12} />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="মার্কেটপ্লেসের লক্ষাধিক প্রোডাক্ট সার্চ করুন..."
                className="flex-1 px-3 py-2 bg-transparent text-xs font-bold text-white placeholder:text-slate-400 outline-none"
              />
              <button className="px-4 bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 flex items-center justify-center">
                <Search size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex flex-col text-right pr-2">
              <span className="text-[10px] text-slate-400 font-bold">হেল্পলাইন</span>
              <span className="text-xs font-black text-amber-400">24/7 সাপোর্ট</span>
            </div>
            {renderActionButtons(true)}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-3 pb-2.5">
          {renderSearchBar("মার্কেটপ্লেসে খুঁজুন...")}
        </div>
      </header>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // HEADER 07: GROCERY QUICK SHOP
  // ══════════════════════════════════════════════════════════════════
  if (hStyle === 'grocery_quick') {
    return (
      <header className="sticky top-0 z-40 bg-emerald-600 text-white shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenCategories}
              className="p-2 rounded-xl bg-emerald-700/80 text-white hover:bg-emerald-800"
            >
              <Menu size={18} />
            </button>
            {renderBrand(true)}
          </div>

          {/* Quick badge */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-emerald-700/80 rounded-2xl text-xs font-black border border-emerald-500">
            <Zap size={14} className="text-yellow-300" />
            <span>৩০ মিনিট এক্সপ্রেস সুপারশপ ডেলিভারি</span>
          </div>

          <div className="flex items-center gap-2">
            {renderActionButtons(true)}
          </div>
        </div>

        <div className="bg-emerald-700/90 px-3 py-2">
          <div className="max-w-7xl mx-auto">
            {renderSearchBar("🥦 তাজা শাকসবজি, ফলমূল বা ডেইলি বাজার খুঁজুন...")}
          </div>
        </div>
      </header>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // HEADER 08: ELECTRONICS PRO
  // ══════════════════════════════════════════════════════════════════
  if (hStyle === 'electronics') {
    return (
      <header className="sticky top-0 z-40 bg-slate-950 text-white border-b border-blue-900/50 shadow-xl transition-all">
        {/* Deals Top Ticker */}
        <div className="bg-blue-600 text-white text-[11px] font-black px-4 py-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 max-w-7xl mx-auto">
            <Zap size={12} className="text-amber-300 animate-bounce" /> 
            অফিশিয়াল ওয়ারেন্টি সহ ১০০% জেনুইন ইলেকট্রনিক্স ও গ্যাজেটস
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {renderBrand(true)}

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="w-full flex items-center bg-slate-900 border border-blue-500/30 rounded-xl px-3 py-1.5">
              <Search size={14} className="text-blue-400 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="স্মার্টফোন, ল্যাপটপ বা গেজেট খুঁজুন..."
                className="w-full bg-transparent text-xs font-bold text-white placeholder:text-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-black">
              <Phone size={13} className="text-blue-400" />
              <span>সহায়তা: {displayWa}</span>
            </div>
            {renderActionButtons(true)}
          </div>
        </div>
      </header>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // HEADER 09: MOBILE FIRST APP BAR
  // ══════════════════════════════════════════════════════════════════
  if (hStyle === 'mobile_first') {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-4xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={onOpenCategories} className="p-2 rounded-xl bg-slate-100 text-slate-800">
              <Menu size={18} />
            </button>
            {renderBrand(false)}
          </div>

          <div className="flex items-center gap-1.5">
            {renderActionButtons(false)}
          </div>
        </div>

        <div className="px-3 pb-2.5">
          {renderSearchBar("সার্চ করতে টাইপ করুন...")}
        </div>
      </header>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // HEADER 10: TRANSPARENT HERO HEADER (Glassmorphic)
  // ══════════════════════════════════════════════════════════════════
  const isTransparent = !isScrolled && !isPreview;
  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${
      isTransparent 
        ? 'bg-black/30 backdrop-blur-md text-white border-b border-white/10' 
        : 'bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-100 shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenCategories} 
            className={`p-2 rounded-xl transition-colors ${isTransparent ? 'text-white hover:bg-white/20' : 'text-slate-800 hover:bg-slate-100'}`}
          >
            <Menu size={20} />
          </button>
          {renderBrand(isTransparent)}
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className={`w-full flex items-center rounded-2xl px-3.5 py-2 border transition-all ${
            isTransparent 
              ? 'bg-white/20 border-white/30 text-white placeholder:text-white/70 backdrop-blur-md' 
              : 'bg-slate-100 border-slate-200 text-slate-900'
          }`}>
            <Search size={14} className="mr-2 opacity-70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="এক্সক্লুসিভ কালেকশন খুঁজুন..."
              className="w-full bg-transparent text-xs font-bold outline-none"
            />
          </div>
        </div>

        {renderActionButtons(isTransparent)}
      </div>
    </header>
  );
}
