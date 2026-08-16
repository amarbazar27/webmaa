'use client';
import { Tag } from 'lucide-react';

export default function PriceTierStore({ data, themeVars, onTierClick }) {
  const tiers = data?.tiers || [299, 599, 999];
  const primary = themeVars?.primaryColor || '#6D28D9';
  const colors = ['#059669', '#0284C7', '#7C3AED'];

  return (
    <div className="px-4 py-5">
      <h2 className="text-base font-black text-slate-900 mb-4">{data?.title || 'Budget Store'}</h2>
      <div className="grid grid-cols-3 gap-3">
        {tiers.map((tier, i) => (
          <button
            key={tier}
            onClick={() => onTierClick?.(tier)}
            className="rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-all hover:scale-[1.03] active:scale-[0.97] text-white"
            style={{ background: colors[i % colors.length] }}
          >
            <Tag size={20} className="opacity-80" />
            <div className="text-center">
              <p className="text-xs font-black opacity-80">Under</p>
              <p className="text-lg font-black">৳{tier}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
