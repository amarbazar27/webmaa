'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  Smartphone, Monitor, Eye, X, Maximize2, Minimize2, 
  RotateCcw, Sparkles, ShoppingBag, Search, Menu, Bell
} from 'lucide-react';
import SectionRenderer from '@/components/storefront/sections/SectionRenderer';
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

  const previewContainerRef = useRef(null);
  const fullPreviewContainerRef = useRef(null);

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
    onCategoryClick: () => {},
    onConcernClick: () => {},
    onTierClick: () => {},
    onAddBundle: () => setCartCount(c => c + 1),
  };

  const themeVars = {
    primaryColor: primary,
    font: theme?.font || 'Hind Siliguri',
  };

  const hStyle = headerConfig?.style || 'classic';
  const fStyle = footerConfig?.style || 'modern_columns';
  const btnStyle = headerConfig?.buttonStyle || 'contrast_pill';

  const headerBtnClass = btnStyle === 'white_pill'
    ? 'p-2 rounded-xl bg-white text-slate-800 shadow-sm border border-slate-200'
    : 'p-2 rounded-xl bg-slate-100/90 text-slate-700 hover:bg-slate-200 shadow-2xs';

  const renderStorefrontContent = (isModal = false) => (
    <div className="w-full bg-slate-50 relative min-h-full">
      {/* Simulated Storefront Top Header */}
      <header className={`sticky top-0 z-30 transition-all ${
        hStyle === 'floating'
          ? 'mx-2 my-2 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 px-3.5 py-2.5 shadow-md'
          : hStyle === 'dark_contrast'
          ? 'bg-slate-950 text-white border-b border-slate-800 px-4 py-3 shadow-lg'
          : 'bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-xs'
      }`}>
        <div className="flex items-center justify-between gap-2 max-w-[1400px] mx-auto">
          {/* Logo & Brand Name */}
          <div className={`flex items-center gap-2.5 ${hStyle === 'centered' ? 'order-2 mx-auto' : ''}`}>
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt="Logo" className="w-8 h-8 rounded-xl object-contain" />
            ) : (
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm"
                style={{ background: primary }}
              >
                {shop?.shopName?.[0] || 'B'}
              </div>
            )}
            <div>
              <span className={`text-sm font-black leading-none block ${hStyle === 'dark_contrast' ? 'text-white' : 'text-slate-900'}`}>
                {shop?.shopName || 'BDRetailers Store'}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">● Online</span>
            </div>
          </div>

          {/* Search Simulation */}
          {headerConfig.showSearch !== false && (
            <div className={`hidden sm:flex flex-1 max-w-xs mx-3 ${hStyle === 'centered' ? 'order-1 max-w-[120px]' : ''}`}>
              <div className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                hStyle === 'dark_contrast' ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200/60 text-slate-400'
              }`}>
                <Search size={13} />
                <span className="truncate">পণ্য খুঁজুন...</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`flex items-center gap-1.5 ${hStyle === 'centered' ? 'order-3' : ''}`}>
            {headerConfig.showNotifications !== false && (
              <div className={headerBtnClass} title="Notifications">
                <Bell size={15} />
              </div>
            )}

            {headerConfig.showFaqBtn !== false && (
              <div className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 text-white text-[10px] font-black shadow-xs">
                FAQ
              </div>
            )}

            <button 
              className={`relative ${headerBtnClass}`}
              aria-label="Cart"
            >
              <ShoppingBag size={15} />
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center shadow"
                  style={{ background: primary }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Rendered Live Sections */}
      <div className="space-y-2 pb-12">
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

        {/* Storefront Dynamic Footer Preview */}
        {fStyle === 'minimal_bar' ? (
          <footer className="mt-8 bg-slate-900 text-white p-4 text-center">
            <p className="text-xs font-black">© {new Date().getFullYear()} {shop?.shopName || 'Store'} — সর্বস্বত্ত্ব সংরক্ষিত।</p>
          </footer>
        ) : fStyle === 'centered_brand' ? (
          <footer className="mt-8 bg-white border-t border-slate-100 p-6 text-center space-y-2">
            <h3 className="text-base font-black text-slate-900">{shop?.shopName || 'Store'}</h3>
            <p className="text-xs text-slate-500 italic">"{footerConfig.customTagline || shop?.slogan || 'বিশ্বস্ত অনলাইন সেবা'}"</p>
            <p className="text-[10px] text-slate-400">© {new Date().getFullYear()} All Rights Reserved</p>
          </footer>
        ) : (
          <footer className={`mt-8 rounded-t-3xl p-6 sm:p-8 ${
            fStyle === 'dark_luxury' ? 'bg-slate-950 text-white' : 'bg-slate-900 text-white'
          }`}>
            <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
              <div>
                <p className="text-sm font-black">{shop?.shopName || 'BDRetailers Store'}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {footerConfig.customTagline || shop?.slogan || 'বিশ্বস্ত ও নির্ভরযোগ্য অনলাইন কেনাকাটা'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                <span>Powered by</span>
                <span className="text-white font-black">BDRetailers.com</span>
              </div>
            </div>
          </footer>
        )}
      </div>
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
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
                Full Storefront Simulator (Unpublished Draft)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold">
                Live Interactive Mode
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Device Toggle */}
              <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setFullPreviewMode('mobile')}
                  className={`p-1.5 px-3 rounded-lg text-xs font-black transition-all ${
                    fullPreviewMode === 'mobile' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={14} className="inline mr-1" /> Mobile
                </button>
                <button
                  onClick={() => setFullPreviewMode('desktop')}
                  className={`p-1.5 px-3 rounded-lg text-xs font-black transition-all ${
                    fullPreviewMode === 'desktop' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor size={14} className="inline mr-1" /> Desktop
                </button>
              </div>

              <button
                onClick={() => setShowFullPreview(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
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
