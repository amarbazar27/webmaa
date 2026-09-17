'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, ShoppingBag, Eye, ArrowRight, CheckCircle2, 
  Search, Star, ExternalLink, ShieldCheck, Zap, Store, 
  Smartphone, Filter, ChevronRight, X, Layers, Crown, Check
} from 'lucide-react';
import { 
  DEFAULT_WEBSITE_TEMPLATES, 
  TEMPLATE_CATEGORIES, 
  getMergedTemplates, 
  getDemoUrl 
} from '@/lib/templatesData';
import { subscribeGlobalConfig, updateShop, getAllShops } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/ui/Logo';
import toast from 'react-hot-toast';

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalConfig, setGlobalConfig] = useState(null);
  const [templates, setTemplates] = useState(DEFAULT_WEBSITE_TEMPLATES);
  
  // Theme apply modal state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [userShops, setUserShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const unsub = subscribeGlobalConfig((config) => {
      setGlobalConfig(config);
      setTemplates(getMergedTemplates(config?.websiteTemplates, config?.deletedTemplateIds));
    });
    return () => unsub();
  }, []);

  // Fetch logged in user's shops
  useEffect(() => {
    if (user?.email) {
      getAllShops().then(all => {
        const myShops = all.filter(s => s.ownerEmail === user.email || s.createdBy === user.uid);
        setUserShops(myShops);
        if (myShops.length > 0) {
          setSelectedShopId(myShops[0].id);
        }
      }).catch(console.error);
    }
  }, [user]);

  const filteredTemplates = templates.filter(tpl => {
    const matchCategory = activeCategory === 'all' || tpl.category === activeCategory;
    const matchSearch = 
      (tpl.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.titleBn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.categoryBn || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch && tpl.isActive !== false;
  });

  const handleApplyTheme = async (tpl) => {
    const targetTemplate = tpl || selectedTemplate;
    if (!targetTemplate) return;

    if (!user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('selected_theme_intent', JSON.stringify({
          id: targetTemplate.id,
          themePresetId: targetTemplate.themePresetId,
          primaryColor: targetTemplate.primaryColor
        }));
      }
      router.push(`/become-retailer?selectedTheme=${targetTemplate.id}`);
      return;
    }

    if (userShops.length === 0) {
      router.push(`/become-retailer?selectedTheme=${targetTemplate.id}`);
      return;
    }

    if (!selectedShopId) {
      toast.error('দয়া করে আপনার শপ নির্বাচন করুন');
      return;
    }

    setApplying(true);
    const toastId = toast.loading('ডিজাইনটি শপে সেট করা হচ্ছে...');
    try {
      const themePayload = {
        presetId: targetTemplate.themePresetId,
        primaryColor: targetTemplate.primaryColor,
        secondaryColor: targetTemplate.secondaryColor,
        accentColor: targetTemplate.accentColor,
        bgColor: targetTemplate.bgColor,
        textColor: targetTemplate.textColor,
        font: targetTemplate.font,
        buttonRadius: targetTemplate.buttonRadius,
        cardRadius: targetTemplate.cardRadius
      };

      await updateShop(selectedShopId, {
        theme: themePayload,
        headerConfig: {
          style: targetTemplate.headerStyle || 'classic',
          showSearch: true,
          showCart: true,
          showHotline: true
        },
        footerConfig: {
          style: targetTemplate.footerStyle || 'classic_4col',
          showNewsletter: true
        }
      });

      toast.success(`🎉 ${targetTemplate.titleBn} সফলভাবে আপনার স্টোরে সেট হয়েছে!`, { id: toastId });
      setSelectedTemplate(null);

      const targetShop = userShops.find(s => s.id === selectedShopId);
      if (targetShop) {
        const slug = targetShop.subdomainSlug || targetShop.shopSlug;
        setTimeout(() => {
          window.open(`https://${slug}.bdretailers.com`, '_blank');
        }, 800);
      }
    } catch (err) {
      toast.error('ডিজাইন সেট করা ব্যর্থ হয়েছে: ' + err.message, { id: toastId });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-purple-600 selection:text-white">
      {/* Soft Ambient Background Gradients */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/60 via-slate-50 to-white pointer-events-none" />
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Main Top Navbar ── */}
      <nav className="sticky top-0 z-50 px-4 sm:px-6 py-3.5 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo href="/" className="scale-105" text="bdretailers.com" />
            <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-600">
              <Link href="/" className="hover:text-purple-600 transition-colors">হোম</Link>
              <Link href="/templates" className="text-purple-600">রেডিমেড ওয়েবসাইট</Link>
              <Link href="/become-retailer" className="hover:text-purple-600 transition-colors">মার্চেন্ট প্ল্যাটফর্ম</Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/become-retailer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Store size={14} />
              <span>১ মিনিটে স্টোর খুলুন</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-black uppercase tracking-wider">
          <Sparkles size={14} />
          <span>প্রিমিয়াম রেডিমেড ওয়েবসাইট গ্যালারি</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 leading-tight">
          আপনার ব্যবসার জন্য সেরা <br />
          <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
            রেডিমেড ওয়েবসাইট ডিজাইন
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
          যেকোনো ক্যাটাগরির জন্য সম্পূর্ণ রেডিমেড ওয়েবসাইট বেছে নিন। প্রতিটি ডিজাইনের লাইভ ডেমো দেখুন, মোবাইল রেসপন্সিভনেস টেস্ট করুন এবং ১ ক্লিকেই আপনার ব্র্যান্ডের জন্য চালু করুন।
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-xs">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>১৫+ ক্যাটাগরি ডিজাইন</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-xs">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>বিকাশ ও নগদ পেমেন্ট গেটওয়ে</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-xs">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Steadfast কুরিয়ার অটো ট্র্যাকিং</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-xs">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>অ্যান্ড্রয়েড APK মোবাইল অ্যাপ রেডি</span>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="max-w-xl mx-auto pt-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="গ্রোসারি, ফ্যাশন, টেক, বিউটি বা জুয়েলারি ডিজাইন খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border-2 border-purple-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-bold outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Category Filter Pills Bar ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-b border-slate-200">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/25 scale-102'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-purple-700 hover:border-purple-300'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Templates Grid Showcase ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {filteredTemplates.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <ShoppingBag size={48} className="mx-auto text-slate-300" />
            <h3 className="text-base font-black text-slate-800">কোনো ডিজাইন পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500">অনুগ্রহ করে অন্য কোনো কি-ওয়ার্ড দিয়ে সার্চ করুন অথবা ক্যাটাগরি পরিবর্তন করুন।</p>
            <button
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
            >
              সব ডিজাইন দেখুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredTemplates.map((tpl) => {
              const liveUrl = getDemoUrl(tpl);

              return (
                <div
                  key={tpl.id}
                  className="group relative bg-white rounded-3xl border border-slate-200/90 overflow-hidden hover:border-purple-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between shadow-xs text-slate-900"
                >
                  <div>
                    {/* Thumbnail with overlay & badge */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img 
                        src={tpl.thumbnail} 
                        alt={tpl.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Floating Badge */}
                      {tpl.badge && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md bg-black/70 backdrop-blur-md border border-white/20">
                          {tpl.badge}
                        </div>
                      )}

                      {/* Demo Subdomain Pill */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-700 bg-white/95 backdrop-blur-md border border-emerald-500/30 flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{tpl.demoSubdomain}.bdretailers.com</span>
                      </div>

                      {/* Hover Quick Actions */}
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 p-4">
                        <Link
                          href={`/templates/preview/${tpl.id}`}
                          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg transition-all flex items-center gap-1.5"
                        >
                          <Eye size={14} />
                          <span>ইন্টারঅ্যাক্টিভ ডেমো</span>
                        </Link>
                        <a
                          href={liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 transition-all flex items-center gap-1"
                          title="নতুন ট্যাবে খুলুন"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-6 space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-purple-600">
                          {tpl.categoryBn}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                          <Star size={13} className="fill-amber-500" />
                          <span>{tpl.rating || '4.9'}</span>
                          <span className="text-slate-400 text-[10px]">({tpl.storesCount || '100+'} স্টোর)</span>
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                        {tpl.titleBn}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2 min-h-[32px]">
                        {tpl.description}
                      </p>

                      {/* Color Palette preview dots */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">রং প্যালেট:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: tpl.primaryColor }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: tpl.secondaryColor }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: tpl.accentColor }} />
                        </div>
                      </div>

                      {/* Feature bullets */}
                      <ul className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                        {(tpl.features || []).slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check size={13} className="text-emerald-500 shrink-0" />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Card Bottom CTA Buttons */}
                  <div className="p-5 sm:p-6 pt-0 grid grid-cols-2 gap-2">
                    <Link
                      href={`/templates/preview/${tpl.id}`}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1"
                    >
                      <Eye size={13} />
                      <span>লাইভ ডেমো</span>
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedTemplate(tpl);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>সিলেক্ট করুন</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Why bdretailers.com Templates are Superior Section ── */}
      <section className="bg-white border-t border-slate-200 py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              কেন bdretailers.com এর <span className="text-purple-600">রেডিমেড ডিজাইন সেরা?</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              ওয়ার্ডপ্রেস বা সাধারণ স্টোরের চেয়ে আমাদের ক্লাউড আর্কিটেকচার ৪ গুণ দ্রুত এবং সরাসরি বাংলাদেশের স্থানীয় পেমেন্ট ও কুরিয়ারের সাথে সিঙ্ক করা।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-2.5 shadow-xs">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                <Zap size={22} />
              </div>
              <h3 className="text-base font-black text-slate-900">আল্ট্রা-ফাস্ট মোবাইল স্পিড</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Next.js সার্ভার সাইড রেন্ডারিং থাকায় পেজ লোড হতে ১ সেকেন্ডেরও কম সময় লাগে, যা সেলস কনভার্সন দ্বিগুণ করে দেয়।
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-2.5 shadow-xs">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-black">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-base font-black text-slate-900">বিকাশ, নগদ ও কুরিয়ার রেডি</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                কোনো প্লাগইন কেনার ঝামেলা নেই। বিকাশ/নগদ স্বয়ংক্রিয় পেমেন্ট এবং Steadfast কুরিয়ার বুকিং প্রি-ইনস্টল করা থাকে।
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-2.5 shadow-xs">
              <div className="w-11 h-11 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center font-black">
                <Smartphone size={22} />
              </div>
              <h3 className="text-base font-black text-slate-900">অ্যান্ড্রয়েড অ্যাপ অটো-বিল্ড</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                প্রতিটি ডিজাইনের জন্য ১ ক্লিকেই প্রফেশনাল অ্যান্ড্রয়েড অ্যাপ (APK ও AAB) তৈরি করা যায় যা সরাসরি গুগল প্লে কনসোলে আপলোডযোগ্য।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Selection Modal ── */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-slate-900 shadow-2xl relative space-y-5">
            <button 
              onClick={() => setSelectedTemplate(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="space-y-1.5 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                <Sparkles size={13} />
                <span>ডিজাইন সিলেকশন</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {selectedTemplate.titleBn}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                আপনি এই ডিজাইনটি সিলেক্ট করেছেন। আপনার শপে এক ক্লিকেই এটি যুক্ত করতে পারেন।
              </p>
            </div>

            {user && userShops.length > 0 ? (
              <div className="space-y-4 text-left">
                <label className="text-xs font-black text-slate-800 block">
                  কোন স্টোরে এই ডিজাইনটি সেট করতে চান?
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {userShops.map((s) => (
                    <label 
                      key={s.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedShopId === s.id 
                          ? 'bg-purple-50 border-purple-500 text-slate-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="shopSelect" 
                          value={s.id}
                          checked={selectedShopId === s.id}
                          onChange={() => setSelectedShopId(s.id)}
                          className="text-purple-600 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-black">{s.shopName || s.shopSlug}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{s.subdomainSlug || s.shopSlug}.bdretailers.com</p>
                        </div>
                      </div>
                      {selectedShopId === s.id && <CheckCircle2 size={16} className="text-purple-600" />}
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => handleApplyTheme(selectedTemplate)}
                  disabled={applying}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles size={16} />
                  <span>{applying ? 'অ্যাপ্লাই হচ্ছে...' : 'আমার স্টোরে এই ডিজাইন যুক্ত করুন'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                  <p className="text-xs text-slate-700 font-medium">
                    ✨ মাত্র ১ মিনিটে এই <strong className="text-purple-800">{selectedTemplate.titleBn}</strong> ডিজাইন সহ আপনার ফুল ই-কমার্স স্টোর রেডি করুন!
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-1">
                    <li>✓ ফ্রি সাবডোমেন: <span className="text-emerald-700 font-mono font-bold">yourshop.bdretailers.com</span></li>
                    <li>✓ সরাসরি বিকাশ, নগদ ও কুরিয়ার ক্যাশ অন ডেলিভারি</li>
                    <li>✓ আনলিমিটেড প্রোডাক্ট আপলোড ও সেলস</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => handleApplyTheme(selectedTemplate)}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>এই ডিজাইন দিয়ে স্টোর খুলুন</span>
                    <ArrowRight size={14} />
                  </button>
                  <Link
                    href="/login"
                    className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition-all text-center border border-slate-200"
                  >
                    লগইন করুন
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
