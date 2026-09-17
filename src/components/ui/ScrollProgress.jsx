'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentProgress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
          setScrollProgress(currentProgress);
          setShowScrollTop(window.scrollY > 350);
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

  return (
    <>
      {/* ⚡ Scroll Progress Indicator (Top 2px Line) */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 z-[100] transition-all duration-75 pointer-events-none no-print"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* 🚀 Scroll Back To Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-20 sm:bottom-6 right-5 z-40 w-11 h-11 rounded-2xl bg-white/90 dark:bg-slate-900/90 hover:bg-purple-600 dark:hover:bg-purple-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-purple-600 shadow-xl shadow-purple-900/10 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer active:scale-95 group no-print animate-fade-in"
          title="উপরে যান (Scroll to top)"
          aria-label="Scroll to top"
        >
          <ChevronUp size={20} className="group-hover:-translate-y-0.5 transition-transform stroke-[2.5]" />
        </button>
      )}
    </>
  );
}
