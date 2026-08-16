'use client';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AiCustomization({ 
  product, 
  customInput, 
  setCustomInput, 
  aiResult, 
  aiPrice, 
  aiLoading, 
  onCalculate 
}) {
  if (!product.allowCustomize) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-950/40 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/60 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
        <h3 className="font-black text-slate-900 dark:text-white">কাস্টম অর্ডার (AI)</h3>
      </div>

      <textarea
        rows={3}
        maxLength={50}
        placeholder='যেমন: "১৫০ গ্রাম চাই"...'
        className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800/60 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 transition-all resize-none placeholder:text-slate-400"
        value={customInput}
        onChange={e => setCustomInput(e.target.value)}
      />

      {aiResult && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 p-4">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{aiResult}</p>
          {aiPrice !== null && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-black text-purple-700 dark:text-purple-300">৳{aiPrice}</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onCalculate}
        disabled={aiLoading}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
      >
        {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        {aiLoading ? 'গণনা করছে...' : 'মূল্য জানুন'}
      </button>
    </div>
  );
}
