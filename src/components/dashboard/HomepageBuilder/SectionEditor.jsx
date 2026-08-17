'use client';
import { useState } from 'react';
import { Plus, Trash2, Link, Image as ImageIcon, Type, Clock, Upload } from 'lucide-react';

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white placeholder:font-medium placeholder:text-slate-300"
    />
  );
}

// ── Hero Carousel Editor ──
function HeroCarouselEditor({ data, onChange, shopId }) {
  const slides = data.slides || [];
  const addSlide = () => onChange({ slides: [...slides, { url: '', title: '', description: '', linkUrl: '', buttonText: '' }] });
  const removeSlide = (i) => onChange({ slides: slides.filter((_, idx) => idx !== i) });
  const updateSlide = (i, key, val) => onChange({ slides: slides.map((s, idx) => idx === i ? { ...s, [key]: val } : s) });

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Slide {i + 1}</span>
            <button onClick={() => removeSlide(i)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"><Trash2 size={12} /></button>
          </div>
          <ImageUploadField label="Image" value={slide.url} onChange={v => updateSlide(i, 'url', v)} placeholder="https://... অথবা আপলোড করুন" shopId={shopId} />
          <Field label="Title"><Input value={slide.title} onChange={v => updateSlide(i, 'title', v)} placeholder="ব্যানার টাইটেল" /></Field>
          <Field label="Description"><Input value={slide.description} onChange={v => updateSlide(i, 'description', v)} placeholder="সংক্ষিপ্ত বিবরণ" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Button Text"><Input value={slide.buttonText} onChange={v => updateSlide(i, 'buttonText', v)} placeholder="এখনই কিনুন" /></Field>
            <Field label="Link URL"><Input value={slide.linkUrl} onChange={v => updateSlide(i, 'linkUrl', v)} placeholder="https://..." /></Field>
          </div>
        </div>
      ))}
      <button onClick={addSlide} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2">
        <Plus size={12} /> Slide যোগ করুন
      </button>
    </div>
  );
}

// ── Category Scroller Editor ──
function CategoryScrollerEditor({ data, onChange }) {
  const items = data.items || [];
  const addItem = () => onChange({ items: [...items, { label: '', imageUrl: '', emoji: '🛍️' }] });
  const removeItem = (i) => onChange({ items: items.filter((_, idx) => idx !== i) });
  const updateItem = (i, key, val) => onChange({ items: items.map((s, idx) => idx === i ? { ...s, [key]: val } : s) });

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400">Category {i + 1}</span>
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Emoji"><Input value={item.emoji} onChange={v => updateItem(i, 'emoji', v)} placeholder="🛍️" /></Field>
            <Field label="Label"><Input value={item.label} onChange={v => updateItem(i, 'label', v)} placeholder="Category Name" /></Field>
          </div>
          <Field label="Image URL (optional)"><Input value={item.imageUrl} onChange={v => updateItem(i, 'imageUrl', v)} placeholder="https://..." /></Field>
        </div>
      ))}
      <button onClick={addItem} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2">
        <Plus size={12} /> Category যোগ করুন
      </button>
    </div>
  );
}

