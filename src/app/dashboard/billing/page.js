'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getShop, subscribeGlobalConfig } from '@/lib/firestore';
import { Card, Button, Input } from '@/components/ui';
import { ShieldCheck, Calendar, AlertCircle, CreditCard, Send, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const { activeShopId } = useAuth();
  const [shop, setShop] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedPackage, setSelectedPackage] = useState('monthly');
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

  // Price configurations
  const priceMap = {
    monthly: Number(globalConfig?.subPriceMonthly) || 500,
    quarterly: Number(globalConfig?.subPriceQuarterly) || 1350,
    yearly: Number(globalConfig?.subPriceYearly) || 5000
  };

  const isSubsEnabled = globalConfig?.subscriptionsEnabled ?? false;

  // Format subscription expiry date
  const getExpiryText = () => {
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
    const loadingToast = toast.loading('অনুরোধ সাবমিট করা হচ্ছে...');

    try {
      const payload = {
        shopId: activeShopId,
        packageType: selectedPackage,
        paymentMethod,
        couponCode: appliedCouponCode || null
      };

      if (paymentMethod === 'manual') {
        if (!senderNumber.trim() || !transactionId.trim()) {
          throw new Error('দয়া করে আপনার বিকাশ/নগদ নম্বর এবং ট্রানজেকশন আইডি প্রদান করুন।');
        }
        payload.senderNumber = senderNumber;
        payload.transactionId = transactionId;
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

      if (data.isFree) {
        toast.success(data.message || 'সাবস্ক্রিপশন সফলভাবে সক্রিয় করা হয়েছে! 🎉', { id: loadingToast });
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
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-in pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-purple-600" size={32} />
          বিলিং ও সাবস্ক্রিপশন (Billing & Subscription)
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          আপনার রিটেইলার স্টোরের বিলিং মেয়াদ দেখুন এবং নতুন প্যাকেজ অ্যাক্টিভেট করুন।
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
            <h3 className="text-xl font-black text-purple-700 uppercase tracking-wide">
              {shop?.subscriptionPackage || 'None'}
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
      {!shop?.trialClaimed && globalConfig?.trialsEnabled && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-in mb-6">
          <div>
            <h3 className="text-xl font-black flex items-center gap-2">
              🌟 আপনার প্রথম স্টোর? ফ্রি ট্রায়াল শুরু করুন!
            </h3>
            <p className="text-xs text-purple-100 font-medium mt-1">
              পেমেন্ট ছাড়াই আজই ফ্রি ট্রায়াল সক্রিয় করুন এবং প্রজেক্টের সব প্রিমিয়াম ফিচার ব্যবহার করুন।
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleClaimTrial('monthly')}
              disabled={submitting}
              className="px-4 py-2.5 bg-white text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-black transition-colors cursor-pointer"
            >
              Start {globalConfig.subTrialMonthly || 7} Days Trial (Monthly)
            </button>
            <button
              type="button"
              onClick={() => handleClaimTrial('quarterly')}
              disabled={submitting}
              className="px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-xs font-black border border-purple-400 transition-colors cursor-pointer"
            >
              Start {globalConfig.subTrialQuarterly || 14} Days Trial (Quarterly)
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
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">১. প্যাকেজ নির্বাচন করুন (Select Plan)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Monthly Package */}
              <div 
                onClick={() => setSelectedPackage('monthly')}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between h-48 ${
                  selectedPackage === 'monthly' 
                    ? 'border-purple-600 bg-purple-50/30 shadow-md shadow-purple-500/5' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <h3 className="text-base font-black text-slate-900">Monthly Plan</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">১ মাসের স্টোর লাইসেন্স</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-purple-700">৳{priceMap.monthly}</p>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">প্রতি মাস</p>
                </div>
              </div>

              {/* Quarterly Package */}
              <div 
                onClick={() => setSelectedPackage('quarterly')}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between h-48 ${
                  selectedPackage === 'quarterly' 
                    ? 'border-purple-600 bg-purple-50/30 shadow-md shadow-purple-500/5' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-black text-slate-900">Quarterly Plan</h3>
                    <span className="text-[9px] font-black uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">জনপ্রিয়</span>
                  </div>
                  <p className="text-xs text-slate-400 font-bold mt-1">৩ মাসের স্টোর লাইসেন্স</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-purple-700">৳{priceMap.quarterly}</p>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">প্রতি ৩ মাস</p>
                </div>
              </div>

              {/* Yearly Package */}
              <div 
                onClick={() => setSelectedPackage('yearly')}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between h-48 ${
                  selectedPackage === 'yearly' 
                    ? 'border-purple-600 bg-purple-50/30 shadow-md shadow-purple-500/5' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-black text-slate-900">Yearly Plan</h3>
                    <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">সেরা অফার</span>
                  </div>
                  <p className="text-xs text-slate-400 font-bold mt-1">১২ মাসের স্টোর লাইসেন্স</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-purple-700">৳{priceMap.yearly}</p>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">প্রতি বছর</p>
                </div>
              </div>
            </div>
          </div>

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
                      onChange={(e) => setSenderNumber(e.target.value)}
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
