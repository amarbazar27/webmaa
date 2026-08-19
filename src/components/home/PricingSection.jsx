'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Crown, 
  Check, 
  ShoppingBag,
  Store,
  Clock,
  HelpCircle
} from 'lucide-react';

export default function PricingSection({ globalConfig = null }) {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('starter');

  const starterPercent = globalConfig?.subStarterPercent ?? 5;

  const priceMap = {
    starter: 0,
    monthly: Number(globalConfig?.subPriceMonthly) || 500,
    quarterly: Number(globalConfig?.subPriceQuarterly) || 1350,
    yearly: Number(globalConfig?.subPriceYearly) || 5000
  };

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
    // If logged in as retailer or superadmin, go directly to billing dashboard
    if (user && (userData?.role === 'retailer' || userData?.role === 'superadmin')) {
      router.push(`/dashboard/billing?package=${planKey}`);
    } else {
      // If visitor or regular customer, redirect to become-retailer request page with plan pre-selected
      router.push(`/become-retailer?plan=${planKey}`);
    }
  };

  return (
    <section id="pricing" className="relative z-20 py-16 md:py-24 bg-gradient-to-b from-slate-50 via-white to-purple-50/40 border-t border-b border-slate-200/80 overflow-hidden scroll-mt-14">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 shadow-xs">
            <Sparkles size={14} className="text-purple-700 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-800">
              স্বচ্ছ ও সাশ্রয়ী সাবস্ক্রিপশন প্ল্যান
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            আপনার অনলাইন ব্যবসার জন্য{' '}
            <span className="bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              সেরা প্যাকেজটি
            </span>{' '}
            বেছে নিন
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            কোনো লুকানো চার্জ নেই। নতুনদের জন্য ০৳ অগ্রিম খরচে রেভিনিউ শেয়ার থেকে শুরু করে বড় ব্যবসার জন্য আনলিমিটেড ফিক্সড প্যাকেজ।
          </p>
        </div>

        {/* 4 Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* 1st Column: Starter Plan (Revenue Share) */}
          <div 
            onClick={() => setSelectedPlan('starter')}
            className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer ${
              selectedPlan === 'starter'
                ? 'border-amber-500 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/30 -translate-y-1'
                : 'border-amber-200/90 hover:border-amber-400 bg-gradient-to-b from-amber-50/30 to-white hover:-translate-y-0.5'
            }`}
          >
            {/* Top Floating Badge */}
            <div className="absolute top-0 right-0">
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-2xl shadow-sm">
                <Sparkles size={11} /> নতুনদের জন্য স্পেশাল
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">স্টার্টার প্যাকেজ</p>
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">Starter Plan</h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">০৳ মাসিক ফি • রেভিনিউ শেয়ার</p>
              </div>

              {/* Price Box */}
              <div className="p-4 bg-white/90 border border-amber-200/80 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-amber-600">৳০</span>
                  <span className="text-xs text-slate-400 font-bold">/ মাসিক চার্জ নেই</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/90 text-amber-900 text-xs font-black">
                  ⚡ শুধুমাত্র {starterPercent}% বিক্রয় শেয়ার
                </div>
              </div>

              {/* Persuasive copy */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-100 text-xs text-amber-950 font-medium leading-relaxed space-y-2">
                <div className="font-black text-amber-900 text-[11.5px] space-y-0.5">
                  <p>ব্যবসা একদম নতুন?</p>
                  <p>মাসিক সাবস্ক্রিপশন নিতে এখনো দ্বিধায় আছেন?</p>
                </div>
                <p className="text-slate-700 font-semibold text-[11px] leading-normal">
                  তাহলে শুরু করুন ঝুঁকি কমিয়ে! মাসিক ফি নয়—<span className="text-amber-800 font-black">আপনার বিক্রয়ের মাত্র {starterPercent}% শেয়ার করেই</span> ব্যবসা শুরু করুন। ব্যবসা যখন একটু দাঁড়িয়ে যাবে, তখন যেকোনো সময় নিয়মিত সাবস্ক্রিপশন প্ল্যানে চলে যেতে পারবেন।
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-2 pt-2 border-t border-amber-100 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-amber-500 shrink-0" />
                  <span>০৳ অগ্রিম খরচ (Zero Risk)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-amber-500 shrink-0" />
                  <span>সম্পূর্ণ অনলাইন ওয়েবসাইট ও স্টোরফ্রন্ট</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-amber-500 shrink-0" />
                  <span>নো সেল = নো ফি (১০০% নিরাপদ)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-amber-500 shrink-0" />
                  <span>যেকোনো সময় আপগ্রেডের পূর্ণ স্বাধীনতা</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-6 pt-4 border-t border-amber-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanSelect('starter');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>🚀 শেয়ার করে শুরু করুন</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* 2nd Column: Monthly Plan */}
          <div 
            onClick={() => setSelectedPlan('monthly')}
            className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer ${
              selectedPlan === 'monthly'
                ? 'border-purple-600 bg-purple-50/30 shadow-xl shadow-purple-500/10 ring-2 ring-purple-400/30 -translate-y-1'
                : 'border-slate-200 hover:border-purple-300 bg-white hover:-translate-y-0.5'
            }`}
          >
            {/* Top Badge: 1 Month Free */}
            <div className="absolute top-0 right-0">
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-bl-2xl shadow-sm">
                🎁 ১ম মাস ফ্রি ট্রায়াল
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">রেগুলার প্ল্যান</p>
                <h3 className="text-xl font-black text-slate-900 leading-tight">Monthly Plan</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">১ মাসের স্টোর লাইসেন্স</p>
              </div>

              {/* Price Box */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-purple-700">৳{priceMap.monthly}</span>
                  <span className="text-xs text-slate-400 font-bold">/ প্রতি মাস</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-xs font-black">
                  🛡️ ০% সেলস কমিশন (১০০% প্রফিট)
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black mt-1">
                  ✨ প্রথম ১ মাস সম্পূর্ণ ফ্রি ক্লেইম করুন!
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                প্রতি মাসে সহজে নবায়নযোগ্য স্ট্যান্ডার্ড প্যাকেজ। আপনার বিক্রির সম্পূর্ণ লাভ ১০০% আপনার থাকবে।
              </p>

              {/* Features List */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>১০০% বিক্রয় লাভ আপনার (০% কমিশন)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>🌐 নিজস্ব কাস্টম ডোমেন কানেকশন</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>📱 প্রফেশনাল মোবাইল অ্যাপ ও PWA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>📦 আনলিমিটেড প্রোডাক্ট ও ক্যাটালগ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>🤖 AI প্রোডাক্ট ডেসক্রিপশন রাইটার</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>৩০ দিন নিশ্চিত লাইসেন্স</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanSelect('monthly');
                }}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>মাসিক প্ল্যান বেছে নিন</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* 3rd Column: Quarterly Plan */}
          <div 
            onClick={() => setSelectedPlan('quarterly')}
            className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer ${
              selectedPlan === 'quarterly'
                ? 'border-purple-600 bg-purple-50/30 shadow-xl shadow-purple-500/10 ring-2 ring-purple-400/30 -translate-y-1'
                : 'border-slate-200 hover:border-purple-300 bg-white hover:-translate-y-0.5'
            }`}
          >
            {/* Top Badge */}
            <div className="absolute top-0 right-0">
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-2xl shadow-sm">
                🎁 ১ মাস ফ্রি • 🔥 জনপ্রিয়
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">ত্রৈমাসিক প্ল্যান</p>
                <h3 className="text-xl font-black text-slate-900 leading-tight">Quarterly Plan</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">৩ মাসের স্টোর লাইসেন্স</p>
              </div>

              {/* Price Box */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-purple-700">৳{priceMap.quarterly}</span>
                  <span className="text-xs text-slate-400 font-bold">/ প্রতি ৩ মাস</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-xs font-black">
                  🛡️ ০% সেলস কমিশন (১০০% প্রফিট)
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black mt-1">
                  ✨ প্রথম ১ মাস সম্পূর্ণ ফ্রি ট্রায়াল!
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                ৩ মাসের নিশ্চিন্ত ব্যবসা এবং প্রতি মাসে রিনিউ করার ঝামেলা থেকে সম্পূর্ণ মুক্তি।
              </p>

              {/* Features List */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>১০০% বিক্রয় লাভ আপনার (০% কমিশন)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>🌐 নিজস্ব কাস্টম ডোমেন কানেকশন</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>📱 প্রফেশনাল মোবাইল অ্যাপ ও PWA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>📦 আনলিমিটেড প্রোডাক্ট ও অ্যাডভান্সড ইনভেন্টরি</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>🤖 AI প্রোডাক্ট রাইটার ও স্মার্ট ইনসাইটস</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>🔔 ইনস্ট্যান্ট ইমেইল ও ড্যাশবোর্ড অর্ডার অ্যালার্ট</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-500 shrink-0" />
                  <span>প্রাইওরিটি কাস্টমার সাপোর্ট</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanSelect('quarterly');
                }}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>ত্রৈমাসিক প্ল্যান বেছে নিন</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* 4th Column: Yearly Plan */}
          <div 
            onClick={() => setSelectedPlan('yearly')}
            className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer ${
              selectedPlan === 'yearly'
                ? 'border-emerald-600 bg-emerald-50/30 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-400/30 -translate-y-1'
                : 'border-slate-200 hover:border-emerald-300 bg-white hover:-translate-y-0.5'
            }`}
          >
            {/* Top Badge */}
            <div className="absolute top-0 right-0">
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-2xl shadow-sm">
                👑 সেরা অফার • ১ মাস ফ্রি
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">বাৎসরিক প্যাকেজ</p>
                <h3 className="text-xl font-black text-slate-900 leading-tight">Yearly Plan</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">১২ মাসের স্টোর লাইসেন্স</p>
              </div>

              {/* Price Box */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-emerald-700">৳{priceMap.yearly}</span>
                  <span className="text-xs text-slate-400 font-bold">/ প্রতি বছর</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">
                  🛡️ সর্বোচ্চ সাশ্রয়ী বাৎসরিক রেট
                </div>
                <div className="p-2 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 rounded-xl text-[11px] font-black text-amber-900 mt-2 flex items-center gap-1.5 shadow-xs">
                  <span>🎁</span>
                  <span>১ বছর ফ্রি .COM ডোমেন গিফট!</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                দীর্ঘমেয়াদী ও সিরিয়াস উদ্যোক্তাদের জন্য সবচেয়ে বেশি সাশ্রয়ী ও প্রিমিয়াম অফার।
              </p>

              {/* Features List */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2 text-amber-900 font-black">
                  <Sparkles size={15} className="text-amber-500 shrink-0" />
                  <span>🎁 ১ বছর ফ্রি .COM ডোমেন (Free Setup + SSL)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                  <span>১০০% বিক্রয় লাভ আপনার (০% কমিশন)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                  <span>📱 প্রফেশনাল মোবাইল অ্যাপ ও PWA বিল্ডার</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                  <span>📦 আনলিমিটেড প্রোডাক্ট ও অ্যাডভান্সড ইনভেন্টরি</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                  <span>🤖 AI ফুল অ্যাসিস্ট্যান্ট ও স্মার্ট ইনসাইটস</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                  <span>⚡ লাইভ অর্ডার ট্র্যাকিং ও স্মার্ট নোটিফিকেশন</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                  <span>৩৬৫ দিন ফুল প্রিমিয়াম অ্যাক্সেস + ১ মাস ফ্রি</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                  <span>ভিআইপি প্রায়োরিটি ডেডিকেটেড সাপোর্ট</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanSelect('yearly');
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>বাৎসরিক প্ল্যান বেছে নিন</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Trust & Guarantee Bar */}
        <div className="mt-12 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">ঝুঁকিহীন ট্রায়াল ও ফুল অ্যাক্টিভেশন সাপোর্ট</h4>
              <p className="text-xs text-slate-500 font-medium">কোনো কার্ড ছাড়াই স্টার্টার বা ট্রায়াল শুরু করুন। যেকোনো সময় ক্যানসেল বা প্যাকেজ আপগ্রেড করতে পারবেন।</p>
            </div>
          </div>
          <Link
            href="/become-retailer"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shrink-0 flex items-center gap-1.5 shadow-md"
          >
            <Store size={14} />
            মার্চেন্ট হতে আবেদন করুন
          </Link>
        </div>

      </div>
    </section>
  );
}
