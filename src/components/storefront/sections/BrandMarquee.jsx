'use client';
export default function BrandMarquee({ data }) {
  const brands = data?.brands || [];
  if (!brands.length) return null;
  // Duplicate for seamless loop
  const doubled = [...brands, ...brands];

  return (
    <div className="py-5 overflow-hidden border-y border-slate-100 bg-white">
      {data?.title && <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{data.title}</p>}
      <div className="flex animate-marquee-infinite gap-8" style={{ width: 'max-content' }}>
        {doubled.map((brand, i) => (
          <div key={i} className="flex-shrink-0 flex items-center justify-center h-10 px-4">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-8 md:h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100" />
            ) : (
              <span className="text-sm font-black text-slate-400 hover:text-slate-700 transition-colors tracking-tight whitespace-nowrap">{brand.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
