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
    <section id="templates" className="relative z-20 py-20 scroll-mt-20 overflow-hidden bg-slate-900/40 dark:bg-black/40 border-y border-slate-200/50 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neo-extruded-sm bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-widest">
              <Sparkles size={14} /> READYMADE STORE DESIGNS
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              রেডিমেড ওয়েবসাইট <span className="text-[#6C63FF]">ডিজাইন ও লাইভ ডেমো</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
              আপনার ব্যবসার ধরণ অনুযায়ী আকর্ষণীয় ওয়েবসাইট বেছে নিন। সরাসরি *.bdretailers.com এ ডেমো চালান এবং ১ ক্লিকেই চালু করুন আপনার ব্র্যান্ড।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
            >
              <span>সব ১৫+ ডিজাইন দেখুন</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-6">
          {TEMPLATE_CATEGORIES.slice(0, 7).map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30 scale-105'
                    : 'bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Templates Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((tpl) => {
            const liveUrl = getDemoUrl(tpl);

            return (
              <div
                key={tpl.id}
                className="group relative bg-white dark:bg-[#111625] rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img 
                      src={tpl.thumbnail} 
                      alt={tpl.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge */}
                    {tpl.badge && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-lg bg-black/60 backdrop-blur-md border border-white/20">
                        {tpl.badge}
                      </div>
                    )}

                    {/* Subdomain Pill */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-300 bg-white/90 dark:bg-black/70 backdrop-blur-md border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{tpl.demoSubdomain}.bdretailers.com</span>
                    </div>

                    {/* Quick Action Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 p-4">
                      <Link
                        href={`/templates/preview/${tpl.id}`}
                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg transition-all flex items-center gap-1.5"
                      >
                        <Eye size={14} />
                        <span>লাইভ ডেমো টেস্ট</span>
                      </Link>
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 transition-all flex items-center gap-1"
                        title="নতুন ট্যাবে সরাসরি সাইট দেখুন"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        {tpl.categoryBn}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                        <Star size={13} className="fill-amber-500" />
                        <span>{tpl.rating || '4.9'}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                      {tpl.titleBn}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-2 min-h-[32px]">
                      {tpl.description}
                    </p>

                    {/* Color dots */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold">রং প্যালেট:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20 shadow-sm" style={{ backgroundColor: tpl.primaryColor }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20 shadow-sm" style={{ backgroundColor: tpl.secondaryColor }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20 shadow-sm" style={{ backgroundColor: tpl.accentColor }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="p-6 pt-0 grid grid-cols-2 gap-2">
                  <Link
                    href={`/templates/preview/${tpl.id}`}
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-white/10 transition-all flex items-center justify-center gap-1"
                  >
                    <Eye size={13} />
                    <span>লাইভ ডেমো</span>
                  </Link>
                  <Link
                    href={`/become-retailer?selectedTheme=${tpl.id}`}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1 text-center"
                  >
                    <Sparkles size={13} />
                    <span>সিলেক্ট করুন</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Callout */}
        <div className="mt-12 text-center">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-purple-500 text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all"
          >
            <span>সকল রেডিমেড ওয়েবসাইট ও ডিজাইন ব্রাউজ করুন</span>
            <ArrowRight size={14} className="text-purple-500" />
          </Link>
        </div>

      </div>
    </section>
  );
}
