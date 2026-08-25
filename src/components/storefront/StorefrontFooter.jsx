'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, Truck, RotateCcw, Lock, Phone, 
  Mail, MessageCircle, Star, Heart, ExternalLink,
  ChevronRight, ArrowRight, CheckCircle2, Sparkles
} from 'lucide-react';

export const FOOTER_PRESETS = [
  {
    id: 'classic_4col',
    label: 'Footer A — Classic 4 Column',
    desc: 'অ্যাবাউট ব্র্যান্ড, শপ ক্যাটাগরি, কাস্টমার কেয়ার ও যোগাযোগ',
    icon: '🏛️',
    badge: 'Standard 4-Col',
    defaultBg: '#0f172a',
    defaultIsDark: true
  },
  {
    id: 'mega_footer',
    label: 'Footer B — Mega Multi-Column',
    desc: 'মাল্টি-কলাম লিংকস, নিউজলেটার, পেমেন্ট আইকন ও ট্রাস্ট ব্যাজ',
    icon: '📰',
    badge: 'Rich & Detailed',
    defaultBg: '#030712',
    defaultIsDark: true
  },
  {
    id: 'minimal_bar',
    label: 'Footer C — Minimal Modern Bar',
    desc: 'কম্প্যাক্ট স্লিম কপিরাইট, সোশ্যাল আইকন ও প্রয়োজনীয় লিংক',
    icon: '⚡',
    badge: 'Sleek & Clean',
    defaultBg: '#ffffff',
    defaultIsDark: false
  },
  {
    id: 'editorial_story',
    label: 'Footer D — Editorial Brand Statement',
    desc: 'বড় ব্র্যান্ড স্লোগান/স্টোরি, সোশ্যাল হাফ ও সিগনেচার স্টাইল',
    icon: '📖',
    badge: 'Editorial & Story',
    defaultBg: '#1c1917',
    defaultIsDark: true
  },
  {
    id: 'marketplace',
    label: 'Footer E — Marketplace Hub',
    desc: 'কাস্টমার প্রোটেকশন, রিটার্ন পলিসি, পার্টনার্স ও পেমেন্ট',
    icon: '🏬',
    badge: 'Marketplace',
    defaultBg: '#0f172a',
    defaultIsDark: true
  },
  {
    id: 'grocery_fresh',
    label: 'Footer F — Fresh Grocery',
    desc: '১০০% ফ্রেশনেস গ্যারান্টি, কভারেজ এরিয়া ও হটলাইন সাপোর্ট',
    icon: '🥦',
    badge: 'Fresh & Daily',
    defaultBg: '#064e3b',
    defaultIsDark: true
  },
  {
    id: 'fashion_lifestyle',
    label: 'Footer G — Fashion & Lifestyle',
    desc: 'ব্র্যান্ড স্টোরি, কিউরেটেড কালেকশন ও ভিআইপি ক্লাব সাইনআপ',
    icon: '👗',
    badge: 'Fashion & Boutique',
    defaultBg: '#030712',
    defaultIsDark: true
  },
  {
    id: 'electronics_tech',
    label: 'Footer H — Tech & Electronics Hub',
    desc: 'ওয়ারেন্টি সাপোর্ট, অফিসিয়াল ব্র্যান্ডস ও সার্ভিস সেন্টার ইনফো',
    icon: '💻',
    badge: 'Tech & Gadgets',
    defaultBg: '#0b1329',
    defaultIsDark: true
  },
  {
    id: 'trust_badge',
    label: 'Footer I — Large Trust & Security',
    desc: '২৫৬-বিট এসএসএল সিকিউর চেকআউট ও জেনুইন প্রোডাক্ট শিল্ড',
    icon: '🛡️',
    badge: 'High Conversion',
    defaultBg: '#0f172a',
    defaultIsDark: true
  },
  {
    id: 'modern_split',
    label: 'Footer J — Modern Split Screen',
    desc: 'বামে ব্র্যান্ড ভিশন এবং ডানে দ্রুত নেভিগেশন ও সোশ্যাল হাব',
    icon: '✨',
    badge: 'Split Screen',
    defaultBg: '#0f172a',
    defaultIsDark: true
  },
];

