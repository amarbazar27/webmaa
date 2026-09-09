'use client';

import { useState } from 'react';
import { 
  Layout, Eye, EyeOff, Save, RotateCcw, Sparkles, 
  ShoppingBag, Store, HelpCircle, Mail, DollarSign, 
  Image, BarChart3, Handshake, CheckCircle2, AlertCircle, Palette,
  Search, LayoutGrid
} from 'lucide-react';
import { updateGlobalConfig } from '@/lib/firestore';
import toast from 'react-hot-toast';

const SECTIONS = [
  {
    key: 'hero',
    title: 'মেইন হিরো ও ব্র্যান্ড হেডার (Hero Section)',
    description: 'প্ল্যাটফর্মের টাইটেল, ট্যাগলাইন, ১-ক্লিক রেজিস্ট্রেশন ও লগইন বাটন সমূহ।',
    icon: Layout,
    color: 'from-blue-500 to-indigo-600',
    category: 'core',
    defaultState: true
  },
  {
    key: 'templates',
    title: 'রেডিমেড ওয়েবসাইট ডিজাইন শোকেস (Readymade Templates & Demos)',
    description: 'বিভিন্ন ক্যাটাগরির রেডিমেড ওয়েবসাইট ডিজাইন গ্যালারি ও *.bdretailers.com লাইভ ডেমো সেকশন।',
    icon: Palette,
    color: 'from-fuchsia-500 to-pink-600',
    category: 'core',
    defaultState: true
  },
  {
    key: 'stats',
    title: 'মার্কেটপ্লেস পরিসংখ্যান ও মেট্রিক্স (Live Platform Stats)',
    description: 'মোট মার্চেন্ট, লাইভ প্রোডাক্ট, সফল ডেলিভারি ও গ্রোথ রেট কাউন্টার।',
    icon: BarChart3,
    color: 'from-emerald-500 to-teal-600',
    category: 'core',
    defaultState: true
  },
  {
    key: 'banners',
    title: 'বিজ্ঞাপন ও প্রমোশনাল ব্যানার্স (Promo Banners Carousel)',
    description: 'সুপারএডমিন কর্তৃক আপলোডকৃত বিশেষ ডিসকাউন্ট ও অফার স্লাইডার।',
    icon: Image,
    color: 'from-pink-500 to-rose-600',
    category: 'core',
    defaultState: true
  },
  {
    key: 'aiAssistant',
    title: 'এআই শপিং অ্যাসিস্ট্যান্ট ও ভয়েস ফর্দ (AI Shopping Assistant)',
    description: 'গ্রাহকদের ভয়েস বা বাজার ফর্দ এনালাইসিস করে সরাসরি অর্ডার ও স্মার্ট প্রোডাক্ট সাজেশন।',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-600',
    category: 'commerce',
    defaultState: true
  },
  {
    key: 'searchHero',
    title: 'স্ট্যান্ডঅ্যালোন কেন্দ্রীয় সার্চ বার (Central Search Bar)',
    description: 'হোমপেজে পণ্য ও ক্যাটাগরি সহজে দ্রুত খোঁজার আলাদা মূল সার্চ ইনপুট সেকশন।',
    icon: Search,
    color: 'from-blue-600 to-cyan-600',
    category: 'commerce',
    defaultState: true
  },
  {
    key: 'amazonBoxes',
    title: 'আমাজন-স্টাইল মাল্টি-স্টোর কার্ডস (Amazon Box Grid)',
    description: 'বিভিন্ন স্টোর বা ক্যাটাগরির সেরা পণ্যগুলোর কার্ড ভিত্তিক আকর্ষণীয় গ্রুপ ডিসপ্লে।',
    icon: LayoutGrid,
    color: 'from-amber-500 to-orange-600',
    category: 'commerce',
    defaultState: true
  },
  {
    key: 'marketplace',
    title: 'মার্কেটপ্লেস প্রোডাক্ট ফিড (Marketplace Products Grid)',
    description: 'সরাসরি পণ্য ব্রাউজিং, ফিল্টার, ক্যাটাগরি ও ইনস্ট্যান্ট চেকআউট গ্রিড।',
    icon: ShoppingBag,
    color: 'from-purple-500 to-violet-600',
    category: 'commerce',
    defaultState: true
  },
  {
    key: 'featuredModels',
    title: 'এলিট মার্চেন্ট ও স্টোর ডিরেক্টরি (Elite Merchants Showcase)',
    description: 'ভেরিফাইড টপ সেলার মার্চেন্টদের ডেডিকেটেড স্টোর কার্ড ও সরাসরি ভিজিট লিংক।',
    icon: Store,
    color: 'from-amber-600 to-yellow-600',
    category: 'commerce',
    defaultState: true
  },
  {
    key: 'showcase',
    title: 'প্রমোটেড লিংক ও পার্টনার শোকেস (Promoted Links / Showcase)',
    description: 'সুপারএডমিন প্যানেল থেকে কনফিগার করা স্পেশাল লিংক ও পার্টনার কার্ড।',
    icon: Sparkles,
    color: 'from-cyan-500 to-blue-600',
    category: 'marketing',
    defaultState: true
  },
  {
    key: 'sponsors',
    title: 'স্পনসর ও কর্পোরেট পার্টনার্স (Sponsors & Partners)',
    description: 'লজিস্টিক ও পেমেন্ট পার্টনার লোগো শোকেস এবং নতুন স্পনসর আবেদন ফর্ম।',
    icon: Handshake,
    color: 'from-yellow-500 to-amber-600',
    category: 'marketing',
    defaultState: true
  },
  {
    key: 'pricing',
    title: 'সাবস্ক্রিপশন ও প্রাইসিং প্যাকেজ (Pricing & Membership Plans)',
    description: 'স্টার্টার, মান্থলি, কোয়ার্টারলি ও ইয়ারলি প্যাকেজের তুলনামূলক টেবিল।',
    icon: DollarSign,
    color: 'from-indigo-500 to-purple-600',
    category: 'marketing',
    defaultState: true
  },
  {
    key: 'faq',
    title: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ Accordion)',
    description: 'কাস্টমার ও নতুন মার্চেন্টদের জন্য কমন প্রশ্ন-উত্তর একর্ডিয়ন।',
    icon: HelpCircle,
    color: 'from-teal-500 to-emerald-600',
    category: 'marketing',
    defaultState: true
  },
  {
    key: 'newsletter',
    title: 'ভিআইপি নিউজলেটার সাবস্ক্রিপশন (Newsletter Box)',
    description: 'দর্শকদের ইমেইল সংগ্রহের আধুনিক নিউমর্ফিক সাবস্ক্রিপশন কার্ড।',
    icon: Mail,
    color: 'from-violet-500 to-purple-700',
    category: 'marketing',
    defaultState: true
  }
];

