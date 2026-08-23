'use client';
import { useState, useEffect } from 'react';
import { Flame, ShoppingCart, Clock } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

function useCountdown(endTime) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, expired: false });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) {
        setTime({ h: 0, m: 0, s: 0, expired: true });
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

export default function DealOfTheDay({ data, themeVars, onAddToCart }) {
  const d = resolveSectionData('deal_of_the_day', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const countdown = useCountdown(d.endTime || new Date(Date.now() + 8 * 3600 * 1000));

  const sold = d.soldCount || 42;
  const total = d.totalStock || 60;
  const percent = Math.min(100, Math.round((sold / total) * 100));

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart({
        id: 'deal-day-item',
        name: d.productName || d.title,
        price: d.price || 1850,
        imageUrl: d.imageUrl,
      });
    }
  };

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 sm:p-8 md:p-12 shadow-2xl border border-slate-700/50 relative overflow-hidden">
        {/* Glow ambient background */}
        <div 
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: primary }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Product Image Column */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-800 shadow-xl border border-slate-700 group">
              {d.imageUrl && (
                <img
                  src={d.imageUrl}
                  alt={d.productName || 'Deal of the Day'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              )}
              {d.discountPercent && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-black shadow-lg flex items-center gap-1">
                  <Flame size={14} />
                  {d.discountPercent}% ছাড়
                </div>
              )}
            </div>
          </div>

          {/* Deal Details Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
              <Flame size={14} />
              {d.title || 'Deal of the Day'}
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight text-white">
              {d.productName}
            </h3>

            {d.description && (
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                {d.description}
              </p>
            )}

            {/* Price Box */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                ৳{Number(d.price).toLocaleString()}
              </span>
              {d.originalPrice && (
                <span className="text-base text-slate-400 line-through font-bold">
                  ৳{Number(d.originalPrice).toLocaleString()}
                </span>
              )}
            </div>

            {/* Countdown Box */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-md">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-400" /> অফার শেষ হতে বাকি:
                </span>
                <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm text-white">
                  <span className="px-2 py-1 rounded-lg bg-black/60">{String(countdown.h).padStart(2, '0')}h</span>
                  <span>:</span>
                  <span className="px-2 py-1 rounded-lg bg-black/60">{String(countdown.m).padStart(2, '0')}m</span>
                  <span>:</span>
                  <span className="px-2 py-1 rounded-lg bg-black/60">{String(countdown.s).padStart(2, '0')}s</span>
                </div>
              </div>

              {/* Stock Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                  <span>বিক্রি হয়েছে: <strong className="text-white">{sold} টি</strong></span>
                  <span>স্টক বাকি: <strong className="text-amber-400">{total - sold} টি</strong></span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-500" 
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <button
                onClick={handleAdd}
                className="px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{ background: primary }}
              >
                <ShoppingCart size={16} />
                {d.buttonText || 'অর্ডার নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
