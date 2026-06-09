'use client';

import { Suspense } from 'react';
import { use, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, ArrowRight, RefreshCw, ShoppingBag } from 'lucide-react';

// ── Inner component that uses useSearchParams ──────────────────────────────
function PaymentCallbackContent({ shopSlug }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('orderId');
  const shopId  = searchParams.get('shopId');
  const status  = searchParams.get('status'); // success | cancelled | failed
  const txnId   = searchParams.get('txnId');

  const [order, setOrder] = useState(null);
  const [shop,  setShop]  = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-purple-600 mb-2" size={32} />
        <p className="text-sm font-bold text-slate-500">অর্ডারের স্ট্যাটাস যাচাই করা হচ্ছে...</p>
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
            onClick={() => router.push(`/shop/${shopSlug}`)}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} /> শপে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const orderNum  = order.orderIdVisual || order.id?.slice(-6).toUpperCase();
  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-xl flex flex-col">

        {/* Status Illustration */}
        <div className={`p-8 text-center space-y-4 flex flex-col items-center ${
          isSuccess ? 'bg-emerald-50' : isCancelled ? 'bg-amber-50' : 'bg-red-50'
        }`}>
          {isSuccess ? (
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
              <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>
          ) : isCancelled ? (
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
              <XCircle size={48} strokeWidth={2.5} />
            </div>
          ) : (
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <XCircle size={48} strokeWidth={2.5} />
            </div>
          )}

          <div>
            <h1 className={`text-xl font-black ${
              isSuccess ? 'text-emerald-950' : isCancelled ? 'text-amber-950' : 'text-red-950'
            }`}>
              {isSuccess ? 'পেমেন্ট সফল হয়েছে!' : isCancelled ? 'পেমেন্ট বাতিল করা হয়েছে' : 'পেমেন্ট ব্যর্থ হয়েছে'}
            </h1>
            <p className={`text-xs font-bold mt-1 ${
              isSuccess ? 'text-emerald-700/80' : isCancelled ? 'text-amber-700/80' : 'text-red-700/80'
            }`}>
              {isSuccess
                ? 'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।'
                : isCancelled
                  ? 'আপনি পেমেন্ট প্রক্রিয়াটি বাতিল করেছেন।'
                  : 'পেমেন্ট গেটওয়েতে সমস্যার কারণে লেনদেন ব্যর্থ হয়েছে।'}
            </p>
          </div>
        </div>

        {/* Transaction details */}
        <div className="p-6 space-y-6 flex-1">
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold border-b border-slate-200/60 pb-2">
              <span>শপের নাম:</span>
              <span className="text-slate-900 font-black">{shop.shopName}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold border-b border-slate-200/60 pb-2">
              <span>অর্ডার আইডি:</span>
              <span className="text-slate-900 font-black">#{orderNum}</span>
            </div>
            <div className={`flex justify-between items-center text-xs text-slate-500 font-bold ${txnId ? 'border-b border-slate-200/60 pb-2' : ''}`}>
              <span>পরিশোধের পরিমাণ:</span>
              <span className="text-slate-900 font-black text-sm">৳ {parseFloat(order.total).toLocaleString()}</span>
            </div>
            {txnId && (
              <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                <span>ট্রানজেকশন আইডি:</span>
                <span className="text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded font-black font-mono select-all border border-emerald-200/50">
                  {txnId}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {isSuccess ? (
              <button
                onClick={() => router.push(`/shop/${shopSlug}/order/${orderId}`)}
                className="w-full py-4 bg-slate-900 hover:bg-purple-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-600/10"
              >
                অর্ডার বিবরণ দেখুন <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/shop/${shopSlug}/payment-sandbox?orderId=${orderId}&shopId=${shopId || shop.id}&amount=${order.total}`)}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  <RefreshCw size={16} /> আবার চেষ্টা করুন
                </button>
                <button
                  onClick={() => router.push(`/shop/${shopSlug}/order/${orderId}`)}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  অর্ডার ডিটেইলস (বিকল্প পেমেন্ট)
                </button>
              </>
            )}

            <button
              onClick={() => router.push(`/shop/${shopSlug}`)}
              className="w-full py-3 text-slate-400 hover:text-slate-600 rounded-2xl font-black text-xs transition-colors text-center"
            >
              শপিং পেজে ফিরে যান
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page wrapper with Suspense (required by Next.js for useSearchParams) ────
export default function PaymentCallbackPage({ params }) {
  const { shopSlug } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-purple-600 mb-2" size={32} />
          <p className="text-sm font-bold text-slate-500">অর্ডারের স্ট্যাটাস যাচাই করা হচ্ছে...</p>
        </div>
      }
    >
      <PaymentCallbackContent shopSlug={shopSlug} />
    </Suspense>
  );
}
