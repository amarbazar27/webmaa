'use client';
import { Tag } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function PriceTierStore({ data, themeVars, onTierClick }) {
  const d = resolveSectionData('price_tier_store', data);
  const tiers = d?.tiers || [299, 599, 999];
  const primary = themeVars?.primaryColor || '#6D28D9';
  const colors = ['#059669', '#0284C7', '#7C3AED', '#D97706'];

  return (
    <div className="px-4 py-6 md:py-8 max-w-[1400px] mx-auto">
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 tracking-tight">
        {d?.title || 'Budget Store'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {tiers.map((tier, i) => (
          <button
            key={tier}
            onClick={() => onTierClick?.(tier)}
            className="rounded-3xl p-5 sm:p-6 flex flex-col items-center gap-2 shadow-sm hover:shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97] text-white cursor-pointer"
            style={{ background: colors[i % colors.length] }}
          >
            <Tag size={24} className="opacity-90" />
            <div className="text-center">
              <p className="text-xs font-black opacity-90 uppercase tracking-wider">Under</p>
              <p className="text-xl sm:text-2xl font-black">৳{tier}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
