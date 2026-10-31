'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { playTabSound } from '@/lib/sound';

export default function LanguageToggle({ 
  accent = 'purple', // 'purple' | 'emerald' | 'slate'
  className = '' 
}) {
  const { language, setLanguage } = useLanguage();
  const isBn = language === 'bn' || !language;

  // Sync Google Translate on mount if English was previously saved
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('bd_preferred_language');
      if (saved === 'en') {
        applyGoogleTranslate('en');
      }
    } catch (_) {}
  }, []);

  const applyGoogleTranslate = (targetLang) => {
    try {
      if (typeof window === 'undefined') return;
      const host = window.location.hostname;

      if (targetLang === 'en') {
        document.cookie = 'googtrans=/bn/en; path=/;';
        document.cookie = `googtrans=/bn/en; path=/; domain=${host};`;
        document.cookie = 'googtrans=/auto/en; path=/;';
        document.cookie = `googtrans=/auto/en; path=/; domain=${host};`;

        if (!document.getElementById('google_translate_element')) {
          const div = document.createElement('div');
          div.id = 'google_translate_element';
          div.style.display = 'none';
          document.body.appendChild(div);
        }

        if (!window.google || !window.google.translate) {
          window.googleTranslateElementInit = () => {
            try {
              new window.google.translate.TranslateElement({
                pageLanguage: 'bn',
                includedLanguages: 'en,bn',
                autoDisplay: false
              }, 'google_translate_element');
            } catch (_) {}
          };
          if (!document.getElementById('google-translate-script')) {
            const script = document.createElement('script');
            script.id = 'google-translate-script';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.body.appendChild(script);
          }
        } else {
          const combo = document.querySelector('.goog-te-combo');
          if (combo && combo.value !== 'en') {
            combo.value = 'en';
            combo.dispatchEvent(new Event('change'));
          }
        }
      } else {
        // Clear translation cookies for original Bengali
        document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = `googtrans=; path=/; domain=${host}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
          combo.value = 'bn';
          combo.dispatchEvent(new Event('change'));
        }
      }
    } catch (_) {}
  };

  const handleSelect = (lang) => {
    if (lang === language) return;
    playTabSound();
    setLanguage(lang);
    applyGoogleTranslate(lang);
  };

  const activeColorClasses = accent === 'purple'
    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
    : accent === 'emerald'
    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm';

  return (
    <div 
      className={`relative inline-flex items-center p-0.5 sm:p-1 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 select-none shrink-0 shadow-inner backdrop-blur-md transition-all ${className}`}
      role="group"
      aria-label="Language selector"
    >
      {/* 🌊 Liquid Sliding Active Pill Background */}
      <div 
        className={`absolute top-0.5 sm:top-1 bottom-0.5 sm:bottom-1 w-[calc(50%-2px)] sm:w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${activeColorClasses}`}
        style={{
          left: isBn ? '2px' : 'calc(50%)',
        }}
      />

      {/* বাংলা Button */}
      <button
        type="button"
        onClick={() => handleSelect('bn')}
        aria-pressed={isBn}
        title="বাংলা ভাষায় দেখুন"
        className={`relative z-10 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center min-w-[30px] sm:min-w-[36px] ${
          isBn ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        বাং
      </button>

      {/* English Button */}
      <button
        type="button"
        onClick={() => handleSelect('en')}
        aria-pressed={!isBn}
        title="View in English"
        className={`relative z-10 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black font-mono rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center min-w-[30px] sm:min-w-[36px] ${
          !isBn ? (accent === 'slate' ? 'text-slate-900 dark:text-slate-900' : 'text-white') : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        EN
      </button>
    </div>
  );
}
