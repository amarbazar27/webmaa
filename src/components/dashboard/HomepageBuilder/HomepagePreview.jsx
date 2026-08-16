'use client';
import { Monitor, Smartphone, LayoutDashboard } from 'lucide-react';

const SECTION_LABELS = {
  hero_carousel:     { label: 'Hero Banner Carousel', color: '#6D28D9', emoji: '🖼️' },
  category_scroller: { label: 'Category Scroller', color: '#0284C7', emoji: '🔵' },
  banner_row:        { label: 'Promo Banners', color: '#059669', emoji: '📢' },
  flash_sale:        { label: 'Flash Sale ⚡', color: '#EF4444', emoji: '⚡' },
  product_grid:      { label: 'Product Grid', color: '#7C3AED', emoji: '🛍️' },
  concern_grid:      { label: 'Concern / Theme Grid', color: '#DB2777', emoji: '✨' },
  video_reels:       { label: 'Video Reels', color: '#DC2626', emoji: '🎬' },
  brand_marquee:     { label: 'Brand Marquee', color: '#D97706', emoji: '⭐' },
  bundle_section:    { label: 'Bundle Deals', color: '#059669', emoji: '🎁' },
  photo_reviews:     { label: 'Customer Reviews', color: '#7C3AED', emoji: '💬' },
  price_tier_store:  { label: 'Price Tier Store', color: '#0891B2', emoji: '🏷️' },
  instagram_feed:    { label: 'Instagram Feed', color: '#E1306C', emoji: '📸' },
};

export default function HomepagePreview({ sections, theme, shop, mode }) {
  const sorted = [...(sections || [])].sort((a, b) => a.order - b.order);
  const primary = theme?.primaryColor || '#6D28D9';
  const isMobile = mode === 'mobile';

  return (
    <div className="flex flex-col items-center">
      <div
        className={`transition-all duration-300 ${
          isMobile
            ? 'w-[375px] shadow-2xl rounded-[2.5rem] overflow-hidden border-[8px] border-slate-800'
            : 'w-full rounded-2xl shadow-lg border border-slate-200 overflow-hidden'
        }`}
      >
        {/* Fake Header */}
        <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} className="w-7 h-7 rounded-xl object-contain" alt="logo" />
            ) : (
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{ background: primary }}>
                {shop?.shopName?.[0] || 'S'}
              </div>
            )}
            <span className="text-sm font-black text-slate-800">{shop?.shopName || 'আপনার শপ'}</span>
          </div>
          <div className="w-6 h-6 rounded-full" style={{ background: primary + '20' }}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full" style={{ background: primary }} />
            </div>
          </div>
        </div>

        {/* Section Blocks */}
        <div className="bg-slate-50 overflow-y-auto" style={{ maxHeight: isMobile ? '700px' : '75vh' }}>
          {sorted.filter(s => s.enabled).map((section, i) => {
            const meta = SECTION_LABELS[section.type] || { label: section.type, color: '#6B7280', emoji: '📦' };
            return (
              <div key={section.id} className="m-2">
                {/* Visual Section Block */}
                <div
                  className="rounded-2xl p-4 flex items-center gap-3 border"
                  style={{ background: meta.color + '08', borderColor: meta.color + '20' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
                    style={{ background: meta.color + '15' }}
                  >
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black" style={{ color: meta.color }}>{meta.label}</p>
                    {section.data?.slides?.length > 0 && (
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{section.data.slides.length} slides</p>
                    )}
                    {section.data?.items?.length > 0 && (
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{section.data.items.length} items</p>
                    )}
                    {section.data?.urls?.length > 0 && (
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{section.data.urls.length} reels</p>
                    )}
                    {section.data?.brands?.length > 0 && (
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{section.data.brands.length} brands</p>
                    )}
                    {section.data?.title && (
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">"{section.data.title}"</p>
                    )}
                  </div>
                  <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                </div>

                {/* Separator Connector */}
                {i < sorted.filter(s => s.enabled).length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-3 bg-slate-200 rounded-full" />
                  </div>
                )}
              </div>
            );
          })}

          {sorted.filter(s => s.enabled).length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <LayoutDashboard size={32} className="text-slate-300 mb-3" />
              <p className="text-sm font-black text-slate-400">কোনো section চালু নেই</p>
              <p className="text-xs text-slate-300 font-medium mt-1">বাম দিকের panel থেকে sections চালু করুন</p>
            </div>
          )}

          {/* Footer preview */}
          <div className="m-2 mt-0 p-4 bg-slate-800 rounded-2xl">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="h-2 bg-slate-600 rounded-full w-16" />
                <div className="h-1.5 bg-slate-700 rounded-full w-12" />
                <div className="h-1.5 bg-slate-700 rounded-full w-14" />
              </div>
              <div className="space-y-1.5">
                <div className="h-2 bg-slate-600 rounded-full w-14" />
                <div className="h-1.5 bg-slate-700 rounded-full w-10" />
                <div className="h-1.5 bg-slate-700 rounded-full w-12" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: primary }} />
              <div className="h-1 bg-slate-600 rounded-full w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
