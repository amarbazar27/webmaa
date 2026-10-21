'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, Circle, ArrowRight, Store, Tag, Package, 
  Truck, MessageCircle, ExternalLink, Sparkles, ChevronDown, 
  ChevronUp, ShieldCheck, Flame, Compass, LayoutGrid
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function RetailerOnboardingWizard({ shop, products = [], orders = [], shopUrl = '' }) {
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine completion state of each step
  const step1Done = Boolean(shop?.shopName && (shop?.phone || shop?.supportPhone || shop?.logoUrl));
  const step2Done = Boolean(shop?.categoryCount > 0 || (products && products.some(p => p.category)));
  const step3Done = Boolean(products && products.length > 0);
  const step4Done = Boolean(shop?.deliveryChargeInside !== undefined || shop?.bkashNumber || shop?.steadfastApiKey);
  const step5Done = Boolean(shop?.facebookPageId || shop?.socialConnected || shop?.autoReplyEnabled);
  const step6Done = Boolean(orders && orders.length > 0);

  const steps = [
    {
      id: 1,
      title: t('১. স্টোরের ব্র্যান্ডিং ও প্রোফাইল সেট করুন', '1. Set Up Store Branding & Profile'),
      desc: t('লোগো, দোকানের নাম, ফোন নম্বর ও সোশ্যাল লিংক যোগ করুন।', 'Add store logo, name, phone number, and social links.'),
      href: '/dashboard/settings',
      btnText: t('প্রোফাইল সাজান', 'Edit Profile'),
      icon: Store,
      done: step1Done,
    },
    {
      id: 2,
      title: t('২. পণ্যের ক্যাটাগরি তৈরি করুন', '2. Create Product Categories'),
      desc: t('গ্রোসারি, পোশাক বা গ্যাজেট অনুযায়ী ক্যাটাগরি তৈরি করুন।', 'Create categories like Grocery, Clothing, or Gadgets.'),
      href: '/dashboard/categories',
      btnText: t('ক্যাটাগরি যোগ করুন', 'Add Categories'),
      icon: Tag,
      done: step2Done,
    },
    {
      id: 3,
      title: t('৩. প্রথম পণ্য ও স্টক আপলোড করুন', '3. Upload Your First Products'),
      desc: t('পণ্যের ছবি, মূল্য ও স্টক ইনভেন্টরি যুক্ত করুন।', 'Add product photos, regular & sale price, and stock inventory.'),
      href: '/dashboard/products/new',
      btnText: t('পণ্য যোগ করুন', 'Add Product'),
      icon: Package,
      done: step3Done,
    },
    {
      id: 4,
      title: t('৪. পেমেন্ট ও কুরিয়ার মেথড সেট করুন', '4. Configure Payment & Courier'),
      desc: t('ক্যাশ অন ডেলিভারি, বিকাশ নম্বর ও স্টিডফাস্ট কুরিয়ার API চালু করুন।', 'Configure Cash on Delivery, bKash, and Steadfast Courier API.'),
      href: '/dashboard/settings',
      btnText: t('ডেলিভারি সেটিংস', 'Delivery Settings'),
      icon: Truck,
      done: step4Done,
    },
    {
      id: 5,
      title: t('৫. সোশ্যাল হাব ও এআই অটো-রিপ্লাই কানেক্ট করুন', '5. Connect Social Hub & AI Auto-Reply'),
      desc: t('ফেসবুক পেজ কানেক্ট করে অটো কমেন্ট ও মেসেঞ্জার ইনবক্স চালু করুন।', 'Connect Facebook Page for automated AI comments & Messenger chat.'),
      href: '/dashboard/social-hub',
      btnText: t('সোশ্যাল হাব', 'Social Hub'),
      icon: MessageCircle,
      done: step5Done,
    },
    {
      id: 6,
      title: t('৬. লাইভ স্টোর ভিজিট ও টেস্ট অর্ডার সম্পন্ন করুন', '6. Visit Live Store & Place Test Order'),
      desc: t('কাস্টমার হিসেবে আপনার লাইভ সাবডোমেইনে গিয়ে ১টি টেস্ট অর্ডার করুন।', 'Visit your live store URL and place a test order as a customer.'),
      href: shopUrl || '/dashboard',
      isExternal: Boolean(shopUrl),
      btnText: t('লাইভ স্টোর দেখুন', 'Visit Storefront'),
      icon: ExternalLink,
      done: step6Done,
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 rounded-3xl border-2 border-purple-200/90 dark:border-purple-800/80 shadow-md p-4 sm:p-6 md:p-7 relative overflow-hidden transition-all w-full min-w-0">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100 dark:border-purple-900/60">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
            <Compass size={22} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] sm:text-xs font-black tracking-wide uppercase">
                🚀 {t('নতুন রিটেইলার অনবোর্ডিং গাইড', 'New Merchant Setup Guide')}
              </span>
              <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                {completedCount}/{steps.length} {t('সম্পন্ন', 'Done')}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              {t('মাত্র ৬টি সহজ ধাপে আপনার অনলাইন বিজনেস শুরু করুন', 'Start Your Online Store in 6 Easy Steps')}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <span>{isCollapsed ? t('গাইড বিস্তারিত দেখুন', 'Expand Guide') : t('সংক্ষিপ্ত করুন', 'Collapse')}</span>
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
          <span>{t('সেটআপ অগ্রগতি:', 'Setup Progress:')}</span>
          <span className="text-purple-600 dark:text-purple-400 font-mono font-black">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
      </div>

      {/* Step Cards Grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  step.done
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      step.done 
                        ? 'bg-emerald-500 text-white shadow-xs' 
                        : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                    }`}>
                      <Icon size={16} />
                    </div>

                    {step.done ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> {t('সম্পন্ন', 'Completed')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        <Circle size={10} className="fill-current text-amber-500" /> {t('বাকি আছে', 'Pending')}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  {step.isExternal ? (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs transition-transform active:scale-95"
                    >
                      <span>{step.btnText}</span>
                      <ExternalLink size={13} />
                    </a>
                  ) : (
                    <Link
                      href={step.href}
                      className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 ${
                        step.done
                          ? 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                      }`}
                    >
                      <span>{step.btnText}</span>
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🧭 Quick Functional Directory (পণ্য, অর্ডার, ডিজাইন, সেটিংস এক নজরে) */}
      <div className="mt-6 pt-5 border-t border-purple-100 dark:border-purple-900/60">
        <div className="flex items-center gap-1.5 mb-3 text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
          <LayoutGrid size={15} className="text-purple-600 dark:text-purple-400" />
          <span>{t('রিটেইলার কুইক অ্যাকশন হাব (সকল অপশন এক নজরে)', 'Retailer Quick Action Hub')}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/dashboard/products"
            className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition-all group"
          >
            <span className="text-lg block mb-1">📦</span>
            <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-purple-600">পণ্য ও স্টক</p>
            <p className="text-[10px] text-slate-400 truncate">লিস্ট ও ইনভেন্টরি</p>
          </Link>

          <Link
            href="/dashboard/orders"
            className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition-all group"
          >
            <span className="text-lg block mb-1">🛒</span>
            <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-purple-600">সকল অর্ডার</p>
            <p className="text-[10px] text-slate-400 truncate">ইনভয়েস ও কুরিয়ার</p>
          </Link>

          <Link
            href="/dashboard/homepage-builder"
            className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition-all group"
          >
            <span className="text-lg block mb-1">🎨</span>
            <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-purple-600">হোমপেজ ডিজাইন</p>
            <p className="text-[10px] text-slate-400 truncate">ব্যানার ও লেআউট</p>
          </Link>

          <Link
            href="/dashboard/settings"
            className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition-all group"
          >
            <span className="text-lg block mb-1">⚙️</span>
            <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-purple-600">স্টোর সেটিংস</p>
            <p className="text-[10px] text-slate-400 truncate">ডোমেইন ও পেমেন্ট</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
