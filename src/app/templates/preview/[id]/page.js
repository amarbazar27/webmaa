'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Monitor, Tablet, Smartphone, ExternalLink, ArrowLeft, 
  Sparkles, CheckCircle2, ShoppingBag, Eye, Star, 
  ShieldCheck, Truck, Zap, Plus, X, Heart, Phone, Store, ArrowRight
} from 'lucide-react';
import { 
  DEFAULT_WEBSITE_TEMPLATES, 
  findTemplateByIdOrSlug, 
  getDemoUrl 
} from '@/lib/templatesData';
import { subscribeGlobalConfig, updateShop, getShopBySlug, getAllShops } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function TemplatePreviewPage({ params }) {
  const unwrappedParams = use(params);
  const templateId = unwrappedParams?.id || 'fresh_grocery';
  const router = useRouter();
  const { user, userData } = useAuth();

  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [globalConfig, setGlobalConfig] = useState(null);
  const [template, setTemplate] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [userShops, setUserShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [applying, setApplying] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Subscribe to global config to get any superadmin overrides
  useEffect(() => {
    const unsub = subscribeGlobalConfig((config) => {
      setGlobalConfig(config);
      const found = findTemplateByIdOrSlug(templateId, config?.websiteTemplates);
      setTemplate(found);
    });
    return () => unsub();
  }, [templateId]);

  // Load current user's shops if logged in
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

  const activeTemplate = template || DEFAULT_WEBSITE_TEMPLATES[0];
  const demoUrl = getDemoUrl(activeTemplate);

  const handleApplyTheme = async () => {
    if (!user) {
      // Save intent and redirect to register
      if (typeof window !== 'undefined') {
        localStorage.setItem('selected_theme_intent', JSON.stringify({
          id: activeTemplate.id,
          themePresetId: activeTemplate.themePresetId,
          primaryColor: activeTemplate.primaryColor
        }));
      }
      router.push(`/become-retailer?selectedTheme=${activeTemplate.id}`);
      return;
    }

    if (userShops.length === 0) {
      router.push(`/become-retailer?selectedTheme=${activeTemplate.id}`);
      return;
    }

    if (!selectedShopId) {
      toast.error('দয়া করে আপনার একটি শপ সিলেক্ট করুন');
      return;
    }

    setApplying(true);
    const toastId = toast.loading('ডিজাইনটি শপে অ্যাপ্লাই করা হচ্ছে...');
    try {
      const themePayload = {
        presetId: activeTemplate.themePresetId,
        primaryColor: activeTemplate.primaryColor,
        secondaryColor: activeTemplate.secondaryColor,
        accentColor: activeTemplate.accentColor,
        bgColor: activeTemplate.bgColor,
        textColor: activeTemplate.textColor,
        font: activeTemplate.font,
        buttonRadius: activeTemplate.buttonRadius,
        cardRadius: activeTemplate.cardRadius
      };

      await updateShop(selectedShopId, {
        theme: themePayload,
        headerConfig: {
          style: activeTemplate.headerStyle || 'classic',
          showSearch: true,
          showCart: true,
          showHotline: true
        },
        footerConfig: {
          style: activeTemplate.footerStyle || 'classic_4col',
          showNewsletter: true
        }
      });

      toast.success(`🎉 ${activeTemplate.titleBn} ডিজাইনটি সফলভাবে আপনার স্টোরে যুক্ত হয়েছে!`, { id: toastId });
      setShowApplyModal(false);
      
      const targetShop = userShops.find(s => s.id === selectedShopId);
      if (targetShop) {
        const slug = targetShop.subdomainSlug || targetShop.shopSlug;
        setTimeout(() => {
          window.open(`https://${slug}.bdretailers.com`, '_blank');
        }, 800);
      }
    } catch (err) {
      toast.error('ডিজাইন সংরক্ষণ ব্যর্থ হয়েছে: ' + err.message, { id: toastId });
    } finally {
      setApplying(false);
    }
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setShowCartDrawer(true);
    toast.success(`${product.name} কার্টে যোগ হয়েছে`);
  };

  const totalCartAmount = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* ── Top Floating Navigation & Device Switcher Bar ── */}
      <header className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Back & Template Info */}
          <div className="flex items-center gap-3 shrink-0">
            <Link 
              href="/templates" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all border border-white/5"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">সব ডিজাইন</span>
            </Link>

            <div className="h-5 w-px bg-white/10 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-black text-white truncate max-w-[160px] sm:max-w-xs">
                  {activeTemplate.titleBn}
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {activeTemplate.categoryBn}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden md:block">
                Demo URL: <span className="text-emerald-400">{activeTemplate.demoSubdomain}.bdretailers.com</span>
              </p>
            </div>
          </div>

          {/* Center: Device Switcher */}
          <div className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10 shadow-inner">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                deviceMode === 'desktop'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ডেস্কটপ ভিউ (100% Full Width)"
            >
              <Monitor size={15} />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                deviceMode === 'tablet'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ট্যাবলেট ভিউ (768px Width)"
            >
              <Tablet size={15} />
              <span>Tablet</span>
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                deviceMode === 'mobile'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="মোবাইল ফোন ভিউ (390px Width)"
            >
              <Smartphone size={15} />
              <span>Mobile</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={demoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black text-slate-200 hover:text-white transition-all border border-white/10"
              title="নতুন ট্যাবে লাইভ সাবডোমেইন ওপেন করুন"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">নতুন ট্যাবে দেখুন</span>
            </a>

            <button
              onClick={() => setShowApplyModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>এই ডিজাইনটি সিলেক্ট করুন</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Preview Canvas Area ── */}
      <main className="flex-1 overflow-auto flex items-start justify-center p-2 sm:p-6 bg-[radial-gradient(#1e1e2f_1px,transparent_1px)] [background-size:16px_16px]">
        <div 
          className={`transition-all duration-300 mx-auto w-full ${
            deviceMode === 'desktop' 
              ? 'max-w-7xl' 
              : deviceMode === 'tablet' 
              ? 'max-w-[768px] rounded-[32px] border-[10px] border-slate-800 shadow-2xl my-4 overflow-hidden bg-white text-slate-900' 
              : 'max-w-[390px] rounded-[44px] border-[12px] border-slate-800 shadow-2xl my-4 overflow-hidden bg-white text-slate-900 ring-1 ring-white/10'
          }`}
          style={{ minHeight: deviceMode === 'desktop' ? '85vh' : '780px' }}
        >
          {/* Smartphone Notch / Top Indicator */}
          {deviceMode === 'mobile' && (
            <div className="bg-slate-900 h-6 w-full flex items-center justify-center">
              <div className="w-20 h-3 bg-black rounded-full" />
            </div>
          )}

          {/* ── Simulated Interactive Storefront Experience ── */}
          <div 
            className="w-full h-full flex flex-col font-sans transition-colors duration-200"
            style={{ 
              backgroundColor: activeTemplate.bgColor || '#FFFFFF',
              color: activeTemplate.textColor || '#0F172A',
              fontFamily: activeTemplate.font || 'Inter, sans-serif'
            }}
          >
            {/* Store Top Bar */}
            <div 
              className="px-4 py-2 text-white text-[11px] font-bold flex items-center justify-between"
              style={{ backgroundColor: activeTemplate.secondaryColor || '#064E3B' }}
            >
              <div className="flex items-center gap-2">
                <Truck size={13} />
                <span>Steadfast কুরিয়ারে সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি</span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-[10px]">
                <span>বিকাশ/নগদ পেমেন্ট সাপোর্টেড</span>
                <span>হটলাইন: ০১৭১১-০০০০০০</span>
              </div>
            </div>

            {/* Store Header */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur shadow-sm border-b border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md"
                  style={{ backgroundColor: activeTemplate.primaryColor }}
                >
                  {activeTemplate.titleBn?.charAt(0) || 'B'}
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight" style={{ color: activeTemplate.secondaryColor }}>
                    {activeTemplate.titleBn}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400">
                    {activeTemplate.demoSubdomain}.bdretailers.com
                  </p>
                </div>
              </div>

              <div className="hidden md:flex flex-1 max-w-md mx-6">
                <div className="w-full relative">
                  <input 
                    type="text" 
                    placeholder="হাজারো পণ্যের মধ্য থেকে সার্চ করুন..."
                    className="w-full pl-4 pr-10 py-2 rounded-full border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600 bg-slate-50"
                  />
                  <div 
                    className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full text-white flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: activeTemplate.primaryColor }}
                  >
                    <ShoppingBag size={13} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowCartDrawer(true)}
                  className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  <ShoppingBag size={18} />
                  {cartItems.length > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow"
                      style={{ backgroundColor: activeTemplate.primaryColor }}
                    >
                      {cartItems.reduce((a, b) => a + b.qty, 0)}
                    </span>
                  )}
                </button>
              </div>
            </header>

            {/* Hero Banner Showcase */}
            <div className="relative overflow-hidden p-4 sm:p-8">
              <div 
                className="rounded-3xl p-6 sm:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl"
                style={{ 
                  background: `linear-gradient(135deg, ${activeTemplate.primaryColor} 0%, ${activeTemplate.secondaryColor} 100%)`,
                  borderRadius: activeTemplate.cardRadius || '24px'
                }}
              >
                <div className="space-y-4 max-w-xl z-10 text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black">
                    <Sparkles size={13} />
                    <span>{activeTemplate.badge || 'এক্সক্লুসিভ রেডিমেড ডিজাইন'}</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
                    {activeTemplate.titleBn}
                  </h1>
                  <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
                    {activeTemplate.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button 
                      onClick={() => setShowApplyModal(true)}
                      className="px-6 py-3 rounded-full bg-white text-slate-950 font-black text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                      style={{ borderRadius: activeTemplate.buttonRadius }}
                    >
                      <span>এই ডিজাইন দিয়ে স্টোর খুলুন</span>
                      <ArrowRight size={14} />
                    </button>
                    <a
                      href={demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs backdrop-blur-sm transition-all"
                    >
                      ফুলস্ক্রিন লাইভ স্টোর
                    </a>
                  </div>
                </div>

                <div className="w-full md:w-80 h-48 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0 z-10">
                  <img 
                    src={activeTemplate.thumbnail} 
                    alt={activeTemplate.title} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Decorative background glow */}
                <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
              </div>
            </div>

            {/* Feature Highlights Strip */}
            <div className="px-4 sm:px-8 py-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {activeTemplate.features?.slice(0, 4).map((feat, i) => (
                  <div 
                    key={i} 
                    className="p-3.5 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center gap-2.5 text-xs font-bold text-slate-700"
                    style={{ borderRadius: activeTemplate.cardRadius }}
                  >
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Products Grid Showcase */}
            <div className="px-4 sm:px-8 py-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    জনপ্রিয় পণ্যসমূহ (Featured Products)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    গ্রাহকরা সরাসরি এই ডেমো পণ্যগুলো থেকে ১ ক্লিকে অর্ডার করতে পারেন
                  </p>
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  ৪টি আইটেম প্রদর্শিত
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {(activeTemplate.sampleProducts || []).map((prod) => (
                  <div 
                    key={prod.id} 
                    className="group bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    style={{ borderRadius: activeTemplate.cardRadius }}
                  >
                    <div className="space-y-2.5">
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {prod.oldPrice && (
                          <span 
                            className="absolute top-2 left-2 text-[10px] font-black text-white px-2 py-0.5 rounded-full shadow"
                            style={{ backgroundColor: activeTemplate.primaryColor }}
                          >
                            ছাড়
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 min-h-[36px]">
                        {prod.name}
                      </h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm sm:text-base font-black text-slate-900">
                          ৳ {prod.price.toLocaleString()}
                        </span>
                        {prod.oldPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            ৳ {prod.oldPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => addToCart(prod)}
                      className="mt-3 w-full py-2.5 rounded-xl text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: activeTemplate.primaryColor,
                        borderRadius: activeTemplate.buttonRadius 
                      }}
                    >
                      <ShoppingBag size={14} />
                      <span>অর্ডার করুন</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Storefront Footer Preview */}
            <footer className="mt-auto bg-slate-900 text-white p-6 sm:p-10 space-y-6">
              <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-400">
                <div className="space-y-2">
                  <h4 className="text-white font-black text-sm">{activeTemplate.titleBn}</h4>
                  <p className="leading-relaxed">
                    bdretailers.com প্ল্যাটফর্মের উচ্চমানের ক্লাউড অবকাঠামো এবং আল্ট্রা-ফাস্ট হোস্টিং দ্বারা পরিচালিত।
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-black text-sm">নিরাপদ পেমেন্ট ও কুরিয়ার</h4>
                  <p className="leading-relaxed">
                    বিকাশ, নগদ ও রকেট পেমেন্ট গেটওয়ে। সারা বাংলাদেশে Steadfast কুরিয়ারের মাধ্যমে ক্যাশ অন ডেলিভারি সুবিধা।
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-black text-sm">এই ডিজাইনটি পেতে চান?</h4>
                  <p className="leading-relaxed">
                    মাত্র ১ মিনিটে আপনার অনলাইন স্টোর খুলুন অথবা এই থিমটি আপনার শপে অ্যাক্টিভ করুন।
                  </p>
                  <button 
                    onClick={() => setShowApplyModal(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>ডিজাইনটি ইনস্টল করুন</span>
                  </button>
                </div>
              </div>
              <div className="border-t border-slate-800 pt-4 text-center text-[10px] text-slate-500">
                © {new Date().getFullYear()} {activeTemplate.titleBn} • Powered by <span className="text-purple-400 font-bold">bdretailers.com</span>
              </div>
            </footer>
          </div>
        </div>
      </main>

      {/* ── Slide-Over Mini Cart Drawer ── */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white text-slate-900 h-full p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="text-purple-600" size={20} />
                  <h3 className="font-black text-base">আপনার শপিং ব্যাগ ({cartItems.length})</h3>
                </div>
                <button 
                  onClick={() => setShowCartDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 font-bold text-xs">কার্ট বর্তমানে খালি আছে</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-xs text-purple-600 font-mono font-bold">৳ {item.price} x {item.qty}</p>
                      </div>
                      <span className="text-xs font-black font-mono">৳ {(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-sm font-black">
                <span>সর্বমোট:</span>
                <span className="text-purple-600 font-mono">৳ {totalCartAmount.toLocaleString()}</span>
              </div>
              <button
                onClick={() => {
                  toast.success('এটি একটি লাইভ ডেমো স্টোর। আপনার নিজস্ব ওয়েবসাইট তৈরি করতে "এই ডিজাইনটি সিলেক্ট করুন" বাটনে ক্লিক করুন!');
                  setShowCartDrawer(false);
                }}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-lg transition-all"
              >
                চেকআউট সম্পূর্ণ করুন (ডেমো)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Theme Selection & Apply Modal ── */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111625] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl relative space-y-6">
            <button 
              onClick={() => setShowApplyModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>

            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black">
                <Sparkles size={13} />
                <span>থিম ইনস্টলার (1-Click Theme Installer)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {activeTemplate.titleBn}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                এই রেডিমেড ডিজাইনটি বেছে নিয়ে এখনই আপনার ওয়েবসাইটের লুক পরিবর্তন করুন।
              </p>
            </div>

            {/* Logged in with shops */}
            {user && userShops.length > 0 ? (
              <div className="space-y-4 text-left">
                <label className="text-xs font-black text-slate-300 block">
                  কোন স্টোরে এই ডিজাইনটি অ্যাপ্লাই করতে চান?
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userShops.map((s) => (
                    <label 
                      key={s.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedShopId === s.id 
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="shopSelection" 
                          value={s.id}
                          checked={selectedShopId === s.id}
                          onChange={() => setSelectedShopId(s.id)}
                          className="text-purple-600 focus:ring-0"
                        />
                        <div>
                          <p className="text-xs font-black">{s.shopName || s.shopSlug}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{s.subdomainSlug || s.shopSlug}.bdretailers.com</p>
                        </div>
                      </div>
                      {selectedShopId === s.id && <CheckCircle2 size={16} className="text-purple-400" />}
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleApplyTheme}
                  disabled={applying}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles size={16} />
                  <span>{applying ? 'অ্যাপ্লাই হচ্ছে...' : 'আমার স্টোরে এই ডিজাইন সেট করুন'}</span>
                </button>
              </div>
            ) : (
              /* New user or not logged in */
              <div className="space-y-4 text-left">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-xs text-slate-300 font-medium">
                    ✨ আপনি কি bdretailers.com এ নতুন? মাত্র ১ মিনিটে এই <strong className="text-white">{activeTemplate.titleBn}</strong> ডিজাইন সহ আপনার ফুল ই-কমার্স স্টোর রেডি হয়ে যাবে!
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>✓ ফ্রি সাবডোমেন: <span className="text-emerald-400 font-mono">your-name.bdretailers.com</span></li>
                    <li>✓ বিকাশ, নগদ ও Steadfast কুরিয়ার সম্পূর্ণ কনফিগার করা</li>
                    <li>✓ কোনো কোডিং ছাড়াই প্রফেশনাল অনলাইন শপ</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleApplyTheme}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>এই ডিজাইন দিয়ে স্টোর খুলুন</span>
                    <ArrowRight size={14} />
                  </button>
                  <Link
                    href="/login"
                    className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black text-xs transition-all text-center"
                  >
                    আগের অ্যাকাউন্ট থাকলে লগইন করুন
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
