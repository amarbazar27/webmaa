'use client';
import { useState, useRef } from 'react';
import { Sparkles, MoveHorizontal } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function BeforeAfter({ data, themeVars }) {
  const d = resolveSectionData('before_after', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const pos = Math.max(0, Math.min(100, (x / width) * 100));
    setSliderPos(pos);
  };

  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div className="text-center max-w-xl mx-auto mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          {d.title || 'Before & After Results'}
        </h2>
        {d.subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium">{d.subtitle}</p>}
      </div>

      <div className="max-w-2xl mx-auto">
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="relative aspect-[4/3] sm:aspect-[16/10] rounded-3xl overflow-hidden shadow-xl select-none cursor-ew-resize border border-slate-100 bg-slate-900"
        >
          {/* After Image (Full background) */}
          {d.afterImage && (
            <img
              src={d.afterImage}
              alt="After"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          )}

          {/* Before Image (Clipped with polygon) */}
          {d.beforeImage && (
            <div
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
            >
              <img
                src={d.beforeImage}
                alt="Before"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Divider Line & Draggable Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20"
            style={{ left: `${sliderPos}%` }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center border-2"
              style={{ borderColor: primary }}
            >
              <MoveHorizontal size={18} strokeWidth={2.5} style={{ color: primary }} />
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow">
            {d.beforeLabel || 'Before'}
          </div>
          <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow">
            {d.afterLabel || 'After'}
          </div>
        </div>

        {d.productName && (
          <div className="mt-4 text-center">
            <p className="text-sm font-black text-slate-800">{d.productName}</p>
            {d.price && (
              <p className="text-sm font-black mt-0.5" style={{ color: primary }}>
                ৳{Number(d.price).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
