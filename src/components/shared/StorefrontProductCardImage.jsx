'use client';
import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Camera, SlidersHorizontal } from 'lucide-react';

/**
 * 📸 Comprehensive product image resolver
 * Extracts, normalizes and deduplicates all image URLs from a product object
 */
export function extractProductImages(product) {
  if (!product) return [];
  const list = [];
  const add = (val) => {
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

  // Primary image
  add(product.imageUrl);
  add(product.image);

  // Images array or string
  if (Array.isArray(product.images)) {
    product.images.forEach(add);
  } else if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) parsed.forEach(add);
      else add(product.images);
    } catch (_) {
      product.images.split(',').forEach(add);
    }
  }

  // Variant options images
  if (Array.isArray(product.variants)) {
    product.variants.forEach(v => {
      if (Array.isArray(v?.options)) {
        v.options.forEach(opt => add(opt?.imageUrl || opt?.image));
      }
    });
  }

  return list;
}

const FALLBACK_BG_COLORS = [
  'bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 
  'bg-amber-600', 'bg-cyan-600', 'bg-fuchsia-600'
];

function getCardFallbackColor(name = '') {
  let hash = 0;
  const safeName = String(name || '');
  for (let i = 0; i < safeName.length; i++) hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_BG_COLORS[Math.abs(hash) % FALLBACK_BG_COLORS.length];
}

/**
 * StorefrontProductCardImage
 * - Displays multi-image counter badge (e.g. 📷 3) so shoppers immediately know which products have multiple photos
 * - Enables horizontal swipe on mobile (with pan-y touch action for 60fps vertical scroll)
 * - Provides desktop hover chevrons for browsing without entering the dedicated product page
 * - Prevents unwanted navigation during image swiping gestures
 */
export default function StorefrontProductCardImage({
  product,
  onNavigate,
  className = 'h-40 sm:h-52',
  priority = false,
  showCustomBadge = true,
  discount = 0,
  primaryColor = '#4f46e5',
}) {
  const images = extractProductImages(product);
  const count = images.length;
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Touch gesture state
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwiping = useRef(false);
  const didSwipe = useRef(false);

  const prevImage = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setActiveIdx((prev) => (prev - 1 + count) % count);
  }, [count]);

  const nextImage = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setActiveIdx((prev) => (prev + 1) % count);
  }, [count]);

  const handleTouchStart = (e) => {
    if (count <= 1) return;
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isSwiping.current = true;
    didSwipe.current = false;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping.current || count <= 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    // Detect horizontal swipe intent
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      didSwipe.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!isSwiping.current || count <= 1) return;
    isSwiping.current = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    // Trigger navigation on swipe threshold of 28px
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
      didSwipe.current = true;
      if (dx < 0) {
        nextImage(e);
      } else {
        prevImage(e);
      }
    }
  };

  const handleContainerClick = (e) => {
    if (didSwipe.current) {
      didSwipe.current = false;
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    onNavigate?.(product);
  };

  const currentImage = images[activeIdx] || images[0];

  return (
    <div
      className={`relative w-full overflow-hidden bg-white border-b border-slate-100 cursor-pointer select-none group/img ${className}`}
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: count > 1 ? 'pan-y' : 'auto' }}
    >
      {currentImage && !imgError ? (
        <img
          src={currentImage}
          alt={product?.name || 'পণ্য'}
          onError={() => setImgError(true)}
          loading={priority ? 'eager' : 'lazy'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center p-4 text-center ${getCardFallbackColor(product?.name)}`}>
          <h3 className="text-sm sm:text-base font-black text-white drop-shadow-md leading-tight">
            {product?.name || 'পণ্য'}
          </h3>
        </div>
      )}

      {/* Multi-Image Indicator Badge: Shopper sees 📷 3 immediately from storefront */}
      {count > 1 && (
        <div 
          className="absolute top-2.5 right-2.5 z-20 pointer-events-none flex items-center gap-1 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md border border-white/20 transition-transform active:scale-95"
          title={`${count}টি ছবি রয়েছে (Swipe করুন)`}
        >
          <Camera size={11} strokeWidth={2.5} />
          <span>{activeIdx + 1}/{count}</span>
        </div>
      )}

      {/* Discount Badge */}
      {discount > 0 && (
        <div 
          className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-lg text-[10px] font-black text-white shadow pointer-events-none"
          style={{ background: primaryColor }}
        >
          -{discount}%
        </div>
      )}

      {/* Customization Badge */}
      {showCustomBadge && product?.allowCustomize && !discount && (
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none bg-slate-900/90 backdrop-blur-xs text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm border border-white/10">
          <SlidersHorizontal size={10} /> কাস্টম
        </div>
      )}

      {/* Slide Pagination Dots */}
      {count > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-1 bg-black/45 backdrop-blur-xs px-2 py-0.5 rounded-full">
          {images.slice(0, 6).map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === activeIdx
                  ? 'w-3.5 h-1.5 bg-white shadow-xs'
                  : 'w-1.5 h-1.5 bg-white/55'
              }`}
            />
          ))}
          {count > 6 && (
            <span className="text-[8px] text-white/90 font-bold ml-0.5">+{count - 6}</span>
          )}
        </div>
      )}

      {/* Desktop Chevrons */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prevImage}
            title="পূর্ববর্তী ছবি"
            aria-label="Previous Image"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:scale-110 active:scale-95 cursor-pointer border border-slate-200"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={nextImage}
            title="পরবর্তী ছবি"
            aria-label="Next Image"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:scale-110 active:scale-95 cursor-pointer border border-slate-200"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  );
}
