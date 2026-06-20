'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FALLBACK_COLORS = ['bg-indigo-600','bg-emerald-600','bg-rose-600','bg-amber-600','bg-cyan-600','bg-fuchsia-600'];
function getFallbackColor(name = '') {
  let hash = 0;
  const safeName = String(name || '');
  for (let i = 0; i < safeName.length; i++) hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export default function ProductImage({ product, currentPrice }) {
  const [imgError, setImgError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const safeName = String(product?.name || 'Unknown');

  // Build the image list: prefer images[] array, fallback to imageUrl
  const images = (() => {
    if (Array.isArray(product?.images) && product.images.length > 0) return product.images;
    if (product?.imageUrl) return [product.imageUrl];
    return [];
  })();

  const hasImages = images.length > 0 && !imgError;
  const currentImg = images[activeIdx] || '';

  const goPrev = (e) => {
    e.stopPropagation();
    setActiveIdx(i => (i - 1 + images.length) % images.length);
    setImgError(false);
  };
  const goNext = (e) => {
    e.stopPropagation();
    setActiveIdx(i => (i + 1) % images.length);
    setImgError(false);
  };

  return (
    <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl bg-white border border-slate-200 group">
      {hasImages ? (
        <>
          {/* Main Image */}
          {currentImg.startsWith('http') ? (
            <img
              src={currentImg}
              alt={safeName}
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <Image
              src={currentImg}
              alt={safeName}
              fill
              priority
              className="object-cover"
              onError={() => setImgError(true)}
            />
          )}

          {/* Prev / Next arrows — only show when multiple images */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                aria-label="Next image"
              >
                <ChevronRight size={18} />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveIdx(i); setImgError(false); }}
                    className={`rounded-full transition-all duration-200 ${
                      i === activeIdx
                        ? 'w-4 h-1.5 bg-white shadow'
                        : 'w-1.5 h-1.5 bg-white/60'
                    }`}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>

              {/* Counter badge */}
              <span className="absolute top-14 right-3 bg-black/60 text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10">
                {activeIdx + 1}/{images.length}
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
