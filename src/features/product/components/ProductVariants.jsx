'use client';
import { Layers } from 'lucide-react';

export default function ProductVariants({ 
  variants, 
  selectedVariants, 
  setSelectedVariants,
  onResetAi
}) {
  if (!Array.isArray(variants) || variants.length === 0) return null;

  return (
    <div className="space-y-4">
      {variants.map((variant, vIdx) => (
        <div key={vIdx} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-slate-600" />
            <h3 className="font-black text-slate-900">{variant.name} বেছে নিন</h3>
          </div>
          <div className="flex gap-3 flex-wrap">
            {variant.options?.map((opt, oIdx) => {
              const isSelected = selectedVariants[variant.name]?.label === opt.label;
              return (
                <button
                  key={oIdx}
                  onClick={() => {
                    setSelectedVariants(prev => ({ ...prev, [variant.name]: opt }));
                    onResetAi();
                  }}
                  className={`min-w-[4rem] px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm ring-1 ring-purple-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
                >
                  {opt.label}
                  {parseFloat(opt.price) > 0 && (
                    <span className={`block text-[10px] mt-0.5 font-bold ${isSelected ? 'text-purple-600' : 'text-slate-500'}`}>
                      ৳{opt.price}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
