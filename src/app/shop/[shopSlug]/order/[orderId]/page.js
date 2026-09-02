'use client';
import { useEffect, useState, use } from 'react';
import { Loader2, Download, Package, ArrowLeft, Clock, ShieldAlert, RefreshCw, Eye, CheckCircle2, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ── Delivery ETA Countdown ──────────────────────────────────────────
function LiveCountdown({ deliveryETA }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!deliveryETA) return;
    const update = () => {
      const target = deliveryETA.toDate ? deliveryETA.toDate() : new Date(deliveryETA);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('সময় শেষ (শীঘ্রই পৌঁছাবে)');
        setIsExpired(true);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
        setTimeLeft(d > 0 ? `${d} দিন ${h}:${m}:${s}` : `${h}:${m}:${s}`);
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deliveryETA]);

  if (!deliveryETA) return null;

  return (
    <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center ${isExpired ? 'bg-amber-50 border-amber-200' : 'bg-purple-50 border-purple-200'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Clock size={16} className={isExpired ? 'text-amber-600' : 'text-purple-600'} />
        <p className={`text-[11px] font-black uppercase tracking-wider ${isExpired ? 'text-amber-700' : 'text-purple-700'}`}>
          {isExpired ? 'ডেলিভারি সময়সীমা' : 'পৌঁছানোর সম্ভাব্য কাউন্টডাউন'}
        </p>
      </div>
      <p className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${isExpired ? 'text-amber-800' : 'text-purple-900'}`}>
        {timeLeft}
      </p>
    </div>
  );
}

// ── Delivery Info Card (Replaces fake 1200m tracker) ────────────────
function DeliveryInfoCard({ order, shop }) {
  const deliveryTime = order.deliveryCountdownFormatted || order.deliveryTime || shop?.deliveryConfig?.deliveryTime || '';
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';
  const isConfirmed = order.status === 'confirmed';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isCompleted ? 'bg-emerald-100 text-emerald-600' :
            isCancelled ? 'bg-red-100 text-red-600' :
            isConfirmed ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'
          }`}>
            <Truck size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">ডেলিভারি সংক্রান্ত তথ্য</h3>
            <p className="text-[11px] font-bold text-slate-500">
              {isCompleted ? 'ডেলিভারি সম্পন্ন হয়েছে' :
               isCancelled ? 'অর্ডার বাতিল করা হয়েছে' :
               isConfirmed ? 'অর্ডার কনফার্মড - ডেলিভারির প্রস্তুতি চলছে' : 'অর্ডার প্রক্রিয়াধীন রয়েছে'}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
          isCompleted ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
          isCancelled ? 'text-red-700 bg-red-50 border-red-200' :
          isConfirmed ? 'text-purple-700 bg-purple-50 border-purple-200' :
          'text-amber-700 bg-amber-50 border-amber-200'
        }`}>
          {order.status || 'Pending'}
        </span>
      </div>

      {order.deliveryETA && !isCompleted && !isCancelled && (
        <LiveCountdown deliveryETA={order.deliveryETA} />
      )}

      {deliveryTime && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
          <Clock size={18} className="text-purple-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">সম্ভাব্য ডেলিভারি সময়</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">{deliveryTime}</p>
          </div>
        </div>
      )}

      <div className="text-xs font-bold text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
        {isCompleted ? (
          <><CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> আপনার অর্ডারটি সফলভাবে ডেলিভারি সম্পন্ন হয়েছে। ধন্যবাদ!</>
        ) : isCancelled ? (
          <><ShieldAlert size={16} className="text-red-600 shrink-0" /> দুঃখিত, অর্ডারটি বাতিল করা হয়েছে। কোনো জিজ্ঞাসা থাকলে দোকানে যোগাযোগ করুন।</>
        ) : isConfirmed ? (
          <><CheckCircle2 size={16} className="text-purple-600 shrink-0" /> দোকানদার অর্ডারটি গ্রহণ করেছেন এবং ডেলিভারির কাজ চলমান রয়েছে।</>
        ) : (
          <><Clock size={16} className="text-amber-600 shrink-0" /> অর্ডারটি দোকানদারের অনুমোদনের অপেক্ষায় রয়েছে। শীঘ্রই কনফার্ম করা হবে।</>
        )}
      </div>
    </div>
  );
}

// ── Main Order Summary Page ──────────────────────────────────────────
export default function OrderSummaryPage({ params }) {
  const { shopSlug, orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfState, setPdfState] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // ── Verify payment (for unpaid automated orders) ──
  const handleVerifyPayment = async () => {
    setIsVerifying(true);
    const loadingToast = toast.loading('পেমেন্ট যাচাই করা হচ্ছে...');
    try {
      const res = await fetch('/api/payments/verify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, shopId: shop?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ভেরিফিকেশন সম্পন্ন করা যায়নি।');
      if (data.success) {
        toast.success(data.message || 'পেমেন্ট সফলভাবে ভেরিফাই ও অর্ডার কনফার্ম হয়েছে! 🎉', { id: loadingToast });
        const updatedRes = await fetch(`/api/order?shopSlug=${encodeURIComponent(shopSlug)}&orderId=${encodeURIComponent(orderId)}`);
        if (updatedRes.ok) {
          const updatedData = await updatedRes.json();
          setOrder(updatedData.order);
        }
      } else {
        toast.error(data.message || 'পেমেন্ট এখনো সম্পন্ন হয়নি।', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'ভেরিফিকেশন রিকোয়েস্টে সমস্যা হয়েছে।', { id: loadingToast });
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Fetch order on mount ──
  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/order?shopSlug=${encodeURIComponent(shopSlug)}&orderId=${encodeURIComponent(orderId)}`);
        if (res.status === 403) {
          if (isMounted) setError('permission');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setShop(data.shop);
            setOrder(data.order);
          }
          return;
        }
        // Fallback: direct Firestore
        const { getShopBySlug } = await import('@/lib/firestore');
        const { db } = await import('@/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const shopData = await getShopBySlug(shopSlug);
        if (!shopData) { if (isMounted) setError('not_found'); return; }
        if (isMounted) setShop(shopData);
        const orderSnap = await getDoc(doc(db, 'shops', shopData.id, 'orders', orderId));
        if (!orderSnap.exists()) { if (isMounted) setError('not_found'); return; }
        if (isMounted) setOrder({ id: orderSnap.id, ...orderSnap.data() });
      } catch (err) {
        console.error('[OrderPage]', err);
        if (isMounted) {
          setError(err?.code === 'permission-denied' ? 'permission' : 'not_found');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchOrder();
    return () => { isMounted = false; };
  }, [shopSlug, orderId]);

  const invoiceUrl = `/shop/${shopSlug}/invoice/${orderId}`;

  // ── Generate PDF — dynamically imports heavy libs only on demand ──
  const generatePDF = async () => {
    if (isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      setPdfState('লাইব্রেরি লোড হচ্ছে...');
      setPdfProgress(10);

      // Dynamic imports — NOT loaded at page init so Flutter WebView doesn't freeze
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const invoiceElement = document.getElementById('pdf-content');
      if (!invoiceElement) throw new Error('Invoice element not found');

      invoiceElement.style.display = 'block';
      setPdfState('ইনভয়েস ক্যাপচার হচ্ছে...');
      setPdfProgress(45);

      const canvas = await html2canvas(invoiceElement, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff'
      });
      invoiceElement.style.display = 'none';

      setPdfState('PDF তৈরি হচ্ছে...');
      setPdfProgress(75);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      setPdfState('ফাইল সেভ হচ্ছে...');
      setPdfProgress(90);
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const orderNum = order.orderIdVisual || order.id.slice(-6);
      pdf.save(`Invoice_${orderNum}.pdf`);
      setPdfState('ডাউনলোড সম্পন্ন ✓');
      setPdfProgress(100);

      toast((t) => (
        <div className="flex items-center gap-3">
          <div>
            <p className="font-black text-xs text-slate-900">PDF ডাউনলোড সফল! 📄</p>
            <p className="text-[10px] text-slate-500">ইনভয়েসটি ব্রাউজারেও সরাসরি দেখতে পারেন</p>
          </div>
          <Link
            href={invoiceUrl}
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1.5 bg-purple-600 text-white rounded-lg font-black text-xs shrink-0 hover:bg-purple-700"
          >
            ওপেন করুন
          </Link>
        </div>
      ), { duration: 6000 });

    } catch (err) {
      console.error(err);
      toast.error('PDF ডাউনলোড ব্যর্থ হয়েছে। ব্রাউজারে ইনভয়েস ওপেন করে দেখুন।');
      setPdfState('');
    } finally {
      setTimeout(() => {
        setIsGeneratingPdf(false);
        setPdfProgress(0);
        setPdfState('');
      }, 2500);
    }
  };

  // ── Safe back navigation ──
  const handleBack = () => {
    try {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push(`/shop/${shopSlug}`);
      }
    } catch {
      router.push(`/shop/${shopSlug}`);
    }
  };

  // ── Loading state ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-purple-600" size={32} />
    </div>
  );

  // ── Permission denied ──
  if (error === 'permission') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-3xl border border-amber-200 p-8 max-w-sm w-full text-center shadow-sm space-y-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert size={28} className="text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">অর্ডার দেখার অনুমতি নেই</h2>
          <p className="text-sm text-slate-500 font-bold mt-2">এই অর্ডারটি দেখতে আপনাকে সংশ্লিষ্ট ইমেইল দিয়ে লগইন করতে হবে।</p>
        </div>
        <button onClick={handleBack} className="w-full py-3 bg-purple-600 text-white rounded-2xl font-black text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer">
          <ArrowLeft size={16} /> ফিরে যান
        </button>
      </div>
    </div>
  );

  // ── Not found ──
  if (!order || !shop || error === 'not_found') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-sm w-full text-center shadow-sm space-y-4">
        <Package size={40} className="mx-auto text-slate-300" />
        <p className="text-lg font-black text-slate-500">অর্ডার পাওয়া যায়নি</p>
        <button onClick={handleBack} className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer">
          <ArrowLeft size={16} /> ফিরে যান
        </button>
      </div>
    </div>
  );

  const safeNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const safeInt = (v) => { const n = parseInt(v); return isNaN(n) ? 0 : n; };

  const deliveryFee = safeInt(shop.deliveryConfig?.advanceFee || order.deliveryFee || 0);
  const orderTotal = safeNum(order.total);
  const subtotal = Math.max(0, orderTotal - deliveryFee);
  const isUnpaidAutomatedOrder = (order.paymentMethod === 'piprapay' || order.paymentMethod === 'automated') && order.paymentStatus !== 'paid';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer border-0">
              <ArrowLeft size={20} className="text-slate-700" />
            </button>
            <div>
              <h1 className="font-black text-slate-900 text-lg leading-tight">অর্ডার সামারি</h1>
              <p className="text-xs text-slate-500 font-bold">#{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <Link
            href={invoiceUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-black border border-purple-200 transition-colors"
          >
            <Eye size={14} /> ইনভয়েস ভিউ
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Delivery Info Card */}
        <DeliveryInfoCard order={order} shop={shop} />

        {/* Retailer note */}
        {order.returnNote && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">রিটেইলার বার্তা</p>
            <p className="text-sm font-bold text-amber-900">{order.returnNote}</p>
          </div>
        )}

        {/* Unpaid automated order */}
        {isUnpaidAutomatedOrder && (
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl border-2 border-red-200 p-6 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-red-900 text-sm">পেমেন্ট সম্পন্ন হয়নি (Payment Unpaid)</h3>
                <p className="text-xs text-red-600 font-bold mt-0.5">অর্ডারটি কনফার্ম করার জন্য পেমেন্ট সম্পন্ন করা আবশ্যক।</p>
              </div>
            </div>
            {order.piprapayCheckoutUrl && (
              <div className="flex flex-col gap-2 w-full">
                <a
                  href={order.piprapayCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/20 active:scale-95 text-center"
                >
                  পেমেন্ট সম্পন্ন করুন (Pay Now)
                </a>
                <button
                  onClick={handleVerifyPayment}
                  disabled={isVerifying}
                  className="w-full py-3 bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  {isVerifying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  পেমেন্ট ভেরিফাই করুন (Verify Payment)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Invoice Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={generatePDF}
            disabled={isGeneratingPdf}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-60 relative overflow-hidden cursor-pointer"
          >
            {isGeneratingPdf && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-purple-500/50 transition-all duration-500"
                style={{ width: `${pdfProgress}%` }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {isGeneratingPdf
                ? <><Loader2 size={16} className="animate-spin" /> {pdfState}</>
                : <><Download size={16} strokeWidth={2.5} /> ইনভয়েস ডাউনলোড (PDF)</>}
            </span>
          </button>

          <Link
            href={invoiceUrl}
            className="w-full py-4 bg-white text-slate-800 hover:bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-sm text-center"
          >
            <Eye size={16} className="text-purple-600" strokeWidth={2.5} />
            ইনভয়েস ওপেন করুন (Open)
          </Link>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">ডেলিভারি ঠিকানা</h3>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">নাম</p><p className="text-sm font-bold text-slate-900">{order.customerName}</p></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ফোন</p><p className="text-sm font-black text-purple-700">{order.customerPhone}</p></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ঠিকানা</p><p className="text-sm font-bold text-slate-600">{order.customerAddress}</p></div>
          {order.transactionId && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</p>
              <p className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded mt-1 inline-block border border-emerald-200">{order.transactionId}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Package size={16} className="text-slate-500" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">প্রোডাক্ট লিস্ট</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="p-4 flex gap-4 items-start">
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    : <Package size={18} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-slate-900 truncate">{item.name}</p>
                    {item.realBasePrice && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Base: ৳{item.realBasePrice}
                      </span>
                    )}
                  </div>
                  {item.customizedText && (
                    <div className="mt-1 space-y-0.5">
                      {item.baseUnit && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">→ Base: {item.baseUnit}</p>}
                      <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest">→ Customized: {item.customizedText}</p>
                    </div>
                  )}
                  {item.note && <p className="text-xs text-slate-500 font-bold italic mt-1">নোট: {item.note}</p>}
                  <span className="inline-block text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md mt-2">
                    {item.quantity} × ৳{safeNum(item.price).toLocaleString()}
                  </span>
                </div>
                <div className="text-right font-black text-slate-900 text-sm flex-shrink-0">
                  ৳{(item.quantity * safeNum(item.price)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50 space-y-2 border-t border-slate-200">
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>সাবটোটাল</span><span>৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>ডেলিভারি চার্জ</span><span>৳{deliveryFee}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>সর্বমোট</span><span>৳{safeNum(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden invoice template for PDF capture */}
      <div
        id="pdf-content"
        style={{ display: 'none', position: 'fixed', top: 0, left: 0, background: 'white', width: '650px', zIndex: -1, padding: '20px', fontFamily: 'sans-serif', color: '#000' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
          <div>
            {shop.logoUrl
              ? <img src={shop.logoUrl} style={{ height: '40px', width: 'auto', marginBottom: '4px' }} alt="Logo" />
              : <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '2px' }}>{shop.shopName}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice</div>
            <div style={{ fontWeight: 800, fontSize: '11px', marginTop: '4px' }}>
              # {order.orderIdVisual || order.id.slice(-6).toUpperCase()}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>
              Date: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB') : (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A')}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', fontSize: '11px' }}>
          <div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 900, marginBottom: '4px' }}>Billed From</div>
            <div style={{ fontWeight: 900, fontSize: '13px' }}>{shop.shopName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 900, marginBottom: '4px' }}>Billed To</div>
            <div style={{ fontWeight: 900, fontSize: '13px' }}>{order.customerName}</div>
            <div style={{ fontWeight: 700, maxWidth: '200px', marginLeft: 'auto' }}>{order.customerAddress}</div>
            <div style={{ fontWeight: 900 }}>{order.customerPhone}</div>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}>
              <th style={{ padding: '6px 0', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '6px 0', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '6px 0', textAlign: 'right' }}>Price</th>
              <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px dashed #ccc', fontSize: '11px' }}>
                <td style={{ padding: '8px 0', fontWeight: 700 }}>
                  <div style={{ fontWeight: 900 }}>{item.name}</div>
                  {item.customizedText && <div style={{ fontSize: '9px', fontWeight: 900, color: '#7c3aed' }}>→ {item.customizedText}</div>}
                  {item.note && <div style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '2px', color: '#666' }}>Note: {item.note}</div>}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>৳{safeNum(item.price).toLocaleString()}</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 900 }}>৳{(safeNum(item.price) * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
          <div style={{ width: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
              <span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
              <span>Delivery</span><span>৳{deliveryFee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900, borderTop: '1px solid #000', paddingTop: '6px' }}>
              <span>Total</span><span>৳{safeNum(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #000', paddingTop: '10px', fontSize: '9px', fontWeight: 700, textAlign: 'right' }}>
          <p>Thank you for your business!</p>
          {order.transactionId && <p>Txn ID: {order.transactionId}</p>}
        </div>
      </div>
    </div>
  );
}