// Helper to compute WCAG relative luminance and optimal text colors
export function getFooterColorPalette(footerConfig = {}, themeVars = {}, shop = {}, presetId = 'classic_4col') {
  const preset = FOOTER_PRESETS.find(p => p.id === presetId) || FOOTER_PRESETS[0];
  const primaryColor = themeVars?.primaryColor || themeVars?.['--sp-primary'] || shop?.primaryColor || '#6D28D9';
  
  // 1. Determine effective Background Color
  let bgColor = footerConfig?.bgColor;
  if (bgColor === 'brand') {
    bgColor = primaryColor;
  } else if (!bgColor || bgColor === 'default' || bgColor === 'auto') {
    bgColor = preset.defaultBg || '#0f172a';
  }

  // 2. Determine Dark vs Light using luminance
  let isDark = preset.defaultIsDark;
  if (bgColor.startsWith('#')) {
    const hex = bgColor.replace('#', '');
    if (hex.length === 3 || hex.length === 6) {
      const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16) || 0;
      const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16) || 0;
      const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16) || 0;
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      isDark = luminance < 0.55;
    }
  } else if (bgColor === 'white' || bgColor === 'rgb(255, 255, 255)' || bgColor === '#ffffff' || bgColor === '#f8fafc') {
    isDark = false;
  }

  // Allow manual text color override mode if set
  if (footerConfig?.textColorMode === 'light') isDark = true;
  if (footerConfig?.textColorMode === 'dark') isDark = false;

  // 3. Compute High-Contrast Accessible Colors
  const textColor = footerConfig?.textColor || (isDark ? '#cbd5e1' : '#334155');
  const headingColor = footerConfig?.headingColor || (isDark ? '#ffffff' : '#0f172a');
  const mutedTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)';
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)';
  const badgeBg = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)';
  const badgeBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
  const badgeText = isDark ? '#e2e8f0' : '#1e293b';

  return {
    bgColor,
    isDark,
    textColor,
    headingColor,
    mutedTextColor,
    borderColor,
    cardBg,
    cardBorder,
    badgeBg,
    badgeBorder,
    badgeText,
    primaryColor,
  };
}

