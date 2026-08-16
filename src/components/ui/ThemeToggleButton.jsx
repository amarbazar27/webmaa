'use client';
import { useState, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

/**
 * ThemeToggleButton — Interactive swipable switch for Light & Dark mode
 * 
 * Props:
 *  - size: 'sm' | 'md' | 'lg' (default: 'sm')
 *  - showLabel: boolean (default: false)
 *  - className: string
 */
export default function ThemeToggleButton({ size = 'sm', showLabel = false, className = '' }) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // Touch swipe handling
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Dominant horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 15) {
      if (diffX > 0 && !isDark) {
        // Swiped right -> dark
        setTheme('dark');
        touchStartX.current = currentX;
      } else if (diffX < 0 && isDark) {
        // Swiped left -> light
        setTheme('light');
        touchStartX.current = currentX;
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setTheme('dark');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setTheme('light');
    }
  };

  // Dimensions configuration
  const config = {
    sm: {
      track: 'w-12 h-6.5 px-0.5',
      thumb: 'w-5.5 h-5.5',
      iconSize: 12,
      translateDark: 'translate-x-5.5',
      translateLight: 'translate-x-0',
      text: 'text-[10px]',
    },
    md: {
      track: 'w-15 h-8 px-1',
      thumb: 'w-6 h-6',
      iconSize: 14,
      translateDark: 'translate-x-7',
      translateLight: 'translate-x-0',
      text: 'text-xs',
    },
    lg: {
      track: 'w-18 h-9.5 px-1.5',
      thumb: 'w-7 h-7',
      iconSize: 16,
      translateDark: 'translate-x-8.5',
      translateLight: 'translate-x-0',
      text: 'text-sm',
    }
  };

  const currentConfig = config[size] || config.sm;

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to Light Mode (লাইট মোড)' : 'Switch to Dark Mode (ডার্ক মোড)'}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        onClick={toggleTheme}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          ${currentConfig.track}
          relative inline-flex items-center rounded-full cursor-pointer
          transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
          border active:scale-95 group shadow-inner shrink-0
          ${isDark 
            ? 'bg-slate-900 border-slate-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]' 
            : 'bg-slate-200/90 border-slate-300/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]'}
        `}
      >
        {/* Background icon markers for depth */}
        <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity">
          <Sun size={currentConfig.iconSize - 2} className="text-amber-500 shrink-0" />
          <Moon size={currentConfig.iconSize - 2} className="text-indigo-400 shrink-0" />
        </div>

        {/* Sliding Thumb Knob */}
        <span
          className={`
            ${currentConfig.thumb}
            ${isDark ? currentConfig.translateDark : currentConfig.translateLight}
            inline-flex items-center justify-center rounded-full
            transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            shadow-md z-10
            ${isDark 
              ? 'bg-gradient-to-tr from-indigo-950 via-slate-800 to-indigo-800 border border-indigo-500/40 text-amber-300 shadow-indigo-950/60' 
              : 'bg-gradient-to-tr from-white to-amber-50 border border-amber-200/60 text-amber-500 shadow-amber-500/10'}
          `}
        >
          {isDark ? (
            <Moon 
              size={currentConfig.iconSize} 
              className="transform rotate-12 transition-transform duration-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)] fill-amber-300/20" 
            />
          ) : (
            <Sun 
              size={currentConfig.iconSize} 
              className="transform rotate-0 transition-transform duration-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] fill-amber-400/20" 
            />
          )}
        </span>
      </button>

      {showLabel && (
        <span 
          onClick={toggleTheme}
          className={`font-black uppercase tracking-wider cursor-pointer select-none transition-colors ${currentConfig.text} ${
            isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </div>
  );
}
