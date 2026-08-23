'use client';
import { Sparkles, ArrowRight } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function MoodBoard({ data, themeVars, onMoodClick }) {
  const d = resolveSectionData('mood_board', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const moods = d.moods || [];

  if (!moods.length) return null;

  return (
    <div className="px-4 py-6 md:py-8 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {d.title || 'Shop by Mood & Occasion'}
          </h2>
          {d.subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium">{d.subtitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {moods.map((mood, idx) => (
          <button
            key={idx}
            onClick={() => onMoodClick?.(mood.tag || mood.title)}
            className="group relative rounded-3xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 text-left cursor-pointer"
          >
            {mood.imageUrl && (
              <img
                src={mood.imageUrl}
                alt={mood.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between">
              {mood.emoji && (
                <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg shadow-md self-start">
                  {mood.emoji}
                </div>
              )}

              <div>
                {mood.subtitle && (
                  <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                    {mood.subtitle}
                  </span>
                )}
                <h3 className="text-sm sm:text-base md:text-lg font-black text-white leading-tight mb-2">
                  {mood.title}
                </h3>
                <div className="flex items-center gap-1 text-[11px] font-bold text-white/80 group-hover:text-white transition-colors">
                  <span>কালেকশন দেখুন</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
