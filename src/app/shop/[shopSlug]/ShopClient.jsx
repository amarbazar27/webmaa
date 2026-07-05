'use client';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import useLocation from '@/lib/useLocation';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { ShoppingBag, Search, X, Plus, Minus, Phone, MapPin, 
  CheckCircle, Package, ArrowRight, Loader2, ShoppingCart, Edit2,
  User, Download, LogOut, ArrowUpDown, Bot, MessageCircle, AlertCircle, Share, Settings,
  ChevronLeft, ChevronRight, Sparkles, Star, Flame, Gift, ExternalLink, Menu, Tag,
  Truck, ShieldCheck, Clock, PlayCircle, ImagePlus, HelpCircle } from 'lucide-react';
import { placeOrder, getOrderSerial, getUserStreak } from '@/lib/firestore';
import { logoutUser, loginWithGoogle } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { saveUserData } from '@/lib/firestore';
import Logo from '@/components/ui/Logo';
import Image from 'next/image';
import { useNetworkStatus } from '@/lib/useNetworkStatus';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import { savePendingOrder, getPendingOrders, removePendingOrder, saveCartIDB, loadCartIDB } from '@/lib/offlineDB';
import MessengerButton from '@/components/shop/MessengerButton';
import StoreAnalytics, { trackStoreEvent } from '@/components/shop/StoreAnalytics';
import dynamic from 'next/dynamic';
import { TEMPLATES } from '@/templates/index';
import ServiceBanner from '@/components/shop/ServiceBanner';
import NotificationBanner from '@/components/shop/NotificationBanner';
import NotificationPermissionModal from '@/components/shared/NotificationPermissionModal';
import NotificationInbox from '@/components/shared/NotificationInbox';

const AiShoppingList = dynamic(() => import('@/components/shop/AiShoppingList'), { ssr: false });
const AiVoicePanel = dynamic(() => import('@/components/shop/AiVoicePanel'), { ssr: false });
const SmartMealEngine = dynamic(() => import('@/components/shop/SmartMealEngine'), { ssr: false });
const ReviewSection = dynamic(() => import('@/components/shop/ReviewSection'), { ssr: false });
const MapModal = dynamic(() => import('@/components/shop/MapModal'), { ssr: false });

// Product detail modal component imports
import ProductImage from '@/features/product/components/ProductImage';
import ProductInfo from '@/features/product/components/ProductInfo';
import ProductVariants from '@/features/product/components/ProductVariants';
import LegacySizes from '@/features/product/components/LegacySizes';
import ProductQuantity from '@/features/product/components/ProductQuantity';
import AiCustomization from '@/features/product/components/AiCustomization';
import SmartCalculator from '@/features/product/components/SmartCalculator';
import ProductActions from '@/features/product/components/ProductActions';

import { sanitizeProductData } from '@/features/product/utils/safeObjects';
import { calculateBasePrice } from '@/features/product/utils/price';
import { handleAiCalculate } from '@/features/product/actions/aiActions';
import { useProductLogic } from '@/features/product/hooks/useProductLogic';

// Common Phonetic Transliteration Dictionary for English-to-Bengali product searches
const COMMON_PHONETIC_DICT = {
  'alu': 'আলু',
  'potol': 'পটল',
  'peyaj': 'পেঁয়াজ',
  'peyaz': 'পেঁয়াজ',
  'piyaj': 'পেঁয়াজ',
  'piyaz': 'পেঁয়াজ',
  'ada': 'আদা',
  'roshun': 'রসুন',
  'rosun': 'রসুন',
  'gajor': 'গাজর',
  'gajur': 'গাজর',
  'chal': 'চাল',
  'dal': 'ডাল',
  'tel': 'তেল',
  'dim': 'ডিম',
  'dudh': 'দুধ',
  'murgi': 'মুরগি',
  'goru': 'গরু',
  'khashi': 'খাসি',
  'khasi': 'খাসি',
  'mach': 'মাছ',
  'lobon': 'লবণ',
  'nobon': 'লবণ',
  'masala': 'মসলা',
  'moshla': 'মসলা',
  'morich': 'মরিচ',
  'mors': 'মরিচ',
  'holud': 'হলুদ',
  'jira': 'জিরা',
  'lebu': 'লেবু',
  'kola': 'কলা',
  'am': 'আম',
  'kathal': 'কাঁঠাল',
  'pepe': 'পেঁপে',
  'tomato': 'টমেটো',
  'ghee': 'ঘি',
  'modhu': 'মধু',
  'chini': 'চিনি',
  'sobji': 'সবজি',
  'shobji': 'সবজি',
  'torkari': 'তরকারি',
  'gos': 'মাংস',
  'mangsho': 'মাংস',
  'pani': 'পানি',
  'jol': 'জল',
  'cha': 'চা',
  'coffee': 'কফি',
  'kopi': 'কপি',
  'cabbage': 'বাঁধাকপি',
  'bandhakopi': 'বাঁধাকপি',
  'fulkopi': 'ফুলকপি',
  'cauliflower': 'ফুলকপি',
  'lau': 'লাউ',
  'kumra': 'কুমড়া',
  'kumro': 'কুমড়া',
  'begun': 'বেগুন',
  'khero': 'ক্ষীরা',
  'shosa': 'শসা',
  'sosa': 'শসা',
  'krola': 'করলা',
  'korola': 'করলা',
  'bhendi': 'ঢেঁড়স',
  'dherosh': 'ঢেঁড়স',
  'dheros': 'ঢেঁড়স'
};

function normalizePhonetic(text) {
  if (!text) return '';
  let t = text.toLowerCase().trim();
  
  const banglaToEnglishMap = {
    'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'r',
    'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'g',
    'চ': 'ch', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'r', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
    'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'r', 'ে': 'e',
    'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', '্য': 'y', '্র': 'r', 'র্': 'r', '্ব': 'b'
  };
  
  let mappedStr = '';
  for (let i = 0; i < t.length; i++) {
    const char = t[i];
    mappedStr += banglaToEnglishMap[char] || char;
  }
  
  mappedStr = mappedStr
    .replace(/sh/g, 's')
    .replace(/ph/g, 'f')
    .replace(/kh/g, 'k')
    .replace(/bh/g, 'b')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/ch/g, 'c')
    .replace(/gh/g, 'g')
    .replace(/z/g, 'j')
    .replace(/c/g, 'k');
    
  let vowelLess = '';
  for (let i = 0; i < mappedStr.length; i++) {
    const char = mappedStr[i];
    if (!['a', 'e', 'i', 'o', 'u', 'y', 'w', 'h'].includes(char)) {
      vowelLess += char;
    }
  }
  return vowelLess;
}

const matchPhoneticSearch = (product, queryText) => {
  if (!queryText) return true;
  const q = queryText.toLowerCase().trim();
  
  const prodName = (product.name || '').toLowerCase().trim();
  const prodCategory = (product.category || '').toLowerCase().trim();
  const prodDesc = (product.description || '').toLowerCase().trim();
  
  if (prodName.includes(q) || prodCategory.includes(q) || prodDesc.includes(q)) {
    return true;
  }
  
  // Check phonetic dict matches
  for (const [eng, bng] of Object.entries(COMMON_PHONETIC_DICT)) {
    if (q.includes(eng) && prodName.includes(bng)) {
      return true;
    }
  }
  
  // Vowel-insensitive character transliteration
  const qNorm = normalizePhonetic(q);
  if (qNorm.length >= 2) {
    const nameNorm = normalizePhonetic(prodName);
    const catNorm = normalizePhonetic(prodCategory);
    if (nameNorm.includes(qNorm) || catNorm.includes(qNorm)) {
      return true;
    }
  }
  
  return false;
};



// ══════════════════════════════════════════════════════════════════
// 🎨 SHOP THEME ENGINE — WCAG AA contrast-safe presets
// Each preset: text/headerText/btnText are ALWAYS readable on their bg.
// Rule: dark bg → light text | light bg → dark text (NO EXCEPTIONS)
// ══════════════════════════════════════════════════════════════════
const SHOP_THEME_PRESETS = {
  // Light bg presets — use dark text (#0f172a or similar)
  classic:  { primary: '#4f46e5', accent: '#7c3aed', bg: '#ffffff',  text: '#0f172a', card: '#ffffff', border: '#e2e8f0', radius: '16px', font: 'Inter',  headerBg: 'linear-gradient(135deg, #4f46e5, #7c3aed)', headerText: '#ffffff',  btnText: '#ffffff' },
  forest:   { primary: '#059669', accent: '#34d399', bg: '#f0fdf4',  text: '#064e3b', card: '#ffffff', border: '#bbf7d0', radius: '12px', font: 'Inter',  headerBg: 'linear-gradient(135deg, #065f46, #047857)', headerText: '#ecfdf5',  btnText: '#ffffff' },
  sunset:   { primary: '#ea580c', accent: '#f97316', bg: '#fff7ed',  text: '#431407', card: '#ffffff', border: '#fed7aa', radius: '24px', font: 'Outfit', headerBg: 'linear-gradient(135deg, #c2410c, #ea580c)', headerText: '#ffffff',  btnText: '#ffffff' },
  ocean:    { primary: '#0284c7', accent: '#38bdf8', bg: '#f0f9ff',  text: '#0c4a6e', card: '#ffffff', border: '#bae6fd', radius: '16px', font: 'Inter',  headerBg: 'linear-gradient(135deg, #0369a1, #0284c7)', headerText: '#ffffff',  btnText: '#ffffff' },
  rose:     { primary: '#be185d', accent: '#f43f5e', bg: '#fff1f2',  text: '#4c0519', card: '#ffffff', border: '#fecdd3', radius: '20px', font: 'Outfit', headerBg: 'linear-gradient(135deg, #9f1239, #be185d)', headerText: '#ffffff',  btnText: '#ffffff' },
  minimal:  { primary: '#18181b', accent: '#71717a', bg: '#fafafa',  text: '#18181b', card: '#ffffff', border: '#e4e4e7', radius: '8px',  font: 'Inter',  headerBg: '#18181b',                                   headerText: '#fafafa',  btnText: '#ffffff' },
  royal:    { primary: '#7c3aed', accent: '#a78bfa', bg: '#faf5ff',  text: '#2e1065', card: '#ffffff', border: '#ddd6fe', radius: '24px', font: 'Outfit', headerBg: 'linear-gradient(135deg, #5b21b6, #7c3aed)', headerText: '#ffffff',  btnText: '#ffffff' },
  earth:    { primary: '#92400e', accent: '#d97706', bg: '#fffbeb',  text: '#451a03', card: '#ffffff', border: '#fde68a', radius: '16px', font: 'Inter',  headerBg: 'linear-gradient(135deg, #78350f, #92400e)', headerText: '#ffffff',  btnText: '#ffffff' },
  // Dark bg presets — MUST use light text (#f8fafc or similar)
  midnight: { primary: '#a5b4fc', accent: '#c084fc', bg: '#0f172a',  text: '#f8fafc', card: '#1e293b', border: '#334155', radius: '20px', font: 'Outfit', headerBg: 'linear-gradient(135deg, #1e1b4b, #312e81)', headerText: '#e0e7ff',  btnText: '#ffffff' },
  neon:     { primary: '#22d3ee', accent: '#a855f7', bg: '#020617',  text: '#f0fdfa', card: '#0f172a', border: '#1e293b', radius: '20px', font: 'Outfit', headerBg: 'linear-gradient(135deg, #0e7490, #7c3aed)', headerText: '#f0fdfa',  btnText: '#ffffff' },
};

/**
 * Builds the resolved theme object for a shop.
 * Merges preset + any retailer overrides saved in designOverrides.
 * SSR-safe: no window access.
 */
function buildShopTheme(shop) {
  // If template is set, resolve using template configuration!
  if (shop?.templateId && TEMPLATES[shop.templateId]) {
    const template = TEMPLATES[shop.templateId];
    const base = template.defaultTheme || {};
    const overrides = shop?.themeOverrides || {};
    const merged = { ...base, ...overrides };
    
    return {
      primary:    merged.primaryColor || merged.primary,
      accent:     merged.accentColor || merged.accent,
      bg:         merged.bgColor || merged.bg,
      text:       merged.textColor || merged.text,
      card:       merged.cardBg || merged.card,
      border:     merged.cardBorder || merged.border,
      radius:     merged.cardRadius || merged.radius,
      font:       merged.fontFamily || merged.font,
      headerBg:   merged.headerBg,
      headerText: merged.headerText,
      btnText:    merged.btnText || '#ffffff',
    };
  }

  const presetKey = shop?.designPreset || 'classic';
  const base = SHOP_THEME_PRESETS[presetKey] || SHOP_THEME_PRESETS.classic;
  const overrides = shop?.designOverrides || {};
  return { ...base, ...overrides };
}

/**
 * Converts theme object → CSS custom properties object
 * Applied as style on root div so all child elements can use var(--sp-*)
 */
function themeToVars(t) {
  return {
    '--sp-primary':     t.primary,
    '--sp-accent':      t.accent,
    '--sp-bg':          t.bg,
    '--sp-text':        t.text,
    '--sp-card':        t.card,
    '--sp-border':      t.border,
    '--sp-radius':      t.radius,
    '--sp-header-bg':   t.headerBg,
    '--sp-header-text': t.headerText,
    '--sp-btn-text':    t.btnText || '#ffffff',
    '--sp-font':        t.font || 'Inter',
  };
}

const CuteAIIcon = () => (
  <div className="relative w-12 h-12 flex items-center justify-center animate-bounce">
    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A5B4FC" />
          <stop offset="50%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="40" fill="url(#ai-grad)" filter="url(#shadow)" />
      <circle cx="35" cy="45" r="5" fill="white" />
      <circle cx="65" cy="45" r="5" fill="white" />
      <circle cx="35" cy="45" r="2" fill="#4B5563" />
      <circle cx="65" cy="45" r="2" fill="#4B5563" />
      <circle cx="25" cy="55" r="4" fill="#FDA4AF" opacity="0.6" />
      <circle cx="75" cy="55" r="4" fill="#FDA4AF" opacity="0.6" />
      <path d="M40,65 Q50,72 60,65" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </div>
);

function validatePhone(phone) {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+88)?01[3-9]\d{8}$/.test(cleaned);
}

// Deterministic bright colors for product fallbacks
const FALLBACK_COLORS = ['bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600', 'bg-fuchsia-600'];
function getFallbackColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

// ── Daily Streak Tracker UI ────────────────────────
function StreakTracker({ orders }) {
  const { streak, hasFreeDelivery, days } = getUserStreak(orders);
  const today = (() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`;
  })();

  return (
    <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-amber-400" />
          <span className="font-black text-sm">দৈনিক ধারা</span>
        </div>
        <span className="text-amber-400 font-black text-lg">{streak}/7</span>
      </div>

      {/* 7 day circles */}
      <div className="flex gap-2 mb-3 justify-between">
        {Array.from({ length: 7 }).map((_, i) => {
          const isDone = i < streak;
          const isToday = i === streak && days[0] !== today;
          return (
            <div key={i} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
              isDone 
                ? i === 5 ? 'bg-amber-400 text-amber-900' : 'bg-emerald-400 text-emerald-900'
                : isToday ? 'bg-white/20 text-white border-2 border-white/40 animate-pulse'
                : 'bg-white/10 text-white/40'
            }`}>
              {isDone ? (i === 5 ? '🎁' : '✓') : i + 1}
            </div>
          );
        })}
      </div>

      {hasFreeDelivery ? (
        <div className="bg-amber-400/20 border border-amber-400/40 rounded-xl p-3 text-center">
          <p className="text-amber-300 font-black text-sm">🎉 আজকে ফ্রি ডেলিভারি পাবেন!</p>
          <p className="text-amber-400/70 text-xs font-bold">অর্ডার করার সময় ক্লেইম করুন</p>
        </div>
      ) : (
        <p className="text-white/60 text-xs font-bold text-center">
          {streak === 0 ? 'প্রতিদিন অর্ডার করুন, ৬ দিন পর ৭ম দিনে ফ্রি ডেলিভারি!' : `আরও ${6 - Math.min(streak, 6)} দিন অর্ডার করুন → ৭ম দিনে ফ্রি ডেলিভারি`}
        </p>
      )}
    </div>
  );
}

// ── Service Area Detector ────────────────────────

// ── Live Countdown Component ──
function LiveCountdown({ deliveryETA }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!deliveryETA) return;
    
    // Parse timestamp
    const etaMillis = typeof deliveryETA.toMillis === 'function' 
      ? deliveryETA.toMillis() 
      : new Date(deliveryETA).getTime();
      
    const interval = setInterval(() => {
      const diff = etaMillis - Date.now();
      if (diff <= 0) {
        setTimeLeft('ডেলিভারি হয়ে যাওয়ার কথা');
        clearInterval(interval);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      
      const parts = [];
      if (d > 0) parts.push(`${d} দিন`);
      if (h > 0) parts.push(`${String(h).padStart(2,'0')} ঘণ্টা`);
      parts.push(`${String(m).padStart(2,'0')} মিনিট`);
      parts.push(`${String(s).padStart(2,'0')} সেঃ`);
      
      setTimeLeft(parts.join(' '));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [deliveryETA]);

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
      <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock size={12}/> লাইভ কাউন্টডাউন</p>
      <p className="text-sm font-black text-blue-900 font-mono tracking-wider">{timeLeft || 'হিসাব করা হচ্ছে...'}</p>
    </div>
  );
}


