'use client';
import { useRef } from 'react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function CategoryScroller({ data, themeVars, onCategoryClick }) {
  const d = resolveSectionData('category_scroller', data);
  const scrollRef = useRef(null);
  const rawList = (d.items && d.items.length > 0) 
    ? d.items 
    : (d.categories && d.categories.length > 0)
      ? d.categories.map(c => ({
          label: c.name || c.label || c.title,
          imageUrl: c.imageUrl || c.image,
          emoji: c.emoji || c.icon,
        }))
      : [];
  const items = rawList;
  const primary = themeVars?.primaryColor || '#6D28D9';

  if (!items.length) return null;

  return (
    <div className="py-5 px-4 max-w-[1400px] mx-auto">
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2"
      >
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onCategoryClick?.(item.label)}
            className="flex-shrink-0 snap-start flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 transition-all duration-300 group-hover:scale-105 group-active:scale-95 shadow-md bg-white flex items-center justify-center"
              style={{ borderColor: `${primary}30` }}
            >
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.label} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl" style={{ background: `${primary}15` }}>
                  {item.emoji || '🛍️'}
                </div>
              )}
            </div>
            <span className="text-xs font-black text-slate-700 text-center max-w-[76px] leading-tight line-clamp-2 group-hover:text-slate-950 transition-colors">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
