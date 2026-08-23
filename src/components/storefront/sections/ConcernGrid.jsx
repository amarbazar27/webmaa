'use client';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function ConcernGrid({ data, themeVars, onConcernClick }) {
  const d = resolveSectionData('concern_grid', data);
  const items = d?.items || [];
  const primary = themeVars?.primaryColor || '#6D28D9';
  if (!items.length) return null;

  return (
    <div className="px-4 py-6 md:py-8 max-w-[1400px] mx-auto">
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 tracking-tight">
        {d?.title || 'Shop by Concern'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onConcernClick?.(item.tag || item.label)}
            className="relative rounded-3xl overflow-hidden h-28 sm:h-36 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer text-left"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0" style={{ background: item.color || `${primary}20` }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
              {item.emoji && <div className="text-xl sm:text-2xl mb-1">{item.emoji}</div>}
              <p className="text-white text-xs sm:text-sm font-black leading-tight">{item.label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
