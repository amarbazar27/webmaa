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
    <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0 font-sans">
       <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 shadow-2xl rounded-2xl print:shadow-none print:rounded-none">
          {/* Action Bar (Hidden in Print) */}
          <div className="flex justify-end mb-8 print:hidden">
             <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-purple-600 transition-colors shadow-lg">
                <Printer size={18} strokeWidth={2.5} /> প্রিন্ট ইনভয়েস
             </button>
          </div>

          <div className="flex flex-col gap-8 text-slate-900">
             {/* Header */}
             <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div>
                   {shop.logoUrl ? (
                      <img src={shop.logoUrl} className="h-16 w-auto mb-2" alt="Shop Logo" />
                   ) : (
                      <div className="text-3xl font-black text-purple-700 tracking-tight mb-1">{shop.shopName}</div>
                   )}
                   <p className="text-sm font-bold text-slate-500">{window.location.origin}/shop/{shopSlug}</p>
                </div>
                <div className="text-right">
                   <h1 className="text-4xl font-black tracking-tight mb-2 uppercase text-slate-300">Invoice</h1>
                   <p className="font-extrabold text-sm bg-slate-100 px-3 py-1 rounded inline-block border border-slate-200"># {order.orderIdVisual || order.id.slice(-6).toUpperCase()}</p>
                   <p className="text-xs font-bold text-slate-500 mt-2">তারিখ: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A'}</p>
                </div>
             </div>

             {/* Addresses */}
             <div className="grid grid-cols-2 gap-8 text-sm">
                <div className="space-y-1">
                   <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">প্রেরক (Billed From)</p>
                   <p className="font-black text-base">{shop.shopName}</p>
                   <p className="font-bold text-slate-600">Bangladesh</p>
                </div>
                <div className="space-y-1 text-right">
                   <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">প্রাপক (Billed To)</p>
                   <p className="font-black text-base">{order.customerName}</p>
                   <p className="font-bold text-slate-600 max-w-[200px] ml-auto">{order.customerAddress}</p>
                   <p className="font-black text-purple-700">{order.customerPhone}</p>
                </div>
             </div>

             {/* Items Table */}
             <div className="mt-4">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b-2 border-slate-900 text-xs uppercase font-black text-slate-500 tracking-widest">
                         <th className="py-3">বিবরণ</th>
                         <th className="py-3 text-center">পরিমাণ</th>
                         <th className="py-3 text-right">মূল্য</th>
                         <th className="py-3 text-right">মোট</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 text-sm font-bold">
                      {order.items?.map((item, idx) => (
                         <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4">{item.name}</td>
                            <td className="py-4 text-center">{item.quantity}</td>
                            <td className="py-4 text-right">৳{parseFloat(item.price).toLocaleString()}</td>
                            <td className="py-4 text-right font-black">৳{(parseFloat(item.price) * item.quantity).toLocaleString()}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* Totals */}
             <div className="flex justify-end pt-4">
                <div className="w-64 space-y-3">
                   <div className="flex justify-between text-sm font-bold text-slate-600">
                      <span>সাবটোটাল</span>
                      <span>৳{(parseFloat(order.total) - parseInt(shop.deliveryConfig?.advanceFee || 0)).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-sm font-bold text-slate-600">
                      <span>ডেলিভারি চার্জ</span>
                      <span>৳{shop.deliveryConfig?.advanceFee || 0}</span>
                   </div>
                   <div className="flex justify-between text-xl font-black text-slate-900 pt-3 border-t-2 border-slate-900">
                      <span>সর্বমোট</span>
                      <span>৳{parseFloat(order.total).toLocaleString()}</span>
                   </div>
                </div>
             </div>

             {/* Footer notes */}
             <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs font-bold text-slate-500">
                <div>
                   {order.transactionId && (
                     <p className="mb-1"><span className="uppercase text-[9px] tracking-widest font-black">Advance Txn ID:</span> <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-900">{order.transactionId}</span></p>
                   )}
                   {order.customerNote && (
                     <p><span className="uppercase text-[9px] tracking-widest font-black">নোট:</span> {order.customerNote}</p>
                   )}
                </div>
                <div className="text-right">
                   <p className="uppercase text-[10px] tracking-widest font-black mb-2">অনুমোদিত স্বাক্ষর</p>
                   <div className="w-32 h-px bg-slate-300 ml-auto mt-8 inline-block"></div>
                   <p className="mt-2 text-slate-400">ধন্যবাদ আমাদের সাথে থাকার জন্য!</p>
                </div>
             </div>
          </div>
       </div>

       <style dangerouslySetInnerHTML={{ __html: `
         @media print {
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
         }
       `}} />
    </div>
  );
}
