'use client';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function BentoMosaic({ data, themeVars }) {
  const d = resolveSectionData('bento_mosaic', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const tiles = d.tiles || [];

  if (!tiles.length) return null;

  const largeTile = tiles.find(t => t.size === 'large') || tiles[0];
  const smallTiles = tiles.filter(t => t !== largeTile).slice(0, 3);

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          {d.title || 'Trending Bento Mosaic'}
        </h2>
        {d.subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium">{d.subtitle}</p>}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Large Feature Card (Spans 7 cols on md) */}
        {largeTile && (
          <div className="md:col-span-7 relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 min-h-[300px] md:min-h-[420px] group bg-slate-950">
            {largeTile.imageUrl && (
              <img
                src={largeTile.imageUrl}
                alt={largeTile.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            
            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between">
              {largeTile.tag && (
                <span 
                  className="self-start px-3 py-1 rounded-full text-xs font-black text-white shadow-md uppercase tracking-wider"
                  style={{ background: primary }}
                >
                  {largeTile.tag}
                </span>
              )}
              
              <div>
                {largeTile.subtitle && (
                  <p className="text-xs sm:text-sm font-bold text-white/80 uppercase tracking-widest mb-1">
                    {largeTile.subtitle}
                  </p>
                )}
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight mb-3">
                  {largeTile.title}
                </h3>
                <div className="flex items-center justify-between">
                  {largeTile.price && (
                    <span className="text-lg sm:text-xl font-black text-white">
                      {largeTile.price}
                    </span>
                  )}
                  <a
                    href={largeTile.linkUrl || '#'}
                    className="w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg"
                  >
                    <ArrowUpRight size={18} strokeWidth={2.5} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3 Smaller Bento Cards (Spans 5 cols on md) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          {smallTiles.map((tile, idx) => (
            <a
              key={idx}
              href={tile.linkUrl || '#'}
              className="relative rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 min-h-[120px] md:min-h-[130px] flex-1 group bg-slate-900 flex items-center p-4 sm:p-5"
            >
              {tile.imageUrl && (
                <img
                  src={tile.imageUrl}
                  alt={tile.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
                  loading="lazy"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />

              <div className="relative z-10 w-full flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {tile.tag && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
                      {tile.tag}
                    </span>
                  )}
                  <h4 className="text-sm sm:text-base font-black text-white leading-tight line-clamp-1">
                    {tile.title}
                  </h4>
                  {tile.price && (
                    <p className="text-xs sm:text-sm font-bold text-white/90 mt-0.5">
                      {tile.price}
                    </p>
                  )}
                </div>

                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur text-white flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
