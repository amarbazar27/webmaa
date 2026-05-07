'use client';
import { ShoppingCart, MessageSquare } from 'lucide-react';

export default function ProductActions({ 
  product, 
  customerNote, 
  setCustomerNote, 
  onAddToCart, 
  totalPrice 
}) {
  return (
    <div className="space-y-4">
      {product.allowNote && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
           <div className="flex items-center gap-3">
             <MessageSquare size={18} className="text-slate-600" />
             <h3 className="font-black text-slate-900">বিশেষ নির্দেশনা</h3>
           </div>
           <textarea
             rows={2}
             maxLength={40}
             placeholder='যেমন: "বেশি ঝাল দিবেন না"...'
             className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all resize-none"
             value={customerNote}
             onChange={e => setCustomerNote(e.target.value)}
           />
        </div>
      )}

      <button
        onClick={onAddToCart}
        className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-purple-600 transition-all shadow-xl"
      >
        <ShoppingCart size={22} strokeWidth={2.5} />
        কার্টে যোগ করুন
        <span className="bg-white/20 px-3 py-1 rounded-xl text-sm">৳{totalPrice}</span>
      </button>
    </div>
  );
}
