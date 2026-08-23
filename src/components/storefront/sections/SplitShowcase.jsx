'use client';
import { ShoppingCart, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function SplitShowcase({ data, themeVars, onAddToCart, onProductClick }) {
  const d = resolveSectionData('split_showcase', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  
  const isImageRight = d.imagePosition === 'right';
  const ratio = d.layoutRatio || '50/50';
  
  // Grid column classes based on ratio
  let leftCol = 'lg:w-1/2';
  let rightCol = 'lg:w-1/2';
  if (ratio === '40/60') {
    leftCol = isImageRight ? 'lg:w-3/5' : 'lg:w-2/5';
    rightCol = isImageRight ? 'lg:w-2/5' : 'lg:w-3/5';
  } else if (ratio === '60/40') {
    leftCol = isImageRight ? 'lg:w-2/5' : 'lg:w-3/5';
    rightCol = isImageRight ? 'lg:w-3/5' : 'lg:w-2/5';
  }

  const handlePrimaryClick = () => {
    if (onAddToCart) {
      onAddToCart({
        id: 'split-item',
        name: d.title,
        price: d.price || 3490,
        imageUrl: d.imageUrl,
      });
    }
  };

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div 
        className="rounded-3xl overflow-hidden shadow-sm border border-slate-100/80 transition-all hover:shadow-md"
        style={{ background: d.bgColor || '#f8fafc' }}
      >
        <div className={`flex flex-col ${isImageRight ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center`}>
          {/* Image Side */}
          <div className={`w-full ${leftCol} relative overflow-hidden group`}>
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-square w-full bg-slate-900/5">
              {d.imageUrl && (
                <img
                  src={d.imageUrl}
                  alt={d.title || 'Product Showcase'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              )}
              {d.badgeText && (
                <div className="absolute top-4 left-4 z-10 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-black tracking-wide flex items-center gap-1.5 shadow-lg">
                  <Sparkles size={12} className="text-amber-400" />
                  {d.badgeText}
                </div>
              )}
            </div>
          </div>

          {/* Content Side */}
          <div className={`w-full ${rightCol} p-6 sm:p-8 md:p-12 flex flex-col justify-center`}>
            {d.eyebrow && (
              <span 
                className="inline-block text-[11px] md:text-xs font-black uppercase tracking-[0.2em] mb-2.5"
                style={{ color: primary }}
              >
                {d.eyebrow}
              </span>
            )}
            
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-3 tracking-tight">
              {d.title}
            </h2>

            {d.description && (
              <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium leading-relaxed mb-5">
                {d.description}
              </p>
            )}

            {/* Bullet Points if provided */}
            {d.bulletPoints && d.bulletPoints.length > 0 && (
              <div className="space-y-2 mb-6">
                {d.bulletPoints.map((pt, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Price & Discount */}
            {d.price && (
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-2xl sm:text-3xl font-black text-slate-900" style={{ color: primary }}>
                  ৳{Number(d.price).toLocaleString()}
                </span>
                {d.originalPrice && Number(d.originalPrice) > Number(d.price) && (
                  <>
                    <span className="text-sm sm:text-base text-slate-400 line-through font-bold">
                      ৳{Number(d.originalPrice).toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-600 text-xs font-black">
                      Save ৳{(Number(d.originalPrice) - Number(d.price)).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePrimaryClick}
                className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: primary }}
              >
                <ShoppingCart size={16} />
                {d.buttonText || 'এখনই অর্ডার করুন'}
              </button>

              {d.secondaryButtonText && (
                <a
                  href={d.linkUrl || '#'}
                  className="px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-black text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {d.secondaryButtonText}
                  <ArrowRight size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
