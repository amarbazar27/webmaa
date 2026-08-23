'use client';
import { useState } from 'react';
import {
  GripVertical, Eye, EyeOff, ChevronDown, ChevronUp, Plus, Trash2,
  Sparkles, Layers, Zap, Grid, Video, LayoutGrid, Star,
  Package, Camera, Tag, Share2, Megaphone, LayoutTemplate,
  Columns, Image as ImageIcon, Flame, ShoppingBag, Pin, Lock, Unlock
} from 'lucide-react';
import SectionEditor from './SectionEditor';

export const SECTION_METADATA = {
  // Pinned Core Layout
  basic_storefront:  { label: 'Basic Storefront (মূল লেআউট)', icon: ShoppingBag, color: '#059669', category: 'core', desc: 'ডেসক্রিপশন বক্স, সার্চবার ও প্রোডাক্ট গ্রিড', thumbnail: '🏪 Basic', isPinned: true },

  // Core
  hero_carousel:     { label: 'Hero Banner Carousel', icon: ImageIcon, color: '#6D28D9', category: 'core', desc: 'ফুল-উইডথ স্লাইডিং ব্যানার', thumbnail: '🖼️ 100%' },
  category_scroller: { label: 'Category Scroller', icon: Layers, color: '#0284C7', category: 'core', desc: 'গোলাকার ক্যাটাগরি আইকন স্ক্রলার', thumbnail: '🔵 ⚪ 🔵' },
  banner_row:        { label: 'Promo Banner Row', icon: LayoutGrid, color: '#059669', category: 'core', desc: '২ বা ৩ কলাম প্রমোশনাল কার্ড', thumbnail: '🎴 🎴' },
  product_grid:      { label: 'Product Grid', icon: Grid, color: '#7C3AED', category: 'core', desc: 'ট্যাবযুক্ত প্রোডাক্ট গ্রিড শোকেস', thumbnail: '🛍️ 🛍️ 🛍️' },
  popup_banner:      { label: 'Popup Banner', icon: Megaphone, color: '#F97316', category: 'conversion', desc: 'ভিজিটর ঢুকলেই স্পেশাল অফার পপআপ', thumbnail: '📢 Popup' },

  // Editorial & Visual Commerce
  split_showcase:    { label: 'Split Screen Showcase', icon: Columns, color: '#4F46E5', category: 'editorial', desc: 'IKEA-স্টাইল ৫০/৫০ ভিজ্যুয়াল স্টোরিটেলিং', thumbnail: '🖼️ | 📝 ৳' },
  editorial_story:   { label: 'Full-Bleed Editorial Story', icon: LayoutTemplate, color: '#0EA5E9', category: 'editorial', desc: 'সিনেমেটিক ওয়াইড সিজনাল ক্যাম্পেইন', thumbnail: '🌄 Story' },
  shop_the_look:     { label: 'Shop The Look (Hotspots)', icon: Sparkles, color: '#D946EF', category: 'editorial', desc: 'ছবির উপর ক্লিকযোগ্য পিন ও প্রোডাক্ট কার্ড', thumbnail: '🖼️ ⊕ ⊕' },
  bento_mosaic:      { label: 'Bento Product Mosaic', icon: LayoutGrid, color: '#10B981', category: 'editorial', desc: 'মডার্ন আসিমেট্রিক্যাল গ্রিড মোজাইক', thumbnail: '🍱 Bento' },
  product_spotlight: { label: 'Product Spotlight (50/50)', icon: Sparkles, color: '#8B5CF6', category: 'editorial', desc: 'সিঙ্গেল হিরো প্রোডাক্ট স্টোরিটেলিং', thumbnail: '⭐ Spotlight' },
  mood_board:        { label: 'Shop By Mood & Occasion', icon: Sparkles, color: '#F59E0B', category: 'editorial', desc: 'উৎসব ও উদ্দেশ্য অনুযায়ী শপিং বোর্ড', thumbnail: '🌙 💻 💍' },
  lookbook:          { label: 'Visual Lookbook', icon: ImageIcon, color: '#EC4899', category: 'editorial', desc: 'ম্যাগাজিন স্টাইল কিউরেটেড ফ্যাশন লুক', thumbnail: '📖 Look' },
  scroll_story:      { label: 'Story / Step Showcase', icon: Layers, color: '#14B8A6', category: 'editorial', desc: '৩-স্টেপ প্রোডাক্ট তৈরি বা ব্র্যান্ড স্টোরি', thumbnail: '01 02 03' },
  before_after:      { label: 'Before / After Slider', icon: Columns, color: '#6366F1', category: 'editorial', desc: 'ড্র্যাগেবল ফলাফল কম্প্যারিজম স্লাইডার', thumbnail: '◀ ▍ ▶' },

  // Conversions & Deals
  flash_sale:        { label: 'Flash Sale (কাউন্টডাউন)', icon: Zap, color: '#EF4444', category: 'conversion', desc: 'লাইভ টাইমার ও মেগা ডিসকাউন্ট ডিল', thumbnail: '⚡ 00:14:22' },
  deal_of_the_day:   { label: 'Deal of the Day', icon: Flame, color: '#DC2626', category: 'conversion', desc: 'স্টক বার ও জরুরি কাউন্টডাউন হিরো ডিল', thumbnail: '🔥 Deal' },
  bundle_section:    { label: 'Bundle Deals (কম্বো)', icon: Package, color: '#059669', category: 'conversion', desc: 'কম্বো প্যাক অফার ও ইনস্ট্যান্ট সেভিংস', thumbnail: '🎁 Bundle' },
  price_ladder:      { label: 'Bulk Savings (Price Ladder)', icon: Tag, color: '#0891B2', category: 'conversion', desc: 'বেশি কিনলে স্বয়ংক্রিয় ডিসকাউন্ট টিয়ার', thumbnail: '🪜 1-3-5' },
  price_tier_store:  { label: 'Price Tier Store', icon: Tag, color: '#0284C7', category: 'conversion', desc: '৳২৯৯ / ৳৫৯৯ / ৳৯৯৯ বাজেট কর্নার', thumbnail: '🏷️ ৳299' },
  tabbed_collection: { label: 'Tabbed Collection', icon: Grid, color: '#7C3AED', category: 'conversion', desc: 'ইনস্ট্যান্ট ট্যাব সুইচিং কালেকশন', thumbnail: '📑 Tabs' },

  // Social & Trust
  video_reels:       { label: 'Video Reels & Shorts', icon: Video, color: '#E11D48', category: 'social', desc: '৯:১৬ শর্ট ভিডিও প্লেয়ার কার্ডস', thumbnail: '🎬 Reels' },
  shoppable_video:   { label: 'Shoppable Video', icon: Video, color: '#F43F5E', category: 'social', desc: 'ভিডিওর উপর ভাসমান প্রোডাক্ট ট্যাগ', thumbnail: '🎥 Buy' },
  photo_reviews:     { label: 'Photo Reviews', icon: Camera, color: '#7C3AED', category: 'social', desc: 'গ্রাহকদের ছবি ও রেটিং রিভিউ', thumbnail: '💬 Reviews' },
  customer_ugc:      { label: 'Customer Stories (UGC)', icon: Star, color: '#D97706', category: 'social', desc: 'ভেরিফায়েড বায়ার স্টোরিজ ও ফিড', thumbnail: '📸 UGC' },
  trust_strip:       { label: 'Trust & Guarantee Strip', icon: Star, color: '#059669', category: 'social', desc: 'ডেলিভারি ও কোয়ালিটি গ্যারান্টি বার', thumbnail: '🚚 🔒 ↩️' },
  brand_marquee:     { label: 'Brand Marquee', icon: Star, color: '#D97706', category: 'social', desc: 'ব্র্যান্ড লোগোর ইনফিনিট স্ক্রলিং বার', thumbnail: '⭐ Brands' },
  instagram_feed:    { label: 'Instagram Feed', icon: Share2, color: '#E1306C', category: 'social', desc: 'সোশ্যাল মিডিয়া ফটো ফিড উইজেট', thumbnail: '📸 Insta' },
  concern_grid:      { label: 'Concern / Theme Grid', icon: Sparkles, color: '#DB2777', category: 'core', desc: 'প্রয়োজন ভিত্তিক শপিং কার্ড', thumbnail: '✨ Theme' },
};

