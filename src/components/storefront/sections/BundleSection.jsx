'use client';
import { Gift, ShoppingCart } from 'lucide-react';

export default function BundleSection({ data, themeVars, onAddBundle }) {
  const bundles = data?.bundles || [];
  const primary = themeVars?.primaryColor || '#6D28D9';
  if (!bundles.length) return null;

  return (
    <div className="px-4 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Gift size={18} style={{ color: primary }} />
        <h2 className="text-base font-black text-slate-900">{data?.title || 'Bundle Deals'}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bundles.map((bundle, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all">
            {bundle.imageUrl && <img src={bundle.imageUrl} alt={bundle.title} className="w-full h-36 object-cover" />}
            <div className="p-3">
              <h3 className="font-black text-slate-800 text-sm mb-1">{bundle.title}</h3>
              {bundle.description && <p className="text-xs text-slate-500 mb-2 font-medium line-clamp-2">{bundle.description}</p>}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-black" style={{ color: primary }}>৳{bundle.price?.toLocaleString()}</p>
                  {bundle.originalPrice && (
                    <p className="text-[10px] text-slate-400">
                      <span className="line-through">৳{bundle.originalPrice.toLocaleString()}</span>
                      <span className="ml-1 font-bold text-emerald-600">Save ৳{(bundle.originalPrice - bundle.price).toLocaleString()}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onAddBundle?.(bundle)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95 shadow"
                  style={{ background: primary }}
                >
                  <ShoppingCart size={12} /> Add Bundle
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
