'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Store } from 'lucide-react';
import { subscribeGlobalConfig } from '@/lib/firestore';
import PricingSection from '@/components/home/PricingSection';

export default function PricingPage() {
  const [globalConfig, setGlobalConfig] = useState(null);

  useEffect(() => {
    const unsub = subscribeGlobalConfig((config) => {
      setGlobalConfig(config);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 w-full px-6 py-4 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-slate-600 hover:text-slate-900 transition-all text-xs font-black uppercase tracking-wider">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>হোমপেজে ফিরুন</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/become-retailer" 
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5"
            >
              <Store size={13} /> মার্চেন্ট আবেদন
            </Link>
          </div>
        </div>
      </header>

      {/* Pricing Content */}
      <main className="flex-1">
        <PricingSection globalConfig={globalConfig} />
      </main>

      {/* Simple Footer */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 font-medium">
        <p>© {new Date().getFullYear()} {globalConfig?.brandName || 'BDRetailers'}. সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
    </div>
  );
}
