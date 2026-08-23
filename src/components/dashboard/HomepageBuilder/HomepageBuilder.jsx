'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getShop, getProducts } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import SectionList from './SectionList';
import ThemeEditor from './ThemeEditor';
import HeaderFooterEditor from './HeaderFooterEditor';
import HomepagePreview from './HomepagePreview';
import { Eye, Save, Globe, Palette, LayoutDashboard, Loader2, ArrowLeft, Smartphone, Monitor, Sparkles, Sliders } from 'lucide-react';
import { DEMO_PRODUCTS } from '@/lib/homepageDemoData';

const DEFAULT_SECTIONS = [
  { id: 'basic_storefront', type: 'basic_storefront', enabled: true, order: 0, isPinned: true, data: { showDesc: true, showSearch: true, showCategories: true, showProducts: true } },
  { id: 'hero', type: 'hero_carousel', enabled: true, order: 1, data: { slides: [] } },
  { id: 'trust_strip', type: 'trust_strip', enabled: true, order: 2, data: {} },
  { id: 'categories', type: 'category_scroller', enabled: true, order: 3, data: { items: [] } },
  { id: 'split_showcase', type: 'split_showcase', enabled: true, order: 4, data: {} },
  { id: 'flash_sale', type: 'flash_sale', enabled: true, order: 5, data: { endTime: null, productIds: [] } },
  { id: 'product_grid', type: 'product_grid', enabled: true, order: 6, data: { title: 'আমাদের জনপ্রিয় পণ্যসমূহ', tabs: ['all', 'trending', 'bestseller'], maxProducts: 12 } },
  { id: 'shop_the_look', type: 'shop_the_look', enabled: false, order: 7, data: {} },
  { id: 'bento_mosaic', type: 'bento_mosaic', enabled: false, order: 8, data: {} },
  { id: 'banner_row', type: 'banner_row', enabled: false, order: 9, data: { banners: [] } },
  { id: 'product_spotlight', type: 'product_spotlight', enabled: false, order: 10, data: {} },
  { id: 'mood_board', type: 'mood_board', enabled: false, order: 11, data: {} },
  { id: 'deal_of_the_day', type: 'deal_of_the_day', enabled: false, order: 12, data: {} },
  { id: 'video_reels', type: 'video_reels', enabled: false, order: 13, data: { urls: [] } },
  { id: 'shoppable_video', type: 'shoppable_video', enabled: false, order: 14, data: {} },
  { id: 'bundle_section', type: 'bundle_section', enabled: false, order: 15, data: { bundles: [] } },
  { id: 'before_after', type: 'before_after', enabled: false, order: 16, data: {} },
  { id: 'photo_reviews', type: 'photo_reviews', enabled: true, order: 17, data: { reviews: [] } },
  { id: 'customer_ugc', type: 'customer_ugc', enabled: false, order: 18, data: {} },
  { id: 'brand_marquee', type: 'brand_marquee', enabled: false, order: 19, data: { brands: [] } },
  { id: 'price_ladder', type: 'price_ladder', enabled: false, order: 20, data: {} },
  { id: 'price_tier_store', type: 'price_tier_store', enabled: false, order: 21, data: { tiers: [299, 599, 999] } },
  { id: 'editorial_story', type: 'editorial_story', enabled: false, order: 22, data: {} },
  { id: 'lookbook', type: 'lookbook', enabled: false, order: 23, data: {} },
  { id: 'scroll_story', type: 'scroll_story', enabled: false, order: 24, data: {} },
  { id: 'tabbed_collection', type: 'tabbed_collection', enabled: false, order: 25, data: {} },
  { id: 'concern_grid', type: 'concern_grid', enabled: false, order: 26, data: { items: [] } },
  { id: 'instagram_feed', type: 'instagram_feed', enabled: false, order: 27, data: { embedUrl: '' } },
  { id: 'popup_banner', type: 'popup_banner', enabled: false, order: 28, data: { imageUrl: '', linkUrl: '', buttonText: '', delay: 2 } },
];

