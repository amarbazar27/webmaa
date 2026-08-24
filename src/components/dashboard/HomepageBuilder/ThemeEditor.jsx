'use client';
import { useState } from 'react';
import { 
  Palette, Type, Sliders, Check, Sparkles, 
  Layers, Square, Circle, Eye, RefreshCw
} from 'lucide-react';

export const THEME_PRESETS = [
  {
    id: 'clean_commerce',
    name: 'Theme 01 — Clean Commerce',
    namebn: 'ক্লিন কমার্স (Clean Commerce)',
    category: 'Universal',
    primaryColor: '#4F46E5',
    secondaryColor: '#1E1B4B',
    accentColor: '#818CF8',
    bgColor: '#FFFFFF',
    textColor: '#0F172A',
    buttonRadius: '50px',
    cardRadius: '16px',
    font: 'Inter',
    desc: 'মডার্ন ইনডিগো ও ক্লিন ব্যালেন্সড স্পেসিং',
  },
  {
    id: 'modern_purple',
    name: 'Theme 02 — Modern Purple',
    namebn: 'মডার্ন রয়্যাল পার্পল (Royal Purple)',
    category: 'Universal',
    primaryColor: '#7C3AED',
    secondaryColor: '#2E1065',
    accentColor: '#C084FC',
    bgColor: '#FAF5FF',
    textColor: '#1E1B4B',
    buttonRadius: '16px',
    cardRadius: '20px',
    font: 'Hind Siliguri',
    desc: 'উজ্জ্বল রয়্যাল ভায়োলেট ও ডায়নামিক গ্রেডিয়েন্ট',
  },
  {
    id: 'fresh_grocery',
    name: 'Theme 03 — Fresh Grocery',
    namebn: 'ফ্রেশ অর্গানিক গ্রিন (Fresh Grocery)',
    category: 'Grocery',
    primaryColor: '#059669',
    secondaryColor: '#064E3B',
    accentColor: '#34D399',
    bgColor: '#F0FDF4',
    textColor: '#064E3B',
    buttonRadius: '12px',
    cardRadius: '16px',
    font: 'Hind Siliguri',
    desc: 'ফার্ম ফ্রেশ এমারেল্ড ও ভেজালমুক্ত অর্গানিক লুক',
  },
  {
    id: 'luxury_black',
    name: 'Theme 04 — Luxury Black & Gold',
    namebn: 'অবসিডিয়ান ২৪কে গোল্ড (Luxury Gold)',
    category: 'Luxury',
    primaryColor: '#D4AF37',
    secondaryColor: '#18181B',
    accentColor: '#F59E0B',
    bgColor: '#FAFAF8',
    textColor: '#18181B',
    buttonRadius: '4px',
    cardRadius: '8px',
    font: 'Playfair Display',
    desc: 'ড্রামাটিক লাক্সারি ব্ল্যাক ও ২৪কে গোল্ড ফিনিশ',
  },
  {
    id: 'soft_boutique',
    name: 'Theme 05 — Soft Rose Boutique',
    namebn: 'সফট রোজ বুটিক (Soft Boutique)',
    category: 'Fashion',
    primaryColor: '#E11D48',
    secondaryColor: '#4C0519',
    accentColor: '#FB7185',
    bgColor: '#FFF1F2',
    textColor: '#4C0519',
    buttonRadius: '50px',
    cardRadius: '20px',
    font: 'Montserrat',
    desc: 'সফট প্যাস্টেল পিঙ্ক ও বুটিক ফ্যাশন ফ্রেশনেস',
  },
  {
    id: 'bold_marketplace',
    name: 'Theme 06 — Bold Marketplace',
    namebn: 'বোল্ড মার্কেটপ্লেস (Bold Marketplace)',
    category: 'Marketplace',
    primaryColor: '#DC2626',
    secondaryColor: '#450A0A',
    accentColor: '#F59E0B',
    bgColor: '#FFFBEB',
    textColor: '#1C1917',
    buttonRadius: '8px',
    cardRadius: '12px',
    font: 'Outfit',
    desc: 'হাই-এনার্জি ক্রিমসন ও অ্যাম্বার ডিলস ভাইব',
  },
  {
    id: 'minimal_editorial',
    name: 'Theme 07 — Minimal Editorial',
    namebn: 'মনোক্রোম এডিটোরিয়াল (Minimal Gallery)',
    category: 'Editorial',
    primaryColor: '#09090B',
    secondaryColor: '#27272A',
    accentColor: '#71717A',
    bgColor: '#FFFFFF',
    textColor: '#09090B',
    buttonRadius: '0px',
    cardRadius: '2px',
    font: 'Montserrat',
    desc: 'হোয়াইট স্পেস গ্যালারি ও শার্প এডিটোরিয়াল',
  },
  {
    id: 'tech_neon',
    name: 'Theme 08 — Cyber Tech Neon',
    namebn: 'সাইবার নিয়ন টেক (Tech Neon)',
    category: 'Tech',
    primaryColor: '#2563EB',
    secondaryColor: '#0F172A',
    accentColor: '#06B6D4',
    bgColor: '#F0F9FF',
    textColor: '#0C4A6E',
    buttonRadius: '8px',
    cardRadius: '16px',
    font: 'Inter',
    desc: 'ইলেকট্রিক ব্লু ও সাইবার নিয়ন সায়ান গ্লো',
  },
  {
    id: 'warm_organic',
    name: 'Theme 09 — Warm Earthy Organic',
    namebn: 'ওয়ার্ম আর্থি অর্গানিক (Warm Organic)',
    category: 'Home & Living',
    primaryColor: '#CC5500',
    secondaryColor: '#7C2D12',
    accentColor: '#D97706',
    bgColor: '#FFFBEB',
    textColor: '#451A03',
    buttonRadius: '16px',
    cardRadius: '16px',
    font: 'Montserrat',
    desc: 'টেরাকোটা শেড ও ন্যাচারাল কজি লিভিং ভাইব',
  },
  {
    id: 'playful_kids',
    name: 'Theme 10 — Playful Sunshine',
    namebn: 'প্লেফুল সানশাইন (Playful Kids)',
    category: 'Kids & Toys',
    primaryColor: '#F59E0B',
    secondaryColor: '#78350F',
    accentColor: '#0284C7',
    bgColor: '#FEF3C7',
    textColor: '#451A03',
    buttonRadius: '50px',
    cardRadius: '24px',
    font: 'Poppins',
    desc: 'আনন্দময় কালারফুল ব্রাইট ভাইব্রেন্ট থিম',
  },
  {
    id: 'premium_fashion',
    name: 'Theme 11 — Velvet Wine Fashion',
    namebn: 'ভেলভেট ওয়াইন ফ্যাশন (Premium Fashion)',
    category: 'Fashion',
    primaryColor: '#881337',
    secondaryColor: '#4C0519',
    accentColor: '#EAB308',
    bgColor: '#FFF1F2',
    textColor: '#4C0519',
    buttonRadius: '6px',
    cardRadius: '10px',
    font: 'Playfair Display',
    desc: 'আভিজাত্যপূর্ণ ওয়াইন মেরুন ও গোল্ড একসেন্ট',
  },
  {
    id: 'corporate_b2b',
    name: 'Theme 12 — Steel Navy B2B',
    namebn: 'স্টিল নেভি কর্পোরেট (Corporate B2B)',
    category: 'B2B',
    primaryColor: '#1E3A8A',
    secondaryColor: '#172554',
    accentColor: '#60A5FA',
    bgColor: '#F8FAFC',
    textColor: '#0F172A',
    buttonRadius: '8px',
    cardRadius: '10px',
    font: 'Inter',
    desc: 'প্রফেশনাল কর্পোরেট ট্রাস্ট ও ব্লু ফোকাস',
  },
  {
    id: 'fresh_food',
    name: 'Theme 13 — Sunset Food Express',
    namebn: 'সানসেট ফুড এক্সপ্রেস (Fresh Food)',
    category: 'Food',
    primaryColor: '#EA580C',
    secondaryColor: '#7C2D12',
    accentColor: '#FACC15',
    bgColor: '#FFF7ED',
    textColor: '#431407',
    buttonRadius: '18px',
    cardRadius: '18px',
    font: 'Hind Siliguri',
    desc: 'ক্ষুধা উদ্দীপক স্পাইসি অরেঞ্জ ও ইয়েলো গ্লো',
  },
  {
    id: 'dark_electronics',
    name: 'Theme 14 — Titanium Midnight',
    namebn: 'টাইটানিয়াম মিডনাইট (Dark Tech)',
    category: 'Tech',
    primaryColor: '#0284C7',
    secondaryColor: '#0F172A',
    accentColor: '#38BDF8',
    bgColor: '#F0F9FF',
    textColor: '#0F172A',
    buttonRadius: '14px',
    cardRadius: '18px',
    font: 'Inter',
    desc: 'টাইটানিয়াম গ্রে ও ম্যাট ব্ল্যাক প্রফেশনাল ফিনিশ',
  },
  {
    id: 'elegant_beauty',
    name: 'Theme 15 — Rose Gold Radiance',
    namebn: 'রোজ গোল্ড রেডিয়েন্স (Elegant Beauty)',
    category: 'Beauty',
    primaryColor: '#B76E79',
    secondaryColor: '#881337',
    accentColor: '#F472B6',
    bgColor: '#FDF2F8',
    textColor: '#500724',
    buttonRadius: '50px',
    cardRadius: '20px',
    font: 'Montserrat',
    desc: 'ডিউই স্কিনকেয়ার ও সফট রোজ গোল্ড আভা',
  },
];

