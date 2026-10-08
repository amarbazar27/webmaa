'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function LanguageToggle({ 
  accent = 'emerald', // 'emerald' | 'purple' | 'slate'
  className = '' 
}) {
  const { language, setLanguage } = useLanguage();

  const isBn = language === 'bn';

  const activeColorClasses = accent === 'purple'
    ? 'bg-purple-600 text-white shadow-xs'
    : accent === 'slate'
    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
    : 'bg-emerald-600 text-white shadow-xs';

  return (
    <div 
      role="group" 
      aria-label="Language selector"
      className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100/95 dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700/80 select-none shrink-0 transition-all shadow-2xs ${className}`}
    >
      {/* বাংলা বাটন */}
      <button
        type="button"
        onClick={() => setLanguage('bn')}
        aria-pressed={isBn}
        title="বাংলা ভাষায় দেখুন"
        className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] leading-tight font-black transition-all cursor-pointer active:scale-95 ${
          isBn
            ? activeColorClasses
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
        }`}
      >
        বাং
      </button>

      {/* English button */}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={!isBn}
        title="View in English"
        className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] leading-tight font-black font-mono transition-all cursor-pointer active:scale-95 ${
          !isBn
            ? activeColorClasses
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
        }`}
      >
        EN
      </button>
    </div>
  );
}