// ── Category Template Presets ──
const CATEGORY_TEMPLATES = {
  grocery: {
    label: '🛒 গ্রোসারি ও ডেইলি ফ্রেশ',
    desc: 'Chaldal, Shwapno ও ফ্রেশ মার্কেট স্টাইলে',
    theme: { primaryColor: '#059669', font: 'Hind Siliguri' },
    enabled: ['basic_storefront', 'hero', 'trust_strip', 'categories', 'flash_sale', 'product_grid', 'bundle_section', 'price_ladder', 'price_tier_store', 'photo_reviews'],
  },
  fashion: {
    label: '👗 লাক্সারি ফ্যাশন & লাইফস্টাইল',
    desc: 'IKEA, Sailor ও Aarong স্টাইলে',
    theme: { primaryColor: '#7C3AED', font: 'Playfair Display' },
    enabled: ['basic_storefront', 'hero', 'split_showcase', 'categories', 'bento_mosaic', 'product_grid', 'shop_the_look', 'video_reels', 'lookbook', 'photo_reviews', 'instagram_feed'],
  },
  tech: {
    label: '💻 টেক, গ্যাজেটস & ইলেকট্রনিক্স',
    desc: 'Star Tech, Apple ও Pickaboo স্টাইলে',
    theme: { primaryColor: '#2563EB', font: 'Inter' },
    enabled: ['basic_storefront', 'hero', 'trust_strip', 'split_showcase', 'deal_of_the_day', 'product_grid', 'product_spotlight', 'brand_marquee', 'photo_reviews'],
  },
  beauty: {
    label: '💄 বিউটি, স্কিনকেয়ার & কসমেটিক্স',
    desc: 'Sephora, BanglaShoppers স্টাইলে',
    theme: { primaryColor: '#DB2777', font: 'Hind Siliguri' },
    enabled: ['basic_storefront', 'hero', 'split_showcase', 'categories', 'before_after', 'flash_sale', 'product_grid', 'customer_ugc', 'shoppable_video', 'popup_banner'],
  },
};

const DEFAULT_THEME = {
  primaryColor: '#6D28D9',
  font: 'Hind Siliguri',
  language: 'bn',
};

const DEFAULT_HEADER = {
  style: 'classic',
  showSearch: true,
  showNotifications: true,
  showThemeToggle: true,
  showDashboardBtn: true,
  showFaqBtn: true,
  buttonStyle: 'contrast_pill',
};

const DEFAULT_FOOTER = {
  style: 'modern_columns',
  showCategories: true,
  showContact: true,
  showSocials: true,
  showCopyright: true,
  showPrivacy: true,
  customTagline: '',
};

