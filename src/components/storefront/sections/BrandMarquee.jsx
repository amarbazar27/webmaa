'use client';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function BrandMarquee({ data }) {
  const d = resolveSectionData('brand_marquee', data);
  const brands = d?.brands || [];
  if (!brands.length) return null;
  const doubled = [...brands, ...brands];

  return (
    <div className="py-6 overflow-hidden border-y border-slate-100 bg-white">
      {d?.title && (
        <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
          {d.title}
        </p>
      )}
      <div className="flex animate-marquee-infinite gap-8 items-center" style={{ width: 'max-content' }}>
        {doubled.map((brand, i) => (
          <div key={i} className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
            {brand.logoUrl ? (
              <img 
                src={brand.logoUrl} 
                alt={brand.name} 
                className="h-7 sm:h-9 w-auto object-contain grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" 
              />
            ) : (
              <span className="text-xs sm:text-sm font-black text-slate-600 hover:text-slate-900 transition-colors tracking-tight whitespace-nowrap">
                {brand.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
