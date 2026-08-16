'use client';
export default function ConcernGrid({ data, themeVars, onConcernClick }) {
  const items = data?.items || [];
  const primary = themeVars?.primaryColor || '#6D28D9';
  if (!items.length) return null;

  return (
    <div className="px-4 py-5">
      <h2 className="text-base font-black text-slate-900 mb-4">{data?.title || 'Shop by Concern'}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onConcernClick?.(item.tag)}
            className="relative rounded-2xl overflow-hidden h-24 md:h-32 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] text-left group"
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="absolute inset-0" style={{ background: item.color || primary + '20' }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              {item.emoji && <div className="text-xl mb-0.5">{item.emoji}</div>}
              <p className="text-white text-xs font-black leading-tight">{item.label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
