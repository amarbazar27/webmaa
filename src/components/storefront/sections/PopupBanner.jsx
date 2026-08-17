'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function PopupBanner({ data, themeVars }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const delay = parseInt(data?.delay) || 1;
  const primary = themeVars?.primaryColor || '#6D28D9';

  useEffect(() => {
    setMounted(true);
    // Check if already dismissed this session
    const key = `popup_dismissed_${data?.imageUrl?.slice(-20)}`;
    if (sessionStorage.getItem(key)) return;

    const timer = setTimeout(() => setShow(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay, data?.imageUrl]);

  const dismiss = () => {
    setDismissed(true);
    setShow(false);
    const key = `popup_dismissed_${data?.imageUrl?.slice(-20)}`;
    sessionStorage.setItem(key, '1');
  };

  if (!mounted || !data?.imageUrl || !show || dismissed) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 select-none" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={dismiss}
    >
      {/* Modal Card */}
      <div
        className="relative max-w-lg md:max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-100/20 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'sf-section-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
          aria-label="Close"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Popup Image — Full view, never cropped */}
        <div className="relative w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          <a 
            href={data.linkUrl || '#'} 
            onClick={data.linkUrl ? undefined : e => e.preventDefault()}
            className="w-full flex items-center justify-center"
          >
            <img
              src={data.imageUrl}
              alt={data.title || 'Special Offer'}
              className="w-full h-auto max-h-[60vh] object-contain"
            />
          </a>
        </div>

        {/* Title if defined */}
        {data.title && (
          <div className="px-6 pt-4 pb-1 bg-white">
            <h3 className="text-base sm:text-lg font-black text-slate-900 text-center">{data.title}</h3>
          </div>
        )}

        {/* Action Button if defined */}
        {data.buttonText && data.linkUrl && (
          <div className="p-4 sm:p-5 text-center bg-white border-t border-slate-100">
            <a
              href={data.linkUrl}
              className="inline-block w-full sm:w-auto px-8 py-3 rounded-2xl text-white font-black text-sm uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-xl"
              style={{ background: primary }}
            >
              {data.buttonText}
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
