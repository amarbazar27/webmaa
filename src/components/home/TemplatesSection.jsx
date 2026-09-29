'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Eye, ArrowRight, ExternalLink, Check, Star, 
  ShoppingBag, ShieldCheck, Zap, Layers, Store, Layout
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  DEFAULT_WEBSITE_TEMPLATES, 
  TEMPLATE_CATEGORIES, 
  getMergedTemplates, 
  getDemoUrl 
} from '@/lib/templatesData';

const TEMPLATE_DESCRIPTIONS_EN = {
  health_pharmacy: 'Prescription upload, DGDA-approved genuine medicines, health concern navigation, and 24/7 registered pharmacist support.',
  fresh_grocery: 'Live daily market price scroller, fresh vegetables & meat, monthly grocery savings bundles, and quick weight-based ordering.',
  fashion_editorial: 'Elegant lookbook, shoppable Instagram reels, real-time color and size variant switcher, and luxury runway design.',
  tech_electronics: 'Star Tech-style technical specs tables, official brand warranty badges, EMI calculator, and dark neon cyber styling.',
  luxury_beauty: 'Before-after result sliders, 4-step skincare routine builder, verified customer selfie reviews, and soft rose-gold aesthetic.',
  restaurant_food: 'Live food menu tabs, spice level selector, 30-minute hot express delivery counter, and chef-special family buckets.',
  jewelry_gold: 'Dramatic black and 24K gold finish, diamond macro preview, hallmark authenticity certification, and VIP gift packaging.',
  wholesale_b2b: 'Quantity-tiered pricing ladders, Minimum Order Quantity (MOQ) controls, and corporate RFQ invoice generation.',
  supermarket_deals: 'Multi-departmental category grids, mega weekly deals, flash sale countdown timers, and streamlined checkout.',
  boutique_minimal: 'Minimalist boutique layout, curated apparel collections, fast checkout, and mobile-first experience.',
  gadget_accessories: 'Trending mobile accessories, fast cable and charger showcase, brand warranty tags, and quick cart.',
  organic_herbal: '100% natural organic oils, herbal remedies, certified pure ingredients, and eco-friendly aesthetic.',
  home_living: 'Modern furniture & decor showroom, room-by-room inspiration, dimensional specs, and secure delivery.',
  sports_fitness: 'Protein supplements, athletic dry-fit sportswear, heavy gym equipment, and fitness accessories.',
  books_stationery: 'Bestseller novels, self-improvement books, Islamic literature, and premium journals & fountain pens.',
  baby_kids: 'Baby diapers, BPA-free feeding bottles, organic baby lotions, and Montessori educational toys.'
};

const TEMPLATE_BADGES_EN = {
  health_pharmacy: 'Emergency Prescription',
  fresh_grocery: 'Super Deals',
  fashion_editorial: 'Runway Trends',
  tech_electronics: 'Official Warranty',
  luxury_beauty: 'Korean Glass Skin',
  restaurant_food: '30-Min Delivery',
  jewelry_gold: 'Hallmark 22K/24K',
  wholesale_b2b: 'Tiered Bulk Pricing',
  supermarket_deals: 'Mega Savings',
  boutique_minimal: 'Trending',
  gadget_accessories: 'Best Gadgets',
  organic_herbal: '100% Organic',
  home_living: 'Eco-Living',
  sports_fitness: 'Pro Fitness',
  books_stationery: 'Bestsellers',
  baby_kids: 'Doctor Choice'
};

