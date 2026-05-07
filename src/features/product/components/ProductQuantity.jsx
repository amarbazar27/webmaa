'use client';
import { Minus, Plus } from 'lucide-react';

export default function ProductQuantity({ qty, setQty, onQtyChange, basePrice }) {
  const handleInput = (e) => {
    const v = parseInt(e.target.value);
    if (!isNaN(v) && v >= 1) setQty(v);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <h3 className="font-black text-slate-900 mb-4">পরিমাণ</h3>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onQtyChange(-1)}
          className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors font-black border border-slate-200"
        >
          <Minus size={18} strokeWidth={2.5} />
        </button>
        <input
          type="number"
          min="1"
          max="999"
          value={qty}
          onChange={handleInput}
          className="w-20 text-center text-2xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl py-2.5 outline-none focus:border-purple-600 transition-colors"
        />
        <button
          onClick={() => onQtyChange(1)}
          className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors font-black shadow-lg"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-500 font-bold">মোট মূল্য</p>
          <p className="text-2xl font-black text-purple-700">৳{(basePrice * qty).toFixed(0)}</p>
        </div>
      </div>
    </div>
  );
}
