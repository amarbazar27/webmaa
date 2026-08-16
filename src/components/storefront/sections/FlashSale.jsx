'use client';
import { useState, useEffect } from 'react';
import { Flame, ShoppingCart } from 'lucide-react';

function useCountdown(endTime) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, expired: false });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) { setTime({ h: 0, m: 0, s: 0, expired: true }); return; }
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
      <div className="bg-slate-900 text-white text-lg md:text-2xl font-black w-10 md:w-14 h-10 md:h-14 rounded-xl flex items-center justify-center tabular-nums shadow-lg">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function FlashSale({ data, products, themeVars, onAddToCart, onProductClick }) {
  const primary = themeVars?.primaryColor || '#EF4444';
  const countdown = useCountdown(data?.endTime);
  const saleProductIds = data?.productIds || [];
  const saleProducts = saleProductIds
    .map(id => products?.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 8);

  if (!data?.endTime || countdown.expired || !saleProducts.length) return null;

  return (
    <div className="px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: primary + '20' }}>
            <Flame size={16} style={{ color: primary }} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">{data?.title || 'Flash Sale'}</h2>
            <p className="text-xs text-slate-500 font-medium">সীমিত সময়ের অফার</p>
          </div>
        </div>
        {/* Countdown */}
        <div className="flex items-center gap-1">
          <TimeBox value={countdown.h} label="ঘণ্টা" />
          <span className="text-xl font-black text-slate-400 mb-3">:</span>
          <TimeBox value={countdown.m} label="মিনিট" />
          <span className="text-xl font-black text-slate-400 mb-3">:</span>
          <TimeBox value={countdown.s} label="সেকেন্ড" />
        </div>
      </div>

      {/* Products horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {saleProducts.map(product => {
          const price = product.price || product.variants?.[0]?.price || 0;
          const originalPrice = product.originalPrice || product.compareAtPrice;
          const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;
          return (
            <div
              key={product.id}
              className="flex-shrink-0 w-36 md:w-44 bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100 cursor-pointer group hover:shadow-xl transition-all"
              onClick={() => onProductClick?.(product)}
            >
              <div className="relative h-28 md:h-36 bg-slate-50">
                <img src={product.imageUrl || product.images?.[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {discount > 0 && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg text-[10px] font-black text-white shadow" style={{ background: primary }}>-{discount}%</div>
                )}
                {/* Stock bar */}
                {product.stock !== undefined && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (product.stock / (product.initialStock || 100)) * 100)}%`, background: primary }} />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-bold text-slate-700 line-clamp-2 leading-tight mb-1.5">{product.name}</p>
                <p className="text-sm font-black" style={{ color: primary }}>৳{price.toLocaleString()}</p>
                {originalPrice && <p className="text-[10px] text-slate-400 line-through">৳{originalPrice.toLocaleString()}</p>}
                <button
                  onClick={e => { e.stopPropagation(); onAddToCart?.(product); }}
                  className="mt-2 w-full py-1.5 rounded-xl text-[10px] font-black text-white flex items-center justify-center gap-1 transition-all active:scale-95"
                  style={{ background: primary }}
                >
                  <ShoppingCart size={10} /> কার্টে যোগ
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
