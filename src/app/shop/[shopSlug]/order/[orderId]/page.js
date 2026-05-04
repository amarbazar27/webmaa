'use client';
import { useEffect, useState, use } from 'react';
import { getShopBySlug } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Download, Package, ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function LiveCountdown({ deliveryETA }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!deliveryETA) return;
    const update = () => {
      const target = deliveryETA.toDate ? deliveryETA.toDate() : new Date(deliveryETA);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setIsExpired(true);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
        setTimeLeft(`${h}:${m}:${s}`);
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deliveryETA]);

  if (!deliveryETA) return null;

  return (
    <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200 animate-pulse'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock size={16} className={isExpired ? 'text-red-500' : 'text-blue-500'} />
        <p className={`text-[10px] font-black uppercase tracking-widest ${isExpired ? 'text-red-600' : 'text-blue-600'}`}>
          {isExpired ? 'ডেলিভারি সময় শেষ' : 'ডেলিভারি পৌঁছানোর সম্ভাব্য সময়'}
        </p>
      </div>
      <p className={`text-3xl font-black tracking-tight font-mono ${isExpired ? 'text-red-700' : 'text-blue-700'}`}>
        {timeLeft}
      </p>
    </div>
  );
}

export default function OrderSummaryPage({ params }) {
  const { shopSlug, orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfState, setPdfState] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const shopData = await getShopBySlug(shopSlug);
        if (!shopData) throw new Error('Shop not found');
        setShop(shopData);
        const orderRef = doc(db, 'shops', shopData.id, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() });
        } else {
          throw new Error('Order not found');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [shopSlug, orderId]);

  const generatePDF = async () => {
    if (isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      setPdfState('Preparing...');
      setPdfProgress(10);

      const invoiceElement = document.getElementById('pdf-content');
      if (!invoiceElement) throw new Error('Invoice element not found');

      // Make visible for capture
      invoiceElement.style.display = 'block';
      setPdfState('Downloading (40%)');
      setPdfProgress(40);

      const canvas = await html2canvas(invoiceElement, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff'
      });
      invoiceElement.style.display = 'none';

      setPdfState('Downloading (70%)');
      setPdfProgress(70);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      setPdfState('Downloading (90%)');
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
      pdf.save(`Order_${orderNum}.pdf`);
      setPdfState('Completed ✓');
      setPdfProgress(100);
      toast.success('PDF ডাউনলোড সফল! 📄');
    } catch (err) {
      console.error(err);
      toast.error('PDF ডাউনলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      setPdfState('');
    } finally {
      setTimeout(() => {
        setIsGeneratingPdf(false);
        setPdfProgress(0);
        setPdfState('');
      }, 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-purple-600" size={32} />
    </div>
  );

  if (!order || !shop) return (
    <div className="text-center py-20 font-black text-2xl text-slate-500">অর্ডার পাওয়া যায়নি</div>
  );

  const subtotal = parseFloat(order.total) - parseInt(shop.deliveryConfig?.advanceFee || 0);
  const deliveryFee = parseInt(shop.deliveryConfig?.advanceFee || 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <div>
            <h1 className="font-black text-slate-900 text-lg leading-tight">অর্ডার সামারি</h1>
            <p className="text-xs text-slate-500 font-bold">#{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Status */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">অর্ডার স্ট্যাটাস</h2>
            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${
              order.status === 'completed' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' 
              : order.status === 'cancelled' ? 'text-red-700 bg-red-100 border-red-200' 
              : 'text-amber-700 bg-amber-100 border-amber-200'}`}>
              {order.status || 'Pending'}
            </span>
          </div>
          {order.returnNote && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">রিটেইলার বার্তা</p>
              <p className="text-sm font-bold text-amber-900">{order.returnNote}</p>
            </div>
          )}
          {order.deliveryETA && <LiveCountdown deliveryETA={order.deliveryETA} />}
        </div>

        {/* PDF Download Button */}
        <button
          onClick={generatePDF}
          disabled={isGeneratingPdf}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-xl disabled:opacity-60 relative overflow-hidden"
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
                  {item.customizedText ? (
                    <div className="mt-1 space-y-0.5">
                      {item.baseUnit && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">→ Base: {item.baseUnit}</p>}
                      <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest">→ Customized: {item.customizedText}</p>
                    </div>
                  ) : item.note ? (
                    <p className="text-xs text-slate-500 font-bold italic mt-1">{item.note}</p>
                  ) : null}
                  <span className="inline-block text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md mt-2">
                    {item.quantity} × ৳{parseFloat(item.price).toLocaleString()}
                  </span>
                </div>
                <div className="text-right font-black text-slate-900 text-sm flex-shrink-0">
                  ৳{(item.quantity * parseFloat(item.price)).toLocaleString()}
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
              <span>সর্বমোট</span><span>৳{parseFloat(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden invoice template for PDF capture */}
      <div
        id="pdf-content"
        style={{ display: 'none', position: 'fixed', top: 0, left: 0, background: 'white', width: '650px', zIndex: -1, padding: '20px', fontFamily: 'sans-serif', color: '#000' }}
      >
        {/* Header */}
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
              Date: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A'}
            </div>
          </div>
        </div>

        {/* Addresses */}
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

        {/* Items Table */}
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
                  <div style={{ fontWeight: 900 }}>
                    {item.name} {item.realBasePrice && <span style={{ fontSize: '9px', fontWeight: 'bold' }}>(Base: ৳{item.realBasePrice})</span>}
                  </div>
                  {item.customizedText ? (
                    <div style={{ marginTop: '2px' }}>
                      {item.baseUnit && <div style={{ fontSize: '9px', fontWeight: 700 }}>Base: {item.baseUnit}</div>}
                      <div style={{ fontSize: '9px', fontWeight: 900 }}>Note: {item.customizedText}</div>
                    </div>
                  ) : item.note ? (
                    <div style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '2px' }}>Note: {item.note}</div>
                  ) : null}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>৳{parseFloat(item.price).toLocaleString()}</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 900 }}>৳{(parseFloat(item.price) * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
          <div style={{ width: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
              <span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
              <span>Delivery</span><span>৳{deliveryFee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900, borderTop: '1px solid #000', paddingTop: '6px' }}>
              <span>Total</span><span>৳{parseFloat(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #000', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '9px', fontWeight: 700 }}>
          <div>
            {order.transactionId && (
              <p>Txn ID: {order.transactionId}</p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ marginTop: '4px' }}>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
