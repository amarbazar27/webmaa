'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FALLBACK_COLORS = ['bg-indigo-600','bg-emerald-600','bg-rose-600','bg-amber-600','bg-cyan-600','bg-fuchsia-600'];
function getFallbackColor(name = '') {
  let hash = 0;
  const safeName = String(name || '');
  for (let i = 0; i < safeName.length; i++) hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

const AUTO_SLIDE_MS = 3000;
const MIN_SWIPE_PX = 40;

export default function ProductImage({ product, currentPrice }) {
  const [imgError, setImgError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // Build image list: prefer images[] array, fallback to imageUrl
  const images = (() => {
    if (Array.isArray(product?.images) && product.images.length > 0) return product.images;
    if (product?.imageUrl) return [product.imageUrl];
    return [];
  })();

  const hasImages = images.length > 0 && !imgError;
  const currentImg = images[activeIdx] || '';
  const count = images.length;

  // ─── Auto-slide ───────────────────────────────────────────
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % count);
    }, AUTO_SLIDE_MS);
  }, [count]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const goTo = (idx) => {
    setActiveIdx(idx);
    setImgError(false);
    resetTimer();          // reset auto-slide on manual interaction
  };
  const goPrev = (e) => { e?.stopPropagation(); goTo((activeIdx - 1 + count) % count); };
  const goNext = (e) => { e?.stopPropagation(); goTo((activeIdx + 1) % count); };

  // ─── Touch / swipe ────────────────────────────────────────
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null || count <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > MIN_SWIPE_PX) {
      if (dx < 0) goNext();   // swipe left → next
      else         goPrev();  // swipe right → prev
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const safeName = String(product?.name || 'Unknown');

  return (
    <div
      className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl bg-white border border-slate-200 group select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {hasImages ? (
        <>
          {/* Main Image */}
          {currentImg.startsWith('http') ? (
            <img
              key={activeIdx}
              src={currentImg}
              alt={safeName}
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={() => setImgError(true)}
              draggable={false}
            />
          ) : (
            <Image
              key={activeIdx}
              src={currentImg}
              alt={safeName}
              fill
              priority
              className="object-cover"
              onError={() => setImgError(true)}
            />
          )}

          {/* Prev / Next arrows — visible on hover (desktop) */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                aria-label="পূর্ববর্তী ছবি"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                aria-label="পরবর্তী ছবি"
              >
                <ChevronRight size={18} />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goTo(i); }}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIdx
                        ? 'w-4 h-1.5 bg-white shadow'
                        : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
                    }`}
                    aria-label={`ছবি ${i + 1}`}
                  />
                ))}
              </div>

              {/* Counter badge */}
              <span className="absolute top-14 right-3 bg-black/60 text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10 tabular-nums">
                {activeIdx + 1}/{count}
              </span>
            </>
          )}
        </>
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${getFallbackColor(safeName)}`}>
          <h2 className="text-4xl font-black text-white drop-shadow-xl text-center px-4">{safeName}</h2>
        </div>
      )}

      {/* Price badge */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-slate-900 px-4 py-2 rounded-2xl text-lg font-black shadow-xl border border-slate-200/50">
        ৳{currentPrice}
      </div>

      {/* Category badge */}
      {product?.category && (
        <div className="absolute top-4 left-4 bg-purple-600/90 text-white px-3 py-1.5 rounded-xl text-xs font-black backdrop-blur-sm">
          {String(product.category)}
        </div>
      )}
    </div>
  );
}
