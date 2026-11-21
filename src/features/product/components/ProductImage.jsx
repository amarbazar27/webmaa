'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FALLBACK_COLORS = ['bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600', 'bg-fuchsia-600'];
function getFallbackColor(name = '') {
  let hash = 0;
  const safeName = String(name || '');
  for (let i = 0; i < safeName.length; i++) hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

const MIN_SWIPE_PX = 30;

export default function ProductImage({ product, currentPrice }) {
  const [imgError, setImgError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // 📸 Comprehensive image resolution: merges images array, imageUrl, image, variants, handling strings & objects
  const images = (() => {
    const list = [];
    const addImg = (val) => {
      if (!val) return;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed && !list.includes(trimmed)) list.push(trimmed);
      } else if (typeof val === 'object' && val !== null) {
        const url = val.url || val.src || val.imageUrl || val.secure_url;
        if (typeof url === 'string') {
          const trimmed = url.trim();
          if (trimmed && !list.includes(trimmed)) list.push(trimmed);
        }
      }
    };

    // 1. Primary main image first
    addImg(product?.imageUrl);
    addImg(product?.image);

    // 2. Images array or string
    if (Array.isArray(product?.images)) {
      product.images.forEach(addImg);
    } else if (typeof product?.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) parsed.forEach(addImg);
        else addImg(product.images);
      } catch (_) {
        product.images.split(',').forEach(addImg);
      }
    }

    // 3. Variant images if available
    if (Array.isArray(product?.variants)) {
      product.variants.forEach(v => {
        if (Array.isArray(v?.options)) {
          v.options.forEach(opt => {
            addImg(opt?.imageUrl || opt?.image);
          });
        }
      });
    }

    return list;
  })();

  const count = images.length;
  const hasImages = count > 0 && !imgError;
  const currentImg = images[activeIdx] || images[0] || '';

  // Reset active index when product changes
  useEffect(() => {
    setActiveIdx(0);
    setImgError(false);
    setDragOffset(0);
  }, [product?.id]);

  const goTo = (idx) => {
    if (idx < 0) idx = count - 1;
    else if (idx >= count) idx = 0;
    setActiveIdx(idx);
    setImgError(false);
    setDragOffset(0);
  };

  const goPrev = (e) => {
    e?.stopPropagation?.();
    goTo((activeIdx - 1 + count) % count);
  };

  const goNext = (e) => {
    e?.stopPropagation?.();
    goTo((activeIdx + 1) % count);
  };

  // ─── Touch & Pointer / Mouse Drag gesture engine ─────────
  const startCoord = useRef({ x: 0, y: 0 });
  const isPointerDown = useRef(false);
  const isHorizontalSwipe = useRef(null);

  const handleStart = (clientX, clientY) => {
    if (count <= 1) return;
    startCoord.current = { x: clientX, y: clientY };
    isPointerDown.current = true;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  };

  const handleMove = (clientX, clientY) => {
    if (!isPointerDown.current || count <= 1) return;
    const dx = clientX - startCoord.current.x;
    const dy = clientY - startCoord.current.y;

    // Detect direction lock on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontalSwipe.current = Math.abs(dx) >= Math.abs(dy);
      }
    }

    if (isHorizontalSwipe.current) {
      // Elastic resistance at boundaries
      const isAtStart = activeIdx === 0 && dx > 0;
      const isAtEnd = activeIdx === count - 1 && dx < 0;
      const dampedDx = (isAtStart || isAtEnd) ? dx * 0.35 : dx;
      setDragOffset(dampedDx);
    }
  };

  const handleEnd = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    setIsSwiping(false);

    if (isHorizontalSwipe.current && Math.abs(dragOffset) > MIN_SWIPE_PX) {
      if (dragOffset < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    setDragOffset(0);
    isHorizontalSwipe.current = null;
  };

  const handleCancel = () => {
    isPointerDown.current = false;
    setIsSwiping(false);
    setDragOffset(0);
    isHorizontalSwipe.current = null;
  };

  // Touch event listeners
  const onTouchStart = (e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  // Pointer event listeners (desktop mouse drag + stylus + trackpad)
  const onPointerDown = (e) => {
    // Only drag with primary mouse button
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    handleStart(e.clientX, e.clientY);
  };

  const onPointerMove = (e) => {
    handleMove(e.clientX, e.clientY);
  };

  const safeName = String(product?.name || 'Product');

  return (
    <div className="space-y-3 w-full">
      {/* Main Image Container */}
      <div
        className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-xl bg-white border border-slate-200 group select-none touch-pan-y cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleCancel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={handleEnd}
        onPointerCancel={handleCancel}
        onPointerLeave={handleEnd}
      >
        {hasImages ? (
          <>
            {/* Visual Image with Smooth Drag and Fade */}
            <div
              className={`w-full h-full relative transition-transform duration-${isSwiping ? '75' : '300'} ease-out`}
              style={{
                transform: dragOffset !== 0 ? `translateX(${dragOffset}px)` : 'none',
              }}
            >
              <img
                key={activeIdx}
                src={currentImg}
                alt={`${safeName} - ছবি ${activeIdx + 1}`}
                className="w-full h-full object-cover select-none pointer-events-none transition-opacity duration-200"
                onError={() => setImgError(true)}
                draggable={false}
              />
            </div>

            {/* Prev / Next Navigation Arrows — Always visible on mobile, elevated on hover */}
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md active:scale-90 z-20"
                  aria-label="পূর্ববর্তী ছবি (Previous Image)"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md active:scale-90 z-20"
                  aria-label="পরবর্তী ছবি (Next Image)"
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-slate-950/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); goTo(i); }}
                      className={`rounded-full transition-all duration-300 ${
                        i === activeIdx
                          ? 'w-5 h-2 bg-white shadow-md'
                          : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`ছবি ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Image counter badge (e.g. 1/4) */}
                <span className="absolute top-4 left-4 bg-slate-950/60 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-full z-20 tabular-nums shadow">
                  {activeIdx + 1} / {count}
                </span>
              </>
            )}
          </>
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${getFallbackColor(safeName)}`}>
            <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-xl text-center px-4">{safeName}</h2>
          </div>
        )}

        {/* Price badge */}
        {currentPrice !== undefined && currentPrice !== null && (
          <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white px-3.5 py-1.5 rounded-2xl text-base sm:text-lg font-black shadow-lg border border-slate-200/60 dark:border-slate-700/60 z-20">
            ৳{Number(currentPrice).toLocaleString()}
          </div>
        )}

        {/* Category badge */}
        {product?.category && (
          <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-xl text-[11px] font-black z-20">
            {String(product.category)}
          </div>
        )}
      </div>

      {/* 🖼️ Thumbnail Strip — Allows quick 1-click preview of all other pictures */}
      {count > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {images.map((imgUrl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                i === activeIdx
                  ? 'border-purple-600 dark:border-purple-400 ring-2 ring-purple-500/30 scale-105 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
              }`}
              aria-label={`ছবি ${i + 1} থাম্বনেইল`}
            >
              <img
                src={imgUrl}
                alt={`${safeName} থাম্বনেইল ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
