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

      {/* ── Loading Arena (Circular HUD for Dashboard, Football Stadium for Storefront) ── */}
      {isDashboard ? (
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
      ) : (
        <>
          <style>{`
            @keyframes wiggle {
              0%, 100% { transform: translateY(-50%) rotate(0deg); }
              20% { transform: translateY(-50%) translateX(-4px) rotate(-2deg); }
              40% { transform: translateY(-50%) translateX(4px) rotate(2deg); }
              60% { transform: translateY(-50%) translateX(-2px) rotate(-1deg); }
              80% { transform: translateY(-50%) translateX(2px) rotate(1deg); }
            }
          `}</style>
          <div className="relative w-full max-w-sm h-52 bg-gradient-to-b from-[#0d1527] via-[#052917] to-[#0b1e13] rounded-[2rem] border-2 border-emerald-500/25 overflow-hidden flex items-center justify-between p-6 shadow-2xl mb-8 group select-none">
             {/* Field Line Markings */}
             <div className="absolute inset-2 border border-white/5 rounded-[1.75rem] pointer-events-none" />
             <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-[1px] bg-white/5 pointer-events-none" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/5 pointer-events-none" />
             <div className="absolute top-2 bottom-2 right-2 w-14 border-l border-white/5 pointer-events-none" />

             {/* Net Backdrop Glow */}
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-20 h-32 bg-emerald-500/5 blur-md pointer-events-none" />

             {/* 1. Shooter Leg/Shoe Silhouette */}
             {(() => {
                const kickAngle = progress < 20
                  ? -25 + (progress / 20) * -15 // swings back to -40deg
                  : Math.max(0, -40 + ((progress - 20) / 5) * 50); // swings forward rapidly to +10deg
                return (
                  <div 
                    className="absolute left-4 bottom-14 w-14 h-16 origin-top-left transition-transform duration-75"
                    style={{ transform: `rotate(${kickAngle}deg)` }}
                  >
                     <svg className="w-full h-full text-slate-200 fill-current drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" viewBox="0 0 100 100">
                        <path d="M10 20 L25 15 L40 60 L20 65 Z" fill="rgba(255,255,255,0.15)" />
                        <path d="M40 60 L65 72 L62 82 L30 78 L25 65 Z" fill="#9333ea" />
                        <path d="M55 67 L68 70 L65 77 L52 75 Z" fill="#ffffff" />
                        <circle cx="35" cy="80" r="3" fill="#ffffff" />
                        <circle cx="48" cy="81" r="3" fill="#ffffff" />
                        <circle cx="58" cy="80" r="3" fill="#ffffff" />
                     </svg>
                  </div>
                );
             })()}

             {/* 2. Goal Net Netpost */}
             {(() => {
                const netWiggleStyle = progress >= 85 ? { animation: 'wiggle 0.25s ease-in-out infinite' } : {};
                return (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-20 h-32" style={netWiggleStyle}>
                     <svg className="w-full h-full text-emerald-400/30" viewBox="0 0 100 160">
                        <path d="M10 10 L90 20 L90 140 L10 150 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <path d="M10 10 L90 50 M10 40 L90 80 M10 70 L90 110 M10 100 L90 140" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                        <path d="M10 150 L90 110 M10 120 L90 80 M10 90 L90 50 M10 60 L90 20" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                        {progress >= 85 && (
                           <circle cx="50" cy="80" r="25" fill="rgba(16, 185, 129, 0.15)" className="animate-ping" />
                        )}
                     </svg>
                  </div>
                );
             })()}

             {/* 3. The Flying Football */}
             {(() => {
                let left = '3.5rem';
                let bottom = '3rem';
                let scale = 1.0;
                let rotation = 0;
                
                if (progress >= 20) {
                  const ratio = Math.min(1.0, (progress - 20) / (85 - 20)); // 0.0 to 1.0
                  const startX = 56;
                  const endX = 270;
                  const currentX = startX + ratio * (endX - startX);
                  left = `${currentX}px`;

                  const startY = 48;
                  const peakHeight = 60;
                  const currentY = startY + Math.sin(ratio * Math.PI) * peakHeight - (ratio * 12);
                  bottom = `${currentY}px`;

                  scale = 1.0 - ratio * 0.45;
                  rotation = (progress - 20) * 18;
                }

                return (
                  <div 
                    className="absolute transition-all duration-75 ease-out z-25"
                    style={{
                      left,
                      bottom,
                      transform: `scale(${scale}) rotate(${rotation}deg)`,
                      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))'
                    }}
                  >
                     <svg className="w-8 h-8 text-white" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#1e293b" strokeWidth="4" />
                        <polygon points="50,30 35,40 38,58 50,68 62,58 65,40" fill="#1e293b" />
                        <path d="M50,30 L50,2 M35,40 L10,32 M38,58 L18,78 M50,68 L50,98 M62,58 L82,78 M65,40 L90,32" stroke="#1e293b" strokeWidth="4" />
                        <polygon points="50,2 62,14 80,8 90,32 78,24" fill="#64748b" opacity="0.35" />
                        <polygon points="50,98 38,86 20,92 10,68 22,76" fill="#64748b" opacity="0.35" />
                     </svg>
                  </div>
                );
             })()}

             {/* Impact flash at kick contact */}
             {progress >= 20 && progress < 25 && (
                <div className="absolute left-[80px] bottom-[40px] w-10 h-10 bg-white rounded-full animate-ping opacity-75 pointer-events-none" />
             )}

             {/* 4. GOAL Flash Text */}
             {progress >= 85 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/90 backdrop-blur-xs z-35 animate-[fadeIn_0.3s_ease-out_forwards]">
                   <h3 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-emerald-400 to-yellow-300 animate-bounce drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]">
                      GOAL!!! ⚽🔥
                   </h3>
                   <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mt-1 animate-pulse">
                      System Load Completed!
                   </p>
                </div>
             )}

             {/* 5. Loader stats card */}
             <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center bg-slate-900/80 border border-white/5 px-3 py-1.5 rounded-xl backdrop-blur-xs z-10 text-[9px] font-mono">
                <span className="text-slate-400 font-bold uppercase tracking-wider">World Cup Loading...</span>
                <span className="text-emerald-400 font-black">{progress}%</span>
             </div>
          </div>
        </>
      )}

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
