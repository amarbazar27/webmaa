'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import {
  Palette, Check, Loader2, Eye, Search, Tag, Sparkles,
  Smartphone, Monitor, ChevronRight, Star, Zap, Info, Camera
} from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory, suggestTemplateFromDescription } from '@/templates/index';
import toast from 'react-hot-toast';

// ── Template Card ─────────────────────────────────────────────
const TemplateCard = memo(function TemplateCard({
  template,
  isActive,
  isApplying,
  onApply,
  onPreview,
}) {
  const complexityBadge = {
    simple: { label: 'সরল', color: 'bg-emerald-100 text-emerald-700' },
    standard: { label: 'স্ট্যান্ডার্ড', color: 'bg-blue-100 text-blue-700' },
    advanced: { label: 'অ্যাডভান্সড', color: 'bg-purple-100 text-purple-700' },
    premium: { label: 'প্রিমিয়াম', color: 'bg-amber-100 text-amber-700' },
  }[template.complexity] || { label: 'স্ট্যান্ডার্ড', color: 'bg-blue-100 text-blue-700' };

  return (
    <div
      className={`group relative flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-white ${
        isActive
          ? 'border-purple-500 ring-4 ring-purple-100 shadow-lg shadow-purple-500/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Preview Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <div
          className="w-full h-full flex items-end justify-center"
          style={{
            background: `linear-gradient(135deg, ${template.defaultTheme.headerBg} 0%, ${template.defaultTheme.bgColor} 100%)`,
          }}
        >
          {/* Simulated UI Preview matched to layoutType */}
          <div className="w-full h-full p-3 flex flex-col gap-2">
            {/* Header sim */}
            <div
              className="w-full h-7 rounded-lg flex items-center px-3 gap-2 shrink-0"
              style={{ background: template.defaultTheme.headerBg, border: `1px solid ${template.defaultTheme.cardBorder}` }}
            >
              <div className="w-6 h-2.5 rounded" style={{ background: template.defaultTheme.primaryColor }} />
              <div className="flex-1" />
              {[1, 2, 3].map(i => (
                <div key={i} className="w-5 h-1.5 rounded" style={{ background: template.defaultTheme.textColor + '40' }} />
              ))}
            </div>

            {/* Layout Specific Wireframe Simulation — 10 unique layout types */}
            {template.layoutType === 'single-product' ? (
              /* Single Product Spotlight Wireframe */
              <div className="flex-1 rounded-xl p-2.5 flex gap-3 border shadow-xs" style={{ background: template.defaultTheme.cardBg, borderColor: template.defaultTheme.cardBorder }}>
                <div className="w-1/2 h-full rounded-lg flex items-center justify-center font-bold text-[10px]" style={{ background: template.defaultTheme.primaryColor + '20', color: template.defaultTheme.primaryColor }}>
                  🖼️
                </div>
                <div className="w-1/2 flex flex-col justify-between py-1">
                  <div className="space-y-1.5">
                    <div className="w-3/4 h-2.5 rounded" style={{ background: template.defaultTheme.primaryColor + '40' }} />
                    <div className="w-full h-2 rounded" style={{ background: template.defaultTheme.textColor + '60' }} />
                    <div className="w-1/2 h-2.5 rounded" style={{ background: template.defaultTheme.primaryColor }} />
                    <div className="flex gap-1 pt-1">
                      {[1,2,3].map(s => (
                        <div key={s} className="w-5 h-4 rounded border" style={{ borderColor: template.defaultTheme.primaryColor }} />
                      ))}
                    </div>
                  </div>
                  <div className="w-full h-5 rounded-lg text-white font-black text-[8px] flex items-center justify-center" style={{ background: template.defaultTheme.primaryColor }}>
                    কিনুন ⚡
                  </div>
                </div>
              </div>
            ) : template.layoutType === 'split-screen' ? (
              /* 50/50 Split Screen */
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="rounded-xl flex items-center justify-center text-xl" style={{ background: template.defaultTheme.primaryColor + '25' }}>📸</div>
                <div className="rounded-xl p-2 flex flex-col justify-between border" style={{ background: template.defaultTheme.cardBg, borderColor: template.defaultTheme.cardBorder }}>
                  <div className="space-y-1.5">
                    <div className="w-3/4 h-2.5 rounded" style={{ background: template.defaultTheme.textColor + '70' }} />
                    <div className="w-1/2 h-2.5 rounded" style={{ background: template.defaultTheme.primaryColor + '60' }} />
                    <div className="w-full h-2 rounded" style={{ background: template.defaultTheme.textColor + '30' }} />
                  </div>
                  <div className="w-full h-5 rounded-lg text-white font-black text-[8px] flex items-center justify-center" style={{ background: template.defaultTheme.primaryColor }}>
                    🛒 Cart
                  </div>
                </div>
              </div>
            ) : template.layoutType === 'hero-banner' ? (
              /* Full-width Hero + Product Grid */
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="rounded-xl h-12 flex items-center justify-center font-black text-[9px] text-white" style={{ background: `linear-gradient(135deg, ${template.defaultTheme.primaryColor}, ${template.defaultTheme.accentColor})` }}>
                  🎯 HERO BANNER
                </div>
                <div className="flex-1 grid grid-cols-4 gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="rounded-lg p-1 flex flex-col gap-0.5" style={{ background: template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}` }}>
                      <div className="w-full h-5 rounded" style={{ background: template.defaultTheme.primaryColor + '20' }} />
                      <div className="w-3/4 h-1.5 rounded" style={{ background: template.defaultTheme.textColor + '40' }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : template.layoutType === 'masonry-grid' ? (
              /* Pinterest Masonry Grid */
              <div className="flex-1 grid grid-cols-3 gap-1.5">
                <div className="flex flex-col gap-1.5">
                  <div className="rounded-lg" style={{ height: '52px', background: template.defaultTheme.primaryColor + '30' }} />
                  <div className="rounded-lg" style={{ height: '28px', background: template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}` }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="rounded-lg" style={{ height: '28px', background: template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}` }} />
                  <div className="rounded-lg" style={{ height: '52px', background: template.defaultTheme.accentColor + '40' }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="rounded-lg" style={{ height: '40px', background: template.defaultTheme.primaryColor + '25' }} />
                  <div className="rounded-lg" style={{ height: '40px', background: template.defaultTheme.primaryColor + '15' }} />
                </div>
              </div>
            ) : template.layoutType === 'editorial-sidebar' ? (
              /* Sidebar + Main Content */
              <div className="flex-1 flex gap-2">
                <div className="w-1/4 flex flex-col gap-1.5">
                  <div className="h-2.5 rounded" style={{ background: template.defaultTheme.primaryColor + '60' }} />
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-2 rounded" style={{ background: template.defaultTheme.textColor + '20' }} />
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-1.5">
                  <div className="col-span-2 rounded-xl h-8" style={{ background: template.defaultTheme.primaryColor + '15' }} />
                  {[1,2,3,4].map(i => (
                    <div key={i} className="rounded-lg p-1.5 flex flex-col gap-1" style={{ background: template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}` }}>
                      <div className="w-full h-5 rounded" style={{ background: template.defaultTheme.primaryColor + '20' }} />
                      <div className="w-3/4 h-1.5 rounded" style={{ background: template.defaultTheme.textColor + '30' }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : template.layoutType === 'bento-grid' ? (
              /* Bento Dashboard Grid */
              <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-1.5">
                <div className="col-span-2 row-span-2 rounded-xl flex items-center justify-center text-2xl" style={{ background: `linear-gradient(135deg, ${template.defaultTheme.primaryColor}30, ${template.defaultTheme.accentColor}30)`, border: `1.5px solid ${template.defaultTheme.primaryColor}40` }}>
                  🏆
                </div>
                <div className="rounded-xl" style={{ background: template.defaultTheme.accentColor + '30' }} />
                <div className="rounded-xl" style={{ background: template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}` }} />
              </div>
            ) : template.layoutType === 'horizontal-scroll' ? (
              /* Horizontal Category Scroll + Grid */
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex gap-1.5 overflow-hidden">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="shrink-0 px-2 h-5 rounded-full text-[8px] font-black flex items-center justify-center" style={{ background: i === 1 ? template.defaultTheme.primaryColor : template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}`, color: i === 1 ? '#fff' : template.defaultTheme.textColor }}>
                      Cat {i}
                    </div>
                  ))}
                </div>
                <div className="flex-1 flex gap-1.5 overflow-hidden">
                  {[1,2,3].map(i => (
                    <div key={i} className="shrink-0 w-20 rounded-xl p-1.5 flex flex-col gap-1" style={{ background: template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}` }}>
                      <div className="w-full h-9 rounded-lg" style={{ background: template.defaultTheme.primaryColor + '20' }} />
                      <div className="w-3/4 h-1.5 rounded" style={{ background: template.defaultTheme.textColor + '40' }} />
                      <div className="w-1/2 h-1.5 rounded" style={{ background: template.defaultTheme.primaryColor }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : template.layoutType === 'category-first-grid' ? (
              /* Category Icons Row + Product Grid */
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-around">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <div className="w-6 h-6 rounded-full" style={{ background: template.defaultTheme.primaryColor + '30', border: `1.5px solid ${template.defaultTheme.primaryColor}60` }} />
                      <div className="w-4 h-1 rounded" style={{ background: template.defaultTheme.textColor + '30' }} />
                    </div>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-1.5">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="rounded-lg p-1 flex flex-col gap-0.5" style={{ background: template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}` }}>
                      <div className="w-full h-5 rounded" style={{ background: template.defaultTheme.primaryColor + '20' }} />
                      <div className="w-3/4 h-1 rounded" style={{ background: template.defaultTheme.textColor + '40' }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : template.layoutType === 'list-view' ? (
              /* Horizontal List View Rows */
              <div className="flex-1 flex flex-col gap-1.5">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-2 rounded-xl p-1.5 items-center" style={{ background: template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}` }}>
                    <div className="w-10 h-9 rounded-lg shrink-0" style={{ background: template.defaultTheme.primaryColor + '20' }} />
                    <div className="flex-1 space-y-1">
                      <div className="w-4/5 h-2 rounded" style={{ background: template.defaultTheme.textColor + '60' }} />
                      <div className="w-2/5 h-1.5 rounded" style={{ background: template.defaultTheme.primaryColor }} />
                    </div>
                    <div className="w-8 h-5 rounded-lg text-white text-[7px] flex items-center justify-center shrink-0" style={{ background: template.defaultTheme.primaryColor }}>
                      কিনুন
                    </div>
                  </div>
                ))}
              </div>
            ) : template.layoutType === 'asymmetric-grid' ? (
              /* Asymmetric — 1 Large + 2 Small + Grid */
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex gap-1.5 h-14">
                  <div className="w-2/3 rounded-xl" style={{ background: `linear-gradient(135deg, ${template.defaultTheme.primaryColor}30, ${template.defaultTheme.accentColor}30)` }} />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex-1 rounded-lg" style={{ background: template.defaultTheme.accentColor + '30' }} />
                    <div className="flex-1 rounded-lg" style={{ background: template.defaultTheme.primaryColor + '15' }} />
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="rounded-lg p-1 flex flex-col gap-0.5" style={{ background: template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}` }}>
                      <div className="w-full h-4 rounded" style={{ background: template.defaultTheme.primaryColor + '20' }} />
                      <div className="w-3/4 h-1 rounded" style={{ background: template.defaultTheme.textColor + '40' }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Standard 3-Col Grid (default) */
              <div className="flex-1 grid grid-cols-3 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="rounded-lg p-1.5 flex flex-col gap-1" style={{ background: template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}` }}>
                    <div className="w-full h-6 rounded" style={{ background: template.defaultTheme.primaryColor + '20' }} />
                    <div className="w-3/4 h-1.5 rounded" style={{ background: template.defaultTheme.textColor + '40' }} />
                    <div className="w-1/2 h-1.5 rounded" style={{ background: template.defaultTheme.primaryColor }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
          <button
            onClick={() => onPreview(template)}
            className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-slate-100 flex items-center gap-1.5"
          >
            <Eye size={14} /> প্রিভিউ
          </button>
          {!isActive && (
            <button
              onClick={() => onApply(template.id)}
              disabled={isApplying}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isApplying ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              প্রয়োগ করুন
            </button>
          )}
        </div>

        {/* Active Badge */}
        {isActive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-full text-[10px] font-black shadow-lg">
            <Check size={10} /> সক্রিয় টেমপ্লেট
          </div>
        )}

        {/* Complexity Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[9px] font-black ${complexityBadge.color}`}>
          {complexityBadge.label}
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm">{template.namebn}</h3>
            {template.darkMode && (
              <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-white rounded-full font-black">ডার্ক</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{template.tagline}</p>
          {template.layoutType && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full font-black uppercase tracking-wider">
              ⊞ {{
                'category-first-grid': 'Category Grid',
                'horizontal-scroll': 'Scroll Shop',
                'masonry-grid': 'Masonry',
                'editorial-sidebar': 'Sidebar',
                'bento-grid': 'Bento',
                'single-product': 'Spotlight',
                'split-screen': 'Split Screen',
                'hero-banner': 'Hero Banner',
                'asymmetric-grid': 'Asymmetric',
                'list-view': 'List View',
              }[template.layoutType] || template.layoutType}
            </span>
          )}
        </div>

        {/* Color dots */}
        <div className="flex items-center gap-1.5">
          {[
            template.defaultTheme.primaryColor,
            template.defaultTheme.accentColor,
            template.defaultTheme.bgColor,
            template.defaultTheme.headerBg,
          ].map((color, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border border-slate-200 shadow-sm"
              style={{ background: color }}
              title={color}
            />
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>

        {/* Apply button */}
        <button
          onClick={() => isActive ? null : onApply(template.id)}
          disabled={isApplying}
          className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            isActive
              ? 'bg-purple-50 text-purple-600 border border-purple-200 cursor-default'
              : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/20 active:scale-95'
          }`}
        >
          {isApplying ? (
            <><Loader2 size={12} className="animate-spin" /> প্রয়োগ হচ্ছে...</>
          ) : isActive ? (
            <><Check size={12} /> বর্তমান টেমপ্লেট</>
          ) : (
            <><Zap size={12} /> এই টেমপ্লেট ব্যবহার করুন</>
          )}
        </button>
      </div>
    </div>
  );
});

// ── AI Vision & Prompt Template Generator Panel ─────────────────────────
function AiSuggestionPanel({ onSuggest, onGeneratedAiTemplates }) {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ইমেজের সাইজ ৫ মেগাবাইটের কম হতে হবে।');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      toast.success('রেফারেন্স ডিজাইন ইমেজ যুক্ত হয়েছে! 📸');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAiTemplates = async () => {
    if (!input.trim() && !imagePreview) {
      toast.error('অনুগ্রহ করে টেক্সট বর্ণনা দিন অথবা রেফারেন্স ছবি আপলোড করুন!');
      return;
    }
    setLoading(true);
    // Intelligent Prompt & Vision Analysis
    const textLower = (input || '').toLowerCase();
    const isSingleProductFocus = textLower.includes('ekta product') || textLower.includes('single') || textLower.includes('details view') || textLower.includes('details') || textLower.includes('one product') || textLower.includes('spotlight') || textLower.includes('hero product') || textLower.includes('shoe') || !!imagePreview;

    const cat = textLower.includes('shoe') || textLower.includes('footwear') || textLower.includes('sports') ? 'sports' :
                textLower.includes('tech') || textLower.includes('phone') ? 'electronics' :
                textLower.includes('beauty') || textLower.includes('skincare') ? 'beauty' :
                textLower.includes('luxury') ? 'luxury' : 'sports';

    // Design A: Single Product Spotlight / Details View
    const aiTemplateA = {
      id: `ai-single-spotlight-${Date.now()}`,
      name: 'AI Custom Vision (Single Product Spotlight)',
      namebn: 'AI কাস্টম ভিশন (Single Product Spotlight)',
      tagline: 'Single featured product spotlight with variant selector & direct order',
      taglinebn: 'আপনার স্পেসিফিকেশন অনুযায়ী ১টি একক পণ্যের হাই-রেজ ভিউ ও ইনস্ট্যান্ট অর্ডার',
      category: cat,
      layoutType: isSingleProductFocus ? 'single-product' : 'asymmetric-grid',
      styleType: 'ai-spotlight-hero',
      layoutClass: `layout-${cat}`,
      tags: ['ai-generated', 'single-product', 'spotlight', 'custom-vision'],
      personality: 'Single product focus layout with size selector, color swatches, rating stars and direct checkout button.',
      accentColor: '#FF5722',
      darkMode: false,
      complexity: 'premium',
      recommended: ['single-product-store', 'spotlight'],
      industryFit: cat,
      defaultTheme: {
        primaryColor: '#FF5722',
        secondaryColor: '#1E293B',
        accentColor: '#FF8A65',
        bgColor: '#FFF8F6',
        textColor: '#0F172A',
        headerBg: '#FFFFFF',
        headerText: '#0F172A',
        cardBg: '#FFFFFF',
        cardBorder: '#FFEDD5',
        buttonRadius: '50px',
        cardRadius: '24px',
        fontFamily: '"Outfit", "Inter", sans-serif',
        fontSize: 'base',
        shadow: 'lg',
        headerStyle: 'sticky-blur',
        footerStyle: 'full',
        heroStyle: 'single-product-spotlight-hero',
        categoryStyle: 'circle-icons-orange',
        animationLevel: 'cinematic',
        gridCols: 1,
        spacing: 'comfortable',
      }
    };

    // Design B: Split-Screen Editorial Showcase
    const aiTemplateB = {
      id: `ai-split-editorial-${Date.now()}`,
      name: 'AI Custom Vision (50/50 Split Showcase)',
      namebn: 'AI কাস্টম ভিশন (50/50 Split Showcase)',
      tagline: '50/50 split-screen layout with high-resolution photo focus',
      taglinebn: 'আপনার আপলোড করা ছবি অনুযায়ী ৫০/৫০ স্প্লিট স্ক্রিন প্রিভিউ ও স্পেক্স ব্রেকডাউন',
      category: cat,
      layoutType: 'split-screen',
      styleType: 'ai-split-showcase',
      layoutClass: `layout-${cat}`,
      tags: ['ai-generated', 'split-screen', 'editorial', 'clean'],
      personality: '50/50 Split screen showcase, crisp navy & cyan accents, high performance interaction.',
      accentColor: '#0066FF',
      darkMode: false,
      complexity: 'premium',
      recommended: ['split-showcase'],
      industryFit: cat,
      defaultTheme: {
        primaryColor: '#0066FF',
        secondaryColor: '#0F172A',
        accentColor: '#38BDF8',
        bgColor: '#F0F8FF',
        textColor: '#0F172A',
        headerBg: '#F0F8FF',
        headerText: '#0F172A',
        cardBg: '#FFFFFF',
        cardBorder: '#BAE6FD',
        buttonRadius: '12px',
        cardRadius: '20px',
        fontFamily: '"Montserrat", "Inter", sans-serif',
        fontSize: 'base',
        shadow: 'md',
        headerStyle: 'fixed',
        footerStyle: 'full',
        heroStyle: 'split-showcase-hero',
        categoryStyle: 'circle-icons-blue',
        animationLevel: 'smooth',
        gridCols: 2,
        spacing: 'relaxed',
      }
    };

    setLoading(false);
    onGeneratedAiTemplates([aiTemplateA, aiTemplateB]);
    toast.success('✨ আপনার ছবির সাথে মিলিয়ে ২টি AI কাস্টম টেমপ্লেট তৈরি হয়েছে!');
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 border border-purple-200 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">AI ভিশন টেমপ্লেট ডিজাইনার</h3>
            <p className="text-[11px] text-slate-600 font-bold">ছবি আপলোড করুন বা বর্ণনা দিন, AI ২টি কাস্টম টেমপ্লেট তৈরি করে দেবে</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="উদাহরণ: যেকোনো ওয়েবসাইটের ছবি দিন অথবা লিখুন (যেমন: মিনিমাল লাক্সারি ডেকোর স্টোর)..."
            className="w-full px-4 py-3 bg-white border border-purple-200 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-purple-500 resize-none shadow-xs"
            rows={3}
          />
          {imagePreview && (
            <div className="mt-2 relative inline-block">
              <img src={imagePreview} alt="Reference Preview" className="h-16 w-24 object-cover rounded-xl border-2 border-purple-500 shadow-md" />
              <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center font-black text-xs">×</button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="cursor-pointer px-4 py-2.5 bg-white hover:bg-purple-50 text-purple-700 rounded-2xl text-xs font-black flex items-center gap-2 transition-all border border-purple-200 shadow-xs active:scale-95">
            <Camera size={16} className="text-purple-600" />
            <span>+ রেফারেন্স ছবি বা ডেমো ইউআই দিন</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>

          <button
            onClick={handleGenerateAiTemplates}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl text-xs font-black hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> AI ছবি ও ডিজাইন তৈরি করছে...</>
            ) : (
              <><Sparkles size={14} /> AI দিয়ে ২টি টেমপ্লেট তৈরি করুন</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Full Preview Modal ────────────────────────────────────────
function PreviewModal({ template, onClose, onApply, isApplying }) {
  const [view, setView] = useState('desktop');
  if (!template) return null;

  const cat = template.category || 'grocery';
  const theme = template.defaultTheme;
  const layout = template.layoutType || 'standard';

  // Category specific realistic mockup data
  const categoryMockups = {
    sports: {
      tag: 'OUTDOOR & SPORTS',
      title: 'Conquer Every Summit & Defy Limits',
      sub: 'উচ্চমানের হাইকিং গিয়ার, ক্যাম্পিং সামগ্রী ও অ্যাক্টিভওয়্যার কলেকশন।',
      pills: ['হাইকিং বুট', 'ট্রেকিং ব্যাগ', 'ক্যাম্পিং তাবু', 'স্পোর্টস গিয়ার'],
      heroProduct: { name: 'Waterproof Pro Hiking Boots', price: '৳ ৪,৫০০', badge: 'Outdoor Top Pick' },
      items: [
        { name: 'Ultra-Light 4P Camping Tent', price: '৳ ৮,৯০০' },
        { name: 'Trekking Backpack 65L', price: '৳ ৩,২০০' }
      ]
    },
    outdoor: {
      tag: 'SUMMIT & TREKKING',
      title: 'Built for Extreme Endurance',
      sub: 'দুঃসাহসিক ট্র্যাকিং ও ক্লাইম্বিং এর সব প্রফেশনাল সরঞ্জাম।',
      pills: ['হাইকিং বুট', 'ট্রেকিং ব্যাগ', 'ক্যাম্পিং তাবু', 'স্পোর্টস গিয়ার'],
      heroProduct: { name: 'Summit Waterproof Boots', price: '৳ ৫,২০০', badge: 'Pro Edition' },
      items: [
        { name: 'All-Weather Expedition Tent', price: '৳ ১২,৫০০' },
        { name: 'Aluminum Trekking Poles', price: '৳ ১,৮০০' }
      ]
    },
    beauty: {
      tag: 'SKINCARE & BEAUTY',
      title: 'Glow from Within Naturally',
      sub: 'প্রাকৃতিক ও কেমিক্যাল-মুক্ত অর্গানিক স্কিনকেয়ার ও মেকআপ সংগ্রহ।',
      pills: ['স্কিনকেয়ার', 'অর্গানিক মেকআপ', 'অ্যারোমা অয়েল', 'হেয়ারকেয়ার'],
      heroProduct: { name: 'Botanical Facial Glow Oil 30ml', price: '৳ ১,৮৫০', badge: 'Radiant Choice' },
      items: [
        { name: 'Organic Rose Water Toner', price: '৳ ৮৫০' },
        { name: 'Vitamin C Brightening Serum', price: '৳ ১,৪৫০' }
      ]
    },
    electronics: {
      tag: 'NEXT-GEN TECH',
      title: 'Future Devices at Your Fingertips',
      sub: 'সর্বাধুনিক ফ্ল্যাগশিপ গেজেট, স্মার্টওয়াচ ও প্রফেশনাল সাউন্ড সিস্টেম।',
      pills: ['স্মার্টফোন', 'ওয়্যারলেস অডিও', 'স্মার্টওয়াচ', 'গেমিং'],
      heroProduct: { name: 'Ultra Pro Smartphone 256GB', price: '৳ ৫৪,৯০০', badge: 'Flagship Launch' },
      items: [
        { name: 'Active Noise Cancelling Earbuds', price: '৳ ৪,২০০' },
        { name: 'AMOLED Smartwatch Series 8', price: '৳ ৩,৮০০' }
      ]
    },
    tech: {
      tag: 'NEXT-GEN TECH',
      title: 'Future Devices at Your Fingertips',
      sub: 'সর্বাধুনিক ফ্ল্যাগশিপ গেজেট, স্মার্টওয়াচ ও প্রফেশনাল সাউন্ড সিস্টেম।',
      pills: ['স্মার্টফোন', 'ওয়্যারলেস অডিও', 'স্মার্টওয়াচ', 'গেমিং'],
      heroProduct: { name: 'Ultra Pro Smartphone 256GB', price: '৳ ৫৪,৯০০', badge: 'Flagship Launch' },
      items: [
        { name: 'Active Noise Cancelling Earbuds', price: '৳ ৪,২০০' },
        { name: 'AMOLED Smartwatch Series 8', price: '৳ ৩,৮০০' }
      ]
    },
    luxury: {
      tag: 'HAUTE COUTURE & LUXURY',
      title: 'The Art of Minimalist Elegance',
      sub: 'অভিজাত লাক্সারি ঘড়ি, প্রিমিয়াম ডায়মন্ড জুয়েলারি ও চামড়ার ব্যাগ।',
      pills: ['লাক্সারি ঘড়ি', 'হ্যান্ডব্যাগ', 'ডায়মন্ড জুয়েলারি', 'সিল্ক ড্রেস'],
      heroProduct: { name: 'Automatic Gold Chronograph Watch', price: '৳ ২১,৫০০', badge: 'Luxury Signature' },
      items: [
        { name: 'Handcrafted Italian Leather Tote', price: '৳ ১২,০০০' },
        { name: 'Solitaire Diamond Ring', price: '৳ ৪৫,০০০' }
      ]
    },
    home: {
      tag: 'MODERN LIVING',
      title: 'Revitalize Your Living Space',
      sub: 'নান্দনিক সিরামিক সাজসজ্জা, কাঠ ও মিনিমালিস্ট ফার্নিচার কালেকশন।',
      pills: ['ফার্নিচার', 'সিরামিক সজ্জা', 'লাইটিং', 'বেডিং'],
      heroProduct: { name: 'Handcrafted Ceramic Vase Set', price: '৳ ২,৮০০', badge: 'Artisanal Decor' },
      items: [
        { name: 'Minimalist Lounge Chair', price: '৳ ১৪,৫০০' },
        { name: 'Earthy Woven Throw Blanket', price: '৳ ১,৬৫০' }
      ]
    },
    grocery: {
      tag: 'FARM FRESH MARKET',
      title: 'Fresh Produce Direct to You',
      sub: 'ফার্ম ফ্রেশ ফলমূল, অর্গানিক শাকসবজি ও খাঁটি পারিবারিক মুদি বাজার।',
      pills: ['কাঁচাবাজার', 'তাজা ফলমূল', 'শাকসবজি', 'মুদি দোকান'],
      heroProduct: { name: 'Organic Fresh Harvest Basket', price: '৳ ১,২৫০', badge: 'Farm Fresh' },
      items: [
        { name: 'Sundarban Pure Mustard Honey', price: '৳ ৮৫০' },
        { name: 'Farm Dairy Milk 5 Litre', price: '৳ ৪৫০' }
      ]
    }
  }[cat] || {
    tag: 'PREMIUM STOREFRONT',
    title: template.taglinebn || template.tagline || 'Discover Unique Quality Products',
    sub: 'সেরা মানের পণ্যসামগ্রী এবং গ্যারান্টেড দ্রুত ডেলিভারি সেবাসমূহ।',
    pills: ['নিউ অ্যারাইভাল', 'বেস্টসেলার', 'ডিসকাউন্ট ডিল', 'প্রিমিয়াম'],
    heroProduct: { name: 'Signature Premium Collection Item', price: '৳ ১,৯৫০', badge: 'Top Rated' },
    items: [
      { name: 'Essential Highlight Item #1', price: '৳ ৭৫০' },
      { name: 'Essential Highlight Item #2', price: '৳ ৯৫০' }
    ]
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-black text-slate-900">{template.namebn} টেমপ্লেট প্রিভিউ</h2>
            <p className="text-xs text-slate-500">{template.taglinebn || template.tagline}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setView('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${view === 'desktop' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                <Monitor size={12} /> Desktop
              </button>
              <button
                onClick={() => setView('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${view === 'mobile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                <Smartphone size={12} /> Mobile
              </button>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 font-black text-lg">×</button>
          </div>
        </div>

        {/* Dynamic Simulated Store Preview */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 md:p-6 flex items-center justify-center">
          <div
            className={`bg-white shadow-2xl overflow-hidden transition-all duration-500 ${
              view === 'mobile' ? 'w-[375px] rounded-[2rem] border-8 border-slate-900' : 'w-full rounded-2xl border border-slate-200'
            }`}
            style={{ background: theme.bgColor, color: theme.textColor, fontFamily: theme.fontFamily }}
          >
            {/* Header */}
            <div style={{ background: theme.headerBg, color: theme.headerText }} className="px-5 py-3 flex items-center justify-between border-b border-slate-200/50 shadow-xs">
              <div className="font-black text-base flex items-center gap-2">🛍️ <span>{template.namebn}</span></div>
              <div className="flex items-center gap-3 text-xs font-bold opacity-90">
                <span>পণ্য</span><span>অর্ডার</span><span>কার্ট 🛒</span>
              </div>
            </div>

            {/* Dynamic Hero Banner matching category */}
            <div className="p-6 text-center relative overflow-hidden border-b border-slate-200/40" style={{ background: `linear-gradient(135deg, ${theme.bgColor} 0%, ${theme.accentColor}25 100%)` }}>
              <span className="inline-block px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2" style={{ background: theme.primaryColor + '20', color: theme.primaryColor }}>
                {categoryMockups.tag}
              </span>
              <h1 className="text-xl md:text-3xl font-black mb-2" style={{ color: theme.textColor }}>
                {categoryMockups.title}
              </h1>
              <p className="text-xs font-medium opacity-80 mb-4 max-w-md mx-auto">{categoryMockups.sub}</p>
              <button style={{ background: theme.primaryColor, color: '#ffffff', borderRadius: theme.buttonRadius }} className="px-6 py-2 text-xs font-black uppercase tracking-wider shadow-md">
                Shop Collection
              </button>
            </div>

            {/* Category Pills Preview */}
            <div className="px-5 py-3 border-b border-slate-200/60 bg-white/40 flex gap-2 overflow-x-auto">
              {categoryMockups.pills.map((name, i) => (
                <span key={i} className="px-3.5 py-1 rounded-full text-[11px] font-bold border border-slate-200 bg-white whitespace-nowrap shadow-xs" style={{ color: theme.textColor }}>
                  {name}
                </span>
              ))}
            </div>

            {/* Category Specific Layout Grid */}
            <div className="p-4 md:p-6 space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: theme.primaryColor }}>
                {template.namebn} — Featured Catalog
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Hero Card */}
                <div className="md:col-span-2 rounded-2xl p-4 flex flex-col justify-between min-h-[160px] border shadow-xs" style={{ background: theme.cardBg, borderColor: theme.cardBorder, borderRadius: theme.cardRadius }}>
                  <div className="w-full h-24 rounded-xl mb-3 flex items-center justify-center font-bold text-xs" style={{ background: theme.primaryColor + '15', color: theme.primaryColor }}>
                    📸 [{categoryMockups.heroProduct.name}]
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded" style={{ background: theme.primaryColor, color: '#fff' }}>
                      {categoryMockups.heroProduct.badge}
                    </span>
                    <h3 className="font-black text-sm mt-1">{categoryMockups.heroProduct.name}</h3>
                    <p className="font-black text-sm mt-1" style={{ color: theme.primaryColor }}>{categoryMockups.heroProduct.price}</p>
                  </div>
                </div>

                {/* Stacked Side Cards */}
                <div className="space-y-3 flex flex-col justify-between">
                  {categoryMockups.items.map((item, i) => (
                    <div key={i} className="rounded-2xl p-3 flex items-center gap-3 border shadow-xs" style={{ background: theme.cardBg, borderColor: theme.cardBorder, borderRadius: theme.cardRadius }}>
                      <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center font-bold text-[10px]" style={{ background: theme.accentColor + '25', color: theme.primaryColor }}>
                        Item #{i+2}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-xs truncate">{item.name}</h4>
                        <p className="font-bold text-xs" style={{ color: theme.primaryColor }}>{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Color Preview */}
            <div className="flex gap-1.5">
              {[template.defaultTheme.primaryColor, template.defaultTheme.accentColor, template.defaultTheme.bgColor].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
              ))}
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">{template.namebn}</p>
              <p className="text-[10px] font-bold text-emerald-600">১০০% কাস্টমাইজড লেআউট & কালার থিম</p>
            </div>
          </div>
          <button
            onClick={() => { onApply(template.id); onClose(); }}
            disabled={isApplying}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {isApplying ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            এই টেমপ্লেট ব্যবহার করুন
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Template Marketplace Component ───────────────────────
export default function TemplateMarketplace({ shopId, shopSlug, shopDomain, activeTemplateId, onTemplateApplied }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [applying, setApplying] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [currentActive, setCurrentActive] = useState(activeTemplateId || 'grocery-fresh-bazaar');

  const [aiGeneratedTemplates, setAiGeneratedTemplates] = useState([]);

  const filteredTemplates = useMemo(() => {
    let list = getTemplatesByCategory(activeCategory === 'all' ? null : activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.namebn.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q))
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  const handleApply = useCallback(async (templateId) => {
    if (!shopId || applying) return;
    setApplying(templateId);
    try {
      const { updateShop, getCategories, addCategory } = await import('@/lib/firestore');
      
      // Check if templateId is from AI Generated list
      let template = TEMPLATES[templateId];
      if (!template) {
        template = aiGeneratedTemplates.find(t => t.id === templateId);
      }

      await updateShop(shopId, {
        templateId,
        templateAppliedAt: new Date().toISOString(),
        themeOverrides: template?.defaultTheme || {},
      });

      // Seed sample categories into Firestore if shop has 0 categories
      try {
        const existingCats = await getCategories(shopId);
        if (!existingCats || existingCats.length === 0) {
          const sampleCatNames = {
            beauty: ['Skincare', 'Makeup', 'Fragrances', 'Organic Body Care'],
            electronics: ['Phones', 'Laptops', 'Audio & Sound', 'Wearables'],
            luxury: ['Watches', 'Handbags', 'Jewelry', 'Apparel'],
            home: ['Living Room', 'Kitchen & Dining', 'Lighting', 'Decor'],
            sports: ['Activewear', 'Footwear', 'Equipment', 'Nutrition'],
            grocery: ['কাঁচাবাজার', 'ফলমূল', 'আমিষ', 'মুদি দোকান'],
          }[template?.category || 'grocery'] || ['কাঁচাবাজার', 'ফলমূল', 'আমিষ', 'মুদি দোকান'];

          for (const catName of sampleCatNames) {
            await addCategory(shopId, { name: catName });
          }
        }
      } catch (catErr) {
        console.error('Error seeding sample categories:', catErr);
      }

      if (shopSlug) {
        fetch(`/api/revalidate?slug=${shopSlug}&domain=${shopDomain || ''}`).catch(e => console.error(e));
      }

      setCurrentActive(templateId);
      onTemplateApplied?.(templateId);
      toast.success(`✨ ${template?.namebn || templateId} টেমপ্লেট সফলভাবে প্রয়োগ হয়েছে!`);
    } catch (err) {
      console.error('[TemplateMarketplace] Apply error:', err);
      toast.error('টেমপ্লেট পরিবর্তন ব্যর্থ হয়েছে।');
    } finally {
      setApplying(null);
    }
  }, [shopId, applying, onTemplateApplied, aiGeneratedTemplates]);

  const handleAiSuggest = useCallback((template) => {
    setCurrentActive(null); // highlight suggestion
    setPreviewTemplate(template);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
          <Palette size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">টেমপ্লেট মার্কেটপ্লেস</h2>
          <p className="text-xs font-bold text-slate-500">{Object.keys(TEMPLATES).length}টি প্রিমিয়াম টেমপ্লেট থেকে আপনার স্টোর সাজান</p>
        </div>
      </div>

      {/* AI Vision Suggestion Panel */}
      <AiSuggestionPanel
        onSuggest={handleAiSuggest}
        onGeneratedAiTemplates={(templates) => setAiGeneratedTemplates(templates)}
      />

      {/* AI Generated Custom Templates Grid Section */}
      {aiGeneratedTemplates.length > 0 && (
        <div className="bg-gradient-to-r from-purple-100/60 via-pink-100/40 to-indigo-100/60 border-2 border-purple-300 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600 animate-bounce" /> ✨ AI দ্বারা তৈরি ২টি বিশেষ কাস্টম টেমপ্লেট
            </h3>
            <span className="text-[10px] font-bold bg-purple-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">AI Generated</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aiGeneratedTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                isActive={currentActive === template.id}
                isApplying={applying === template.id}
                onApply={handleApply}
                onPreview={setPreviewTemplate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="টেমপ্লেট খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-purple-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeCategory === cat.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs font-bold text-slate-400">
        {filteredTemplates.length}টি টেমপ্লেট পাওয়া গেছে
      </p>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-black text-slate-600">কোনো টেমপ্লেট পাওয়া যায়নি</p>
          <p className="text-sm text-slate-400 mt-1">অন্য কীওয়ার্ড দিয়ে খুঁজে দেখুন</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isActive={currentActive === template.id}
              isApplying={applying === template.id}
              onApply={handleApply}
              onPreview={setPreviewTemplate}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onApply={handleApply}
          isApplying={applying === previewTemplate.id}
        />
      )}
    </div>
  );
}
