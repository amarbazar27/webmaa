'use client';
import { useState } from 'react';
import { ShoppingCart, Plus, X, Sparkles } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function ShopTheLook({ data, themeVars, onAddToCart, onProductClick }) {
  const d = resolveSectionData('shop_the_look', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const hotspots = d.hotspots || [];
  const [activeHotspot, setActiveHotspot] = useState(hotspots[0] || null);

  const handleAdd = (product, e) => {
    e?.stopPropagation();
    if (onAddToCart) {
      onAddToCart({
        id: product.id || `look-${Date.now()}`,
        name: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
      });
    }
  };

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider mb-1" style={{ color: primary }}>
            <Sparkles size={13} />
            Visual Shopping
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {d.title || 'Shop The Look'}
          </h2>
          {d.subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium">{d.subtitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Main Image with Hotspot Pins */}
        <div className="lg:col-span-8 relative rounded-3xl overflow-hidden shadow-md bg-slate-950 aspect-[4/3] sm:aspect-[16/10] group select-none">
          {d.imageUrl && (
            <img
              src={d.imageUrl}
              alt={d.title || 'Shop The Look Room'}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              loading="lazy"
            />
          )}

          {/* Interactive Hotspot Pins */}
          {hotspots.map((hs, i) => {
            const isActive = activeHotspot?.id === hs.id;
            return (
              <div
                key={hs.id || i}
                style={{ top: `${hs.y}%`, left: `${hs.x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              >
                <button
                  onClick={() => setActiveHotspot(isActive ? null : hs)}
                  className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isActive 
                      ? 'scale-110 ring-4 ring-white' 
                      : 'hover:scale-110 hover:ring-2 hover:ring-white/80'
                  }`}
                  style={{ background: primary }}
                  aria-label={`View ${hs.title}`}
                >
                  {/* Ping Animation Ring */}
                  <span 
                    className="absolute inset-0 rounded-full animate-ping opacity-75"
                    style={{ background: primary }}
                  />
                  <Plus size={16} className="text-white relative z-10 font-bold" strokeWidth={3} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Product Card Side Panel */}
        <div className="lg:col-span-4 flex flex-col justify-center">
          {activeHotspot ? (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xl space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700">
                  Featured in this look
                </span>
                <button 
                  onClick={() => setActiveHotspot(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              {activeHotspot.imageUrl && (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-50">
                  <img
                    src={activeHotspot.imageUrl}
                    alt={activeHotspot.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h3 className="text-base font-black text-slate-900 line-clamp-1 mb-1">
                  {activeHotspot.title}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black" style={{ color: primary }}>
                    ৳{Number(activeHotspot.price).toLocaleString()}
                  </span>
                  {activeHotspot.originalPrice && (
                    <span className="text-xs text-slate-400 line-through font-bold">
                      ৳{Number(activeHotspot.originalPrice).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => handleAdd(activeHotspot, e)}
                className="w-full py-3 rounded-2xl text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-500/20"
                style={{ background: primary }}
              >
                <ShoppingCart size={15} /> কার্টে যোগ করুন
              </button>
            </div>
          ) : (
            <div className="bg-slate-50/80 rounded-3xl p-8 border border-dashed border-slate-200 text-center space-y-2">
              <p className="text-sm font-black text-slate-700">পিনগুলোতে ক্লিক করুন</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                ছবিতে থাকা যেকোনো প্লাস (+) পিনে ট্যাপ করে প্রোডাক্টের দাম দেখুন ও সরাসরি অর্ডার করুন।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