export default function SuperadminHomepageControls({ globalConfig = {} }) {
  const initialSections = globalConfig?.homepageSections || {};
  const [sections, setSections] = useState({
    hero: initialSections.hero !== false,
    templates: initialSections.templates !== false,
    stats: initialSections.stats !== false,
    banners: initialSections.banners !== false,
    aiAssistant: initialSections.aiAssistant !== false,
    searchHero: initialSections.searchHero !== false,
    amazonBoxes: initialSections.amazonBoxes !== false && globalConfig?.showAmazonBoxes !== false,
    marketplace: initialSections.marketplace !== false,
    featuredModels: initialSections.featuredModels !== false,
    showcase: initialSections.showcase !== false,
    sponsors: initialSections.sponsors !== false,
    pricing: initialSections.pricing !== false,
    faq: initialSections.faq !== false,
    newsletter: initialSections.newsletter !== false,
  });
  const [activeCategory, setActiveCategory] = useState('all');
  const [saving, setSaving] = useState(false);

  const toggleSection = (key, e) => {
    e?.stopPropagation?.();
    setSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading('হোমপেজ সেটিংস সেভ হচ্ছে...');
    try {
      await updateGlobalConfig({
        homepageSections: sections,
        showAmazonBoxes: sections.amazonBoxes !== false,
        showAllProductsDirectly: sections.marketplace !== false
      });
      toast.success('হোমপেজের সেকশন সেটিংস সফলভাবে আপডেট হয়েছে! 🎉', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const allEnabled = {};
    SECTIONS.forEach(s => {
      allEnabled[s.key] = true;
    });
    setSections(allEnabled);
    toast.success('সমস্ত সেকশন অন করা হয়েছে! সেভ বাটনে ক্লিক করে কার্যকর করুন।');
  };

  const activeCount = Object.values(sections).filter(Boolean).length;
  const filteredSections = activeCategory === 'all' 
    ? SECTIONS 
    : SECTIONS.filter(s => s.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs uppercase tracking-wider mb-2 border border-purple-400/20">
              <Sparkles size={13} />
              <span>হোমপেজ লেআউট ও ভিজিবিলিটি কন্ট্রোল</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">হোমপেজ সেকশন কনফিগারেশন ও ভিজিবিলিটি</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              হোমপেজের প্রতিটি সেকশনের নাম, ভূমিকা ও ভিজিবিলিটি নিয়ন্ত্রণ করুন। {SECTIONS.length}টি সেকশনের মধ্যে বর্তমানে <strong className="text-purple-300">{activeCount}টি সেকশন দৃশ্যমান</strong> আছে।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all flex items-center gap-2 border border-white/10 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>সব অন করুন</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-500/30 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <Save size={14} />
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills (Homepage Builder Style) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: `সব সেকশন (${SECTIONS.length})` },
          { id: 'core', label: 'কোর লেআউট (Core)' },
          { id: 'commerce', label: 'কমার্স ও প্রোডাক্টস' },
          { id: 'marketing', label: 'মার্কেটিং ও পার্টনার্স' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 scale-102'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* List of Section Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSections.map((sec) => {
          const Icon = sec.icon;
          const isEnabled = sections[sec.key] !== false;

          return (
            <div
              key={sec.key}
              onClick={(e) => toggleSection(sec.key, e)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer select-none flex items-start justify-between gap-4 ${
                isEnabled
                  ? 'bg-white border-purple-200 shadow-md shadow-purple-500/5 hover:border-purple-400'
                  : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-85'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${sec.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                  <Icon size={22} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`text-sm font-black tracking-tight ${isEnabled ? 'text-slate-900' : 'text-slate-500'}`}>
                      {sec.title}
                    </h4>

                    {/* Section Visibility Button Right Beside The Name */}
                    <button
                      type="button"
                      onClick={(e) => toggleSection(sec.key, e)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        isEnabled
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300 border border-slate-300'
                      }`}
                    >
                      {isEnabled ? (
                        <>
                          <Eye size={12} className="text-emerald-600" />
                          <span>দৃশ্যমান (Visible)</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} className="text-slate-500" />
                          <span>লুকানো (Hidden)</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {sec.description}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="shrink-0 pt-1">
                <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                  isEnabled ? 'bg-purple-600' : 'bg-slate-300'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                    isEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Save Action Bar */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-purple-900 text-xs font-semibold">
          <CheckCircle2 size={16} className="text-purple-600 shrink-0" />
          <span>পরিবর্তন সম্পন্ন হলে &apos;পরিবর্তন সেভ করুন&apos; বাটনে ক্লিক করে bdretailers.com এ তাৎক্ষণিক লাইভ করুন।</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 disabled:opacity-50"
        >
          <Save size={14} />
          <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}</span>
        </button>
      </div>
    </div>
  );
}
