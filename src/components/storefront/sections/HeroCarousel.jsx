'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroCarousel({ data, themeVars }) {
  const [active, setActive] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const timerRef = useRef(null);
  const slides = data?.slides || [];
  const primary = themeVars?.primaryColor || '#6D28D9';

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActive(p => (p + 1) % slides.length);
    }, data?.interval ? data.interval * 1000 : 4000);
    return () => clearInterval(timerRef.current);
  }, [slides.length, data?.interval]);

  const prev = () => { clearInterval(timerRef.current); setActive(p => (p === 0 ? slides.length - 1 : p - 1)); };
  const next = () => { clearInterval(timerRef.current); setActive(p => (p + 1) % slides.length); };

  const onTouchStart = e => setTouchStart(e.targetTouches[0].clientX);
  const onTouchMove = e => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (touchStart - touchEnd > 50) next();
    if (touchEnd - touchStart > 50) prev();
    setTouchStart(null); setTouchEnd(null);
  };

  if (!slides.length) return null;

  return (
    <div className="sf-hero relative w-full overflow-hidden bg-slate-100 group/banner" style={{ height: 'clamp(220px, 45vw, 500px)' }}>
      <div
        className="w-full h-full"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 w-full h-full transition-all duration-700 ${
              i === active ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-[1.02] pointer-events-none'
            }`}
          >
            {slide.url && (
              <>
                <div className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-30" style={{ backgroundImage: `url(${slide.url})` }} />
                <img
                  src={slide.url}
                  alt={slide.title || `Slide ${i + 1}`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="absolute inset-0 w-full h-full object-contain z-10"
                />
              </>
            )}
            {(slide.title || slide.description) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent z-20 flex flex-col justify-end p-5 md:p-12">
                <div className="max-w-xl">
                  {slide.title && <h2 className="text-xl md:text-4xl font-black text-white mb-2 drop-shadow">{slide.title}</h2>}
                  {slide.description && <p className="text-sm md:text-base text-white/80 mb-4 line-clamp-2">{slide.description}</p>}
                  {slide.linkUrl && (
                    <a href={slide.linkUrl} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95" style={{ background: primary }}>
                      {slide.buttonText || 'Shop Now'}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      {slides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/20 backdrop-blur text-white hover:bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-all"><ChevronLeft size={20} strokeWidth={3} /></button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/20 backdrop-blur text-white hover:bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-all"><ChevronRight size={20} strokeWidth={3} /></button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} className={`rounded-full transition-all ${i === active ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
