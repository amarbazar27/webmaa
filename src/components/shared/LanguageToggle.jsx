'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, Check, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export const SUPPORTED_LANGUAGES = [
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩', native: 'Bangla' },
  { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', native: 'Arabic' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', native: 'Hindi' },
  { code: 'es', name: 'Español', flag: '🇪🇸', native: 'Spanish' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', native: 'French' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', native: 'German' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰', native: 'Urdu' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳', native: 'Chinese' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', native: 'Japanese' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', native: 'Turkish' },
  { code: 'ms', name: 'Melayu', flag: '🇲🇾', native: 'Malay' },
  { code: 'id', name: 'Indonesia', flag: '🇮🇩', native: 'Indonesian' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', native: 'Russian' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', native: 'Portuguese' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', native: 'Italian' }
];

export default function LanguageToggle({ 
  accent = 'emerald', // 'emerald' | 'purple' | 'slate'
  className = '' 
}) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCode, setActiveCode] = useState('bn');
  const modalRef = useRef(null);

  // Sync active language code from cookies or context
  useEffect(() => {
    setActiveCode(language || 'bn');
    
    // Check if Google translate cookie exists
    try {
      const match = document.cookie.match(/googtrans=\/auto\/([a-zA-Z\-]+)/);
      if (match && match[1]) {
        setActiveCode(match[1]);
      }
    } catch {}
  }, [language]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Execute language switch across the entire website
  const selectLanguage = (code, name) => {
    setActiveCode(code);
    setIsOpen(false);

    if (code === 'bn' || code === 'en') {
      setLanguage(code);
    }

    try {
      // Clear or set Google translate cookie
      if (code === 'bn') {
        document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        window.location.reload();
        return;
      }

      const cookieVal = `/auto/${code}`;
      document.cookie = `googtrans=${cookieVal}; path=/;`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname};`;

      // Trigger translate element or load script
      if (!window.google || !window.google.translate) {
        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);

        window.googleTranslateElementInit = () => {
          new window.google.translate.TranslateElement({
            pageLanguage: 'bn',
            autoDisplay: false
          }, 'google_translate_element');
        };
      }

      toast.success(`${name} ভাষায় পরিবর্তন করা হয়েছে 🌐`);
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      console.error('Translation error:', err);
    }
  };

  const isBn = activeCode === 'bn';
  const isEn = activeCode === 'en';

  const activeColorClasses = accent === 'purple'
    ? 'bg-purple-600 text-white shadow-xs'
    : accent === 'slate'
    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
    : 'bg-emerald-600 text-white shadow-xs';

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.native.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === activeCode) || SUPPORTED_LANGUAGES[0];

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={modalRef}>
      {/* Hidden placeholder for Google Translate element */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      <div 
        role="group" 
        aria-label="Language selector"
        className="inline-flex items-center p-0.5 rounded-lg bg-slate-100/95 dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700/80 select-none shrink-0 transition-all shadow-2xs gap-0.5"
      >
        {/* বাংলা বাটন */}
        <button
          type="button"
          onClick={() => selectLanguage('bn', 'বাংলা')}
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
          onClick={() => selectLanguage('en', 'English')}
          aria-pressed={isEn}
          title="View in English"
          className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] leading-tight font-black font-mono transition-all cursor-pointer active:scale-95 ${
            isEn
              ? activeColorClasses
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
          }`}
        >
          EN
        </button>

        {/* 🌐 All Languages Dropdown Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          title="সকল আন্তর্জাতিক ভাষা (Select Any Language)"
          className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] leading-tight font-black transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
            !isBn && !isEn
              ? activeColorClasses
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Globe size={12} className={!isBn && !isEn ? 'animate-spin' : ''} />
          {!isBn && !isEn && <span className="uppercase text-[9px] font-mono">{activeCode}</span>}
        </button>
      </div>

      {/* 🌍 Modern Dropdown Language Modal */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 z-[999999] backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-2">
            <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
              <Globe size={14} className="text-emerald-600 dark:text-emerald-400" />
              ভাষা নির্বাচন করুন
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
            >
              <X size={14} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search language..."
              className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Languages List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredLanguages.map((lang) => {
              const isSelected = activeCode === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => selectLanguage(lang.code, lang.name)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="font-bold">{lang.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({lang.native})</span>
                  </div>
                  {isSelected && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
