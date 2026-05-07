'use client';
import { Layers } from 'lucide-react';

export default function LegacySizes({ sizes, selectedSize, setSelectedSize, onResetAi }) {
  if (!Array.isArray(sizes) || sizes.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Layers size={18} className="text-slate-600" />
        <h3 className="font-black text-slate-900">সাইজ বেছে নিন</h3>
      </div>
      <div className="flex gap-3 flex-wrap">
        {sizes.map((size, idx) => (
          <button
            key={idx}
            onClick={() => { setSelectedSize(size); onResetAi(); }}
            className={`px-5 py-3 rounded-2xl font-black text-sm transition-all border-2 ${
              selectedSize?.label === size.label
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105'
                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-400 hover:text-purple-700'
            }`}
          >
            {size.label}
            <span className={`block text-xs mt-0.5 font-bold ${selectedSize?.label === size.label ? 'text-slate-300' : 'text-slate-400'}`}>
              ৳{size.price}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
