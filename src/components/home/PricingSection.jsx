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
    if (user && (userData?.role === 'retailer' || userData?.role === 'superadmin')) {
      router.push(`/dashboard/billing?package=${planKey}`);
    } else {
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
            <span className="text-xs font-black uppercase tracking-wider text-purple-800">
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
            {/* Standard Centered Badge */}
            <div className="flex justify-center -mt-2 mb-3">
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-sm">
                <Sparkles size={13} /> নতুনদের জন্য স্পেশাল
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-amber-700 uppercase tracking-wider">স্টার্টার প্যাকেজ</p>
                <h3 className="text-xl font-black text-slate-900 leading-tight">Starter Plan</h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">০৳ মাসিক ফি • রেভিনিউ শেয়ার</p>
              </div>

              {/* Price Box */}
              <div className="p-4 bg-white/90 border border-amber-200/80 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-amber-600">৳০</span>
                  <span className="text-xs text-slate-500 font-bold">/ মাসিক চার্জ নেই</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/90 text-amber-900 text-xs font-black">
                  ⚡ বিক্রয়ের মাত্র {starterPercent}% শেয়ার
                </div>
              </div>

              {/* Structured Features List matching all cards */}
              <div className="space-y-2.5 pt-2 border-t border-amber-100 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-amber-500 shrink-0" />
                  <span>০৳ অগ্রিম খরচ (Zero Upfront Risk)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-amber-500 shrink-0" />
                  <span>সম্পূর্ণ অনলাইন ওয়েবসাইট ও স্টোরফ্রন্ট</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-amber-500 shrink-0" />
                  <span>নো সেল = নো ফি (১০০% নিরাপদ ব্যবসা)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-amber-500 shrink-0" />
                  <span>Steadfast ও অটো পেমেন্ট গেটওয়ে</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-amber-500 shrink-0" />
                  <span>যেকোনো সময় ফিক্সড প্ল্যানে আপগ্রেড</span>
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
            {/* Standard Centered Badge */}
            <div className="flex justify-center -mt-2 mb-3">
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-sm">
                🎁 ১ম মাস ফ্রি ট্রায়াল
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-purple-600 uppercase tracking-wider">রেগুলার প্ল্যান</p>
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
              </div>

              {/* Features List */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600 shrink-0" />
                  <span>১০০% বিক্রয় লাভ আপনার (০% কমিশন)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600 shrink-0" />
                  <span>🌐 নিজস্ব কাস্টম ডোমেন কানেকশন</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600 shrink-0" />
                  <span>📱 প্রফেশনাল মোবাইল অ্যাপ ও PWA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600 shrink-0" />
                  <span>📦 আনলিমিটেড প্রোডাক্ট ও ক্যাটালগ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600 shrink-0" />
                  <span>🤖 AI প্রোডাক্ট ডেসক্রিপশন রাইটার</span>
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
            {/* Standard Centered Badge */}
            <div className="flex justify-center -mt-2 mb-3">
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-sm">
                🎁 ১ মাস ফ্রি • 🔥 জনপ্রিয়
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-purple-600 uppercase tracking-wider">ত্রৈমাসিক প্ল্যান</p>
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
              </div>

              {/* Features List */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600 shrink-0" />
                  <span>১০০% বিক্রয় লাভ আপনার (০% কমিশন)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600 shrink-0" />
                  <span>🌐 নিজস্ব কাস্টম ডোমেন কানেকশন</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600 shrink-0" />
                  <span>📱 প্রফেশনাল মোবাইল অ্যাপ ও PWA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600 shrink-0" />
                  <span>📦 আনলিমিটেড প্রোডাক্ট ও অর্ডার</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600 shrink-0" />
                  <span>⚡ ভিআইপি প্রায়োরিটি সাপোর্ট</span>
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
                ? 'border-indigo-600 bg-indigo-50/30 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-400/30 -translate-y-1'
                : 'border-slate-200 hover:border-indigo-300 bg-white hover:-translate-y-0.5'
            }`}
          >
            {/* Standard Centered Badge */}
            <div className="flex justify-center -mt-2 mb-3">
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-sm">
                👑 সর্বোচ্চ সাশ্রয়ী • ভিআইপি
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-indigo-600 uppercase tracking-wider">বাৎসরিক প্ল্যান</p>
                <h3 className="text-xl font-black text-slate-900 leading-tight">Yearly Plan</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">১২ মাসের সম্পূর্ণ মেম্বারশিপ</p>
              </div>

              {/* Price Box */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-indigo-700">৳{priceMap.yearly}</span>
                  <span className="text-xs text-slate-400 font-bold">/ প্রতি বছর</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-black">
                  💎 প্রায় ২ মাস সম্পূর্ণ ফ্রি!
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-600 shrink-0" />
                  <span>১০০% বিক্রয় লাভ আপনার (০% কমিশন)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-600 shrink-0" />
                  <span>🌐 আনলিমিটেড কাস্টম ডোমেন ব্যান্ডউইথ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-600 shrink-0" />
                  <span>📱 প্রফেশনাল ডেডিকেটেড মোবাইল অ্যাপ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-600 shrink-0" />
                  <span>🤖 প্রিমিয়াম AI বিজনেস সহকারী</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-600 shrink-0" />
                  <span>👑 ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার</span>
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
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>বাৎসরিক প্ল্যান বেছে নিন</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </div>

        {/* Guarantee Banner */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs font-black text-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>নিরাপদ বিকাশ ও নগদ পেমেন্ট</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-purple-600" />
              <span>২৪/৭ ডেডিকেটেড হেল্পলাইন সাপোর্ট</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <span>কোনো হিডেন বা সেটআপ ফি নেই</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
