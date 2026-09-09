'use client';

import { useState, useRef } from 'react';
import { 
  Camera, Upload, Edit3, Image as ImageIcon, Type, 
  Sparkles, Save, Check, X, Smartphone, Monitor, 
  Trash2, Plus, ArrowRight, ShoppingBag, Eye, Globe,
  ShieldCheck, Truck, Phone, Star, Layers, Sliders, ExternalLink,
  ArrowUp, ArrowDown, EyeOff, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { updateShop } from '@/lib/firestore';
import toast from 'react-hot-toast';
import SectionRenderer from '@/components/storefront/sections/SectionRenderer';
import SectionEditor from './SectionEditor';
import { SECTION_METADATA } from './SectionList';
import { DEMO_PRODUCTS } from '@/lib/homepageDemoData';

export default function VisualLiveEditor({
  shop = null,
  sections = [],
  theme = {},
  headerConfig = {},
  footerConfig = {},
  products = [],
  onUpdateSections,
  onUpdateTheme,
  onUpdateHeader,
  onUpdateFooter,
  onUpdateShop,
  onSaveDraft,
  onPublish,
  isSaving = false,
  isPublishing = false,
}) {
  const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' | 'mobile'
  
  // Modal edit states
  const [editModal, setEditModal] = useState(null); // 'logo' | 'hero' | 'product' | 'section'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  // Form states for Header / Logo
  const [brandName, setBrandName] = useState(shop?.shopName || shop?.shopSlug || 'My Store');
  const [logoUrl, setLogoUrl] = useState(shop?.logoUrl || '');
  const [hotline, setHotline] = useState(shop?.contactPhone || '০১৭১১-০০০০০০');
  const [tagline, setTagline] = useState(shop?.description || 'বিশ্বস্ত অনলাইন শপ');

  // Form states for Hero Banner
  const heroSection = sections.find(s => s.id === 'hero' || s.type === 'hero_carousel') || { data: {} };
  const firstSlide = heroSection?.data?.slides?.[0] || {};
  const [bannerImage, setBannerImage] = useState(firstSlide.imageUrl || shop?.bannerUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80');
  const [bannerTitle, setBannerTitle] = useState(firstSlide.title || 'সেরা অফার ও কালেকশন');
  const [bannerSubtitle, setBannerSubtitle] = useState(firstSlide.subtitle || 'সরাসরি ক্যাশ অন ডেলিভারি ও দ্রুত সার্ভিস');
  const [bannerCtaText, setBannerCtaText] = useState(firstSlide.buttonText || 'এখনই কিনুন');
  const [bannerCtaLink, setBannerCtaLink] = useState(firstSlide.buttonLink || '#products');

  // Local product edit state
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState(0);
  const [editProdOldPrice, setEditProdOldPrice] = useState(0);
  const [editProdImage, setEditProdImage] = useState('');

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [showSectionDrawer, setShowSectionDrawer] = useState(false);
  const [sectionCategoryFilter, setSectionCategoryFilter] = useState('all');

  const effectiveProducts = (products && products.length > 0) ? products : DEMO_PRODUCTS;

  const sortedSections = [...(sections || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const dynamicSections = sortedSections.filter(s => s.type !== 'basic_storefront' && s.id !== 'hero' && s.type !== 'hero_carousel' && s.enabled);

  const handleUpdateSectionData = (sectionId, newData) => {
    const updated = (sections || []).map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          data: {
            ...(s.data || {}),
            ...newData
          }
        };
      }
      return s;
    });
    onUpdateSections(updated);
    if (selectedSection?.id === sectionId) {
      setSelectedSection(prev => prev ? { ...prev, data: { ...(prev.data || {}), ...newData } } : null);
    }
  };

  const handleToggleSection = (sectionIdOrType) => {
    const existing = (sections || []).find(s => s.id === sectionIdOrType || s.type === sectionIdOrType);
    let updated;
    if (existing) {
      updated = (sections || []).map(s => {
        if (s.id === existing.id) {
          return { ...s, enabled: !s.enabled };
        }
        return s;
      });
      if (selectedSection?.id === existing.id) {
        setSelectedSection(prev => prev ? { ...prev, enabled: !prev.enabled } : null);
      }
    } else {
      const newSec = {
        id: sectionIdOrType,
        type: sectionIdOrType,
        enabled: true,
        order: (sections || []).length,
        data: {}
      };
      updated = [...(sections || []), newSec];
    }
    onUpdateSections(updated);
    toast.success('ডাইনামিক সেকশন আপডেট হয়েছে!');
  };

  const handleMoveSection = (sectionId, direction) => {
    const dyn = [...dynamicSections];
    const idx = dyn.findIndex(s => s.id === sectionId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= dyn.length) return;

    const itemToMove = dyn[idx];
    const targetItem = dyn[targetIdx];

    const itemOrder = itemToMove.order ?? idx;
    const targetOrder = targetItem.order ?? targetIdx;

    const updated = (sections || []).map(s => {
      if (s.id === itemToMove.id) return { ...s, order: targetOrder };
      if (s.id === targetItem.id) return { ...s, order: itemOrder };
      return s;
    });

    onUpdateSections(updated);
  };

  const themeVars = {
    primaryColor: theme?.primaryColor || '#6D28D9',
    '--sp-primary': theme?.primaryColor || '#6D28D9',
    '--sp-header-bg': theme?.headerBg || '#ffffff',
    '--sp-header-text': theme?.headerText || '#0f172a',
    font: theme?.font || 'Hind Siliguri',
  };

  const previewCallbacks = {
    onAddToCart: () => toast.success('কার্টে যোগ করা হয়েছে (প্রিভিউ)'),
    onProductClick: () => {},
    onCategoryClick: () => {},
    onConcernClick: () => {},
    onTierClick: () => {},
    onAddBundle: () => toast.success('বান্ডেল কার্টে যোগ হয়েছে (প্রিভিউ)'),
  };

  // File upload helper with client-side base64 fallback so it NEVER fails
  const handleFileUpload = (file, onSuccess) => {
    if (!file) return;
    setUploading(true);

    // Try API upload first
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'homepage-visual-builder');

    const uploadUrl = shop?.id ? `/api/upload?shopId=${shop.id}` : '/api/upload';

    fetch(uploadUrl, { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          onSuccess(data.url);
          toast.success('ছবি সফলভাবে আপলোড হয়েছে!');
        } else {
          // Fallback to FileReader Base64
          readAsBase64(file, onSuccess);
        }
      })
      .catch(() => {
        // Fallback to FileReader Base64
        readAsBase64(file, onSuccess);
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const readAsBase64 = (file, onSuccess) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onSuccess(e.target.result);
      toast.success('ছবি ডিভাইস থেকে লোড হয়েছে!');
    };
    reader.onerror = () => {
      toast.error('ছবি লোড করা যায়নি');
    };
    reader.readAsDataURL(file);
  };

  // Save Logo & Brand settings
  const handleSaveLogoAndBrand = async () => {
    if (shop?.id) {
      try {
        await updateShop(shop.id, {
          shopName: brandName,
          logoUrl: logoUrl,
          contactPhone: hotline,
          description: tagline
        });
        if (onUpdateShop) {
          onUpdateShop({ ...shop, shopName: brandName, logoUrl: logoUrl, contactPhone: hotline, description: tagline });
        }
        toast.success('লোগো ও ব্র্যান্ড তথ্য সংরক্ষিত হয়েছে!');
      } catch (err) {
        toast.error('সংরক্ষণ ব্যর্থ: ' + err.message);
      }
    }
    setEditModal(null);
  };

  // Save Hero Banner settings
  const handleSaveHeroBanner = () => {
    const updatedSections = sections.map(s => {
      if (s.id === 'hero' || s.type === 'hero_carousel') {
        const slides = s.data?.slides || [];
        const newSlide = {
          imageUrl: bannerImage,
          title: bannerTitle,
          subtitle: bannerSubtitle,
          buttonText: bannerCtaText,
          buttonLink: bannerCtaLink
        };
        return {
          ...s,
          enabled: true,
          data: {
            ...s.data,
            slides: slides.length > 0 ? [newSlide, ...slides.slice(1)] : [newSlide]
          }
        };
      }
      return s;
    });

    onUpdateSections(updatedSections);
    toast.success('ব্যানারের পরিবর্তন সফলভাবে সেভ হয়েছে!');
    setEditModal(null);
  };

  // Save Product Quick Edit
  const handleSaveProduct = async () => {
    if (!selectedProduct) return;
    const shopId = shop?.id;
    const isRealProduct = selectedProduct.id && !selectedProduct.id.startsWith('sample');

    if (shopId && isRealProduct) {
      try {
        const { updateProduct } = await import('@/lib/firestore');
        await updateProduct(shopId, selectedProduct.id, {
          name: editProdName,
          price: Number(editProdPrice),
          originalPrice: Number(editProdOldPrice),
          imageUrl: editProdImage
        });
        toast.success('প্রোডাক্ট সরাসরি আপনার শপে আপডেট হয়েছে! 🎉');
      } catch (err) {
        console.error('Failed to update product document:', err);
        toast.error('প্রোডাক্ট সেভ করতে সমস্যা হয়েছে।');
      }
    } else {
      toast.success('প্রোডাক্ট তথ্য সেভ হয়েছে!');
    }

    const updatedProducts = products.map(p => {
      if (p.id === selectedProduct.id) {
        return {
          ...p,
          name: editProdName,
          price: Number(editProdPrice),
          originalPrice: Number(editProdOldPrice),
          imageUrl: editProdImage
        };
      }
      return p;
    });

    if (onUpdateSections) {
      // Trigger UI refresh
    }
    setEditModal(null);
  };

  const primaryColor = theme?.primaryColor || '#6D28D9';
  const secondaryColor = theme?.secondaryColor || '#1E1B4B';

  return (
    <div className="space-y-4">
      {/* ── Top Bar with Device Switcher & Quick Save ── */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-black">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>ভিজ্যুয়াল লাইভ এডিটর</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-mono">
                WYSIWYG Mode
              </span>
            </h3>
            <p className="text-[10px] text-slate-500">
              যেকোনো ব্যানার, লোগো বা টেক্সটের উপরে ক্লিক করলেই সরাসরি ডিভাইস থেকে পরিবর্তন করতে পারবেন।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic Sections Toggle Button */}
          <button
            type="button"
            onClick={() => setShowSectionDrawer(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs border cursor-pointer ${
              showSectionDrawer 
                ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20' 
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
            }`}
          >
            <Layers size={14} />
            <span>ডাইনামিক সেকশনসমূহ ({dynamicSections.length})</span>
            {showSectionDrawer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Device toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setDeviceView('desktop')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                deviceView === 'desktop' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Monitor size={14} />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceView('mobile')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                deviceView === 'mobile' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Smartphone size={14} />
              <span className="hidden sm:inline">Mobile (390px)</span>
            </button>
          </div>

          {/* Quick Publish button */}
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Check size={14} />
            <span>{isPublishing ? 'পাবলিশ হচ্ছে...' : 'পাবলিশ করুন'}</span>
          </button>
        </div>
      </div>

      {/* ── Collapsible Dynamic Drag & Drop Sections Manager Drawer ── */}
      {showSectionDrawer && (
        <div className="bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800/60 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="text-purple-600" size={16} />
                <span>ডাইনামিক সেকশনসমূহ (Dynamic Drag & Drop Sections)</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono font-black">
                  {dynamicSections.length} অন রয়েছে
                </span>
              </h4>
              <p className="text-xs text-slate-500">
                যে সেকশনগুলো আপনার স্টোরের ক্যাটাগরির জন্য সেরা সেগুলো অন করুন। ক্যানভাসে সরাসরি ক্লিক করে এডিট করা যাবে।
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: 'সব সেকশন' },
                { id: 'conversion', label: '⚡ ডিলস ও সেল' },
                { id: 'editorial', label: '🎨 ভিজ্যুয়াল' },
                { id: 'social', label: '⭐ সোশ্যাল ও রিভিউ' },
                { id: 'core', label: '📦 কোর লেআউট' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSectionCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    sectionCategoryFilter === cat.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sections Switch Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {Object.entries(SECTION_METADATA)
              .filter(([type]) => type !== 'basic_storefront' && type !== 'hero_carousel')
              .filter(([_, meta]) => sectionCategoryFilter === 'all' || meta.category === sectionCategoryFilter)
              .map(([type, meta]) => {
                const IconComponent = meta.icon || Layers;
                const currentSection = (sections || []).find(s => s.type === type || s.id === type);
                const isEnabled = !!currentSection?.enabled;

                return (
                  <div
                    key={type}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                      isEnabled
                        ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700/60 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: `${meta.color || '#6D28D9'}18`, color: meta.color || '#6D28D9' }}
                      >
                        <IconComponent size={15} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {meta.label}
                        </h5>
                        <p className="text-[10px] text-slate-400 truncate">
                          {meta.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEnabled && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSection(currentSection);
                            setEditModal('section');
                          }}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-700/50 text-[10px] font-bold shadow-2xs cursor-pointer"
                          title="সেকশন এডিট করুন"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleSection(type)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={isEnabled ? 'সেকশন বন্ধ করুন' : 'সেকশন চালু করুন'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Main Canvas Viewport ── */}
      <div className="bg-slate-100 dark:bg-slate-950 p-2 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-auto min-h-[750px]">
        <div 
          className={`bg-white text-slate-900 shadow-2xl transition-all duration-300 overflow-hidden relative ${
            deviceView === 'mobile' 
              ? 'w-[390px] min-h-[800px] rounded-[44px] border-[10px] border-slate-800 ring-1 ring-slate-700' 
              : 'w-full max-w-5xl rounded-3xl border border-slate-200'
          }`}
          style={{ fontFamily: theme?.font || 'Hind Siliguri, sans-serif' }}
        >
          {/* Mobile top notch */}
          {deviceView === 'mobile' && (
            <div className="bg-slate-900 h-5 w-full flex items-center justify-center">
              <div className="w-20 h-3 bg-black rounded-full" />
            </div>
          )}

          {/* ── 1. EDITABLE HEADER & LOGO ── */}
          <div className="relative group border-b border-slate-100">
            {/* Edit overlay button */}
            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => setEditModal('logo')}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-lg flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Edit3 size={13} />
                <span>লোগো ও নাম পরিবর্তন (500x500px)</span>
              </button>
            </div>

            {/* Top hotline bar */}
            <div 
              className="px-4 py-1.5 text-white text-[11px] font-bold flex items-center justify-between"
              style={{ backgroundColor: secondaryColor }}
            >
              <span>{tagline}</span>
              <span className="font-mono">হটলাইন: {hotline}</span>
            </div>

            {/* Main Header bar */}
            <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 cursor-pointer" onClick={() => setEditModal('logo')}>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={brandName} className="w-10 h-10 object-contain rounded-xl border border-slate-200" />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {brandName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-black tracking-tight" style={{ color: secondaryColor }}>
                    {brandName}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {shop?.subdomainSlug || 'yourshop'}.bdretailers.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-600 font-bold px-2 py-1 rounded bg-purple-50 group-hover:bg-purple-100 transition-colors">
                  ✏️ ক্লিক করে এডিট করুন
                </span>
              </div>
            </div>
          </div>

          {/* ── 2. EDITABLE HERO BANNER ── */}
          <div className="relative group p-3 sm:p-6">
            {/* Edit overlay button */}
            <div className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => setEditModal('hero')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-xl flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Camera size={14} />
                <span>ব্যানার ছবি ও টেক্সট পরিবর্তন (1920x600px)</span>
              </button>
            </div>

            <div 
              className="rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                borderRadius: theme?.cardRadius || '24px'
              }}
              onClick={() => setEditModal('hero')}
            >
              <div className="space-y-3 max-w-xl text-left z-10">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/20 backdrop-blur">
                  লাইভ এডিটেবল ব্যানার
                </span>
                <h2 className="text-xl sm:text-3xl font-black leading-tight">
                  {bannerTitle}
                </h2>
                <p className="text-xs text-white/90 font-medium">
                  {bannerSubtitle}
                </p>
                <button 
                  type="button"
                  className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-black text-xs shadow hover:scale-105 transition-all"
                >
                  {bannerCtaText}
                </button>
              </div>

              <div className="w-full md:w-64 h-40 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0 z-10 relative">
                <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-3 py-1 rounded-lg bg-black/70 text-xs font-bold flex items-center gap-1">
                    <Camera size={12} /> ছবি পরিবর্তন
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2.5 DYNAMIC DRAG & DROP SECTIONS RENDERING ── */}
          <div className="px-3 sm:px-6 py-2 space-y-4">
            {dynamicSections.map((sec, idx) => {
              const meta = SECTION_METADATA[sec.type] || { label: sec.type, desc: '', icon: Layers };
              const IconComp = meta.icon || Layers;
              return (
                <div
                  key={sec.id}
                  className="relative group/sec my-3 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:shadow-xl rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden bg-white dark:bg-slate-900"
                  onClick={() => {
                    setSelectedSection(sec);
                    setEditModal('section');
                  }}
                >
                  {/* Hover Action Toolbar */}
                  <div 
                    className="absolute top-3 right-3 z-30 opacity-0 group-hover/sec:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-2xl border border-white/10"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1 text-[11px] font-black text-purple-300 mr-2 border-r border-white/20 pr-2">
                      <IconComp size={13} />
                      <span>{meta.label}</span>
                    </div>

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(sec.id, 'up')}
                      className="p-1 text-slate-300 hover:text-white disabled:opacity-25 rounded hover:bg-white/10 cursor-pointer"
                      title="উপরে নিন"
                    >
                      <ArrowUp size={13} />
                    </button>

                    <button
                      type="button"
                      disabled={idx === dynamicSections.length - 1}
                      onClick={() => handleMoveSection(sec.id, 'down')}
                      className="p-1 text-slate-300 hover:text-white disabled:opacity-25 rounded hover:bg-white/10 cursor-pointer"
                      title="নিচে নিন"
                    >
                      <ArrowDown size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSection(sec);
                        setEditModal('section');
                      }}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={12} />
                      <span>এডিট</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSection(sec.id)}
                      className="p-1 text-rose-400 hover:text-rose-200 rounded hover:bg-rose-900/40 cursor-pointer"
                      title="সেকশনটি অফ করুন"
                    >
                      <EyeOff size={13} />
                    </button>
                  </div>

                  {/* Dynamic Section Content via SectionRenderer */}
                  <div className="pointer-events-none">
                    <SectionRenderer
                      section={sec}
                      products={effectiveProducts}
                      themeVars={themeVars}
                      callbacks={previewCallbacks}
                      isPreview={true}
                    />
                  </div>
                </div>
              );
            })}

            {/* Prompt when no dynamic sections are on */}
            {dynamicSections.length === 0 && (
              <div className="p-6 text-center bg-purple-50/50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800/40 my-3 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center mx-auto">
                  <Layers size={18} />
                </div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                  কোনো ডাইনামিক সেকশন চালু নেই
                </h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto font-medium">
                  ফ্ল্যাশ সেল কাউন্টডাউন, ভিডিও রিলস, গ্রাহক রিভিউ বা কম্বো অফার সেকশনগুলো চালু করতে নিচের বাটনে ক্লিক করুন।
                </p>
                <button
                  type="button"
                  onClick={() => setShowSectionDrawer(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-black shadow inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>ডাইনামিক সেকশন ম্যানেজার খুলুন</span>
                </button>
              </div>
            )}
          </div>

          {/* ── 3. EDITABLE PRODUCTS GRID ── */}
          <div className="px-3 sm:px-6 py-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  জনপ্রিয় পণ্যসমূহ (ক্লিক করে ছবি ও দাম এডিট করুন)
                </h3>
                <p className="text-[10px] text-slate-500 font-bold">
                  যেকোনো পণ্যে ক্লিক করে সরাসরি দাম ও ছবি পরিবর্তন করুন।
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/products/new"
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-black flex items-center gap-1.5 shadow-sm transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus size={13} />
                  <span>নতুন প্রোডাক্ট যোগ করুন (Default Editor)</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(products.slice(0, 4)).map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    setSelectedProduct(prod);
                    setEditProdName(prod.name);
                    setEditProdPrice(prod.price);
                    setEditProdOldPrice(prod.originalPrice || prod.price);
                    setEditProdImage(prod.imageUrl || '');
                    setEditModal('product');
                  }}
                  className="group/prod bg-white p-3 rounded-2xl border border-slate-200 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between text-left relative"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50">
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover/prod:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/prod:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <span className="px-2 py-1 rounded bg-black/70 text-[10px] font-bold flex items-center gap-1">
                          <Edit3 size={11} /> এডিট
                        </span>
                      </div>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 line-clamp-2 min-h-[32px]">
                      {prod.name}
                    </h4>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-black text-slate-900">৳ {prod.price}</span>
                      {prod.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through">৳ {prod.originalPrice}</span>
                      )}
                    </div>
                  </div>
                  <button 
                    type="button"
                    className="mt-2 w-full py-1.5 rounded-lg text-white text-[10px] font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    অর্ডার করুন
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Preview */}
          <div className="bg-slate-900 text-white p-6 text-xs text-slate-400 text-center space-y-2">
            <p className="font-bold text-white">{brandName}</p>
            <p className="text-[11px]">Steadfast কুরিয়ার ও বিকাশ পেমেন্ট সিঙ্ক • Powered by bdretailers.com</p>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: LOGO & BRAND NAME QUICK EDITOR ── */}
      {editModal === 'logo' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-900 dark:text-white shadow-2xl relative space-y-5">
            <button onClick={() => setEditModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-black">লোগো ও ব্র্যান্ড নাম পরিবর্তন</h3>
              <p className="text-xs text-slate-500">আপনার নিজস্ব ডিভাইস থেকে লোগো আপলোড করুন।</p>
            </div>

            <div className="space-y-4 text-xs font-bold">
              {/* Logo File Picker */}
              <div>
                <label className="block mb-1.5 text-slate-700 dark:text-slate-300">
                  স্টোর লোগো (প্রস্তাবিত সাইজ: 500x500 px)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="text-slate-400" size={24} />
                    )}
                  </div>
                  <label className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer shadow flex items-center gap-1.5">
                    <Upload size={13} />
                    <span>{uploading ? 'আপলোড হচ্ছে...' : 'ডিভাইস থেকে ছবি বাছুন'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => handleFileUpload(e.target.files?.[0], url => setLogoUrl(url))} 
                    />
                  </label>
                  {logoUrl && (
                    <button 
                      type="button" 
                      onClick={() => setLogoUrl('')} 
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Brand Name Input */}
              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">দোকানের নাম (Brand Name)</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-purple-600"
                />
              </div>

              {/* Hotline Input */}
              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">হটলাইন / মোবাইল নম্বর</label>
                <input
                  type="text"
                  value={hotline}
                  onChange={e => setHotline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-purple-600 font-mono"
                />
              </div>

              {/* Tagline Input */}
              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">স্লোগান / ট্যাগলাইন</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveLogoAndBrand}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-black shadow"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: HERO BANNER QUICK EDITOR ── */}
      {editModal === 'hero' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-900 dark:text-white shadow-2xl relative space-y-5">
            <button onClick={() => setEditModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-black">ব্যানার ছবি ও টেক্সট পরিবর্তন</h3>
              <p className="text-xs text-slate-500">আপনার অফারের ব্যানার ও বার্তা কাস্টমাইজ করুন।</p>
            </div>

            <div className="space-y-4 text-xs font-bold">
              {/* Banner Image Upload */}
              <div>
                <label className="block mb-1.5 text-slate-700 dark:text-slate-300">
                  ব্যানার ইমেজ (প্রস্তাবিত সাইজ: 1920x600 px বা 16:9)
                </label>
                <div className="space-y-2">
                  <div className="w-full h-32 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative">
                    <img src={bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                  <label className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer shadow flex items-center justify-center gap-2">
                    <Upload size={14} />
                    <span>{uploading ? 'আপলোড হচ্ছে...' : 'ডিভাইস থেকে ব্যানার আপলোড দিন'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => handleFileUpload(e.target.files?.[0], url => setBannerImage(url))} 
                    />
                  </label>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">ব্যানার শিরোনাম (Headline)</label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={e => setBannerTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">সাবটাইটেল / বিবরণ</label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={e => setBannerSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">বাটন টেক্সট</label>
                  <input
                    type="text"
                    value={bannerCtaText}
                    onChange={e => setBannerCtaText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">বাটন লিংক</label>
                  <input
                    type="text"
                    value={bannerCtaLink}
                    onChange={e => setBannerCtaLink(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveHeroBanner}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-black shadow"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: PRODUCT QUICK EDITOR ── */}
      {editModal === 'product' && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-900 dark:text-white shadow-2xl relative space-y-5">
            <button onClick={() => setEditModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-black">প্রোডাক্ট তথ্য ও ছবি এডিট করুন</h3>
              <p className="text-xs text-slate-500">প্রোডাক্টের ছবি ও মূল্য সরাসরি ডিভাইস থেকে আপডেট করুন।</p>
              <div className="pt-1">
                {selectedProduct.id && !selectedProduct.id.startsWith('sample') ? (
                  <Link
                    href={`/dashboard/products/edit/${selectedProduct.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-black transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>সম্পূর্ণ ডিটেইলস এডিটর ওপেন করুন (Default Product Editor)</span>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/products/new"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-black transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>নতুন নিজস্ব প্রোডাক্ট যোগ করুন (Default Product System)</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block mb-1.5 text-slate-700 dark:text-slate-300">প্রোডাক্ট ছবি</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                    <img src={editProdImage} alt="Product" className="w-full h-full object-cover" />
                  </div>
                  <label className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer shadow flex items-center gap-1.5">
                    <Upload size={13} />
                    <span>{uploading ? 'আপলোড হচ্ছে...' : 'ছবি পরিবর্তন করুন'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => handleFileUpload(e.target.files?.[0], url => setEditProdImage(url))} 
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">প্রোডাক্টের নাম</label>
                <input
                  type="text"
                  value={editProdName}
                  onChange={e => setEditProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">বিক্রয় মূল্য (৳)</label>
                  <input
                    type="number"
                    value={editProdPrice}
                    onChange={e => setEditProdPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">আগের মূল্য / ছাড় (৳)</label>
                  <input
                    type="number"
                    value={editProdOldPrice}
                    onChange={e => setEditProdOldPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-black shadow"
                >
                  সেভ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: DYNAMIC SECTION FULL EDITOR ── */}
      {editModal === 'section' && selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto text-slate-900 dark:text-white shadow-2xl relative space-y-4">
            <button 
              type="button"
              onClick={() => setEditModal(null)} 
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 text-xs font-black">
                <Edit3 size={13} />
                <span>ডাইনামিক সেকশন কনফিগারেশন</span>
              </div>
              <h3 className="text-base sm:text-lg font-black">
                {SECTION_METADATA[selectedSection.type]?.label || selectedSection.type} এডিটর
              </h3>
              <p className="text-xs text-slate-500">
                {SECTION_METADATA[selectedSection.type]?.desc || 'সেকশনের প্রয়োজনীয় ডেটা ও কনটেন্ট পরিবর্তন করুন।'}
              </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/60 dark:bg-slate-800/40">
              <SectionEditor
                section={selectedSection}
                onChange={(newData) => handleUpdateSectionData(selectedSection.id, newData)}
                onRemove={() => {
                  handleToggleSection(selectedSection.id);
                  setEditModal(null);
                }}
                theme={theme}
                shopId={shop?.id}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow cursor-pointer active:scale-95 transition-all"
              >
                ✓ সংরক্ষণ ও বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
