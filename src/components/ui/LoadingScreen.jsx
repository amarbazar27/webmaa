'use client';
import { useEffect, useState } from 'react';

/**
 * Premium LoadingScreen — used during:
 *  - Initial page load (first-time visitors only)
 *  - Auth processing
 *
 * Design:
 *  - Soft gradient background (dark)
 *  - Centered animated logo/image with fade+scale
 *  - Rotating Islamic dhikr text (no "Loading..." text)
 *  - Minimum 0.8s display to avoid flicker
 *  - Auto-hides when content is ready (controlled by parent via `visible` prop)
 */
export default function LoadingScreen({ text, visible = true, minDuration = 1000, shop = null, products = [] }) {
  const [show, setShow] = useState(true);
  const [textIdx, setTextIdx] = useState(0);
  const dhikr = ['সুবহানআল্লাহ', 'আলহামদুলিল্লাহ', 'আল্লাহু আকবার', 'বিসমিল্লাহ'];

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
    const iv = setInterval(() => setTextIdx(i => (i + 1) % dhikr.length), 1800);
    return () => clearInterval(iv);
  }, [dhikr.length]);

  if (!show) return null;

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
      <div className="relative flex items-center justify-center mb-12" style={{ width: 140, height: 140 }}>
        {/* Animated Rings */}
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
          <div className="text-white font-black">
            <svg width="54" height="54" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="wm-grad-L" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A5B4FC" />
                  <stop offset="100%" stopColor="#F472B6" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="url(#wm-grad-L)" opacity="0.1" />
              <text x="50" y="65" textAnchor="middle" fill="url(#wm-grad-L)" fontSize="50" fontWeight="900">W</text>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Rotating text ── */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-10 flex items-center justify-center" style={{ width: 300 }}>
          <p
            key={textIdx}
            className="absolute text-center font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-indigo-300 text-2xl animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {dhikr[textIdx]}
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {dhikr.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === textIdx ? 'w-8 bg-purple-500' : 'w-1.5 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Dynamic Ad Hook (Optional, placeholder for future logic) ── */}
      {products.length > 0 && !shop?.isLiteMode && (
         <div className="absolute bottom-12 px-6 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 max-w-[280px]">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">প্রোমোশন</p>
            <p className="text-sm font-bold text-white/90 line-clamp-1">{products[0].name}</p>
         </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
