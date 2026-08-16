'use client';
import { Layers } from 'lucide-react';

export default function LegacySizes({ sizes, selectedSize, setSelectedSize, onResetAi }) {
  if (!Array.isArray(sizes) || sizes.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Layers size={18} className="text-slate-600 dark:text-slate-400" />
        <h3 className="font-black text-slate-900 dark:text-white">সাইজ বেছে নিন</h3>
      </div>
      <div className="flex gap-3 flex-wrap">
        {sizes.map((size, idx) => (
          <button
            key={idx}
            onClick={() => { setSelectedSize(size); onResetAi(); }}
            className={`px-5 py-3 rounded-2xl font-black text-sm transition-all border-2 cursor-pointer ${
              selectedSize?.label === size.label
                ? 'bg-purple-600 text-white border-purple-600 shadow-lg scale-105'
                : 'bg-white dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
            }`}
          >
            {size.label}
            <span className={`block text-xs mt-0.5 font-bold ${selectedSize?.label === size.label ? 'text-purple-200' : 'text-slate-400 dark:text-slate-400'}`}>
              ৳{size.price}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
