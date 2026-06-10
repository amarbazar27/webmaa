'use client';

import { useEffect } from 'react';
import { ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';

export default function SuperadminError({ error, reset }) {
  useEffect(() => {
    console.error('[SuperAdmin Error]', error?.message, error?.stack);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-color, #f8fafc)' }}>
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
          <ShieldAlert size={36} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3">SuperAdmin Panel Error</h1>
        <p className="text-slate-500 font-bold text-sm leading-relaxed mb-2">
          SuperAdmin প্যানেল লোড করতে একটি সমস্যা হয়েছে।
        </p>
        {error?.message && (
          <p className="text-xs font-mono text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl mb-6 text-left break-all">
            {error.message}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
          >
            <RefreshCw size={16} />
            আবার চেষ্টা করুন
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
          >
            <ArrowLeft size={16} />
            হোমে যান
          </a>
        </div>
      </div>
    </div>
  );
}
