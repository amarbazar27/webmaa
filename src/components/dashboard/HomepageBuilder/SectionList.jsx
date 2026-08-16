'use client';
import { useState } from 'react';
import {
  GripVertical, Eye, EyeOff, ChevronDown, ChevronUp,
  Image as ImageIcon, Layers, Zap, Grid, Video,
  LayoutGrid, Sparkles, Star, Package, Camera, Tag, Share2
} from 'lucide-react';
import SectionEditor from './SectionEditor';

const SECTION_META = {
  hero_carousel:    { label: 'Hero Banner Carousel', icon: ImageIcon, color: '#6D28D9', desc: 'Full-width sliding banners' },
  category_scroller:{ label: 'Category Scroller', icon: Layers, color: '#0284C7', desc: 'Circular category icons' },
  banner_row:       { label: 'Promo Banner Row', icon: LayoutGrid, color: '#059669', desc: '2-3 column banner cards' },
  flash_sale:       { label: 'Flash Sale', icon: Zap, color: '#EF4444', desc: 'Countdown timer + hot deals' },
  product_grid:     { label: 'Product Grid', icon: Grid, color: '#7C3AED', desc: 'Tabbed product showcase' },
  concern_grid:     { label: 'Concern / Theme Grid', icon: Sparkles, color: '#DB2777', desc: 'Shop by concern/category' },
  video_reels:      { label: 'Video Reels', icon: Video, color: '#DC2626', desc: '9:16 swipeable video cards' },
  brand_marquee:    { label: 'Brand Marquee', icon: Star, color: '#D97706', desc: 'Scrolling brand logos' },
  bundle_section:   { label: 'Bundle Deals', icon: Package, color: '#059669', desc: 'Combo pack offers' },
  photo_reviews:    { label: 'Photo Reviews', icon: Camera, color: '#7C3AED', desc: 'Customer photo testimonials' },
  price_tier_store: { label: 'Price Tier Store', icon: Tag, color: '#0891B2', desc: 'Under ৳299 / ৳599 / ৳999' },
  instagram_feed:   { label: 'Instagram Feed', icon: Share2, color: '#E1306C', desc: 'Embedded social feed' },
};

export default function SectionList({ sections, onChange, theme }) {
  const [expandedId, setExpandedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  const toggleEnabled = (id) => {
    onChange(sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const moveSection = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    onChange(reordered.map((s, i) => ({ ...s, order: i })));
  };

  const updateSectionData = (id, newData) => {
    onChange(sections.map(s => s.id === id ? { ...s, data: { ...s.data, ...newData } } : s));
  };

  // Drag handlers
  const onDragStart = (e, idx) => { setDragging(idx); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e, idx) => { e.preventDefault(); setDragOver(idx); };
  const onDrop = (e, idx) => { e.preventDefault(); if (dragging !== null) moveSection(dragging, idx); setDragging(null); setDragOver(null); };
  const onDragEnd = () => { setDragging(null); setDragOver(null); };

  return (
    <div className="divide-y divide-slate-50">
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Sections</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Drag করে সাজান • Toggle করে দেখান/লুকান</p>
      </div>
      {sorted.map((section, idx) => {
        const meta = SECTION_META[section.type] || { label: section.type, icon: Grid, color: '#6D28D9', desc: '' };
        const Icon = meta.icon;
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
              isOver ? 'border-t-2 border-purple-400' : ''
            }`}
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                !section.enabled ? 'opacity-50' : ''
              }`}
              onClick={() => setExpandedId(isExpanded ? null : section.id)}
            >
              {/* Drag Handle */}
              <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <GripVertical size={16} />
              </div>

              {/* Icon */}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.color + '15' }}>
                <Icon size={14} style={{ color: meta.color }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 leading-none">{meta.label}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{meta.desc}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); toggleEnabled(section.id); }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    section.enabled ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {section.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <div className={`p-1.5 rounded-lg text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown size={13} />
                </div>
              </div>
            </div>

            {/* Expanded Editor */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/50">
                <SectionEditor
                  section={section}
                  onChange={(newData) => updateSectionData(section.id, newData)}
                  theme={theme}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