export default function HomepageBuilder() {
  const { user, userData, activeShopId } = useAuth();
  const router = useRouter();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [headerConfig, setHeaderConfig] = useState(DEFAULT_HEADER);
  const [footerConfig, setFooterConfig] = useState(DEFAULT_FOOTER);
  const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'header_footer' | 'template' | 'theme'
  const [previewMode, setPreviewMode] = useState('mobile'); // 'mobile' | 'desktop'
  const [highlightSectionId, setHighlightSectionId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (activeShopId) {
      getShop(activeShopId).then(s => {
        setShop(s);
        if (s) {
          setTheme(prev => ({
            ...prev,
            primaryColor: s.primaryColor || s.themeColor || prev.primaryColor,
          }));
        }
      });

      getProducts(activeShopId).then(prods => {
        if (prods && prods.length) {
          setProducts(prods);
        } else {
          setProducts(DEMO_PRODUCTS);
        }
      }).catch(() => {
        setProducts(DEMO_PRODUCTS);
      });
    }
  }, [activeShopId]);

  useEffect(() => {
    if (!activeShopId) return;
    // Load draft config
    fetch(`/api/homepage-config?shopId=${activeShopId}&draft=true`)
      .then(r => r.json())
      .then(config => {
        if (config.sections?.length) {
          // Merge existing saved sections with any new default section types not present yet
          const existingTypeMap = new Map(config.sections.map(s => [s.type, s]));
          let merged = config.sections.map((s, idx) => ({ ...s, order: idx }));

          // Ensure basic_storefront is present
          if (!existingTypeMap.has('basic_storefront')) {
            merged = [
              { id: 'basic_storefront', type: 'basic_storefront', enabled: true, order: 0, isPinned: true, data: { showDesc: true, showSearch: true, showCategories: true, showProducts: true } },
              ...merged.map((s, idx) => ({ ...s, order: idx + 1 }))
            ];
          }
          
          DEFAULT_SECTIONS.forEach(defSec => {
            if (defSec.type !== 'basic_storefront' && !existingTypeMap.has(defSec.type)) {
              merged.push({ ...defSec, order: merged.length, enabled: false });
            }
          });
          setSections(merged);
        }
        if (config.theme) setTheme(config.theme);
        if (config.header) setHeaderConfig(config.header);
        if (config.footer) setFooterConfig(config.footer);
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
        body: JSON.stringify({ 
          shopId: activeShopId, 
          sections, 
          theme, 
          header: headerConfig, 
          footer: footerConfig 
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setHasChanges(false);
      setLastSaved(new Date());
      toast.success('Draft সফলভাবে সেভ হয়েছে!');
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
        body: JSON.stringify({ 
          shopId: activeShopId, 
          sections, 
          theme, 
          header: headerConfig, 
          footer: footerConfig 
        }),
      });
      if (!res.ok) throw new Error('Publish failed');
      setHasChanges(false);
      setLastSaved(new Date());
      toast.success('✅ হোমপেজ পাবলিশ হয়েছে! পরিবর্তন এখন লাইভ ওয়েবসাইটে দেখা যাবে।');
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

  const handleFocusSection = (sectionId) => {
    setHighlightSectionId(sectionId);
    setTimeout(() => {
      setHighlightSectionId(null);
    }, 2500);
  };

  const applyTemplate = (key, tpl) => {
    const newSections = DEFAULT_SECTIONS.map(s => ({
      ...s,
      enabled: tpl.enabled.includes(s.id) || tpl.enabled.includes(s.type),
    }));
    setSections(newSections);
    setTheme(prev => ({ ...prev, ...tpl.theme }));
    setHasChanges(true);
    toast.success(`${tpl.label} টেমপ্লেট অ্যাপ্লাই হয়েছে!`);
  };

  const TEMPLATE_GRADIENTS = {
    grocery: 'from-emerald-500 to-green-600',
    fashion: 'from-purple-500 to-pink-500',
    tech: 'from-blue-500 to-cyan-500',
    beauty: 'from-rose-500 to-pink-600',
  };

  return (
    <div className="min-h-screen bg-slate-100/60">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-[1700px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="p-2 rounded-2xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-slate-900 leading-none">BDRetailers Homepage Builder</h1>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black uppercase">
                  Pro Engine
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                {lastSaved ? `সর্বশেষ সেভ: ${lastSaved.toLocaleTimeString('bn-BD')}` : 'ভিজ্যুয়ালি সাজান ও সরাসরি লাইভ প্রিভিউ দেখুন'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Draft সেভ
            </button>

            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white bg-purple-600 hover:bg-purple-700 transition-all disabled:opacity-60 shadow-lg shadow-purple-500/25 cursor-pointer active:scale-95"
            >
              {isPublishing ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
              Publish Live
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-[1700px] mx-auto flex gap-0 lg:gap-6 p-2 sm:p-4">
        {/* Left Panel — Controls & Section List */}
        <div className="w-full lg:w-96 xl:w-[420px] flex-shrink-0">
          {/* Tab Navigation */}
          <div className="flex bg-slate-200/70 rounded-2xl p-1 mb-4 shadow-2xs">
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'sections' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard size={13} /> Sections
            </button>
            <button
              onClick={() => setActiveTab('header_footer')}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'header_footer' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Sliders size={13} /> Header/Footer
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'template' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Sparkles size={13} /> Templates
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'theme' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Palette size={13} /> Theme
            </button>
          </div>

          {/* Template Tab Content */}
          {activeTab === 'template' && (
            <div className="space-y-3">
              <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">
                  ⚡ প্রিমিয়াম টেমপ্লেট নির্বাচন করুন
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(CATEGORY_TEMPLATES).map(([key, tpl]) => (
                    <div
                      key={key}
                      className={`rounded-2xl bg-gradient-to-br ${TEMPLATE_GRADIENTS[key]} p-4 text-white shadow-md relative overflow-hidden group`}
                    >
                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black leading-snug">{tpl.label}</p>
                          <p className="text-[11px] font-medium opacity-85 mt-0.5 leading-tight">{tpl.desc}</p>
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {tpl.enabled.slice(0, 5).map(sId => (
                              <span key={sId} className="px-2 py-0.5 bg-white/20 rounded-md text-[9px] font-black uppercase tracking-wide">
                                {sId.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {tpl.enabled.length > 5 && (
                              <span className="px-2 py-0.5 bg-white/20 rounded-md text-[9px] font-black">
                                +{tpl.enabled.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => applyTemplate(key, tpl)}
                          className="shrink-0 mt-0.5 px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-black transition-all active:scale-95 hover:bg-white/90 shadow cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sections / Header-Footer / Theme Panel */}
          {activeTab !== 'template' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
              {activeTab === 'sections' && (
                <SectionList 
                  sections={sections} 
                  onChange={updateSections} 
                  theme={theme} 
                  shopId={activeShopId} 
                  onFocusSection={handleFocusSection}
                />
              )}
              {activeTab === 'header_footer' && (
                <HeaderFooterEditor
                  headerConfig={headerConfig}
                  footerConfig={footerConfig}
                  onHeaderChange={(newH) => { setHeaderConfig(newH); setHasChanges(true); }}
                  onFooterChange={(newF) => { setFooterConfig(newF); setHasChanges(true); }}
                  shop={shop}
                  theme={theme}
                />
              )}
              {activeTab === 'theme' && (
                <ThemeEditor theme={theme} onChange={updateTheme} shop={shop} />
              )}
            </div>
          )}
        </div>

        {/* Right Panel — Live Preview Simulator */}
        <div className="hidden lg:flex flex-1 flex-col">
          <HomepagePreview
            sections={sections}
            theme={theme}
            headerConfig={headerConfig}
            footerConfig={footerConfig}
            shop={shop}
            mode={previewMode}
            onModeChange={setPreviewMode}
            products={products}
            highlightId={highlightSectionId}
          />
        </div>
      </div>
    </div>
  );
}
