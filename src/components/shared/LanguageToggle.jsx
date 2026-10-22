'use client';

import { useLanguage } from '@/context/LanguageContext';
import { playTabSound } from '@/lib/sound';

export default function LanguageToggle({ 
  accent = 'purple', // 'purple' | 'emerald' | 'slate'
  className = '' 
}) {
  const { language, setLanguage } = useLanguage();
  const isBn = language === 'bn' || !language;

  const handleSelect = (lang) => {
    if (lang === language) return;
    playTabSound();
    setLanguage(lang);
    
    // Clean up any stale google translate cookies to prevent script hangs
    try {
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      if (typeof window !== 'undefined' && window.location.hostname) {
        document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      }
    } catch (_) {}
  };

  const activeColorClasses = accent === 'purple'
    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
    : accent === 'emerald'
    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm';

  return (
    <div 
      className={`relative inline-flex items-center p-1 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 select-none shrink-0 shadow-inner backdrop-blur-md transition-all ${className}`}
      role="group"
      aria-label="Language selector"
    >
      {/* 🌊 Liquid Sliding Active Pill Background */}
      <div 
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${activeColorClasses}`}
        style={{
          left: isBn ? '4px' : 'calc(50%)',
        }}
      />

      {/* বাংলা Button */}
      <button
        type="button"
        onClick={() => handleSelect('bn')}
        aria-pressed={isBn}
        title="বাংলা ভাষায় দেখুন"
        className={`relative z-10 px-2.5 py-1 text-xs font-black rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center min-w-[36px] ${
          isBn ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        বাংলা
      </button>

      {/* English Button */}
      <button
        type="button"
        onClick={() => handleSelect('en')}
        aria-pressed={!isBn}
        title="View in English"
        className={`relative z-10 px-2.5 py-1 text-xs font-black font-mono rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center min-w-[36px] ${
          !isBn ? (accent === 'slate' ? 'text-slate-900 dark:text-slate-900' : 'text-white') : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        EN
      </button>
    </div>
  );
}
