'use client';
import { useState } from 'react';
import { 
  Layout, Sparkles, Search, Bell, Moon, Sun, 
  HelpCircle, Settings, Phone, Mail, Share2, Eye,
  Shield, Check, Sliders, Palette, Zap, MapPin,
  Megaphone, Heart, ShoppingBag, Lock
} from 'lucide-react';
import { HEADER_PRESETS } from '@/components/storefront/StorefrontHeader';
import { FOOTER_PRESETS } from '@/components/storefront/StorefrontFooter';

export const ATTRIBUTION_OPTIONS = [
  {
    id: 'option_a',
    label: 'Option A — "Powered by BDRetailers"',
    sub: 'গ্লোয়িং প্লাটফর্ম ব্যাজ ও স্মার্ট লিংক',
    preview: '⚡ Powered by BDRetailers • Launch your online store'
  },
  {
    id: 'option_b',
    label: 'Option B — "Built with BDRetailers"',
    sub: 'প্রফেশনাল স্টোর বিল্ডার স্টাইল',
    preview: '⚡ Built with BDRetailers • Create your own store'
  },
  {
    id: 'option_c',
    label: 'Option C — "এই অনলাইন স্টোরটি তৈরি হয়েছে BDRetailers দিয়ে"',
    sub: 'বাংলা ভাষায় দেশীয় বিশ্বস্ত প্ল্যাটফর্ম ব্যাজ',
    preview: '⚡ এই অনলাইন স্টোরটি তৈরি হয়েছে BDRetailers দিয়ে'
  },
  {
    id: 'option_d',
    label: 'Option D — "Store powered by BDRetailers"',
    sub: 'ভেরিফায়েড কমার্স মার্চেন্ট পার্টনার ব্যাজ',
    preview: '⚡ Store powered by BDRetailers • Verified Partner'
  },
];

