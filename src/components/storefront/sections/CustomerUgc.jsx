'use client';
import { Star, CheckCircle, ShoppingBag } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function CustomerUgc({ data, themeVars, onAddToCart }) {
  const d = resolveSectionData('customer_ugc', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const stories = d.stories || [];

  if (!stories.length) return null;

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          {d.title || 'Customer UGC & Stories'}
        </h2>
        {d.subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium">{d.subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {stories.map((story, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
          >
            {/* Customer Photo */}
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
              {story.imageUrl && (
                <img
                  src={story.imageUrl}
                  alt={story.userName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              )}
              {story.rating && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-400 flex items-center gap-1 text-xs font-black">
                  <Star size={12} fill="currentColor" />
                  <span className="text-white text-[11px]">{story.rating}.0</span>
                </div>
              )}
            </div>

            {/* Content & Buyer Info */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black text-slate-900">{story.userName}</span>
                  <CheckCircle size={14} className="text-emerald-500" />
                  {story.city && (
                    <span className="text-[10px] text-slate-400 font-bold">({story.city})</span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                  "{story.text}"
                </p>
              </div>

              {/* Tagged product pill */}
              {story.productName && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ক্রয়কৃত পণ্য</p>
                    <p className="text-xs font-black text-slate-800 truncate">{story.productName}</p>
                  </div>
                  {story.productPrice && (
                    <span className="text-xs font-black" style={{ color: primary }}>
                      ৳{Number(story.productPrice).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
