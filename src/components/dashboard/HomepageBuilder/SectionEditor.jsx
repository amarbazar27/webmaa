'use client';
import { useState } from 'react';
import { Plus, Trash2, Link, Image as ImageIcon, Type, Clock, Upload, Sparkles, Layers, Columns } from 'lucide-react';

function Field({ label, children, helper }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">{label}</label>
      {children}
      {helper && <p className="text-[9px] text-slate-400 font-medium">{helper}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white placeholder:font-medium placeholder:text-slate-300"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white placeholder:font-medium placeholder:text-slate-300 resize-none"
    />
  );
}

function ImageUploadField({ label, value, onChange, placeholder, shopId }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'homepage-builder');
      const url = shopId ? `/api/upload?shopId=${shopId}` : '/api/upload';
      const res = await fetch(url, { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok && result.url) {
        onChange(result.url);
      } else {
        setError(result.error || 'আপলোড ব্যর্থ হয়েছে।');
      }
    } catch {
      setError('আপলোড ব্যর্থ হয়েছে।');
    }
    setUploading(false);
  };

  return (
    <Field label={label}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || 'https://... অথবা ফাইল আপলোড করুন'}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-400 transition-all"
          />
          <label className={`shrink-0 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 ${
            uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 active:scale-95'
          }`}>
            <Upload size={12} />
            {uploading ? 'হচ্ছে...' : 'আপলোড'}
            <input type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
        {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
        {value && (
          <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
            <img src={value} alt="preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </Field>
  );
}

// ── 1. Hero Carousel Editor ──
function HeroCarouselEditor({ data, onChange, shopId }) {
  const slides = data.slides || [];
  const addSlide = () => onChange({ ...data, slides: [...slides, { url: '', title: '', description: '', linkUrl: '', buttonText: '' }] });
  const removeSlide = (i) => onChange({ ...data, slides: slides.filter((_, idx) => idx !== i) });
  const updateSlide = (i, key, val) => onChange({ ...data, slides: slides.map((s, idx) => idx === i ? { ...s, [key]: val } : s) });

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Slide {i + 1}</span>
            <button onClick={() => removeSlide(i)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"><Trash2 size={13} /></button>
          </div>
          <ImageUploadField label="ব্যানার ইমেজ" value={slide.url} onChange={v => updateSlide(i, 'url', v)} shopId={shopId} />
          <Field label="টাইটেল"><Input value={slide.title} onChange={v => updateSlide(i, 'title', v)} placeholder="ব্যানার টাইটেল" /></Field>
          <Field label="বিবরণ"><Input value={slide.description} onChange={v => updateSlide(i, 'description', v)} placeholder="সংক্ষিপ্ত বিবরণ" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="বাটন টেক্সট"><Input value={slide.buttonText} onChange={v => updateSlide(i, 'buttonText', v)} placeholder="অর্ডার করুন" /></Field>
            <Field label="লিংক"><Input value={slide.linkUrl} onChange={v => updateSlide(i, 'linkUrl', v)} placeholder="https://..." /></Field>
          </div>
        </div>
      ))}
      <button onClick={addSlide} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
        <Plus size={13} /> Slide যোগ করুন
      </button>
    </div>
  );
}

// ── 2. Category Scroller Editor ──
function CategoryScrollerEditor({ data, onChange, shopId }) {
  const items = data.items || [];
  const addItem = () => onChange({ ...data, items: [...items, { label: '', imageUrl: '', emoji: '🛍️' }] });
  const removeItem = (i) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) });
  const updateItem = (i, key, val) => onChange({ ...data, items: items.map((s, idx) => idx === i ? { ...s, [key]: val } : s) });

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400">Category {i + 1}</span>
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ইমোজি"><Input value={item.emoji} onChange={v => updateItem(i, 'emoji', v)} placeholder="🛍️" /></Field>
            <Field label="ক্যাটাগরি নাম"><Input value={item.label} onChange={v => updateItem(i, 'label', v)} placeholder="ফ্যাশন" /></Field>
          </div>
          <ImageUploadField label="আইকন ছবি (ঐচ্ছিক)" value={item.imageUrl} onChange={v => updateItem(i, 'imageUrl', v)} shopId={shopId} />
        </div>
      ))}
      <button onClick={addItem} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
        <Plus size={13} /> Category যোগ করুন
      </button>
    </div>
  );
}

