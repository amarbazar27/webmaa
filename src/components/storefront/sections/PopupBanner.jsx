'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function PopupBanner({ data, themeVars }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const delay = parseInt(data?.delay) || 1;
  const primary = themeVars?.primaryColor || '#6D28D9';

  useEffect(() => {
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

  if (!data?.imageUrl || !show || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={dismiss}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl bg-white"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'sf-section-in 0.4s ease forwards' }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center hover:bg-black/50 transition-all"
        >
          <X size={16} strokeWidth={3} />
        </button>

        {/* Image */}
        <a href={data.linkUrl || '#'} onClick={data.linkUrl ? undefined : e => e.preventDefault()}>
          <img
            src={data.imageUrl}
            alt={data.title || 'Special Offer'}
            className="w-full object-cover"
            style={{ maxHeight: '520px' }}
          />
        </a>

        {/* Title */}
        {data.title && (
          <div className="px-5 pt-4 pb-1">
            <h3 className="text-base font-black text-slate-900 text-center">{data.title}</h3>
          </div>
        )}

        {/* Button */}
        {data.buttonText && data.linkUrl && (
          <div className="p-4 text-center">
            <a
              href={data.linkUrl}
              className="inline-block px-8 py-3 rounded-2xl text-white font-black text-sm uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ background: primary }}
            >
              {data.buttonText}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