export default function HeaderFooterEditor({
  headerConfig = {},
  footerConfig = {},
  onHeaderChange,
  onFooterChange,
  shop = {},
  theme = {},
}) {
  const [activeTab, setActiveTab] = useState('header'); // 'header' | 'footer' | 'branding'

  const updateHeader = (key, val) => {
    onHeaderChange({ ...headerConfig, [key]: val });
  };

  const updateFooter = (key, val) => {
    onFooterChange({ ...footerConfig, [key]: val });
  };

  return (
    <div className="p-4 space-y-5">
      {/* Sub-tab switcher */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('header')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'header' ? 'bg-white shadow-xs text-purple-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layout size={13} />
          <span>হেডার (Header)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'footer' ? 'bg-white shadow-xs text-purple-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders size={13} />
          <span>ফুটার (Footer)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'branding' ? 'bg-white shadow-xs text-purple-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield size={13} />
          <span>ব্র্যান্ডিং (Badge)</span>
        </button>
      </div>

      {/* ── 1. HEADER CUSTOMIZATION TAB ── */}
      {activeTab === 'header' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Layout Presets — 10 distinct options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
                🎨 হেডার ডিজাইন লাইব্রেরি (১০টি ভিন্ন লেআউট)
              </label>
              <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                Live Preview
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {HEADER_PRESETS.map(preset => {
                const isSelected = (headerConfig.style || 'classic') === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => updateHeader('style', preset.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{preset.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-black ${isSelected ? 'text-purple-900' : 'text-slate-900'}`}>
                          {preset.label}
                        </p>
                        {isSelected ? (
                          <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            সক্রিয়
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {preset.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">
                        {preset.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Announcement Bar Input */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-1.5">
              <Megaphone size={14} className="text-purple-600" />
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
                টপ অ্যানাউন্সমেন্ট বার টেক্সট
              </label>
            </div>
            <input
              type="text"
              value={headerConfig.announcementText ?? ''}
              onChange={e => updateHeader('announcementText', e.target.value)}
              placeholder={shop?.notices || '🎉 বিশেষ অফার: সমগ্র বাংলাদেশে ফ্রি হোম ডেলিভারি!'}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            />
          </div>

          {/* Button Contrast Style */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              ✨ হেডার বাটন কনট্রাস্ট ও স্টাইল
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => updateHeader('buttonStyle', 'contrast_pill')}
                className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                  (headerConfig.buttonStyle || 'contrast_pill') === 'contrast_pill'
                    ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                🔮 ফ্রস্টেড গ্লাস (Glass Pill)
              </button>
              <button
                type="button"
                onClick={() => updateHeader('buttonStyle', 'white_pill')}
                className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                  headerConfig.buttonStyle === 'white_pill'
                    ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                ⚪ সলিড হোয়াইট (Solid White)
              </button>
            </div>
          </div>

          {/* Header Feature Toggles */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2 shadow-2xs">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              ⚙️ হেডারের উপাদান নিয়ন্ত্রণ (Features)
            </label>

            {/* Header Search */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <div className="flex items-center gap-2">
                <Search size={14} className="text-purple-600" />
                <span className="text-xs font-black text-slate-800">হেডারে সার্চ বার প্রদর্শন</span>
              </div>
              <input
                type="checkbox"
                checked={headerConfig.showSearch !== false}
                onChange={e => updateHeader('showSearch', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>

            {/* Notification Bell */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-purple-600" />
                <span className="text-xs font-black text-slate-800">নোটিফিকেশন ইনবক্স বেল</span>
              </div>
              <input
                type="checkbox"
                checked={headerConfig.showNotifications !== false}
                onChange={e => updateHeader('showNotifications', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>

            {/* FAQ Button */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle size={14} className="text-pink-500" />
                <span className="text-xs font-black text-slate-800">FAQ কুইক হেল্প বাটন</span>
              </div>
              <input
                type="checkbox"
                checked={headerConfig.showFaqBtn !== false}
                onChange={e => updateHeader('showFaqBtn', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* ── 2. FOOTER CUSTOMIZATION TAB ── */}
      {activeTab === 'footer' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Footer Layout Presets — 10 distinct options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
                🎨 ফুটার ডিজাইন লাইব্রেরি (১০টি ভিন্ন লেআউট)
              </label>
              <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                Live Preview
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {FOOTER_PRESETS.map(preset => {
                const isSelected = (footerConfig.style || 'classic_4col') === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => updateFooter('style', preset.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{preset.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-black ${isSelected ? 'text-purple-900' : 'text-slate-900'}`}>
                          {preset.label}
                        </p>
                        {isSelected ? (
                          <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            সক্রিয়
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {preset.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">
                        {preset.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── FOOTER BACKGROUND & COLOR PALETTE ── */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Palette size={14} className="text-purple-600" />
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
                  🎨 ফুটার ব্যাকগ্রাউন্ড কালার (Background Color)
                </label>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {footerConfig.bgColor === 'brand' 
                  ? 'ব্র্যান্ড কালার' 
                  : footerConfig.bgColor || 'ডিফল্ট থিম'}
              </span>
            </div>

            {/* Quick Swatches */}
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
              {[
                { id: 'default', label: 'ডিফল্ট', bg: '#0f172a', border: '#334155' },
                { id: '#030712', label: 'ব্ল্যাক', bg: '#030712', border: '#1f2937' },
                { id: '#ffffff', label: 'সাদা', bg: '#ffffff', border: '#e2e8f0', isLight: true },
                { id: '#f8fafc', label: 'লাইট গ্রে', bg: '#f8fafc', border: '#cbd5e1', isLight: true },
                { id: 'brand', label: 'ব্র্যান্ড', bg: theme.primaryColor || shop?.primaryColor || '#6D28D9', border: '#a855f7' },
                { id: '#0b1329', label: 'নেভি', bg: '#0b1329', border: '#1e3a8a' },
                { id: '#064e3b', label: 'গ্রিন', bg: '#064e3b', border: '#059669' },
                { id: '#4c0519', label: 'ওয়াইন', bg: '#4c0519', border: '#9f1239' },
                { id: '#271c19', label: 'মোকা', bg: '#271c19', border: '#78350f' },
              ].map(sw => {
                const isSelected = (footerConfig.bgColor || 'default') === sw.id;
                return (
                  <button
                    key={sw.id}
                    type="button"
                    onClick={() => updateFooter('bgColor', sw.id === 'default' ? '' : sw.id)}
                    title={sw.label}
                    className={`h-9 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      isSelected ? 'ring-2 ring-purple-600 ring-offset-1 scale-105 shadow-sm' : 'hover:scale-102 opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: sw.bg, borderColor: sw.border }}
                  >
                    {isSelected && (
                      <Check size={12} className={sw.isLight ? 'text-slate-900 stroke-[3]' : 'text-white stroke-[3]'} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input & Hex Code */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 flex-1">
                <input
                  type="color"
                  value={footerConfig.bgColor && footerConfig.bgColor.startsWith('#') ? footerConfig.bgColor : '#0f172a'}
                  onChange={e => updateFooter('bgColor', e.target.value)}
                  className="w-6 h-6 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={footerConfig.bgColor || ''}
                  onChange={e => updateFooter('bgColor', e.target.value)}
                  placeholder="কাস্টম Hex (যেমন: #1E293B)"
                  className="text-xs font-mono font-bold text-slate-800 outline-none w-full bg-transparent"
                />
              </div>

              {footerConfig.bgColor && (
                <button
                  type="button"
                  onClick={() => updateFooter('bgColor', '')}
                  className="px-2.5 py-2 text-[11px] font-bold text-slate-500 hover:text-red-600 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="ডিফল্ট কালারে রিসেট করুন"
                >
                  রিসেট
                </button>
              )}
            </div>
          </div>

          {/* ── FOOTER TEXT CONTRAST & COLOR MODE ── */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              🔤 ফুটার টেক্সট কালার ও কনট্রাস্ট (Text Contrast)
            </label>
            <p className="text-[10px] text-slate-500 leading-tight">
              সাদা ব্যাকগ্রাউন্ডে ডার্ক টেক্সট এবং কালো ব্যাকগ্রাউন্ডে অটো লাইট টেক্সট সেট হয় যাতে লেখা স্পষ্টভাবে পড়া যায়।
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'auto', label: '🌓 অটো স্মার্ট কনট্রাস্ট' },
                { id: 'light', label: '⚪ লাইট/সাদা টেক্সট' },
                { id: 'dark', label: '⚫ ডার্ক/কালো টেক্সট' },
              ].map(m => {
                const currentMode = footerConfig.textColorMode || 'auto';
                const isSelected = currentMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => updateFooter('textColorMode', m.id)}
                    className={`py-2 px-1 rounded-xl border text-[11px] font-black transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'border-purple-600 bg-purple-600 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Tagline Customization */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              কাস্টম ব্র্যান্ড স্লোগান / মিশন স্টেটমেন্ট
            </label>
            <input
              type="text"
              value={footerConfig.customTagline ?? ''}
              onChange={e => updateFooter('customTagline', e.target.value)}
              placeholder={shop?.slogan || 'সেরা অনলাইন কেনাকাটার বিশ্বস্ত ঠিকানা'}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            />
          </div>

          {/* Footer Element Toggles */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2 shadow-2xs">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              ⚙️ ফুটারের উপাদান নিয়ন্ত্রণ (Elements)
            </label>

            {/* Show Categories */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <span className="text-xs font-black text-slate-800">ক্যাটাগরি কুইক লিংক</span>
              <input
                type="checkbox"
                checked={footerConfig.showCategories !== false}
                onChange={e => updateFooter('showCategories', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>

            {/* Show Contact Info */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <span className="text-xs font-black text-slate-800">যোগাযোগ তথ্য (হটলাইন ও ইমেইল)</span>
              <input
                type="checkbox"
                checked={footerConfig.showContact !== false}
                onChange={e => updateFooter('showContact', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>

            {/* Show Social Icons */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <span className="text-xs font-black text-slate-800">সোশ্যাল মিডিয়া লিংকসমূহ</span>
              <input
                type="checkbox"
                checked={footerConfig.showSocials !== false}
                onChange={e => updateFooter('showSocials', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* ── 3. MANDATORY BRANDING CUSTOMIZER TAB ── */}
      {activeTab === 'branding' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-purple-600" />
              <h4 className="text-xs font-black text-purple-900">BDRetailers প্লাটফর্ম ভেরিফিকেশন ব্যাজ</h4>
            </div>
            <p className="text-[11px] text-purple-700 font-medium leading-relaxed">
              আপনার স্টোরের ফুটারকে আন্তর্জাতিক স্ট্যান্ডার্ড ও ভেরিফায়েড লুক দিতে এই প্রিমিয়াম ব্যাজটি কাজ করে। আপনি আপনার পছন্দমতো স্টাইল ও অ্যালাইনমেন্ট নির্বাচন করতে পারবেন।
            </p>
          </div>

          {/* Style Selector */}
          <div>
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-2">
              ✨ ব্যাজের ধরন নির্বাচন করুন
            </label>
            <div className="space-y-2">
              {ATTRIBUTION_OPTIONS.map(opt => {
                const isSelected = (footerConfig.attributionStyle || 'option_a') === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => updateFooter('attributionStyle', opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-black ${isSelected ? 'text-purple-900' : 'text-slate-900'}`}>
                        {opt.label}
                      </p>
                      {isSelected && <Check size={14} className="text-purple-600" />}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{opt.sub}</p>
                    <div className="mt-2 p-2 rounded-xl bg-slate-900 text-slate-300 text-[10px] font-mono">
                      {opt.preview}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alignment Selector */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              📐 ব্যাজ অ্যালাইনমেন্ট (Alignment)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'left', label: 'বামে (Left)' },
                { id: 'center', label: 'মাঝে (Center)' },
                { id: 'right', label: 'ডানে (Right)' },
              ].map(al => (
                <button
                  key={al.id}
                  type="button"
                  onClick={() => updateFooter('attributionAlign', al.id)}
                  className={`py-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                    (footerConfig.attributionAlign || 'center') === al.id
                      ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {al.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
