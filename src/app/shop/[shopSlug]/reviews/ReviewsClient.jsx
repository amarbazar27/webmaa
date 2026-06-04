'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import ReviewSection from '@/components/shop/ReviewSection';

export default function ReviewsClient({ shop }) {
  // Let's resolve the theme just like ShopClient does
  const presetKey = shop?.designPreset || 'classic';
  const overrides = shop?.designOverrides || {};
  
  // Minimal styles fallback
  const primaryColor = overrides.primary || '#7c3aed';
  const bgColor = overrides.bg || '#fafafa';
  const textColor = overrides.text || '#18181b';
  const cardBg = overrides.card || '#ffffff';
  const borderRadius = overrides.radius || '16px';

  return (
    <div 
      style={{
        backgroundColor: bgColor,
        color: textColor,
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
      className="py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href={`/shop/${shop.shopSlug || shop.subdomainSlug}`} 
            className="flex items-center gap-2 font-black text-xs uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: primaryColor }}
          >
            <ArrowLeft size={16} />
            <span>স্টোরে ফিরুন</span>
          </Link>
          <div className="flex items-center gap-2">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs" style={{ background: primaryColor }}>
                {shop.shopName?.[0]}
              </div>
            )}
            <span className="font-extrabold text-sm">{shop.shopName}</span>
          </div>
        </div>

        {/* Card wrapper */}
        <div 
          style={{
            backgroundColor: cardBg,
            borderRadius: borderRadius,
            borderColor: overrides.border || '#e2e8f0'
          }}
          className="p-6 md:p-8 border shadow-xl shadow-slate-900/5 space-y-6"
        >
          <div className="border-b pb-4">
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Star size={24} className="text-amber-500 fill-amber-500" /> {shop.shopName} এর রিভিউসমূহ
            </h1>
            <p className="text-xs opacity-60 font-bold mt-1">গ্রাহকদের কাছ থেকে পাওয়া আমাদের সেবার রেটিং ও মতামত।</p>
          </div>

          <ReviewSection shopId={shop.id} />
        </div>
      </div>
    </div>
  );
}