// ── Flash Sale Editor ──
function FlashSaleEditor({ data, onChange }) {
  return (
    <div className="space-y-3">
      <Field label="Sale Title"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="🔥 Flash Sale" /></Field>
      <Field label="End Time">
        <input
          type="datetime-local"
          value={data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : ''}
          onChange={e => onChange({ ...data, endTime: new Date(e.target.value).toISOString() })}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </Field>
      <Field label="Product IDs (comma separated)">
        <textarea
          value={(data.productIds || []).join(', ')}
          onChange={e => onChange({ ...data, productIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="product-id-1, product-id-2, ..."
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
        />
      </Field>
    </div>
  );
}

// ── Video Reels Editor ──
function VideoReelsEditor({ data, onChange }) {
  const urls = data.urls || [];
  const addUrl = () => onChange({ urls: [...urls, { url: '', title: '', thumbnail: '' }] });
  const removeUrl = (i) => onChange({ urls: urls.filter((_, idx) => idx !== i) });
  const updateUrl = (i, key, val) => onChange({ urls: urls.map((u, idx) => idx === i ? { ...u, [key]: val } : u) });

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-slate-500 font-medium">YouTube Shorts, TikTok, বা Instagram Reel URL দিন</p>
      {urls.map((reel, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-[10px] font-black text-slate-400">Reel {i + 1}</span>
            <button onClick={() => removeUrl(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
          </div>
          <Field label="Video URL"><Input value={reel.url} onChange={v => updateUrl(i, 'url', v)} placeholder="https://youtu.be/..." /></Field>
          <Field label="Title"><Input value={reel.title} onChange={v => updateUrl(i, 'title', v)} placeholder="Reel Title" /></Field>
          <Field label="Thumbnail URL"><Input value={reel.thumbnail} onChange={v => updateUrl(i, 'thumbnail', v)} placeholder="https://..." /></Field>
        </div>
      ))}
      <button onClick={addUrl} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2">
        <Plus size={12} /> Reel যোগ করুন
      </button>
    </div>
  );
}

// ── Product Grid Editor ──
function ProductGridEditor({ data, onChange }) {
  const TABS = ['trending', 'new', 'bestseller', 'all'];
  const TAB_LABELS = { trending: 'Trending', new: 'New Arrivals', bestseller: 'Best Sellers', all: 'All Products' };
  const currentTabs = data.tabs || ['trending', 'new', 'bestseller'];
  const toggleTab = (tab) => {
    const next = currentTabs.includes(tab) ? currentTabs.filter(t => t !== tab) : [...currentTabs, tab];
    onChange({ ...data, tabs: next.length ? next : [tab] });
  };

  return (
    <div className="space-y-3">
      <Field label="Section Title"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="আমাদের পণ্যসমূহ" /></Field>
      <Field label="Tabs">
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => toggleTab(tab)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all border ${
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
      <Field label="Max Products">
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

// ── Generic editors for simpler sections ──
function BannerRowEditor({ data, onChange, shopId }) {
  const banners = data.banners || [];
  const addBanner = () => onChange({ banners: [...banners, { imageUrl: '', linkUrl: '', title: '' }] });
  const remove = (i) => onChange({ banners: banners.filter((_, idx) => idx !== i) });
  const update = (i, key, val) => onChange({ banners: banners.map((b, idx) => idx === i ? { ...b, [key]: val } : b) });
  return (
    <div className="space-y-3">
      {banners.map((b, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-[10px] font-black text-slate-400">Banner {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-400"><Trash2 size={12} /></button>
          </div>
          <ImageUploadField label="Image" value={b.imageUrl} onChange={v => update(i, 'imageUrl', v)} shopId={shopId} />
          <Field label="Link URL"><Input value={b.linkUrl} onChange={v => update(i, 'linkUrl', v)} placeholder="https://..." /></Field>
        </div>
      ))}
      <button onClick={addBanner} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2">
        <Plus size={12} /> Banner যোগ করুন
      </button>
    </div>
  );
}

function ConcernGridEditor({ data, onChange }) {
  const items = data.items || [];
  const add = () => onChange({ items: [...items, { label: '', emoji: '✨', imageUrl: '', tag: '', color: '#F3E8FF' }] });
  const remove = (i) => onChange({ items: items.filter((_, idx) => idx !== i) });
  const update = (i, key, val) => onChange({ items: items.map((s, idx) => idx === i ? { ...s, [key]: val } : s) });
  return (
    <div className="space-y-3">
      <Field label="Section Title"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Shop by Concern" /></Field>
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-[10px] font-black text-slate-400">Card {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-400"><Trash2 size={12} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Emoji"><Input value={item.emoji} onChange={v => update(i, 'emoji', v)} placeholder="✨" /></Field>
            <Field label="Label"><Input value={item.label} onChange={v => update(i, 'label', v)} placeholder="Brightening" /></Field>
          </div>
          <Field label="Filter Tag"><Input value={item.tag} onChange={v => update(i, 'tag', v)} placeholder="brightening" /></Field>
          <Field label="Image URL"><Input value={item.imageUrl} onChange={v => update(i, 'imageUrl', v)} placeholder="https://..." /></Field>
        </div>
      ))}
      <button onClick={add} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2">
        <Plus size={12} /> Card যোগ করুন
      </button>
    </div>
  );
}

function BrandMarqueeEditor({ data, onChange }) {
  const brands = data.brands || [];
  const add = () => onChange({ brands: [...brands, { name: '', logoUrl: '' }] });
  const remove = (i) => onChange({ brands: brands.filter((_, idx) => idx !== i) });
  const update = (i, key, val) => onChange({ brands: brands.map((b, idx) => idx === i ? { ...b, [key]: val } : b) });
  return (
    <div className="space-y-3">
      <Field label="Section Title"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Our Brands" /></Field>
      {brands.map((b, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2">
          <div className="flex-1 space-y-1.5">
            <Field label="Name"><Input value={b.name} onChange={v => update(i, 'name', v)} placeholder="Brand Name" /></Field>
            <Field label="Logo URL"><Input value={b.logoUrl} onChange={v => update(i, 'logoUrl', v)} placeholder="https://..." /></Field>
          </div>
          <button onClick={() => remove(i)} className="text-red-400 self-start mt-5"><Trash2 size={12} /></button>
        </div>
      ))}
      <button onClick={add} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2">
        <Plus size={12} /> Brand যোগ করুন
      </button>
    </div>
  );
}

function InstagramFeedEditor({ data, onChange }) {
  return (
    <div className="space-y-3">
      <Field label="Section Title"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Instagram Feed" /></Field>
      <Field label="Embed URL"><Input value={data.embedUrl} onChange={v => onChange({ ...data, embedUrl: v })} placeholder="https://www.instagram.com/..." /></Field>
      <p className="text-[10px] text-slate-400 font-medium">Instagram-এর embed URL বা Elfsight widget URL দিন</p>
    </div>
  );
}

function PriceTierEditor({ data, onChange }) {
  const tiers = data.tiers || [299, 599, 999];
  return (
    <div className="space-y-3">
      <Field label="Section Title"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Budget Store" /></Field>
      <Field label="Price Tiers (৳)">
        <div className="flex gap-2">
          {tiers.map((t, i) => (
            <input
              key={i}
              type="number"
              value={t}
              onChange={e => { const next = [...tiers]; next[i] = parseInt(e.target.value); onChange({ ...data, tiers: next }); }}
              className="flex-1 px-2 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300 text-center"
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

// ── Image Upload Field — Cloudinary upload via /api/upload ──
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
    } catch (err) {
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
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-400 focus:bg-white transition-all"
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
          <div className="relative w-full h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <img src={value} alt="preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </Field>
  );
}

// ── Bundle Section Editor ──
function BundleSectionEditor({ data, onChange, shopId }) {
  const bundles = data.bundles || [];
  const addBundle = () => onChange({ ...data, bundles: [...bundles, { title: '', price: '', originalPrice: '', imageUrl: '', items: '' }] });
  const removeBundle = (i) => onChange({ ...data, bundles: bundles.filter((_, idx) => idx !== i) });
  const updateBundle = (i, key, val) => onChange({ ...data, bundles: bundles.map((b, idx) => idx === i ? { ...b, [key]: val } : b) });

  return (
    <div className="space-y-4">
      <Field label="Section Title"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Bundle Deals / কম্বো অফার" /></Field>
      {bundles.map((b, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bundle {i + 1}</span>
            <button onClick={() => removeBundle(i)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"><Trash2 size={12} /></button>
          </div>
          <Field label="Bundle Name"><Input value={b.title} onChange={v => updateBundle(i, 'title', v)} placeholder="কম্বো প্যাক — ৩টি পণ্য" /></Field>
          <ImageUploadField label="Image" value={b.imageUrl} onChange={v => updateBundle(i, 'imageUrl', v)} shopId={shopId} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Bundle Price (৳)"><Input value={b.price} onChange={v => updateBundle(i, 'price', v)} placeholder="999" type="number" /></Field>
            <Field label="Original Price (৳)"><Input value={b.originalPrice} onChange={v => updateBundle(i, 'originalPrice', v)} placeholder="1499" type="number" /></Field>
          </div>
          <Field label="Items (কমা দিয়ে আলাদা করুন)"><Input value={b.items} onChange={v => updateBundle(i, 'items', v)} placeholder="ফেসওয়াশ, টোনার, ময়েশ্চারাইজার" /></Field>
        </div>
      ))}
      <button onClick={addBundle} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2">
        <Plus size={14} /> Bundle যোগ করুন
      </button>
    </div>
  );
}

// ── Photo Reviews Editor ──
function PhotoReviewsEditor({ data, onChange, shopId }) {
  const reviews = data.reviews || [];
  const addReview = () => onChange({ ...data, reviews: [...reviews, { name: '', text: '', imageUrl: '', rating: 5 }] });
  const removeReview = (i) => onChange({ ...data, reviews: reviews.filter((_, idx) => idx !== i) });
  const updateReview = (i, key, val) => onChange({ ...data, reviews: reviews.map((r, idx) => idx === i ? { ...r, [key]: val } : r) });

  return (
    <div className="space-y-4">
      <Field label="Section Title"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Customer Reviews / রিভিউ" /></Field>
      {reviews.map((r, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Review {i + 1}</span>
            <button onClick={() => removeReview(i)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"><Trash2 size={12} /></button>
          </div>
          <Field label="Customer Name"><Input value={r.name} onChange={v => updateReview(i, 'name', v)} placeholder="রাহিমা বেগম" /></Field>
          <Field label="Review Text"><Input value={r.text} onChange={v => updateReview(i, 'text', v)} placeholder="পণ্যটি খুবই ভালো!" /></Field>
          <ImageUploadField label="Photo" value={r.imageUrl} onChange={v => updateReview(i, 'imageUrl', v)} shopId={shopId} />
          <Field label="Rating (1-5)">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => updateReview(i, 'rating', star)}
                  className={`text-lg ${star <= (r.rating || 5) ? 'text-amber-400' : 'text-slate-200'}`}>★</button>
              ))}
            </div>
          </Field>
        </div>
      ))}
      <button onClick={addReview} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2">
        <Plus size={14} /> Review যোগ করুন
      </button>
    </div>
  );
}

// ── Popup Banner Editor ──
function PopupBannerEditor({ data, onChange, shopId }) {
  return (
    <div className="space-y-3">
      <Field label="Section Title"><Input value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Special Offer Popup" /></Field>
      <ImageUploadField label="Popup Image" value={data.imageUrl} onChange={v => onChange({ ...data, imageUrl: v })} shopId={shopId} />
      <Field label="Link URL"><Input value={data.linkUrl} onChange={v => onChange({ ...data, linkUrl: v })} placeholder="https://..." /></Field>
      <Field label="Button Text"><Input value={data.buttonText} onChange={v => onChange({ ...data, buttonText: v })} placeholder="অর্ডার করুন" /></Field>
      <Field label="Show Delay (seconds)">
        <Input value={data.delay} onChange={v => onChange({ ...data, delay: v })} placeholder="2" type="number" />
      </Field>
      <p className="text-[10px] text-slate-400 font-medium">ওয়েবসাইটে ঢোকার কত সেকেন্ড পর popup দেখাবে সেটি সেট করুন</p>
    </div>
  );
}

// ── Main Router ──
export default function SectionEditor({ section, onChange, theme, shopId }) {
  const EDITORS = {
    hero_carousel:     HeroCarouselEditor,
    category_scroller: CategoryScrollerEditor,
    flash_sale:        FlashSaleEditor,
    product_grid:      ProductGridEditor,
    video_reels:       VideoReelsEditor,
    banner_row:        BannerRowEditor,
    concern_grid:      ConcernGridEditor,
    brand_marquee:     BrandMarqueeEditor,
    instagram_feed:    InstagramFeedEditor,
    price_tier_store:  PriceTierEditor,
    bundle_section:    BundleSectionEditor,
    photo_reviews:     PhotoReviewsEditor,
    popup_banner:      PopupBannerEditor,
  };

  const Editor = EDITORS[section.type];

  return (
    <div className="p-4">
      {Editor ? (
        <Editor data={section.data || {}} onChange={onChange} theme={theme} shopId={shopId} />
      ) : (
        <p className="text-xs text-slate-400 font-medium text-center py-4">এই section-এর জন্য editor এখনও তৈরি হয়নি।</p>
      )}
    </div>
  );
}
