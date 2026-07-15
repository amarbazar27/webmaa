'use client';
import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Storefront Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
      <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mb-6 shadow-sm border border-red-200">
        <AlertCircle size={40} strokeWidth={2.5} />
      </div>
      
      <h2 className="text-2xl font-black text-slate-900 mb-3">দুঃখিত, কোনো সমস্যা হয়েছে!</h2>
      <p className="text-slate-500 font-bold mb-8 max-w-sm leading-relaxed">
        আমাদের সিস্টেমে সাময়িক ত্রুটি দেখা দিয়েছে। দয়া করে আবার চেষ্টা করুন।
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={() => reset()}
          className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-slate-50 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer border-0"
        >
          <RefreshCw size={18} strokeWidth={2.5} /> আবার চেষ্টা করুন
        </button>
        
        <a
          href="/"
          className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <Home size={18} strokeWidth={2.5} /> হোমে ফিরে যান
        </a>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 w-full max-w-sm">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Error Ref: {error.digest || 'Internal Runtime Exception'}
        </p>
      </div>
    </div>
  );
}
