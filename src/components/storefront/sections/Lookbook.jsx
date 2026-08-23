'use client';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function Lookbook({ data, themeVars }) {
  const d = resolveSectionData('lookbook', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const looks = d.looks || [];

  if (!looks.length) return null;

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          {d.title || 'Curated Lookbook'}
        </h2>
        {d.subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium">{d.subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {looks.map((look, idx) => (
          <div
            key={idx}
            className="group relative rounded-3xl overflow-hidden aspect-[3/4] bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col justify-end p-6"
          >
            {look.imageUrl && (
              <img
                src={look.imageUrl}
                alt={look.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                {look.tag && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                    {look.tag}
                  </span>
                )}
                {look.itemCount && (
                  <span className="text-[11px] font-bold text-white/80">
                    {look.itemCount} টি পণ্য
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                {look.title}
              </h3>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-white/90 group-hover:text-white transition-colors">
                  লুকবুক এক্সপ্লোর করুন
                </span>
                <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg">
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
