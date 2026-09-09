'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Monitor, Tablet, Smartphone, ExternalLink, ArrowLeft, 
  Sparkles, CheckCircle2, ShoppingBag, Eye, Star, 
  ShieldCheck, Truck, Zap, Plus, X, Heart, Phone, Store, ArrowRight, RotateCw
} from 'lucide-react';
import { 
  DEFAULT_WEBSITE_TEMPLATES, 
  findTemplateByIdOrSlug, 
  getDemoUrl 
} from '@/lib/templatesData';
import { subscribeGlobalConfig, updateShop, getAllShops } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function TemplatePreviewPage({ params }) {
  const unwrappedParams = use(params);
  const templateId = unwrappedParams?.id || 'health_pharmacy';
  const router = useRouter();
  const { user } = useAuth();

  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [globalConfig, setGlobalConfig] = useState(null);
  const [template, setTemplate] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [userShops, setUserShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [applying, setApplying] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

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
      
      // Redirect straight to Homepage Builder in visual editor mode so they can customize immediately!
      setTimeout(() => {
        router.push(`/dashboard/homepage-builder?visual=true&template=${activeTemplate.id}`);
      }, 700);
    } catch (err) {
      toast.error('ডিজাইন সংরক্ষণ ব্যর্থ হয়েছে: ' + err.message, { id: toastId });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* ── Top Floating Navigation & Device Switcher Bar ── */}
      <header className="sticky top-0 z-50 bg-[#0B0F19]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-2xl">
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
                Subdomain: <span className="text-emerald-400">{activeTemplate.demoSubdomain}.bdretailers.com</span>
              </p>
            </div>
          </div>

          {/* Center: Device Switcher */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-2xl border border-white/10 shadow-inner">
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
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                deviceMode === 'tablet'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ট্যাবলেট ভিউ (768px True Viewport)"
            >
              <Tablet size={15} />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                deviceMode === 'mobile'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="মোবাইল ফোন ভিউ (390px True Viewport & Dynamic Island)"
            >
              <Smartphone size={15} />
              <span className="hidden sm:inline">Mobile</span>
            </button>
            <button
              onClick={() => setIframeKey(k => k + 1)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors"
              title="রিলোড প্রিভিউ"
            >
              <RotateCw size={13} />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={demoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black text-slate-200 hover:text-white transition-all border border-white/10"
              title="নতুন ট্যাবে সাবডোমেইন খুলুন"
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

      {/* ── Main Preview Canvas Area with Real Responsive Iframes ── */}
      <main className="flex-1 overflow-auto flex items-start justify-center p-2 sm:p-6 bg-[radial-gradient(#1e1e2f_1px,transparent_1px)] [background-size:16px_16px]">
        
        {deviceMode === 'desktop' ? (
          // Desktop: 100% full-width iframe
          <div className="w-full max-w-7xl h-[88vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white">
            <iframe
              key={`desktop-${iframeKey}-${activeTemplate.id}`}
              src={`/templates/embed/${activeTemplate.id}`}
              className="w-full h-full border-0"
              title={`${activeTemplate.titleBn} Desktop Preview`}
            />
          </div>
        ) : deviceMode === 'tablet' ? (
          // Tablet: 768px realistic iPad mockup frame
          <div className="w-[768px] h-[920px] max-h-[90vh] my-4 rounded-[36px] p-3 bg-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-4 border-slate-700 flex flex-col relative">
            {/* Top Camera dot */}
            <div className="h-4 w-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
            </div>
            {/* Iframe Viewport */}
            <div className="flex-1 w-full rounded-[24px] overflow-hidden bg-white">
              <iframe
                key={`tablet-${iframeKey}-${activeTemplate.id}`}
                src={`/templates/embed/${activeTemplate.id}`}
                className="w-full h-full border-0"
                title={`${activeTemplate.titleBn} Tablet Preview`}
              />
            </div>
          </div>
        ) : (
          // Mobile: 390px x 844px realistic iPhone 15 / Android smartphone frame
          <div className="w-[390px] h-[844px] max-h-[92vh] my-4 rounded-[48px] p-3 bg-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-4 border-slate-800 ring-1 ring-white/10 flex flex-col relative shrink-0">
            {/* Dynamic Island Notch */}
            <div className="h-6 w-full flex items-center justify-center relative">
              <div className="w-24 h-4 bg-black rounded-full flex items-center justify-end px-2">
                <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700" />
              </div>
            </div>

            {/* True Mobile Iframe Viewport (window.innerWidth = 366px inside frame) */}
            <div className="flex-1 w-full rounded-[36px] overflow-hidden bg-white shadow-inner">
              <iframe
                key={`mobile-${iframeKey}-${activeTemplate.id}`}
                src={`/templates/embed/${activeTemplate.id}`}
                className="w-full h-full border-0"
                title={`${activeTemplate.titleBn} Mobile Preview`}
              />
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="h-4 w-full flex items-center justify-center">
              <div className="w-28 h-1 bg-slate-600 rounded-full" />
            </div>
          </div>
        )}

      </main>

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
                <span>থিম ও ভিজ্যুয়াল বিল্ডার ইনস্টলার</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {activeTemplate.titleBn}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                এই ডিজাইনটি সিলেক্ট করলে আপনার স্টোরে সরাসরি লাইভ এডিটর মোড ওপেন হবে, যেখান থেকে ব্যানার, লোগো ও টেক্সট পরিবর্তন করতে পারবেন।
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
                  <span>{applying ? 'অ্যাপ্লাই হচ্ছে...' : 'এই ডিজাইন সেট করে লাইভ এডিটরে যান'}</span>
                </button>
              </div>
            ) : (
              /* New user or not logged in */
              <div className="space-y-4 text-left">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-xs text-slate-300 font-medium">
                    ✨ আপনি কি bdretailers.com এ নতুন? মাত্র ১ মিনিটে এই <strong className="text-white">{activeTemplate.titleBn}</strong> ডিজাইন সহ আপনার স্টোর চালু করুন!
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>✓ ফ্রি সাবডোমেন: <span className="text-emerald-400 font-mono">yourshop.bdretailers.com</span></li>
                    <li>✓ ডিরেক্ট ভিজ্যুয়াল এডিটর দিয়ে নিজের মোবাইল/পিসি থেকে ব্যানার ও লোগো আপলোড</li>
                    <li>✓ বিকাশ, নগদ ও Steadfast কুরিয়ার সম্পূর্ণ কনফিগার করা</li>
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
