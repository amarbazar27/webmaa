'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, Crown } from 'lucide-react';

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
    badgeTheme: 'emerald',
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
    badgeTheme: 'emerald',
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
            <Zap size={14} />
            <span>স্বচ্ছ ও সাশ্রয়ী সাবস্ক্রিপশন প্ল্যান</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            আপনার অনলাইন ব্যবসার জন্য{' '}
            <span className="text-emerald-600 dark:text-emerald-400">সেরা প্যাকেজটি</span> বেছে নিন
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            কোনো লুকানো চার্জ নেই। নতুনদের জন্য ০৳ অগ্রিম খরচে রেভিনিউ শেয়ার থেকে শুরু করে বড় ব্যবসার জন্য আনলিমিটেড ফিক্সড প্যাকেজ।
          </p>
        </div>

        {/* 4 Columns Grid — Clean Modern Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map(({ key, data }) => {
            const isSelected = selectedPlan === key;
            const isStarter = key === 'starter';

            return (
              <div
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer relative group ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500 shadow-md -translate-y-1'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                {/* Top Badge */}
                <div className="flex justify-center -mt-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isStarter
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                      : key === 'yearly'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {data.badge}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Plan Info */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {data.bengaliTitle}
                    </p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight mt-0.5">
                      {data.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                      {data.subtitle}
                    </p>
                  </div>

                  {/* Price Block — Single elevation layout, no nested cards */}
                  <div className="py-3 border-y border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl sm:text-4xl font-black font-mono tabular-nums ${
                        isStarter ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        ৳{data.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {data.period}
                      </span>
                    </div>
                    {data.commissionText && (
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1">
                        {data.commissionText}
                      </p>
                    )}
                  </div>

                  {/* Feature Lines List */}
                  <div className="space-y-2.5 pt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                    {data.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 size={12} className="stroke-[2.5]" />
                        </div>
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tactile CTA Button */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanSelect(key);
                    }}
                    className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{isStarter ? 'শেয়ার করে শুরু করুন' : 'প্যাকেজটি বেছে নিন'}</span>
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
