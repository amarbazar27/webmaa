'use client';
import { useEffect, useState, use } from 'react';
import { getShopBySlug, getShopOrders } from '@/lib/firestore'; // Assuming we have or will make getShopOrders
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Printer } from 'lucide-react';

export default function InvoicePage({ params }) {
  const { shopSlug, orderId } = use(params);
  const [order, setOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
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
    fetchInvoice();
  }, [shopSlug, orderId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;
  if (!order || !shop) return <div className="text-center py-20 font-black text-2xl">Invoice Not Found</div>;

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0 font-sans">
       <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 shadow-2xl rounded-2xl print:shadow-none print:rounded-none">
          {/* Action Bar (Hidden in Print) */}
          <div className="flex justify-between items-center mb-6 print:hidden">
             <h2 className="font-black text-slate-400 uppercase tracking-widest text-xs">অর্ডার ইনভয়েস</h2>
             <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-purple-600 transition-colors shadow-lg active:scale-95">
                <Printer size={18} strokeWidth={2.5} /> প্রিন্ট করুন
             </button>
          </div>

          <div className="flex flex-col gap-4 text-slate-900">
             {/* Header */}
             <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                   {shop.logoUrl ? (
                      <img src={shop.logoUrl} className="h-12 w-auto" alt="Shop Logo" />
                   ) : (
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white font-black text-2xl">{shop.shopName?.[0]}</div>
                   )}
                   <div>
                     <h1 className="text-xl font-black tracking-tight leading-none mb-1">{shop.shopName}</h1>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">daripallah.com/{shopSlug}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="font-extrabold text-[16px] text-slate-900 mb-0.5"># {order.orderIdVisual || order.id.slice(-6).toUpperCase()}</p>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">তারিখ: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A'}</p>
                </div>
             </div>

             {/* Addresses */}
             <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div className="space-y-1">
                   <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">প্রাপক (Customer)</p>
                   <p className="font-black text-sm">{order.customerName}</p>
                   <p className="font-bold text-slate-600 leading-tight">{order.customerPhone}</p>
                   <p className="font-medium text-slate-500 leading-relaxed line-clamp-2">{order.customerAddress}</p>
                </div>
                <div className="space-y-1 text-right">
                   <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">শপ (Sender)</p>
                   <p className="font-black text-sm">{shop.shopName}</p>
                   <p className="font-bold text-slate-600">{shop.phone || 'Store'}</p>
                   {order.coordinates?.link && (
                     <p className="text-[9px] text-blue-600 font-bold underline truncate mt-1">Map Location</p>
                   )}
                </div>
             </div>

             {/* Items Table */}
             <div className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-slate-200 text-[9px] uppercase font-black text-slate-400 tracking-widest bg-slate-50">
                         <th className="py-2 px-3">পণ্য (Product)</th>
                         <th className="py-2 px-3 text-center">পরিমাণ</th>
                         <th className="py-2 px-3 text-right">মূল্য</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 text-xs font-bold">
                      {order.items?.map((item, idx) => (
                         <tr key={idx} className="group transition-colors">
                            <td className="py-2.5 px-3">
                               <div className="font-black text-slate-800">{item.name}</div>
                               {item.note && <div className="text-[9px] text-slate-400 italic font-medium mt-0.5">নোট: {item.note}</div>}
                               {item.customizedText && <div className="text-[9px] text-purple-600 font-black mt-0.5">Customized: {item.customizedText}</div>}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 font-black">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900">৳{(parseFloat(item.price) * item.quantity).toFixed(0)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* Totals */}
             <div className="flex justify-end pt-2">
                <div className="w-48 space-y-1.5">
                   <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>সাবটোটাল</span>
                      <span>৳{(parseFloat(order.total) - parseInt(order.deliveryFee || 0)).toFixed(0)}</span>
                   </div>
                   <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>ডেলিভারি</span>
                      <span>৳{order.deliveryFee || 0}</span>
                   </div>
                   <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-900">
                      <span>সর্বমোট</span>
                      <span>৳{parseFloat(order.total).toFixed(0)}</span>
                   </div>
                </div>
             </div>

             {/* Footer notes */}
             <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400">
                <div>
                   {order.transactionId && (
                     <p className="mb-1"><span className="uppercase text-[8px] tracking-widest font-black">Txn ID:</span> <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-900">{order.transactionId}</span></p>
                   )}
                   {order.customerNote && (
                     <p className="line-clamp-2"><span className="uppercase text-[8px] tracking-widest font-black text-slate-300">নোট:</span> <span className="text-slate-600">{order.customerNote}</span></p>
                   )}
                </div>
                <div className="text-right flex flex-col items-end">
                   <div className="w-24 h-px bg-slate-200 mt-6 mb-2"></div>
                   <p className="uppercase text-[8px] tracking-widest font-black mb-1 text-slate-300">অনুমোদিত স্বাক্ষর</p>
                   <p className="text-[9px] text-slate-400">ধন্যবাদ, আবার আসবেন!</p>
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
            @page { margin: 5mm; size: auto; }
            
            /* Single-page invoice compaction rules */
            .max-w-2xl { max-width: 100% !important; padding: 10px !important; margin: 0 !important; }
            table { font-size: 9px !important; }
            table th, table td { padding: 4px 6px !important; }
            h1 { font-size: 14px !important; }
            p, span, td, div { font-size: 10px !important; }
            .flex-col { gap: 8px !important; }
            .grid { gap: 10px !important; padding: 8px !important; }
            .mt-6 { margin-top: 10px !important; }
            .pt-4 { padding-top: 8px !important; }
            .mb-6 { margin-bottom: 8px !important; }
         }
       `}} />
    </div>
  );
}
