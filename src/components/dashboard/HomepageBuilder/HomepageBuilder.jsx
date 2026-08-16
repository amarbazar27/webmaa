'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getShop } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import SectionList from './SectionList';
import ThemeEditor from './ThemeEditor';
import HomepagePreview from './HomepagePreview';
import { Eye, Save, Globe, Palette, LayoutDashboard, Loader2, ArrowLeft, Smartphone, Monitor, Wand2 } from 'lucide-react';

const DEFAULT_SECTIONS = [
  { id: 'hero', type: 'hero_carousel', enabled: true, order: 0, data: { slides: [] } },
  { id: 'categories', type: 'category_scroller', enabled: true, order: 1, data: { items: [] } },
  { id: 'banner_row', type: 'banner_row', enabled: false, order: 2, data: { banners: [] } },
  { id: 'flash_sale', type: 'flash_sale', enabled: false, order: 3, data: { endTime: null, productIds: [] } },
  { id: 'product_grid', type: 'product_grid', enabled: true, order: 4, data: { title: 'আমাদের পণ্যসমূহ', tabs: ['trending', 'new', 'bestseller'], maxProducts: 12 } },
  { id: 'concern_grid', type: 'concern_grid', enabled: false, order: 5, data: { items: [] } },
  { id: 'video_reels', type: 'video_reels', enabled: false, order: 6, data: { urls: [] } },
  { id: 'brand_marquee', type: 'brand_marquee', enabled: false, order: 7, data: { brands: [] } },
  { id: 'bundle_section', type: 'bundle_section', enabled: false, order: 8, data: { bundles: [] } },
  { id: 'photo_reviews', type: 'photo_reviews', enabled: false, order: 9, data: { reviews: [] } },
  { id: 'instagram_feed', type: 'instagram_feed', enabled: false, order: 10, data: { embedUrl: '' } },
  { id: 'price_tier_store', type: 'price_tier_store', enabled: false, order: 11, data: { tiers: [299, 599, 999] } },
  { id: 'popup_banner', type: 'popup_banner', enabled: false, order: 12, data: { imageUrl: '', linkUrl: '', buttonText: '', delay: 3 } },
];

// ── Category Template Presets ──
const CATEGORY_TEMPLATES = {
  grocery: {
    label: '🛒 গ্রোসারি (Grocery)',
    desc: 'Chaldal, Shwapno স্টাইলে',
    theme: { primaryColor: '#059669', font: 'Hind Siliguri' },
    enabled: ['hero', 'categories', 'flash_sale', 'product_grid', 'bundle_section', 'price_tier_store'],
  },
  fashion: {
    label: '👗 লাক্সারি ফ্যাশন',
    desc: 'Sailor, Aarong স্টাইলে',
    theme: { primaryColor: '#1E293B', font: 'Playfair Display' },
    enabled: ['hero', 'categories', 'banner_row', 'product_grid', 'video_reels', 'instagram_feed', 'photo_reviews'],
  },
  tech: {
    label: '💻 টেক ও ইলেকট্রনিক্স',
    desc: 'Star Tech, Pickaboo স্টাইলে',
    theme: { primaryColor: '#2563EB', font: 'Inter' },
    enabled: ['hero', 'categories', 'flash_sale', 'product_grid', 'brand_marquee', 'banner_row', 'price_tier_store'],
  },
  beauty: {
    label: '💄 বিউটি ও কসমেটিক্স',
    desc: 'BanglaShoppers, Ogerio স্টাইলে',
    theme: { primaryColor: '#DB2777', font: 'Hind Siliguri' },
    enabled: ['hero', 'categories', 'concern_grid', 'flash_sale', 'product_grid', 'brand_marquee', 'bundle_section', 'photo_reviews', 'popup_banner'],
  },
};

const DEFAULT_THEME = {
  primaryColor: '#6D28D9',
  font: 'Hind Siliguri',
  language: 'bn',
};

