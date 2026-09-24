'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollControls, setShowScrollControls] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentProgress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
          setScrollProgress(currentProgress);
          setShowScrollControls(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <>
      {/* ⚡ Scroll Progress Indicator (Top 2px Solid Line) */}
      <div 
        className="fixed top-0 left-0 h-0.5 bg-emerald-600 dark:bg-emerald-500 z-[100] transition-all duration-75 pointer-events-none no-print"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* 🚀 Smart Left-Docked Quick Scroller (Non-overlapping with right-side Cart/Chat) */}
      {showScrollControls && (
        <aside 
          aria-label="Page navigation"
          className="fixed left-3 sm:left-6 bottom-20 sm:bottom-8 z-40 flex flex-col gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg text-slate-700 dark:text-slate-300 no-print animate-fade-in select-none"
        >
          <button
            type="button"
            onClick={scrollToTop}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer active:scale-90"
            title="উপরে যান (Scroll to top)"
            aria-label="Scroll to top"
          >
            <ChevronUp size={18} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={scrollToBottom}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer active:scale-90"
            title="নিচে যান (Scroll to bottom)"
            aria-label="Scroll to bottom"
          >
            <ChevronDown size={18} className="stroke-[2.5]" />
          </button>
        </aside>
      )}
    </>
  );
}
