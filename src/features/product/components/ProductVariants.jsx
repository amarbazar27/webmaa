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
        <div key={vIdx} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-slate-600 dark:text-slate-400" />
            <h3 className="font-black text-slate-900 dark:text-white">{variant.name} বেছে নিন</h3>
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
                  className={`min-w-[4rem] px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 flex flex-col items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-600 text-purple-700 dark:text-purple-300 shadow-sm ring-1 ring-purple-600'
                      : 'bg-white dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
                >
                  {opt.label}
                  {parseFloat(opt.price) > 0 && (
                    <span className={`block text-[10px] mt-0.5 font-bold ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}>
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
