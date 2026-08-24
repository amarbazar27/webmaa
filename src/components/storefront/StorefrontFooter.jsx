'use client';
import { useState } from 'react';
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
    badge: 'Standard 4-Col'
  },
  {
    id: 'mega_footer',
    label: 'Footer B — Mega Multi-Column',
    desc: 'মাল্টি-কলাম লিংকস, নিউজলেটার, পেমেন্ট আইকন ও ট্রাস্ট ব্যাজ',
    icon: '📰',
    badge: 'Rich & Detailed'
  },
  {
    id: 'minimal_bar',
    label: 'Footer C — Minimal Modern Bar',
    desc: 'কম্প্যাক্ট স্লিম কপিরাইট, সোশ্যাল আইকন ও প্রয়োজনীয় লিংক',
    icon: '⚡',
    badge: 'Sleek & Clean'
  },
  {
    id: 'editorial_story',
    label: 'Footer D — Editorial Brand Statement',
    desc: 'বড় ব্র্যান্ড স্লোগান/স্টোরি, সোশ্যাল হাফ ও সিগনেচার স্টাইল',
    icon: '📖',
    badge: 'Editorial & Story'
  },
  {
    id: 'marketplace',
    label: 'Footer E — Marketplace Hub',
    desc: 'কাস্টমার প্রোটেকশন, রিটার্ন পলিসি, পার্টনার্স ও পেমেন্ট',
    icon: '🏬',
    badge: 'Marketplace'
  },
  {
    id: 'grocery_fresh',
    label: 'Footer F — Fresh Grocery',
    desc: '১০০% ফ্রেশনেস গ্যারান্টি, কভারেজ এরিয়া ও হটলাইন সাপোর্ট',
    icon: '🥦',
    badge: 'Fresh & Daily'
  },
  {
    id: 'fashion_lifestyle',
    label: 'Footer G — Fashion & Lifestyle',
    desc: 'ব্র্যান্ড স্টোরি, কিউরেটেড কালেকশন ও ভিআইপি ক্লাব সাইনআপ',
    icon: '👗',
    badge: 'Fashion & Boutique'
  },
  {
    id: 'electronics_tech',
    label: 'Footer H — Tech & Electronics Hub',
    desc: 'ওয়ারেন্টি সাপোর্ট, অফিসিয়াল ব্র্যান্ডস ও সার্ভিস সেন্টার ইনফো',
    icon: '💻',
    badge: 'Tech & Gadgets'
  },
  {
    id: 'trust_badge',
    label: 'Footer I — Large Trust & Security',
    desc: '২৫৬-বিট এসএসএল সিকিউর চেকআউট ও জেনুইন প্রোডাক্ট শিল্ড',
    icon: '🛡️',
    badge: 'High Conversion'
  },
  {
    id: 'modern_split',
    label: 'Footer J — Modern Split Screen',
    desc: 'বামে ব্র্যান্ড ভিশন এবং ডানে দ্রুত নেভিগেশন ও সোশ্যাল হাব',
    icon: '✨',
    badge: 'Split Screen'
  },
];

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

  const fStyle = footerConfig?.style || 'classic_4col';
  const customTagline = footerConfig?.customTagline || shop?.slogan || 'সেরা অনলাইন কেনাকাটার বিশ্বস্ত ঠিকানা';
  const primary = themeVars?.primaryColor || themeVars?.['--sp-primary'] || shop?.primaryColor || '#6D28D9';
  const attributionStyle = footerConfig?.attributionStyle || 'option_a'; // option_a, option_b, option_c, option_d
  const attributionAlign = footerConfig?.attributionAlign || 'center'; // left, center, right

  const rawEmail = shop?.deliveryConfig?.contactEmail || shop?.ownerEmail || 'bdretailers26@gmail.com';
  const displayEmail = rawEmail.includes('no contact') ? 'bdretailers26@gmail.com' : rawEmail;
  const rawWa = shop?.deliveryConfig?.contactWhatsapp || shop?.socialLinks?.wa || '01734763306';
  const cleanWa = rawWa.replace(/[^0-9]/g, '');
  const displayPhone = rawWa.includes('no contact') ? '+8801734763306' : rawWa;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 4000);
    setNewsletterEmail('');
  };

  // ══════════════════════════════════════════════════════════════════
  // MANDATORY BDRETAILERS BRANDING ATTRIBUTION BADGE
  // Non-removable — Designed as a premium verified platform emblem
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
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-all group shadow-sm"
        >
          {/* Glowing Platform Icon */}
          <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-sm group-hover:scale-110 transition-transform">
            ⚡
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black tracking-tight text-white group-hover:text-purple-300 transition-colors">
              {text}
            </span>
            <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">
              {sub} • <span className="underline group-hover:text-amber-400">bdretailers.com</span>
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
    return (
      <div className="flex items-center gap-2 flex-wrap pt-2">
        {links.fb && (
          <a href={links.fb} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-xl bg-white/10 hover:bg-blue-600 flex items-center justify-center text-white transition-all">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        )}
        {links.wa && (
          <a href={`https://wa.me/${cleanWa}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-xl bg-white/10 hover:bg-emerald-600 flex items-center justify-center text-white transition-all">
            <MessageCircle size={16} />
          </a>
        )}
        {links.insta && (
          <a href={links.insta} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-xl bg-white/10 hover:bg-pink-600 flex items-center justify-center text-white transition-all">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
        )}
      </div>
    );
  };

  // Payment Badges
  const renderPaymentLogos = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-black text-slate-300 border border-white/10">bKash</span>
      <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-black text-slate-300 border border-white/10">Nagad</span>
      <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-black text-slate-300 border border-white/10">Rocket</span>
      <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-black text-slate-300 border border-white/10">Cash on Delivery</span>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // FOOTER A: CLASSIC 4-COLUMN
  // ══════════════════════════════════════════════════════════════════
  if (fStyle === 'classic_4col') {
    return (
      <footer className="bg-slate-900 text-white border-t border-slate-800 pt-12 pb-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-black text-white">{shop?.shopName || 'Store'}</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">{customTagline}</p>
            {renderSocials()}
          </div>

          {/* Col 2: Categories */}
          {footerConfig?.showCategories !== false && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider">জনপ্রিয় ক্যাটাগরি</h4>
              <ul className="space-y-2 text-xs font-bold text-slate-300">
                {categories.slice(0, 5).map(c => (
                  <li key={c.id || c.name}>
                    <button onClick={() => onCategoryClick?.(c.name)} className="hover:text-purple-400 transition-colors">
                      → {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Col 3: Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider">গ্রাহক সেবা ও নীতি</h4>
            <ul className="space-y-2 text-xs font-bold text-slate-300">
              <li><Link href={`/shop/${shop?.subdomainSlug || ''}/privacy`} className="hover:text-purple-400">প্রাইভেসি পলিসি</Link></li>
              <li><span>রিটার্ন ও রিফান্ড নীতি</span></li>
              <li><span>ডেলিভারি ট্র্যাকিং</span></li>
              <li><span>শর্তাবলী ও নিয়ম</span></li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          {footerConfig?.showContact !== false && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider">যোগাযোগ</h4>
              <div className="space-y-2 text-xs text-slate-300 font-bold">
                <p className="flex items-center gap-2"><Phone size={13} className="text-emerald-400" /> {displayPhone}</p>
                <p className="flex items-center gap-2"><Mail size={13} className="text-purple-400" /> {displayEmail}</p>
                <div className="pt-2">{renderPaymentLogos()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar with Mandatory Attribution */}
        <div className="max-w-7xl mx-auto border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 font-bold text-center md:text-left">
            © {new Date().getFullYear()} {shop?.shopName || 'Store'} — সর্বস্বত্ব সংরক্ষিত।
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
      <footer className="bg-slate-950 text-white border-t border-slate-800 pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Top Newsletter Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-slate-900 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">এক্সক্লুসিভ অফার ও ডিসকাউন্ট পেতে যুক্ত থাকুন</h3>
              <p className="text-xs text-slate-300 font-medium mt-1">সবার আগে ফ্ল্যাশ সেল ও ডিসকাউন্ট ভাউচারের নোটিফিকেশন পান।</p>
            </div>
            <form onSubmit={handleSubscribe} className="w-full md:w-auto flex gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder="আপনার ইমেইল অ্যাড্রেস লিখুন..."
                className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white placeholder:text-slate-400 outline-none focus:border-purple-400 w-full sm:w-72"
              />
              <button type="submit" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shrink-0 shadow-md">
                {subscribed ? 'যুক্ত হয়েছেন!' : 'সাবস্ক্রাইব'}
              </button>
            </form>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">About Store</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">{customTagline}</p>
              {renderSocials()}
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Departments</h4>
              <ul className="space-y-2 text-xs font-bold text-slate-300">
                {categories.slice(0, 6).map(c => (
                  <li key={c.id || c.name}><button onClick={() => onCategoryClick?.(c.name)} className="hover:text-amber-400">→ {c.name}</button></li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Support & Policy</h4>
              <ul className="space-y-2 text-xs font-bold text-slate-300">
                <li><span>অর্ডার ট্র্যাক করুন</span></li>
                <li><span>রিফান্ড ও রিটার্ন</span></li>
                <li><span>পেমেন্ট মেথডস</span></li>
                <li><span>প্রাইভেসি ও শর্তাবলী</span></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Verified Merchant</h4>
              <p className="text-xs text-slate-400">২৪/৭ অনলাইন অর্ডার ও দ্রুততম কুরিয়ার হোম ডেলিভারি সাপোর্ট।</p>
              {renderPaymentLogos()}
            </div>
          </div>

          {/* Attribution */}
          <div className="border-t border-slate-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 font-bold">© {new Date().getFullYear()} {shop?.shopName} • All Rights Reserved</p>
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
      <footer className="bg-white border-t border-slate-200 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="font-black text-slate-900 text-sm">{shop?.shopName || 'Store'}</span>
            <span className="text-xs text-slate-400 hidden sm:inline">|</span>
            <span className="text-xs text-slate-500 font-medium truncate max-w-xs">{customTagline}</span>
          </div>

          <div className="flex items-center gap-4">
            {renderSocials()}
            <Link href={`/shop/${shop?.subdomainSlug || ''}/privacy`} className="text-xs font-bold text-slate-500 hover:text-purple-600">
              Privacy
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-slate-400 font-bold">© {new Date().getFullYear()} {shop?.shopName}</p>
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
      <footer className="bg-stone-900 text-stone-100 py-16 px-6 font-serif border-t border-stone-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-sans font-black">OUR SIGNATURE PROMISE</span>
          <h2 className="text-2xl sm:text-4xl font-normal leading-relaxed text-stone-100 italic">
            "{customTagline}"
          </h2>
          <p className="text-xs text-stone-400 font-sans font-medium max-w-lg mx-auto">
            আমরা প্রতিটি পণ্যের গুণগত মান ও বিশুদ্ধতা বজায় রেখে আপনাদের কাছে সেরা শপিং অভিজ্ঞতা পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ।
          </p>

          <div className="pt-4 flex justify-center">{renderSocials()}</div>

          <div className="pt-8 border-t border-stone-800 font-sans flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-stone-400">© {new Date().getFullYear()} {shop?.shopName}</p>
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
      <footer className="bg-slate-900 text-slate-100 pt-12 pb-6 px-4 border-t-2 border-amber-500">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Marketplace Features Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-amber-400 shrink-0" size={20} />
              <div><p className="text-xs font-black text-white">100% নিরাপদ পেমেন্ট</p><p className="text-[10px] text-slate-400">এসএসএল এনক্রিপ্টেড</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="text-amber-400 shrink-0" size={20} />
              <div><p className="text-xs font-black text-white">সারাদেশে হোম ডেলিভারি</p><p className="text-[10px] text-slate-400">দ্রুততম কুরিয়ার সেবা</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw className="text-amber-400 shrink-0" size={20} />
              <div><p className="text-xs font-black text-white">সহজ রিটার্ন পলিসি</p><p className="text-[10px] text-slate-400">ঝামেলাবিহীন সমাধান</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="text-amber-400 shrink-0" size={20} />
              <div><p className="text-xs font-black text-white">ডেডিকেটেড সাপোর্ট</p><p className="text-[10px] text-slate-400">{displayPhone}</p></div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 font-bold">© {new Date().getFullYear()} {shop?.shopName} Marketplace</p>
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
      <footer className="bg-emerald-950 text-white pt-12 pb-6 px-4 border-t-4 border-emerald-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div className="space-y-2">
            <h3 className="text-lg font-black text-emerald-300">🥬 {shop?.shopName || 'Fresh Grocery'}</h3>
            <p className="text-xs text-emerald-100/80 leading-relaxed font-medium">{customTagline}</p>
            <div className="pt-2">{renderSocials()}</div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">ডেলিভারি হটলাইন</h4>
            <p className="text-base font-black text-white">{displayPhone}</p>
            <p className="text-xs text-emerald-200">সকাল ৮টা থেকে রাত ১১টা পর্যন্ত খোলা</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">নিরাপদ পেমেন্ট</h4>
            {renderPaymentLogos()}
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-emerald-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-emerald-400 font-bold">© {new Date().getFullYear()} {shop?.shopName} Fresh Produce</p>
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
      <footer className="bg-slate-950 text-white py-12 px-4 border-t border-purple-900/40">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-6">
          <h2 className="text-2xl font-black tracking-tight text-white">{shop?.shopName}</h2>
          <p className="text-xs text-slate-400 max-w-md italic">"{customTagline}"</p>
          <div className="flex gap-4">{renderSocials()}</div>
          <div className="border-t border-slate-900 w-full pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-bold">© {new Date().getFullYear()} {shop?.shopName} Lifestyle</p>
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
      <footer className="bg-slate-950 text-slate-200 border-t-2 border-blue-600 pt-12 pb-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-base font-black text-blue-400">{shop?.shopName} Tech Support</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{customTagline}</p>
          </div>
          <div>
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider">অফিশিয়াল সেবা</h4>
            <p className="text-xs text-slate-300 mt-1">১০০% ব্র্যান্ড নিউ পণ্য এবং অফিসিয়াল গ্যারান্টি রিপ্লেসমেন্ট সাপোর্ট।</p>
          </div>
          <div>
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider">যোগাযোগ</h4>
            <p className="text-xs text-slate-300 mt-1">{displayPhone} • {displayEmail}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-bold">© {new Date().getFullYear()} {shop?.shopName} Electronics</p>
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
      <footer className="bg-slate-900 text-white pt-10 pb-6 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={28} className="text-emerald-400" />
              <div>
                <h4 className="text-sm font-black text-white">১০০% সিকিউর ও ভেরিফাইড মার্চেন্ট</h4>
                <p className="text-xs text-slate-400">আপনার প্রতিটি অর্ডার বিডিরিটেইলার্স বায়ার প্রোটেকশন দ্বারা সুরক্ষিত।</p>
              </div>
            </div>
            {renderPaymentLogos()}
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 font-bold">© {new Date().getFullYear()} {shop?.shopName}</p>
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
    <footer className="bg-slate-900 text-white pt-14 pb-8 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
        {/* Left Side: 5 Cols */}
        <div className="md:col-span-5 space-y-4">
          <h2 className="text-2xl font-black text-white">{shop?.shopName}</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">{customTagline}</p>
          <div className="pt-2">{renderSocials()}</div>
        </div>

        {/* Right Side: 7 Cols */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider">ক্যাটাগরি</h4>
            <ul className="space-y-1.5 text-xs text-slate-300 font-bold">
              {categories.slice(0, 5).map(c => (
                <li key={c.id || c.name}><button onClick={() => onCategoryClick?.(c.name)} className="hover:text-purple-400">→ {c.name}</button></li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider">নীতি ও সেবা</h4>
            <ul className="space-y-1.5 text-xs text-slate-300 font-bold">
              <li><Link href={`/shop/${shop?.subdomainSlug || ''}/privacy`}>প্রাইভেসি পলিসি</Link></li>
              <li><span>রিটার্ন নীতি</span></li>
              <li><span>ডেলিভারি শর্তাবলী</span></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider">হটলাইন</h4>
            <p className="text-xs text-slate-300 font-bold">{displayPhone}</p>
            <p className="text-xs text-slate-400">{displayEmail}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500 font-bold">© {new Date().getFullYear()} {shop?.shopName} • All Rights Reserved</p>
        {renderAttribution()}
      </div>
    </footer>
  );
}