export default function TemplatesSection({ globalConfig = {} }) {
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const templates = getMergedTemplates(globalConfig?.websiteTemplates, globalConfig?.deletedTemplateIds);

  const filteredTemplates = templates.filter(tpl => {
    const matchCategory = activeCategory === 'all' || tpl.category === activeCategory;
    return matchCategory && tpl.isActive !== false;
  }).slice(0, 6);

  return (
    <section id="templates" className="relative z-20 py-8 sm:py-12 scroll-mt-20 overflow-hidden bg-white/80 border-y border-slate-200/80 my-4 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div className="text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
              <Layout size={13} />
              <span>{t('রেডিমেড স্টোর ডিজাইন', 'Readymade Store Designs')}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t('রেডিমেড ওয়েবসাইট ', 'Readymade Website ')}<span className="text-emerald-600">{t('ডিজাইন ও লাইভ ডেমো', 'Designs & Live Demo')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl leading-relaxed">
              {t('আপনার ব্যবসার ক্যাটাগরি অনুযায়ী পছন্দসই ওয়েবসাইট নির্বাচন করুন। সরাসরি *.bdretailers.com এ ডেমো চালান এবং ১ ক্লিকেই চালু করুন নিজস্ব ইকমার্স শপ।', 'Choose a website design tailored to your business category. Test live demos directly on *.bdretailers.com and launch your own e-commerce shop in 1 click.')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <span>{t('সব ১৫+ ডিজাইন দেখুন', 'View All 15+ Designs')}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3.5">
          {TEMPLATE_CATEGORIES.slice(0, 7).map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{language === 'en' ? (cat.labelEn || cat.label) : cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Templates Cards Grid — 2 in a row on mobile (grid-cols-2), 3 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filteredTemplates.map((tpl) => {
            const liveUrl = getDemoUrl(tpl);

            return (
              <div
                key={tpl.id}
                className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between shadow-xs"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
                    <img 
                      src={tpl.thumbnail} 
                      alt={tpl.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge */}
                    {tpl.badge && (
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold text-white shadow-xs bg-slate-900/90 border border-slate-700">
                        {language === 'en' ? (tpl.badgeEn || TEMPLATE_BADGES_EN[tpl.id] || tpl.badge) : (tpl.badgeBn || tpl.badge)}
                      </div>
                    )}

                    {/* Subdomain Pill */}
                    <div className="hidden sm:flex absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-700 bg-white/95 border border-emerald-500/30 items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{tpl.demoSubdomain}.bdretailers.com</span>
                    </div>

                    {/* Quick Action Overlay (Desktop) */}
                    <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center gap-2 p-3">
                      <Link
                        href={`/templates/preview/${tpl.id}`}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Eye size={13} />
                        <span>{t('লাইভ ডেমো', 'Live Demo')}</span>
                      </Link>
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all flex items-center justify-center"
                        title={t('নতুন ট্যাবে সাইট দেখুন', 'Open site in new tab')}
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-3 sm:p-5 space-y-1.5 sm:space-y-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-600 truncate">
                        {language === 'en' ? (tpl.category || tpl.categoryBn) : (tpl.categoryBn || tpl.category)}
                      </span>
                      <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-amber-500 font-bold shrink-0">
                        <Star size={11} className="fill-amber-500" />
                        <span>{tpl.rating || '4.9'}</span>
                      </div>
                    </div>

                    <h3 className="text-xs sm:text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                      {language === 'en' ? (tpl.title || tpl.titleBn) : (tpl.titleBn || tpl.title)}
                    </h3>

                    <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed font-medium line-clamp-1 sm:line-clamp-2">
                      {language === 'en' ? (tpl.descriptionEn || TEMPLATE_DESCRIPTIONS_EN[tpl.id] || tpl.description) : (tpl.descriptionBn || tpl.description)}
                    </p>

                    {/* Color dots */}
                    <div className="hidden sm:flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold">{t('রং:', 'Colors:')}</span>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: tpl.primaryColor }} />
                        <span className="w-3 h-3 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: tpl.secondaryColor }} />
                        <span className="w-3 h-3 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: tpl.accentColor }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="p-2.5 sm:p-5 pt-0 grid grid-cols-2 gap-1.5 sm:gap-2">
                  <Link
                    href={`/templates/preview/${tpl.id}`}
                    className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] sm:text-xs border border-slate-200 transition-all flex items-center justify-center gap-1"
                  >
                    <Eye size={12} />
                    <span>{t('ডেমো', 'Demo')}</span>
                  </Link>
                  <Link
                    href={`/become-retailer?selectedTheme=${tpl.id}`}
                    className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] sm:text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1 text-center"
                  >
                    <Check size={12} />
                    <span>{t('সিলেক্ট', 'Select')}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Callout */}
        <div className="mt-6 text-center">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 text-slate-900 hover:text-emerald-600 font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95"
          >
            <span>{t('সকল রেডিমেড ওয়েবসাইট ও ডিজাইন ব্রাউজ করুন', 'Browse All Readymade Websites & Designs')}</span>
            <ArrowRight size={14} className="text-emerald-600" />
          </Link>
        </div>

      </div>
    </section>
  );
}
