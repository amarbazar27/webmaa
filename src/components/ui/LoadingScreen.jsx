'use client';
import { useEffect, useState } from 'react';

export default function LoadingScreen({ text, visible = true, minDuration = 1000, shop = null, products = [] }) {
  const [show, setShow] = useState(true);
  const [textIdx, setTextIdx] = useState(0);
  const [productIdx, setProductIdx] = useState(0);
  const [activePosterIdx, setActivePosterIdx] = useState(0);

  // Determine loading content based on shop.loadingMedia setting
  const loadingMedia = shop?.loadingMedia || { type: 'default' };
  const defaultText = ['সুবহানআল্লাহ', 'আলহামদুলিল্লাহ', 'আল্লাহু আকবার', 'বিসমিল্লাহ'];
  
  // Text to show: custom texts if 'text' mode, else default
  const loadingTexts = (loadingMedia.type === 'text' && loadingMedia.texts?.length > 0)
    ? loadingMedia.texts
    : (shop?.loadingTexts?.length ? shop.loadingTexts : defaultText);
  
  // Custom posters: show if type === 'image' and posters/imageUrl exist
  const posters = loadingMedia.type === 'image'
    ? (loadingMedia.posters?.length > 0 ? loadingMedia.posters : (loadingMedia.imageUrl ? [loadingMedia.imageUrl] : []))
    : [];

  // 🚨 Highlight Products selector: Filter by shop.featuredProductIds if configured
  const highlightProducts = (shop?.featuredProductIds?.length > 0)
    ? products.filter(p => shop.featuredProductIds.includes(p.id) && p.imageUrl)
    : products.filter(p => p.imageUrl).slice(0, 5);

  // Swipe gesture tracking states
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleNextSlide = () => {
    if (loadingMedia.type === 'image' && posters.length > 1) {
      setActivePosterIdx(prev => (prev + 1) % posters.length);
    } else if (loadingTexts.length > 1) {
      setTextIdx(prev => (prev + 1) % loadingTexts.length);
    }
  };

  const handlePrevSlide = () => {
    if (loadingMedia.type === 'image' && posters.length > 1) {
      setActivePosterIdx(prev => (prev - 1 + posters.length) % posters.length);
    } else if (loadingTexts.length > 1) {
      setTextIdx(prev => (prev - 1 + loadingTexts.length) % loadingTexts.length);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const diff = touchStart - touchEnd;
    const swipeThreshold = 50;
    if (diff > swipeThreshold) {
      handleNextSlide();
    } else if (diff < -swipeThreshold) {
      handlePrevSlide();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    let timer;
    if (!visible) {
      timer = setTimeout(() => setShow(false), minDuration);
    } else {
      setShow(true);
    }
    return () => clearTimeout(timer);
  }, [visible, minDuration]);

  // Auto-advance rotating text slideshow
  useEffect(() => {
    if (loadingTexts.length <= 1) return;
    const iv = setInterval(() => {
      setTextIdx(i => (i + 1) % loadingTexts.length);
    }, 2200);
    return () => clearInterval(iv);
  }, [loadingTexts.length]);

  // Auto-advance custom posters carousel
  useEffect(() => {
    if (posters.length <= 1) return;
    const iv = setInterval(() => {
      setActivePosterIdx(i => (i + 1) % posters.length);
    }, 4500);
    return () => clearInterval(iv);
  }, [posters.length]);

  // Auto-advance featured products showcase
  useEffect(() => {
    if (highlightProducts.length <= 1) return;
    const iv = setInterval(() => {
      setProductIdx(i => (i + 1) % highlightProducts.length);
    }, 3000);
    return () => clearInterval(iv);
  }, [highlightProducts.length]);

  if (!show) return null;

  const featuredProduct = highlightProducts[productIdx];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden touch-pan-y"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0a20 50%, #050510 100%)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Islamic Geometric Pattern Overlay ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l15 15-15 15-15-15zM0 30l15 15-15 15L-15 45zM60 30l15 15-15 15-15-15zM30 60l15 15-15 15-15-15z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        backgroundSize: '80px 80px'
      }} />

      {/* ── Ambient glow blobs ── */}
      <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse bg-purple-600/10 -top-48 -left-48 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse bg-indigo-600/10 -bottom-32 -right-32 pointer-events-none" />

      {/* ── Swipable Posters Background Carousel ── */}
      {posters.length > 0 ? (
        <div className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out">
          <img 
            src={posters[activePosterIdx]} 
            alt={`Poster ${activePosterIdx + 1}`} 
            className="w-full h-full object-cover opacity-60 scale-100 transition-all duration-1000 ease-in-out" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/80" />
          
          {/* Swipable Carousel Dots Indicator */}
          {posters.length > 1 && (
            <div className="absolute bottom-44 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {posters.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePosterIdx(i)}
                  className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${
                    i === activePosterIdx ? 'w-8 bg-purple-500' : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Central logo with animated rings ── */
        <div className="relative flex items-center justify-center mb-10 pointer-events-none" style={{ width: 140, height: 140 }}>
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
      )}

      {/* ── Rotating swipable text ── */}
      <div className="relative flex flex-col items-center gap-3 mb-10 z-10 select-none">
        <div className="relative h-10 flex items-center justify-center" style={{ width: 320 }}>
          <p
            key={textIdx}
            className="absolute text-center font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-indigo-200 text-xl tracking-wide leading-normal animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {loadingTexts[textIdx]}
          </p>
        </div>
        
        {/* Swipe instructions (only if there are multiple slides) */}
        {(posters.length > 1 || loadingTexts.length > 1) && (
          <span className="text-[8px] text-white/25 uppercase tracking-widest font-black animate-pulse">◀ সোয়াইপ করুন / Swipe ▶</span>
        )}

        {posters.length === 0 && loadingTexts.length > 1 && (
          <div className="flex gap-1.5 mt-2">
            {loadingTexts.map((_, i) => (
              <button
                key={i}
                onClick={() => setTextIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  i === textIdx ? 'w-8 bg-purple-500' : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Featured Product Highlight Card ── */}
      {featuredProduct && (
        <div
          key={productIdx}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-4 rounded-[2rem] border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700 z-20 shadow-2xl hover:scale-105 transition-transform"
          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', minWidth: 300, maxWidth: 360 }}
        >
          {/* Product Image - Larger and glowing */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/15 shrink-0 bg-white/5 shadow-lg relative group">
            <img
              src={featuredProduct.imageUrl}
              alt={featuredProduct.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          </div>
          {/* Product Info */}
          <div className="overflow-hidden flex-1 text-left">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 uppercase tracking-widest mb-1.5 animate-pulse">⭐ হাইলাইট</span>
            <p className="text-sm font-black text-white leading-tight line-clamp-1">{featuredProduct.name}</p>
            <p className="text-sm font-black text-emerald-400 mt-1">৳{featuredProduct.price}</p>
          </div>
          {/* Dot indicator */}
          {highlightProducts.length > 1 && (
            <div className="flex flex-col gap-1 ml-2 shrink-0 justify-center h-full">
              {highlightProducts.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-500 ${i === productIdx ? 'h-4 bg-purple-500' : 'h-1.5 bg-white/20'}`}
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
