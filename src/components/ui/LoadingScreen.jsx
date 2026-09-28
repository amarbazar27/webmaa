'use client';

import React from 'react';

export default function LoadingScreen({ shop = null }) {
  const shopName = shop?.shopName || shop?.name || 'BD Retailers';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090E] text-slate-900 dark:text-slate-100 p-3 sm:p-5 max-w-7xl mx-auto space-y-4 animate-fadeIn">
      {/* ── 1. Top Native App Bar Skeleton (Picture 4) ── */}
      <div className="flex items-center justify-between gap-3 pt-1 pb-2">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          {/* Logo / Brand Avatar */}
          <div className="w-10 h-10 rounded-2xl skeleton shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-32 rounded-full skeleton" />
            <div className="h-2.5 w-20 rounded-full skeleton opacity-70" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl skeleton" />
          <div className="w-9 h-9 rounded-xl skeleton" />
        </div>
      </div>

      {/* ── 2. Search Input Capsule Skeleton ── */}
      <div className="w-full h-11 rounded-2xl skeleton" />

      {/* ── 3. Hero Promo Banner Card Skeleton (Picture 4) ── */}
      <div className="w-full h-44 sm:h-56 md:h-64 rounded-3xl skeleton relative overflow-hidden p-5 flex flex-col justify-end space-y-2.5">
        <div className="h-5 w-48 rounded-full bg-white/30 dark:bg-white/10" />
        <div className="h-3.5 w-72 rounded-full bg-white/20 dark:bg-white/5" />
        <div className="h-8 w-28 rounded-xl bg-white/30 dark:bg-white/10 mt-2" />
      </div>

      {/* ── 4. Horizontal Category Pills Row Skeleton (Picture 4) ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[72, 88, 64, 80, 96, 76, 84].map((width, idx) => (
          <div
            key={idx}
            className="h-8 rounded-full skeleton shrink-0"
            style={{ width: `${width}px` }}
          />
        ))}
      </div>

      {/* ── 5. Product Grid 2-to-6 Column Native Skeleton (Picture 4) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 pt-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((id) => (
          <div
            key={id}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 space-y-2.5 shadow-2xs"
          >
            {/* Thumbnail */}
            <div className="aspect-square w-full rounded-xl skeleton" />
            
            {/* Title lines */}
            <div className="space-y-1.5 pt-0.5">
              <div className="h-3.5 w-11/12 rounded-full skeleton" />
              <div className="h-3 w-7/12 rounded-full skeleton opacity-75" />
            </div>

            {/* Price & Cart button skeleton */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <div className="h-4 w-14 rounded-full skeleton" />
              <div className="h-7 w-16 rounded-xl skeleton" />
            </div>
          </div>
        ))}
      </div>

      {/* ── 6. Mobile Bottom App Bar Skeleton (Picture 4) ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 h-14 px-6 flex items-center justify-between">
        {[1, 2, 3, 4].map((tab) => (
          <div key={tab} className="w-8 h-8 rounded-full skeleton" />
        ))}
      </div>
    </div>
  );
}
