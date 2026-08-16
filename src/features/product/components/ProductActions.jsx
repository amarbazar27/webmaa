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
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
           <div className="flex items-center gap-3">
             <MessageSquare size={18} className="text-slate-600 dark:text-slate-400" />
             <h3 className="font-black text-slate-900 dark:text-white">বিশেষ নির্দেশনা</h3>
           </div>
           <textarea
             rows={2}
             maxLength={40}
             placeholder='যেকোনো বিশেষ অনুরোধ লিখুন...'
             className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-slate-900 transition-all resize-none placeholder:text-slate-400"
             value={customerNote}
             onChange={e => setCustomerNote(e.target.value)}
           />
        </div>
      )}

      <button
        onClick={onAddToCart}
        disabled={product.stock === 0 && !product.allowRequest}
        className={`w-full py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${
          product.stock === 0
            ? product.allowRequest
              ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
              : 'bg-red-500/10 border border-red-500/20 text-red-400 cursor-not-allowed shadow-none'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {product.stock === 0 ? (
          product.allowRequest ? (
            <>
              📬 অনুরোধ করুন (Request)
              <span className="bg-white/20 px-3 py-1 rounded-xl text-sm">৳{totalPrice}</span>
            </>
          ) : (
            <span>🚫 স্টক শেষ (Stock Out)</span>
          )
        ) : (
          <>
            <ShoppingCart size={22} strokeWidth={2.5} />
            কার্টে যোগ করুন
            <span className="bg-white/20 px-3 py-1 rounded-xl text-sm">৳{totalPrice}</span>
          </>
        )}
      </button>
    </div>
  );
}
