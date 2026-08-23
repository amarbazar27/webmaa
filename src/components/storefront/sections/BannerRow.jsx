'use client';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function BannerRow({ data }) {
  const d = resolveSectionData('banner_row', data);
  const banners = d?.banners || [];
  if (!banners.length) return null;
  const cols = banners.length === 1 ? 'grid-cols-1' : banners.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';

  return (
    <div className={`px-4 py-5 max-w-[1400px] mx-auto grid ${cols} gap-4`}>
      {banners.map((b, i) => (
        <a 
          key={i} 
          href={b.linkUrl || '#'} 
          className="group block rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative aspect-[16/7] bg-slate-900"
        >
          {b.imageUrl && (
            <img 
              src={b.imageUrl} 
              alt={b.title || `Banner ${i + 1}`} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" 
              loading="lazy"
            />
          )}
          {b.title && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-5">
              <span className="text-white text-sm sm:text-base font-black tracking-tight">{b.title}</span>
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
