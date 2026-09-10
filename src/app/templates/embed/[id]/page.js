'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { 
  ShoppingBag, Search, Star, Phone, Truck, ShieldCheck, 
  CheckCircle2, ArrowRight, Heart, Share2, Eye, Flame, 
  Clock, Zap, Sparkles, Upload, FileText, ChevronRight, 
  X, Check, AlertCircle, Plus, Minus
} from 'lucide-react';
import { DEFAULT_WEBSITE_TEMPLATES, findTemplateByIdOrSlug } from '@/lib/templatesData';
import { subscribeGlobalConfig } from '@/lib/firestore';
import SectionRenderer from '@/components/storefront/sections/SectionRenderer';
import { getSectionsForTemplate } from '@/lib/templateSectionPresets';
import toast from 'react-hot-toast';

export default function TemplateEmbedPage({ params }) {
  const unwrappedParams = use(params);
  const templateId = unwrappedParams?.id || 'modern_streetwear';

  const [template, setTemplate] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState('');
  const [uploadedPrescription, setUploadedPrescription] = useState(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);

  useEffect(() => {
    const unsub = subscribeGlobalConfig((config) => {
      const found = findTemplateByIdOrSlug(templateId, config?.websiteTemplates);
      setTemplate(found);
    });
    return () => unsub();
  }, [templateId]);

  const activeTemplate = template || DEFAULT_WEBSITE_TEMPLATES.find(t => t.id === templateId) || DEFAULT_WEBSITE_TEMPLATES[0];

  // Resolve category-smart dynamic sections from Picture 2
  const dynamicSections = useMemo(() => {
    return getSectionsForTemplate(activeTemplate.id, activeTemplate.category, activeTemplate);
  }, [activeTemplate]);

  // Unified theme tokens
  const themeVars = useMemo(() => ({
    primaryColor: activeTemplate.primaryColor || '#6D28D9',
    secondaryColor: activeTemplate.secondaryColor || '#1E1B4B',
    accentColor: activeTemplate.accentColor || '#A855F7',
    bgColor: activeTemplate.bgColor || '#F8FAFC',
    textColor: activeTemplate.textColor || '#0F172A',
    font: activeTemplate.font || 'Hind Siliguri, sans-serif',
    buttonRadius: activeTemplate.buttonRadius || '12px',
    cardRadius: activeTemplate.cardRadius || '16px',
  }), [activeTemplate]);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: (i.qty || 1) + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setShowCart(true);
    toast.success(`${product.name || 'পণ্য'} কার্টে যোগ হয়েছে!`);
  };

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPrescription(true);
    setTimeout(() => {
      setUploadedPrescription(file.name);
      setUploadingPrescription(false);
      toast.success('প্রেসক্রিপশন সফলভাবে আপলোড হয়েছে! আমাদের ফার্মাসিস্ট আপনার সাথে যোগাযোগ করবে।');
    }, 900);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);

  return (
    <div 
      className="min-h-screen flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-purple-600 selection:text-white pb-16 md:pb-0"
      style={{
        backgroundColor: themeVars.bgColor,
        color: themeVars.textColor,
        fontFamily: themeVars.font
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
      ) : activeTemplate.category === 'grocery' ? (
        <div className="bg-emerald-900 text-emerald-100 px-3 py-1.5 text-[11px] font-bold flex items-center justify-between overflow-hidden">
          <span className="truncate font-mono">🥬 আজকের তাজা শাকসবজি ও গ্রোসারি সরাসরি কৃষক ও মিল থেকে</span>
          <span className="hidden sm:inline-block shrink-0 px-2 py-0.5 rounded bg-emerald-700 text-[10px]">
            আজকের সেরা বাজার
          </span>
        </div>
      ) : activeTemplate.category === 'tech' ? (
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
          style={{ backgroundColor: themeVars.secondaryColor }}
        >
          <div className="flex items-center gap-2 truncate">
            <Truck size={13} />
            <span className="truncate">Steadfast কুরিয়ারে সারাদেশে দ্রুত হোম ডেলিভারি | বিকাশ/নগদ ক্যাশ অন ডেলিভারি</span>
          </div>
          <span className="hidden sm:inline text-[10px]">হটলাইন: ০১৭০০-০০০০০০</span>
        </div>
      )}

      {/* ── 2. STOREFRONT HEADER ── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-white/10 px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div 
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white font-black text-base sm:text-lg shadow-md shrink-0"
            style={{ backgroundColor: themeVars.primaryColor }}
          >
            {activeTemplate.titleBn?.charAt(0) || 'B'}
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-black tracking-tight truncate" style={{ color: themeVars.secondaryColor }}>
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
              placeholder={`${activeTemplate.categoryBn || 'স্টোরের'}-এর পণ্য খুঁজুন...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-full border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-purple-600 bg-slate-50 dark:bg-white/5"
            />
            <div 
              className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full text-white flex items-center justify-center"
              style={{ backgroundColor: themeVars.primaryColor }}
            >
              <Search size={13} />
            </div>
          </div>
        </div>

        {/* Cart Icon */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowCart(true)}
            className="relative p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingBag size={17} />
            <span className="hidden sm:inline text-xs font-bold">কার্ট</span>
            {cartItems.length > 0 && (
              <span 
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow"
                style={{ backgroundColor: themeVars.primaryColor }}
              >
                {cartItems.reduce((a, b) => a + (b.qty || 1), 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── 3. CATEGORY HERO BANNER ── */}
      <section className="p-3 sm:p-6">
        <div 
          className="rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl"
          style={{ 
            background: `linear-gradient(135deg, ${themeVars.primaryColor} 0%, ${themeVars.secondaryColor} 100%)`,
            borderRadius: themeVars.cardRadius
          }}
        >
          <div className="space-y-3 sm:space-y-4 max-w-xl text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-[10px] sm:text-xs font-black">
              <Sparkles size={12} />
              <span>{activeTemplate.hero?.tag || activeTemplate.badge || 'NEW DROP 2026'}</span>
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
                  const target = document.getElementById('products-section') || document.getElementById('section-product_grid');
                  target?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-full bg-white text-slate-950 font-black text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                style={{ borderRadius: themeVars.buttonRadius }}
              >
                <span>{activeTemplate.hero?.ctaPrimary || 'নতুন ড্রপ দেখুন'}</span>
                <ArrowRight size={13} />
              </button>

              <span className="text-[10px] text-white/80 font-bold px-2 py-1">
                {activeTemplate.hero?.ctaSecondary || 'লুকবুক ব্রাউজ করুন'}
              </span>
            </div>
          </div>

          <div className="w-full md:w-80 h-48 sm:h-60 rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0 z-10">
            <img 
              src={activeTemplate.hero?.imageUrl || activeTemplate.bannerImage || activeTemplate.thumbnail} 
              alt={activeTemplate.title} 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute -right-8 -bottom-8 w-60 h-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* ── 4. PHARMACY PRESCRIPTION UPLOAD BANNER (if pharmacy) ── */}
      {activeTemplate.specialType === 'pharmacy' && (
        <section className="px-3 sm:px-6 mb-4">
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
        </section>
      )}

      {/* ── 5. DYNAMIC HIGH-CONVERTING SECTIONS (FROM VISUAL STORE DESIGNER) ── */}
      <div className="space-y-4">
        {dynamicSections.map(sec => (
          <div key={sec.id} id={`section-${sec.id}`}>
            <SectionRenderer
              section={sec}
              products={activeTemplate.sampleProducts || []}
              themeVars={themeVars}
              callbacks={{
                onAddToCart: (p) => addToCart(p),
                onProductClick: (p) => addToCart(p),
              }}
              isPreview={true}
            />
          </div>
        ))}
      </div>

      {/* ── 6. FOOTER ── */}
      <footer className="mt-auto bg-slate-900 text-white p-6 text-xs text-slate-400 space-y-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
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
        <div className="max-w-7xl mx-auto border-t border-slate-800 pt-3 text-center text-[10px] text-slate-500">
          © {new Date().getFullYear()} {activeTemplate.titleBn} • সর্বস্বত্ব সংরক্ষিত
        </div>
      </footer>

      {/* ── 7. MOBILE FIXED BOTTOM NAVIGATION BAR ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 py-1.5 px-3 flex items-center justify-around shadow-lg">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center text-[10px] font-bold text-slate-700 dark:text-slate-300"
        >
          <span className="text-base">🏠</span>
          <span>হোম</span>
        </button>
        <button 
          onClick={() => {
            const target = document.getElementById('section-product_grid') || document.getElementById('products-section');
            target?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center text-[10px] font-bold text-slate-700 dark:text-slate-300"
        >
          <span className="text-base">🛍️</span>
          <span>পণ্য</span>
        </button>
        <button 
          onClick={() => setShowCart(true)}
          className="relative flex flex-col items-center text-[10px] font-bold"
          style={{ color: themeVars.primaryColor }}
        >
          <span className="text-base">🛒</span>
          <span>কার্ট ({cartItems.reduce((a, b) => a + (b.qty || 1), 0)})</span>
        </button>
      </div>

      {/* ── 8. SHOPPING CART DRAWER ── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-full p-5 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-white/10">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <h3 className="font-black text-sm">শপিং ব্যাগ ({cartItems.length})</h3>
                <button onClick={() => setShowCart(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="py-3 space-y-2.5 max-h-[60vh] overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 font-bold text-xs">কার্ট খালি আছে</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-xs">
                      <img src={item.imageUrl || item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{item.name}</p>
                        <p className="text-purple-600 dark:text-purple-400 font-mono">৳ {item.price} × {item.qty || 1}</p>
                      </div>
                      <span className="font-black font-mono">৳ {((item.price || 0) * (item.qty || 1)).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span>সর্বমোট:</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono">৳ {totalAmount.toLocaleString()}</span>
              </div>
              <button
                onClick={() => {
                  toast.success('এটি একটি ডেমো স্টোর। নিজস্ব ওয়েবসাইট চালু করতে উপরের "সিলেক্ট করুন" বাটন চাপুন!');
                  setShowCart(false);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow cursor-pointer transition-all active:scale-95"
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
