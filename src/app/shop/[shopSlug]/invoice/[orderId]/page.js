'use client';
import { useEffect, useState, use, useRef } from 'react';
import { getShopBySlug } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Printer, Download, ArrowLeft, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InvoicePage({ params }) {
  const { shopSlug, orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchInvoice = async () => {
      try {
        // 1. Try server API route first
        const res = await fetch(`/api/order?shopSlug=${encodeURIComponent(shopSlug)}&orderId=${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setShop(data.shop);
            setOrder(data.order);
          }
          return;
        }

        // 2. Direct Firestore fallback
        const shopData = await getShopBySlug(shopSlug);
        if (!shopData) throw new Error('Shop not found');
        if (isMounted) setShop(shopData);

        const orderRef = doc(db, 'shops', shopData.id, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          if (isMounted) setOrder({ id: orderSnap.id, ...orderSnap.data() });
        } else {
          throw new Error('Order not found');
        }
      } catch (err) {
        console.error('Invoice fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchInvoice();
    return () => { isMounted = false; };
  }, [shopSlug, orderId]);

  const handleDownloadPDF = async () => {
    if (isDownloading || !invoiceRef.current) return;
    try {
      setIsDownloading(true);
      const loadingToast = toast.loading('PDF ডাউনলোড প্রস্তুত হচ্ছে...');

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

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
      toast.success('PDF ডাউনলোড সফল! 📄', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('PDF ডাউনলোড ব্যর্থ হয়েছে। প্রিন্ট অপশনটি ব্যবহার করুন।');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/shop/${shopSlug}/order/${orderId}`);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 gap-3">
      <Loader2 className="animate-spin text-purple-600" size={36} />
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">ইনভয়েস লোড হচ্ছে...</p>
    </div>
  );

  if (!order || !shop) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-sm w-full space-y-4">
        <h2 className="text-xl font-black text-slate-800">ইনভয়েস পাওয়া যায়নি</h2>
        <p className="text-xs font-bold text-slate-500">অর্ডার নম্বরটি সঠিক কিনা যাচাই করুন।</p>
        <button
          onClick={handleBack}
          className="w-full py-3 bg-purple-600 text-white rounded-2xl font-black text-sm hover:bg-purple-700 transition-colors"
        >
          ফিরে যান
        </button>
      </div>
    </div>
  );

  const safeNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const safeInt = (v) => { const n = parseInt(v); return isNaN(n) ? 0 : n; };
  const deliveryFee = safeInt(shop.deliveryConfig?.advanceFee || order.deliveryFee || 0);
  const orderTotal = safeNum(order.total);
  const subtotal = Math.max(0, orderTotal - deliveryFee);

  const formattedDate = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleDateString('en-GB') 
    : (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A');

  return (
    <div className="min-h-screen bg-slate-100 py-4 sm:py-8 print:bg-white print:py-0 font-sans">
      <div className="max-w-2xl mx-auto px-4 print:px-0">
        
        {/* Action Bar (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-black text-xs px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={16} /> ফিরে যান
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-black text-xs hover:bg-purple-700 transition-all shadow-md active:scale-95 cursor-pointer border-0 disabled:opacity-60"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={2.5} />}
              ডাউনলোড (PDF)
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-black text-xs hover:bg-slate-900 transition-all shadow-md active:scale-95 cursor-pointer border-0"
            >
              <Printer size={14} strokeWidth={2.5} /> প্রিন্ট
            </button>
          </div>
        </div>

        {/* Printable Invoice Card */}
        <div
          ref={invoiceRef}
          className="bg-white p-6 sm:p-8 shadow-xl rounded-3xl border border-slate-200 print:shadow-none print:rounded-none print:border-none print:p-0"
        >
          <div className="flex flex-col gap-5 text-slate-900">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} className="h-12 w-auto max-w-[120px] object-contain" alt="Shop Logo" />
                ) : (
                  <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-sm">
                    {shop.shopName?.[0] || 'S'}
                  </div>
                )}
                <div>
                  <h1 className="text-lg sm:text-xl font-black tracking-tight leading-tight">{shop.shopName}</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {shop.customDomain || `bdretailers.com/${shopSlug}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wider mb-1">
                  Invoice
                </span>
                <p className="font-black text-sm text-slate-900">
                  #{order.orderIdVisual || order.id.slice(-6).toUpperCase()}
                </p>
                <p className="text-[10px] font-bold text-slate-500">
                  তারিখ: {formattedDate}
                </p>
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">প্রাপক (Billed To)</p>
                <p className="font-black text-sm text-slate-900">{order.customerName}</p>
                <p className="font-bold text-purple-700">{order.customerPhone}</p>
                <p className="font-medium text-slate-600 leading-relaxed">{order.customerAddress}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">শপ (Billed From)</p>
                <p className="font-black text-sm text-slate-900">{shop.shopName}</p>
                <p className="font-bold text-slate-600">{shop.phone || shop.deliveryConfig?.contactPhone || 'Official Store'}</p>
                <p className="text-[10px] font-bold text-slate-500">Verified Seller ✓</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-hidden border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase font-black text-slate-500 tracking-wider bg-slate-50">
                    <th className="py-2.5 px-3.5">পণ্য (Product)</th>
                    <th className="py-2.5 px-3.5 text-center">পরিমাণ</th>
                    <th className="py-2.5 px-3.5 text-right">দর</th>
                    <th className="py-2.5 px-3.5 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {order.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-black text-slate-900">{item.name}</div>
                        {item.realBasePrice && (
                          <span className="text-[9px] font-bold text-slate-400">Base: ৳{item.realBasePrice}</span>
                        )}
                        {item.customizedText && (
                          <div className="text-[10px] text-purple-700 font-black mt-0.5">→ {item.customizedText}</div>
                        )}
                        {item.note && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5 font-medium">নোট: {item.note}</div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center text-slate-700 font-black">{item.quantity}</td>
                      <td className="py-3 px-3.5 text-right text-slate-600 font-bold">৳{safeNum(item.price).toLocaleString()}</td>
                      <td className="py-3 px-3.5 text-right font-black text-slate-900">৳{(safeNum(item.price) * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-1">
              <div className="w-56 space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>সাবটোটাল</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>ডেলিভারি চার্জ</span>
                  <span>৳{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                  <span>সর্বমোট</span>
                  <span className="text-purple-700">৳{safeNum(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer notes */}
            <div className="mt-2 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-500">
              <div>
                {order.transactionId && (
                  <p className="mb-1">
                    <span className="uppercase text-[9px] tracking-wider font-black text-slate-400">Txn ID: </span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800 border border-slate-200">{order.transactionId}</span>
                  </p>
                )}
                {order.customerNote && (
                  <p><span className="text-slate-400">গ্রাহক নোট:</span> {order.customerNote}</p>
                )}
              </div>
              <div className="text-right flex flex-col items-end justify-end">
                <div className="w-28 h-px bg-slate-300 mb-1"></div>
                <p className="uppercase text-[9px] tracking-wider font-black text-slate-400">অনুমোদিত স্বাক্ষর</p>
                <p className="text-[10px] text-purple-700 font-bold">আমাদের সাথে থাকার জন্য ধন্যবাদ! ✨</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:border-none { border: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          @page { margin: 8mm; size: auto; }
        }
      `}} />
    </div>
  );
}
