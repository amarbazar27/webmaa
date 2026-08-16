'use client';
import { useRef } from 'react';

export default function CategoryScroller({ data, themeVars, onCategoryClick }) {
  const scrollRef = useRef(null);
  const items = data?.items || [];
  const primary = themeVars?.primaryColor || '#6D28D9';

  if (!items.length) return null;

  return (
    <div className="py-4 px-4">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onCategoryClick?.(item.label)}
            className="flex-shrink-0 snap-start flex flex-col items-center gap-2 group"
          >
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all group-hover:scale-105 group-active:scale-95 shadow-md"
              style={{ borderColor: primary + '40' }}
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: primary + '15' }}>
                  {item.emoji || '🛍️'}
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-slate-700 text-center max-w-[72px] leading-tight line-clamp-2">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
