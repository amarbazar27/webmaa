'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, Eye, ArrowRight, ExternalLink, Check, Star, 
  ShoppingBag, ShieldCheck, Zap, Layers, Store
} from 'lucide-react';
import { 
  DEFAULT_WEBSITE_TEMPLATES, 
  TEMPLATE_CATEGORIES, 
  getMergedTemplates, 
  getDemoUrl 
} from '@/lib/templatesData';

export default function TemplatesSection({ globalConfig = {} }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const templates = getMergedTemplates(globalConfig?.websiteTemplates, globalConfig?.deletedTemplateIds);

  const filteredTemplates = templates.filter(tpl => {
    const matchCategory = activeCategory === 'all' || tpl.category === activeCategory;
    return matchCategory && tpl.isActive !== false;
  }).slice(0, 6);

  return (
    <section id="templates" className="relative z-20 py-8 sm:py-12 scroll-mt-20 overflow-hidden bg-gradient-to-b from-purple-50/60 via-white to-indigo-50/40 border-y border-purple-100/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div className="text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 text-purple-700 dark:text-purple-400 font-black text-[11px] uppercase tracking-wider">
              <Sparkles size={13} /> READYMADE STORE DESIGNS
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              রেডিমেড ওয়েবসাইট <span className="text-purple-600">ডিজাইন ও লাইভ ডেমো</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
              আপনার ব্যবসার ক্যাটাগরি অনুযায়ী পছন্দসই ওয়েবসাইট নির্বাচন করুন। সরাসরি *.bdretailers.com এ ডেমো চালান এবং ১ ক্লিকেই চালু করুন নিজস্ব ইকমার্স শপ।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer active:scale-95"
            >
              <span>সব ১৫+ ডিজাইন দেখুন</span>
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/25 scale-102'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50/50 hover:border-purple-300'
                }`}
              >
                <span>{cat.label}</span>
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
                className="group relative bg-white dark:bg-[#111625] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden hover:border-purple-500/50 hover:shadow-xl dark:hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between shadow-sm"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/11] overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img 
                      src={tpl.thumbnail} 
                      alt={tpl.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge */}
                    {tpl.badge && (
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-white shadow-md bg-black/70 backdrop-blur-md border border-white/20">
                        {tpl.badge}
                      </div>
                    )}

                    {/* Subdomain Pill */}
                    <div className="hidden sm:flex absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-300 bg-white/95 dark:bg-black/80 backdrop-blur-md border border-emerald-500/30 items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{tpl.demoSubdomain}.bdretailers.com</span>
                    </div>

                    {/* Quick Action Overlay (Desktop) */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center gap-2 p-3">
                      <Link
                        href={`/templates/preview/${tpl.id}`}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg transition-all flex items-center gap-1.5"
                      >
                        <Eye size={13} />
                        <span>লাইভ ডেমো</span>
                      </Link>
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all flex items-center justify-center"
                        title="নতুন ট্যাবে সাইট দেখুন"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-3 sm:p-5 space-y-1.5 sm:space-y-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 truncate">
                        {tpl.categoryBn}
                      </span>
                      <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-amber-500 font-bold shrink-0">
                        <Star size={11} className="fill-amber-500" />
                        <span>{tpl.rating || '4.9'}</span>
                      </div>
                    </div>

                    <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-1">
                      {tpl.titleBn}
                    </h3>

                    <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-1 sm:line-clamp-2">
                      {tpl.description}
                    </p>

                    {/* Color dots */}
                    <div className="hidden sm:flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold">রং:</span>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-white/20 shadow-xs" style={{ backgroundColor: tpl.primaryColor }} />
                        <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-white/20 shadow-xs" style={{ backgroundColor: tpl.secondaryColor }} />
                        <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-white/20 shadow-xs" style={{ backgroundColor: tpl.accentColor }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="p-2.5 sm:p-5 pt-0 grid grid-cols-2 gap-1.5 sm:gap-2">
                  <Link
                    href={`/templates/preview/${tpl.id}`}
                    className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-[10px] sm:text-xs border border-slate-200 dark:border-white/10 transition-all flex items-center justify-center gap-1"
                  >
                    <Eye size={12} />
                    <span>ডেমো</span>
                  </Link>
                  <Link
                    href={`/become-retailer?selectedTheme=${tpl.id}`}
                    className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[10px] sm:text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 text-center"
                  >
                    <Sparkles size={12} />
                    <span>সিলেক্ট</span>
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-purple-200 hover:border-purple-500 text-slate-900 hover:text-purple-600 font-black text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <span>সকল রেডিমেড ওয়েবসাইট ও ডিজাইন ব্রাউজ করুন</span>
            <ArrowRight size={14} className="text-purple-600" />
          </Link>
        </div>

      </div>
    </section>
  );
}