export default function StorefrontFooter({
  shop = {},
  footerConfig = {},
  themeVars = {},
  categories = [],
  onCategoryClick,
  isPreview = false,
}) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const safeCategories = Array.isArray(categories) ? categories : [];
  const fStyle = footerConfig?.style || 'classic_4col';
  const shopName = String(shop?.shopName || 'BDRetailers Store');
  const customTagline = String(footerConfig?.customTagline || shop?.slogan || 'সেরা অনলাইন কেনাকাটার বিশ্বস্ত ঠিকানা');
  const attributionStyle = footerConfig?.attributionStyle || 'option_a';
  const attributionAlign = footerConfig?.attributionAlign || 'center';

  const rawEmail = String(shop?.deliveryConfig?.contactEmail || shop?.ownerEmail || 'bdretailers26@gmail.com');
  const displayEmail = rawEmail.includes('no contact') ? 'bdretailers26@gmail.com' : rawEmail;
  const rawWa = String(shop?.deliveryConfig?.contactWhatsapp || shop?.socialLinks?.wa || '01734763306');
  const cleanWa = rawWa.replace(/[^0-9]/g, '') || '01734763306';
  const displayPhone = rawWa.includes('no contact') ? '+8801734763306' : rawWa;

  const palette = useMemo(() => {
    return getFooterColorPalette(footerConfig, themeVars, shop, fStyle);
  }, [footerConfig, themeVars, shop, fStyle]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 4000);
    setNewsletterEmail('');
  };

  // ══════════════════════════════════════════════════════════════════
  // MANDATORY BDRETAILERS BRANDING ATTRIBUTION BADGE (High Contrast & Adaptive)
  // ══════════════════════════════════════════════════════════════════
  const renderAttribution = () => {
    let text = "Powered by BDRetailers";
    let sub = "Launch your online store";

    if (attributionStyle === 'option_b') {
      text = "Built with BDRetailers";
      sub = "Create your own store";
    } else if (attributionStyle === 'option_c') {
      text = "এই অনলাইন স্টোরটি তৈরি হয়েছে BDRetailers দিয়ে";
      sub = "আপনার অনলাইন শপ খুলুন";
    } else if (attributionStyle === 'option_d') {
      text = "Store powered by BDRetailers";
      sub = "Verified Commerce Partner";
    }

    const alignClass = attributionAlign === 'left' 
      ? 'justify-start text-left' 
      : attributionAlign === 'right' 
      ? 'justify-end text-right' 
      : 'justify-center text-center';

    return (
      <div className={`flex items-center ${alignClass} py-3`}>
        <a
          href="https://bdretailers.com"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { if (isPreview) e.preventDefault(); }}
          style={{
            backgroundColor: palette.isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(15, 23, 42, 0.05)',
            borderColor: palette.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.12)',
          }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border backdrop-blur-md transition-all group shadow-xs hover:scale-[1.02] cursor-pointer"
        >
          <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-xs group-hover:scale-110 transition-transform shrink-0">
            ⚡
          </div>
          <div className="flex flex-col text-left">
            <span 
              style={{ color: palette.headingColor }}
              className="text-xs font-black tracking-tight group-hover:text-purple-600 transition-colors"
            >
              {text}
            </span>
            <span 
              style={{ color: palette.mutedTextColor }}
              className="text-[9px] font-bold tracking-wider uppercase"
            >
              {sub} • <span className={`underline ${palette.isDark ? 'group-hover:text-amber-400' : 'group-hover:text-purple-700'}`}>bdretailers.com</span>
            </span>
          </div>
        </a>
      </div>
    );
  };

  // Social Links Component
  const renderSocials = () => {
    if (footerConfig?.showSocials === false) return null;
    const links = shop?.socialLinks || {};
    const btnStyle = {
      backgroundColor: palette.badgeBg,
      borderColor: palette.badgeBorder,
      color: palette.badgeText,
    };

    return (
      <div className="flex items-center gap-2 flex-wrap pt-2">
        {links.fb && (
          <a 
            href={links.fb} 
            target="_blank" 
            rel="noreferrer" 
            style={btnStyle}
            className="w-8 h-8 rounded-xl border hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            aria-label="Facebook"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        )}
        {links.wa && (
          <a 
            href={`https://wa.me/${cleanWa}`} 
            target="_blank" 
            rel="noreferrer" 
            style={btnStyle}
            className="w-8 h-8 rounded-xl border hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            aria-label="WhatsApp"
          >
            <MessageCircle size={16} />
          </a>
        )}
        {links.insta && (
          <a 
            href={links.insta} 
            target="_blank" 
            rel="noreferrer" 
            style={btnStyle}
            className="w-8 h-8 rounded-xl border hover:bg-pink-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
        )}
      </div>
    );
  };

  // Payment Badges
  const renderPaymentLogos = () => (
    <div className="flex items-center gap-2 flex-wrap">
      {['bKash', 'Nagad', 'Rocket', 'Cash on Delivery'].map((method) => (
        <span 
          key={method}
          style={{
            backgroundColor: palette.badgeBg,
            borderColor: palette.badgeBorder,
            color: palette.badgeText,
          }}
          className="px-2.5 py-1 rounded-lg text-[10px] font-black border shadow-2xs"
        >
          {method}
        </span>
      ))}
    </div>
  );

  const containerStyle = {
    backgroundColor: palette.bgColor,
    color: palette.textColor,
    borderColor: palette.borderColor,
  };

  // ══════════════════════════════════════════════════════════════════
  // FOOTER A: CLASSIC 4-COLUMN
  // ══════════════════════════════════════════════════════════════════
  if (fStyle === 'classic_4col') {
    return (
      <footer style={containerStyle} className="border-t pt-12 pb-6 px-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <h3 style={{ color: palette.headingColor }} className="text-lg font-black">{shopName}</h3>
            <p style={{ color: palette.mutedTextColor }} className="text-xs font-medium leading-relaxed">{customTagline}</p>
            {renderSocials()}
          </div>

          {/* Col 2: Categories */}
          {footerConfig?.showCategories !== false && (
            <div className="space-y-3">
              <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-wider">জনপ্রিয় ক্যাটাগরি</h4>
              <ul className="space-y-2 text-xs font-bold" style={{ color: palette.textColor }}>
                {safeCategories.slice(0, 5).map(c => {
                  const catName = typeof c === 'object' ? (c.name || '') : String(c);
                  return (
                    <li key={typeof c === 'object' ? (c.id || catName) : catName}>
                      <button onClick={() => onCategoryClick?.(catName)} className="hover:opacity-80 transition-opacity cursor-pointer text-left">
                        → {catName}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Col 3: Customer Care */}
          <div className="space-y-3">
            <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-wider">গ্রাহক সেবা ও নীতি</h4>
            <ul className="space-y-2 text-xs font-bold" style={{ color: palette.textColor }}>
              <li><Link href={`/shop/${shop?.subdomainSlug || shop?.shopSlug || ''}/privacy`} className="hover:opacity-80 transition-opacity">প্রাইভেসি পলিসি</Link></li>
              <li><span className="opacity-90">রিটার্ন ও রিফান্ড নীতি</span></li>
              <li><span className="opacity-90">ডেলিভারি ট্র্যাকিং</span></li>
              <li><span className="opacity-90">শর্তাবলী ও নিয়ম</span></li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          {footerConfig?.showContact !== false && (
            <div className="space-y-3">
              <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-wider">যোগাযোগ</h4>
              <div className="space-y-2 text-xs font-bold" style={{ color: palette.textColor }}>
                <p className="flex items-center gap-2"><Phone size={13} className="text-emerald-500 shrink-0" /> {displayPhone}</p>
                <p className="flex items-center gap-2"><Mail size={13} className="text-purple-500 shrink-0" /> {displayEmail}</p>
                <div className="pt-2">{renderPaymentLogos()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar with Mandatory Attribution */}
        <div style={{ borderColor: palette.borderColor }} className="max-w-7xl mx-auto border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p style={{ color: palette.mutedTextColor }} className="text-xs font-bold text-center md:text-left">
            © {new Date().getFullYear()} {shopName} — সর্বস্বত্ব সংরক্ষিত।
          </p>
          {renderAttribution()}
        </div>
      </footer>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER B: MEGA MULTI-COLUMN FOOTER
  // ══════════════════════════════════════════════════════════════════
  if (fStyle === 'mega_footer') {
    return (
      <footer style={containerStyle} className="border-t pt-16 pb-8 px-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Top Newsletter Card */}
          <div 
            style={{ 
              backgroundColor: palette.cardBg, 
              borderColor: palette.cardBorder 
            }} 
            className="p-6 sm:p-8 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
          >
            <div>
              <h3 style={{ color: palette.headingColor }} className="text-lg sm:text-xl font-black">এক্সক্লুসিভ অফার ও ডিসকাউন্ট পেতে যুক্ত থাকুন</h3>
              <p style={{ color: palette.mutedTextColor }} className="text-xs font-medium mt-1">সবার আগে ফ্ল্যাশ সেল ও ডিসকাউন্ট ভাউচারের নোটিফিকেশন পান।</p>
            </div>
            <form onSubmit={handleSubscribe} className="w-full md:w-auto flex gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder="আপনার ইমেইল লিখুন..."
                style={{
                  backgroundColor: palette.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  borderColor: palette.borderColor,
                  color: palette.headingColor,
                }}
                className="px-4 py-2.5 border rounded-xl text-xs font-bold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-72"
              />
              <button 
                type="submit" 
                style={{ backgroundColor: palette.primaryColor }}
                className="px-5 py-2.5 text-white font-black text-xs rounded-xl shrink-0 shadow-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                {subscribed ? 'যুক্ত হয়েছেন!' : 'সাবস্ক্রাইব'}
              </button>
            </form>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-widest">About Store</h4>
              <p style={{ color: palette.mutedTextColor }} className="text-xs leading-relaxed font-medium">{customTagline}</p>
              {renderSocials()}
            </div>
            <div className="space-y-3">
              <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-widest">Departments</h4>
              <ul className="space-y-2 text-xs font-bold" style={{ color: palette.textColor }}>
                {safeCategories.slice(0, 6).map(c => {
                  const catName = typeof c === 'object' ? (c.name || '') : String(c);
                  return (
                    <li key={typeof c === 'object' ? (c.id || catName) : catName}>
                      <button onClick={() => onCategoryClick?.(catName)} className="hover:opacity-80 transition-opacity cursor-pointer">
                        → {catName}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="space-y-3">
              <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-widest">Support & Policy</h4>
              <ul className="space-y-2 text-xs font-bold" style={{ color: palette.textColor }}>
                <li><span className="opacity-90">অর্ডার ট্র্যাক করুন</span></li>
                <li><span className="opacity-90">রিফান্ড ও রিটার্ন</span></li>
                <li><span className="opacity-90">পেমেন্ট মেথডস</span></li>
                <li><span className="opacity-90">প্রাইভেসি ও শর্তাবলী</span></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-widest">Verified Merchant</h4>
              <p style={{ color: palette.mutedTextColor }} className="text-xs font-medium">২৪/৭ অনলাইন অর্ডার ও দ্রুততম কুরিয়ার হোম ডেলিভারি সাপোর্ট।</p>
              {renderPaymentLogos()}
            </div>
          </div>

          {/* Attribution */}
          <div style={{ borderColor: palette.borderColor }} className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p style={{ color: palette.mutedTextColor }} className="text-xs font-bold">© {new Date().getFullYear()} {shopName} • All Rights Reserved</p>
            {renderAttribution()}
          </div>
        </div>
      </footer>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER C: MINIMAL MODERN BAR
  // ══════════════════════════════════════════════════════════════════
  if (fStyle === 'minimal_bar') {
    return (
      <footer style={containerStyle} className="border-t py-6 px-4 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span style={{ color: palette.headingColor }} className="font-black text-sm">{shopName}</span>
            <span style={{ color: palette.borderColor }} className="text-xs hidden sm:inline">|</span>
            <span style={{ color: palette.mutedTextColor }} className="text-xs font-medium truncate max-w-xs">{customTagline}</span>
          </div>

          <div className="flex items-center gap-4">
            {renderSocials()}
            <Link 
              href={`/shop/${shop?.subdomainSlug || shop?.shopSlug || ''}/privacy`} 
              style={{ color: palette.textColor }}
              className="text-xs font-bold hover:underline"
            >
              Privacy
            </Link>
          </div>
        </div>

        <div style={{ borderColor: palette.borderColor }} className="max-w-6xl mx-auto mt-4 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
          <p style={{ color: palette.mutedTextColor }} className="text-[11px] font-bold">© {new Date().getFullYear()} {shopName}</p>
          {renderAttribution()}
        </div>
      </footer>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER D: EDITORIAL BRAND STATEMENT
  // ══════════════════════════════════════════════════════════════════
  if (fStyle === 'editorial_story') {
    return (
      <footer style={containerStyle} className="py-16 px-6 font-serif border-t transition-colors duration-200">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span style={{ color: palette.primaryColor }} className="text-xs uppercase tracking-widest font-sans font-black">OUR SIGNATURE PROMISE</span>
          <h2 style={{ color: palette.headingColor }} className="text-2xl sm:text-4xl font-normal leading-relaxed italic">
            "{customTagline}"
          </h2>
          <p style={{ color: palette.mutedTextColor }} className="text-xs font-sans font-medium max-w-lg mx-auto">
            আমরা প্রতিটি পণ্যের গুণগত মান ও বিশুদ্ধতা বজায় রেখে আপনাদের কাছে সেরা শপিং অভিজ্ঞতা পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ।
          </p>

          <div className="pt-4 flex justify-center">{renderSocials()}</div>

          <div style={{ borderColor: palette.borderColor }} className="pt-8 border-t font-sans flex flex-col sm:flex-row items-center justify-between gap-4">
            <p style={{ color: palette.mutedTextColor }} className="text-xs font-bold">© {new Date().getFullYear()} {shopName}</p>
            {renderAttribution()}
          </div>
        </div>
      </footer>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER E: MARKETPLACE HUB
  // ══════════════════════════════════════════════════════════════════
  if (fStyle === 'marketplace') {
    return (
      <footer style={containerStyle} className="pt-12 pb-6 px-4 border-t-2 border-amber-500 transition-colors duration-200">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Marketplace Features Strip */}
          <div 
            style={{ 
              backgroundColor: palette.cardBg, 
              borderColor: palette.cardBorder 
            }} 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl border shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-amber-400 shrink-0" size={20} />
              <div><p style={{ color: palette.headingColor }} className="text-xs font-black">100% নিরাপদ পেমেন্ট</p><p style={{ color: palette.mutedTextColor }} className="text-[10px]">এসএসএল এনক্রিপ্টেড</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="text-amber-400 shrink-0" size={20} />
              <div><p style={{ color: palette.headingColor }} className="text-xs font-black">সারাদেশে হোম ডেলিভারি</p><p style={{ color: palette.mutedTextColor }} className="text-[10px]">দ্রুততম কুরিয়ার সেবা</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw className="text-amber-400 shrink-0" size={20} />
              <div><p style={{ color: palette.headingColor }} className="text-xs font-black">সহজ রিটার্ন পলিসি</p><p style={{ color: palette.mutedTextColor }} className="text-[10px]">ঝামেলাবিহীন সমাধান</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="text-amber-400 shrink-0" size={20} />
              <div><p style={{ color: palette.headingColor }} className="text-xs font-black">ডেডিকেটেড সাপোর্ট</p><p style={{ color: palette.mutedTextColor }} className="text-[10px]">{displayPhone}</p></div>
            </div>
          </div>

          <div style={{ borderColor: palette.borderColor }} className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p style={{ color: palette.mutedTextColor }} className="text-xs font-bold">© {new Date().getFullYear()} {shopName} Marketplace</p>
            {renderAttribution()}
          </div>
        </div>
      </footer>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER F: FRESH GROCERY
  // ══════════════════════════════════════════════════════════════════
  if (fStyle === 'grocery_fresh') {
    return (
      <footer style={containerStyle} className="pt-12 pb-6 px-4 border-t-4 border-emerald-500 transition-colors duration-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div className="space-y-2">
            <h3 style={{ color: palette.headingColor }} className="text-lg font-black">🥬 {shopName}</h3>
            <p style={{ color: palette.mutedTextColor }} className="text-xs leading-relaxed font-medium">{customTagline}</p>
            <div className="pt-2">{renderSocials()}</div>
          </div>
          <div className="space-y-2">
            <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-wider">ডেলিভারি হটলাইন</h4>
            <p style={{ color: palette.headingColor }} className="text-base font-black">{displayPhone}</p>
            <p style={{ color: palette.mutedTextColor }} className="text-xs">সকাল ৮টা থেকে রাত ১১টা পর্যন্ত খোলা</p>
          </div>
          <div className="space-y-2">
            <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-wider">নিরাপদ পেমেন্ট</h4>
            {renderPaymentLogos()}
          </div>
        </div>

        <div style={{ borderColor: palette.borderColor }} className="max-w-7xl mx-auto border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p style={{ color: palette.mutedTextColor }} className="text-xs font-bold">© {new Date().getFullYear()} {shopName} Fresh Produce</p>
          {renderAttribution()}
        </div>
      </footer>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER G: FASHION & LIFESTYLE
  // ══════════════════════════════════════════════════════════════════
  if (fStyle === 'fashion_lifestyle') {
    return (
      <footer style={containerStyle} className="py-12 px-4 border-t transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-6">
          <h2 style={{ color: palette.headingColor }} className="text-2xl font-black tracking-tight">{shopName}</h2>
          <p style={{ color: palette.mutedTextColor }} className="text-xs max-w-md italic">"{customTagline}"</p>
          <div className="flex gap-4">{renderSocials()}</div>
          <div style={{ borderColor: palette.borderColor }} className="border-t w-full pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p style={{ color: palette.mutedTextColor }} className="text-xs font-bold">© {new Date().getFullYear()} {shopName} Lifestyle</p>
            {renderAttribution()}
          </div>
        </div>
      </footer>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER H: TECH & ELECTRONICS HUB
  // ══════════════════════════════════════════════════════════════════
  if (fStyle === 'electronics_tech') {
    return (
      <footer style={containerStyle} className="border-t-2 border-blue-600 pt-12 pb-6 px-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 style={{ color: palette.headingColor }} className="text-base font-black">{shopName} Tech Support</h3>
            <p style={{ color: palette.mutedTextColor }} className="text-xs mt-2 leading-relaxed">{customTagline}</p>
          </div>
          <div>
            <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-wider">অফিশিয়াল সেবা</h4>
            <p style={{ color: palette.mutedTextColor }} className="text-xs mt-1">১০০% ব্র্যান্ড নিউ পণ্য এবং অফিসিয়াল গ্যারান্টি রিপ্লেসমেন্ট সাপোর্ট।</p>
          </div>
          <div>
            <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-wider">যোগাযোগ</h4>
            <p style={{ color: palette.mutedTextColor }} className="text-xs mt-1">{displayPhone} • {displayEmail}</p>
          </div>
        </div>

        <div style={{ borderColor: palette.borderColor }} className="max-w-7xl mx-auto border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p style={{ color: palette.mutedTextColor }} className="text-xs font-bold">© {new Date().getFullYear()} {shopName} Electronics</p>
          {renderAttribution()}
        </div>
      </footer>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER I: LARGE TRUST & SECURITY FOOTER
  // ══════════════════════════════════════════════════════════════════
  if (fStyle === 'trust_badge') {
    return (
      <footer style={containerStyle} className="pt-10 pb-6 px-4 border-t transition-colors duration-200">
        <div className="max-w-7xl mx-auto space-y-6">
          <div 
            style={{ 
              backgroundColor: palette.cardBg, 
              borderColor: palette.cardBorder 
            }} 
            className="p-6 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={28} className="text-emerald-400 shrink-0" />
              <div>
                <h4 style={{ color: palette.headingColor }} className="text-sm font-black">১০০% সিকিউর ও ভেরিফাইড মার্চেন্ট</h4>
                <p style={{ color: palette.mutedTextColor }} className="text-xs">আপনার প্রতিটি অর্ডার বিডিরিটেইলার্স বায়ার প্রোটেকশন দ্বারা সুরক্ষিত।</p>
              </div>
            </div>
            {renderPaymentLogos()}
          </div>

          <div style={{ borderColor: palette.borderColor }} className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p style={{ color: palette.mutedTextColor }} className="text-xs font-bold">© {new Date().getFullYear()} {shopName}</p>
            {renderAttribution()}
          </div>
        </div>
      </footer>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER J: MODERN SPLIT SCREEN
  // ══════════════════════════════════════════════════════════════════
  return (
    <footer style={containerStyle} className="pt-14 pb-8 px-6 border-t transition-colors duration-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
        {/* Left Side */}
        <div className="md:col-span-5 space-y-4">
          <h2 style={{ color: palette.headingColor }} className="text-2xl font-black">{shopName}</h2>
          <p style={{ color: palette.mutedTextColor }} className="text-xs leading-relaxed max-w-sm">{customTagline}</p>
          <div className="pt-2">{renderSocials()}</div>
        </div>

        {/* Right Side */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-wider">ক্যাটাগরি</h4>
            <ul className="space-y-1.5 text-xs font-bold" style={{ color: palette.textColor }}>
              {safeCategories.slice(0, 5).map(c => {
                const catName = typeof c === 'object' ? (c.name || '') : String(c);
                return (
                  <li key={typeof c === 'object' ? (c.id || catName) : catName}>
                    <button onClick={() => onCategoryClick?.(catName)} className="hover:opacity-80 transition-opacity cursor-pointer">
                      → {catName}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-wider">নীতি ও সেবা</h4>
            <ul className="space-y-1.5 text-xs font-bold" style={{ color: palette.textColor }}>
              <li><Link href={`/shop/${shop?.subdomainSlug || shop?.shopSlug || ''}/privacy`} className="hover:opacity-80">প্রাইভেসি পলিসি</Link></li>
              <li><span className="opacity-90">রিটার্ন নীতি</span></li>
              <li><span className="opacity-90">ডেলিভারি শর্তাবলী</span></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 style={{ color: palette.primaryColor }} className="text-xs font-black uppercase tracking-wider">হটলাইন</h4>
            <p style={{ color: palette.headingColor }} className="text-xs font-bold">{displayPhone}</p>
            <p style={{ color: palette.mutedTextColor }} className="text-xs">{displayEmail}</p>
          </div>
        </div>
      </div>

      <div style={{ borderColor: palette.borderColor }} className="max-w-7xl mx-auto border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p style={{ color: palette.mutedTextColor }} className="text-xs font-bold">© {new Date().getFullYear()} {shopName} • All Rights Reserved</p>
        {renderAttribution()}
      </div>
    </footer>
  );
}
