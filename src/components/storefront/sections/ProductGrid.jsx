'use client';
import { useState } from 'react';
import { ShoppingCart, Heart, Star } from 'lucide-react';

export default function ProductGrid({ data, products, themeVars, onAddToCart, onProductClick }) {
  const [activeTab, setActiveTab] = useState(0);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const tabs = data?.tabs || ['all'];
  const maxProducts = data?.maxProducts || 12;

  const tabLabels = {
    trending: '🔥 ট্রেন্ডিং',
    new: '✨ নতুন',
    bestseller: '⭐ বেস্টসেলার',
    all: 'সব পণ্য',
  };

  const getTabProducts = (tab) => {
    if (!products?.length) return [];
    let list = [...products];
    if (tab === 'new') list = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (tab === 'bestseller') list = list.sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
    if (tab === 'trending') list = list.sort((a, b) => (b.viewCount || b.orderCount || 0) - (a.viewCount || a.orderCount || 0));
    return list.slice(0, maxProducts);
  };

  const displayProducts = getTabProducts(tabs[activeTab]);

  return (
    <div className="px-4 py-5">
      {/* Section Title */}
      {data?.title && <h2 className="text-base font-black text-slate-900 mb-3">{data.title}</h2>}

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all ${
                i === activeTab ? 'text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={i === activeTab ? { background: primary } : {}}
            >
              {tabLabels[tab] || tab}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {displayProducts.map(product => {
          const price = product.price || product.variants?.[0]?.price || 0;
          const originalPrice = product.originalPrice || product.compareAtPrice;
          const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;
          const rating = product.rating || product.avgRating;
          const reviewCount = product.reviewCount || product.numReviews;

          return (
            <div
              key={product.id}
              className="group bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => onProductClick?.(product)}
            >
              <div className="relative aspect-square bg-slate-50 overflow-hidden">
                <img
                  src={product.imageUrl || product.images?.[0]}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {discount > 0 && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg text-[10px] font-black text-white" style={{ background: primary }}>-{discount}%</div>
                )}
                <button
                  onClick={e => e.stopPropagation()}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                >
                  <Heart size={14} className="text-slate-400 hover:text-red-500 transition-colors" />
                </button>
              </div>
              <div className="p-2.5">
                {product.brand && <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{product.brand}</p>}
                <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug mb-1.5">{product.name}</p>
                {rating && (
                  <div className="flex items-center gap-1 mb-1.5">
                    <Star size={10} fill="#F59E0B" className="text-amber-400" />
                    <span className="text-[10px] font-bold text-slate-600">{rating} {reviewCount ? `(${reviewCount})` : ''}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-1">
                  <div>
                    <p className="text-sm font-black" style={{ color: primary }}>৳{price.toLocaleString()}</p>
                    {originalPrice && <p className="text-[10px] text-slate-400 line-through">৳{originalPrice.toLocaleString()}</p>}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onAddToCart?.(product); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow"
                    style={{ background: primary }}
                  >
                    <ShoppingCart size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
