'use client';
import { ArrowRight, Sparkles } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function EditorialStory({ data, themeVars }) {
  const d = resolveSectionData('editorial_story', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const isDark = d.themeMode !== 'light';

  const alignClass = d.textAlign === 'center' 
    ? 'items-center text-center mx-auto' 
    : d.textAlign === 'right'
    ? 'items-end text-right ml-auto'
    : 'items-start text-left';

  return (
    <div className="px-4 py-6 md:py-8 max-w-[1500px] mx-auto">
      <div className="relative w-full rounded-3xl overflow-hidden min-h-[340px] sm:min-h-[420px] md:min-h-[480px] flex items-center shadow-lg group">
        {/* Background Image */}
        {d.imageUrl && (
          <img
            src={d.imageUrl}
            alt={d.title || 'Editorial Story'}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Gradient Overlay */}
        <div 
          className={`absolute inset-0 ${
            isDark 
              ? 'bg-gradient-to-r from-black/85 via-black/50 to-black/30' 
              : 'bg-gradient-to-r from-white/95 via-white/70 to-white/30'
          }`} 
        />

        {/* Content Box */}
        <div className="relative z-10 w-full p-6 sm:p-10 md:p-16">
          <div className={`max-w-2xl flex flex-col ${alignClass}`}>
            {d.eyebrow && (
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-3 backdrop-blur-md"
                style={{ 
                  background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
                  color: isDark ? '#ffffff' : primary 
                }}
              >
                <Sparkles size={12} className="text-amber-400" />
                {d.eyebrow}
              </div>
            )}

            <h2 
              className={`text-2xl sm:text-3xl md:text-5xl font-black leading-tight tracking-tight mb-4 ${
                isDark ? 'text-white drop-shadow-md' : 'text-slate-900'
              }`}
            >
              {d.title}
            </h2>

            {d.description && (
              <p 
                className={`text-xs sm:text-sm md:text-base font-medium leading-relaxed mb-6 max-w-xl ${
                  isDark ? 'text-slate-200 drop-shadow-sm' : 'text-slate-700'
                }`}
              >
                {d.description}
              </p>
            )}

            <a
              href={d.linkUrl || '#'}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-black text-white transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
              style={{ background: primary }}
            >
              {d.buttonText || 'এক্সপ্লোর করুন'}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
