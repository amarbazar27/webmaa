'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  Smartphone, Monitor, Eye, X, Maximize2, Minimize2, 
  RotateCcw, Sparkles, ShoppingBag, Search, Menu, Bell
} from 'lucide-react';
import SectionRenderer from '@/components/storefront/sections/SectionRenderer';
import StorefrontHeader from '@/components/storefront/StorefrontHeader';
import StorefrontFooter from '@/components/storefront/StorefrontFooter';
import { DEMO_PRODUCTS } from '@/lib/homepageDemoData';

export default function HomepagePreview({
  sections = [],
  theme = {},
  headerConfig = {},
  footerConfig = {},
  shop = null,
  mode = 'mobile', // 'mobile' | 'desktop'
  onModeChange,
  products = [],
  highlightId = null,
}) {
  const [mobileWidth, setMobileWidth] = useState('390px'); // '360px' | '390px' | '430px'
  const [desktopWidth, setDesktopWidth] = useState('100%'); // '1280px' | '1440px' | '100%'
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [fullPreviewMode, setFullPreviewMode] = useState(mode);
  const [previewPopupOpen, setPreviewPopupOpen] = useState(false);
  const [cartCount, setCartCount] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');

  const previewContainerRef = useRef(null);

  const isMobile = mode === 'mobile';
  const primary = theme?.primaryColor || shop?.primaryColor || '#6D28D9';
  const sorted = [...(sections || [])].sort((a, b) => a.order - b.order);
  const enabledSections = sorted.filter(s => s.enabled);
  const popupSection = sorted.find(s => s.type === 'popup_banner' && s.enabled);

  // Auto-scroll to highlighted section
  useEffect(() => {
    if (highlightId) {
      const el = document.getElementById(`preview-sec-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId]);

  // When popup is enabled, open popup preview
  useEffect(() => {
    if (popupSection) {
      setPreviewPopupOpen(true);
    } else {
      setPreviewPopupOpen(false);
    }
  }, [popupSection?.id, popupSection?.enabled]);

  const previewProducts = (products && products.length > 0) ? products : DEMO_PRODUCTS;

  const previewCallbacks = {
    onAddToCart: () => setCartCount(c => c + 1),
    onProductClick: () => {},
    onCategoryClick: (catName) => setSearchQuery(catName),
    onConcernClick: () => {},
    onTierClick: () => {},
    onAddBundle: () => setCartCount(c => c + 1),
  };

  const themeVars = {
    primaryColor: primary,
    '--sp-primary': primary,
    '--sp-header-bg': theme?.headerBg || '#ffffff',
    '--sp-header-text': theme?.headerText || '#0f172a',
    font: theme?.font || 'Hind Siliguri',
  };

  // Demo categories for header & footer navigation
  const demoCategories = [
    { id: 'cat-1', name: 'নতুন কালেকশন' },
    { id: 'cat-2', name: 'জনপ্রিয় ডিলস' },
    { id: 'cat-3', name: 'ফ্যাশন & ক্লথিং' },
    { id: 'cat-4', name: 'গ্রোসারি বাজার' },
    { id: 'cat-5', name: 'গেজেটস & টেক' },
    { id: 'cat-6', name: 'বিউটি কেয়ার' },
  ];

  const renderStorefrontContent = (isModal = false) => (
    <div 
      className="w-full bg-slate-50 relative min-h-full flex flex-col justify-between"
      style={{ fontFamily: theme?.font ? `"${theme.font}", sans-serif` : 'inherit' }}
    >
      {/* ── 1. Unified Shared Storefront Header ── */}
      <StorefrontHeader
        shop={shop}
        headerConfig={headerConfig}
        themeVars={themeVars}
        categories={demoCategories}
        cartCount={cartCount}
        onOpenCart={() => {}}
        onOpenCategories={() => {}}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        isPreview={true}
      />

      {/* ── 2. Rendered Live Sections ── */}
      <div className="space-y-2 pb-8 flex-1">
        {enabledSections.map((section) => {
          const isHighlighted = highlightId === section.id;
          const sectionToRender = section.type === 'basic_storefront' ? {
            ...section,
            data: {
              shopName: shop?.shopName,
              slogan: shop?.slogan,
              description: shop?.bannerDescription || shop?.description,
              shopInitial: shop?.shopName?.[0] || '🏪',
              ...section.data,
            }
          } : section;

          return (
            <div
              key={section.id}
              id={`preview-sec-${section.id}`}
              className={`relative transition-all duration-300 ${
                isHighlighted ? 'ring-4 ring-purple-500 rounded-3xl shadow-xl z-20' : ''
              }`}
            >
              <SectionRenderer
                section={sectionToRender}
                products={previewProducts}
                themeVars={themeVars}
                callbacks={previewCallbacks}
                isPreview={true}
              />
            </div>
          );
        })}

        {/* In-device simulated Popup Banner */}
        {popupSection && previewPopupOpen && (
          <div className="absolute inset-0 z-50 pointer-events-auto">
            <SectionRenderer
              section={popupSection}
              products={previewProducts}
              themeVars={themeVars}
              callbacks={previewCallbacks}
              isPreview={true}
              onDismiss={() => setPreviewPopupOpen(false)}
            />
          </div>
        )}

        {/* Empty State */}
        {enabledSections.length === 0 && (
          <div className="py-20 px-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles size={28} />
            </div>
            <h3 className="text-base font-black text-slate-800">কোনো সেকশন সক্রিয় নেই</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
              বাম পাশের প্যানেল থেকে আপনার পছন্দের সেকশনগুলো অন (Toggle ON) করুন।
            </p>
          </div>
        )}
      </div>

      {/* ── 3. Unified Shared Storefront Footer with Mandatory BDRetailers Branding ── */}
      <StorefrontFooter
        shop={shop}
        footerConfig={footerConfig}
        themeVars={themeVars}
        categories={demoCategories}
        onCategoryClick={(catName) => setSearchQuery(catName)}
        isPreview={true}
      />
    </div>
  );

  return (
    <div className="flex flex-col w-full">
      {/* Top Preview Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        {/* Device Switcher & Size Options */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => onModeChange?.('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                isMobile ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Smartphone size={14} />
              <span>মোবাইল</span>
            </button>
            <button
              onClick={() => onModeChange?.('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                !isMobile ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Monitor size={14} />
              <span>ডেস্কটপ</span>
            </button>
          </div>

          {/* Specific Viewport Widths */}
          {isMobile ? (
            <div className="hidden sm:flex items-center gap-1 bg-slate-100/70 rounded-xl p-1">
              {['360px', '390px', '430px'].map(w => (
                <button
                  key={w}
                  onClick={() => setMobileWidth(w)}
                  className={`px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                    mobileWidth === w ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1 bg-slate-100/70 rounded-xl p-1">
              {[
                { label: 'Fluid', val: '100%' },
                { label: '1280px', val: '1280px' },
                { label: '1440px', val: '1440px' },
              ].map(w => (
                <button
                  key={w.val}
                  onClick={() => setDesktopWidth(w.val)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                    desktopWidth === w.val ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons (Popup Preview, Fullscreen Preview) */}
        <div className="flex items-center gap-2">
          {popupSection && (
            <button
              onClick={() => setPreviewPopupOpen(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                previewPopupOpen 
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                  : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Sparkles size={13} />
              <span>{previewPopupOpen ? 'পপআপ বন্ধ' : 'পপআপ দেখুন'}</span>
            </button>
          )}

          <button
            onClick={() => {
              setFullPreviewMode(mode);
              setShowFullPreview(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-black transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Maximize2 size={13} />
            <span>Open Full Preview</span>
          </button>
        </div>
      </div>

      {/* Main Simulator Viewport Container */}
      <div className="flex-1 flex justify-center items-start overflow-hidden py-2">
        {isMobile ? (
          /* Phone Chassis Mockup */
          <div
            style={{ width: mobileWidth, maxWidth: '100%' }}
            className="relative shadow-2xl rounded-[3rem] overflow-hidden border-[10px] border-slate-900 bg-slate-900 transition-all duration-300 flex flex-col"
          >
            {/* Phone Speaker & Dynamic Island Notch */}
            <div className="h-6 bg-slate-900 w-full flex items-center justify-center relative z-40">
              <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-end px-2">
                <div className="w-2 h-2 rounded-full bg-blue-900/60" />
              </div>
            </div>

            {/* Scrollable Screen */}
            <div
              ref={previewContainerRef}
              className="bg-white overflow-y-auto overflow-x-hidden relative"
              style={{ maxHeight: '78vh', minHeight: '620px' }}
            >
              {renderStorefrontContent(false)}
            </div>

            {/* Home indicator bar */}
            <div className="h-4 bg-slate-900 w-full flex items-center justify-center">
              <div className="w-28 h-1 bg-slate-700 rounded-full" />
            </div>
          </div>
        ) : (
          /* Desktop Browser Mockup Frame */
          <div
            style={{ width: desktopWidth, maxWidth: '100%' }}
            className="w-full shadow-lg rounded-2xl overflow-hidden border border-slate-200 bg-white transition-all duration-300 flex flex-col"
          >
            {/* Browser Top Navigation Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 max-w-md mx-auto bg-white rounded-xl px-3 py-1 text-xs text-slate-500 font-bold border border-slate-200/80 flex items-center justify-center gap-1">
                <span className="text-emerald-600 font-black">🔒</span>
                <span>https://{shop?.customDomain || `${shop?.shopSlug || 'your-shop'}.bdretailers.com`}</span>
              </div>
            </div>

            {/* Scrollable Desktop Canvas */}
            <div
              ref={previewContainerRef}
              className="bg-white overflow-y-auto overflow-x-hidden relative"
              style={{ maxHeight: '78vh', minHeight: '620px' }}
            >
              {renderStorefrontContent(false)}
            </div>
          </div>
        )}
      </div>

      {/* ── Full Preview Modal ── */}
      {showFullPreview && (
        <div className="fixed inset-0 z-[9999999] bg-black/85 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          {/* Modal Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                BDRetailers Full Storefront Simulator (Unpublished Draft)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold">
                100% Identical Store Preview
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Device Toggle */}
              <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setFullPreviewMode('mobile')}
                  className={`p-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    fullPreviewMode === 'mobile' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={14} className="inline mr-1" /> Mobile
                </button>
                <button
                  onClick={() => setFullPreviewMode('desktop')}
                  className={`p-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    fullPreviewMode === 'desktop' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor size={14} className="inline mr-1" /> Desktop
                </button>
              </div>

              <button
                onClick={() => setShowFullPreview(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body Canvas */}
          <div className="flex-1 overflow-y-auto flex items-start justify-center p-4 sm:p-6">
            <div
              className={`transition-all duration-300 ${
                fullPreviewMode === 'mobile'
                  ? 'w-[390px] shadow-2xl rounded-[3rem] overflow-hidden border-[10px] border-slate-900 bg-white my-auto'
                  : 'w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden bg-white border border-slate-200 my-auto'
              }`}
            >
              {renderStorefrontContent(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
