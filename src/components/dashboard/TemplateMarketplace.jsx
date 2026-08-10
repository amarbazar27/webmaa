'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import {
  Palette, Check, Loader2, Eye, Search, Tag, Sparkles,
  Smartphone, Monitor, ChevronRight, Star, Zap, Info
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
          {/* Simulated UI Preview */}
          <div className="w-full h-full p-4 flex flex-col gap-2">
            {/* Header sim */}
            <div
              className="w-full h-8 rounded-lg flex items-center px-3 gap-2"
              style={{ background: template.defaultTheme.headerBg }}
            >
              <div className="w-6 h-3 rounded" style={{ background: template.defaultTheme.headerText + '60' }} />
              <div className="flex-1" />
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-2 rounded" style={{ background: template.defaultTheme.headerText + '40' }} />
              ))}
            </div>
            {/* Product grid sim */}
            <div className="flex-1 grid grid-cols-3 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="rounded-lg p-1.5 flex flex-col gap-1"
                  style={{ background: template.defaultTheme.cardBg, border: `1px solid ${template.defaultTheme.cardBorder}` }}
                >
                  <div className="w-full h-6 rounded" style={{ background: template.defaultTheme.primaryColor + '20' }} />
                  <div className="w-3/4 h-1.5 rounded" style={{ background: template.defaultTheme.textColor + '40' }} />
                  <div className="w-1/2 h-1.5 rounded" style={{ background: template.defaultTheme.primaryColor }} />
                </div>
              ))}
            </div>
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

// ── AI Suggestion Panel ───────────────────────────────────────
function AiSuggestionPanel({ onSuggest }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    if (!input.trim()) return;
    setLoading(true);
    // Simulated AI delay for UX
    await new Promise(r => setTimeout(r, 1200));
    const suggestion = suggestTemplateFromDescription(input);
    setLoading(false);
    onSuggest(suggestion);
    toast.success(`AI সাজেশন: ${suggestion.namebn} টেমপ্লেট! ✨`);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h3 className="font-black text-slate-900 text-sm">AI টেমপ্লেট ডিজাইনার</h3>
          <p className="text-[10px] text-slate-500 font-bold">আপনার স্টোর বর্ণনা করুন, AI টেমপ্লেট সাজেস্ট করবে</p>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="উদাহরণ: লাক্সারি ফ্যাশন স্টোর, প্রিমিয়াম পোশাক বিক্রয়..."
          className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-purple-500 resize-none"
          rows={3}
        />
        <button
          onClick={handleSuggest}
          disabled={loading || !input.trim()}
          className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-black hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/20"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> AI বিশ্লেষণ করছে...</>
          ) : (
            <><Sparkles size={14} /> AI সাজেশন নিন</>
          )}
        </button>
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
            <div style={{ background: theme.headerBg, color: theme.headerText }} className="px-5 py-3 flex items-center justify-between border-b border-slate-200">
              <div className="font-black text-base flex items-center gap-2">🛍️ <span>আপনার স্টোর</span></div>
              <div className="flex items-center gap-3 text-xs font-bold opacity-90">
                <span>পণ্য</span><span>অর্ডার</span><span>কার্ট 🛒</span>
              </div>
            </div>

            {/* Dynamic Hero Banner for Category */}
            <div className="p-6 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.bgColor} 0%, ${theme.accentColor}25 100%)` }}>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2" style={{ background: theme.primaryColor + '20', color: theme.primaryColor }}>
                {cat === 'beauty' ? 'Essential Skincare' : cat === 'electronics' ? 'Flagship Devices' : cat === 'luxury' ? 'Signature Collection' : 'Farm Harvest'}
              </span>
              <h1 className="text-xl md:text-3xl font-black mb-2" style={{ color: theme.textColor }}>
                {cat === 'beauty' ? 'Glow from Within' : cat === 'electronics' ? 'Next-Gen Gadgets.' : cat === 'luxury' ? 'The Art of Minimalist Elegance' : 'Fresh produce direct to you'}
              </h1>
              <p className="text-xs font-medium opacity-80 mb-4 max-w-md mx-auto">{template.taglinebn || template.tagline}</p>
              <button style={{ background: theme.primaryColor, color: '#ffffff', borderRadius: theme.buttonRadius }} className="px-6 py-2 text-xs font-black uppercase tracking-wider shadow-md">
                Shop Collection
              </button>
            </div>

            {/* Category Pills Preview */}
            <div className="px-5 py-3 border-y border-slate-200/60 bg-white/50 flex gap-2 overflow-x-auto">
              {(cat === 'beauty' ? ['Skincare', 'Makeup', 'Fragrance', 'Organic'] :
                cat === 'electronics' ? ['Phones', 'Laptops', 'Audio', 'Gaming'] :
                cat === 'luxury' ? ['Couture', 'Jewelry', 'Watches', 'Leather'] :
                ['কাঁচাবাজার', 'ফলমূল', 'শাকসবজি', 'মুদি দোকান']
              ).map((name, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-[11px] font-bold border border-slate-200 bg-white whitespace-nowrap shadow-xs" style={{ color: theme.textColor }}>
                  {name}
                </span>
              ))}
            </div>

            {/* Asymmetric Product Showcase Preview Grid */}
            <div className="p-4 md:p-6 space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: theme.primaryColor }}>
                {cat === 'beauty' ? 'Essential Skincare' : cat === 'electronics' ? 'Flagship Devices' : cat === 'luxury' ? 'Signature Collection' : 'Featured Products'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1st Large Hero Card */}
                <div className="md:col-span-2 rounded-2xl p-4 flex flex-col justify-between min-h-[160px] border shadow-xs" style={{ background: theme.cardBg, borderColor: theme.cardBorder, borderRadius: theme.cardRadius }}>
                  <div className="w-full h-24 rounded-xl mb-3 flex items-center justify-center font-bold text-xs" style={{ background: theme.primaryColor + '15', color: theme.primaryColor }}>
                    🖼️ [Large Hero Product Image]
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded" style={{ background: theme.primaryColor, color: '#fff' }}>Bestseller #1</span>
                    <h3 className="font-black text-sm mt-1">{cat === 'beauty' ? 'Hydrating Serum 50ml' : cat === 'electronics' ? 'Pro Smartphone 256GB' : 'Luxury Chronograph Watch'}</h3>
                    <p className="font-black text-sm mt-1" style={{ color: theme.primaryColor }}>৳১,৯৫০</p>
                  </div>
                </div>

                {/* Stacked Right Side Cards */}
                <div className="space-y-3 flex flex-col justify-between">
                  {[1, 2].map(i => (
                    <div key={i} className="rounded-2xl p-3 flex items-center gap-3 border shadow-xs" style={{ background: theme.cardBg, borderColor: theme.cardBorder, borderRadius: theme.cardRadius }}>
                      <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center font-bold text-[10px]" style={{ background: theme.accentColor + '25', color: theme.primaryColor }}>
                        Product #{i+1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-xs truncate">Highlight Item #{i+1}</h4>
                        <p className="font-bold text-xs" style={{ color: theme.primaryColor }}>৳৭৫০</p>
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
              <p className="text-[10px] font-bold text-emerald-600">১০০% লাইট থিম & হাই কন্ট্রাস্ট</p>
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
      const template = TEMPLATES[templateId];

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
  }, [shopId, applying, onTemplateApplied]);

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

      {/* AI Suggestion */}
      <AiSuggestionPanel onSuggest={handleAiSuggest} />

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
