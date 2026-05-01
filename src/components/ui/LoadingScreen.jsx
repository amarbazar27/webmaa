'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen({ text, visible = true, minDuration = 1000, shop = null, products = [] }) {
  const [show, setShow] = useState(true);
  const [textIdx, setTextIdx] = useState(0);
  const [productIdx, setProductIdx] = useState(0);
  
  const defaultText = ['সুবহানআল্লাহ', 'আলহামদুলিল্লাহ', 'আল্লাহু আকবার', 'বিসমিল্লাহ'];
  const loadingTexts = shop?.loadingTexts?.length ? shop.loadingTexts : defaultText;
  
  const highlightProducts = products.filter(p => p.imageUrl).slice(0, 5);

  useEffect(() => {
    let timer;
    if (!visible) {
      timer = setTimeout(() => setShow(false), minDuration);
    } else {
      setShow(true);
    }
    return () => clearTimeout(timer);
  }, [visible, minDuration]);

  useEffect(() => {
    const iv = setInterval(() => setTextIdx(i => (i + 1) % loadingTexts.length), 1800);
    return () => clearInterval(iv);
  }, [loadingTexts.length]);

  useEffect(() => {
    if (highlightProducts.length === 0) return;
    const iv = setInterval(() => setProductIdx(i => (i + 1) % highlightProducts.length), 2500);
    return () => clearInterval(iv);
  }, [highlightProducts.length]);

  if (!show) return null;

  const featuredProduct = highlightProducts[productIdx];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #050510 0%, #0a0a20 50%, #050510 100%)',
      }}
    >
      {/* ── Islamic Geometric Pattern Overlay ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l15 15-15 15-15-15zM0 30l15 15-15 15L-15 45zM60 30l15 15-15 15-15-15zM30 60l15 15-15 15-15-15z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        backgroundSize: '80px 80px'
      }} />

      {/* ── Ambient glow blobs ── */}
      <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse bg-purple-600/10 -top-48 -left-48" />
      <div className="absolute w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse bg-indigo-600/10 -bottom-32 -right-32" />

      {/* ── Central logo with animated rings ── */}
      <div className="relative flex items-center justify-center mb-10" style={{ width: 140, height: 140 }}>
        <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-[spin_8s_linear_infinite]" />
        <div className="absolute inset-2 rounded-full border border-indigo-500/10 animate-[spin_12s_linear_infinite_reverse]" />
        
        <div
          className="relative rounded-[32px] overflow-hidden flex items-center justify-center"
          style={{
            width: 90,
            height: 90,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(30px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}
        >
          {shop?.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.shopName || 'Store'} className="w-full h-full object-contain p-2" />
          ) : (
            <div className="text-white font-black">
              <svg width="54" height="54" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="wm-grad-L" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A5B4FC" />
                    <stop offset="100%" stopColor="#F472B6" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="url(#wm-grad-L)" opacity="0.1" />
                <text x="50" y="65" textAnchor="middle" fill="url(#wm-grad-L)" fontSize="50" fontWeight="900">{shop?.shopName ? shop.shopName.charAt(0).toUpperCase() : 'W'}</text>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* ── Rotating text ── */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="relative h-10 flex items-center justify-center" style={{ width: 300 }}>
          <p
            key={textIdx}
            className="absolute text-center font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-indigo-300 text-2xl animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {loadingTexts[textIdx]}
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {loadingTexts.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === textIdx ? 'w-8 bg-purple-500' : 'w-1.5 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Featured Product Highlight Card ── */}
      {featuredProduct && (
        <div
          key={productIdx}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', minWidth: 240, maxWidth: 300 }}
        >
          {/* Product Image */}
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
            <img
              src={featuredProduct.imageUrl}
              alt={featuredProduct.name}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
          {/* Product Info */}
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-0.5">হাইলাইট</p>
            <p className="text-sm font-black text-white leading-tight line-clamp-1">{featuredProduct.name}</p>
            <p className="text-sm font-black text-emerald-400 mt-0.5">৳{featuredProduct.price}</p>
          </div>
          {/* Dot indicator */}
          {highlightProducts.length > 1 && (
            <div className="flex gap-1 ml-auto shrink-0">
              {highlightProducts.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${i === productIdx ? 'w-4 bg-purple-500' : 'w-1 bg-white/20'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
