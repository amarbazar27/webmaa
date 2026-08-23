'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function PopupBanner({ data, themeVars, isPreview = false, onDismiss }) {
  const d = resolveSectionData('popup_banner', data);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const delay = parseInt(d?.delay) || 1;
  const primary = themeVars?.primaryColor || '#6D28D9';

  useEffect(() => {
    setMounted(true);
    if (isPreview) {
      setShow(true);
      return;
    }
    // Check if already dismissed this session in storefront
    const key = `popup_dismissed_${d?.imageUrl?.slice(-20)}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(key)) return;

    const timer = setTimeout(() => setShow(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay, d?.imageUrl, isPreview]);

  const dismiss = () => {
    setDismissed(true);
    setShow(false);
    onDismiss?.();
    if (!isPreview && typeof window !== 'undefined') {
      const key = `popup_dismissed_${d?.imageUrl?.slice(-20)}`;
      sessionStorage.setItem(key, '1');
    }
  };

  const handleOverlayClick = () => {
    // In preview mode: always auto dismiss on outside click
    if (isPreview) {
      dismiss();
      return;
    }
    // On live store: respect retailer choice (default is true)
    if (d?.closeOnOutsideClick !== false) {
      dismiss();
    }
  };

  if (!mounted || !d?.imageUrl || !show || dismissed) return null;

  const content = (
    <div
      className={`${
        isPreview ? 'absolute' : 'fixed'
      } inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 select-none`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={handleOverlayClick}
    >
      {/* Modal Card */}
      <div
        className="relative max-w-sm sm:max-w-md md:max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-100/20 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
          aria-label="Close"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Popup Image */}
        <div className="relative w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          <a
            href={d.linkUrl || '#'}
            onClick={d.linkUrl ? undefined : (e) => e.preventDefault()}
            className="w-full flex items-center justify-center"
          >
            <img
              src={d.imageUrl}
              alt={d.title || 'Special Offer'}
              className="w-full h-auto max-h-[50vh] sm:max-h-[55vh] object-contain"
            />
          </a>
        </div>

        {/* Title & Action */}
        <div className="p-4 sm:p-5 bg-white text-center space-y-3">
          {d.title && (
            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
              {d.title}
            </h3>
          )}

          {d.buttonText && (
            <a
              href={d.linkUrl || '#'}
              className="inline-block w-full py-3 px-6 rounded-2xl text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
              style={{ background: primary }}
            >
              {d.buttonText}
            </a>
          )}
        </div>
      </div>
    </div>
  );

  // If rendering inside preview container, don't portal to body
  if (isPreview) {
    return content;
  }

  return createPortal(content, document.body);
}