// ── 3. Flash Sale Editor ──
function FlashSaleEditor({ data, onChange }) {
  return (
    <div className="space-y-3">
      <Field label="সেল টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="🔥 Flash Sale" /></Field>
      <Field label="অফার শেষ হওয়ার সময়">
        <input
          type="datetime-local"
          value={data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : ''}
          onChange={e => onChange({ ...data, endTime: new Date(e.target.value).toISOString() })}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
        />
      </Field>
      <Field label="প্রোডাক্ট আইডি (কমা দিয়ে আলাদা করুন, খালি থাকলে জনপ্রিয় পণ্য দেখাবে)">
        <Textarea
          value={(data.productIds || []).join(', ')}
          onChange={e => onChange({ ...data, productIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="product-id-1, product-id-2, ..."
          rows={2}
        />
      </Field>
    </div>
  );
}

// ── 4. Product Grid Editor ──
function ProductGridEditor({ data, onChange }) {
  const TABS = ['trending', 'new', 'bestseller', 'all'];
  const TAB_LABELS = { trending: 'Trending', new: 'New Arrivals', bestseller: 'Best Sellers', all: 'All Products' };
  const currentTabs = data.tabs || ['all', 'trending', 'bestseller'];
  const toggleTab = (tab) => {
    const next = currentTabs.includes(tab) ? currentTabs.filter(t => t !== tab) : [...currentTabs, tab];
    onChange({ ...data, tabs: next.length ? next : [tab] });
  };

  return (
    <div className="space-y-3">
      <Field label="সেকশন টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="আমাদের পণ্যসমূহ" /></Field>
      <Field label="ট্যাবসমূহ">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => toggleTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                currentTabs.includes(tab)
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-purple-300'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="সর্বোচ্চ প্রোডাক্ট সংখ্যা">
        <input
          type="range" min={4} max={24} step={2}
          value={data.maxProducts || 12}
          onChange={e => onChange({ ...data, maxProducts: parseInt(e.target.value) })}
          className="w-full"
        />
        <p className="text-[10px] text-slate-400 font-bold mt-1">{data.maxProducts || 12} products</p>
      </Field>
    </div>
  );
}

// ── 5. Split Showcase Editor (IKEA style) ──
function SplitShowcaseEditor({ data, onChange, shopId }) {
  return (
    <div className="space-y-3">
      <ImageUploadField label="শোকেস ইমেজ" value={data.imageUrl} onChange={v => onChange({ ...data, imageUrl: v })} shopId={shopId} />
      <Field label="আইব্রো ট্যাগ"><Input value={data.eyebrow} onChange={v => onChange({ ...data, eyebrow: v })} placeholder="IKEA Inspired" /></Field>
      <Field label="হেডিং টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="অভিজাত লাইফস্টাইল ডিজাইন" /></Field>
      <Field label="বিবরণ"><Textarea value={data.description} onChange={v => onChange({ ...data, description: v })} placeholder="বিস্তারিত পণ্য বিবরণ..." rows={2} /></Field>
      
      <div className="grid grid-cols-2 gap-2">
        <Field label="অফার মূল্য (৳)"><Input value={data.price} onChange={v => onChange({ ...data, price: v })} placeholder="3490" type="number" /></Field>
        <Field label="মূল মূল্য (৳)"><Input value={data.originalPrice} onChange={v => onChange({ ...data, originalPrice: v })} placeholder="4500" type="number" /></Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="ছবি পজিশন">
          <select
            value={data.imagePosition || 'left'}
            onChange={e => onChange({ ...data, imagePosition: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white"
          >
            <option value="left">Image Left</option>
            <option value="right">Image Right</option>
          </select>
        </Field>
        <Field label="লেআউট রেশিও">
          <select
            value={data.layoutRatio || '50/50'}
            onChange={e => onChange({ ...data, layoutRatio: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white"
          >
            <option value="50/50">50 / 50</option>
            <option value="40/60">40 / 60</option>
            <option value="60/40">60 / 40</option>
          </select>
        </Field>
      </div>

      <Field label="বাটন টেক্সট"><Input value={data.buttonText} onChange={v => onChange({ ...data, buttonText: v })} placeholder="এখনই অর্ডার করুন" /></Field>
    </div>
  );
}

// ── 6. Editorial Story Editor ──
function EditorialStoryEditor({ data, onChange, shopId }) {
  return (
    <div className="space-y-3">
      <ImageUploadField label="ওয়াইড ব্যাকগ্রাউন্ড ইমেজ" value={data.imageUrl} onChange={v => onChange({ ...data, imageUrl: v })} shopId={shopId} />
      <Field label="ক্যাম্পেইন ট্যাগ"><Input value={data.eyebrow} onChange={v => onChange({ ...data, eyebrow: v })} placeholder="Ramadan Edit" /></Field>
      <Field label="হেডিং"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="নতুন ঋতু, নতুন সাজ" /></Field>
      <Field label="বিবরণ"><Textarea value={data.description} onChange={v => onChange({ ...data, description: v })} placeholder="সংক্ষিপ্ত বিবরণ..." rows={2} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="বাটন টেক্সট"><Input value={data.buttonText} onChange={v => onChange({ ...data, buttonText: v })} placeholder="এক্সপ্লোর করুন" /></Field>
        <Field label="থিম মোড">
          <select
            value={data.themeMode || 'dark'}
            onChange={e => onChange({ ...data, themeMode: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white"
          >
            <option value="dark">Dark Overlay</option>
            <option value="light">Light Overlay</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

// ── 7. Shop The Look Editor ──
function ShopTheLookEditor({ data, onChange, shopId }) {
  const hotspots = data.hotspots || [];
  const addHotspot = () => onChange({
    ...data,
    hotspots: [...hotspots, { id: `hs-${Date.now()}`, x: 50, y: 50, title: 'নতুন পণ্য', price: 1200, originalPrice: 1500, imageUrl: '' }]
  });
  const removeHotspot = (i) => onChange({ ...data, hotspots: hotspots.filter((_, idx) => idx !== i) });
  const updateHotspot = (i, key, val) => onChange({
    ...data,
    hotspots: hotspots.map((hs, idx) => idx === i ? { ...hs, [key]: val } : hs)
  });

  return (
    <div className="space-y-4">
      <Field label="সেকশন টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Shop The Look" /></Field>
      <ImageUploadField label="রুম বা আউটফিট লাইফস্টাইল ছবি" value={data.imageUrl} onChange={v => onChange({ ...data, imageUrl: v })} shopId={shopId} />

      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">হটস্পট পিনসমূহ ({hotspots.length})</p>
        {hotspots.map((hs, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-purple-600">Pin {i + 1}</span>
              <button onClick={() => removeHotspot(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
            </div>
            <Field label="পণ্য নাম"><Input value={hs.title} onChange={v => updateHotspot(i, 'title', v)} placeholder="সোফা সেট" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="মূল্য (৳)"><Input value={hs.price} onChange={v => updateHotspot(i, 'price', v)} placeholder="18500" type="number" /></Field>
              <Field label="আগের মূল্য (৳)"><Input value={hs.originalPrice} onChange={v => updateHotspot(i, 'originalPrice', v)} placeholder="22000" type="number" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="X পজিশন (%)"><Input value={hs.x} onChange={v => updateHotspot(i, 'x', Number(v))} type="number" placeholder="50" /></Field>
              <Field label="Y পজিশন (%)"><Input value={hs.y} onChange={v => updateHotspot(i, 'y', Number(v))} type="number" placeholder="50" /></Field>
            </div>
          </div>
        ))}
        <button onClick={addHotspot} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
          <Plus size={13} /> পিন (+) যোগ করুন
        </button>
      </div>
    </div>
  );
}

// ── 8. Bento Mosaic Editor ──
function BentoMosaicEditor({ data, onChange, shopId }) {
  const tiles = data.tiles || [];
  const addTile = () => onChange({ ...data, tiles: [...tiles, { title: '', tag: '', price: '', imageUrl: '', size: 'small', linkUrl: '#' }] });
  const removeTile = (i) => onChange({ ...data, tiles: tiles.filter((_, idx) => idx !== i) });
  const updateTile = (i, key, val) => onChange({ ...data, tiles: tiles.map((t, idx) => idx === i ? { ...t, [key]: val } : t) });

  return (
    <div className="space-y-4">
      <Field label="সেকশন টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="ট্রেন্ডিং মোজাইক" /></Field>
      {tiles.map((tile, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500">Tile {i + 1} ({tile.size === 'large' ? 'Large Card' : 'Standard'})</span>
            <button onClick={() => removeTile(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
          </div>
          <ImageUploadField label="ছবি" value={tile.imageUrl} onChange={v => updateTile(i, 'imageUrl', v)} shopId={shopId} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="টাইটেল"><Input value={tile.title} onChange={v => updateTile(i, 'title', v)} placeholder="ফ্যাশন ডিল" /></Field>
            <Field label="ট্যাগ"><Input value={tile.tag} onChange={v => updateTile(i, 'tag', v)} placeholder="HOT" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="প্রাইস টেক্সট"><Input value={tile.price} onChange={v => updateTile(i, 'price', v)} placeholder="৳১,৯৫০ থেকে" /></Field>
            <Field label="সাইজ">
              <select
                value={tile.size || 'small'}
                onChange={e => updateTile(i, 'size', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white"
              >
                <option value="large">Large (Featured)</option>
                <option value="small">Small</option>
              </select>
            </Field>
          </div>
        </div>
      ))}
      <button onClick={addTile} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
        <Plus size={13} /> Tile যোগ করুন
      </button>
    </div>
  );
}

// ── 9. Product Spotlight Editor ──
function ProductSpotlightEditor({ data, onChange, shopId }) {
  return (
    <div className="space-y-3">
      <ImageUploadField label="প্রোডাক্ট ইমেজ" value={data.imageUrl} onChange={v => onChange({ ...data, imageUrl: v })} shopId={shopId} />
      <Field label="স্পটলাইট ট্যাগ"><Input value={data.eyebrow} onChange={v => onChange({ ...data, eyebrow: v })} placeholder="স্পটলাইট প্রোডাক্ট" /></Field>
      <Field label="পণ্য নাম"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Wireless Pro Headphones" /></Field>
      <Field label="বিবরণ"><Textarea value={data.description} onChange={v => onChange({ ...data, description: v })} placeholder="বিস্তারিত..." rows={2} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="মূল্য (৳)"><Input value={data.price} onChange={v => onChange({ ...data, price: v })} placeholder="1850" type="number" /></Field>
        <Field label="মূল মূল্য (৳)"><Input value={data.originalPrice} onChange={v => onChange({ ...data, originalPrice: v })} placeholder="2490" type="number" /></Field>
      </div>
      <Field label="ভ্যারিয়েন্টস (কমা দিয়ে আলাদা করুন)"><Input value={(data.variants || []).join(', ')} onChange={v => onChange({ ...data, variants: v.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Black, White, Blue" /></Field>
      <Field label="বাটন টেক্সট"><Input value={data.buttonText} onChange={v => onChange({ ...data, buttonText: v })} placeholder="কার্টে যোগ করুন" /></Field>
    </div>
  );
}

// ── 10. Mood Board Editor ──
function MoodBoardEditor({ data, onChange, shopId }) {
  const moods = data.moods || [];
  const addMood = () => onChange({ ...data, moods: [...moods, { title: '', subtitle: '', emoji: '✨', imageUrl: '', tag: '' }] });
  const removeMood = (i) => onChange({ ...data, moods: moods.filter((_, idx) => idx !== i) });
  const updateMood = (i, key, val) => onChange({ ...data, moods: moods.map((m, idx) => idx === i ? { ...m, [key]: val } : m) });

  return (
    <div className="space-y-4">
      <Field label="সেকশন টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Shop by Mood" /></Field>
      {moods.map((mood, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500">Mood Card {i + 1}</span>
            <button onClick={() => removeMood(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
          </div>
          <ImageUploadField label="ছবি" value={mood.imageUrl} onChange={v => updateMood(i, 'imageUrl', v)} shopId={shopId} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="মুড টাইটেল"><Input value={mood.title} onChange={v => updateMood(i, 'title', v)} placeholder="ঈদ শপিং" /></Field>
            <Field label="ইমোজি"><Input value={mood.emoji} onChange={v => updateMood(i, 'emoji', v)} placeholder="🌙" /></Field>
          </div>
        </div>
      ))}
      <button onClick={addMood} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
        <Plus size={13} /> Mood Card যোগ করুন
      </button>
    </div>
  );
}

// ── 11. Deal of the Day Editor ──
function DealOfTheDayEditor({ data, onChange, shopId }) {
  return (
    <div className="space-y-3">
      <ImageUploadField label="প্রোডাক্ট ইমেজ" value={data.imageUrl} onChange={v => onChange({ ...data, imageUrl: v })} shopId={shopId} />
      <Field label="ডিল টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Deal of the Day" /></Field>
      <Field label="পণ্য নাম"><Input value={data.productName} onChange={v => onChange({ ...data, productName: v })} placeholder="Wireless Pro" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="অফার মূল্য (৳)"><Input value={data.price} onChange={v => onChange({ ...data, price: v })} placeholder="1850" type="number" /></Field>
        <Field label="মূল মূল্য (৳)"><Input value={data.originalPrice} onChange={v => onChange({ ...data, originalPrice: v })} placeholder="2490" type="number" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="বিক্রি হয়েছে"><Input value={data.soldCount} onChange={v => onChange({ ...data, soldCount: Number(v) })} placeholder="42" type="number" /></Field>
        <Field label="মোট স্টক"><Input value={data.totalStock} onChange={v => onChange({ ...data, totalStock: Number(v) })} placeholder="60" type="number" /></Field>
      </div>
      <Field label="অফার শেষ হওয়ার সময়">
        <input
          type="datetime-local"
          value={data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : ''}
          onChange={e => onChange({ ...data, endTime: new Date(e.target.value).toISOString() })}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white"
        />
      </Field>
    </div>
  );
}

// ── 12. Price Ladder (Bulk) Editor ──
function PriceLadderEditor({ data, onChange, shopId }) {
  const tiers = data.tiers || [];
  return (
    <div className="space-y-3">
      <ImageUploadField label="পণ্য ছবি" value={data.imageUrl} onChange={v => onChange({ ...data, imageUrl: v })} shopId={shopId} />
      <Field label="পণ্য নাম"><Input value={data.productName} onChange={v => onChange({ ...data, productName: v })} placeholder="সরিষার তেল ১L" /></Field>
      <Field label="১ ইউনিটের বেজ মূল্য (৳)"><Input value={data.basePrice} onChange={v => onChange({ ...data, basePrice: Number(v) })} placeholder="380" type="number" /></Field>
    </div>
  );
}

// ── 13. Before/After Editor ──
function BeforeAfterEditor({ data, onChange, shopId }) {
  return (
    <div className="space-y-3">
      <Field label="সেকশন টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Before & After" /></Field>
      <ImageUploadField label="পূর্বের ছবি (Before Image)" value={data.beforeImage} onChange={v => onChange({ ...data, beforeImage: v })} shopId={shopId} />
      <ImageUploadField label="পরের ছবি (After Image)" value={data.afterImage} onChange={v => onChange({ ...data, afterImage: v })} shopId={shopId} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Before লেবেল"><Input value={data.beforeLabel} onChange={v => onChange({ ...data, beforeLabel: v })} placeholder="ব্যবহারের পূর্বে" /></Field>
        <Field label="After লেবেল"><Input value={data.afterLabel} onChange={v => onChange({ ...data, afterLabel: v })} placeholder="৭ দিন ব্যবহারের পর" /></Field>
      </div>
    </div>
  );
}

// ── 14. Popup Banner Editor ──
function PopupBannerEditor({ data, onChange, shopId }) {
  return (
    <div className="space-y-3">
      <Field label="পপআপ টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="🎉 ঈদ ধামাকা অফার!" /></Field>
      <ImageUploadField label="পপআপ ইমেজ" value={data.imageUrl} onChange={v => onChange({ ...data, imageUrl: v })} shopId={shopId} />
      <Field label="বাটন টেক্সট"><Input value={data.buttonText} onChange={v => onChange({ ...data, buttonText: v })} placeholder="অর্ডার করুন" /></Field>
      <Field label="লিংক"><Input value={data.linkUrl} onChange={v => onChange({ ...data, linkUrl: v })} placeholder="https://..." /></Field>
      <Field label="ডিলে (সেকেন্ড)"><Input value={data.delay} onChange={v => onChange({ ...data, delay: Number(v) })} placeholder="2" type="number" /></Field>
    </div>
  );
}

// ── 15. Trust Strip Editor ──
function TrustStripEditor({ data, onChange }) {
  const items = data.items || [];
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ট্রাস্ট আইটেমসমূহ</p>
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
          <Field label="টাইটেল"><Input value={item.title} onChange={v => {
            const next = [...items]; next[i] = { ...next[i], title: v }; onChange({ ...data, items: next });
          }} placeholder="সারাদেশে দ্রুত ডেলিভারি" /></Field>
          <Field label="সাবটাইটেল"><Input value={item.subtitle} onChange={v => {
            const next = [...items]; next[i] = { ...next[i], subtitle: v }; onChange({ ...data, items: next });
          }} placeholder="২৪-৪৮ ঘণ্টার মধ্যে হোম ডেলিভারি" /></Field>
        </div>
      ))}
    </div>
  );
}

// ── 16. Banner Row Editor ──
function BannerRowEditor({ data, onChange, shopId }) {
  const banners = data.banners || [];
  const addBanner = () => onChange({ ...data, banners: [...banners, { imageUrl: '', linkUrl: '', title: '' }] });
  const remove = (i) => onChange({ ...data, banners: banners.filter((_, idx) => idx !== i) });
  const update = (i, key, val) => onChange({ ...data, banners: banners.map((b, idx) => idx === i ? { ...b, [key]: val } : b) });
  return (
    <div className="space-y-3">
      {banners.map((b, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-2xs">
          <div className="flex justify-between">
            <span className="text-[10px] font-black text-slate-400">Banner {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-400"><Trash2 size={12} /></button>
          </div>
          <ImageUploadField label="Image" value={b.imageUrl} onChange={v => update(i, 'imageUrl', v)} shopId={shopId} />
          <Field label="Link URL"><Input value={b.linkUrl} onChange={v => update(i, 'linkUrl', v)} placeholder="https://..." /></Field>
        </div>
      ))}
      <button onClick={addBanner} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
        <Plus size={13} /> Banner যোগ করুন
      </button>
    </div>
  );
}

// ── 17. Video Reels Editor ──
function VideoReelsEditor({ data, onChange, shopId }) {
  const urls = data.urls || [];
  const addUrl = () => onChange({ ...data, urls: [...urls, { url: '', title: '', thumbnail: '' }] });
  const removeUrl = (i) => onChange({ ...data, urls: urls.filter((_, idx) => idx !== i) });
  const updateUrl = (i, key, val) => onChange({ ...data, urls: urls.map((u, idx) => idx === i ? { ...u, [key]: val } : u) });

  return (
    <div className="space-y-3">
      <Field label="সেকশন টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Video Reels" /></Field>
      {urls.map((reel, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-2xs">
          <div className="flex justify-between">
            <span className="text-[10px] font-black text-slate-400">Reel {i + 1}</span>
            <button onClick={() => removeUrl(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
          </div>
          <Field label="ভিডিও URL (YouTube Shorts/TikTok/Instagram)"><Input value={reel.url} onChange={v => updateUrl(i, 'url', v)} placeholder="https://youtu.be/..." /></Field>
          <Field label="টাইটেল"><Input value={reel.title} onChange={v => updateUrl(i, 'title', v)} placeholder="Reel Title" /></Field>
          <ImageUploadField label="থাম্বনেইল" value={reel.thumbnail} onChange={v => updateUrl(i, 'thumbnail', v)} shopId={shopId} />
        </div>
      ))}
      <button onClick={addUrl} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
        <Plus size={13} /> Reel যোগ করুন
      </button>
    </div>
  );
}

// ── 18. Brand Marquee Editor ──
function BrandMarqueeEditor({ data, onChange }) {
  const brands = data.brands || [];
  const add = () => onChange({ ...data, brands: [...brands, { name: '', logoUrl: '' }] });
  const remove = (i) => onChange({ ...data, brands: brands.filter((_, idx) => idx !== i) });
  const update = (i, key, val) => onChange({ ...data, brands: brands.map((b, idx) => idx === i ? { ...b, [key]: val } : b) });
  return (
    <div className="space-y-3">
      <Field label="সেকশন টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Our Brands" /></Field>
      {brands.map((b, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-2 shadow-2xs">
          <div className="flex-1 space-y-1.5">
            <Field label="ব্র্যান্ড নাম"><Input value={b.name} onChange={v => update(i, 'name', v)} placeholder="Brand Name" /></Field>
          </div>
          <button onClick={() => remove(i)} className="text-red-400 self-center mt-3"><Trash2 size={13} /></button>
        </div>
      ))}
      <button onClick={add} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
        <Plus size={13} /> Brand যোগ করুন
      </button>
    </div>
  );
}

// ── 19. Bundle Section Editor ──
function BundleSectionEditor({ data, onChange, shopId }) {
  const bundles = data.bundles || [];
  const addBundle = () => onChange({ ...data, bundles: [...bundles, { title: '', price: '', originalPrice: '', imageUrl: '', items: '' }] });
  const removeBundle = (i) => onChange({ ...data, bundles: bundles.filter((_, idx) => idx !== i) });
  const updateBundle = (i, key, val) => onChange({ ...data, bundles: bundles.map((b, idx) => idx === i ? { ...b, [key]: val } : b) });

  return (
    <div className="space-y-4">
      <Field label="সেকশন টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Bundle Deals / কম্বো অফার" /></Field>
      {bundles.map((b, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bundle {i + 1}</span>
            <button onClick={() => removeBundle(i)} className="text-red-400 hover:text-red-600 p-1 rounded-lg"><Trash2 size={12} /></button>
          </div>
          <Field label="কম্বো নাম"><Input value={b.title} onChange={v => updateBundle(i, 'title', v)} placeholder="ঈদ মেগা কম্বো" /></Field>
          <ImageUploadField label="ছবি" value={b.imageUrl} onChange={v => updateBundle(i, 'imageUrl', v)} shopId={shopId} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="অফার মূল্য (৳)"><Input value={b.price} onChange={v => updateBundle(i, 'price', v)} placeholder="999" type="number" /></Field>
            <Field label="মূল মূল্য (৳)"><Input value={b.originalPrice} onChange={v => updateBundle(i, 'originalPrice', v)} placeholder="1499" type="number" /></Field>
          </div>
          <Field label="আইটেমসমূহ (কমা দিয়ে আলাদা করুন)"><Input value={b.items} onChange={v => updateBundle(i, 'items', v)} placeholder="পাঞ্জাবি, আতর, ঘড়ি" /></Field>
        </div>
      ))}
      <button onClick={addBundle} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
        <Plus size={13} /> Bundle যোগ করুন
      </button>
    </div>
  );
}

// ── 20. Photo Reviews Editor ──
function PhotoReviewsEditor({ data, onChange, shopId }) {
  const reviews = data.reviews || [];
  const addReview = () => onChange({ ...data, reviews: [...reviews, { name: '', text: '', imageUrl: '', rating: 5 }] });
  const removeReview = (i) => onChange({ ...data, reviews: reviews.filter((_, idx) => idx !== i) });
  const updateReview = (i, key, val) => onChange({ ...data, reviews: reviews.map((r, idx) => idx === i ? { ...r, [key]: val } : r) });

  return (
    <div className="space-y-4">
      <Field label="সেকশন টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Customer Reviews" /></Field>
      {reviews.map((r, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Review {i + 1}</span>
            <button onClick={() => removeReview(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={12} /></button>
          </div>
          <Field label="গ্রাহকের নাম"><Input value={r.name} onChange={v => updateReview(i, 'name', v)} placeholder="রাহিমা বেগম" /></Field>
          <Field label="রিভিউ মতামত"><Textarea value={r.text} onChange={v => updateReview(i, 'text', v)} placeholder="পণ্যটি খুবই ভালো!" rows={2} /></Field>
          <ImageUploadField label="ছবি" value={r.imageUrl} onChange={v => updateReview(i, 'imageUrl', v)} shopId={shopId} />
        </div>
      ))}
      <button onClick={addReview} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
        <Plus size={13} /> Review যোগ করুন
      </button>
    </div>
  );
}

// ── 0. Basic Storefront Editor (Pinned Core Layout) ──
function BasicStorefrontEditor({ data, onChange }) {
  const showDesc = data.showDesc !== false;
  const showSearch = data.showSearch !== false;
  const showCategories = data.showCategories !== false;
  const showProducts = data.showProducts !== false;

  return (
    <div className="space-y-4">
      <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/70 flex items-start gap-3">
        <span className="text-base shrink-0 mt-0.5">📌</span>
        <div>
          <p className="text-xs font-black text-emerald-950">পিন করা মূল স্টোরফ্রন্ট (Pinned Core Layout)</p>
          <p className="text-[11px] text-emerald-800 font-medium mt-0.5 leading-relaxed">
            এটি আপনার স্টোরের মূল বেসিক লেআউট (ডেসক্রিপশন বক্স, সার্চবার, ক্যাটাগরি পিলস ও রেসপনসিভ প্রোডাক্ট গ্রিড)। এটি সবার উপরে পিন করা থাকে এবং স্থান পরিবর্তন হবে না। স্টোর থেকে পুরোপুরি বন্ধ করতে চাইলে ডানপাশের টগল আইকন দিয়ে অফ করে দিন।
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2.5 shadow-2xs">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">উপাদান দৃশ্যমানতা নিয়ন্ত্রণ (Visibility)</p>
        
        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
          <span className="text-xs font-black text-slate-800">স্টোর ডেসক্রিপশন ব্যানার</span>
          <input
            type="checkbox"
            checked={showDesc}
            onChange={e => onChange({ ...data, showDesc: e.target.checked })}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
          <span className="text-xs font-black text-slate-800">সার্চ বার ও সর্ট ফিল্টার</span>
          <input
            type="checkbox"
            checked={showSearch}
            onChange={e => onChange({ ...data, showSearch: e.target.checked })}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
          <span className="text-xs font-black text-slate-800">ক্যাটাগরি বাটন স্ট্রিপ</span>
          <input
            type="checkbox"
            checked={showCategories}
            onChange={e => onChange({ ...data, showCategories: e.target.checked })}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
          <span className="text-xs font-black text-slate-800">বেসিক প্রোডাক্ট গ্রিড / তালিকা</span>
          <input
            type="checkbox"
            checked={showProducts}
            onChange={e => onChange({ ...data, showProducts: e.target.checked })}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}

// ── Generic Fallback Editor ──
function GenericEditor({ data, onChange }) {
  return (
    <div className="space-y-3">
      <Field label="সেকশন টাইটেল"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Section Title" /></Field>
      <Field label="সাবটাইটেল"><Input value={data.subtitle} onChange={v => onChange({ ...data, subtitle: v })} placeholder="Section Subtitle" /></Field>
    </div>
  );
}

// ── Main Section Editor Router ──
export default function SectionEditor({ section, onChange, theme, shopId, onRemove }) {
  const EDITORS = {
    basic_storefront:  BasicStorefrontEditor,
    hero_carousel:     HeroCarouselEditor,
    category_scroller: CategoryScrollerEditor,
    flash_sale:        FlashSaleEditor,
    product_grid:      ProductGridEditor,
    video_reels:       VideoReelsEditor,
    banner_row:        BannerRowEditor,
    bundle_section:    BundleSectionEditor,
    photo_reviews:     PhotoReviewsEditor,
    popup_banner:      PopupBannerEditor,
    brand_marquee:     BrandMarqueeEditor,

    // New Sections
    split_showcase:    SplitShowcaseEditor,
    editorial_story:   EditorialStoryEditor,
    shop_the_look:     ShopTheLookEditor,
    bento_mosaic:      BentoMosaicEditor,
    product_spotlight: ProductSpotlightEditor,
    mood_board:        MoodBoardEditor,
    deal_of_the_day:   DealOfTheDayEditor,
    price_ladder:      PriceLadderEditor,
    before_after:      BeforeAfterEditor,
    trust_strip:       TrustStripEditor,
  };

  const Editor = EDITORS[section.type] || GenericEditor;
  const isPinned = section.type === 'basic_storefront' || section.isPinned;

  return (
    <div className="p-4 space-y-4">
      <Editor data={section.data || {}} onChange={onChange} theme={theme} shopId={shopId} />

      {/* Delete / Remove Section Action (hidden for pinned basic storefront) */}
      {onRemove && !isPinned && (
        <div className="pt-3 border-t border-slate-200/80 flex justify-end">
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>সেকশন মুছে ফেলুন</span>
          </button>
        </div>
      )}
    </div>
  );
}
