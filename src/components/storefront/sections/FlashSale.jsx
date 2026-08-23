'use client';
import { useState, useEffect } from 'react';
import { Flame, ShoppingCart } from 'lucide-react';
import { resolveSectionData, DEMO_PRODUCTS } from '@/lib/homepageDemoData';

function useCountdown(endTime) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, expired: false });
  useEffect(() => {
    const tick = () => {
      const target = endTime ? new Date(endTime).getTime() : Date.now() + 14 * 3600 * 1000;
      const diff = target - Date.now();
      if (diff <= 0) { 
        setTime({ h: 0, m: 0, s: 0, expired: false }); 
        return; 
      }
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return time;
}

function TimeBox({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-slate-900 text-white text-xs sm:text-base md:text-xl font-black w-8 sm:w-11 md:w-13 h-8 sm:h-11 md:h-13 rounded-xl flex items-center justify-center tabular-nums shadow-md">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function FlashSale({ data, products, themeVars, onAddToCart, onProductClick }) {
  const d = resolveSectionData('flash_sale', data);
  const primary = themeVars?.primaryColor || '#EF4444';
  const countdown = useCountdown(d.endTime);

  const allAvailableProducts = (products && products.length > 0) ? products : DEMO_PRODUCTS;
  
  let saleProducts = [];
  if (d.productIds && d.productIds.length > 0) {
    saleProducts = d.productIds
      .map(id => allAvailableProducts.find(p => p.id === id))
      .filter(Boolean);
  }
  
  if (saleProducts.length === 0) {
    saleProducts = allAvailableProducts.slice(0, 4);
  }

  return (
    <div className="px-4 py-6 md:py-8 max-w-[1400px] mx-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: `${primary}15` }}>
              <Flame size={20} style={{ color: primary }} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 leading-tight">
                {d.title || '🔥 মেগা ফ্ল্যাশ সেল'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">সীমিত সময়ের বিশেষ অফার</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-1 self-start sm:self-auto">
            <TimeBox value={countdown.h} label="ঘণ্টা" />
            <span className="text-base font-black text-slate-400 mb-2">:</span>
            <TimeBox value={countdown.m} label="মিনিট" />
            <span className="text-base font-black text-slate-400 mb-2">:</span>
            <TimeBox value={countdown.s} label="সেকেন্ড" />
          </div>
        </div>

        {/* Products horizontal scroll */}
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none">
          {saleProducts.map((product) => {
            const price = product.price || product.variants?.[0]?.price || 0;
            const originalPrice = product.originalPrice || product.compareAtPrice;
            const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 15;
            const stock = product.stock !== undefined ? product.stock : 25;
            const initialStock = product.initialStock || 50;

            return (
              <div
                key={product.id}
                className="flex-shrink-0 w-38 sm:w-44 md:w-52 bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden border border-slate-100 cursor-pointer group transition-all duration-300 flex flex-col justify-between"
                onClick={() => onProductClick?.(product)}
              >
                <div className="relative aspect-square bg-slate-50 overflow-hidden">
                  <img
                    src={product.imageUrl || product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {discount > 0 && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-black text-white shadow" style={{ background: primary }}>
                      -{discount}%
                    </div>
                  )}
                  {/* Stock bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (stock / initialStock) * 100)}%`,
                        background: primary,
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-1">
                      {product.name}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-sm sm:text-base font-black" style={{ color: primary }}>
                        ৳{Number(price).toLocaleString()}
                      </p>
                      {originalPrice && (
                        <p className="text-[10px] text-slate-400 line-through">
                          ৳{Number(originalPrice).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart?.(product);
                    }}
                    className="w-full py-2 rounded-xl text-[11px] font-black text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow cursor-pointer"
                    style={{ background: primary }}
                  >
                    <ShoppingCart size={12} /> কার্টে যোগ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
