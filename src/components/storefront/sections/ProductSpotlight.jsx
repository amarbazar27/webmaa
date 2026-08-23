'use client';
import { useState } from 'react';
import { ShoppingCart, Star, Plus, Minus, CheckCircle, ShieldCheck } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function ProductSpotlight({ data, themeVars, onAddToCart }) {
  const d = resolveSectionData('product_spotlight', data);
  const primary = themeVars?.primaryColor || '#6D28D9';

  const [selectedVariant, setSelectedVariant] = useState(d.variants?.[0] || '');
  const [qty, setQty] = useState(1);

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart({
        id: 'spotlight-prod',
        name: d.title,
        price: d.price || 1850,
        variant: selectedVariant,
        quantity: qty,
        imageUrl: d.imageUrl,
      });
    }
  };

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 border border-slate-100 shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Product Image Column */}
          <div className="lg:col-span-6">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 group shadow-inner">
              {d.imageUrl && (
                <img
                  src={d.imageUrl}
                  alt={d.title || 'Spotlight Product'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              )}
              {d.originalPrice && d.price && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-black shadow-lg">
                  -{Math.round((1 - d.price / d.originalPrice) * 100)}% OFF
                </div>
              )}
            </div>
          </div>

          {/* Product Details & Purchase Form Column */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
            {d.eyebrow && (
              <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: primary }}>
                {d.eyebrow}
              </span>
            )}

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {d.title}
            </h2>

            {/* Rating Stars */}
            {d.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <span className="text-xs font-black text-slate-700">
                  {d.rating} {d.reviewCount ? `(${d.reviewCount} কাস্টমার রিভিউ)` : ''}
                </span>
              </div>
            )}

            {/* Price Box */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-2xl sm:text-3xl font-black" style={{ color: primary }}>
                ৳{Number(d.price).toLocaleString()}
              </span>
              {d.originalPrice && (
                <span className="text-base text-slate-400 line-through font-bold">
                  ৳{Number(d.originalPrice).toLocaleString()}
                </span>
              )}
            </div>

            {d.description && (
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {d.description}
              </p>
            )}

            {/* Variant Selector */}
            {d.variants && d.variants.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                  ভ্যারিয়েন্ট নির্বাচন করুন
                </label>
                <div className="flex flex-wrap gap-2">
                  {d.variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedVariant === v
                          ? 'text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      style={selectedVariant === v ? { background: primary } : {}}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Benefit Bullets */}
            {d.bulletPoints && d.bulletPoints.length > 0 && (
              <div className="py-2 space-y-1.5 border-y border-slate-100">
                {d.bulletPoints.map((pt, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Stepper & Add to Cart */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-xs font-black text-slate-900">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="flex-1 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                style={{ background: primary }}
              >
                <ShoppingCart size={16} />
                {d.buttonText || 'কার্টে যোগ করুন'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
