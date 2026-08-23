'use client';
import { useState } from 'react';
import { Play, ShoppingCart, X, Sparkles } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function ShoppableVideo({ data, themeVars, onAddToCart }) {
  const d = resolveSectionData('shoppable_video', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const [isPlaying, setIsPlaying] = useState(false);

  const taggedProduct = d.taggedProduct || {
    name: 'প্রিমিয়াম পণ্য',
    price: 1850,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&auto=format&fit=crop&q=80',
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart({
        id: taggedProduct.id || 'shoppable-prod',
        name: taggedProduct.name,
        price: taggedProduct.price,
        imageUrl: taggedProduct.imageUrl,
      });
    }
  };

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          {d.title || 'Shoppable Video Reels'}
        </h2>
        {d.subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium">{d.subtitle}</p>}
      </div>

      <div className="relative max-w-sm mx-auto sm:max-w-md md:max-w-lg aspect-[9/16] rounded-3xl overflow-hidden bg-slate-950 shadow-2xl group select-none">
        {/* Video Thumbnail / Background */}
        {d.thumbnail && (
          <img
            src={d.thumbnail}
            alt={d.title || 'Shoppable Video'}
            className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Ambient Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

        {/* Play Button Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl text-white backdrop-blur-md transition-transform group-hover:scale-110"
              style={{ background: primary }}
            >
              <Play size={24} fill="currentColor" className="ml-1" />
            </div>
          </div>
        )}

        {/* Top Header Badge */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Shoppable Reel
          </span>
        </div>

        {/* Floating Tagged Product Card Bottom Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-white/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {taggedProduct.imageUrl && (
              <img
                src={taggedProduct.imageUrl}
                alt={taggedProduct.name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-slate-100"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-900 truncate">
                {taggedProduct.name}
              </h4>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-black" style={{ color: primary }}>
                  ৳{Number(taggedProduct.price).toLocaleString()}
                </span>
                {taggedProduct.originalPrice && (
                  <span className="text-[10px] text-slate-400 line-through">
                    ৳{Number(taggedProduct.originalPrice).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="px-3.5 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1 shadow transition-transform hover:scale-105 active:scale-95 flex-shrink-0 cursor-pointer"
              style={{ background: primary }}
            >
              <ShoppingCart size={13} />
              কিনুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
