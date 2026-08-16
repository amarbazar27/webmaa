'use client';
import { Minus, Plus } from 'lucide-react';

export default function ProductQuantity({ qty, setQty, onQtyChange, basePrice }) {
  const handleInput = (e) => {
    const v = parseInt(e.target.value);
    if (!isNaN(v) && v >= 1) setQty(v);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h3 className="font-black text-slate-900 dark:text-white mb-4">পরিমাণ</h3>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onQtyChange(-1)}
          className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors font-black border border-slate-200 dark:border-slate-600 cursor-pointer"
        >
          <Minus size={18} strokeWidth={2.5} />
        </button>
        <input
          type="number"
          min="1"
          max="999"
          value={qty}
          onChange={handleInput}
          className="w-20 text-center text-2xl font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 outline-none focus:border-purple-600 transition-colors"
        />
        <button
          onClick={() => onQtyChange(1)}
          className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors font-black shadow-lg cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">মোট মূল্য</p>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-300">৳{(basePrice * qty).toFixed(0)}</p>
        </div>
      </div>
    </div>
  );
}
