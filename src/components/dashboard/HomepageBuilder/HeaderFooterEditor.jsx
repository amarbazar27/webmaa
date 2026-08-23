'use client';
import { useState } from 'react';
import { 
  Layout, Sparkles, Search, Bell, Moon, Sun, 
  HelpCircle, Settings, Phone, Mail, Share2, Eye,
  Shield, Check, Sliders, Palette
} from 'lucide-react';

export const HEADER_PRESETS = [
  {
    id: 'classic',
    label: 'ক্লাসিক ব্যালেন্সড (Classic Balanced)',
    desc: 'লোগো বামে, সার্চবার মাঝে ও অ্যাকশন বাটন ডানে',
    icon: '🏛️',
  },
  {
    id: 'floating',
    label: 'ফ্লোটিং গ্লাসবার (Floating Glass Bar)',
    desc: 'রাউন্ডেড ব্যাকড্রপ ব্লার সহ প্রিমিয়াম ফ্লোটিং হেডার',
    icon: '✨',
  },
  {
    id: 'minimal',
    label: 'মিনিমাল ক্লিন (Minimal Clean)',
    desc: 'সিম্পল ও ফাস্ট লোডিং স্লিম হেডার',
    icon: '⚡',
  },
  {
    id: 'centered',
    label: 'সেন্টারড ব্র্যান্ড (Centered Brand)',
    desc: 'মাঝখানে বড় লোগো ও দুপাশে সাজানো বাটন',
    icon: '👑',
  },
  {
    id: 'dark_contrast',
    label: 'ডার্ক লাক্সারি কনট্রাস্ট (Dark Luxury)',
    desc: 'গাঢ় ব্যাকগ্রাউন্ডে উজ্জ্বল কনট্রাস্ট বাটন ও আইকন',
    icon: '🌌',
  },
];

export const FOOTER_PRESETS = [
  {
    id: 'modern_columns',
    label: '৪-কলাম মেগা ফুটার (Modern Mega)',
    desc: 'ব্র্যান্ড ডিটেইলস, ক্যাটাগরি লিংক, কন্টাক্ট ও সোশ্যাল',
    icon: '📰',
  },
  {
    id: 'minimal_bar',
    label: 'মিনিমাল ক্লিন বার (Minimal Bar)',
    desc: 'কম্প্যাক্ট স্লিম কপিরাইট ও প্রয়োজনীয় লিংক',
    icon: '🎯',
  },
  {
    id: 'centered_brand',
    label: 'সেন্টারড ব্র্যান্ড শোকেস (Centered Brand)',
    desc: 'মাঝখানে লোগো, স্লোগান, স্টার রিভিউ ও সোশ্যাল বার',
    icon: '🌟',
  },
  {
    id: 'dark_luxury',
    label: 'লাক্সারি ডার্ক মেশ (Dark Luxury Mesh)',
    desc: 'স্মুথ গ্রেডিয়েন্ট গ্লো ও গ্লাস বর্ডার সহ আধুনিক ফুটার',
    icon: '💎',
  },
];

