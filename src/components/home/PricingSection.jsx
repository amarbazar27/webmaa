'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Zap, Crown } from 'lucide-react';

const DEFAULT_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    bengaliTitle: 'স্টার্টার প্যাকেজ',
    subtitle: '০৳ মাসিক ফি • রেভিনিউ শেয়ার',
    price: 0,
    period: '/ মাসিক চার্জ নেই',
    badge: 'নতুনদের জন্য স্পেশাল',
    badgeTheme: 'amber',
    commissionText: '⚡ বিক্রয়ের মাত্র ৫% শেয়ার',
    features: [
      '০৳ অগ্রিম খরচ (Zero Upfront Risk)',
      'সম্পূর্ণ অনলাইন ওয়েবসাইট ও স্টোরফ্রন্ট',
      'নো সেল = নো ফি (১০০% নিরাপদ ব্যবসা)',
      'Steadfast ও অটো পেমেন্ট গেটওয়ে',
      'যেকোনো সময় ফিক্সড প্ল্যানে আপগ্রেড'
    ]
  },
  monthly: {
    id: 'monthly',
    name: 'Standard Monthly',
    bengaliTitle: 'মাসিক প্যাকেজ',
    subtitle: 'নিয়মিত ব্যবসার জন্য সেরা',
    price: 500,
    period: '/ প্রতি মাস',
    badge: '🎁 ১ম মাস ফ্রি ট্রায়াল',
    badgeTheme: 'purple',
    commissionText: '🛡️ ০% সেলস কমিশন (১০০% প্রফিট)',
    features: [
      '১০০% বিক্রয় লাভ আপনার (০% কমিশন)',
      '🌐 নিজস্ব কাস্টম ডোমেন কানেকশন',
      '📱 প্রফেশনাল মোবাইল অ্যাপ ও PWA',
      '📦 আনলিমিটেড প্রোডাক্ট ও ক্যাটালগ',
      '🤖 AI প্রোডাক্ট ডেসক্রিপশন রাইটার'
    ]
  },
  quarterly: {
    id: 'quarterly',
    name: 'Growth Quarterly',
    bengaliTitle: 'ত্রৈমাসিক প্যাকেজ',
    subtitle: '৩ মাসের জন্য ১০% অতিরিক্ত ছাড়',
    price: 1350,
    period: '/ ৩ মাস',
    badge: '🔥 জনপ্রিয় ও সাশ্রয়ী',
    badgeTheme: 'teal',
    commissionText: '🛡️ ০% সেলস কমিশন (১০০% প্রফিট)',
    features: [
      '১০০% বিক্রয় লাভ আপনার (০% কমিশন)',
      '🌐 নিজস্ব কাস্টম ডোমেন কানেকশন',
      '📱 প্রফেশনাল মোবাইল অ্যাপ ও PWA',
      '📦 আনলিমিটেড প্রোডাক্ট ও অর্ডার',
      '⚡ ভিআইপি প্রায়োরিটি সাপোর্ট'
    ]
  },
  yearly: {
    id: 'yearly',
    name: 'Pro Yearly',
    bengaliTitle: 'বার্ষিক প্যাকেজ',
    subtitle: 'সারা বছরের নিশ্চিন্ত সুপার সেভার',
    price: 5000,
    period: '/ ১ বছর',
    badge: '👑 সর্বোচ্চ লাভজনক (২ মাস ফ্রি)',
    badgeTheme: 'indigo',
    commissionText: '🛡️ ০% সেলস কমিশন (১০০% প্রফিট)',
    features: [
      '১০০% বিক্রয় লাভ আপনার (০% কমিশন)',
      '🌐 নিজস্ব কাস্টম ডোমেন কানেকশন',
      '📱 প্রফেশনাল মোবাইল অ্যাপ ও PWA',
      '🤖 ফুল AI অটোমেশন ও অ্যাসিস্ট্যান্ট',
      '👑 ডেডিকেটেড ভিআইপি সাপোর্ট ও সেটআপ'
    ]
  }
};

