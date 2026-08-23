'use client';
import { Gift, ShoppingCart } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function BundleSection({ data, themeVars, onAddBundle }) {
  const d = resolveSectionData('bundle_section', data);
  const bundles = d?.bundles || [];
  const primary = themeVars?.primaryColor || '#6D28D9';
  if (!bundles.length) return null;

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: `${primary}15` }}>
          <Gift size={18} style={{ color: primary }} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {d?.title || 'Bundle Deals'}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {bundles.map((bundle, i) => (
          <div 
            key={i} 
            className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col justify-between"
          >
            {bundle.imageUrl && (
              <div className="relative aspect-[16/9] bg-slate-50 overflow-hidden">
                <img 
                  src={bundle.imageUrl} 
                  alt={bundle.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  loading="lazy"
                />
              </div>
            )}

            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base mb-1">{bundle.title}</h3>
                {bundle.description && (
                  <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed mb-2">
                    {bundle.description}
                  </p>
                )}
                {bundle.items && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {bundle.items.split(',').map((item, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div>
                  <p className="text-base sm:text-lg font-black" style={{ color: primary }}>
                    ৳{Number(bundle.price).toLocaleString()}
                  </p>
                  {bundle.originalPrice && Number(bundle.originalPrice) > Number(bundle.price) && (
                    <p className="text-[11px] text-slate-400">
                      <span className="line-through">৳{Number(bundle.originalPrice).toLocaleString()}</span>
                      <span className="ml-1 font-bold text-emerald-600">Save ৳{(Number(bundle.originalPrice) - Number(bundle.price)).toLocaleString()}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onAddBundle?.(bundle)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black text-white transition-all hover:scale-105 active:scale-95 shadow cursor-pointer"
                  style={{ background: primary }}
                >
                  <ShoppingCart size={13} /> কম্বো নিন
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
