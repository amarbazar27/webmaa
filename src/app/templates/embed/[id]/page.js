'use client';

import { useState, useEffect, use } from 'react';
import { 
  ShoppingBag, Search, Star, Phone, Truck, ShieldCheck, 
  CheckCircle2, ArrowRight, Heart, Share2, Eye, Flame, 
  Clock, Zap, Sparkles, Upload, FileText, ChevronRight, 
  X, Check, AlertCircle, Plus, Minus
} from 'lucide-react';
import { DEFAULT_WEBSITE_TEMPLATES, findTemplateByIdOrSlug } from '@/lib/templatesData';
import { subscribeGlobalConfig } from '@/lib/firestore';
import toast from 'react-hot-toast';

export default function TemplateEmbedPage({ params }) {
  const unwrappedParams = use(params);
  const templateId = unwrappedParams?.id || 'health_pharmacy';

  const [template, setTemplate] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [activeMenuTab, setActiveMenuTab] = useState('all');
  const [uploadedPrescription, setUploadedPrescription] = useState(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [beforeAfterPos, setBeforeAfterPos] = useState(50);

  useEffect(() => {
    const unsub = subscribeGlobalConfig((config) => {
      const found = findTemplateByIdOrSlug(templateId, config?.websiteTemplates);
      setTemplate(found);
    });
    return () => unsub();
  }, [templateId]);

  const activeTemplate = template || DEFAULT_WEBSITE_TEMPLATES[0];

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setShowCart(true);
    toast.success(`${product.name} কার্টে যোগ হয়েছে!`);
  };

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPrescription(true);
    setTimeout(() => {
      setUploadedPrescription(file.name);
      setUploadingPrescription(false);
      toast.success('প্রেসক্রিপশন সফলভাবে আপলোড হয়েছে! আমাদের ফার্মাসিস্ট আপনার সাথে ফোনে যোগাযোগ করবে।');
    }, 900);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div 
      className="min-h-screen flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-purple-600 selection:text-white pb-16 md:pb-0"
      style={{
        backgroundColor: activeTemplate.bgColor || '#F8FAFC',
        color: activeTemplate.textColor || '#0F172A',
        fontFamily: activeTemplate.font || 'Hind Siliguri, sans-serif'
      }}
    >
      {/* ── 1. INDUSTRY-SPECIFIC TOP NOTIFICATION STRIP ── */}
      {activeTemplate.specialType === 'pharmacy' ? (
        <div className="bg-sky-950 text-sky-200 px-3 py-1.5 text-[11px] font-bold flex items-center justify-between border-b border-sky-800">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="truncate">🚑 জরুরি কোল্ড-চেইন ডেলিভারি | ১০০% ডিজিডিএ অনুমোদিত জেনুইন ঔষধ</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px]">
            <span>হেল্পলাইন: ০১৭০০-০০০০০০</span>
            <span>রেজিস্টার্ড ফার্মাসিস্ট অনলাইন</span>
          </div>
        </div>
      ) : activeTemplate.specialType === 'grocery' ? (
        <div className="bg-emerald-900 text-emerald-100 px-3 py-1.5 text-[11px] font-bold flex items-center justify-between overflow-hidden">
          <span className="truncate font-mono">{activeTemplate.tickerText}</span>
          <span className="hidden sm:inline-block shrink-0 px-2 py-0.5 rounded bg-emerald-700 text-[10px]">
            আজকের বাজার
          </span>
        </div>
      ) : activeTemplate.specialType === 'tech' ? (
        <div className="bg-slate-950 text-cyan-300 px-3 py-1.5 text-[11px] font-mono flex items-center justify-between border-b border-cyan-900/40">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-cyan-400" />
            <span>অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি | ১-ক্লিক ফাস্ট ডেলিভারি</span>
          </div>
          <span className="text-[10px] text-cyan-400">⚡ StarTech / Apple স্পেক্স কমপ্লায়েন্ট</span>
        </div>
      ) : (
        <div 
          className="px-3 py-1.5 text-white text-[11px] font-bold flex items-center justify-between shadow-sm"
          style={{ backgroundColor: activeTemplate.secondaryColor }}
        >
          <div className="flex items-center gap-2 truncate">
            <Truck size={13} />
            <span className="truncate">Steadfast কুরিয়ারে সারাদেশে দ্রুত হোম ডেলিভারি | বিকাশ/নগদ ক্যাশ অন ডেলিভারি</span>
          </div>
          <span className="hidden sm:inline text-[10px]">হটলাইন: ০১৭০০-০০০০০০</span>
        </div>
      )}

      {/* ── 2. STOREFRONT HEADER ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div 
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white font-black text-base sm:text-lg shadow-md shrink-0"
            style={{ backgroundColor: activeTemplate.primaryColor }}
          >
            {activeTemplate.titleBn?.charAt(0) || 'B'}
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-black tracking-tight truncate" style={{ color: activeTemplate.secondaryColor }}>
              {activeTemplate.titleBn}
            </h1>
            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 truncate">
              {activeTemplate.demoSubdomain}.bdretailers.com
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="w-full relative">
            <input 
              type="text" 
              placeholder={`${activeTemplate.categoryBn}-এর পণ্য খুঁজুন...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-full border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600 bg-slate-50"
            />
            <div 
              className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full text-white flex items-center justify-center"
              style={{ backgroundColor: activeTemplate.primaryColor }}
            >
              <Search size={13} />
            </div>
          </div>
        </div>

        {/* Cart Icon */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowCart(true)}
            className="relative p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingBag size={18} />
            <span className="hidden sm:inline text-xs font-bold">কার্ট</span>
            {cartItems.length > 0 && (
              <span 
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow"
                style={{ backgroundColor: activeTemplate.primaryColor }}
              >
                {cartItems.reduce((a, b) => a + b.qty, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── 3. CATEGORY SPECIFIC HERO SECTION ── */}
      <section className="p-3 sm:p-6">
        <div 
          className="rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${activeTemplate.primaryColor} 0%, ${activeTemplate.secondaryColor} 100%)`,
            borderRadius: activeTemplate.cardRadius || '20px'
          }}
        >
          <div className="space-y-3 sm:space-y-4 max-w-xl text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-[10px] sm:text-xs font-black">
              <Sparkles size={12} />
              <span>{activeTemplate.hero?.tag || activeTemplate.badge}</span>
            </div>
            
            <h2 className="text-xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight">
              {activeTemplate.hero?.title || activeTemplate.titleBn}
            </h2>

            <p className="text-[11px] sm:text-xs text-white/90 font-medium leading-relaxed">
              {activeTemplate.hero?.subtitle || activeTemplate.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button 
                onClick={() => {
                  const target = document.getElementById('products-section');
                  target?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-full bg-white text-slate-950 font-black text-xs shadow hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                style={{ borderRadius: activeTemplate.buttonRadius }}
              >
                <span>{activeTemplate.hero?.ctaPrimary || 'পণ্য দেখুন'}</span>
                <ArrowRight size={13} />
              </button>

              <span className="text-[10px] text-white/80 font-bold px-2 py-1">
                {activeTemplate.hero?.ctaSecondary}
              </span>
            </div>
          </div>

          <div className="w-full md:w-72 h-44 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0 z-10">
            <img 
              src={activeTemplate.hero?.imageUrl || activeTemplate.thumbnail} 
              alt={activeTemplate.title} 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* ── 4. PHARMACY SPECIAL: PRESCRIPTION UPLOAD BANNER & HEALTH CONCERNS ── */}
      {activeTemplate.specialType === 'pharmacy' && (
        <section className="px-3 sm:px-6 space-y-4">
          {/* Prescription Upload Card */}
          <div className="p-4 sm:p-6 rounded-2xl bg-sky-50 border-2 border-dashed border-sky-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-sky-950">
                  প্রেসক্রিপশন আপলোড করে ঔষধ অর্ডার করুন
                </h3>
                <p className="text-[11px] text-sky-700 font-medium">
                  ডাক্তারের প্রেসক্রিপশনের ছবি তুলে আপলোড দিন। আমাদের রেজিস্টার্ড ফার্মাসিস্ট ঔষধ মিলিয়ে ডেলিভারি নিশ্চিত করবে।
                </p>
                {uploadedPrescription && (
                  <p className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 size={13} /> {uploadedPrescription} আপলোড সম্পন্ন
                  </p>
                )}
              </div>
            </div>

            <label className="shrink-0 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs cursor-pointer shadow flex items-center gap-2 active:scale-95 transition-all">
              <Upload size={14} />
              <span>{uploadingPrescription ? 'আপলোড হচ্ছে...' : 'ছবি তুলুন / আপলোড দিন'}</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePrescriptionUpload} 
              />
            </label>
          </div>

          {/* Health Concerns Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-800">
                স্বাস্থ্য সমস্যা অনুযায়ী ঔষধ (Browse by Health Concern)
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">সার্টিফাইড ড্রাগস</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(activeTemplate.concerns || []).map((cn) => (
                <button
                  key={cn.id}
                  onClick={() => setSelectedConcern(selectedConcern === cn.id ? null : cn.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedConcern === cn.id 
                      ? 'ring-2 ring-sky-500 shadow-md scale-105' 
                      : ''
                  } ${cn.color}`}
                >
                  <p className="text-xs font-black truncate">{cn.title}</p>
                  <p className="text-[10px] opacity-80 line-clamp-1">{cn.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. GROCERY SPECIAL: FLASH SALE & BUNDLE PACK ── */}
      {activeTemplate.specialType === 'grocery' && (
        <section className="px-3 sm:px-6 space-y-4">
          {/* Flash Sale Strip with live timer */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-red-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Flame size={18} className="animate-bounce text-yellow-300" />
              <span className="text-xs sm:text-sm font-black uppercase">আজকের ধামাকা ফ্ল্যাশ সেল</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs font-black bg-red-950/60 px-3 py-1 rounded-xl">
              <Clock size={13} className="text-yellow-400" />
              <span>শেষ হতে বাকি: ০৩:৪৫:১২</span>
            </div>
          </div>

          {/* Monthly Grocery Bundle Pack Card */}
          {activeTemplate.bundle && (
            <div className="p-4 sm:p-6 rounded-2xl bg-white border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <img 
                src={activeTemplate.bundle.imageUrl} 
                alt="Bundle" 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover" 
              />
              <div className="flex-1 text-left space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-700 px-2 py-0.5 rounded bg-emerald-50">
                  বান্ডেল সেভিংস প্যাকেজ
                </span>
                <h4 className="text-sm sm:text-base font-black text-slate-900">
                  {activeTemplate.bundle.title}
                </h4>
                <p className="text-xs text-slate-600">{activeTemplate.bundle.desc}</p>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-base font-black text-emerald-700">৳ {activeTemplate.bundle.price}</span>
                  <span className="text-xs text-slate-400 line-through">৳ {activeTemplate.bundle.oldPrice}</span>
                  <span className="text-[10px] font-black text-rose-600">৳ {activeTemplate.bundle.saveAmount} সাশ্রয়!</span>
                </div>
              </div>
              <button 
                onClick={() => addToCart({ id: 'bundle_1', name: activeTemplate.bundle.title, price: activeTemplate.bundle.price, image: activeTemplate.bundle.imageUrl })}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow active:scale-95 transition-all cursor-pointer shrink-0"
              >
                পুরো বাজার কার্টে নিন
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── 6. FASHION SPECIAL: VIDEO REELS ── */}
      {activeTemplate.specialType === 'fashion' && (
        <section className="px-3 sm:px-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-slate-900">
              শপেবল ফ্যাশন রিলস (Trending Reels)
            </h3>
            <span className="text-[10px] text-purple-600 font-bold">ভিডিও দেখে অর্ডার করুন</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {(activeTemplate.reels || []).map((reel) => (
              <div key={reel.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow group">
                <img src={reel.thumbnail} alt={reel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 p-2 sm:p-3 flex flex-col justify-between text-white text-left">
                  <span className="text-[9px] font-bold bg-white/20 backdrop-blur px-1.5 py-0.5 rounded w-fit">{reel.views} ভিউ</span>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-black truncate">{reel.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-mono text-amber-300">{reel.price}</span>
                      <button 
                        onClick={() => addToCart({ id: reel.id, name: reel.title, price: 2450, image: reel.thumbnail })}
                        className="p-1 rounded-lg bg-purple-600 text-white text-[10px]"
                      >
                        কিনুন
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 7. BEAUTY SPECIAL: BEFORE / AFTER SLIDER ── */}
      {activeTemplate.specialType === 'beauty' && activeTemplate.beforeAfter && (
        <section className="px-3 sm:px-6 space-y-2">
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-pink-200 shadow-sm text-center space-y-3">
            <span className="text-[10px] font-black uppercase text-pink-600 tracking-wider">রিয়েল রেজাল্ট কম্প্যারিজম</span>
            <h3 className="text-xs sm:text-sm font-black text-slate-900">{activeTemplate.beforeAfter.title}</h3>
            
            <div className="relative aspect-video max-w-md mx-auto rounded-2xl overflow-hidden shadow">
              <img src={activeTemplate.beforeAfter.afterImg} alt="After" className="w-full h-full object-cover" />
              <div 
                className="absolute inset-0 overflow-hidden border-r-2 border-white"
                style={{ width: `${beforeAfterPos}%` }}
              >
                <img src={activeTemplate.beforeAfter.beforeImg} alt="Before" className="w-full h-full object-cover max-w-none" style={{ width: '100%' }} />
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded">আগে (Before)</span>
              </div>
              <span className="absolute top-2 right-2 bg-pink-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">১৪ দিন পর (After)</span>
            </div>

            <div className="max-w-xs mx-auto">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={beforeAfterPos} 
                onChange={e => setBeforeAfterPos(e.target.value)} 
                className="w-full accent-pink-600 cursor-pointer"
              />
              <p className="text-[9px] text-slate-400 mt-1">{activeTemplate.beforeAfter.note}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── 8. TECH SPECIAL: SPEC BREAKDOWN & BRAND MARQUEE ── */}
      {activeTemplate.specialType === 'tech' && (
        <section className="px-3 sm:px-6 space-y-3">
          {/* Brand Marquee */}
          <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-around overflow-x-auto gap-4 text-xs font-mono font-bold text-slate-400">
            {(activeTemplate.brands || []).map((b, i) => (
              <span key={i} className="hover:text-cyan-400 transition-colors whitespace-nowrap">{b}</span>
            ))}
          </div>

          {/* Specs comparison */}
          {activeTemplate.specsComparison && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 text-left">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{activeTemplate.specsComparison.title}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeTemplate.specsComparison.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <p className="font-black text-slate-900">{it.model}</p>
                    <p className="text-slate-600 text-[11px]">ব্যাটারি: {it.battery}</p>
                    <p className="text-slate-600 text-[11px]">এএনসি: {it.anc}</p>
                    <p className="text-cyan-700 font-bold text-[10px]">{it.warranty}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 9. CATEGORIES HORIZONTAL SCROLLER ── */}
      {activeTemplate.sampleCategories && activeTemplate.sampleCategories.length > 0 && (
        <section className="px-3 sm:px-6 py-2">
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
            {activeTemplate.sampleCategories.map((c) => (
              <div 
                key={c.id} 
                className="shrink-0 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-2 cursor-pointer hover:border-purple-500 transition-all"
              >
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px]"
                  style={{ backgroundColor: activeTemplate.primaryColor }}
                >
                  ✓
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-900 leading-none">{c.name}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{c.count}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 10. PRODUCT GRID (RESPONSIVE 2-COL MOBILE, 4-COL DESKTOP) ── */}
      <section id="products-section" className="px-3 sm:px-6 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-black text-slate-900">
            জনপ্রিয় পণ্যসমূহ ({activeTemplate.categoryBn})
          </h3>
          <span className="text-[10px] text-slate-500 font-bold">
            {(activeTemplate.sampleProducts || []).length} টি আইটেম
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          {(activeTemplate.sampleProducts || []).map((prod) => (
            <div 
              key={prod.id}
              className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left group"
              style={{ borderRadius: activeTemplate.cardRadius }}
            >
              <div className="space-y-2">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50">
                  <img 
                    src={prod.image} 
                    alt={prod.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                  {prod.badge && (
                    <span 
                      className="absolute top-1.5 left-1.5 text-[9px] font-black text-white px-1.5 py-0.5 rounded-md shadow"
                      style={{ backgroundColor: activeTemplate.primaryColor }}
                    >
                      {prod.badge}
                    </span>
                  )}
                </div>

                <h4 className="text-[11px] sm:text-xs font-black text-slate-900 line-clamp-2 min-h-[30px]">
                  {prod.name}
                </h4>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs sm:text-sm font-black text-slate-900">
                    ৳ {prod.price.toLocaleString()}
                  </span>
                  {prod.oldPrice && (
                    <span className="text-[10px] text-slate-400 line-through">
                      ৳ {prod.oldPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => addToCart(prod)}
                className="mt-2.5 w-full py-2 rounded-xl text-white text-[11px] font-black flex items-center justify-center gap-1 shadow hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                style={{ 
                  backgroundColor: activeTemplate.primaryColor,
                  borderRadius: activeTemplate.buttonRadius 
                }}
              >
                <ShoppingBag size={13} />
                <span>অর্ডার করুন</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── 11. FOOTER ── */}
      <footer className="mt-auto bg-slate-900 text-white p-6 text-xs text-slate-400 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-white font-black text-sm">{activeTemplate.titleBn}</h4>
            <p className="text-[11px] mt-1">
              উচ্চগতির হোস্টিং ও স্বয়ংক্রিয় ক্লাউড আর্কিটেকচার • Powered by bdretailers.com
            </p>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span>ক্যাশ অন ডেলিভারি</span>
            <span>বিকাশ/নগদ পেমেন্ট</span>
            <span>Steadfast কুরিয়ার</span>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-3 text-center text-[10px] text-slate-500">
          © {new Date().getFullYear()} {activeTemplate.titleBn}
        </div>
      </footer>

      {/* ── 12. MOBILE FIXED BOTTOM NAVIGATION BAR ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-lg">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center text-[10px] font-bold text-slate-700"
        >
          <span className="text-base">🏠</span>
          <span>হোম</span>
        </button>
        <button 
          onClick={() => {
            const target = document.getElementById('products-section');
            target?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center text-[10px] font-bold text-slate-700"
        >
          <span className="text-base">🛍️</span>
          <span>পণ্য</span>
        </button>
        <button 
          onClick={() => setShowCart(true)}
          className="relative flex flex-col items-center text-[10px] font-bold"
          style={{ color: activeTemplate.primaryColor }}
        >
          <span className="text-base">🛒</span>
          <span>কার্ট ({cartItems.reduce((a, b) => a + b.qty, 0)})</span>
        </button>
      </div>

      {/* ── 13. SHOPPING CART DRAWER ── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white text-slate-900 h-full p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-sm">শপিং ব্যাগ ({cartItems.length})</h3>
                <button onClick={() => setShowCart(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <div className="py-3 space-y-2.5 max-h-[60vh] overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 font-bold text-xs">কার্ট খালি আছে</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{item.name}</p>
                        <p className="text-purple-600 font-mono">৳ {item.price} x {item.qty}</p>
                      </div>
                      <span className="font-black font-mono">৳ {(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span>সর্বমোট:</span>
                <span className="text-purple-600 font-mono">৳ {totalAmount.toLocaleString()}</span>
              </div>
              <button
                onClick={() => {
                  toast.success('এটি একটি ডেমো স্টোর। নিজস্ব ওয়েবসাইট চালু করতে উপরের "সিলেক্ট করুন" বাটন চাপুন!');
                  setShowCart(false);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-black text-xs shadow hover:bg-purple-700"
              >
                চেকআউট করুন (ডেমো)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
