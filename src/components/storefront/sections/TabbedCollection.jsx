'use client';
import { useState } from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { resolveSectionData, DEMO_PRODUCTS } from '@/lib/homepageDemoData';

export default function TabbedCollection({ data, products, themeVars, onAddToCart, onProductClick }) {
  const d = resolveSectionData('tabbed_collection', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const tabs = d.tabs || [
    { id: 'men', label: 'ছেলেদের কালেকশন' },
    { id: 'women', label: 'মেয়েদের কালেকশন' },
    { id: 'living', label: 'হোম লিভিং' },
  ];
  const [activeTab, setActiveTab] = useState(0);

  const productList = (products && products.length > 0) ? products : DEMO_PRODUCTS;

  // Filter or slice products dynamically based on tab index
  const tabProducts = productList.slice(activeTab * 2, (activeTab * 2) + 4);
  const displayed = tabProducts.length ? tabProducts : productList.slice(0, 4);

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {d.title || 'Featured Collections'}
          </h2>
          {d.subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium">{d.subtitle}</p>}
        </div>

        {/* Tab Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((t, idx) => (
            <button
              key={t.id || idx}
              onClick={() => setActiveTab(idx)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                activeTab === idx
                  ? 'text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={activeTab === idx ? { background: primary } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {displayed.map((product) => {
          const price = product.price || product.variants?.[0]?.price || 0;
          const originalPrice = product.originalPrice || product.compareAtPrice;
          const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

          return (
            <div
              key={product.id}
              onClick={() => onProductClick?.(product)}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-square bg-slate-50 overflow-hidden">
                <img
                  src={product.imageUrl || product.images?.[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {discount > 0 && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-black shadow">
                    -{discount}%
                  </span>
                )}
              </div>

              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2">
                <div>
                  {product.brand && (
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-0.5">
                      {product.brand}
                    </p>
                  )}
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart?.(product);
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95 shadow"
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
