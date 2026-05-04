'use client';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

/**
 * ThemeToggleButton — Reusable sun/moon toggle
 * Props:
 *  size: 'sm' | 'md' (default: 'md')
 *  showLabel: boolean (default: false)
 *  className: string
 */
export default function ThemeToggleButton({ size = 'md', showLabel = false, className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const sizeStyles = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-sm',
  };

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`
        ${sizeStyles[size]}
        flex items-center justify-center gap-2 rounded-xl border
        transition-all duration-300 active:scale-90 cursor-pointer
        ${isDark
          ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}
        ${className}
      `}
    >
      {isDark ? <Sun size={size === 'sm' ? 14 : 18} strokeWidth={2} /> : <Moon size={size === 'sm' ? 14 : 18} strokeWidth={2} />}
      {showLabel && (
        <span className="font-black text-[10px] uppercase tracking-widest pr-1">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
