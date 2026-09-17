'use client';

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebase';
import { collectionGroup, query, where, getDocs, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { getShop } from '@/lib/firestore';
import { 
  ShoppingBag, CheckCircle2, ShieldCheck, Truck, Clock, Phone, 
  Sparkles, Star, AlertCircle, ArrowDown, ChevronRight, Check, Package 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicLandingPage({ params }) {
  // Unwrap params using React use()
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [loading, setLoading] = useState(true);
  const [landingPage, setLandingPage] = useState(null);
  const [shop, setShop] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryArea, setDeliveryArea] = useState('inside'); // 'inside' | 'outside'

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState(20 * 60);

  useEffect(() => {
    async function fetchLandingPage() {
      try {
        const q = query(
          collectionGroup(db, 'landingPages'),
          where('slug', '==', slug),
          limit(1)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const lpDoc = snap.docs[0];
          const lpData = { id: lpDoc.id, ...lpDoc.data(), _ref: lpDoc.ref };
          setLandingPage(lpData);

          if (lpData.countdownMinutes) {
            setTimeLeft(lpData.countdownMinutes * 60);
          }

          // Fetch Shop details
          if (lpData.shopId) {
            const sData = await getShop(lpData.shopId);
            setShop(sData);
          }

          // Track view count safely
          try {
            await updateDoc(lpDoc.ref, { views: increment(1) });
          } catch (vErr) {
            // view increment is non-fatal
          }
        } else {
          setLandingPage(null);
        }
      } catch (err) {
        console.error('Failed to load landing page:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLandingPage();
  }, [slug]);

  // Countdown ticker
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const scrollToCheckout = () => {
    document.getElementById('checkout-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">অফারটি খুঁজে পাওয়া যায়নি</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            এই ল্যান্ডিং পেজের মেয়াদ শেষ হয়ে থাকতে পারে অথবা লিংকটি পরিবর্তিত হয়েছে।
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition-all"
          >
            হোম পেজে ফিরে যান
          </a>
        </div>
      </div>
    );
  }

  // Price calculations
  const unitPrice = parseFloat(landingPage.offerPrice) || 0;
  const regularPrice = parseFloat(landingPage.regularPrice) || unitPrice;
  const subtotal = unitPrice * quantity;
  const deliveryFee = deliveryArea === 'inside'
    ? (parseFloat(landingPage.deliveryFeeInside) || (shop?.deliveryFeeDhaka ?? 60))
    : (parseFloat(landingPage.deliveryFeeOutside) || (shop?.deliveryFeeOutside ?? 120));
  const totalAmount = subtotal + deliveryFee;

  const handleOrderSubmit = async (e) => {
    e.preventDefault();

    const cleanPhone = phone.trim().replace(/^(\+88)/, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      toast.error('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }
    if (address.trim().length < 5) {
      toast.error('অনুগ্রহ করে আপনার সম্পূর্ণ ডেলিভারি ঠিকানা দিন');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        shopId: landingPage.shopId,
        customerName: name.trim(),
        customerPhone: cleanPhone,
        customerEmail: '',
        customerAddress: address.trim(),
        customerNote: customerNote.trim(),
        paymentMethod: 'cod',
        items: [
          {
            id: landingPage.productId,
            quantity: quantity,
            variantsText: `${quantity} পিস প্যাকেজ`,
            clientPrice: unitPrice,
            note: 'Order via Landing Page'
          }
        ],
        customerId: 'lp-guest-' + Date.now(),
        orderSource: 'landing_page',
        landingPageId: landingPage.id,
        landingPageTitle: landingPage.title,
        landingPageSlug: landingPage.slug
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'অর্ডার সম্পন্ন করা সম্ভব হয়নি');
      }

      setOrderSuccess({
        orderId: data.orderIdVisual || data.orderId || 'CONFIRMED',
        total: totalAmount,
        customerName: name.trim(),
        customerPhone: cleanPhone
      });

      // Facebook Pixel conversion tracking if available
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
          value: totalAmount,
          currency: 'BDT',
          content_name: landingPage.title,
          content_type: 'product'
        });
      }

      toast.success('আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে! 🎉');
    } catch (err) {
      console.error('Landing page checkout error:', err);
      toast.error(err.message || 'অর্ডারে ত্রুটি হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success View ──
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-center space-y-5 animate-scale-up">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200">
              অর্ডার সফল হয়েছে ✓
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
              ধন্যবাদ, {orderSuccess.customerName}!
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              আপনার অর্ডারটি আমাদের সিস্টেমে সফলভাবে জমা হয়েছে।
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-slate-500">অর্ডার ট্র্যাকিং আইডি:</span>
              <span className="font-mono font-black text-purple-600 dark:text-purple-400">#{orderSuccess.orderId}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-slate-500">মোবাইল নম্বর:</span>
              <span className="text-slate-800 dark:text-slate-200">{orderSuccess.customerPhone}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-slate-500">সর্বমোট প্রদেয়:</span>
              <span className="text-emerald-600 font-black text-sm">৳{orderSuccess.total} (ক্যাশ অন ডেলিভারি)</span>
            </div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200/80 text-[11px] text-purple-900 dark:text-purple-300 font-medium">
            📞 আমাদের কাস্টমার কেয়ার প্রতিনিধি শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করে অর্ডার কনফার্ম করবেন।
          </div>

          <a
            href={shop?.slug ? `/shop/${shop.slug}` : '/'}
            className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            আরো কেনাকাটা করুন →
          </a>
        </div>
      </div>
    );
  }

  // ── Main High-Converting Funnel View ──
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 pb-20">
      {/* Urgency Notification Bar */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 via-purple-700 to-red-600 text-white px-3 py-2 text-center text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2">
        <span className="animate-pulse">🔥</span>
        <span>সীমিত সময়ের স্পেশাল অফার! বাকি আছে:</span>
        <span className="bg-black/40 px-2 py-0.5 rounded-md font-mono text-amber-300 tracking-wider">
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Brand Header */}
      <header className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {shop?.logoUrl ? (
            <img src={shop.logoUrl} alt="" className="h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center">
              {shop?.shopName?.[0] || 'S'}
            </div>
          )}
          <div>
            <h2 className="text-sm font-black tracking-tight">{shop?.shopName || 'BD Retailers Store'}</h2>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <ShieldCheck size={12} /> ভেরিফাইড মার্চেন্ট
            </p>
          </div>
        </div>

        <button
          onClick={scrollToCheckout}
          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
        >
          <span>অর্ডার করুন</span>
          <ArrowDown size={13} />
        </button>
      </header>

      {/* Hero Sales Funnel Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Main Headline */}
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-xs rounded-full border border-purple-200 dark:border-purple-800">
            ✨ আজকের স্পেশাল ডিল
          </span>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            {landingPage.headline || landingPage.title}
          </h1>
          {landingPage.subheadline && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium max-w-xl mx-auto">
              {landingPage.subheadline}
            </p>
          )}
        </div>

        {/* Product Image & Offer Price Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
          {landingPage.productImage && (
            <div className="relative aspect-square sm:aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <img
                src={landingPage.productImage}
                alt={landingPage.title}
                className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg animate-pulse">
                সীমিত স্টক!
              </div>
            </div>
          )}

          <div className="p-5 sm:p-6 bg-gradient-to-b from-white to-purple-50/40 dark:from-slate-900 dark:to-purple-950/20 space-y-4">
            {/* Price Box */}
            <div className="flex items-center justify-between flex-wrap gap-2 p-4 rounded-2xl bg-purple-100/60 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">অফার মূল্য:</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300">
                    ৳{unitPrice}
                  </span>
                  {regularPrice > unitPrice && (
                    <span className="text-sm font-bold text-slate-400 line-through">
                      ৳{regularPrice}
                    </span>
                  )}
                </div>
              </div>

              {regularPrice > unitPrice && (
                <div className="bg-red-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
                  ৳{(regularPrice - unitPrice).toFixed(0)} ছাড়!
                </div>
              )}
            </div>

            {/* Quick CTA */}
            <button
              onClick={scrollToCheckout}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <ShoppingBag size={18} />
              <span>ক্যাশ অন ডেলিভারিতে অর্ডার করতে ক্লিক করুন</span>
              <ArrowDown size={16} />
            </button>
          </div>
        </div>

        {/* Feature Bullets */}
        {landingPage.features?.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              <span>এই পণ্যের বিশেষ বৈশিষ্ট্যসমূহ:</span>
            </h3>
            <div className="space-y-2.5">
              {landingPage.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust Badges Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <Truck size={20} className="text-purple-600 mx-auto mb-1" />
            <p className="text-[11px] font-black text-slate-900 dark:text-white">সারা দেশে ডেলিভারি</p>
            <p className="text-[9px] text-slate-500">৩-৫ কর্মদিবসে</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <ShieldCheck size={20} className="text-emerald-500 mx-auto mb-1" />
            <p className="text-[11px] font-black text-slate-900 dark:text-white">ক্যাশ অন ডেলিভারি</p>
            <p className="text-[9px] text-slate-500">পণ্য দেখে পেমেন্ট</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <Check size={20} className="text-blue-500 mx-auto mb-1" />
            <p className="text-[11px] font-black text-slate-900 dark:text-white">সহজ রিটার্ন</p>
            <p className="text-[9px] text-slate-500">১০০% মান নিশ্চয়তা</p>
          </div>
        </div>

        {/* ── EMBEDDED 1-CLICK CHECKOUT FORM ── */}
        <section id="checkout-form-section" className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-purple-500 p-5 sm:p-8 shadow-2xl space-y-5">
          <div className="text-center space-y-1 border-b border-slate-200 dark:border-slate-800 pb-4">
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-black uppercase tracking-wider">
              অর্ডার ফর্ম
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              অর্ডার কনফার্ম করতে নিচের ফর্মটি পূরণ করুন
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              কোনো অগ্রিম পেমেন্ট ছাড়া পণ্য হাতে পেয়ে সম্পূর্ণ মূল্য পরিশোধ করুন।
            </p>
          </div>

          <form onSubmit={handleOrderSubmit} className="space-y-4">
            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                পরিমাণ (Quantity) নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setQuantity(qty)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      quantity === qty
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {qty} টি {qty === 2 ? '(জনপ্রিয়)' : qty === 3 ? '(বেস্ট ভ্যালু)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                আপনার নাম *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="যেমন: মোঃ আব্দুল্লাহ"
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                মোবাইল নম্বর (১১ ডিজিট) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা/উপজেলা/জেলা) *
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="যেমন: বাড়ি #১২, রোড #৪, ধানমন্ডি, ঢাকা"
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Delivery Area Selection */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                ডেলিভারি এলাকা নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    deliveryArea === 'inside'
                      ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryArea"
                      checked={deliveryArea === 'inside'}
                      onChange={() => setDeliveryArea('inside')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-black">ঢাকার ভেতরে</span>
                  </div>
                  <span className="text-xs font-black text-purple-600">
                    ৳{landingPage.deliveryFeeInside || 60}
                  </span>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    deliveryArea === 'outside'
                      ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryArea"
                      checked={deliveryArea === 'outside'}
                      onChange={() => setDeliveryArea('outside')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-black">ঢাকার বাইরে</span>
                  </div>
                  <span className="text-xs font-black text-purple-600">
                    ৳{landingPage.deliveryFeeOutside || 120}
                  </span>
                </label>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                বিশেষ কোনো নোট (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={customerNote}
                onChange={e => setCustomerNote(e.target.value)}
                placeholder="যেমন: বিকেলে ডেলিভারি দিলে ভালো হয়"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            {/* Order Cost Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-bold">
                <span>পণ্য মূল্য ({quantity} টি):</span>
                <span>৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-bold">
                <span>ডেলিভারি চার্জ:</span>
                <span>৳{deliveryFee}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                <span>সর্বমোট প্রদেয় মূল্য:</span>
                <span className="text-purple-600 dark:text-purple-400 text-base">৳{totalAmount}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>অর্ডার প্রসেস হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>অর্ডার কনফার্ম করুন (৳{totalAmount})</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-500 font-bold">
              🔒 সম্পূর্ণ ক্যাশ অন ডেলিভারি — পণ্য দেখে মূল্য পরিশোধ করুন।
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