const FONTS = [
  'Hind Siliguri',
  'Inter',
  'Montserrat',
  'Outfit',
  'Playfair Display',
  'Poppins',
  'Kalpurush',
];

export default function ThemeEditor({ theme = {}, onChange, shop }) {
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'custom'

  const applyPreset = (preset) => {
    onChange({
      ...theme,
      presetId: preset.id,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      bgColor: preset.bgColor,
      textColor: preset.textColor,
      buttonRadius: preset.buttonRadius,
      cardRadius: preset.cardRadius,
      font: preset.font,
    });
  };

  const update = (key, val) => onChange({ ...theme, [key]: val });

  return (
    <div className="p-4 space-y-5">
      {/* Sub-tab Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'library' ? 'bg-white shadow-xs text-purple-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette size={13} />
          <span>থিম লাইব্রেরি (১৫টি থিম)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'custom' ? 'bg-white shadow-xs text-purple-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders size={13} />
          <span>কাস্টম ডিজাইন টোকেন</span>
        </button>
      </div>

      {/* ── 1. THEME PRESETS LIBRARY TAB ── */}
      {activeTab === 'library' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              🎨 ভিজ্যুয়াল থিম নির্বাচন করুন (Visual Language)
            </label>
            <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Live Preview
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
            {THEME_PRESETS.map(preset => {
              const isSelected = theme.primaryColor === preset.primaryColor || theme.presetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2.5 ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/50 shadow-md ring-1 ring-purple-600'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-xs font-black ${isSelected ? 'text-purple-900' : 'text-slate-900'}`}>
                        {preset.namebn}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{preset.desc}</p>
                    </div>
                    {isSelected ? (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-xs">
                        সক্রিয়
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 text-[10px] font-black transition-colors"
                      >
                        Apply
                      </button>
                    )}
                  </div>

                  {/* Palette Demonstration Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full shadow-xs border border-white" style={{ background: preset.primaryColor }} title="Primary" />
                      <span className="w-5 h-5 rounded-full shadow-xs border border-white" style={{ background: preset.secondaryColor }} title="Secondary" />
                      <span className="w-5 h-5 rounded-full shadow-xs border border-white" style={{ background: preset.accentColor }} title="Accent" />
                      <span className="w-5 h-5 rounded-full shadow-xs border border-slate-200" style={{ background: preset.bgColor }} title="Background" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-400">Font: {preset.font}</span>
                      <span 
                        className="px-2 py-0.5 text-white text-[9px] font-black shadow-xs"
                        style={{ background: preset.primaryColor, borderRadius: preset.buttonRadius }}
                      >
                        অর্ডার করুন
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. CUSTOM DESIGN TOKENS TAB ── */}
      {activeTab === 'custom' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Primary Color Picker */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              Primary Brand Color (প্রধান রং)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.primaryColor || '#6D28D9'}
                onChange={e => update('primaryColor', e.target.value)}
                className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.primaryColor || ''}
                onChange={e => update('primaryColor', e.target.value)}
                placeholder="#6D28D9"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              />
            </div>
          </div>

          {/* Button Corner Radius */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              Button Border Radius (বাটন রাউন্ডনেস)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Sharp (0px)', val: '0px' },
                { label: 'Soft (8px)', val: '8px' },
                { label: 'Smooth (16px)', val: '16px' },
                { label: 'Pill (50px)', val: '50px' },
              ].map(r => (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => update('buttonRadius', r.val)}
                  className={`py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                    (theme.buttonRadius || '50px') === r.val
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              Font Family (টাইপোগ্রাফি)
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
              {FONTS.map(font => (
                <button
                  key={font}
                  type="button"
                  onClick={() => update('font', font)}
                  className={`px-3 py-2 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    theme.font === font
                      ? 'border-purple-600 bg-purple-50 text-purple-900 font-black shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50'
                  }`}
                  style={{ fontFamily: font }}
                >
                  <span>{font} (বাংলা ও ইংরেজি)</span>
                  {theme.font === font && <Check size={13} className="text-purple-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
