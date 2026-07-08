'use client';
import { useEffect, useState } from 'react';

export default function LoadingScreen({ text, visible = true, minDuration = 1200, shop = null, products = [] }) {
  const [show, setShow] = useState(true);
  const [textIdx, setTextIdx] = useState(0);
  const [productIdx, setProductIdx] = useState(0);
  const [activePosterIdx, setActivePosterIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // Determine loading content based on shop.loadingMedia setting
  const loadingMedia = shop?.loadingMedia || { type: 'default' };
  const defaultText = [
    'লোডিং হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন',
    '১০০% নিরাপদ লেনদেন ও ফাস্ট ডেলিভারি',
    'সেরা কোয়ালিটির আসল প্রোডাক্টস',
    'সহজ অর্ডার এবং চমৎকার শপিং অভিজ্ঞতা'
  ];
  
  // Text to show: custom texts if 'text' mode, else default
  const loadingTexts = (loadingMedia.type === 'text' && loadingMedia.texts?.length > 0)
    ? loadingMedia.texts
    : (shop?.loadingTexts?.length ? shop.loadingTexts : defaultText);
  
  // Custom posters: show if type === 'image' and posters/imageUrl exist
  const posters = loadingMedia.type === 'image'
    ? (loadingMedia.posters?.length > 0 ? loadingMedia.posters : (loadingMedia.imageUrl ? [loadingMedia.imageUrl] : []))
    : [];

  // Highlight Products selector: Filter by shop.featuredProductIds if configured
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

  // Visibility toggle
  useEffect(() => {
    let timer;
    if (!visible) {
      // Allow extra minDuration for visual loading sync
      timer = setTimeout(() => setShow(false), minDuration);
    } else {
      setShow(true);
    }
    return () => clearTimeout(timer);
  }, [visible, minDuration]);

  // Smooth RequestAnimationFrame progress counter (0% to 100%)
  useEffect(() => {
    if (!show) return;
    let startTimestamp = null;
    const duration = minDuration || 1200;
    let frameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progressValue = Math.min((elapsed / duration) * 100, 100);
      setProgress(Math.floor(progressValue));

      if (elapsed < duration) {
        frameId = window.requestAnimationFrame(step);
      } else {
        setProgress(100);
      }
    };

    frameId = window.requestAnimationFrame(step);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [show, minDuration]);

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

  const isMainSite = typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname.startsWith('/?'));
  const isDashboard = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard');
  const displayLogo = shop?.logoUrl || (isMainSite ? '/logo.png' : '');
  const featuredProduct = highlightProducts[productIdx];

  // Dynamic HSL Neon theme mapping matching the shop's identity
  const name = shop?.shopName || 'Daripallah';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  const themeColor = `hsl(${hue}, 85%, 55%)`;
  const themeColorGlow = `hsla(${hue}, 85%, 55%, 0.15)`;
  const themeColorGlowStrong = `hsla(${hue}, 85%, 55%, 0.4)`;

  // Dynamic high-tech log statement based on progress percentage
  const getTerminalLog = (val) => {
    if (val < 25) return '[ OK ] Initializing Secure Gateway Router...';
    if (val < 50) return '[ OK ] Resolving Store Custom Domain Node...';
    if (val < 75) return '[ OK ] Synchronizing AI Engine Clusters...';
    if (val < 95) return '[ OK ] Fetching Database Sync & Products...';
    return '[ OK ] Preparing Premium Neural Workspace...';
  };

  const svgCircumference = 2 * Math.PI * 65; // ~408.4
  const strokeOffset = svgCircumference - (progress / 100) * svgCircumference;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden touch-pan-y select-none"
      style={{ background: 'linear-gradient(135deg, #020205 0%, #070718 50%, #020205 100%)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Futuristic 3D Cyber Grid Pattern Overlay ── */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 30 0 L 0 0 0 30' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }} 
      />

      {/* ── Dynamic rotating background glowing blobs ── */}
      <div 
        className="absolute w-[450px] h-[450px] rounded-full blur-[140px] animate-pulse pointer-events-none -top-32 -left-32 transition-all duration-1000"
        style={{ background: `radial-gradient(circle, ${themeColorGlowStrong} 0%, transparent 70%)` }}
      />
      <div 
        className="absolute w-[350px] h-[350px] rounded-full blur-[120px] animate-pulse pointer-events-none -bottom-24 -right-24 transition-all duration-1000"
        style={{ background: `radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)` }}
      />

      {/* ── Swipable Posters Background Carousel ── */}
      {posters.length > 0 ? (
        <div className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out">
          <img 
            src={posters[activePosterIdx]} 
            alt={`Poster ${activePosterIdx + 1}`} 
            className="w-full h-full object-cover opacity-50 scale-100 transition-all duration-1000 ease-in-out" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/85" />
          
          {/* Carousel Dots */}
          {posters.length > 1 && (
            <div className="absolute bottom-44 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {posters.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePosterIdx(i)}
                  className="h-2 rounded-full transition-all duration-500 cursor-pointer"
                  style={{
                    width: i === activePosterIdx ? '32px' : '8px',
                    backgroundColor: i === activePosterIdx ? themeColor : 'rgba(255,255,255,0.2)'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ── Circular HUD Loading Arena (Always Enabled) ── */}
      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        {/* Outer dashed spinning ring */}
        <div 
          className="absolute inset-0 rounded-full border-4 border-dashed animate-spin" 
          style={{ 
            borderColor: `${themeColor}60`, 
            animationDuration: '8s',
            animationName: 'spin'
          }} 
        />
        {/* Inner dotted reverse spinning ring */}
        <div 
          className="absolute inset-2 rounded-full border-2 border-dotted animate-spin" 
          style={{ 
            borderColor: `${themeColor}bf`, 
            animationDuration: '4s',
            animationDirection: 'reverse',
            animationName: 'spin'
          }} 
        />
        {/* Progress ring track */}
        <svg className="absolute w-36 h-36 origin-center -rotate-90" viewBox="0 0 150 150">
           <circle 
              cx="75" 
              cy="75" 
              r="65" 
              fill="none" 
              stroke="rgba(255,255,255,0.03)" 
              strokeWidth="6" 
           />
           <circle 
              cx="75" 
              cy="75" 
              r="65" 
              fill="none" 
              stroke={themeColor} 
              strokeWidth="6" 
              strokeDasharray={svgCircumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className="transition-all duration-100 ease-out"
              style={{ filter: `drop-shadow(0 0 8px ${themeColor})` }}
           />
        </svg>
        {/* Center core glassmorphic container */}
        <div 
          className="absolute w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-2xl border"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(255, 255, 255, 0.06)'
          }}
        >
          {displayLogo ? (
            <img src={displayLogo} alt="Logo" className="w-12 h-12 object-contain" />
          ) : (
            <span className="text-3xl font-black text-white">{name[0].toUpperCase()}</span>
          )}
          <span className="text-sm font-black text-slate-300 font-mono mt-1">{progress}%</span>
        </div>
      </div>

      {/* ── Futuristic Terminal Status Monitor ── */}
      <div className="flex flex-col items-center justify-center gap-4 z-10 w-full max-w-[90%] sm:max-w-md px-4 mb-10">
        {/* Terminal box */}
        <div 
          className="w-full bg-[#03030b]/85 border rounded-2xl p-4 font-mono text-left relative overflow-hidden backdrop-blur-md"
          style={{ 
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: `0 10px 40px rgba(0,0,0,0.5), inset 0 0 15px rgba(${hue}, 50%, 50%, 0.05)`
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between border-b pb-2 mb-3" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500/60" />
              <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
              <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
            </div>
            <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">
              {text || (shop?.shopSlug ? `${shop.shopSlug}.sys` : 'kernel.sys')}
            </span>
          </div>

          {/* Real-time Loader Log */}
          <div className="text-[11px] font-semibold flex flex-col gap-1.5">
            <p className="text-emerald-400 font-extrabold flex items-center gap-2">
              <span className="animate-pulse" style={{ color: themeColor }}>&gt;_</span> 
              {getTerminalLog(progress)}
            </p>
            {progress >= 50 && (
              <p className="text-white/40 leading-none">
                [ INFO ] Establishing connection via custom referer mapping...
              </p>
            )}
          </div>

          {/* Cyber bar line */}
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
            <div 
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${themeColor}, #7c3aed)`,
                boxShadow: `0 0 6px ${themeColor}`
              }}
            />
          </div>
        </div>

        {/* Rotating marketing/store updates */}
        <div className="relative h-10 flex items-center justify-center w-full px-4 overflow-hidden">
          <p
            key={textIdx}
            className="absolute text-center font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-400 text-sm sm:text-base leading-snug animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {loadingTexts[textIdx]}
          </p>
        </div>

        {(posters.length > 1 || loadingTexts.length > 1) && (
          <span className="text-[8px] text-white/20 uppercase tracking-widest font-black animate-pulse select-none">
            ◀ সোয়াইপ করুন / Swipe ▶
          </span>
        )}
      </div>

      {/* ── Featured Product Glass Highlight Card ── */}
      {featuredProduct && (
        <div
          key={productIdx}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-3xl border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 z-20 shadow-2xl hover:scale-[1.02] transition-transform"
          style={{ 
            background: 'rgba(255,255,255,0.03)', 
            backdropFilter: 'blur(20px)', 
            minWidth: 280, 
            maxWidth: 340,
            borderColor: 'rgba(255,255,255,0.05)'
          }}
        >
          <div className="w-14 h-14 rounded-2xl overflow-hidden border shrink-0 bg-white/5 shadow-md relative" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <img
              src={featuredProduct.imageUrl}
              alt={featuredProduct.name}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          
          <div className="overflow-hidden flex-1 text-left">
            <span 
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider mb-1"
              style={{
                color: themeColor,
                backgroundColor: themeColorGlow,
                border: `1px solid ${themeColorGlow}`
              }}
            >
              ★ HIGHLIGHT
            </span>
            <p className="text-xs font-black text-white leading-tight line-clamp-1">{featuredProduct.name}</p>
            <p className="text-xs font-black text-emerald-400 mt-0.5">৳{featuredProduct.price}</p>
          </div>

          {highlightProducts.length > 1 && (
            <div className="flex flex-col gap-1 ml-2 shrink-0 justify-center">
              {highlightProducts.map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full transition-all duration-500"
                  style={{
                    height: i === productIdx ? '10px' : '4px',
                    backgroundColor: i === productIdx ? themeColor : 'rgba(255,255,255,0.15)'
                  }}
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