export default function PricingSection({ globalConfig = null }) {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  // Starter commission percent from globalConfig if set
  const starterPercent = globalConfig?.subStarterPercent ?? 5;

  // Pricing prices from globalConfig if set
  const priceMap = {
    starter: 0,
    monthly: Number(globalConfig?.subPriceMonthly) || 500,
    quarterly: Number(globalConfig?.subPriceQuarterly) || 1350,
    yearly: Number(globalConfig?.subPriceYearly) || 5000
  };

  // Merge configured pricing plans and their dynamic feature lines
  const configuredPlans = globalConfig?.pricingPlans || {};

  const getPlanData = (key) => {
    const defaultData = DEFAULT_PLANS[key];
    const customData = configuredPlans[key] || {};

    let price = priceMap[key];
    if (customData.price !== undefined && customData.price !== '') {
      price = Number(customData.price);
    }

    const features = Array.isArray(customData.features) && customData.features.length > 0
      ? customData.features
      : defaultData.features;

    const commissionText = key === 'starter'
      ? `⚡ বিক্রয়ের মাত্র ${starterPercent}% শেয়ার`
      : (customData.commissionText || defaultData.commissionText);

    return {
      ...defaultData,
      ...customData,
      price,
      commissionText,
      features
    };
  };

  const starterData = getPlanData('starter');
  const monthlyData = getPlanData('monthly');
  const quarterlyData = getPlanData('quarterly');
  const yearlyData = getPlanData('yearly');

  const plans = [
    { key: 'starter', data: starterData },
    { key: 'monthly', data: monthlyData },
    { key: 'quarterly', data: quarterlyData },
    { key: 'yearly', data: yearlyData }
  ];

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
    if (user && (userData?.role === 'retailer' || userData?.role === 'superadmin')) {
      router.push(`/dashboard/billing?package=${planKey}`);
    } else {
      router.push(`/become-retailer?plan=${planKey}`);
    }
  };

  return (
    <section id="pricing" className="relative z-20 py-16 md:py-24 scroll-mt-14 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full neo-extruded-sm text-[#6C63FF] font-black text-xs uppercase tracking-widest">
            <Sparkles size={14} className="animate-pulse" />
            <span>স্বচ্ছ ও সাশ্রয়ী সাবস্ক্রিপশন প্ল্যান</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3D4852] dark:text-slate-100 tracking-tight leading-tight">
            আপনার অনলাইন ব্যবসার জন্য{' '}
            <span className="text-[#6C63FF]">সেরা প্যাকেজটি</span> বেছে নিন
          </h2>

          <p className="text-sm sm:text-base text-[#6B7280] dark:text-slate-400 font-medium leading-relaxed">
            কোনো লুকানো চার্জ নেই। নতুনদের জন্য ০৳ অগ্রিম খরচে রেভিনিউ শেয়ার থেকে শুরু করে বড় ব্যবসার জন্য আনলিমিটেড ফিক্সড প্যাকেজ।
          </p>
        </div>

        {/* 4 Columns Grid — Neumorphic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map(({ key, data }) => {
            const isSelected = selectedPlan === key;
            const isStarter = key === 'starter';

            return (
              <div
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`neo-card p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer relative group ${
                  isSelected
                    ? 'ring-2 ring-[#6C63FF] -translate-y-1.5 shadow-[12px_12px_22px_rgba(163,177,198,0.7),-12px_-12px_22px_rgba(255,255,255,0.7)]'
                    : 'hover:-translate-y-1'
                }`}
              >
                {/* Top Badge */}
                <div className="flex justify-center -mt-2 mb-4">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black neo-inset-sm ${
                    isStarter
                      ? 'text-amber-700 dark:text-amber-400'
                      : key === 'yearly'
                      ? 'text-indigo-700 dark:text-indigo-400'
                      : 'text-[#6C63FF]'
                  }`}>
                    {data.badge}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Plan Info */}
                  <div>
                    <p className="text-[11px] font-black text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">
                      {data.bengaliTitle}
                    </p>
                    <h3 className="text-xl font-black text-[#3D4852] dark:text-slate-100 leading-tight mt-0.5">
                      {data.name}
                    </h3>
                    <p className="text-xs text-[#6B7280] dark:text-slate-400 font-medium mt-1">
                      {data.subtitle}
                    </p>
                  </div>

                  {/* Price Box — Inset Well */}
                  <div className="p-4 rounded-2xl neo-inset space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl sm:text-4xl font-black ${
                        isStarter ? 'text-amber-600 dark:text-amber-400' : 'text-[#6C63FF]'
                      }`}>
                        ৳{data.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#6B7280] dark:text-slate-400 font-medium">
                        {data.period}
                      </span>
                    </div>
                    {data.commissionText && (
                      <p className="text-[11px] font-black text-[#3D4852] dark:text-slate-300 pt-1">
                        {data.commissionText}
                      </p>
                    )}
                  </div>

                  {/* Feature Lines List (Dynamic Line-by-Line) */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-300/30 dark:border-white/5 text-xs font-medium text-[#3D4852] dark:text-slate-200">
                    {data.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full neo-inset-sm flex items-center justify-center shrink-0 mt-0.5 text-[#38B2AC]">
                          <CheckCircle2 size={13} className="stroke-[2.5]" />
                        </div>
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tactile CTA Button */}
                <div className="mt-6 pt-4 border-t border-slate-300/30 dark:border-white/5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanSelect(key);
                    }}
                    className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#6C63FF] hover:bg-[#5a52ea] text-white neo-extruded active:translate-y-0.5 active:neo-inset-sm'
                        : 'neo-btn text-[#3D4852] dark:text-slate-200 hover:text-[#6C63FF]'
                    }`}
                  >
                    <span>{isStarter ? '🚀 শেয়ার করে শুরু করুন' : 'প্যাকেজটি বেছে নিন'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