export default function SectionList({ 
  sections = [], 
  onChange, 
  theme, 
  shopId, 
  onFocusSection 
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [freezeDuplicates, setFreezeDuplicates] = useState(true);

  // Extract pinned basic section
  const pinnedSection = sections.find(s => s.type === 'basic_storefront' || s.isPinned) || {
    id: 'basic_storefront',
    type: 'basic_storefront',
    enabled: true,
    order: -1,
    isPinned: true,
    data: { showDesc: true, showSearch: true, showCategories: true, showProducts: true },
  };

  // Sort dynamic sections
  const sorted = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const dynamicSections = sorted.filter(s => s.type !== 'basic_storefront' && !s.isPinned);

  const toggleEnabled = (id) => {
    if (id === pinnedSection.id || id === 'basic_storefront') {
      const hasPinned = sections.some(s => s.id === id || s.type === 'basic_storefront');
      if (hasPinned) {
        onChange(sections.map(s => (s.id === id || s.type === 'basic_storefront') ? { ...s, enabled: !s.enabled } : s));
      } else {
        onChange([{ ...pinnedSection, enabled: !pinnedSection.enabled }, ...sections]);
      }
    } else {
      onChange(sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    }
  };

  const moveDynamicSection = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const reordered = [...dynamicSections];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    
    // Ensure pinned section remains at start, then dynamic sections renumbered
    const hasPinned = sections.some(s => s.type === 'basic_storefront' || s.isPinned);
    const fullList = [
      hasPinned ? pinnedSection : { ...pinnedSection, order: 0 },
      ...reordered.map((s, i) => ({ ...s, order: i + 1 }))
    ];
    onChange(fullList);
  };

  const updateSectionData = (id, newData) => {
    const exists = sections.some(s => s.id === id || (id === 'basic_storefront' && s.type === 'basic_storefront'));
    if (exists) {
      onChange(sections.map(s => (s.id === id || (id === 'basic_storefront' && s.type === 'basic_storefront')) ? { ...s, data: { ...s.data, ...newData } } : s));
    } else {
      onChange([{ ...pinnedSection, data: { ...pinnedSection.data, ...newData } }, ...sections]);
    }
  };

  const addSection = (type) => {
    const newId = `${type}_${Date.now()}`;
    const newSection = {
      id: newId,
      type,
      enabled: true,
      order: sections.length + 1,
      data: {},
    };
    onChange([...sections, newSection]);
    setShowAddModal(false);
    setExpandedId(newId);
    onFocusSection?.(newId);
  };

  const removeSection = (id, e) => {
    e?.stopPropagation();
    onChange(sections.filter(s => s.id !== id));
  };

  // Drag handlers for dynamic sections
  const onDragStart = (e, idx) => { setDragging(idx); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e, idx) => { e.preventDefault(); setDragOver(idx); };
  const onDrop = (e, idx) => { e.preventDefault(); if (dragging !== null) moveDynamicSection(dragging, idx); setDragging(null); setDragOver(null); };
  const onDragEnd = () => { setDragging(null); setDragOver(null); };

  const CATEGORY_TABS = [
    { id: 'all', label: 'সব সেকশন' },
    { id: 'core', label: 'Core' },
    { id: 'editorial', label: 'Visual & Editorial' },
    { id: 'conversion', label: 'Conversions' },
    { id: 'social', label: 'Social & Trust' },
  ];

  const filteredDynamicSections = filterCategory === 'all' 
    ? dynamicSections 
    : dynamicSections.filter(s => SECTION_METADATA[s.type]?.category === filterCategory);

  // Set of section types already added in builder
  const existingTypes = new Set(sections.map(s => s.type));

  const isPinnedExpanded = expandedId === pinnedSection.id || expandedId === 'basic_storefront';

  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {/* Header & Add Button */}
      <div className="p-4 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Homepage Layout</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              ড্র্যাগ করে সাজান • ক্লিক করে প্রিভিউ দেখুন
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={13} strokeWidth={3} />
            <span>Add Section</span>
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                filterCategory === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 📌 PINNED SECTION: Basic Storefront (Fixed at top, non-draggable) ── */}
      <div className="p-2.5 bg-slate-100/50">
        <div className="flex items-center justify-between px-2 pb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
            <Pin size={11} className="text-emerald-600 rotate-45" /> পিন করা মূল লেআউট (Pinned Core)
          </span>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
            pinnedSection.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
          }`}>
            {pinnedSection.enabled ? '🟢 স্টোরে চালু' : '🔴 বন্ধ (Hidden)'}
          </span>
        </div>

        <div className={`rounded-2xl border transition-all ${
          pinnedSection.enabled ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-50/80 border-slate-200 opacity-60'
        }`}>
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50/80 cursor-pointer transition-colors rounded-2xl"
            onClick={() => {
              setExpandedId(isPinnedExpanded ? null : (pinnedSection.id || 'basic_storefront'));
              onFocusSection?.(pinnedSection.id || 'basic_storefront');
            }}
          >
            {/* Pinned Icon (Non-draggable) */}
            <div 
              className="text-emerald-600 flex-shrink-0 p-1 bg-emerald-50 rounded-lg"
              title="এই সেকশনটি সবার উপরে স্থায়ীভাবে পিন করা"
            >
              <Pin size={14} className="rotate-45" />
            </div>

            {/* Thumbnail */}
            <div 
              className="w-10 h-8 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0 border shadow-2xs text-center px-0.5 select-none"
              style={{ background: '#05966915', borderColor: '#05966930', color: '#059669' }}
            >
              🏪 Basic
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-black text-slate-900 leading-tight truncate">
                  Basic Storefront (মূল লেআউট)
                </p>
              </div>
              <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                ডেসক্রিপশন বক্স, সার্চবার ও প্রোডাক্ট গ্রিড
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Preview Eye */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFocusSection?.(pinnedSection.id || 'basic_storefront');
                }}
                title="প্রিভিউতে দেখুন"
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <Eye size={13} />
              </button>

              {/* Toggle Enable */}
              <button
                onClick={e => { e.stopPropagation(); toggleEnabled(pinnedSection.id || 'basic_storefront'); }}
                title={pinnedSection.enabled ? 'স্টোর থেকে হাইড করতে ক্লিক করুন' : 'স্টোরে চালু করতে ক্লিক করুন'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  pinnedSection.enabled 
                    ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                    : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {pinnedSection.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>

              {/* Expand Chevron */}
              <div className={`p-1 rounded-lg text-slate-400 transition-transform ${isPinnedExpanded ? 'rotate-180 text-emerald-600' : ''}`}>
                <ChevronDown size={13} />
              </div>
            </div>
          </div>

          {/* Expanded Basic Editor */}
          {isPinnedExpanded && (
            <div className="border-t border-slate-100 bg-slate-50/70 animate-in fade-in duration-200 rounded-b-2xl">
              <SectionEditor
                section={pinnedSection}
                onChange={(newData) => updateSectionData(pinnedSection.id || 'basic_storefront', newData)}
                theme={theme}
                shopId={shopId}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Dynamic Reorderable Sections List ── */}
      <div className="divide-y divide-slate-50 max-h-[calc(100vh-340px)] overflow-y-auto">
        <div className="px-4 py-2 bg-slate-50/40">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            ডাইনামিক সেকশনসমূহ (Dynamic Drag & Drop)
          </p>
        </div>

        {filteredDynamicSections.map((section, idx) => {
          const meta = SECTION_METADATA[section.type] || { 
            label: section.type, 
            icon: Grid, 
            color: '#6D28D9', 
            desc: '', 
            thumbnail: '📦' 
          };
          const isExpanded = expandedId === section.id;
          const isDragging = dragging === idx;
          const isOver = dragOver === idx;

          return (
            <div
              key={section.id}
              draggable
              onDragStart={e => onDragStart(e, idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={e => onDrop(e, idx)}
              onDragEnd={onDragEnd}
              className={`transition-all ${
                isDragging ? 'opacity-50 scale-[0.98]' : ''
              } ${
                isOver ? 'border-t-2 border-purple-500' : ''
              }`}
            >
              <div
                className={`flex items-center gap-2.5 px-3.5 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                  !section.enabled ? 'opacity-45 bg-slate-50/40' : ''
                }`}
                onClick={() => {
                  setExpandedId(isExpanded ? null : section.id);
                  onFocusSection?.(section.id);
                }}
              >
                {/* Drag & Up/Down Sort Controls */}
                <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {/* Up/Down Quick Move Buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveDynamicSection(idx, idx - 1)}
                      title="উপরে তুলুন (Move Up)"
                      className="w-4 h-3.5 flex items-center justify-center rounded bg-slate-100 hover:bg-purple-100 text-slate-500 hover:text-purple-700 disabled:opacity-25 disabled:hover:bg-slate-100 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronUp size={11} strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredDynamicSections.length - 1}
                      onClick={() => moveDynamicSection(idx, idx + 1)}
                      title="নিচে নামান (Move Down)"
                      className="w-4 h-3.5 flex items-center justify-center rounded bg-slate-100 hover:bg-purple-100 text-slate-500 hover:text-purple-700 disabled:opacity-25 disabled:hover:bg-slate-100 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronDown size={11} strokeWidth={3} />
                    </button>
                  </div>

                  {/* Drag Handle */}
                  <div 
                    className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-0.5" 
                    title="ড্র্যাগ করে স্থান পরিবর্তন করুন"
                  >
                    <GripVertical size={15} />
                  </div>
                </div>

                {/* Mini Layout Thumbnail with Serial Badge */}
                <div className="relative flex-shrink-0">
                  <div 
                    className="w-10 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border shadow-xs text-center px-0.5 select-none"
                    style={{ 
                      background: `${meta.color}10`, 
                      borderColor: `${meta.color}25`, 
                      color: meta.color 
                    }}
                    title={meta.label}
                  >
                    {meta.thumbnail}
                  </div>
                  {/* Serial Number Badge */}
                  <span className="absolute -top-1.5 -left-1.5 px-1 py-0.2 bg-slate-900 text-white text-[8px] font-black rounded-md shadow-xs border border-white">
                    #{idx + 1}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-slate-900 leading-tight truncate">
                      {meta.label}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                    {meta.desc}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Preview / Focus in phone button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFocusSection?.(section.id);
                    }}
                    title="প্রিভিউতে দেখুন"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                  >
                    <Eye size={13} />
                  </button>

                  {/* Toggle Enable */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleEnabled(section.id); }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      section.enabled 
                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                        : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {section.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>

                  {/* Expand Chevron */}
                  <div className={`p-1 rounded-lg text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-purple-600' : ''}`}>
                    <ChevronDown size={13} />
                  </div>
                </div>
              </div>

              {/* Expanded Section Editor */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/70 animate-in fade-in duration-200">
                  <SectionEditor
                    section={section}
                    onChange={(newData) => updateSectionData(section.id, newData)}
                    theme={theme}
                    shopId={shopId}
                    onRemove={(e) => removeSection(section.id, e)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Add Section Modal with Duplicate Freeze Controller ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 bg-slate-50/70">
              <div>
                <h3 className="text-base font-black text-slate-900">হোমপেজে নতুন সেকশন যোগ করুন</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">যেকোনো সেকশনে ক্লিক করে তাৎক্ষণিক যোগ করুন</p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5">
                {/* Freeze Duplicates Controller */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-black text-slate-700 select-none">
                    {freezeDuplicates ? '🔒 ডুপ্লিকেট লক (Freeze)' : '🔓 ডুপ্লিকেট অনুমতি (Allow)'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={freezeDuplicates}
                    onClick={() => setFreezeDuplicates(!freezeDuplicates)}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                      freezeDuplicates ? 'bg-purple-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                        freezeDuplicates ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal List */}
            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(SECTION_METADATA)
                .filter(([type]) => type !== 'basic_storefront') // basic_storefront is permanently pinned
                .map(([type, meta]) => {
                  const isAlreadyAdded = existingTypes.has(type);
                  const isFrozen = freezeDuplicates && isAlreadyAdded;

                  return (
                    <button
                      key={type}
                      disabled={isFrozen}
                      onClick={() => {
                        if (isFrozen) return;
                        addSection(type);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all group flex items-start gap-3.5 shadow-2xs ${
                        isFrozen
                          ? 'opacity-40 bg-slate-100/80 border-slate-200 cursor-not-allowed select-none'
                          : 'border-slate-200/80 hover:border-purple-400 hover:bg-purple-50/40 hover:shadow-md cursor-pointer'
                      }`}
                    >
                      <div 
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs text-sm font-black transition-transform ${
                          isFrozen ? 'opacity-50' : 'group-hover:scale-105'
                        }`}
                        style={{ background: `${meta.color}15`, color: meta.color }}
                      >
                        {meta.thumbnail}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <p className={`text-xs font-black leading-tight ${isFrozen ? 'text-slate-500' : 'text-slate-900 group-hover:text-purple-700'}`}>
                            {meta.label}
                          </p>
                          {isAlreadyAdded && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              isFrozen 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {isFrozen ? '🔒 যুক্ত আছে' : '+ আরেকটি যোগ করুন'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 leading-snug">
                          {meta.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
