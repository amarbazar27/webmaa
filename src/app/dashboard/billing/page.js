'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getShop, subscribeGlobalConfig } from '@/lib/firestore';
import { Card, Button, Input } from '@/components/ui';
import { 
  ShieldCheck, 
  Calendar, 
  AlertCircle, 
  CreditCard, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Check 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const { activeShopId } = useAuth();
  const [shop, setShop] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedPackage, setSelectedPackage] = useState('starter');
  const [paymentMethod, setPaymentMethod] = useState('automated');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Coupon States
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponDiscountType, setCouponDiscountType] = useState('percent');
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (!activeShopId) return;

    // Load shop data
    getShop(activeShopId).then((data) => {
      setShop(data);
      if (data?.subscriptionPackage && ['starter', 'monthly', 'quarterly', 'yearly'].includes(data.subscriptionPackage)) {
        setSelectedPackage(data.subscriptionPackage);
      }
      setLoading(false);
    });

    // Load global subscription config
    const unsub = subscribeGlobalConfig((config) => {
      setGlobalConfig(config);
    });

    return () => unsub();
  }, [activeShopId]);

  if (loading || !shop) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const starterPercent = globalConfig?.subStarterPercent ?? 5;

  // Price configurations
  const priceMap = {
    starter: 0,
    monthly: Number(globalConfig?.subPriceMonthly) || 500,
    quarterly: Number(globalConfig?.subPriceQuarterly) || 1350,
    yearly: Number(globalConfig?.subPriceYearly) || 5000
  };

  const isSubsEnabled = globalConfig?.subscriptionsEnabled ?? false;

  // Format subscription expiry date
  const getExpiryText = () => {
    if (shop?.subscriptionPackage === 'starter' && shop?.subscriptionStatus === 'active') {
      return <span className="text-amber-700 font-black">আজীবন (রেভিনিউ শেয়ার মোড)</span>;
    }
    if (!shop?.subscriptionExpiresAt) return 'কোনো সক্রিয় প্যাকেজ নেই';
    const dateObj = shop.subscriptionExpiresAt.toDate 
      ? shop.subscriptionExpiresAt.toDate() 
      : new Date(shop.subscriptionExpiresAt);
    
    const isExpired = dateObj.getTime() < Date.now();
    return (
      <span className={isExpired ? 'text-red-600 font-black' : 'text-emerald-700 font-black'}>
        {dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        {isExpired ? ' (Expired)' : ' (Active)'}
      </span>
    );
  };

  const handleClaimTrial = async (packageType) => {
    const days = packageType === 'monthly' 
      ? (globalConfig?.subTrialMonthly || 7) 
      : packageType === 'quarterly' 
        ? (globalConfig?.subTrialQuarterly || 14) 
        : (globalConfig?.subTrialYearly || 30);

    if (!confirm(`আপনি কি এই প্যাকেজের অধীনে ${days} দিনের ফ্রি ট্রায়াল শুরু করতে চান?`)) return;
    setSubmitting(true);
    const loadingToast = toast.loading('ফ্রি ট্রায়াল সক্রিয় করা হচ্ছে...');
    try {
      const res = await fetch('/api/payments/claim-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId: activeShopId, packageType })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ট্রায়াল সক্রিয় করতে সমস্যা হয়েছে।');
      }
      toast.success(data.message || 'ফ্রি ট্রায়াল সফলভাবে সক্রিয় হয়েছে! 🎉', { id: loadingToast });
      // Refresh shop data
      getShop(activeShopId).then(setShop);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'ত্রুটি ঘটেছে। আবার চেষ্টা করুন।', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCodeInput.trim()) {
      setCouponError('কুপন কোড লিখুন।');
      return;
    }
    const cleanInput = couponCodeInput.trim().toUpperCase();
    const globalCoupon = (globalConfig?.subCouponCode || '').trim().toUpperCase();
    if (globalConfig?.subCouponEnabled && globalCoupon && cleanInput === globalCoupon) {
      setAppliedCouponCode(cleanInput);
      setCouponDiscount(Number(globalConfig.subCouponDiscount) || 0);
      setCouponDiscountType(globalConfig.subCouponDiscountType || 'percent');
      toast.success('কুপন কোডটি সফলভাবে প্রয়োগ করা হয়েছে! 🎉');
    } else {
      setCouponError('ভুল কুপন কোড! দয়া করে সঠিক কোড দিন।');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode('');
    setCouponDiscount(0);
    setCouponCodeInput('');
    setCouponError('');
    toast.success('কুপন কোড সরানো হয়েছে');
  };

  const getFinalAmount = () => {
    const base = priceMap[selectedPackage] || 0;
    if (base === 0) return 0;
    if (!appliedCouponCode) return base;
    if (couponDiscountType === 'flat') {
      return Math.max(0, base - couponDiscount);
    } else {
      const discountAmt = Math.round((base * couponDiscount) / 100);
      return Math.max(0, base - discountAmt);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const loadingToast = toast.loading(
      selectedPackage === 'starter' 
        ? 'স্টার্টার প্ল্যান সক্রিয় করা হচ্ছে...' 
        : 'অনুরোধ সাবমিট করা হচ্ছে...'
    );

    try {
      const payload = {
        shopId: activeShopId,
        packageType: selectedPackage,
        paymentMethod: selectedPackage === 'starter' ? 'free' : paymentMethod,
        couponCode: appliedCouponCode || null
      };

      if (selectedPackage !== 'starter' && paymentMethod === 'manual') {
        if (!senderNumber.trim() || !transactionId.trim()) {
          throw new Error('দয়া করে আপনার বিকাশ/নগদ নম্বর এবং ট্রানজেকশন আইডি প্রদান করুন।');
        }
        const cleanedNumber = senderNumber.trim();
        const numberRegex = /^01\d{9}$/;
        if (!numberRegex.test(cleanedNumber)) {
          throw new Error('আপনার প্রেরক নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে এবং শুধুমাত্র সংখ্যা (যেমন: 01xxxxxxxxx) হতে হবে।');
        }
        payload.senderNumber = cleanedNumber;
        payload.transactionId = transactionId.trim();
      }

      const res = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'অনুরোধটি সম্পন্ন করা সম্ভব হয়নি।');
      }

      if (data.isFree || selectedPackage === 'starter') {
        toast.success(data.message || 'প্ল্যান সফলভাবে সক্রিয় করা হয়েছে! 🎉', { id: loadingToast });
        getShop(activeShopId).then(setShop);
        setAppliedCouponCode('');
        setCouponCodeInput('');
      } else if (paymentMethod === 'automated' && data.payment_url) {
        toast.success('পেমেন্ট গেটওয়েতে রিডাইরেক্ট করা হচ্ছে...', { id: loadingToast });
        window.location.href = data.payment_url;
      } else {
        toast.success(data.message || 'ম্যানুয়াল সাবস্ক্রিপশন অনুরোধ সফলভাবে সাবমিট হয়েছে! 👍', { id: loadingToast });
        // Refresh shop data
        getShop(activeShopId).then(setShop);
        setSenderNumber('');
        setTransactionId('');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'ত্রুটি ঘটেছে। আবার চেষ্টা করুন।', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-in pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-purple-600" size={32} />
          বিলিং ও সাবস্ক্রিপশন (Billing & Subscription)
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          আপনার রিটেইলার স্টোরের বিলিং মেয়াদ দেখুন এবং পছন্দমতো প্যাকেজ অ্যাক্টিভেট করুন।
        </p>
      </div>

      {/* Subscription Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">প্যাকেজ স্ট্যাটাস</p>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-1.5">
              {shop?.subscriptionStatus === 'active' && (
                <><CheckCircle className="text-emerald-500" size={20} /> Active</>
              )}
              {shop?.subscriptionStatus === 'pending' && (
                <><Clock className="text-amber-500" size={20} /> Pending Approval</>
              )}
              {(shop?.subscriptionStatus === 'expired' || !shop?.subscriptionStatus || shop?.subscriptionStatus === 'none') && (
                <><AlertCircle className="text-red-500" size={20} /> No Subscription</>
              )}
            </h3>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মেয়াদ শেষ হওয়ার তারিখ</p>
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mt-1">
              <Calendar size={18} className="text-purple-500 shrink-0" />
              {getExpiryText()}
            </h3>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">চলতি প্যাকেজ</p>
            <h3 className="text-xl font-black text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
              {shop?.subscriptionPackage === 'starter' ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <Sparkles size={18} /> Starter ({starterPercent}% Share)
                </span>
              ) : (
                shop?.subscriptionPackage || 'None'
              )}
            </h3>
          </div>
        </Card>
      </div>

      {shop?.subscriptionStatus === 'pending' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">ম্যানুয়াল পেমেন্ট পেন্ডিং</h4>
            <p className="text-xs text-amber-800 font-bold mt-1">
              আপনার পেমেন্ট ভেরিফিকেশনের অনুরোধটি সাবমিট করা হয়েছে। সুপারঅ্যাডমিন ট্রানজেকশনটি যাচাই করে খুব শীঘ্রই আপনার প্যাকেজটি সক্রিয় করে দেবেন।
            </p>
            {shop?.subscriptionPendingTxn && (
              <p className="text-[10px] font-mono text-amber-600 font-bold mt-1.5 bg-white border border-amber-100 p-2 rounded-lg inline-block">
                {shop.subscriptionPendingTxn}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Free Trial Banner */}
      {!shop?.trialClaimed && globalConfig?.trialsEnabled !== false && (
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-in mb-6 border border-purple-400/30">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1">
              🎁 ১-বার গ্রহণযোগ্য অফার
            </div>
            <h3 className="text-xl md:text-2xl font-black flex items-center gap-2 tracking-tight">
              🌟 আপনার নতুন স্টোরে ১ মাস (৩০ দিন) ফ্রি ট্রায়াল ক্লেইম করুন!
            </h3>
            <p className="text-xs text-purple-100 font-medium">
              কোনো পেমেন্ট ছাড়াই আজই ৩০ দিনের ফ্রি ট্রায়াল সক্রিয় করুন এবং স্টোর সেটিংস ও সব প্রিমিয়াম ফিচার আনলক করুন।
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleClaimTrial('monthly')}
              disabled={submitting}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              🎁 ১ মাসের ফ্রি ট্রায়াল ক্লেইম করুন ({globalConfig?.subTrialMonthly || 30} Days Free)
            </button>
          </div>
        </div>
      )}

      {/* Subscription Selection Form */}
      {(!isSubsEnabled) ? (
        <div className="p-6 bg-slate-100 border border-slate-200 rounded-3xl text-center space-y-2">
          <AlertCircle className="mx-auto text-slate-400" size={32} />
          <h3 className="text-base font-black text-slate-700">সাবস্ক্রিপশন মোড বন্ধ আছে</h3>
          <p className="text-xs text-slate-500 font-bold">সুপারঅ্যাডমিন কর্তৃক বর্তমানে সাবস্ক্রিপশন বিলিং সিস্টেমটি নিষ্ক্রিয় করা আছে।</p>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">১. প্যাকেজ নির্বাচন করুন (Select Plan)</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  আপনার ব্যবসার ধরণ ও সুবিধাজনক মডেল অনুযায়ী যেকোনো একটি প্ল্যান বেছে নিন।
                </p>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-3 py-1 rounded-full w-max">
                ✨ যেকোনো সময় প্যাকেজ পরিবর্তনযোগ্য
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
              
              {/* 1st Column: Starter / Revenue Share Plan */}
              <div 
                onClick={() => setSelectedPackage('starter')}
                className={`relative p-5 md:p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between overflow-hidden group ${
                  selectedPackage === 'starter' 
                    ? 'border-amber-500 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/20' 
                    : 'border-amber-200/90 hover:border-amber-400/80 bg-gradient-to-b from-amber-50/20 to-white'
                }`}
              >
                {/* Floating Tag */}
                <div className="absolute top-0 right-0">
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-2xl shadow-sm">
                    <Sparkles size={11} /> নতুনদের জন্য স্পেশাল
                  </span>
                </div>

                <div className="space-y-3.5 pt-1">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">স্টার্টার প্যাকেজ</p>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">Starter Plan</h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">০৳ মাসিক ফি • রেভিনিউ শেয়ার</p>
                  </div>

                  {/* Pricing display */}
                  <div className="p-3 bg-white/90 border border-amber-200/80 rounded-2xl shadow-xs space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-amber-600">৳০</span>
                      <span className="text-xs text-slate-400 font-bold">/ মাসিক ফি নেই</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 text-[11px] font-black">
                      ⚡ শুধুমাত্র {starterPercent}% বিক্রয় শেয়ার
                    </div>
                  </div>

                  {/* Persuasive copy */}
                  <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100/90 text-[11px] text-amber-950 font-medium leading-relaxed space-y-1">
                    <p className="font-black text-amber-900">
                      💡 আপনি কি ব্যবসায় একদম নতুন? মাসিক সাবস্ক্রিপশন কিনতে ভয় পাচ্ছেন?
                    </p>
                    <p className="text-slate-600 font-semibold text-[10.5px]">
                      তাহলে আপনার জন্যই এই স্পেশাল সুযোগ! কোনো অগ্রিম বা ফিক্সড ফি ছাড়াই নিজের অনলাইন ব্যবসা শুরু করুন। শুধুমাত্র পণ্য বিক্রি হলেই সামান্য {starterPercent}% শেয়ার প্রযোজ্য হবে। পরবর্তীতে যখন ইচ্ছা রেগুলার সাবস্ক্রিপশনে আসতে পারবেন।
                    </p>
                  </div>

                  {/* Features list */}
                  <div className="space-y-1.5 pt-1 border-t border-amber-100 text-[11px] font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-amber-500 shrink-0" />
                      <span>০৳ অগ্রিম খরচ (Zero Risk)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-amber-500 shrink-0" />
                      <span>সম্পূর্ণ ওয়েবসাইট ও ড্যাশবোর্ড</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-amber-500 shrink-0" />
                      <span>নো সেল = নো ফি (১০০% নিরাপদ)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-amber-500 shrink-0" />
                      <span>যেকোনো সময় আপগ্রেডের সুযোগ</span>
                    </div>
                  </div>
                </div>

                {/* Selection Footer */}
                <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between">
                  <span className={`text-xs font-black ${selectedPackage === 'starter' ? 'text-amber-700' : 'text-slate-400'}`}>
                    {selectedPackage === 'starter' ? '✓ নির্বাচিত' : 'ক্লিক করে নির্বাচন করুন'}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPackage === 'starter' ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {selectedPackage === 'starter' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              </div>

              {/* 2nd Column: Monthly Package */}
              <div 
                onClick={() => setSelectedPackage('monthly')}
                className={`relative p-5 md:p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between group ${
                  selectedPackage === 'monthly' 
                    ? 'border-purple-600 bg-purple-50/30 shadow-xl shadow-purple-500/10 ring-2 ring-purple-400/20' 
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="space-y-3.5 pt-1">
                  <div>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">রেগুলার প্ল্যান</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">Monthly Plan</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">১ মাসের স্টোর লাইসেন্স</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-purple-700">৳{priceMap.monthly}</span>
                      <span className="text-xs text-slate-400 font-bold">/ প্রতি মাস</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-black">
                      🛡️ ০% সেলস কমিশন (১০০% প্রফিট)
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    প্রতি মাসে সহজে নবায়নযোগ্য স্ট্যান্ডার্ড প্যাকেজ। আপনার বিক্রির সম্পূর্ণ লাভ ১০০% আপনার থাকবে।
                  </p>

                  <div className="space-y-1.5 pt-1 border-t border-slate-100 text-[11px] font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-purple-500 shrink-0" />
                      <span>১০০% বিক্রয় লাভ আপনার</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-purple-500 shrink-0" />
                      <span>কোনো অর্ডার কমিশন নেই</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-purple-500 shrink-0" />
                      <span>আনলিমিটেড প্রোডাক্ট ও অর্ডার</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-purple-500 shrink-0" />
                      <span>৩০ দিন নিশ্চিত লাইসেন্স</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-xs font-black ${selectedPackage === 'monthly' ? 'text-purple-700' : 'text-slate-400'}`}>
                    {selectedPackage === 'monthly' ? '✓ নির্বাচিত' : 'ক্লিক করে নির্বাচন করুন'}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPackage === 'monthly' ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {selectedPackage === 'monthly' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              </div>

              {/* 3rd Column: Quarterly Package */}
              <div 
                onClick={() => setSelectedPackage('quarterly')}
                className={`relative p-5 md:p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between overflow-hidden group ${
                  selectedPackage === 'quarterly' 
                    ? 'border-purple-600 bg-purple-50/30 shadow-xl shadow-purple-500/10 ring-2 ring-purple-400/20' 
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="absolute top-0 right-0">
                  <span className="inline-flex items-center gap-1 bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-2xl">
                    🔥 জনপ্রিয়
                  </span>
                </div>

                <div className="space-y-3.5 pt-1">
                  <div>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">ত্রৈমাসিক প্ল্যান</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">Quarterly Plan</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">৩ মাসের স্টোর লাইসেন্স</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-purple-700">৳{priceMap.quarterly}</span>
                      <span className="text-xs text-slate-400 font-bold">/ প্রতি ৩ মাস</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-black">
                      🛡️ ০% সেলস কমিশন (১০০% প্রফিট)
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    ৩ মাসের নিশ্চিন্ত ব্যবসা এবং প্রতি মাসে রিনিউ করার ঝামেলা থেকে সম্পূর্ণ মুক্তি।
                  </p>

                  <div className="space-y-1.5 pt-1 border-t border-slate-100 text-[11px] font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-purple-500 shrink-0" />
                      <span>১০০% বিক্রয় লাভ আপনার</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-purple-500 shrink-0" />
                      <span>৯০ দিন নিরবচ্ছিন্ন সার্ভিস</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-purple-500 shrink-0" />
                      <span>মাসিক থেকে বেশি সাশ্রয়ী</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-purple-500 shrink-0" />
                      <span>প্রাইওরিটি কাস্টমার সাপোর্ট</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-xs font-black ${selectedPackage === 'quarterly' ? 'text-purple-700' : 'text-slate-400'}`}>
                    {selectedPackage === 'quarterly' ? '✓ নির্বাচিত' : 'ক্লিক করে নির্বাচন করুন'}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPackage === 'quarterly' ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {selectedPackage === 'quarterly' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              </div>

              {/* 4th Column: Yearly Package */}
              <div 
                onClick={() => setSelectedPackage('yearly')}
                className={`relative p-5 md:p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between overflow-hidden group ${
                  selectedPackage === 'yearly' 
                    ? 'border-emerald-600 bg-emerald-50/30 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-400/20' 
                    : 'border-slate-200 hover:border-emerald-300 bg-white'
                }`}
              >
                <div className="absolute top-0 right-0">
                  <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-2xl">
                    👑 সেরা অফার
                  </span>
                </div>

                <div className="space-y-3.5 pt-1">
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">বাৎসরিক প্যাকেজ</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">Yearly Plan</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">১২ মাসের স্টোর লাইসেন্স</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-emerald-700">৳{priceMap.yearly}</span>
                      <span className="text-xs text-slate-400 font-bold">/ প্রতি বছর</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black">
                      🛡️ সর্বোচ্চ সাশ্রয়ী বাৎসরিক রেট
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    দীর্ঘমেয়াদী ও সিরিয়াস উদ্যোক্তাদের জন্য সবচেয়ে বেশি সাশ্রয়ী ও প্রিমিয়াম অফার।
                  </p>

                  <div className="space-y-1.5 pt-1 border-t border-slate-100 text-[11px] font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <span>১০০% বিক্রয় লাভ আপনার</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <span>৩৬৫ দিন ফুল প্রিমিয়াম অ্যাক্সেস</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <span>সর্বোচ্চ সাশ্রয়ী প্যাকেজ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <span>ভিআইপি প্রায়োরিটি সাপোর্ট</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-xs font-black ${selectedPackage === 'yearly' ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {selectedPackage === 'yearly' ? '✓ নির্বাচিত' : 'ক্লিক করে নির্বাচন করুন'}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPackage === 'yearly' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {selectedPackage === 'yearly' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* If Starter Plan Selected: Direct 0 Tk Instant Activation Card */}
          {selectedPackage === 'starter' ? (
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-emerald-500/10 border-2 border-amber-300 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm animate-slide-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-lg shadow-amber-500/20">
                    🚀
                  </div>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                      জিরো ফিক্সড ফি মডেল
                    </div>
                    <h3 className="text-xl font-black text-slate-900">০৳ ফিক্সড খরচে স্টার্টার প্ল্যান সক্রিয়করণ</h3>
                    <p className="text-xs text-slate-600 font-bold">
                      স্টার্টার প্ল্যানে ব্যবসা শুরু করার জন্য কোনো অগ্রিম সাবস্ক্রিপশন ফি বা পেমেন্ট প্রয়োজন নেই।
                    </p>
                  </div>
                </div>
                <div className="text-right sm:border-l sm:border-amber-200/80 sm:pl-6">
                  <p className="text-3xl font-black text-amber-600">৳০</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">আজকের পরিশোধযোগ্য ফি</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/90 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">১. জিরো ইনভেস্টমেন্ট</p>
                  <p className="text-xs font-bold text-slate-700">০৳ অগ্রিম খরচে আজই আপনার ওয়েবসাইট ও ড্যাশবোর্ড চালু করুন।</p>
                </div>
                <div className="p-4 bg-white/90 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">২. ন্যায্য রেভিনিউ শেয়ার</p>
                  <p className="text-xs font-bold text-slate-700">শুধুমাত্র সফল অর্ডারে {starterPercent}% শেয়ার প্রযোজ্য, কোনো সেল না হলে ০ টাকা।</p>
                </div>
                <div className="p-4 bg-white/90 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">৩. আপগ্রেডের পূর্ণ স্বাধীনতা</p>
                  <p className="text-xs font-bold text-slate-700">ব্যবসা বড় হলে পরবর্তীতে যেকোনো সময় ফিক্সড সাবস্ক্রিপশনে যেতে পারবেন।</p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                {submitting ? (
                  <><RefreshCw className="animate-spin" size={16} /> স্টার্টার প্ল্যান সক্রিয় করা হচ্ছে...</>
                ) : (
                  <>🚀 বিনামূল্যে স্টোর চালু করুন (Activate Starter Plan)</>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Subscription Coupon Input */}
              {globalConfig?.subCouponEnabled && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
                  <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">১.৫ সাবস্ক্রিপশন কুপন কোড (Apply Coupon)</h2>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">কুপন কোড (Promo Code)</label>
                      <input
                        type="text"
                        placeholder="যেমন: WELCOME50"
                        value={couponCodeInput}
                        onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                        disabled={!!appliedCouponCode}
                        className="w-full mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all disabled:bg-slate-100 disabled:text-slate-500 h-[52px]"
                      />
                    </div>
                    {appliedCouponCode ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="px-6 py-3.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-black transition-all h-[52px] cursor-pointer"
                      >
                        কুপন সরান
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-6 py-3.5 bg-purple-600 text-white hover:bg-purple-700 rounded-xl text-xs font-black transition-all h-[52px] cursor-pointer"
                      >
                        কুপন প্রয়োগ
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-xs text-red-500 font-bold mt-1">{couponError}</p>}
                  {appliedCouponCode && (
                    <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1.5">
                      <span>✅ কুপন <strong>{appliedCouponCode}</strong> সক্রিয়!</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                        {couponDiscountType === 'flat' ? `৳${couponDiscount} Flat OFF` : `${couponDiscount}% OFF`}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Payment Option */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">২. পেমেন্ট পদ্ধতি নির্বাচন করুন (Select Payment)</h2>
                
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('automated')}
                    className={`flex-1 py-4 border-2 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'automated'
                        ? 'border-purple-600 bg-purple-50/20 text-purple-700 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <CreditCard size={18} />
                    অটোমেটিক বিকাশ / নগদ / রকেট
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('manual')}
                    className={`flex-1 py-4 border-2 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'manual'
                        ? 'border-purple-600 bg-purple-50/20 text-purple-700 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <Send size={18} />
                    ম্যানুয়াল পেমেন্ট ভেরিফাই
                  </button>
                </div>

                {paymentMethod === 'automated' ? (
                  <div className="p-4 bg-purple-50/30 border border-purple-100 rounded-2xl text-xs font-bold text-purple-800 space-y-1">
                    <p>💡 অটো পেমেন্ট সফল হওয়ার সাথে সাথে আপনার লাইসেন্স স্বয়ংক্রিয়ভাবে নবায়ন হয়ে যাবে।</p>
                    <p>💡 পেমেন্ট করতে আপনাকে বিকাশ/নগদ-এর সুরক্ষিত অফিশিয়াল গেটওয়ে পেজে রিডাইরেক্ট করা হবে।</p>
                  </div>
                ) : (
                  <div className="space-y-5 border border-slate-200 p-6 rounded-3xl bg-slate-50/50">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">নিচের যেকোনো একটি নম্বরে টাকা সেন্ড মানি করুন:</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {globalConfig?.bkashNumber && (
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center space-y-1.5 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">বিকাশ (Send Money)</p>
                          <p className="text-sm font-black text-purple-700 font-mono">{globalConfig.bkashNumber}</p>
                        </div>
                      )}
                      {globalConfig?.nagadNumber && (
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center space-y-1.5 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">নগদ (Send Money)</p>
                          <p className="text-sm font-black text-orange-600 font-mono">{globalConfig.nagadNumber}</p>
                        </div>
                      )}
                      {globalConfig?.rocketNumber && (
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center space-y-1.5 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">রকেট (Send Money)</p>
                          <p className="text-sm font-black text-blue-700 font-mono">{globalConfig.rocketNumber}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">আপনার প্রেরক নম্বর *</label>
                        <Input
                          type="text"
                          placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন..."
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          className="bg-white border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Transaction ID (TxnID) *</label>
                        <Input
                          type="text"
                          placeholder="পেমেন্ট স্লিপের ট্রানজেকশন আইডি..."
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-500/10 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <><RefreshCw className="animate-spin" size={16} /> অনুরোধ প্রসেস হচ্ছে...</>
                  ) : (
                    <>নিশ্চিত করুন ({getFinalAmount() === 0 ? 'Activate for Free' : `Pay ৳${getFinalAmount()}`})</>
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
    <p className="text-sm font-black text-purple-700 font-mono">{globalConfig.bkashNumber}</p>
                    </div>
                  )}
                  {globalConfig?.nagadNumber && (
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center space-y-1.5 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">নগদ (Send Money)</p>
                      <p className="text-sm font-black text-orange-600 font-mono">{globalConfig.nagadNumber}</p>
                    </div>
                  )}
                  {globalConfig?.rocketNumber && (
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center space-y-1.5 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">রকেট (Send Money)</p>
                      <p className="text-sm font-black text-blue-700 font-mono">{globalConfig.rocketNumber}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">আপনার প্রেরক নম্বর *</label>
                    <Input
                      type="text"
                      placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন..."
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className="bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Transaction ID (TxnID) *</label>
                    <Input
                      type="text"
                      placeholder="পেমেন্ট স্লিপের ট্রানজেকশন আইডি..."
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-500/10 transition-all cursor-pointer"
            >
              {submitting ? (
                <><RefreshCw className="animate-spin" size={16} /> অনুরোধ প্রসেস হচ্ছে...</>
              ) : (
                <>নিশ্চিত করুন ({getFinalAmount() === 0 ? 'Activate for Free' : `Pay ৳${getFinalAmount()}`})</>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
