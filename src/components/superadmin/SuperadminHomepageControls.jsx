'use client';

import { useState } from 'react';
import { 
  Layout, Eye, EyeOff, Save, RotateCcw, Sparkles, 
  ShoppingBag, Store, HelpCircle, Mail, DollarSign, 
  Image, BarChart3, Handshake, CheckCircle2, AlertCircle 
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
    defaultState: true
  },
  {
    key: 'stats',
    title: 'মার্কেটপ্লেস পরিসংখ্যান ও মেট্রিক্স (Live Platform Stats)',
    description: 'মোট মার্চেন্ট, লাইভ প্রোডাক্ট, সফল ডেলিভারি ও গ্রোথ রেট কাউন্টার।',
    icon: BarChart3,
    color: 'from-emerald-500 to-teal-600',
    defaultState: true
  },
  {
    key: 'banners',
    title: 'বিজ্ঞাপন ও প্রমোশনাল ব্যানার্স (Promo Banners)',
    description: 'সুপারএডমিন কর্তৃক আপলোডকৃত বিশেষ ডিসকাউন্ট ও অফার স্লাইডার।',
    icon: Image,
    color: 'from-pink-500 to-rose-600',
    defaultState: true
  },
  {
    key: 'marketplace',
    title: 'মার্কেটপ্লেস প্রোডাক্ট ডিসকভারি (Marketplace Products)',
    description: 'সরাসরি পণ্য ব্রাউজিং, সার্চ, ক্যাটাগরি ট্যাব ও ইনস্ট্যান্ট কার্ট চেকআউট।',
    icon: ShoppingBag,
    color: 'from-purple-500 to-violet-600',
    defaultState: true
  },
  {
    key: 'featuredModels',
    title: 'এলিট মার্চেন্ট ও স্টোর ডিরেক্টরি (Elite Merchants Showcase)',
    description: 'ভেরিফাইড টপ সেলার মার্চেন্টদের ডেডিকেটেড স্টোর কার্ড ও ভিজিট লিংক।',
    icon: Store,
    color: 'from-amber-500 to-orange-600',
    defaultState: true
  },
  {
    key: 'showcase',
    title: 'প্রমোটেড লিংক ও পার্টনার শোকেস (Promoted Links / Showcase)',
    description: 'সুপারএডমিন প্যানেল থেকে কনফিগার করা স্পেশাল লিংক ও পার্টনার কার্ড।',
    icon: Sparkles,
    color: 'from-cyan-500 to-blue-600',
    defaultState: true
  },
  {
    key: 'sponsors',
    title: 'স্পনসর ও কর্পোরেট পার্টনার্স (Sponsors & Partners)',
    description: 'লজিস্টিক ও পেমেন্ট পার্টনার লোগো শোকেস এবং নতুন স্পনসর আবেদন ফর্ম।',
    icon: Handshake,
    color: 'from-yellow-500 to-amber-600',
    defaultState: true
  },
  {
    key: 'pricing',
    title: 'সাবস্ক্রিপশন ও প্রাইসিং প্যাকেজ (Pricing & Membership Plans)',
    description: 'স্টার্টার, মান্থলি, কোয়ার্টারলি ও ইয়ারলি প্যাকেজের তুলনামূলক টেবিল।',
    icon: DollarSign,
    color: 'from-indigo-500 to-purple-600',
    defaultState: true
  },
  {
    key: 'faq',
    title: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ Accordion)',
    description: 'কাস্টমার ও নতুন মার্চেন্টদের জন্য কমন প্রশ্ন-উত্তর একর্ডিয়ন।',
    icon: HelpCircle,
    color: 'from-teal-500 to-emerald-600',
    defaultState: true
  },
  {
    key: 'newsletter',
    title: 'ভিআইপি নিউজলেটার সাবস্ক্রিপশন (Newsletter Box)',
    description: 'দর্শকদের ইমেইল সংগ্রহের আধুনিক নিউমর্ফিক সাবস্ক্রিপশন কার্ড।',
    icon: Mail,
    color: 'from-violet-500 to-purple-700',
    defaultState: true
  }
];

export default function SuperadminHomepageControls({ globalConfig = {} }) {
  const initialSections = globalConfig?.homepageSections || {};
  const [sections, setSections] = useState({
    hero: initialSections.hero !== false,
    stats: initialSections.stats !== false,
    banners: initialSections.banners !== false,
    marketplace: initialSections.marketplace !== false,
    featuredModels: initialSections.featuredModels !== false,
    showcase: initialSections.showcase !== false,
    sponsors: initialSections.sponsors !== false,
    pricing: initialSections.pricing !== false,
    faq: initialSections.faq !== false,
    newsletter: initialSections.newsletter !== false,
  });
  const [saving, setSaving] = useState(false);

  const toggleSection = (key) => {
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
        homepageSections: sections
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
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">হোমপেজ সেকশন অন / অফ ম্যানেজার</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              bdretailers.com হোমপেজের যেকোনো সেকশন বা বক্স এক ক্লিকেই চালু অথবা বন্ধ করুন। ১০টি সেকশনের মধ্যে বর্তমানে <strong className="text-purple-300">{activeCount}টি সেকশন সক্রিয়</strong> আছে।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all flex items-center gap-2 border border-white/10"
            >
              <RotateCcw size={14} />
              <span>সব অন করুন</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-500/30 disabled:opacity-50 active:scale-95"
            >
              <Save size={14} />
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Toggle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isEnabled = sections[sec.key] !== false;

          return (
            <div
              key={sec.key}
              onClick={() => toggleSection(sec.key)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer select-none flex items-start justify-between gap-4 ${
                isEnabled
                  ? 'bg-white border-purple-200/80 shadow-md shadow-purple-500/5 hover:border-purple-300'
                  : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${sec.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                  <Icon size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-black tracking-tight ${isEnabled ? 'text-slate-900' : 'text-slate-500'}`}>
                      {sec.title}
                    </h4>
                    {isEnabled ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black shrink-0">
                        সক্রিয়
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black shrink-0">
                        লুকানো
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
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
