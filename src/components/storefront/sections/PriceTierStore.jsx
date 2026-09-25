'use client';
import { Tag } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function PriceTierStore({ data, themeVars, onTierClick }) {
  const d = resolveSectionData('price_tier_store', data);
  const tiers = d?.tiers || [299, 599, 999];
  const colors = ['#059669', '#0284C7', '#7C3AED', '#D97706'];

  return (
    <div className="px-4 py-6 md:py-8 max-w-[1400px] mx-auto">
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 tracking-tight">
        {d?.title || 'বাজেট কর্নার'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {tiers.map((tier, i) => {
          const isObj = typeof tier === 'object' && tier !== null;
          const displayLabel = isObj 
            ? (tier.label || (tier.price ? `৳${tier.price}` : `টায়ার ${i + 1}`))
            : (typeof tier === 'number' || !isNaN(Number(tier)) ? `৳${tier}` : String(tier));
          const subText = isObj ? (tier.count || tier.subtitle || '') : 'সাশ্রয়ী বাজেট ডিল';
          const clickVal = isObj ? (tier.value || tier.price || tier.label) : tier;
          const keyVal = isObj ? (tier.id || tier.label || i) : (tier ?? i);

          return (
            <button
              key={keyVal}
              onClick={() => onTierClick?.(clickVal)}
              className="rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97] text-white cursor-pointer"
              style={{ background: colors[i % colors.length] }}
            >
              <Tag size={24} className="opacity-90" />
              <div className="text-center">
                <p className="text-xs font-bold opacity-90">
                  {isObj && tier.count ? 'বাজেট জোন' : 'Under'}
                </p>
                <p className="text-base sm:text-lg md:text-xl font-black leading-tight">
                  {displayLabel}
                </p>
                {subText && (
                  <p className="text-[11px] font-bold opacity-85 mt-0.5">
                    {subText}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