export default function HomepageBuilder() {
  const { user, userData, activeShopId } = useAuth();
  const router = useRouter();
  const [shop, setShop] = useState(null);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'theme'
  const [previewMode, setPreviewMode] = useState('mobile'); // 'mobile' | 'desktop'
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (activeShopId) {
      getShop(activeShopId).then(s => {
        setShop(s);
        // Set default theme colors from shop
        if (s) {
          setTheme(prev => ({
            ...prev,
            primaryColor: s.primaryColor || s.themeColor || prev.primaryColor,
          }));
        }
      });
    }
  }, [activeShopId]);

  useEffect(() => {
    if (!activeShopId) return;
    // Load draft config
    fetch(`/api/homepage-config?shopId=${activeShopId}&draft=true`)
      .then(r => r.json())
      .then(config => {
        if (config.sections?.length) setSections(config.sections);
        if (config.theme) setTheme(config.theme);
      })
      .catch(() => {});
  }, [activeShopId]);

  const getAuthHeaders = useCallback(async () => {
    const token = await user?.getIdToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, [user]);

  const handleSaveDraft = async () => {
    if (!activeShopId) return;
    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/homepage-config', {
        method: 'POST',
        headers,
        body: JSON.stringify({ shopId: activeShopId, sections, theme }),
      });
      if (!res.ok) throw new Error('Save failed');
      setHasChanges(false);
      setLastSaved(new Date());
      toast.success('Draft সেভ হয়েছে!');
    } catch {
      toast.error('সেভ করা যায়নি, আবার চেষ্টা করুন।');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!activeShopId) return;
    setIsPublishing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/homepage-config', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ shopId: activeShopId, sections, theme }),
      });
      if (!res.ok) throw new Error('Publish failed');
      setHasChanges(false);
      setLastSaved(new Date());
      toast.success('✅ হোমপেজ পাবলিশ হয়েছে! পরিবর্তন এখন লাইভ।');
    } catch {
      toast.error('পাবলিশ করা যায়নি।');
    } finally {
      setIsPublishing(false);
    }
  };

  const updateSections = (newSections) => {
    setSections(newSections);
    setHasChanges(true);
  };

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-color)' }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-none">Homepage Builder</h1>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString('bn-BD')}` : 'পরিবর্তন করুন এবং Publish করুন'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Preview Mode Toggle */}
            <div className="hidden md:flex items-center bg-slate-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Smartphone size={14} />
              </button>
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Monitor size={14} />
              </button>
            </div>

            <button
              onClick={handleSaveDraft}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Draft সেভ
            </button>

            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-purple-600 hover:bg-purple-700 transition-all disabled:opacity-60 shadow-lg shadow-purple-500/20"
            >
              {isPublishing ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto flex gap-0 md:gap-6 p-0 md:p-4">
        {/* Left Panel — Controls */}
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
          {/* Tab Toggle */}
          <div className="flex bg-slate-100 rounded-2xl p-1 m-4 md:m-0 md:mb-4">
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'sections' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard size={13} /> Sections
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'theme' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Palette size={13} /> Theme
            </button>
          </div>

          {/* Category Template Quick Setup */}
          <div className="mx-4 md:mx-0 mb-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-1">⚡ টেমপ্লেট থেকে শুরু করুন</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {Object.entries(CATEGORY_TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => {
                    const newSections = DEFAULT_SECTIONS.map(s => ({
                      ...s,
                      enabled: tpl.enabled.includes(s.id),
                    }));
                    // Add popup_banner if not in DEFAULT
                    if (tpl.enabled.includes('popup_banner') && !newSections.find(s => s.id === 'popup_banner')) {
                      newSections.push({ id: 'popup_banner', type: 'popup_banner', enabled: true, order: 12, data: { imageUrl: '', linkUrl: '', delay: 3 } });
                    }
                    setSections(newSections);
                    setTheme(prev => ({ ...prev, ...tpl.theme }));
                    setHasChanges(true);
                    toast.success(`${tpl.label} টেমপ্লেট সেট হয়েছে!`);
                  }}
                  className="shrink-0 px-3 py-2 bg-white border border-slate-200 hover:border-purple-300 rounded-xl text-left transition-all hover:shadow-md group"
                >
                  <span className="text-xs font-black text-slate-700 block whitespace-nowrap">{tpl.label}</span>
                  <span className="text-[9px] text-slate-400 font-medium block">{tpl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mx-4 md:mx-0">
            {activeTab === 'sections' ? (
              <SectionList sections={sections} onChange={updateSections} theme={theme} />
            ) : (
              <ThemeEditor theme={theme} onChange={updateTheme} shop={shop} />
            )}
          </div>
        </div>

        {/* Right Panel — Live Preview */}
        <div className="hidden md:flex flex-1 flex-col">
          <HomepagePreview
            sections={sections}
            theme={theme}
            shop={shop}
            mode={previewMode}
          />
        </div>
      </div>
    </div>
  );
}