export default function HeaderFooterEditor({
  headerConfig = {},
  footerConfig = {},
  onHeaderChange,
  onFooterChange,
  shop,
  theme,
}) {
  const [activeTab, setActiveTab] = useState('header'); // 'header' | 'footer'

  const updateHeader = (key, val) => {
    onHeaderChange({ ...headerConfig, [key]: val });
  };

  const updateFooter = (key, val) => {
    onFooterChange({ ...footerConfig, [key]: val });
  };

  const primary = theme?.primaryColor || '#6D28D9';

  return (
    <div className="p-4 space-y-5">
      {/* Sub-tab switcher */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('header')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'header' ? 'bg-white shadow-xs text-purple-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layout size={13} />
          <span>হেডার ডিজাইন (Header)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'footer' ? 'bg-white shadow-xs text-purple-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders size={13} />
          <span>ফুটার ডিজাইন (Footer)</span>
        </button>
      </div>

      {/* ── HEADER CUSTOMIZATION ── */}
      {activeTab === 'header' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Layout Presets */}
          <div>
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-2">
              🎨 হেডার লেআউট নির্বাচন করুন
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {HEADER_PRESETS.map(preset => {
                const isSelected = (headerConfig.style || 'classic') === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => updateHeader('style', preset.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 shadow-sm ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{preset.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-black ${isSelected ? 'text-purple-900' : 'text-slate-900'}`}>
                          {preset.label}
                        </p>
                        {isSelected && (
                          <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            সক্রিয়
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {preset.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Button Contrast Style */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              ✨ হেডার বাটন কনট্রাস্ট ও স্টাইল
            </label>
            <p className="text-[10px] text-slate-500 font-medium">
              হেডারের ব্যাকগ্রাউন্ড কালারের উপর বাটনগুলো যাতে স্পষ্টভাবে দেখা যায়
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => updateHeader('buttonStyle', 'contrast_pill')}
                className={`p-2.5 rounded-xl border text-xs font-black transition-all ${
                  (headerConfig.buttonStyle || 'contrast_pill') === 'contrast_pill'
                    ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                🔮 ফ্রস্টেড গ্লাস পিল (Glass Pill)
              </button>
              <button
                type="button"
                onClick={() => updateHeader('buttonStyle', 'white_pill')}
                className={`p-2.5 rounded-xl border text-xs font-black transition-all ${
                  headerConfig.buttonStyle === 'white_pill'
                    ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                ⚪ সলিড হোয়াইট পিল (Solid White)
              </button>
            </div>
          </div>

          {/* Header Feature Toggles */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2.5 shadow-2xs">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              ⚙️ হেডারের উপাদান নিয়ন্ত্রণ (Features)
            </label>

            {/* Header Search with Recent History */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <div className="flex items-center gap-2">
                <Search size={14} className="text-purple-600" />
                <div>
                  <p className="text-xs font-black text-slate-800">হেডারে সার্চ বার ও সার্চ হিস্ট্রি</p>
                  <p className="text-[9px] text-slate-400 font-medium">ব্যবহারকারীদের পূর্ববর্তী সার্চ সংরক্ষণ ও ডিলিট অপশন</p>
                </div>
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

            {/* Dark/Light Toggle */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <div className="flex items-center gap-2">
                <Sun size={14} className="text-amber-500" />
                <span className="text-xs font-black text-slate-800">ডার্ক / লাইট থিম সুইচ</span>
              </div>
              <input
                type="checkbox"
                checked={headerConfig.showThemeToggle !== false}
                onChange={e => updateHeader('showThemeToggle', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>

            {/* Merchant Dashboard Button */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-purple-600" />
                <span className="text-xs font-black text-slate-800">মার্চেন্ট 'প্যানেলে যান' বাটন</span>
              </div>
              <input
                type="checkbox"
                checked={headerConfig.showDashboardBtn !== false}
                onChange={e => updateHeader('showDashboardBtn', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>

            {/* FAQ Button */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle size={14} className="text-pink-500" />
                <span className="text-xs font-black text-slate-800">FAQ হেল্প বাটন</span>
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

      {/* ── FOOTER CUSTOMIZATION ── */}
      {activeTab === 'footer' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Footer Layout Presets */}
          <div>
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-2">
              🎨 ফুটার লেআউট নির্বাচন করুন
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {FOOTER_PRESETS.map(preset => {
                const isSelected = (footerConfig.style || 'modern_columns') === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => updateFooter('style', preset.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 shadow-sm ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{preset.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-black ${isSelected ? 'text-purple-900' : 'text-slate-900'}`}>
                          {preset.label}
                        </p>
                        {isSelected && (
                          <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            সক্রিয়
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {preset.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Tagline Customization */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              কাস্টম ব্র্যান্ড স্লোগান / মেসেজ
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
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2.5 shadow-2xs">
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
              <span className="text-xs font-black text-slate-800">যোগাযোগ তথ্য (ইমেইল ও হোয়াটসঅ্যাপ)</span>
              <input
                type="checkbox"
                checked={footerConfig.showContact !== false}
                onChange={e => updateFooter('showContact', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>

            {/* Show Social Icons */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <span className="text-xs font-black text-slate-800">সোশ্যাল মিডিয়া আইকনসমূহ</span>
              <input
                type="checkbox"
                checked={footerConfig.showSocials !== false}
                onChange={e => updateFooter('showSocials', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>

            {/* Show Copyright */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <span className="text-xs font-black text-slate-800">কপিরাইট বার ও ব্রাউজিং ইনফো</span>
              <input
                type="checkbox"
                checked={footerConfig.showCopyright !== false}
                onChange={e => updateFooter('showCopyright', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>

            {/* Show Privacy Link */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <span className="text-xs font-black text-slate-800">প্রাইভেসি পলিসি ব্যাজ লিংক</span>
              <input
                type="checkbox"
                checked={footerConfig.showPrivacy !== false}
                onChange={e => updateFooter('showPrivacy', e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
