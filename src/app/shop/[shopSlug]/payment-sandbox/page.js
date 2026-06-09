'use client';

import { Suspense } from 'react';
import { use, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, XCircle, CheckCircle2, ArrowLeft, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Inner component that uses useSearchParams ──────────────────────────────
function PaymentSandboxContent({ shopSlug }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('orderId');
  const shopId = searchParams.get('shopId');
  const amountParam = searchParams.get('amount');

  const [order, setOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [gateway, setGateway] = useState('bkash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shopSlug || !orderId) {
      setError('অর্ডার বা শপ আইডি পাওয়া যায়নি।');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/order?shopSlug=${encodeURIComponent(shopSlug)}&orderId=${encodeURIComponent(orderId)}`);
        if (!res.ok) throw new Error('অর্ডারের তথ্য লোড করতে ব্যর্থ হয়েছে।');
        const data = await res.json();
        setOrder(data.order);
        setShop(data.shop);
      } catch (err) {
        console.error(err);
        setError('অর্ডারের বিবরণ লোড করা যায়নি।');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopSlug, orderId]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (phoneNumber.length !== 11 || !phoneNumber.startsWith('01')) {
      toast.error('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }

    setProcessing(true);
    const toastId = toast.loading('পেমেন্ট প্রসেস করা হচ্ছে...');

    try {
      const res = await fetch('/api/payment/sandbox-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          shopId: shopId || shop?.id,
          amount: amountParam || order?.total || 0,
          senderNumber: phoneNumber,
          gateway
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে।');

      toast.success('পেমেন্ট সফলভাবে সম্পন্ন হয়েছে! 🥳', { id: toastId });
      router.push(`/shop/${shopSlug}/payment-callback?orderId=${orderId}&shopId=${shopId || shop?.id}&status=success&txnId=${data.txnId}`);

    } catch (err) {
      console.error(err);
      toast.error(err.message || 'পেমেন্ট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', { id: toastId });
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    toast.error('পেমেন্ট বাতিল করা হয়েছে।');
    router.push(`/shop/${shopSlug}/payment-callback?orderId=${orderId}&shopId=${shopId || shop?.id}&status=cancelled`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-purple-600 mb-2" size={32} />
        <p className="text-sm font-bold text-slate-500">পেমেন্ট গেটওয়ে লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error || !order || !shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl border border-red-200 p-8 max-w-sm w-full text-center shadow-md space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle size={28} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">ত্রুটি দেখা দিয়েছে</h2>
            <p className="text-sm text-slate-500 font-bold mt-2">{error || 'অর্ডারের বিবরণ পাওয়া যায়নি।'}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const amount = amountParam || order.total || 0;
  const orderNum = order.orderIdVisual || order.id?.slice(-6).toUpperCase();

  const colors = {
    bkash:  { bg: 'bg-[#e2136e]',  hover: 'hover:bg-[#be0f5b]', border: 'border-[#e2136e]', text: 'text-[#e2136e]',  light: 'bg-[#e2136e]/10'  },
    nagad:  { bg: 'bg-[#f7941d]',  hover: 'hover:bg-[#d57a12]', border: 'border-[#f7941d]', text: 'text-[#f7941d]',  light: 'bg-[#f7941d]/10'  },
    rocket: { bg: 'bg-[#8c3c95]',  hover: 'hover:bg-[#722e7a]', border: 'border-[#8c3c95]', text: 'text-[#8c3c95]',  light: 'bg-[#8c3c95]/10'  }
  };

  const activeColor = colors[gateway];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Warning banner */}
      <div className="bg-amber-500 text-white py-2.5 px-4 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm">
        <ShieldCheck size={16} />
        স্যান্ডবক্স টেস্ট মোড — কোনো প্রকৃত লেনদেন হবে না
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-xl flex flex-col">
          {/* Merchant Header */}
          <div className="bg-slate-900 text-white p-6 text-center space-y-2 relative">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-1 backdrop-blur-sm">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.shopName} className="w-10 h-10 object-contain rounded-xl" />
              ) : (
                <span className="text-xl font-black text-white">{shop.shopName?.charAt(0)}</span>
              )}
            </div>
            <h1 className="text-lg font-black">{shop.shopName}</h1>
            <div className="flex justify-between items-center text-xs text-slate-300 font-bold bg-white/5 rounded-xl px-4 py-2 mt-4">
              <span>অর্ডার নম্বর: #{orderNum}</span>
              <span className="text-emerald-400 text-sm font-black">৳ {parseFloat(amount).toLocaleString()} BDT</span>
            </div>
          </div>

          {/* Payment selector */}
          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">পেমেন্ট মেথড সিলেক্ট করুন</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'bkash',  label: 'bKash',  sub: 'বিকাশ'  },
                  { id: 'nagad',  label: 'Nagad',  sub: 'নগদ'    },
                  { id: 'rocket', label: 'Rocket', sub: 'রকেট'   }
                ].map((gw) => (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setGateway(gw.id)}
                    className={`py-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                      gateway === gw.id
                        ? `${colors[gw.id].border} ${colors[gw.id].light} shadow-sm`
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`font-black text-xs ${colors[gw.id].text}`}>{gw.label}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{gw.sub}</span>
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handlePay} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Smartphone size={14} className={activeColor.text} />
                    মোবাইল ওয়ালেট নম্বর
                  </label>
                  <input
                    required
                    type="tel"
                    maxLength={11}
                    disabled={processing}
                    placeholder="01XXXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-base font-black text-slate-900 outline-none focus:border-slate-900 transition-colors shadow-inner"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    স্যান্ডবক্স মোডে যেকোনো ১১ ডিজিটের নম্বর দিন।
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    type="submit"
                    disabled={processing}
                    className={`w-full py-4 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${activeColor.bg} ${activeColor.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processing ? <Loader2 className="animate-spin" size={18} /> : <>৳ {parseFloat(amount).toLocaleString()} পেমেন্ট করুন</>}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={processing}
                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    পেমেন্ট বাতিল করুন
                  </button>
                </div>
              </form>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <ShieldCheck size={12} className="text-emerald-500" /> Secure Sandbox Node
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page wrapper with Suspense (required by Next.js for useSearchParams) ────
export default function PaymentSandboxPage({ params }) {
  const { shopSlug } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-purple-600 mb-2" size={32} />
          <p className="text-sm font-bold text-slate-500">পেমেন্ট গেটওয়ে লোড হচ্ছে...</p>
        </div>
      }
    >
      <PaymentSandboxContent shopSlug={shopSlug} />
    </Suspense>
  );
}