export default function ShopClient({ initialShop, initialProducts, initialCategories }) {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [shop, setShop] = useState(initialShop);
  const [products, setProducts] = useState(initialProducts || []);
  
  const isMesserBazar = shop.subdomainSlug === 'messerbazar' || shop.customDomain === 'messerbazar.com' || shop.shopName === 'Messer Bazar' || shop.shopName === 'মেসের বাজার';

  const [categories] = useState(() => {
    return (initialCategories || []).map(cat => {
      const sortedSubs = cat.subcategories ? [...cat.subcategories].sort((a, b) => a.localeCompare(b, 'bn')) : [];
      return { ...cat, subcategories: sortedSubs };
    }).sort((a, b) => {
      return (a.name || '').localeCompare(b.name || '', 'bn');
    });
  });
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');
  const { isOnline, isLiteMode, setLiteMode } = useNetworkStatus();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShowSplash(false), 1500); return () => clearTimeout(t); }, []);

  useEffect(() => {
    // Sync fresh shop and products configurations from Firestore to bypass Next.js ISR cache latency
    import('@/lib/firestore').then(async (lib) => {
      try {
        const freshShop = await lib.getShop(initialShop.id);
        if (freshShop) {
          setShop(prev => ({
            ...prev,
            enableCommonOrder: freshShop.enableCommonOrder ?? prev.enableCommonOrder,
            couponCode: freshShop.couponCode ?? prev.couponCode,
            couponDiscount: freshShop.couponDiscount ?? prev.couponDiscount,
            shopName: freshShop.shopName ?? prev.shopName,
            logoUrl: freshShop.logoUrl ?? prev.logoUrl,
            slogan: freshShop.slogan ?? prev.slogan,
          }));
        }
        const freshProducts = await lib.getShopProducts(initialShop.id);
        if (freshProducts && freshProducts.length > 0) {
          setProducts(freshProducts);
        }
      } catch (err) {
        console.error('Failed to sync real-time configurations:', err);
      }
    });
  }, [initialShop.id]);

  useEffect(() => {
    if (shop) {
      // 1. Real-time update of Document Title (Link Name)
      document.title = shop.slogan ? `${shop.shopName} – ${shop.slogan}` : shop.shopName;

      // 2. Real-time update of Favicon
      const firstLetter = shop.shopName ? shop.shopName.charAt(0).toUpperCase() : 'S';
      // Generate consistent color based on shop name
      let hash = 0;
      const name = shop.shopName || 'Shop';
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = Math.abs(hash % 360);
      const color = `hsl(${hue}, 70%, 50%)`;

      const svgFavicon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="100%" height="100%" fill="${encodeURIComponent(color)}" rx="8"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="18" font-family="system-ui, sans-serif" font-weight="900">${firstLetter}</text></svg>`;

      const faviconUrl = `/favicon.ico?v=${shop.logoUrl ? encodeURIComponent(shop.logoUrl) : 'default'}`;

      // Remove all existing icon links to prevent any conflict or caching of the main site icon
      const existingIcons = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon'], link[rel='shortcut icon']");
      existingIcons.forEach(el => el.remove());

      // Create new clean favicon link
      const iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      iconLink.href = faviconUrl;
      document.head.appendChild(iconLink);

      // Create new clean apple touch icon link
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = faviconUrl;
      document.head.appendChild(appleLink);

      // 3. Cache shop logo and name for instant loading page display
      if (shop.shopSlug || shop.subdomainSlug) {
        const slug = shop.shopSlug || shop.subdomainSlug;
        localStorage.setItem(`cached_shop_logo_${slug}`, JSON.stringify({
          logoUrl: shop.logoUrl || '',
          shopName: shop.shopName || ''
        }));
      }
    }
  }, [shop]);

  const prevOnlineRef = useRef(null);
  useEffect(() => {
    if (isOnline && prevOnlineRef.current === false) {
      getPendingOrders().then(orders => {
        if (orders && orders.length > 0) {
          toast('ইন্টারনেট সংযোগ ফিরে এসেছে! আপনার পেন্ডিং অর্ডারটি এখন পাঠানো হচ্ছে...', { icon: '🚀', duration: 4000 });
          setPendingOrdersCount(orders.length);
          orders.forEach(async (order) => {
            try {
              const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
              });
              if (res.ok) {
                await removePendingOrder(order.localId);
                setPendingOrdersCount(prev => Math.max(0, prev - 1));
                toast.success('অফলাইন অর্ডার সফলভাবে সম্পন্ন হয়েছে! 🎉');
              }
            } catch (e) {}
          });
        }
      });
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  const CART_KEY = `cart_${initialShop.id}`;
  const [cart, setCart] = useState([]);
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let initialCart = [];
      const local = localStorage.getItem(CART_KEY);
      if (local) {
        initialCart = JSON.parse(local);
      }
      
      // Check for importCart in URL query string
      const searchParams = new URLSearchParams(window.location.search);
      const importCartParam = searchParams.get('importCart');
      if (importCartParam) {
        try {
          const importedItems = JSON.parse(importCartParam);
          if (Array.isArray(importedItems)) {
            importedItems.forEach(item => {
              const uniqueId = item.id || `${item.productId}_${Date.now()}`;
              const existingIdx = initialCart.findIndex(i => 
                i.productId === item.productId && 
                (i.customizedText || '') === (item.customizedText || '')
              );
              if (existingIdx > -1) {
                initialCart[existingIdx].quantity += (Number(item.quantity) || 1);
              } else {
                initialCart.push({
                  id: uniqueId,
                  productId: item.productId,
                  name: item.name,
                  price: item.price,
                  quantity: Number(item.quantity) || 1,
                  imageUrl: item.imageUrl || '',
                  note: item.note || '',
                  customizedText: item.customizedText || ''
                });
              }
            });
            // Update URL query parameters cleanly
            const url = new URL(window.location.href);
            url.searchParams.delete('importCart');
            window.history.replaceState({}, '', url.toString());
            toast.success('কার্ট সফলভাবে সিঙ্ক হয়েছে! 🎉');
          }
        } catch (e) {
          console.error('Failed to import cart:', e);
        }
      }
      
      if (initialCart.length > 0) {
        setCart(initialCart);
      } else {
        loadCartIDB(initialShop.id).then(items => {
          if (items && items.length > 0) setCart(items);
        });
      }
    }
  }, [CART_KEY, initialShop.id]);

  // ── Cart Merge Logic (Guest -> Logged In User) ──
  const hasMergedCart = useRef(false);
  useEffect(() => {
    if (user?.uid && !hasMergedCart.current) {
      hasMergedCart.current = true;
      import('@/lib/firestore').then(async (lib) => {
        try {
          const remoteCart = await lib.getUserCart(user.uid, shop.id);
          if (remoteCart && remoteCart.length > 0) {
            setCart(prevCart => {
              if (prevCart.length === 0) return remoteCart;
              
              // Merge: Add remote items that are not in local cart
              const merged = [...prevCart];
              remoteCart.forEach(remoteItem => {
                const existing = merged.find(i => (i.id || i.productId) === (remoteItem.id || remoteItem.productId));
                if (!existing) {
                   merged.push(remoteItem);
                }
              });
              return merged;
            });
          }
        } catch (e) {
          console.warn('Cart merge failed:', e);
        }
      });
    }
  }, [user?.uid, shop.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && cart.length > 0) {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      saveCartIDB(initialShop.id, cart);
      if (user?.uid) {
        import('@/lib/firestore').then(lib => lib.saveUserCart(user.uid, shop.id, cart));
      }
    }
  }, [cart, CART_KEY, initialShop.id, user]);

  useEffect(() => {
    if (user && typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('returnToCheckout') === 'true') {
        sessionStorage.removeItem('returnToCheckout');
        if (cart.length > 0) {
          setIsOrderOpen(true);
        }
      }
    }
  }, [user, cart.length]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Coupon System states
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Common Order states
  const [isCommonOrderOpen, setIsCommonOrderOpen] = useState(false);
  const [commonOrderRows, setCommonOrderRows] = useState({}); // mapping productId -> { qty: '', price: '', piece: '', finalPrice: 0 }

  const [locationStatus, setLocationStatus] = useState('idle');
  const [detectedLocation, setDetectedLocation] = useState('');
  const [locationManualInput, setLocationManualInput] = useState('');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiTab, setAiTab] = useState('chat');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [productNotes, setProductNotes] = useState({});
  const [activeBanner, setActiveBanner] = useState(0);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const normalizedBanners = (shop?.banners || []).map(b => {
    if (typeof b === 'string') {
      return { url: b, title: '', description: '', linkUrl: '', buttonText: '' };
    }
    return {
      url: b?.url || '',
      title: b?.title || '',
      description: b?.description || '',
      linkUrl: b?.linkUrl || '',
      buttonText: b?.buttonText || ''
    };
  }).filter(b => b && b.url);

  // ── Swipe banner gestures ──
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || normalizedBanners.length <= 1) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setActiveBanner(prev => (prev === normalizedBanners.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe) {
      setActiveBanner(prev => (prev === 0 ? normalizedBanners.length - 1 : prev - 1));
    }
  };

  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '', note: '', txnId: '', paymentNumber: '', coordinates: null });
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(() => {
    return shop?.piprapayEnabled 
      ? 'automated' 
      : (shop?.manualPaymentEnabled !== false ? 'manual' : 'cod');
  });
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [orderImage, setOrderImage] = useState(null);
  const [localId, setLocalId] = useState(null);

  // Initialize unique checkout session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let lid = localStorage.getItem('webmaa_checkout_session_id');
      if (!lid) {
        lid = `ch_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        localStorage.setItem('webmaa_checkout_session_id', lid);
      }
      setLocalId(lid);
    }
  }, []);

  // Auto-save draft order (Incomplete order tracking)
  useEffect(() => {
    if (!localId || !shop?.id) return;
    if (!orderForm.name && !orderForm.phone && cart.length === 0) return;

    const timer = setTimeout(() => {
      fetch('/api/checkout/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          localId,
          customerName: orderForm.name,
          customerPhone: orderForm.phone,
          customerAddress: orderForm.address,
          total: cartTotal,
          items: cart.map(i => ({ id: i.productId || i.id, name: i.name, quantity: i.quantity, price: i.price }))
        })
      }).catch(err => console.warn('[Draft save failed]', err));
    }, 2000);

    return () => clearTimeout(timer);
  }, [orderForm.name, orderForm.phone, orderForm.address, cart, localId, shop?.id, cartTotal]);

  const handleDirectOrderFromAi = (items, image) => {
    setCart(items);
    setOrderImage(image);
    setIsOrderOpen(true);
    toast.success('অর্ডারের জন্য প্রস্তুত! নিচের তথ্যগুলো দিন।');
  };

  // Autofill from userData
  useEffect(() => {
    if (userData) {
      setOrderForm(f => ({
        ...f,
        name: f.name || userData.name || '',
        phone: f.phone || userData.phone || '',
        address: f.address || userData.address || '',
        paymentNumber: f.paymentNumber || userData.paymentNumber || userData.phone || ''
      }));
    }
  }, [userData]);

  // ── TRACKING HELPER ──
  const trackEvent = (name, params = {}) => {
    if (typeof window !== 'undefined') {
       // DEBUG LOG for user
       console.log(`[Analytics] Event: ${name}`, params);
       
       if (window.gtag) {
          window.gtag('event', name, {
            store_id: shop.id,
            store_name: shop.shopName,
            ...params
          });
       }
    }
  };
  // ── Register PWA Service Worker instantly to trigger beforeinstallprompt on first-visit ──
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
        .then(reg => {
          console.log('[PWA] SW registered immediately, scope:', reg.scope);
          // Inject Firebase config dynamically so it's SSR-safe
          const config = {
            apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          };
          const sendConfig = (sw) => {
            if (sw) sw.postMessage({ type: 'FIREBASE_CONFIG', config });
          };
          if (reg.installing) sendConfig(reg.installing);
          else if (reg.waiting) sendConfig(reg.waiting);
          else if (reg.active) sendConfig(reg.active);

          reg.addEventListener('updatefound', () => {
            const newSW = reg.installing;
            if (newSW) {
              newSW.addEventListener('statechange', () => {
                if (newSW.state === 'activated') sendConfig(newSW);
              });
            }
          });
        })
        .catch(err => {
          console.error('[PWA] SW registration failed:', err);
        });
    }
  }, []);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setPwaInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPrompt = e; // Store globally as robust fallback
      setPwaInstalled(false);
      localStorage.removeItem('pwa_installed'); // Reset if uninstalled
      
      const dismissed = sessionStorage.getItem(`pwa-prompt-${shop.shopSlug}-dismissed`);
      if (!dismissed) {
        setShowPwaBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installed = localStorage.getItem('pwa_installed');
    if (installed) {
      setPwaInstalled(true);
    } else {
      setPwaInstalled(false);
    }

    const onInstall = () => {
      setPwaInstalled(true);
      setShowPwaBanner(false);
      localStorage.setItem('pwa_installed', 'true');
    };
    window.addEventListener('appinstalled', onInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstall);
    };
  }, [shop.shopSlug]);

  const handleAppDownload = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setPwaInstalled(true);
        localStorage.setItem('pwa_installed', 'true');
        toast.success('অ্যাপ ইন্সটল হয়েছে! 🎉');
      }
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        toast('আইফোনে ইন্সটল করতে নিচে "Share" আইকনে ক্লিক করে "Add to Home Screen" নির্বাচন করুন।', { duration: 6000 });
      } else {
        const isIOS2 = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS2) {
        toast('আইফোনে: নিচের Share আইকন 🔗 → "Add to Home Screen" ট্যাপ করুন।', { icon: '📱', duration: 8000 });
      } else {
        // Try to trigger using window.deferredPrompt as fallback
        if (window.deferredPrompt) {
          window.deferredPrompt.prompt();
          window.deferredPrompt.userChoice.then(c => { if (c.outcome === 'accepted') { setPwaInstalled(true); localStorage.setItem('pwa_installed','true'); toast.success('অ্যাপ ইন্সটল হয়েছে! 🎉'); } });
        } else {
          toast('এই ব্রাউজারে সরাসরি ইন্সটল সম্ভব নয়। Chrome ব্যবহার করুন।', { icon: '💡', duration: 6000 });
        }
      }
      }
    }
  };

  // ── Banner Auto-slide ────────────────────────────
  useEffect(() => {
    if (normalizedBanners.length <= 1) return;
    const interval = parseInt(shop.bannerInterval) || 4;
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % normalizedBanners.length);
    }, interval * 1000);
    return () => clearInterval(timer);
  }, [normalizedBanners.length, shop.bannerInterval]);

  // ── Fetch User Orders ───────────────────────────
  useEffect(() => {
    import('@/lib/firestore').then(lib => {
      if (user?.email && shop?.id) {
        setLoadingOrders(true);
        lib.getUserOrders(shop.id, user.email)
          .then(setUserOrders)
          .finally(() => setLoadingOrders(false));
      } else {
        setUserOrders([]);
      }
    });
  }, [user, shop?.id]);

  const handleLogout = async () => {
    try {
      if (user) {
        await logoutUser();
        toast.success('সফলভাবে লগআউট হয়েছে');
      }
      setIsProfileOpen(false);
      window.location.reload();
    } catch {
      toast.error('লগআউট করতে সমস্যা হয়েছে');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      // result is null when redirect flow started (page will auto-reload after Google login)
      if (result) {
        toast.success('সফলভাবে লগইন হয়েছে!');
        setIsProfileOpen(false);
        // If returnToCheckout flag set, reopen the order modal
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('returnToCheckout') === 'true') {
          sessionStorage.removeItem('returnToCheckout');
          if (cart.length > 0) setTimeout(() => setIsOrderOpen(true), 300);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized')) {
        toast.error('ডোমেইনটি ফায়ারবেসে যোগ নেই। শপমালিককে জানান। (Unauthorized Domain)', { duration: 6000 });
      } else {
        toast.error(`লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন। [${err?.code || err?.message || 'Unknown'}]`, { duration: 6000 });
      }
    }
  };

  const handleEmailLogin = async () => {
    if (!loginEmail || !loginPassword) { toast.error('ইমেইল ও পাসওয়ার্ড দিন।'); return; }
    setLoginLoading(true);
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/auth');
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast.success('লগইন সফল! 🎉');
      setShowLoginModal(false);
      setLoginEmail(''); setLoginPassword('');
      if (cart.length > 0) setTimeout(() => setIsOrderOpen(true), 300);
    } catch (err) {
      toast.error(`লগইন ব্যর্থ: ${err?.code === 'auth/wrong-password' ? 'পাসওয়ার্ড ভুল' : err?.code === 'auth/user-not-found' ? 'ইমেইল পাওয়া যায়নি' : err.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    let interval = null;
    if (otpSent && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && otpSent) {
      setOtpSent(false);
      setOtpCode('');
      toast.error('ওটিপির মেয়াদ শেষ হয়ে গেছে! অনুগ্রহ করে পুনরায় ওটিপি পাঠান।');
    }
    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  const formatOtpTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async () => {
    if (!loginEmail || !loginEmail.includes('@')) {
      toast.error('অনুগ্রহ করে একটি সঠিক ইমেইল আইডি দিন।');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'ওটিপি পাঠানো হয়েছে! আপনার ইনবক্স চেক করুন।');
        setOtpSent(true);
        setOtpTimer(120); // 2 minutes countdown
      } else {
        toast.error(data.error || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      toast.error('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error('৬ ডিজিটের সঠিক ওটিপি লিখুন।');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, otp: otpCode })
      });
      const data = await res.json();
      if (res.ok && data.customToken) {
        const { signInWithCustomToken } = await import('firebase/auth');
        const { auth } = await import('@/lib/auth');
        const userCredential = await signInWithCustomToken(auth, data.customToken);
        
        const { handleUserSession } = await import('@/lib/auth');
        await handleUserSession(userCredential.user);

        toast.success('লগইন সফল! 🎉');
        setShowLoginModal(false);
        setIsProfileOpen(false);
        setLoginEmail('');
        setOtpCode('');
        setOtpSent(false);
        if (cart.length > 0) setTimeout(() => setIsOrderOpen(true), 300);
      } else {
        toast.error(data.error || 'ভুল ওটিপি কোড।');
      }
    } catch (err) {
      toast.error('ওটিপি ভেরিফিকেশন ব্যর্থ হয়েছে।');
    } finally {
      setOtpLoading(false);
    }
  };


  // ── AI Chat ────────────────────────────────────
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: 'bot', text: `আসসালামু আলাইকুম! আমি ${shop.aiConfig?.botName || 'Daripallah AI'}। ${shop.shopName}-এ আপনাকে স্বাগতম। কোনো প্রশ্ন থাকলে করুন!` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showAiSuggestionModal, setShowAiSuggestionModal] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({ members: '', budget: '' });

  const getSmartBotReply = (text) => {
    const q = text.toLowerCase();
    const deliveryFee = shop.settings?.deliveryFee || shop.deliveryConfig?.advanceFee || 60;
    if (q.includes('delivery') || q.includes('ডেলিভারি')) return `ডেলিভারি চার্জ: ৳${deliveryFee}। ${shop.deliveryConfig?.isCOD ? 'ক্যাশ অন ডেলিভারি প্রযোজ্য।' : 'শুধুমাত্র অগ্রিম পেমেন্টে ডেলিভারি হবে।'}`;
    if (q.includes('payment') || q.includes('পেমেন্ট')) return `পেমেন্ট করতে পারেন: ${shop.deliveryConfig?.methods || 'বিকাশ/নগদ'}`;
    return `আমি আপনার প্রশ্নের উত্তর দেওয়ার চেষ্টা করছি। ড্যাশবোর্ড থেকে AI API সেটআপ করলে আরো সঠিক উত্তর পাবেন।`;
  };

  const sendChatMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);
    try {
      const resp = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          botTone: shop.aiConfig?.botTone || 'friendly',
          orderHistory: (userOrders || []).slice(0, 5).map(o => ({ id: o.id, orderIdVisual: o.orderIdVisual, total: o.total, items: (o.items || []).map(i => ({ name: i.name, quantity: i.quantity, price: i.price })) })),
    messages: [
            { role: 'system', content: `তুমি "${shop.shopName}"-এর AI বাজার সহকারী। নাম: ${shop.aiConfig?.botName || 'Bazar Bot'}।
${(shop.shopName === 'Messer Bazar' || shop.shopName === 'মেসের বাজার' || shop.subdomainSlug === 'messerbazar') ? 'বিশেষ দ্রষ্টব্য: বাংলায় এই স্টোরের নাম সর্বদা "মেসের বাজার" বলবে (কখনো "মেসার বাজার" বলবে না)।' : ''}

পণ্য তালিকা (ID|নাম|দাম|ইউনিট):
${products.filter(p => p.stock !== 0).map(p => `${p.id}|${p.name}|৳${p.price}|${p.unit || 'piece'}`).join('\n')}

🔴 বিশেষ নির্দেশ (স্মার্ট ক্যালকুলেটর):
${isGroceryShop ? `১. যদি ইউজার নির্দিষ্ট টাকার (যেমন: ৫০০ টাকার মাংস) বা নির্দিষ্ট ওজনের (যেমন: ৩৫০ গ্রাম আলু) কথা বলে, তবে সেটা ক্যালকুলেট করবে。
২. যদি প্রোডাক্টের বেস ইউনিট ১ কেজি হয় এবং ইউজার ৪০০ গ্রাম চায়, তবে qty ১ ই রাখবে কিন্তু note এবং customizedText এ '৪০০ গ্রাম' স্পষ্টভাবে লিখে দিবে।
৩. মাছ বা মাংসের ক্ষেত্রে পিস (Piece) উল্লেখ থাকলে, মোট ওজন বের করবে এবং প্রতি পিসের গড় ওজন নোটে লিখে দিবে।
৪. যদি ইউজার মেস বাজেট, প্রতিদিনের খাবারের তালিকা বা মেনু নির্ধারণ করতে বলে, তবে সেই নির্দেশনা এবং বাজেট অনুযায়ী তালিকা প্রস্তাব করবে। বয়লার মুরগির পিস সাজেস্ট করবে না, বরং আস্ত মুরগি নিয়ে পিস করে নিতে বলবে। সকালে ভর্তা বা শাক এবং দুপুরে/রাতে আমিষ ও সবজি সাজেস্ট করবে।` : `১. দোকানটিতে যে ধরণের পণ্য আছে (যেমন কসমেটিক্স, ফ্যাশন বা ইলেকট্রনিক্স) শুধুমাত্র সেই রিলেটেড ক্যাটাগরির পণ্যই রেকমেন্ড করবে。
২. গ্রোসারি পণ্য (চাল, ডাল, শাকসবজি) বা খাবারের মেনু সাজেস্ট করবে না যদি না দোকানটি গ্রোসারি স্টোর হয়।`}
৫. উত্তর সবসময় সম্পূর্ণ করবে।
৬. উত্তর শেষে PRODUCTS_JSON ফরম্যাটে ডাটা দিবে।

FORMAT: PRODUCTS_JSON:[{"id":"ID","qty":1,"note":"৪০০ গ্রাম","customizedText":"৪০০ গ্রাম"}]

৭. বাংলায় লেখো, উত্তর সংক্ষিপ্ত কিন্তু সম্পূর্ণ রাখো।
৮. পণ্য তালিকার বাইরে থাকা কোনো পণ্য বা সেবার অর্ডার নিবে না বা সাজেস্ট করবে না। শুধুমাত্র প্রদত্ত পণ্য তালিকার পণ্যই রেকমেন্ড করবে।
৯. একই পণ্যের বিভিন্ন রূপ (পিস বনাম কেজি): যদি কোনো পণ্যের একই নামে একাধিক ভেরিয়েশন/ইউনিট থাকে (যেমন: 'বয়লার মুরগি' পিস হিসেবে এবং কেজি হিসেবে আলাদা আলাদা পণ্য), তাহলে ইউজারকে অবশ্যই দুটি অপশনের কথাই স্পষ্টভাবে জানাবে এবং জিজ্ঞেস করবে সে কোনটি নিতে চায়। কখনো নিজের থেকে যেকোনো একটি ধরে নিয়ে বাকি অপশনের কথা গোপন করবে না।` },
            ...chatMessages.slice(-6).filter(m => m.id !== 1).map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: text }
          ]
        })
      });
      const data = await resp.json();
      if (data.error) {
        setChatMessages(prev => [...prev, { id: Date.now()+1, role: 'bot', text: `⚠️ AI সমস্যা: ${data.error.message || 'Unknown error'}. ${!shop.aiConfig?.apiKey ? 'ড্যাশবোর্ডে API Key সেট করা নেই।' : ''}` }]);
      } else {
        const botText = data.choices?.[0]?.message?.content || getSmartBotReply(text);
        const hasSuggestions = botText.includes('🛒');
        setChatMessages(prev => [...prev, { id: Date.now()+1, role: 'bot', text: botText, hasSuggestions }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { id: Date.now()+1, role: 'bot', text: `⚠️ Network Error: ${err.message}` }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // ── Parse AI-suggested products for displaying direct add-to-cart buttons ─────
  const getSuggestedProductsForMessage = (msg) => {
    if (msg.role !== 'bot') return [];
    const botText = msg.text;
    const itemsList = [];
    const addedIds = new Set();

    // Strategy 1: Parse PRODUCTS_JSON:[...]
    const jsonMatch = botText.match(/PRODUCTS_JSON:(\[.*?\])/s);
    if (jsonMatch) {
      try {
        const items = JSON.parse(jsonMatch[1]);
        items.forEach(item => {
          const product = products.find(p => p.id === (item.id || item.productId) && p.stock !== 0);
          if (product && !addedIds.has(product.id)) {
            itemsList.push({
              product,
              qty: item.qty || 1,
              customizedText: item.customizedText || '',
              note: item.note || ''
            });
            addedIds.add(product.id);
          }
        });
      } catch (e) { /* fallback below */ }
    }

    // Strategy 2: Word-overlap fuzzy matching if strategy 1 yielded nothing
    if (itemsList.length === 0) {
      const cleanText = botText.replace(/PRODUCTS_JSON:.*$/s, '').toLowerCase();
      products.forEach(product => {
        if (product.stock === 0 || addedIds.has(product.id)) return;
        const nameWords = product.name.toLowerCase().split(/[\s,()]+/).filter(w => w.length >= 2);
        if (nameWords.length === 0) return;
        const matchCount = nameWords.filter(w => cleanText.includes(w)).length;
        if (matchCount > 0 && matchCount >= Math.ceil(nameWords.length * 0.6)) {
          itemsList.push({
            product,
            qty: 1,
            customizedText: '',
            note: ''
          });
          addedIds.add(product.id);
        }
      });
    }

    return itemsList;
  };

  // ── Add All AI-suggested products to cart (Smart Matching) ─────
  const addAllSuggestedToCart = (botText) => {
    let added = 0;
    const addedIds = new Set();

    // Strategy 1: Parse PRODUCTS_JSON:[...] if AI returned structured IDs
    const jsonMatch = botText.match(/PRODUCTS_JSON:(\[.*?\])/s);
    if (jsonMatch) {
      try {
        const items = JSON.parse(jsonMatch[1]);
        items.forEach(item => {
          const product = products.find(p => p.id === (item.id || item.productId) && p.stock !== 0);
          if (product) {
            const qty = item.qty || item.quantity || 1;
            addToCart(product, qty, item.customizedText || '', item.note || '');
            addedIds.add(product.id);
            added++;
          }
        });
      } catch (e) { /* fallback below */ }
    }

    // Strategy 2: Word-overlap fuzzy matching
    if (added === 0) {
      const cleanText = botText.replace(/PRODUCTS_JSON:.*$/s, '').toLowerCase();
      products.forEach(product => {
        if (product.stock === 0 || addedIds.has(product.id)) return;
        const nameWords = product.name.toLowerCase().split(/[\s,()]+/).filter(w => w.length >= 2);
        const matchCount = nameWords.filter(w => cleanText.includes(w)).length;
        if (matchCount > 0 && matchCount >= Math.ceil(nameWords.length * 0.5)) {
          addToCart(product, 1, '', '');
          addedIds.add(product.id);
          added++;
        }
      });
    }

    if (added > 0) {
      toast.success(`${added}টি পণ্য কার্টে যোগ হয়েছে!`);
      setIsAiOpen(false);
      setIsCartOpen(true);
    } else {
      toast('পণ্য ম্যাচ হয়নি — নিজে কার্টে যোগ করুন।', { icon: 'ℹ️', duration: 5000 });
    }
  };


  // ── Filters & Sorting ──────────────────────────
  let filteredProducts = products.filter(p => {
    // 🔒 Hide products marked as hidden by retailer
    if (p.isHidden === true) return false;
    // Category filter: if activeSubcategory is set, MUST match category too
    const catMatch = activeCategory === 'All' || activeCategory === 'সব' || p.category === activeCategory;
    // Subcategory filter: only show products of that exact subcategory
    const subMatch = !activeSubcategory || p.subcategory === activeSubcategory;
    // If subcategory is selected, also enforce category match (no 'All' bypass)
    const strictCatMatch = !activeSubcategory ? catMatch : p.category === activeCategory;
    const searchMatch = matchPhoneticSearch(p, searchTerm);
    return strictCatMatch && subMatch && searchMatch;
  });
  filteredProducts = filteredProducts.sort((a, b) => {
    if (sortOption === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
    if (sortOption === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
    if (sortOption === 'name_desc') return b.name.localeCompare(a.name, 'bn');
    if (sortOption === 'newest') return (b.createdAt ? new Date(b.createdAt) : 0) - (a.createdAt ? new Date(a.createdAt) : 0);
    if (sortOption === 'stock_desc') return (b.stock || 0) - (a.stock || 0);
    // Default: name_asc (A→Z)
    return a.name.localeCompare(b.name, 'bn');
  });

  const validatePhone = (num) => {
    return /^01[3-9]\d{8}$/.test(num) || /^\+8801[3-9]\d{8}$/.test(num);
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (val.startsWith('+88')) {
       val = '+' + val.replace(/\D/g, '');
    } else {
       val = val.replace(/\D/g, '').slice(0, 11);
    }
    setOrderForm(f => ({ ...f, phone: val }));
    if (val.length >= 11 && !validatePhone(val)) setPhoneError('বৈধ ১১ ডিজিটের নম্বর লিখুন (যেমন: 017...)');
    else setPhoneError('');
  };

  // ── Cart Actions ───────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }
  }, [cart, CART_KEY]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('আপনার ডিভাইস জিপিএস সমর্থন করে না।');
      return;
    }
    toast.loading('লোকেশন বের করা হচ্ছে...', { id: 'geo' });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const link = `https://maps.google.com/?q=${latitude},${longitude}`;
        
        let readableAddress = '';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=bn`);
          const data = await res.json();
          if (data && data.display_name) {
            readableAddress = data.display_name;
          }
        } catch (e) {
          console.warn('Reverse geocoding failed', e);
        }

        setOrderForm(f => ({ 
          ...f, 
          address: readableAddress ? `${readableAddress}\n[ম্যাপ: ${link}]` : `[অটো-লোকেশন: ${link}]`,
          coordinates: { lat: latitude, lng: longitude, link }
        }));
        toast.success('লোকেশন সফলভাবে যুক্ত হয়েছে!', { id: 'geo' });
      },
      (error) => {
        toast.error('লোকেশন অ্যাক্সেস করা যায়নি। দয়া করে জিপিএস চালু করে পারমিশন দিন।', { id: 'geo' });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };



  useEffect(() => {
    const syncCart = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        setCart(stored);
      } catch {}
    };
    window.addEventListener('focus', syncCart);
    return () => window.removeEventListener('focus', syncCart);
  }, [CART_KEY]);

  // ── Cart Auto-Clean (Stock Check) ──────────────────
  useEffect(() => {
    if (!products || products.length === 0 || cart.length === 0) return;
    
    let changed = false;
    const newCart = cart.filter(item => {
      const p = products.find(prod => prod.id === item.id);
      if (p && p.stock === 0 && !p.allowRequest) {
        toast.error(`${p.name} স্টকে নেই, কার্ট থেকে সরানো হয়েছে`);
        changed = true;
        return false;
      }
      return true;
    });

    if (changed) {
      setCart(newCart);
    }
  }, [products, cart.length]); // Check when products load or cart size changes

  const addMultipleToCart = (items) => {
    if (!items || items.length === 0) return;

    setCart(prev => {
      let newCart = [...prev];
      let addedNames = [];

      items.forEach(item => {
        let product, qty, customizedText, note, price;

        if (item.product && item.product.id) {
          product = item.product;
          qty = item.qty;
          customizedText = item.customizedText;
          note = item.note;
          price = item.price;
        } else {
          product = item;
          qty = item.quantity;
          customizedText = item.customizedText;
          note = item.note;
          price = item.price;
        }

        if (!product || !product.id) return;
        if (product.stock === 0 && !product.allowRequest) return;

        const qtyToAdd = qty !== undefined && qty !== null ? Number(qty) || 1 : (product.quantity !== undefined ? Number(product.quantity) || 1 : 1);
        let resolvedCustomizedText = customizedText !== undefined && customizedText !== null ? customizedText : (product.customizedText || '');
        if (product.stock === 0 && product.allowRequest) {
          if (!resolvedCustomizedText.includes('[অনুরোধকৃত / Requested]')) {
            resolvedCustomizedText = resolvedCustomizedText ? `${resolvedCustomizedText} [অনুরোধকৃত / Requested]` : '[অনুরোধকৃত / Requested]';
          }
        }
        const resolvedNote = note !== undefined && note !== null ? note : (product.note || '');
        const resolvedPrice = price !== undefined && price !== null ? price : product.price;

        const existingIndex = newCart.findIndex(cartItem => 
          cartItem.id === product.id && 
          (cartItem.customizedText || '') === (resolvedCustomizedText || '') &&
          (resolvedPrice === null || parseFloat(cartItem.price) === parseFloat(resolvedPrice))
        );

        if (existingIndex > -1) {
          newCart[existingIndex] = {
            ...newCart[existingIndex],
            quantity: newCart[existingIndex].quantity + qtyToAdd,
            note: resolvedNote || newCart[existingIndex].note
          };
        } else {
          newCart.push({
            ...product,
            price: resolvedPrice,
            clientPrice: resolvedPrice,
            quantity: qtyToAdd,
            note: resolvedNote,
            customizedText: resolvedCustomizedText
          });
        }
        addedNames.push(product.name);
      });

      if (addedNames.length > 0) {
        toast.success(`সফলভাবে ${addedNames.length}টি পণ্য ঝুড়িতে যোগ হয়েছে! 🎉`);
      }
      return newCart;
    });
  };

  const addToCart = (product, customQty = null, customizedText = null, customNote = null, customPrice = null) => {
    if (Array.isArray(product)) {
      addMultipleToCart(product);
      return;
    }

    if (product.stock === 0) {
      if (product.allowRequest) {
        const qtyToAdd = customQty !== null ? customQty : (product.quantity !== undefined ? Number(product.quantity) || 1 : 1);
        const resolvedCustomizedText = customizedText !== null ? customizedText : (product.customizedText || '');
        const requestLabel = resolvedCustomizedText ? `${resolvedCustomizedText} [অনুরোধকৃত / Requested]` : '[অনুরোধকৃত / Requested]';
        const resolvedNote = customNote !== null ? customNote : (product.note || '');

        setCart(prev => {
          const existingIndex = prev.findIndex(item => 
            item.id === product.id && 
            (item.customizedText || '') === (requestLabel || '') &&
            (customPrice === null || parseFloat(item.price) === parseFloat(customPrice))
          );

          if (existingIndex > -1) {
            return prev.map((item, idx) => 
              idx === existingIndex 
                ? { ...item, quantity: item.quantity + qtyToAdd, note: resolvedNote || item.note } 
                : item
            );
          } else {
            return [...prev, { 
              ...product, 
              price: customPrice !== null ? customPrice : product.price,
              clientPrice: customPrice !== null ? customPrice : product.price,
              quantity: qtyToAdd, 
              note: resolvedNote, 
              customizedText: requestLabel 
            }];
          }
        });
        trackStoreEvent('add_to_cart_request', { id: product.id, name: product.name, price: customPrice !== null ? customPrice : product.price });
        toast.success(`${product.name} ঝুড়িতে অনুরোধকৃত হিসেবে যোগ হয়েছে!`);
        return;
      } else {
        toast.error('দুঃখিত, এই মুহূর্তে স্টকে নেই');
        return;
      }
    }
    
    // Resolve fields: prior parameter defaults first, then properties on the product object, else default values
    const qtyToAdd = customQty !== null ? customQty : (product.quantity !== undefined ? Number(product.quantity) || 1 : 1);
    const resolvedCustomizedText = customizedText !== null ? customizedText : (product.customizedText || '');
    const resolvedNote = customNote !== null ? customNote : (product.note || '');

    setCart(prev => {
      // Scoped variants matching: match by id AND customizedText!
      const existingIndex = prev.findIndex(item => 
        item.id === product.id && 
        (item.customizedText || '') === (resolvedCustomizedText || '') &&
        (customPrice === null || parseFloat(item.price) === parseFloat(customPrice))
      );

      if (existingIndex > -1) {
        return prev.map((item, idx) => 
          idx === existingIndex 
            ? { ...item, quantity: item.quantity + qtyToAdd, note: resolvedNote || item.note } 
            : item
        );
      } else {
        return [...prev, { 
          ...product, 
          price: customPrice !== null ? customPrice : product.price,
          clientPrice: customPrice !== null ? customPrice : product.price,
          quantity: qtyToAdd, 
          note: resolvedNote, 
          customizedText: resolvedCustomizedText 
        }];
      }
    });

    trackStoreEvent('add_to_cart', { id: product.id, name: product.name, price: customPrice !== null ? customPrice : product.price });
    toast.success(`${product.name} ঝুড়িতে যোগ হয়েছে!`);
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.reduce((acc, item) => {
      if (item.id !== id) return [...acc, item];
      const newQty = item.quantity + delta;
      if (newQty <= 0) return acc;
      return [...acc, { ...item, quantity: newQty }];
    }, []));
  };

  const setQuantityDirect = (id, qty) => {
    if (qty === '') {
      setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: '' } : item));
      return;
    }
    const v = parseFloat(qty);
    if (isNaN(v)) return;
    if (v <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: v } : item));
  };

  const updateCartItemPrice = (id, newPrice) => {
    if (newPrice === '') {
      setCart(prev => prev.map(item => item.id === id ? { ...item, price: '', clientPrice: '' } : item));
      return;
    }
    const val = parseFloat(newPrice);
    if (isNaN(val)) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, price: val, clientPrice: val } : item));
  };

  const updateCartItemTotalPrice = (id, newTotal) => {
    if (newTotal === '') {
      setCart(prev => prev.map(item => item.id === id ? { ...item, price: '', clientPrice: '' } : item));
      return;
    }
    const val = parseFloat(newTotal);
    if (isNaN(val)) return;
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const qty = parseFloat(item.quantity) || 1;
        const unitPrice = qty > 0 ? val / qty : val;
        return { ...item, price: unitPrice, clientPrice: unitPrice };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * (Number(item.quantity) || 0)), 0);
  const deliveryAdvanceFee = shop.deliveryConfig?.advanceFee ? parseInt(shop.deliveryConfig.advanceFee) : 60;
  const isCOD = shop.deliveryConfig?.isCOD !== false;
  const cartCount = cart.reduce((a, c) => a + (Number(c.quantity) || 0), 0);
  const hasPaymentGateway = shop?.manualPaymentEnabled !== false || shop?.piprapayEnabled === true;
  const isAdvanceRequired = hasPaymentGateway && (!isCOD || (shop.deliveryConfig?.advanceFee && shop.deliveryConfig.advanceFee !== '0'));

  const { hasFreeDelivery } = getUserStreak(userOrders);
  const effectiveDelivery = hasFreeDelivery ? 0 : deliveryAdvanceFee;

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.error('কার্ট থেকে সরানো হয়েছে');
  };

  const compressImage = (file, maxWidth = 800, quality = 0.6) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('স্ক্রিনশট ২MB এর কম হতে হবে');
      return;
    }
    try {
      const compressed = await compressImage(file);
      setPaymentScreenshot(compressed);
      toast.success('পেমেন্ট স্ক্রিনশট আপলোড হয়েছে! 📸');
    } catch (err) {
      toast.error('স্ক্রিনশট প্রসেস করতে সমস্যা হয়েছে');
    }
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCodeInput.trim()) {
      setCouponError('কুপন কোড লিখুন।');
      return;
    }
    const cleanInput = couponCodeInput.trim().toUpperCase();
    const shopCoupon = (shop.couponCode || '').trim().toUpperCase();
    if (shopCoupon && cleanInput === shopCoupon) {
      setAppliedCouponCode(cleanInput);
      setCouponDiscountPercent(Number(shop.couponDiscount) || 0);
      toast.success('কুপন কোডটি সফলভাবে প্রয়োগ করা হয়েছে! 🎉');
    } else {
      setCouponError('ভুল কুপন কোড! দয়া করে সঠিক কোড দিন।');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode('');
    setCouponDiscountPercent(0);
    setCouponCodeInput('');
    setCouponError('');
    toast.success('কুপন কোড সরানো হয়েছে');
  };

  const handleCommonOrderChange = (product, field, value) => {
    const R = (product.smartCalc?.enabled && product.smartCalc?.basePrice && product.smartCalc?.baseQuantity) 
      ? (product.smartCalc.basePrice / product.smartCalc.baseQuantity) 
      : (parseFloat(product.price) || 0);

    setCommonOrderRows(prev => {
      const currentRow = prev[product.id] || { qty: '', price: '', piece: '', finalPrice: 0 };
      const updatedRow = { ...currentRow };

      if (field === 'qty') {
        updatedRow.qty = value;
        const numQty = parseFloat(value) || 0;
        if (numQty > 0 && R > 0) {
          updatedRow.price = Math.round(numQty * R).toString();
          updatedRow.finalPrice = Math.round(numQty * R);
        } else {
          updatedRow.price = '';
          updatedRow.finalPrice = 0;
        }
      } else if (field === 'price') {
        updatedRow.price = value;
        const numPrice = parseFloat(value) || 0;
        if (numPrice > 0 && R > 0) {
          updatedRow.qty = (numPrice / R).toFixed(3).replace(/\.?0+$/, '');
          updatedRow.finalPrice = numPrice;
        } else {
          updatedRow.qty = '';
          updatedRow.finalPrice = 0;
        }
      } else if (field === 'piece') {
        updatedRow.piece = value;
      }

      return {
        ...prev,
        [product.id]: updatedRow
      };
    });
  };

  const addCommonOrderRowToCart = (product) => {
    const row = commonOrderRows[product.id];
    if (!row || !parseFloat(row.qty) || !parseFloat(row.price)) {
      toast.error('অনুগ্রহ করে পরিমাণ অথবা মূল্য সঠিকভাবে লিখুন।');
      return;
    }
    const qty = 1;
    const pieceNote = row.piece ? row.piece.trim() : '';
    const baseUnit = product.smartCalc?.enabled ? product.smartCalc.baseUnit : 'পিস';
    const customizedText = `${row.qty} ${baseUnit} (৳${row.price})`;
    const priceOverride = parseFloat(row.price);

    addToCart(product, qty, customizedText, pieceNote, priceOverride);
    
    setCommonOrderRows(prev => ({
      ...prev,
      [product.id]: { qty: '', price: '', piece: '', finalPrice: 0 }
    }));
  };

  const addAllCommonOrderToCart = () => {
    let addedCount = 0;
    const activeProducts = products.filter(p => p.showInCommonOrder).sort((a, b) => {
      const timeA = a.commonOrderUpdatedAt || 0;
      const timeB = b.commonOrderUpdatedAt || 0;
      if (timeA !== timeB) return timeA - timeB;
      return a.name.localeCompare(b.name, 'bn');
    });
    let updatedCart = [...cart];
    
    activeProducts.forEach(product => {
      const row = commonOrderRows[product.id];
      if (row && parseFloat(row.qty) > 0 && parseFloat(row.price) > 0) {
        const qtyToAdd = 1;
        const pieceNote = row.piece ? row.piece.trim() : '';
        const baseUnit = product.smartCalc?.enabled ? product.smartCalc.baseUnit : 'পিস';
        const customizedText = `${row.qty} ${baseUnit} (৳${row.price})`;
        const priceOverride = parseFloat(row.price);
        
        // Match existing cart variants by id, customizedText and priceOverride
        const existingIndex = updatedCart.findIndex(item => 
          item.id === product.id && 
          (item.customizedText || '') === (customizedText || '') &&
          (parseFloat(item.price) === priceOverride)
        );

        if (existingIndex > -1) {
          updatedCart = updatedCart.map((item, idx) => 
            idx === existingIndex 
              ? { ...item, quantity: item.quantity + qtyToAdd, note: pieceNote || item.note } 
              : item
          );
        } else {
          updatedCart.push({ 
            ...product, 
            price: priceOverride,
            clientPrice: priceOverride,
            quantity: qtyToAdd, 
            note: pieceNote, 
            customizedText: customizedText 
          });
        }
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setCart(updatedCart);
      localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
      toast.success(`${addedCount}টি প্রোডাক্ট সফলভাবে কার্টে যোগ হয়েছে! 🛒`);
      setIsCommonOrderOpen(false);
      setCommonOrderRows({});
    } else {
      toast.error('কমপক্ষে ১টি প্রোডাক্টের পরিমাণ ও মূল্য সঠিকভাবে লিখুন।');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const requiresLocation = shop.requireLocationForOrder === true;
    if (requiresLocation && !orderForm.coordinates) {
      toast.error('📍 অর্ডার করতে লোকেশন বাটনে ক্লিক করে আপনার ঠিকানা নিশ্চিত করুন।', { duration: 4000 });
      return;
    }
    if (shop.isStrictLocation && locationStatus !== 'available') {
      toast.error('দুঃখিত, আপনার লোকেশনে আমাদের ডেলিভারি সার্ভিস নেই।');
      return;
    }
    if (cart.filter(i => Number(i.quantity) > 0).length === 0 && !orderImage) return toast.error('কার্ট খালি!');
    
    if (!orderForm.name || orderForm.name.trim().length < 3) {
      toast.error('⚠️ অনুগ্রহ করে আপনার সঠিক নাম লিখুন (কমপক্ষে ৩ অক্ষর)');
      return;
    }
    if (!orderForm.address || orderForm.address.trim().length < 3) {
      toast.error('⚠️ অনুগ্রহ করে আপনার সঠিক ডেলিভারি ঠিকানা লিখুন (কমপক্ষে ৩ অক্ষর)');
      return;
    }
    
    // 🚨 Payment Screenshot Check
    if (paymentMethod === 'manual' && isAdvanceRequired && shop.deliveryConfig?.requirePaymentScreenshot && !paymentScreenshot) {
      toast.error('⚠️ পেমেন্ট যাচাইয়ের জন্য প্রমাণ স্বরূপ স্ক্রিনশট আপলোড করা আবশ্যক।');
      return;
    }

    trackStoreEvent('begin_checkout', { value: cart.filter(i => Number(i.quantity) > 0).length === 0 && orderImage ? 1 : cartTotal, currency: 'BDT', items: cart.map(i => i.name) });
    const requireLogin = shop.authSettings?.requireLoginBeforeOrder ?? true;
    if (requireLogin && !user) {
      setIsOrderOpen(false);
      setShowLoginModal(true);
      return;
    }
    if (!validatePhone(orderForm.phone)) {
      setPhoneError('বৈধ বাংলাদেশি নম্বর লিখুন।');
      return;
    }

    // 🚨 Minimum Order Amount (frontend guard) - bypass for image-only orders
    const minOrder = parseInt(shop.deliveryConfig?.minOrderAmount) || 0;
    if (minOrder > 0 && cartTotal < minOrder && !orderImage) {
      toast.error(`সর্বনিম্ন অর্ডার ৳${minOrder}। আরো পণ্য যোগ করুন।`);
      return;
    }

    setPlacing(true);
    const now = new Date();
    const dd = String(now.getDate()).padStart(2,'0');
    const mm = String(now.getMonth()+1).padStart(2,'0');
    const yyyy = now.getFullYear();

    const reqPayload = {
      localId: localId || `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      shopId: shop.id,
      customerName: orderForm.name,
      customerPhone: orderForm.phone,
      customerEmail: user?.email || '',
      customerAddress: orderForm.address,
      customerNote: orderForm.note,
      paymentMethod: isAdvanceRequired 
        ? (shop.piprapayEnabled ? paymentMethod : 'manual') 
        : 'cod',
      transactionId: (isAdvanceRequired && paymentMethod === 'manual') ? orderForm.txnId : '',
      paymentNumber: (isAdvanceRequired && paymentMethod === 'manual') ? orderForm.paymentNumber : '',
      paymentScreenshot: (isAdvanceRequired && paymentMethod === 'manual') ? (paymentScreenshot || undefined) : undefined,
      couponCode: appliedCouponCode || undefined,
      items: cart.filter(i => Number(i.quantity) > 0).map(i => ({ 
        id: i.productId || i.id, 
        quantity: Number(i.quantity) || 1, 
        note: i.note || '',
        variantsText: i.variantsText || '',
        customizedText: i.customizedText || '',
        baseUnit: i.baseUnit || '',
        clientPrice: parseFloat(i.clientPrice || i.price) || undefined
      })),
      customerId: user?.uid || `guest_${Date.now()}`,
      customImage: orderImage || undefined,
      coordinates: orderForm.coordinates
    };

    const onSuccess = async (payloadResp) => {
      const orderId = payloadResp.orderId;
      
      // Fire client-side purchase tracking event (with event_id for CAPI deduplication)
      try {
        trackStoreEvent('purchase', {
          value: payloadResp.total || cartTotal,
          currency: 'BDT',
          event_id: orderId,
          content_type: 'product',
          contents: cart.map(i => ({ id: i.id, quantity: Number(i.quantity) || 1 }))
        });
      } catch (trackErr) {
        console.warn('[Tracking Error]', trackErr);
      }

      setCart([]);
      localStorage.removeItem(CART_KEY);
      
      // Clear draft checkout session from localStorage and generate a new one
      try {
        localStorage.removeItem('webmaa_checkout_session_id');
        const newLid = `ch_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        localStorage.setItem('webmaa_checkout_session_id', newLid);
        setLocalId(newLid);
      } catch (sessErr) {
        console.warn('[Session reset error]', sessErr);
      }

      toast.success('অর্ডার প্লেস করা হয়েছে! 🎉');
      setOrderImage(null);
      setPaymentScreenshot('');
      setIsOrderOpen(false);
      setPlacing(false);
      if (user?.email) {
        import('@/lib/firestore').then(lib => {
          lib.getUserOrders(shop.id, user.email).then(setUserOrders);
          if (user?.uid) {
            lib.saveUserData(user.uid, {
              name: orderForm.name,
              phone: orderForm.phone,
              address: orderForm.address
            });
          }
        });
      }
      if (payloadResp.checkoutUrl) {
        window.location.href = payloadResp.checkoutUrl;
      } else {
        const isCustomOrSub = typeof window !== 'undefined' && !['bdretailers.com', 'www.bdretailers.com', 'daripallah.com', 'webmaa.vercel.app', 'localhost', '127.0.0.1'].includes(window.location.hostname.replace(/^www\./i, '').split(':')[0]);
        if (isCustomOrSub) {
          window.location.href = `/order/${orderId}`;
        } else {
          window.location.href = `/shop/${shop.shopSlug || shop.subdomainSlug}/order/${orderId}`;
        }
      }
    };

    const sendOrder = async (payload) => {
      const headers = { 'Content-Type': 'application/json' };
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      let resp;
      try {
        resp = await res.json();
      } catch (e) {
        throw new Error('Server returned invalid response. Please try again.');
      }
      if (!res.ok) throw new Error(resp.error || `Error ${res.status}: Server failed`);
      return resp;
    };

    if (!isOnline) {
      await savePendingOrder(reqPayload);
      toast('আপনি অফলাইনে আছেন। সংযোগ ফিরে এলে অর্ডারটি পাঠানো হবে।', { icon: '📡', duration: 6000 });
      setPlacing(false); setIsOrderOpen(false); return;
    }

    try {
      const resp = await sendOrder(reqPayload);
      await onSuccess(resp);
    } catch (err) {
      // Show the EXACT error to user — do NOT close modal
      toast.error(`অর্ডার ব্যর্থ: ${err.message}`, { duration: 8000 });
      setPlacing(false);
      // Do NOT close modal — user needs to see error and retry
    }
  };

    const generatePDF = async (orderData) => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfProgress(10);
    try {
      const { default: html2canvas } = await import('html2canvas');
      setPdfProgress(30);
    const { default: jsPDF } = await import('jspdf');
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:-9999px;top:0;width:500px;padding:20px;background:white;font-family:Arial,sans-serif;color:black;line-height:1.2;';
    el.innerHTML = `
      <div style="text-align:center;border-bottom:2px solid black;padding-bottom:10px;margin-bottom:10px">
        <h1 style="font-size:24px;font-weight:900;margin:0">${orderData.shopName}</h1>
        <p style="font-size:10px;margin:2px 0 0;text-transform:uppercase;letter-spacing:1px">Order Receipt / অর্ডার রশিদ</p>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <div>
          <p style="font-size:8px;text-transform:uppercase;font-weight:700;margin:0">Order ID</p>
          <p style="font-size:16px;font-weight:900;margin:2px 0 0">#${orderData.orderIdVisual}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:8px;text-transform:uppercase;font-weight:700;margin:0">Date</p>
          <p style="font-size:12px;font-weight:700;margin:2px 0 0">${orderData.date}</p>
        </div>
      </div>
      <div style="border:1.5px solid black;padding:10px;margin-bottom:10px;font-size:12px;background:#f9fafb">
        <p style="margin:0 0-4px;font-weight:900">${orderData.customerName} — ${orderData.customerPhone}</p>
        <p style="margin:5px 0 0;line-height:1.3"><b>Addr:</b> ${orderData.customerAddress}</p>
        ${orderData.coordinates?.link ? `<p style="margin:5px 0 0;font-size:10px;color:#2563eb"><b>Map:</b> ${orderData.coordinates.link}</p>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
        <thead>
          <tr style="border-bottom:2px solid black;border-top:2px solid black;background:#f3f4f6">
            <th style="padding:6px 4px;text-align:left;font-size:10px">Item</th>
            <th style="padding:6px 4px;text-align:center;font-size:10px">Qty</th>
            <th style="padding:6px 4px;text-align:right;font-size:10px">Price</th>
          </tr>
        </thead>
        <tbody>
          ${orderData.items.map((item) => `
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:6px 4px;">
                <div style="font-size:11px;font-weight:700">${item.name}</div>
                ${item.note ? `<div style="font-size:9px;color:#666;font-style:italic">Note: ${item.note}</div>` : ''}
                ${item.customizedText ? `<div style="font-size:9px;color:#7c3aed;font-weight:bold">${item.customizedText}</div>` : ''}
              </td>
              <td style="padding:6px 4px;text-align:center;font-size:11px">${item.quantity}</td>
              <td style="padding:6px 4px;text-align:right;font-size:11px;font-weight:900">৳${(parseFloat(item.price)*item.quantity).toFixed(0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-left:auto;width:180px;font-size:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span>Subtotal</span>
          <span>৳${orderData.items.reduce((s,i)=>s+parseFloat(i.price)*i.quantity,0).toFixed(0)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span>Delivery</span>
          <span>৳${orderData.deliveryFee}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:2px solid black;padding-top:6px;font-weight:900;font-size:16px">
          <span>Total</span>
          <span>৳${orderData.total}</span>
        </div>
      </div>
      <div style="margin-top:20px;text-align:center;border-top:1px dashed #ccc;padding-top:10px">
        <p style="font-size:10px;font-weight:bold;margin:0">ধন্যবাদ, আবার আসবেন!</p>
        <p style="font-size:8px;color:#888;margin:2px 0 0">Powered by Daripallah AI</p>
      </div>
    `;
    document.body.appendChild(el);
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    document.body.removeChild(el);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // If total height exceeds one A4 page, scale it down to fit
    const pageHeight = pdf.internal.pageSize.getHeight();
    let finalWidth = pdfWidth;
    let finalHeight = pdfHeight;
    if (pdfHeight > pageHeight) {
      finalHeight = pageHeight - 10;
      finalWidth = (canvas.width * finalHeight) / canvas.height;
    }
    
    pdf.addImage(imgData, 'PNG', (pdfWidth - finalWidth) / 2, 0, finalWidth, finalHeight);
    pdf.save(`Order_${orderData.orderIdVisual}.pdf`);
      setPdfProgress(100);
      toast.success('PDF সফলভাবে ডাউনলোড হয়েছে!');
    } catch(err) {
      toast.error('PDF তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setTimeout(() => {
        setIsGeneratingPdf(false);
        setPdfProgress(0);
      }, 500);
    }
  };

  // ── Grocery shop detection ──────────────────────────────────────
  const isGroceryShop = (() => {
    if (!shop) return false;
    const groceryTemplates = ['local-bazaar', 'grocery-pro', 'food-delivery'];
    if (groceryTemplates.includes(shop.templateId)) return true;
    if (shop.industryFit === 'grocery' || shop.category === 'grocery') return true;
    const groceryKeywords = ['grocery', 'groceries', 'বাজার', 'মেসের', 'messer', 'grocery', 'food', 'fresh', 'vegetable', 'মার্কেট'];
    const nameSlug = ((shop.shopName || '') + ' ' + (shop.subdomainSlug || '') + ' ' + (shop.shopSlug || '')).toLowerCase();
    return groceryKeywords.some(k => nameSlug.includes(k));
  })();

  const themeVars = themeToVars(buildShopTheme(shop));

  // NOTE: We no longer block the storefront on authLoading.
  // Auth state resolves in background — shopping is always public.
  return (
    <div 
      className="min-h-screen font-sans pb-24"
      style={{ 
        ...themeVars, 
        backgroundColor: 'var(--sp-bg)',
        color: 'var(--sp-text)'
      }}
    >
      {/* ── Dynamic Theme Styles ── */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --sp-primary-light: color-mix(in srgb, var(--sp-primary) 20%, transparent);
        }
        .bg-purple-600 { background-color: var(--sp-primary) !important; }
        .text-purple-600 { color: var(--sp-primary) !important; }
        .bg-purple-50 { background-color: var(--sp-primary-light) !important; }
        .text-purple-700 { color: var(--sp-primary) !important; }
        .border-purple-200 { border-color: var(--sp-primary-light) !important; }
        .from-purple-600 { --tw-gradient-from: var(--sp-primary) !important; }
        .to-indigo-600 { --tw-gradient-to: var(--sp-accent) !important; }
        .shadow-purple-500\\/20 { box-shadow: 0 4px 14px 0 var(--sp-primary-light) !important; }
        .rounded-2xl { border-radius: var(--sp-radius) !important; }
        .rounded-xl { border-radius: calc(var(--sp-radius) * 0.75) !important; }
        body { font-family: var(--sp-font), sans-serif !important; }
        [data-sf-style] .sf-hero,
        .sf-hero {
          aspect-ratio: 16/9 !important;
          width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
        }
        @media (min-width: 1024px) {
          [data-sf-style] .sf-hero,
          .sf-hero {
            aspect-ratio: 2.8/1 !important;
            height: auto !important;
            max-height: 380px !important;
          }
        }
      `}} />

      {/* ── Splash Loading Screen (1.5s, with shop branding) ── */}
      {showSplash && <LoadingScreen visible={showSplash} shop={shop} products={products} minDuration={1500} />}
      <StoreAnalytics shop={shop} />
      {/* ── Push Notification Permission Modal (elegant, bottom-center, shows once) ── */}
      <NotificationPermissionModal
        shopId={shop?.id}
        userId={user?.uid || null}
      />

      {/* ── Category Drawer (All Devices - Left Side) ── */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isCategoryMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCategoryMenuOpen(false)} />
        <div className={`absolute top-0 left-0 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isCategoryMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Tag size={18} className="text-purple-600" /> ক্যাটাগরি সমূহ</h2>
            <button onClick={() => setIsCategoryMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-900 transition-colors">
              <X size={16} strokeWidth={3} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            <button
              onClick={() => { setActiveCategory('All'); setActiveSubcategory(''); setIsCategoryMenuOpen(false); }}
              className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold transition-all ${activeCategory === 'All' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 scale-[1.02]' : 'bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-700'}`}
            >সব ক্যাটাগরি</button>
            <div className="flex items-center gap-2">
              {/* static logo - no navigation to prevent 'No store found' error */}
              <div className="flex items-center gap-2 select-none">
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} className="w-9 h-9 rounded-xl object-contain border border-slate-200" alt={shop.shopName} />
                ) : null}
                <span className="font-black text-slate-900 text-lg leading-tight">{shop.shopName || 'Shop'}</span>
              </div>
            </div>
            {categories.map(c => {
              const hasSubs = c.subcategories && c.subcategories.length > 0;
              const isActive = activeCategory === c.name;
              return (
                <div key={c.id} className="space-y-1">
                  <button
                    onClick={() => { setActiveCategory(c.name); setActiveSubcategory(''); if (!hasSubs) setIsCategoryMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold transition-all ${isActive ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 scale-[1.02]' : 'bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-700'}`}
                  >
                    <span>{c.name}</span>
                    {hasSubs && <span className={`text-xs ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{isActive ? '▲' : '▼'}</span>}
                  </button>
                  {isActive && hasSubs && (
                    <div className="pl-4 space-y-1 border-l-2 border-purple-200 ml-4">
                      <button
                        onClick={() => setActiveSubcategory('')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${activeSubcategory === '' ? 'bg-purple-100 text-purple-700 font-black' : 'text-slate-500 hover:bg-slate-100'}`}
                      >সব</button>
                      {c.subcategories.map((sub, i) => (
                        <button
                          key={i}
                          onClick={() => { setActiveSubcategory(sub); setIsCategoryMenuOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${activeSubcategory === sub ? 'bg-purple-100 text-purple-700 font-black' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                        >{sub}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* 🚀 GOOGLE ANALYTICS DYNAMIC INJECTION */}
      {shop.trackingConfig?.ga4Id && (
        <>
          <Script 
            src={`https://www.googletagmanager.com/gtag/js?id=${shop.trackingConfig.ga4Id}`} 
            strategy="afterInteractive" 
            key={`ga4-js-${shop.trackingConfig.ga4Id}`}
          />
          <Script id="ga4-init" strategy="afterInteractive" key={`ga4-init-${shop.trackingConfig.ga4Id}`}>
            {`
              console.log("[Analytics] Initializing GA4: ${shop.trackingConfig.ga4Id}");
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${shop.trackingConfig.ga4Id}', {
                page_path: window.location.pathname,
                send_page_view: true
              });
            `}
          </Script>
        </>
      )}

      {/* 🚀 MICROSOFT CLARITY DYNAMIC INJECTION */}
      {shop.trackingConfig?.clarityId && (
        <Script id="clarity-init" strategy="afterInteractive" key={`clarity-${shop.trackingConfig.clarityId}`}>
          {`
            console.log("[Analytics] Initializing Clarity: ${shop.trackingConfig.clarityId}");
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${shop.trackingConfig.clarityId}");
          `}
        </Script>
      )}

      {/* ── Service Area Banner Removed ── */}



      {/* ── Broadcast Notifications ── */}
      <NotificationBanner shopId={shop.id} />

      {/* ── Marquee Notice ── */}
      {shop.notices && (
        <div className="bg-purple-600 text-white py-2 overflow-hidden flex whitespace-nowrap border-b border-purple-700">
          <div className="animate-marquee font-bold text-sm tracking-wide">{shop.notices}</div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="border-b sticky top-0 z-40 shadow-sm" style={{background:'var(--surface)',borderColor:'var(--border-color)'}}>
        <div className="max-w-[98%] mx-auto px-2 sm:px-6 lg:px-8 py-3 flex justify-between items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Logo/Brand (Left Side) */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsCategoryMenuOpen(true)} 
              className="flex items-center justify-center p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
            {/* Static logo - no href to prevent 'No store found' navigation */}
            <div className="flex items-center gap-1.5 select-none cursor-default">
              {shop.logoUrl ? (
                <img loading="lazy" src={shop.logoUrl} className="w-8 h-8 rounded-xl object-contain border border-slate-100" alt={shop.shopName} />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-md">
                  {shop.shopName?.[0] || 'S'}
                </div>
              )}
              <span className="font-black text-slate-900 text-sm sm:text-[17px] leading-tight truncate max-w-[70px] sm:max-w-none">{shop.shopName || 'Shop'}</span>
            </div>
          </div>

          {/* Actions (Left side of the brand) */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-wrap justify-end">
            <NotificationInbox shopId={shop.id} isDashboard={false} />

            {((userData?.role === 'staff' && userData?.accessShopId === shop.id) || (userData?.role === 'admin' && userData?.accessShopId === shop.id) || (userData?.role === 'retailer' && user?.uid === shop.ownerId) || userData?.role === 'superadmin') && (
              <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] sm:text-xs font-black transition-all shadow-lg">
                <Settings size={14} /> <span className="hidden sm:inline">প্যানেলে যান</span>
              </button>
            )}

            {/* How to Order Video */}
            {shop.howToOrderVideo && (
              <a href={shop.howToOrderVideo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] sm:text-xs font-black transition-colors shadow-sm whitespace-nowrap">
                <PlayCircle size={14} /> <span>কিভাবে অর্ডার করবেন?</span>
              </a>
            )}

            {/* FAQ Button */}
            <button onClick={() => setIsFaqOpen(true)} className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] sm:text-xs font-black transition-colors shadow-sm">
              <HelpCircle size={14} /> <span>FAQ</span>
            </button>

            {/* Profile */}
            <button onClick={() => setIsProfileOpen(true)} className="w-8 h-8 sm:w-10 sm:h-10 aspect-square bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl transition-colors shadow-sm border border-purple-200 overflow-hidden flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} className="w-full h-full object-cover aspect-square" alt="Profile" />
              ) : (
                <User size={20} className="font-bold" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Top Premium Location Bar Removed ── */}

      {/* ── Inline Smart Meal AI Planner (Top Storefront) ── */}
      {shop.enableSmartMeal && !isMesserBazar && (
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
          <div className="bg-white border-2 border-purple-100 rounded-3xl shadow-xl shadow-purple-500/5 overflow-hidden">
            <SmartMealEngine
              shop={shop}
              products={products}
              onAddToCart={addToCart}
              onClose={() => {}}
              userOrders={userOrders}
            />
          </div>
        </div>
      )}

      {/* ── Banner/Carousel Section — Full Image Edge-to-Edge, No Crop ── */}
      <div className="sf-hero relative w-full bg-[#030612] overflow-hidden border-b border-slate-800 group/banner h-[45vh] min-h-[220px] max-h-[500px]">
        {normalizedBanners.length > 0 ? (
          <div 
            className="relative w-full h-full overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {normalizedBanners.map((banner, i) => (
              <div 
                key={i} 
                className={`w-full h-full transition-all duration-1000 ${
                  i === activeBanner 
                    ? 'relative z-10 opacity-100 scale-100 block' 
                    : 'absolute inset-0 z-0 opacity-0 scale-95 pointer-events-none'
                }`}
              >
                {/* Actual banner — filled to cover container width and height */}
                <div className="w-full h-full relative">
                  {/* Blurred Background Copied Image */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-cover bg-center blur-3xl scale-110 opacity-30 select-none pointer-events-none" 
                    style={{ backgroundImage: `url(${banner.url})` }} 
                  />
                  <img
                    src={banner.url}
                    loading={i === 0 ? "eager" : "lazy"}
                    alt={banner.title || `Banner ${i+1}`}
                    className="absolute inset-0 w-full h-full object-contain z-10 select-none transition-transform duration-700 hover:scale-[1.01]"
                  />
                </div>
                {/* Premium Text Overlay if defined */}
                {(banner.title || banner.description) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent z-15 flex flex-col justify-end p-6 md:p-12 pb-8 md:pb-16 text-white">
                    <div className="max-w-2xl">
                      {banner.title && <h3 className="text-lg md:text-3xl font-extrabold mb-1.5 md:mb-3 drop-shadow-md text-white tracking-tight">{banner.title}</h3>}
                      {banner.description && <p className="text-xs md:text-base text-gray-200 mb-3.5 drop-shadow-sm max-w-lg leading-relaxed line-clamp-2">{banner.description}</p>}
                      {banner.linkUrl && (
                        <a 
                          href={banner.linkUrl} 
                          className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer"
                        >
                          {banner.buttonText || 'এখনই কিনুন'}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {normalizedBanners.length > 1 && (
              <>
                <button onClick={() => setActiveBanner(prev => (prev === 0 ? normalizedBanners.length - 1 : prev - 1))} className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all opacity-0 group-hover/banner:opacity-100 hover:scale-110 active:scale-95 shadow-lg">
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>
                <button onClick={() => setActiveBanner(prev => (prev === normalizedBanners.length - 1 ? 0 : prev + 1))} className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all opacity-0 group-hover/banner:opacity-100 hover:scale-110 active:scale-95 shadow-lg">
                  <ChevronRight size={24} strokeWidth={3} />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {normalizedBanners.map((_, i) => (
                    <button key={i} onClick={() => setActiveBanner(i)} className={`h-2.5 rounded-full transition-all ${i === activeBanner ? 'bg-white w-6' : 'bg-white/40 w-2.5 hover:bg-white/60'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-full min-h-[100px] sm:min-h-[150px] md:min-h-[200px] bg-gradient-to-r from-purple-800 via-purple-600 to-blue-700 flex items-center justify-center p-4 text-center shadow-inner relative">
            {shop.coverImg && <img loading="eager" src={shop.coverImg} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />}
            <h2 className="relative z-10 text-3xl md:text-5xl font-black text-white drop-shadow-xl tracking-tight">{shop.welcomeMessage || 'স্বাগতম আমাদের স্টোরে!'}</h2>
          </div>
        )}
      </div>

      {/* ── Inline Smart Meal AI Planner (For MesserBazar, rendered under banners) ── */}
      {shop.enableSmartMeal && isMesserBazar && (
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
          <div className="bg-white border-2 border-purple-100 rounded-3xl shadow-xl shadow-purple-500/5 overflow-hidden">
            <SmartMealEngine
              shop={shop}
              products={products}
              onAddToCart={addToCart}
              onClose={() => {}}
              userOrders={userOrders}
            />
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[96%] xl:max-w-[98%] 2xl:max-w-[99%] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 w-full space-y-4 md:space-y-5">
        
        {/* ── Banner Description Box (SEO/AEO/GEO Optimized & Narrow) ── */}
        <div
          className="rounded-xl border overflow-hidden p-3"
          style={{
            borderColor: shop?.descBoxBorderColor || 'var(--sp-border, #e2e8f0)',
            background: shop?.descBoxBg || 'var(--sp-card, #ffffff)',
          }}
          itemScope
          itemType="https://schema.org/Store"
        >
          <meta itemprop="url" content={shop?.customDomain ? `https://${shop.customDomain}` : `https://bdretailers.com/shop/${shop.shopSlug}`} />
          {shop?.logoUrl && <meta itemprop="image" content={shop.logoUrl} />}
          
          <div className="flex items-center gap-3">
            {shop?.logoUrl && (
              <img itemprop="logo" src={shop.logoUrl} alt={shop.shopName} className="w-10 h-10 object-contain rounded-lg border border-slate-200 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 itemprop="name" className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none">
                  {shop?.shopName || ''}
                </h1>
                {shop?.slogan && (
                  <span itemprop="slogan" className="text-[10px] sm:text-xs text-slate-500 font-bold border-l pl-2 border-slate-200 leading-none">
                    {shop.slogan}
                  </span>
                )}
              </div>
              <p itemprop="description" className="text-xs sm:text-sm font-medium text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {shop?.bannerDescription || shop?.description || shop?.slogan || ''}
              </p>
            </div>
          </div>
        </div>

        {/* ── AI Shopping List (Vision Component) ── */}
        {(shop.aiConfig?.enableAiShoppingList !== false || shop.settings?.enableAiShoppingList !== false) && (
          <AiShoppingList 
            shop={shop} 
            products={products} 
            onAddToCart={(items) => {
              if (Array.isArray(items)) {
                items.forEach(item => addToCart(item));
              } else {
                addToCart(items);
              }
            }} 
            onDirectOrder={handleDirectOrderFromAi}
          />
        )}

        {/* ── Common Order Sheet Button ── */}
        {shop.enableCommonOrder && (
          <button
            onClick={() => setIsCommonOrderOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm uppercase tracking-wider cursor-pointer"
          >
            📋 কমন অর্ডার শিট (Common Order Sheet)
          </button>
        )}

        {/* ── Search & Sort ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-3 text-slate-500" size={15} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="পণ্য খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 font-bold outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all text-sm placeholder:font-medium placeholder:text-slate-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative shrink-0">
            <ArrowUpDown size={13} className="absolute left-3 top-3.5 text-slate-500" strokeWidth={2.5} />
            <select className="pl-8 pr-5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-purple-600 appearance-none cursor-pointer hover:bg-slate-200 transition-colors" value={sortOption} onChange={e => setSortOption(e.target.value)}>
              <option value="newest">সবচেয়ে নতুন</option>
              <option value="price_asc">কম মূল্য প্রথমে</option>
              <option value="price_desc">বেশি মূল্য প্রথমে</option>
              <option value="name_asc">নাম (A-Z)</option>
              <option value="name_desc">নাম (Z-A)</option>
              <option value="stock_desc">স্টক উপলব্ধ প্রথমে</option>
            </select>
          </div>
        </div>

        {/* ── Category Strip (Always Visible on Mobile & Desktop) ── */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => { setActiveCategory('All'); setActiveSubcategory(''); }}
              className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-black transition-all duration-200 border ${activeCategory === 'All' ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20' : 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700'}`}
            >🏪 সব</button>
            {categories.map(c => (
              <button key={c.id}
                onClick={() => { setActiveCategory(c.name); setActiveSubcategory(''); }}
                className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-black transition-all duration-200 border ${activeCategory === c.name ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20' : 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700'}`}
              >{c.name}</button>
            ))}
          </div>
        )}

        {/* ── Desktop Subcategory Strip ── */}
        {activeCategory !== 'All' && (() => {
          const activeCat = categories.find(c => c.name === activeCategory);
          if (!activeCat?.subcategories?.length) return null;
          return (
            <div className="hidden md:flex flex-wrap gap-2 -mt-2 animate-slide-in">
              <button
                onClick={() => setActiveSubcategory('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors border ${activeSubcategory === '' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >সব</button>
              {activeCat.subcategories.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSubcategory(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors border ${activeSubcategory === sub ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-purple-700'}`}
                >{sub}</button>
              ))}
            </div>
          );
        })()}


        {/* ── Mobile Subcategory Strip ── */}
        {activeCategory !== 'All' && (() => {
          const activeCat = categories.find(c => c.name === activeCategory);
          if (!activeCat?.subcategories?.length) return null;
          return (
            <div className="md:hidden flex flex-wrap gap-2 -mt-2 animate-slide-in">
              <button
                onClick={() => setActiveSubcategory('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors border ${activeSubcategory === '' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
              >সব</button>
              {activeCat.subcategories.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSubcategory(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors border ${activeSubcategory === sub ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-purple-700'}`}
                >{sub}</button>
              ))}
            </div>
          );
        })()}

        {/* ── FAQ Schema Injected silently for SEO/AEO ── */}
        {shop.faqItems && shop.faqItems.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": shop.faqItems.map(faq => ({
                  "@type": "Question",
                  "name": faq.q,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.a
                  }
                }))
              })
            }}
          />
        )}

        {/* ── Product Grid ── */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-300">
            <Package size={64} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
            <h3 className="text-2xl font-black text-slate-800">কোনো পণ্য পাওয়া যায়নি। 🥺</h3>
            <p className="text-slate-500 text-sm mt-3 font-semibold">অন্য ক্যাটাগরিতে খুঁজে দেখুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 3xl:grid-cols-10 gap-3 sm:gap-4">
            {filteredProducts.map((product, index) => {
              const cartItem = cart.find(i => i.id === product.id);
              return (
                <div key={product.id} className="sf-product-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-slate-200 flex flex-col">
                  {/* Image — clickable to detail page */}
                  <div 
                    className="relative h-40 sm:h-52 overflow-hidden bg-white border-b border-slate-100 cursor-pointer" 
                    onClick={() => {
                      trackStoreEvent('select_content', { content_type: 'product', item_id: product.id, name: product.name });
                      setSelectedProductForModal(product);
                    }}
                  >
                    {(product.images?.[0] || product.imageUrl) ? (
                      <Image 
                        src={product.images?.[0] || product.imageUrl} 
                        alt={product.name} 
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        priority={index < 4}
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center p-4 text-center ${getFallbackColor(product.name)}`}>
                        <h3 className="text-xl md:text-2xl font-black text-white drop-shadow-md leading-tight">{product.name}</h3>
                      </div>
                    )}
                    {product.allowCustomize && (
                      <div className="absolute top-2.5 left-2.5 bg-purple-600/90 text-white px-2 py-1 rounded-lg text-[10px] font-black backdrop-blur-sm flex items-center gap-1">
                        <Sparkles size={10} /> কাস্টম
                      </div>
                    )}
                  </div>

                  {/* Info + Actions */}
                  <div className="p-3.5 sm:p-4 flex flex-col flex-1 bg-white">
                    <h3 
                      onClick={() => {
                        trackStoreEvent('select_content', { content_type: 'product', item_id: product.id, name: product.name });
                        setSelectedProductForModal(product);
                      }}
                      className="font-extrabold text-slate-900 text-[14px] leading-tight group-hover:text-purple-700 transition-colors line-clamp-2 mb-3 cursor-pointer"
                    >
                      {product.name}
                    </h3>

                    {/* Price and Unit right above Cart Controls */}
                    <div className="mb-3 flex items-baseline gap-1">
                      <span className="text-lg font-black text-slate-900">৳{product.price}</span>
                      {product.unit && (
                        <span className="text-[11px] font-bold text-slate-400">/ {product.unit}</span>
                      )}
                    </div>

                    {/* Cart Controls */}
                    <div className="mt-auto space-y-2">
                      {product.stock === 0 ? (
                        product.allowRequest ? (
                          cartItem ? (
                            <div className="flex items-center justify-between gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
                              <button onClick={() => updateQuantity(product.id, -1)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-900 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm font-black border border-slate-200 shrink-0">
                                <Minus size={14} strokeWidth={2.5} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={cartItem.quantity}
                                onChange={e => setQuantityDirect(product.id, e.target.value)}
                                className="font-black text-purple-700 text-sm w-full text-center bg-transparent outline-none border-none"
                              />
                              <button onClick={() => updateQuantity(product.id, 1)} className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-sm font-black shrink-0">
                                <Plus size={14} strokeWidth={2.5} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(product)} className="w-full py-2.5 rounded-xl font-black text-xs bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                              📬 অনুরোধ করুন (Request)
                            </button>
                          )
                        ) : (
                          <div className="w-full py-2.5 rounded-xl font-black text-sm bg-red-50 text-red-500 border border-red-200 flex flex-col items-center justify-center gap-1 cursor-not-allowed">
                            <div className="flex items-center gap-1.5"><span className="text-base">🚫</span> স্টক আউট</div>
                            <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Frozen — অর্ডার বন্ধ</span>
                          </div>
                        )
                      ) : cartItem ? (
                        <div className="flex items-center justify-between gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
                          <button onClick={() => updateQuantity(product.id, -1)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-900 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm font-black border border-slate-200 shrink-0">
                            <Minus size={14} strokeWidth={2.5} />
                          </button>
                          {/* Editable quantity box */}
                          <input
                            type="number"
                            min="1"
                            value={cartItem.quantity}
                            onChange={e => setQuantityDirect(product.id, e.target.value)}
                            className="font-black text-purple-700 text-sm w-full text-center bg-transparent outline-none border-none"
                          />
                          <button onClick={() => updateQuantity(product.id, 1)} className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-sm font-black shrink-0">
                            <Plus size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)} className="w-full py-2.5 rounded-xl font-black text-sm bg-slate-900 text-white hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 shadow-sm">
                          <Plus size={15} strokeWidth={2.5} /> কার্টে যোগ করুন
                        </button>
                      )}
                      {product.stock !== 0 && (product.allowCustomize || (product.sizes && product.sizes.length > 0) || (product.variants && product.variants.length > 0)) && (
                        <button
                          onClick={() => setSelectedProductForModal(product)}
                          className="w-full py-2 rounded-xl font-black text-xs border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Sparkles size={13} /> কাস্টমাইজ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── PREMIUM FOOTER ── */}
      <footer className="relative mt-auto overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-[96%] xl:max-w-[98%] 2xl:max-w-[99%] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {shop.logoUrl ? (
                  <img loading="lazy" src={shop.logoUrl} className="w-12 h-12 rounded-2xl border-2 border-purple-500/30 object-cover shadow-lg shadow-purple-900/30" alt="Logo" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg">{shop.shopName?.[0]}</div>
                )}
                <h2 className="text-2xl font-black text-white">{shop.shopName}</h2>
              </div>
              {shop.slogan && (
                <p className="text-slate-400 text-sm font-medium leading-relaxed italic">"{shop.slogan}"</p>
              )}
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                  <span className="text-xs text-slate-500 font-bold ml-1">বিশ্বস্ত সেবা</span>
                </div>
                <a href="https://bdretailers.com/reviews" target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:text-purple-300 font-black underline flex items-center gap-1">
                  Platform Reviews <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">দ্রুত নেভিগেশন</h3>
              <div className="space-y-2">
                {categories.slice(0, 5).map(c => (
                  <button key={c.id} onClick={() => { setActiveCategory(c.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="block text-slate-400 hover:text-purple-400 text-sm font-bold transition-colors">
                    → {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Social & Contact */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">যোগাযোগ করুন</h3>
              <div className="space-y-3">
                {(() => {
                  const rawEmail = shop.deliveryConfig?.contactEmail || shop.ownerEmail || '';
                  const hasEmailPlaceholder = rawEmail.toLowerCase().includes('no contact') || rawEmail.toLowerCase().includes('registered') || rawEmail.toLowerCase().includes('endpoint');
                  const finalEmail = hasEmailPlaceholder ? 'support@bdretailers.com' : rawEmail || 'support@bdretailers.com';

                  const rawWa = shop.deliveryConfig?.contactWhatsapp || shop.socialLinks?.wa || shop.socialLinks?.whatsapp || '';
                  const hasWaPlaceholder = rawWa.toLowerCase().includes('no contact') || rawWa.toLowerCase().includes('registered') || rawWa.toLowerCase().includes('endpoint');
                  const finalWa = hasWaPlaceholder ? '8801734763306' : rawWa || '8801734763306';

                  const cleanWa = finalWa.replace(/[^0-9]/g, '');
                  const formattedWa = cleanWa.startsWith('88') ? cleanWa : `88${cleanWa}`;

                  return (
                    <>
                      <a href={`mailto:${finalEmail}`} className="flex items-center gap-2 text-slate-400 hover:text-purple-400 group transition-colors">
                        <Bot size={14} className="group-hover:text-purple-400" />
                        <span className="text-sm font-bold group-hover:text-slate-200 transition-colors">{finalEmail}</span>
                      </a>
                      <a href={`https://wa.me/${formattedWa}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 group transition-colors">
                        <Phone size={14} className="group-hover:text-emerald-400" />
                        <span className="text-sm font-bold group-hover:text-slate-200 transition-colors">
                          {finalWa.startsWith('+') || finalWa.startsWith('88') ? finalWa : `+88${finalWa.replace(/^0+/, '')}`}
                        </span>
                      </a>
                    </>
                  );
                })()}
              </div>
              <div className="flex gap-3 flex-wrap pt-2">
                {shop.socialLinks?.fb && (
                  <a href={shop.socialLinks.fb} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 text-slate-400 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {shop.socialLinks?.insta && (
                  <a href={shop.socialLinks.insta} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gradient-to-br hover:from-pink-600 hover:to-orange-500 hover:border-pink-600 text-slate-400 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {shop.socialLinks?.yt && (
                  <a href={shop.socialLinks.yt} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600 hover:border-red-600 text-slate-400 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                  </a>
                )}
                {shop.socialLinks?.wa && (
                  <a href={`https://wa.me/${shop.socialLinks.wa.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-600 hover:border-emerald-600 text-slate-400 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </a>
                )}
                {shop.socialLinks?.linkedin && (
                  <a href={shop.socialLinks.linkedin} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-700 hover:border-blue-700 text-slate-400 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                )}
                {shop.socialLinks?.tiktok && (
                  <a href={shop.socialLinks.tiktok} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-slate-800 hover:border-slate-600 text-slate-400 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  </a>
                )}
              </div>
              {hasFreeDelivery && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2">
                  <Gift size={16} className="text-amber-400 shrink-0" />
                  <p className="text-amber-300 text-xs font-black">আপনার আজকে ফ্রি ডেলিভারি আছে! 🎁</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs font-black flex flex-col gap-1.5 md:text-left text-center">
              <span className="uppercase tracking-[0.25em]">© {new Date().getFullYear()} {shop.shopName} — সর্বস্বত্ত্ব সংরক্ষিত।</span>
              <span className="text-xs text-purple-300 font-bold normal-case tracking-normal block mt-1">
                🚀 Want to launch your own professional online store in minutes just like this? <a href="https://bdretailers.com/become-retailer" target="_blank" rel="noreferrer" className="underline font-black hover:text-purple-100 text-white ml-1">Start Free Trial now!</a>
              </span>
              <span className="text-xs text-purple-300 font-bold mt-1">
                এই ওয়েবসাইটটি বিডি রিটেইলার্স (<a href="https://bdretailers.com" target="_blank" rel="noreferrer" className="underline font-black hover:text-purple-100 text-white">bdretailers.com</a>) দ্বারা তৈরি।
              </span>
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-600">
                বানানো হয়েছে <a href="https://bdretailers.com" target="_blank" rel="noreferrer" className="underline hover:text-white font-black text-slate-500">bdretailers.com</a> দিয়ে
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Scroll To Top / Bottom Buttons ── */}
      <div className="fixed left-4 bottom-24 z-40 flex flex-col gap-2 md:bottom-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-11 h-11 bg-white border border-slate-200 shadow-lg rounded-2xl flex items-center justify-center text-slate-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all active:scale-90"
          title="উপরে যান"
        >
          <ChevronLeft size={18} style={{transform:'rotate(90deg)'}} strokeWidth={2.5}/>
        </button>
        <button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="w-11 h-11 bg-white border border-slate-200 shadow-lg rounded-2xl flex items-center justify-center text-slate-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all active:scale-90"
          title="নিচে যান"
        >
          <ChevronRight size={18} style={{transform:'rotate(90deg)'}} strokeWidth={2.5}/>
        </button>
      </div>

      {/* ── Floating Buttons (Right Bottom - Updated) ── */}
      <div className="fixed bottom-24 right-6 md:bottom-8 z-40 flex flex-col items-end gap-4">
        
        {/* Floating Cart Button */}
        <button 
          onClick={() => setIsCartOpen(true)} 
          className="relative w-[60px] h-[60px] bg-slate-900 text-white rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 transition-transform group"
        >
          <ShoppingCart size={24} className="group-hover:rotate-12 transition-transform" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[12px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
              {cartCount}
            </span>
          )}
        </button>

        {/* AI Floating Companion (Stacked Below Cart) */}
        <div className="relative group flex flex-col items-end gap-3">
          <button onClick={() => setIsAiOpen(true)} className="w-[60px] h-[60px] bg-white rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.1)] flex items-center justify-center hover:scale-110 transition-transform relative group border-2 border-purple-100">
            <CuteAIIcon />
          </button>
          <div className="bg-slate-900 px-5 py-3 rounded-2xl rounded-br-none shadow-2xl border border-slate-700 text-sm font-black text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-2 absolute right-[75px] bottom-0 pointer-events-none">
            প্রশ্ন করুন! ✨
          </div>
        </div>

        {/* Messenger Button */}
        <MessengerButton shop={shop} />
      </div>

      {/* ── Mobile Bottom Nav Bar (hamburger + cart) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-200 shadow-xl flex items-center justify-around px-4 py-3 safe-bottom">
        <button onClick={() => setIsCategoryMenuOpen(true)} className="flex flex-col items-center gap-1 text-slate-600 hover:text-purple-700 transition-colors">
          <Menu size={22} strokeWidth={2} />
          <span className="text-[10px] font-black uppercase tracking-wide">মেনু</span>
        </button>
        <button onClick={() => setIsCartOpen(true)} className="relative flex flex-col items-center gap-1 text-slate-600 hover:text-purple-700 transition-colors">
          <ShoppingCart size={22} strokeWidth={2} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">{cartCount}</span>
          )}
          <span className="text-[10px] font-black uppercase tracking-wide">কার্ট</span>
        </button>
        <button onClick={() => setIsAiOpen(true)} className="flex flex-col items-center gap-1 text-slate-600 hover:text-purple-700 transition-colors">
          <svg width="22" height="22" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#a855f7" /><circle cx="35" cy="45" r="5" fill="white" /><circle cx="65" cy="45" r="5" fill="white" /><path d="M40,65 Q50,72 60,65" stroke="white" strokeWidth="3" strokeLinecap="round" /></svg>
          <span className="text-[10px] font-black uppercase tracking-wide">এআই</span>
        </button>
        <button onClick={() => setIsProfileOpen(true)} className="flex flex-col items-center gap-1 text-slate-600 hover:text-purple-700 transition-colors">
          {user?.photoURL ? (
            <img src={user.photoURL} className="w-6 h-6 rounded-full object-cover" alt="" />
          ) : (
            <User size={22} strokeWidth={2} />
          )}
          <span className="text-[10px] font-black uppercase tracking-wide">প্রফাইল</span>
        </button>
      </div>

      {/* ── FAQ Interactive Modal ── */}
      {isFaqOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFaqOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] animate-slide-in">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">❓ সাধারণ জিজ্ঞাসা (FAQ)</h2>
              <button onClick={() => setIsFaqOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {shop.faqItems && shop.faqItems.length > 0 ? (
                shop.faqItems.map((faq, idx) => (
                  <FaqAccordionItem key={idx} question={faq.q} answer={faq.a} />
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 font-bold text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  কোনো সাধারণ জিজ্ঞাসা (FAQ) যুক্ত করা নেই।
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setOrderSuccess(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 text-center animate-slide-in space-y-5">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-4xl">🎉</div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">অর্ডার সফল!</h2>
              <p className="text-sm text-slate-500 font-bold mt-1">Order ID: <span className="text-purple-700 font-black">#{orderSuccess.orderIdVisual}</span></p>
            </div>
            <button
              onClick={() => generatePDF(orderSuccess)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-lg"
            >
              <Download size={20} /> PDF ডাউনলোড করুন
            </button>
            <button onClick={() => setOrderSuccess(null)} className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-colors">
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* ── Login Required Modal ── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 text-center animate-slide-in space-y-5">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <User size={28} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">লগইন প্রয়োজন</h2>
              <p className="text-sm text-slate-500 font-bold mt-2">অর্ডার করতে অনুগ্রহ করে লগইন করুন।</p>
            </div>
            
            <div className="space-y-3">
              {shop.authSettings?.googleAuth !== false && (
                <button
                  onClick={async () => {
                    // Set flag so order modal reopens after successful login
                    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('returnToCheckout', 'true');
                    setShowLoginModal(false);
                    await handleGoogleLogin();
                  }}
                  className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center gap-3 font-black text-slate-800 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt=""/>
                  গুগল দিয়ে লগইন করুন
                </button>
              )}

              {shop.authSettings?.emailAuth && (
                <div className="space-y-3 pt-2 border-t border-slate-100 text-left">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">ইমেইল দিয়ে ওটিপি লগইন</p>
                  <input 
                    type="email" 
                    placeholder="আপনার ইমেইল (যেমন: customer@gmail.com)" 
                    disabled={otpSent || otpLoading}
                    value={loginEmail}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-purple-600 disabled:opacity-60"
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                  
                  {otpSent && (
                    <div className="space-y-2 animate-slide-in">
                      <input 
                        type="text" 
                        maxLength={6}
                        placeholder="৬ সংখ্যার ওটিপি কোড লিখুন" 
                        disabled={otpLoading}
                        value={otpCode}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-purple-600 text-center tracking-widest"
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      />
                      <div className="flex justify-between items-center text-xs font-bold px-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          ⏳ মেয়াদ: <span className="text-red-500 font-extrabold">{formatOtpTime(otpTimer)}</span>
                        </span>
                        <button 
                          onClick={handleSendOTP} 
                          disabled={otpLoading || otpTimer > 0}
                          className="text-purple-600 hover:underline active:scale-95 disabled:opacity-50 disabled:no-underline"
                        >
                          আবার পাঠান (Resend)
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={otpSent ? handleVerifyOTP : handleSendOTP}
                    disabled={otpLoading || !loginEmail || (otpSent && otpTimer === 0)}
                    className="w-full py-3.5 bg-slate-900 hover:bg-purple-600 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-purple-600/10 disabled:opacity-60"
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> লোড হচ্ছে...
                      </>
                    ) : (
                      otpSent ? 'ওটিপি ভেরিফাই ও লগইন' : 'ওটিপি কোড পাঠান'
                    )}
                  </button>
                </div>
              )}

              {shop.authSettings?.googleAuth === false && !shop.authSettings?.emailAuth && (
                <p className="text-sm text-slate-500 font-bold">এই শপে লগইন সুবিধা বন্ধ আছে। অতিথি হিসেবে অর্ডার করুন।</p>
              )}
            </div>

            <button onClick={() => setShowLoginModal(false)} className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-colors">
              পরে করব
            </button>
          </div>
        </div>
      )}

      {/* ── AI Modal (Chat + Voice + OCR + Text) ── */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAiOpen(false)} />
          <div className="relative w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] max-h-[700px] border border-slate-200 animate-slide-in">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b-[4px] border-purple-600 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-purple-100 overflow-hidden" style={{transform:'scale(0.75)'}}>
                  <CuteAIIcon />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-tight leading-tight">{shop.aiConfig?.botName || 'Bazar Bot'}</h3>
                  <p className="text-[10px] uppercase font-black text-purple-300 tracking-widest">AI Shopping Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsAiOpen(false)} className="hover:bg-white/20 p-2 rounded-xl text-slate-300 hover:text-white transition-colors"><X size={20} strokeWidth={2.5}/></button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
              {[
                {id:'chat',label:'চ্যাট',icon:'💬', always: true},
                {id:'meal',label:'স্মার্ট মিল',icon:'🍱', always: isGroceryShop},
                {id:'voice',label:'ভয়েস',icon:'🎤', always: true},
                {id:'image',label:'ছবি OCR',icon:'📷', always: true},
                {id:'text',label:'লিস্ট',icon:'📝', always: true},
              ].filter(tab => tab.always || tab.show).map(tab => (
                <button key={tab.id} onClick={() => setAiTab(tab.id)}
                  className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all ${aiTab === tab.id ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Chat Tab */}
            {aiTab === 'chat' && <>
              <div className="flex-1 p-4 bg-slate-50 flex flex-col gap-3 overflow-y-auto relative pb-16">
                {chatMessages.map(msg => {
                  const suggestedItems = getSuggestedProductsForMessage(msg);
                  return (
                    <div key={msg.id} className={`max-w-[90%] flex flex-col gap-2 ${msg.role === 'bot' ? 'self-start' : 'self-end'}`}>
                      <div className={`p-3.5 rounded-2xl text-sm font-bold shadow-sm leading-relaxed ${msg.role === 'bot' ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-purple-600 text-white rounded-tr-none'}`}>
                        {msg && msg.text && typeof msg.text === 'string' 
                          ? msg.text.replace(/PRODUCTS_JSON:.*$/s, '').trim() 
                          : (msg ? msg.text : '')}
                      </div>
                      
                      {/* Individual Suggested Products card layout */}
                      {suggestedItems && Array.isArray(suggestedItems) && suggestedItems.length > 0 && (
                        <div className="mt-1 flex flex-col gap-2 bg-slate-100/90 p-2.5 rounded-2xl border border-slate-200/60 max-w-full">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-1">AI সাজেস্টেড প্রোডাক্টস:</p>
                          <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                            {suggestedItems.map(({ product, qty, customizedText, note }) => {
                              const inCart = cart && Array.isArray(cart) ? cart.find(item => item.id === product.id) : null;
                              return (
                                <div key={product.id} className="bg-white p-2 rounded-xl border border-slate-200/50 flex items-center justify-between gap-3 shadow-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {product.image ? (
                                      <img src={product.image} alt={product.name} className="w-8 h-8 rounded-lg object-cover bg-slate-50 shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 text-xs font-black flex items-center justify-center shrink-0">🛍</div>
                                    )}
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-bold text-slate-800 truncate">{product.name}</h4>
                                      <p className="text-[10px] text-slate-500 font-bold">
                                        ৳{product.price} {product.unit ? `/ ${product.unit}` : ''}
                                        {qty > 1 && ` (qty: ${qty})`}
                                        {note && ` [${note}]`}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      addToCart(product, qty, customizedText, note);
                                      toast.success(`${product.name} কার্টে যোগ হয়েছে!`);
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${inCart ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                                  >
                                    {inCart ? 'যুক্ত আছে' : '+ কার্ট'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* All-in-one button option */}
                          <button onClick={() => addAllSuggestedToCart(msg.text)}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl shadow-xs transition-colors uppercase tracking-wider">
                            <ShoppingCart size={12} /> সব কার্টে যোগ করুন
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isAiTyping && <div className="max-w-[85%] p-3.5 rounded-2xl bg-white border border-slate-200 self-start flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div>}
              </div>
              <div className="p-3.5 bg-white border-t border-slate-200 flex gap-2 shrink-0 relative">
                {isGroceryShop && (
                  <div className="absolute -top-10 right-4 z-10">
                    <button onClick={() => setAiTab('meal')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors">
                      <Sparkles size={12}/> স্মার্ট সাজেশন
                    </button>
                  </div>
                )}
                <button onClick={() => setChatMessages([{ id: 1, role: 'bot', text: 'নতুন চ্যাট শুরু হলো!' }])} className="px-2 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 text-[10px] font-black transition-colors" title="Clear">🗑</button>
                <input type="text" placeholder="ম্যাসেজ লিখুন..." className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-colors placeholder:text-slate-400" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage(chatInput)} />
                <button onClick={() => sendChatMessage(chatInput)} className="bg-slate-900 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors shadow-md"><MessageCircle size={20} strokeWidth={2.5}/></button>
              </div>
              
              {showAiSuggestionModal && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center p-4 z-50 rounded-2xl pb-16">
                  <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-purple-100 flex flex-col gap-4 animate-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Sparkles size={16}/></div>
                        <h3 className="font-black text-sm text-slate-800">AI স্মার্ট সাজেশন</h3>
                      </div>
                      <button onClick={() => setShowAiSuggestionModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
                    </div>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">আপনার মেসের সাইজ এবং বাজেট অনুযায়ী বেস্ট ভ্যালু ফর মানি বাজার লিস্ট তৈরি করে দিবে AI।</p>
                    <div className="space-y-3">
                      <input type="number" placeholder="মেসের বর্ডার কয়জন? (যেমন: ৫)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-purple-600" value={suggestionForm.members} onChange={e => setSuggestionForm({...suggestionForm, members: e.target.value})} />
                      <input type="number" placeholder="মোট বাজেট কত টাকা? (যেমন: ২০০০)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-purple-600" value={suggestionForm.budget} onChange={e => setSuggestionForm({...suggestionForm, budget: e.target.value})} />
                    </div>
                    <button 
                      onClick={() => {
                        setShowAiSuggestionModal(false);
                        sendChatMessage(`আমাদের মেসের বর্ডার ${suggestionForm.members || 1} জন। বাজারের বাজেট ${suggestionForm.budget || 500} টাকা। 
নিয়ম: 
১. সকালে ভাতের সাথে ভর্তা বা শাক। 
২. দুপুরে যেকোনো আমিষ এবং ২-১ টা সবজি। 
৩. রাতেও দুপুরের মত একই। 
৪. বয়লার মুরগির পিস সাজেস্ট করবে না, বরং আস্ত মুরগি নিয়ে পিস করে নিতে বলবে। 
এই নিয়মে সেরা ভ্যালু ফর মানি এবং টপ সেল বাজার লিস্ট তৈরি করো।`);
                        setSuggestionForm({ members: '', budget: '' });
                      }}
                      className="w-full py-3 bg-purple-600 text-white rounded-xl font-black text-sm hover:bg-purple-700 transition-colors">
                      সাজেশন নিন
                    </button>
                  </div>
                </div>
              )}
            </>}

            {/* Voice / Image / Text tabs via AiVoicePanel */}
            {aiTab !== 'chat' && aiTab !== 'meal' && (
              <AiVoicePanel
                shop={shop}
                products={products}
                onAddToCart={(item) => { setCart(prev => { const ex = prev.findIndex(i => i.id === item.id); if (ex >= 0) { const n = [...prev]; n[ex] = {...n[ex], quantity: n[ex].quantity + (item.quantity||1)}; return n; } return [...prev, item]; }); }}
                onDirectOrder={handleDirectOrderFromAi}
                isOpen={true}
                  onClose={() => setIsAiOpen(false)}
                  activeTab={aiTab}
                />
            )}

            {/* Smart Meal Engine tab */}
            {aiTab === 'meal' && (
              <SmartMealEngine
                shop={shop}
                products={products}
                onAddToCart={addToCart}
                onClose={() => setIsAiOpen(false)}
                userOrders={userOrders}
              />
            )}
          </div>
        </div>
      )}

            {/* ── Cart Drawer ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in border-l border-slate-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3"><ShoppingCart size={22} className="text-purple-600"/> আমার কার্ট</h2>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button 
                    onClick={() => {
                      if (confirm('আপনি কি কার্টের সব প্রোডাক্ট মুছে ফেলতে চান?')) {
                        setCart([]);
                        toast.success('কার্ট খালি করা হয়েছে 🗑️');
                      }
                    }}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                  >
                    সব মুছুন
                  </button>
                )}
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all"><X size={20} strokeWidth={2.5} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-5 text-slate-300">
                  <ShoppingCart size={56} strokeWidth={1.5} />
                  <p className="font-extrabold text-slate-400">আপনার কার্ট খালি আছে</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex gap-4 items-center shadow-sm">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-slate-100">
                    {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className={`w-full h-full flex items-center justify-center ${getFallbackColor(item.name)}`}><p className="text-[10px] font-black text-white px-1 truncate">{item.name}</p></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm text-slate-900 truncate">{item.name}</h4>
                    {item.note && <p className="text-[10px] font-bold text-purple-600 truncate mt-0.5 italic">নোট: {item.note}</p>}
                    
                    {/* Editable Total Price Box & Read-only Unit Price */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-500">৳</span>
                      <input 
                        type="number" 
                        value={item.price === '' ? '' : Math.round(parseFloat(item.price || 0) * (parseFloat(item.quantity) || 0))} 
                        onChange={e => updateCartItemTotalPrice(item.id, e.target.value)} 
                        className="w-16 px-1.5 py-1 text-xs font-black text-purple-700 bg-purple-50 border border-purple-200 rounded-xl outline-none focus:border-purple-500 text-center" 
                        title="মোট দাম (এডিটেবল)"
                      />
                      <span className="text-[10px] font-bold text-slate-400">মোট</span>
                      
                      {(() => {
                        const originalProduct = products.find(p => p.id === (item.productId || item.id));
                        const baseUnit = originalProduct?.smartCalc?.enabled ? originalProduct.smartCalc.baseUnit : 'পিস';
                        const basePrice = originalProduct?.smartCalc?.enabled ? originalProduct.smartCalc.basePrice : (originalProduct?.price || item.price);
                        const baseQty = originalProduct?.smartCalc?.enabled ? originalProduct.smartCalc.baseQuantity : 1;
                        return (
                          <span className="text-[10px] font-black text-slate-500 border-l border-slate-200 pl-2 ml-1">
                            ৳{basePrice} / {baseQty !== 1 ? `${baseQty} ` : ''}{baseUnit} (মূল দাম)
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1.5 mt-2.5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-all"><Minus size={14} strokeWidth={2.5}/></button>
                      
                      {/* Enriched & enlarged quantity input box */}
                      <input 
                        type="number" 
                        min="1" 
                        step="any" 
                        value={item.quantity} 
                        onChange={e => setQuantityDirect(item.id, e.target.value)} 
                        className="w-20 h-9 text-center text-sm sm:text-base font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500 px-2 shadow-inner" 
                      />
                      
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-purple-600 transition-all"><Plus size={14} strokeWidth={2.5}/></button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                      <button onClick={() => { 
                        trackStoreEvent('select_content', { content_type: 'product', item_id: item.productId, name: item.name }); 
                        const originalProduct = products.find(p => p.id === (item.productId || item.id));
                        if (originalProduct) {
                          setSelectedProductForModal(originalProduct);
                        } else {
                          setSelectedProductForModal(item);
                        }
                        setIsCartOpen(false); 
                      }} className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors p-2 rounded-lg" title="Edit/Customize"><Edit2 size={16} strokeWidth={2.5} /></button>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-lg" title="Remove"><X size={16} strokeWidth={2.5} /></button>
                    </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
                {hasFreeDelivery && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex items-center gap-2">
                    <Gift size={16} className="text-emerald-600" />
                    <p className="text-emerald-700 text-xs font-black">🎉 আপনার ফ্রি ডেলিভারি প্রযোজ্য!</p>
                  </div>
                )}
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-slate-900">মোট (ডেলিভারি বাদে)</span>
                  <span className="text-2xl font-black text-purple-700">৳{cartTotal}</span>
                </div>
                <button 
                  onClick={() => {
                    if (shop.isStrictLocation && locationStatus !== 'available') {
                      toast.error('দুঃখিত, আপনার লোকেশনে আমাদের সার্ভিস নেই। অর্ডার করা যাবে না।');
                      return;
                    }
                    const requireLogin = shop.authSettings?.requireLoginBeforeOrder ?? true;
                    if (requireLogin && !user) {
                      if (typeof sessionStorage !== 'undefined') {
                        sessionStorage.setItem('returnToCheckout', 'true');
                      }
                      setIsCartOpen(false);
                      setShowLoginModal(true);
                      return;
                    }
                    setIsOrderOpen(true);
                    setIsCartOpen(false);
                  }} 
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-lg"
                >
                  পরবর্তী ধাপ <ArrowRight size={20} strokeWidth={2.5}/>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Checkout Modal ── */}
      {isOrderOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOrderOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl h-[90vh] overflow-y-auto border border-slate-200 animate-slide-in">
            <div className="flex justify-between items-center sticky top-0 bg-white py-3 z-10 border-b-2 border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">চেকআউট</h2>
              <button onClick={() => setIsOrderOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-700"><X size={20} strokeWidth={2.5} /></button>
            </div>

            {hasFreeDelivery && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <Gift size={22} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="font-black text-emerald-800 text-sm">🎉 ফ্রি ডেলিভারি প্রযোজ্য!</p>
                  <p className="text-emerald-600 text-xs font-bold">৬ দিনের ধারা সম্পন্ন হওয়ায় আজকে ডেলিভারি ফ্রি।</p>
                </div>
              </div>
            )}

            {orderImage && (
              <div className="relative bg-slate-50 border-2 border-dashed border-purple-200 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest text-center">📷 সংযুক্ত ছবি (অর্ডারের সাথে যাবে)</p>
                <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-inner bg-white">
                  <img src={orderImage} className="w-full h-full object-contain" alt="Custom Order" />
                  <button 
                    type="button"
                    onClick={() => setOrderImage(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg shadow-lg hover:bg-red-700 transition-colors"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">পূর্নাঙ্গ নাম *</label>
                  <input required type="text" placeholder="আপনার নাম লিখুন..." className="w-full p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-black text-slate-900 outline-none focus:border-purple-600 focus:bg-white placeholder:font-bold placeholder:text-slate-400 transition-colors shadow-sm" value={orderForm.name} onChange={e => setOrderForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">ফোন নম্বর *</label>
                  <input required type="tel" maxLength={11} placeholder="01XXXXXXXXX" className={`w-full p-3.5 rounded-xl bg-slate-50 border-2 ${phoneError ? 'border-red-500' : 'border-slate-200 focus:border-purple-600'} text-sm font-black text-slate-900 outline-none focus:bg-white placeholder:font-bold placeholder:text-slate-400 transition-colors shadow-sm`} value={orderForm.phone} onChange={handlePhoneChange} />
                  {phoneError && <p className="text-[11px] text-red-600 font-bold pl-1">{phoneError}</p>}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">ঠিকানা *</label>
                    <button 
                      type="button" 
                      onClick={() => setIsMapOpen(true)} 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 border-2 ${
                        orderForm.coordinates 
                          ? 'bg-emerald-500 border-emerald-200 text-white' 
                          : shop.requireLocationForOrder === true 
                            ? 'bg-red-500 border-red-200 text-white animate-pulse' 
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                      title="মানচিত্রে লোকেশন চিহ্নিত করুন"
                    >
                      <MapPin size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                  <textarea required rows={3} placeholder="বাসা/বাড়ি, রোড, এলাকা" className="w-full p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-black text-slate-900 outline-none focus:border-purple-600 focus:bg-white placeholder:font-bold placeholder:text-slate-400 transition-colors shadow-sm resize-none" value={orderForm.address} onChange={e => setOrderForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">রিটেইলারকে নোট (ঐচ্ছিক)</label>
                  <textarea rows={2} placeholder="বিশেষ অনুরোধ, সাইজ, রং বা যেকোনো নির্দেশনা..." className="w-full p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-black text-slate-900 outline-none focus:border-purple-600 focus:bg-white placeholder:font-bold placeholder:text-slate-400 transition-colors shadow-sm resize-none" value={orderForm.note} onChange={e => setOrderForm(f => ({ ...f, note: e.target.value }))} />
                </div>
              </div>

              {/* Coupon Code Input */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">ডিসকাউন্ট কুপন (Coupon Code)</label>
                {appliedCouponCode ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                    <div>
                      <p className="text-xs font-black text-emerald-800">✅ কুপন {appliedCouponCode} সক্রিয়!</p>
                      <p className="text-[10px] text-emerald-600 font-bold">{couponDiscountPercent}% ডিসকাউন্ট পাওয়া গেছে।</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleRemoveCoupon} 
                      className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-black rounded-lg text-xs transition-colors"
                    >
                      মুছুন
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="কুপন কোড..." 
                      className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-xl outline-none focus:border-purple-600 text-sm font-black uppercase text-slate-900"
                      value={couponCodeInput}
                      onChange={e => { setCouponCodeInput(e.target.value); setCouponError(''); }}
                    />
                    <button 
                      type="button" 
                      onClick={handleApplyCoupon} 
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-colors"
                    >
                      প্রয়োগ
                    </button>
                  </div>
                )}
                {couponError && <p className="text-[11px] text-red-600 font-bold pl-1">{couponError}</p>}
              </div>

              {isAdvanceRequired ? (
                <div className="bg-purple-50 p-5 rounded-2xl border-2 border-purple-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-purple-700 mt-0.5 shrink-0" strokeWidth={2.5} />
                    <p className="text-sm font-bold text-purple-900 leading-snug">
                      {isCOD ? <>অর্ডার নিশ্চিত করতে ডেলিভারি চার্জ বাবদ <span className="font-black text-lg text-purple-700">৳{effectiveDelivery === 0 ? 'FREE' : effectiveDelivery}</span> অগ্রিম প্রদান করুন।</> : <>সর্বমোট <span className="font-black text-lg text-purple-700">৳{Math.max(0, (cart.length === 0 && orderImage ? 1 : cartTotal) - (appliedCouponCode ? Math.round(((cart.length === 0 && orderImage ? 1 : cartTotal) * couponDiscountPercent) / 100) : 0)) + effectiveDelivery}</span> পেমেন্ট করুন।</>}
                    </p>
                  </div>
                  
                  {shop?.piprapayEnabled && shop?.manualPaymentEnabled !== false && (
                    <div className="grid grid-cols-2 gap-3 mb-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('automated')}
                        className={`p-3.5 rounded-xl border-2 text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1.5 ${
                          paymentMethod === 'automated'
                            ? 'border-purple-600 bg-purple-100 text-purple-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm">⚡</span>
                        <span>অটো পেমেন্ট (বিকাশ/নগদ)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('manual')}
                        className={`p-3.5 rounded-xl border-2 text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1.5 ${
                          paymentMethod === 'manual'
                            ? 'border-purple-600 bg-purple-100 text-purple-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm">📝</span>
                        <span>ম্যানুয়াল পেমেন্ট</span>
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'manual' && (
                    <>
                      <div className="bg-white px-3 py-2 rounded-xl border border-purple-100 shadow-sm">
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-1">পেমেন্ট নাম্বার</p>
                        <p className="text-sm font-black text-purple-700">{shop.deliveryConfig?.methods}</p>
                      </div>
                      
                      <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">পেমেন্ট নাম্বার (যে নাম্বার থেকে টাকা পাঠিয়েছেন) *</label>
                          <input required={paymentMethod === 'manual'} type="tel" maxLength={11} placeholder="01XXXXXXXXX" className="w-full p-3.5 rounded-xl bg-white border-2 border-purple-300 text-sm font-black text-slate-900 outline-none focus:border-purple-600 shadow-sm" value={orderForm.paymentNumber} onChange={e => setOrderForm(f => ({ ...f, paymentNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">ট্রানজেকশন আইডি (TxnID) *</label>
                          <input required={paymentMethod === 'manual'} type="text" placeholder="বিকাশ/নগদ/রকেট TxnID" className="w-full p-3.5 rounded-xl bg-white border-2 border-purple-300 text-sm font-black text-slate-900 outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/20 shadow-sm" value={orderForm.txnId} onChange={e => setOrderForm(f => ({ ...f, txnId: e.target.value }))} />
                        </div>
                        {shop.deliveryConfig?.requirePaymentScreenshot && (
                          <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1 font-extrabold text-slate-800">পেমেন্ট প্রুফ স্ক্রিনশট আপলোড *</label>
                            <div className="border-2 border-dashed border-purple-300 rounded-xl p-4 flex flex-col items-center justify-center bg-white hover:bg-purple-50/30 transition-colors relative cursor-pointer min-h-[110px]">
                              <input 
                                required 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                onChange={handleScreenshotUpload}
                              />
                              {paymentScreenshot ? (
                                <div className="flex items-center gap-3 w-full z-10">
                                  <img src={paymentScreenshot} className="w-12 h-12 object-cover rounded-lg border border-purple-200" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">স্ক্রিনশট আপলোড হয়েছে</p>
                                    <p className="text-[10px] text-slate-400 font-bold">ক্লিক করে পরিবর্তন করতে পারেন</p>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setPaymentScreenshot('');
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-red-500 z-30 cursor-pointer"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <ImagePlus size={24} className="text-purple-400 mb-1" />
                                  <p className="text-xs font-bold text-slate-600 text-center">এখানে ক্লিক করে স্ক্রিনশট আপলোড করুন</p>
                                  <p className="text-[9px] text-slate-400 text-center">সর্বোচ্চ ২MB, JPG/PNG</p>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-lg">🤝</span>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">পেমেন্ট পদ্ধতি: ক্যাশ অন ডেলিভারি (Cash on Delivery)</p>
                  </div>
                  {shop.deliveryConfig?.methods && (
                     <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">যোগাযোগ নাম্বার / পেমেন্ট নাম্বার</p>
                        <p className="text-sm font-black text-slate-700">{shop.deliveryConfig?.methods}</p>
                     </div>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-slate-100 border-2 border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm text-slate-600 font-bold"><span>প্রোডাক্টস (×{cartCount || (orderImage ? 'ছবি থেকে' : 0)})</span><span className="text-slate-900 font-black">৳{(cart.length === 0 && orderImage ? 1 : cartTotal)}</span></div>
                {appliedCouponCode && (
                  <div className="flex justify-between text-sm text-emerald-600 font-bold">
                    <span>কুপন ডিসকাউন্ট ({couponDiscountPercent}%)</span>
                    <span>- ৳{Math.round(((cart.length === 0 && orderImage ? 1 : cartTotal) * couponDiscountPercent) / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-600 font-bold">
                  <span>ডেলিভারি চার্জ</span>
                  <span className={`font-black ${effectiveDelivery === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{effectiveDelivery === 0 ? 'FREE 🎁' : `৳${effectiveDelivery}`}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200 font-black text-slate-900 text-xl">
                  <span>সর্বমোট</span>
                  <span className="text-purple-700 text-2xl">৳{Math.max(0, (cart.length === 0 && orderImage ? 1 : cartTotal) - (appliedCouponCode ? Math.round(((cart.length === 0 && orderImage ? 1 : cartTotal) * couponDiscountPercent) / 100) : 0)) + effectiveDelivery}</span>
                </div>
              </div>

              <button disabled={placing} type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-xl disabled:opacity-50 mt-4">
                {placing ? <><Loader2 className="animate-spin" size={20} /> প্রসেস হচ্ছে...</> : <><CheckCircle size={20} strokeWidth={2.5}/> অর্ডার প্লেস করুন</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Map Modal ── */}
      <MapModal 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        shop={shop} 
        onConfirm={(coords, addr) => {
          setOrderForm(f => ({
            ...f,
            address: `${addr}\n[ম্যাপ: https://maps.google.com/?q=${coords.lat},${coords.lng}]`,
            coordinates: { lat: coords.lat, lng: coords.lng, link: `https://maps.google.com/?q=${coords.lat},${coords.lng}` }
          }));
          setIsMapOpen(false);
        }}
        initialCoordinates={orderForm.coordinates}
      />

      {/* ── Common Order Sheet Modal ── */}
      {isCommonOrderOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCommonOrderOpen(false)} />
          <div className="relative w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl h-[90vh] flex flex-col border border-slate-200 animate-slide-in">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-slate-100 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  📋 কমন অর্ডার শিট
                </h2>
                <p className="text-xs text-slate-500 font-bold mt-1">সব পণ্য একসাথে এক পেজ থেকে দ্রুত অর্ডার করুন।</p>
              </div>
              <button 
                onClick={() => setIsCommonOrderOpen(false)} 
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-700"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Content (Table & Rows) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                <div className="col-span-4">পণ্য</div>
                <div className="col-span-2 text-center">পরিমাণ / ওজন (Weight)</div>
                <div className="col-span-2 text-center">মোট মূল্য ৳ (Price)</div>
                <div className="col-span-2 text-center">কাটিং সাইজ / পিস (Piece)</div>
                <div className="col-span-1 text-center">হিসাবকৃত দাম</div>
                <div className="col-span-1 text-right">অ্যাকশন</div>
              </div>

              <div className="divide-y divide-slate-100">
                {products.filter(p => p.showInCommonOrder).sort((a, b) => {
                  const timeA = a.commonOrderUpdatedAt || 0;
                  const timeB = b.commonOrderUpdatedAt || 0;
                  if (timeA !== timeB) return timeA - timeB;
                  return a.name.localeCompare(b.name, 'bn');
                }).map(product => {
                  const row = commonOrderRows[product.id] || { qty: '', price: '', piece: '', finalPrice: 0 };
                  const baseUnit = product.smartCalc?.enabled ? product.smartCalc.baseUnit : 'পিস';
                  const basePrice = product.smartCalc?.enabled ? product.smartCalc.basePrice : product.price;
                  const baseQty = product.smartCalc?.enabled ? product.smartCalc.baseQuantity : 1;
                  const unitRateText = `৳${basePrice} / ${baseQty} ${baseUnit}`;

                  return (
                    <div key={product.id} className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-2 hover:bg-slate-50/50 rounded-2xl transition-all">
                      {/* Product details */}
                      <div className="col-span-1 md:col-span-4 flex items-center gap-3 w-full">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" alt="" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-lg shrink-0">📦</div>
                        )}
                        <div className="flex-1 flex justify-between items-center pr-2">
                          <div>
                            <h4 className="font-black text-slate-900 text-sm">{product.name}</h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase mt-0.5">{unitRateText}</p>
                          </div>
                          {/* Show final price on the right side of the product name on mobile */}
                          <div className="text-right shrink-0 md:hidden">
                            <span className="font-black text-slate-800 text-sm">৳{row.finalPrice || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Inputs & Add button Row on mobile, columns on desktop */}
                      <div className="col-span-1 md:col-span-8 grid grid-cols-4 md:grid-cols-8 gap-2 items-center w-full">
                        {/* Weight/Qty Input (Column A) */}
                        <div className="col-span-1 md:col-span-2">
                          <div className="relative">
                            <input 
                              type="number" 
                              step="any"
                              placeholder="পরিমাণ" 
                              className="w-full pl-2 pr-7 py-2 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-purple-600 bg-slate-50/50 focus:bg-white transition-colors"
                              value={row.qty}
                              onChange={e => handleCommonOrderChange(product, 'qty', e.target.value)}
                            />
                            <span className="absolute right-2 top-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">{baseUnit}</span>
                          </div>
                        </div>

                        {/* Price Input (Column B) */}
                        <div className="col-span-1 md:col-span-2">
                          <div className="relative">
                            <input 
                              type="number" 
                              placeholder="৳ দাম" 
                              className="w-full pl-5 pr-1 py-2 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-purple-600 bg-slate-50/50 focus:bg-white transition-colors"
                              value={row.price}
                              onChange={e => handleCommonOrderChange(product, 'price', e.target.value)}
                            />
                            <span className="absolute left-2 top-2.5 text-xs font-black text-slate-400">৳</span>
                          </div>
                        </div>

                        {/* Piece/Cut Input (Column C) */}
                        <div className="col-span-1 md:col-span-2">
                          <input 
                            type="text" 
                            placeholder="উদা: ১০ পিস" 
                            className="w-full px-2 py-2 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-purple-600 bg-slate-50/50 focus:bg-white transition-colors"
                            value={row.piece}
                            onChange={e => handleCommonOrderChange(product, 'piece', e.target.value)}
                          />
                        </div>

                        {/* Final Price Readonly (Column D) - hidden on mobile, visible on desktop */}
                        <div className="hidden md:block md:col-span-1 text-center font-black text-slate-800 text-sm">
                          ৳{row.finalPrice || 0}
                        </div>

                        {/* Add button */}
                        <div className="col-span-1 md:col-span-1 text-right">
                          <button 
                            onClick={() => addCommonOrderRowToCart(product)}
                            className="w-full px-1 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black hover:bg-purple-600 transition-colors uppercase tracking-tight active:scale-95 text-center"
                          >
                            যোগ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {products.filter(p => p.showInCommonOrder).length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-400 font-bold text-sm">কমন অর্ডারের জন্য কোনো প্রোডাক্ট উপলব্ধ নেই।</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <button 
                onClick={() => setIsCommonOrderOpen(false)}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                বন্ধ করুন
              </button>
              {(() => {
                const commonOrderTotal = Object.values(commonOrderRows).reduce((sum, row) => sum + (parseFloat(row.finalPrice) || 0), 0);
                return commonOrderTotal > 0 ? (
                  <div className="text-slate-900 font-extrabold text-sm flex items-center gap-1">
                    মোট হিসাবকৃত দাম: <span className="text-purple-600 text-base font-black">৳{commonOrderTotal}</span>
                  </div>
                ) : null;
              })()}
              <button 
                onClick={addAllCommonOrderToCart}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10 active:scale-95"
              >
                <ShoppingCart size={14} strokeWidth={2.5} /> সব একসাথে কার্টে যোগ করুন
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Profile Drawer ── */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)} />
          <div className="relative w-full max-w-sm h-full bg-slate-50 shadow-2xl flex flex-col overflow-hidden animate-slide-in border-l border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-16 h-16 aspect-square bg-white text-purple-700 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-white">
                  {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover aspect-square" /> : <p className="text-3xl font-black">{user?.displayName?.[0] || 'U'}</p>}
                </div>
                <button onClick={() => setIsProfileOpen(false)} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl transition-colors"><X size={18} strokeWidth={2.5}/></button>
              </div>
              <h3 className="text-2xl font-black relative z-10">{user ? (user.displayName || 'সম্মানিত কাস্টমার') : 'অতিথি ইউজার'}</h3>
              <div className="flex items-center gap-2 relative z-10 mt-1">
                <p className="text-sm text-slate-300 font-bold">{user ? user.email : 'লগইন করা নেই'}</p>
                {userData?.loyaltyPoints !== undefined && (
                  <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black border border-amber-500/30">
                    <Star size={10} className="fill-amber-300" /> {userData.loyaltyPoints} পয়েন্ট
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 p-5 space-y-5 overflow-y-auto w-full">
              {!user ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 py-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><User size={32} /></div>
                  <div className="text-center">
                    <p className="font-black text-slate-900 text-lg">আপনি লগইন করেননি</p>
                    <p className="text-xs text-slate-500 font-bold mt-1">অর্ডার ইতিহাস ও ডেইলি স্ট্রিক দেখতে লগইন করুন।</p>
                  </div>
                  
                  {shop.authSettings?.googleAuth !== false && (
                    <button onClick={handleGoogleLogin} className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center gap-3 font-black text-slate-800 hover:bg-slate-50 transition-all shadow-sm">
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt=""/>
                      গুগল দিয়ে লগইন
                    </button>
                  )}

                  {shop.authSettings?.emailAuth && (
                    <div className="w-full space-y-3 pt-2 border-t border-slate-100 text-left">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">ইমেইল দিয়ে ওটিপি লগইন</p>
                      <input 
                        type="email" 
                        placeholder="আপনার ইমেইল (যেমন: customer@gmail.com)" 
                        disabled={otpSent || otpLoading}
                        value={loginEmail}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-purple-600 disabled:opacity-60"
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                      
                      {otpSent && (
                        <div className="space-y-2 animate-slide-in">
                          <input 
                            type="text" 
                            maxLength={6}
                            placeholder="৬ সংখ্যার ওটিপি কোড লিখুন" 
                            disabled={otpLoading}
                            value={otpCode}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-purple-600 text-center tracking-widest"
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          />
                          <div className="flex justify-between items-center text-xs font-bold px-1">
                            <span className="text-slate-500 flex items-center gap-1">
                              ⏳ মেয়াদ: <span className="text-red-500 font-extrabold">{formatOtpTime(otpTimer)}</span>
                            </span>
                            <button 
                              onClick={handleSendOTP} 
                              disabled={otpLoading || otpTimer > 0}
                              className="text-purple-600 hover:underline active:scale-95 disabled:opacity-50 disabled:no-underline"
                            >
                              আবার পাঠান (Resend)
                            </button>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={otpSent ? handleVerifyOTP : handleSendOTP}
                        disabled={otpLoading || !loginEmail || (otpSent && otpTimer === 0)}
                        className="w-full py-3.5 bg-slate-900 hover:bg-purple-600 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-purple-600/10 disabled:opacity-60"
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={16} /> লোড হচ্ছে...
                          </>
                        ) : (
                          otpSent ? 'ওটিপি ভেরিফাই ও লগইন' : 'ওটিপি কোড পাঠান'
                        )}
                      </button>
                    </div>
                  )}

                  {shop.authSettings?.googleAuth === false && !shop.authSettings?.emailAuth && (
                    <div className="bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-center text-xs font-bold text-slate-500 mt-2">
                      এই শপে লগইন সিস্টেম সাময়িকভাবে বন্ধ আছে। আপনি অতিথি হিসেবে অর্ডার করতে পারেন।
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full space-y-5">
                  {/* Current Location Display */}
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                      <MapPin size={12} /> আপনার বর্তমান লোকেশন
                    </div>
                    <p className="text-sm font-black text-slate-900 leading-tight">
                      {detectedLocation || locationManualInput || 'জানা যায়নি'}
                    </p>
                    {locationStatus === 'available' && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md border border-emerald-200">
                        ✅ সার্ভিস এলাকায় আছেন
                      </span>
                    )}
                  </div>

                  {/* Daily Streak Tracker */}
                  {userOrders.length > 0 && <StreakTracker orders={userOrders} />}

                  {/* Purchase History */}
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-2">ক্রয় ইতিহাস</h4>
                  <div className="space-y-3">
                    {loadingOrders ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                        <Loader2 className="animate-spin" size={24} />
                        <p className="text-[10px] font-black uppercase tracking-widest">লোড হচ্ছে...</p>
                      </div>
                    ) : userOrders.length === 0 ? (
                      <div className="text-center py-8 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
                        <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-400">কোনো অর্ডার ইতিহাস নেই</p>
                      </div>
                    ) : userOrders.map(order => (
                      <div
                        key={order.id}
                        className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-purple-300 transition-colors group"
                      >
                        <div
                          className="p-4 bg-slate-50 cursor-pointer"
                          onClick={() => { setIsProfileOpen(false); router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/order/${order.id}`); }}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-1 rounded-md border border-purple-200">#{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</span>
                            <span className={`text-[11px] font-black px-2 py-1 rounded-md border ${order.status === 'completed' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : order.status === 'cancelled' ? 'text-red-700 bg-red-100 border-red-200' : 'text-amber-700 bg-amber-100 border-amber-200'}`}>{order.status || 'Pending'}</span>
                          </div>
                          <p className="font-extrabold text-slate-900 text-base">{order.items?.length || 0} Items <span className="text-purple-600">(৳{order.total?.toLocaleString()})</span></p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB') : ''}</p>
                        </div>
                        <div className="grid grid-cols-2 border-t border-slate-100">
                          <button
                            onClick={() => { setIsProfileOpen(false); router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/order/${order.id}`); }}
                            className="py-2.5 text-xs font-black text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border-r border-slate-100 flex items-center justify-center gap-1.5"
                          >
                            <Package size={13} /> বিস্তারিত
                          </button>
                          <button
                            onClick={() => {
                              // Reorder: load previous order items into cart
                              const reorderItems = (order.items || []).reduce((acc, item) => {
                                const product = products.find(p => p.id === (item.id || item.productId));
                                if (product && !product.isHidden) {
                                  const existing = acc.find(i => i.id === product.id);
                                  if (existing) {
                                    return acc.map(i => i.id === product.id ? { ...i, quantity: i.quantity + (Number(item.quantity) || 1) } : i);
                                  }
                                  return [...acc, { ...product, quantity: Number(item.quantity) || 1, note: item.note || '', customizedText: item.customizedText || '' }];
                                }
                                return acc;
                              }, []);
                              if (reorderItems.length === 0) {
                                toast.error('আগের অর্ডারের পণ্যগুলো এখন পাওয়া যাচ্ছে না।');
                                return;
                              }
                              setCart(prev => {
                                const merged = [...prev];
                                reorderItems.forEach(ri => {
                                  const exists = merged.find(i => i.id === ri.id);
                                  if (!exists) merged.push(ri);
                                });
                                return merged;
                              });
                              setIsProfileOpen(false);
                              setIsCartOpen(true);
                              toast.success(`${reorderItems.length}টি পণ্য কার্টে যোগ হয়েছে! এডিট করে অর্ডার দিন।`, { duration: 4000 });
                            }}
                            className="py-2.5 text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Edit2 size={13} /> নতুন অর্ডার
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user && (
              <div className="p-5 border-t border-slate-200 bg-white">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 font-black text-sm rounded-xl hover:bg-red-600 hover:text-white border border-red-100 transition-all shadow-sm">
                  <LogOut size={18} strokeWidth={2.5}/> লগ আউট
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedProductForModal && (
        <ShopProductDetailModal
          product={selectedProductForModal}
          shop={shop}
          onClose={() => setSelectedProductForModal(null)}
          cart={cart}
          setCart={setCart}
          addToCart={addToCart}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes marquee { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
        @keyframes slide-in { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      ` }} />
    </div>
  );
}

// ── Shop Product Details Modal Component ──
function ShopProductDetailModal({ product, shop, onClose, cart, setCart, addToCart }) {
  if (!product) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick} 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full md:w-3/4 max-w-5xl md:h-[75vh] bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col gap-6 animate-scale-in my-8 max-h-[90vh] overflow-y-auto scrollbar-thin text-slate-900">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer z-10 animate-fade-in"
        >
          <X size={20} />
        </button>

        <ShopProductDetailInner 
          shop={shop} 
          product={product} 
          onClose={onClose}
          cart={cart}
          setCart={setCart}
          addToCart={addToCart}
        />
      </div>
    </div>
  );
}

function ShopProductDetailInner({ shop, product, onClose, cart, setCart, addToCart }) {
  const { product: safeProduct, shop: safeShop } = sanitizeProductData(product, shop);
  const logic = useProductLogic(safeShop, safeProduct);
  
  let basePrice = 0;
  try {
    basePrice = calculateBasePrice(safeProduct, logic.isLegacySizes, logic.selectedSize, logic.selectedVariants);
  } catch (err) {
    console.error('[ProductDetail] Price calculation error:', err);
  }
  
  const safeBasePrice = Number(basePrice) || 0;
  const safeQty = Number(logic.qty) || 1;
  const totalPrice = logic.aiPrice !== null ? Number(logic.aiPrice) || 0 : (safeBasePrice * safeQty).toFixed(0);

  const handleModalAddToCart = () => {
    try {
      const isStockOut = Number(safeProduct.stock) === 0;
      if (isStockOut && !safeProduct.allowRequest) {
        return toast.error('স্টক নেই');
      }

      const safeQty = Number(logic.qty) || 1;
      const safeAiPrice = logic.aiPrice !== null ? Number(logic.aiPrice) : null;
      const unitPrice = safeAiPrice !== null ? safeAiPrice / safeQty : safeBasePrice;
      const finalPrice = safeAiPrice !== null ? safeAiPrice : safeBasePrice * safeQty;

      if (finalPrice <= 0 || isNaN(finalPrice)) return toast.error('মূল্য সঠিক নয়');

      let variantString = logic.isLegacySizes ? (logic.selectedSize?.label || '') : 
        Object.entries(logic.selectedVariants || {}).filter(([n, o]) => n && o).map(([n, o]) => `${n}: ${o.label}`).join(', ');

      const displayName = safeProduct.name + (variantString ? ` (${variantString})` : '');

      let finalCustomizedText = logic.customInput || '';
      if (isStockOut && safeProduct.allowRequest) {
        finalCustomizedText = finalCustomizedText ? `${finalCustomizedText} [অনুরোধকৃত / Requested]` : '[অনুরোধকৃত / Requested]';
      }

      const cartItem = {
        id: `${safeProduct.id}_${Date.now()}`,
        productId: safeProduct.id,
        name: displayName,
        price: unitPrice,
        clientPrice: unitPrice,
        quantity: safeQty,
        imageUrl: safeProduct.images?.[0] || safeProduct.imageUrl || '',
        note: logic.customerNote || '',
        isCustomized: safeAiPrice !== null || !!logic.customerNote || !!logic.customInput || (isStockOut && safeProduct.allowRequest),
        customizedText: finalCustomizedText,
        variantsText: variantString || ''
      };

      // Add to store cart
      let updatedCart = [...cart];
      const existingIndex = updatedCart.findIndex(item => 
        item.productId === safeProduct.id && 
        (item.customizedText || '') === (cartItem.customizedText || '')
      );

      if (existingIndex > -1) {
        updatedCart[existingIndex].quantity += safeQty;
      } else {
        updatedCart.push(cartItem);
      }
      setCart(updatedCart);
      toast.success(`${safeProduct.name} কার্টে যোগ হয়েছে! 🛒`);
      onClose();
    } catch (err) {
      console.error('[ModalAddToCart] Error:', err);
      toast.error('কার্টে যোগ করতে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="space-y-6 text-slate-900 pr-1 scrollbar-thin overflow-y-auto flex-1">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="font-black text-xl text-slate-900 truncate">{safeProduct.name}</h1>
          <p className="text-xs text-slate-500 font-bold">🏪 {safeShop.shopName}</p>
        </div>
      </div>
      
      <div className="space-y-6 pb-6 text-left">
        <Suspense fallback={<div className="h-72 bg-slate-200 animate-pulse rounded-3xl w-full"></div>}>
          <ProductImage product={safeProduct} currentPrice={safeBasePrice} />
        </Suspense>
        
        <ProductInfo product={safeProduct} currentPrice={safeBasePrice} />
        
        <ProductVariants variants={logic.variants} selectedVariants={logic.selectedVariants} setSelectedVariants={logic.setSelectedVariants} onResetAi={() => logic.setAiPrice(null)} />
        <LegacySizes sizes={logic.sizes} selectedSize={logic.selectedSize} setSelectedSize={logic.setSelectedSize} onResetAi={() => logic.setAiPrice(null)} />
        
        <ProductQuantity qty={logic.qty} setQty={logic.setQty} onQtyChange={logic.handleQtyChange} basePrice={safeBasePrice} />
        
        {(safeShop?.aiConfig?.smartCalcEnabled || safeProduct?.smartCalc?.enabled) ? (
          <SmartCalculator product={safeProduct} setCustomInput={logic.setCustomInput} setAiPrice={logic.setAiPrice} />
        ) : safeProduct?.allowCustomize ? (
          <AiCustomization product={safeProduct} shop={safeShop} customInput={logic.customInput} setCustomInput={logic.setCustomInput} aiResult={logic.aiResult} aiPrice={logic.aiPrice} aiLoading={logic.aiLoading} onCalculate={() => handleAiCalculate({...logic, shop: safeShop, product: safeProduct, basePrice: safeBasePrice})} />
        ) : null}
        
        <ProductActions 
          product={safeProduct} 
          customerNote={logic.customerNote} 
          setCustomerNote={logic.setCustomerNote} 
          totalPrice={totalPrice} 
          onAddToCart={handleModalAddToCart} 
        />
        <ReviewSection shopId={safeShop?.id} />
      </div>
    </div>
  );
}

// ── FAQ Accordion Item Component ──
function FaqAccordionItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left font-black text-slate-800 text-sm hover:bg-slate-100 transition-colors"
      >
        <span>{question}</span>
        <span className="text-purple-600 text-xs font-black">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="p-4 pt-0 text-slate-600 text-xs font-bold leading-relaxed border-t border-slate-100 bg-white">
          {answer}
        </div>
      )}
    </div>
  );
}
