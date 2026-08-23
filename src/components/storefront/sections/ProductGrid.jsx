'use client';
import { useState } from 'react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { resolveSectionData, DEMO_PRODUCTS } from '@/lib/homepageDemoData';

export default function ProductGrid({ data, products, themeVars, onAddToCart, onProductClick }) {
  const d = resolveSectionData('product_grid', data);
  const [activeTab, setActiveTab] = useState(0);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const tabs = d?.tabs || ['all'];
  const maxProducts = d?.maxProducts || 12;

  const tabLabels = {
    trending: '🔥 ট্রেন্ডিং',
    new: '✨ নতুন',
    bestseller: '⭐ বেস্টসেলার',
    all: 'সব পণ্য',
  };

  const productList = (products && products.length > 0) ? products : DEMO_PRODUCTS;

  const getTabProducts = (tab) => {
    let list = [...productList];
    if (tab === 'new') list = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (tab === 'bestseller') list = list.sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
    if (tab === 'trending') list = list.sort((a, b) => (b.viewCount || b.orderCount || 0) - (a.viewCount || a.orderCount || 0));
    return list.slice(0, maxProducts);
  };

  const displayProducts = getTabProducts(tabs[activeTab] || 'all');

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      {/* Section Title */}
      {d?.title && (
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-4">
          {d.title}
        </h2>
      )}

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                i === activeTab
                  ? 'text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={i === activeTab ? { background: primary } : {}}
            >
              {tabLabels[tab] || tab}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        {displayProducts.map(product => {
          const price = product.price || product.variants?.[0]?.price || 0;
          const originalPrice = product.originalPrice || product.compareAtPrice;
          const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;
          const rating = product.rating || product.avgRating;
          const reviewCount = product.reviewCount || product.numReviews;

          return (
            <div
              key={product.id}
              className="group bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              onClick={() => onProductClick?.(product)}
            >
              <div className="relative aspect-square bg-slate-50 overflow-hidden">
                <img
                  src={product.imageUrl || product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {discount > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-black text-white shadow" style={{ background: primary }}>
                    -{discount}%
                  </div>
                )}
                <button
                  onClick={e => e.stopPropagation()}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  aria-label="Wishlist"
                >
                  <Heart size={14} className="text-slate-400 hover:text-red-500 transition-colors" />
                </button>
              </div>

              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2">
                <div>
                  {product.brand && (
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                      {product.brand}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug">
                    {product.name}
                  </p>
                  {rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} fill="#F59E0B" className="text-amber-400" />
                      <span className="text-[10px] font-bold text-slate-600">
                        {rating} {reviewCount ? `(${reviewCount})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                  <div>
                    <p className="text-sm sm:text-base font-black" style={{ color: primary }}>
                      ৳{Number(price).toLocaleString()}
                    </p>
                    {originalPrice && (
                      <p className="text-[10px] text-slate-400 line-through">
                        ৳{Number(originalPrice).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onAddToCart?.(product);
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow cursor-pointer"
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
