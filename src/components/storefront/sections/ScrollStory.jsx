'use client';
import { Sparkles, ArrowRight } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function ScrollStory({ data, themeVars }) {
  const d = resolveSectionData('scroll_story', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const steps = d.steps || [];

  if (!steps.length) return null;

  return (
    <div className="px-4 py-8 md:py-12 max-w-[1400px] mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
          {d.title || 'Brand Story & Process'}
        </h2>
        {d.subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            {d.subtitle}
          </p>
        )}
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col space-y-4 group"
          >
            {/* Step Image */}
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-50">
              {step.imageUrl && (
                <img
                  src={step.imageUrl}
                  alt={step.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              )}
              <div 
                className="absolute top-3 left-3 w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg"
                style={{ background: primary }}
              >
                {step.stepNumber || `0${idx + 1}`}
              </div>
            </div>

            {/* Step Details */}
            <div className="space-y-1.5 flex-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
