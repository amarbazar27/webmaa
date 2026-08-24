'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getShop, getProducts } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import SectionList from './SectionList';
import ThemeEditor, { THEME_PRESETS } from './ThemeEditor';
import HeaderFooterEditor from './HeaderFooterEditor';
import HomepagePreview from './HomepagePreview';
import { 
  Eye, Save, Globe, Palette, LayoutDashboard, Loader2, 
  ArrowLeft, Smartphone, Monitor, Sparkles, Sliders, Check,
  Layers, ShoppingBag, Zap, ChevronRight, X
} from 'lucide-react';
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

// ── 14 Universal & Category-Smart Templates ──
export const CATEGORY_TEMPLATES = {
  fashion_editorial: {
    id: 'fashion_editorial',
    category: 'fashion',
    label: '👗 Fashion Editorial & Couture',
    namebn: 'লাক্সারি ফ্যাশন এডিটোরিয়াল',
    desc: 'IKEA, Sailor ও Vogue স্টাইল বড় ভিজ্যুয়াল স্পেসিং ও কিউরেটেড লুক',
    theme: { primaryColor: '#7C3AED', secondaryColor: '#2E1065', font: 'Playfair Display', buttonRadius: '4px' },
    headerStyle: 'fashion_editorial',
    footerStyle: 'editorial_story',
    enabled: ['basic_storefront', 'hero', 'split_showcase', 'categories', 'bento_mosaic', 'product_grid', 'shop_the_look', 'video_reels', 'lookbook', 'photo_reviews', 'instagram_feed'],
    gradient: 'from-purple-600 via-indigo-600 to-pink-500',
  },
  modern_streetwear: {
    id: 'modern_streetwear',
    category: 'fashion',
    label: '🧥 Modern Streetwear & Boutique',
    namebn: 'মডার্ন স্ট্রিটওয়্যার বুটিক',
    desc: 'তারুণ্যের ট্রেন্ডি লুক, ইনস্টাগ্রাম ভিডিও রিলস ও কাস্টমার রিভিউ',
    theme: { primaryColor: '#E11D48', secondaryColor: '#4C0519', font: 'Montserrat', buttonRadius: '16px' },
    headerStyle: 'classic',
    footerStyle: 'fashion_lifestyle',
    enabled: ['basic_storefront', 'hero', 'categories', 'flash_sale', 'product_grid', 'video_reels', 'customer_ugc', 'photo_reviews', 'instagram_feed'],
    gradient: 'from-rose-500 to-pink-600',
  },
  fresh_grocery: {
    id: 'fresh_grocery',
    category: 'grocery',
    label: '🥦 Fresh Grocery & Organic',
    namebn: 'গ্রোসারি ও ফ্রেশ অর্গানিক বাজার',
    desc: 'Chaldal, Shwapno ও ফার্ম ফ্রেশ ডেইলি মার্কেট স্টাইল',
    theme: { primaryColor: '#059669', secondaryColor: '#064E3B', font: 'Hind Siliguri', buttonRadius: '12px' },
    headerStyle: 'grocery_quick',
    footerStyle: 'grocery_fresh',
    enabled: ['basic_storefront', 'hero', 'trust_strip', 'categories', 'flash_sale', 'product_grid', 'bundle_section', 'price_ladder', 'price_tier_store', 'photo_reviews'],
    gradient: 'from-emerald-600 to-teal-700',
  },
  supermarket_deals: {
    id: 'supermarket_deals',
    category: 'grocery',
    label: '🛒 Supermarket & Daily Deals',
    namebn: 'মেগা সুপারমার্কেট ডিলস',
    desc: 'হাজারো পণ্যের ইনস্ট্যান্ট সার্চ, ডিল অফ দ্য ডে ও ভলিউম সেভিংস',
    theme: { primaryColor: '#16A34A', secondaryColor: '#14532D', font: 'Inter', buttonRadius: '50px' },
    headerStyle: 'search_first',
    footerStyle: 'classic_4col',
    enabled: ['basic_storefront', 'hero', 'trust_strip', 'deal_of_the_day', 'categories', 'flash_sale', 'product_grid', 'price_tier_store', 'brand_marquee'],
    gradient: 'from-green-600 to-emerald-800',
  },
  tech_electronics: {
    id: 'tech_electronics',
    category: 'tech',
    label: '💻 Tech & Next-Gen Electronics',
    namebn: 'নেক্সট-জেন টেক ও গ্যাজেটস',
    desc: 'Star Tech ও Apple স্টাইল শার্প স্পেসিফিকেশন ও ফ্ল্যাগশিপ শোকেস',
    theme: { primaryColor: '#2563EB', secondaryColor: '#0F172A', font: 'Inter', buttonRadius: '8px' },
    headerStyle: 'electronics',
    footerStyle: 'electronics_tech',
    enabled: ['basic_storefront', 'hero', 'trust_strip', 'split_showcase', 'deal_of_the_day', 'product_grid', 'product_spotlight', 'brand_marquee', 'photo_reviews'],
    gradient: 'from-blue-600 via-indigo-700 to-slate-900',
  },
  gadgets_audio: {
    id: 'gadgets_audio',
    category: 'tech',
    label: '⚡ Smart Gadgets & Audio Gear',
    namebn: 'স্মার্ট অডিও ও সাইবার গ্যাজেটস',
    desc: 'শপেবল ভিডিও, বিফোর-আফটার ও ডার্ক হাই-টেক ভাইব',
    theme: { primaryColor: '#06B6D4', secondaryColor: '#0F172A', font: 'Outfit', buttonRadius: '14px' },
    headerStyle: 'electronics',
    footerStyle: 'electronics_tech',
    enabled: ['basic_storefront', 'hero', 'split_showcase', 'shoppable_video', 'product_grid', 'video_reels', 'photo_reviews', 'deal_of_the_day'],
    gradient: 'from-cyan-600 to-blue-700',
  },
  luxury_beauty: {
    id: 'luxury_beauty',
    category: 'beauty',
    label: '💄 Luxury Beauty & Skincare',
    namebn: 'রেডিয়েন্স স্কিনকেয়ার ও বিউটি',
    desc: 'Sephora স্টাইল সফট রোজ আভা, ফলাফল কম্প্যারিজম ও রিভিউ',
    theme: { primaryColor: '#DB2777', secondaryColor: '#831843', font: 'Hind Siliguri', buttonRadius: '50px' },
    headerStyle: 'fashion_editorial',
    footerStyle: 'fashion_lifestyle',
    enabled: ['basic_storefront', 'hero', 'split_showcase', 'categories', 'before_after', 'flash_sale', 'product_grid', 'customer_ugc', 'shoppable_video', 'popup_banner'],
    gradient: 'from-pink-500 to-rose-600',
  },
  home_living: {
    id: 'home_living',
    category: 'home',
    label: '🛋️ Modern Living & Furniture',
    namebn: 'হোম ডেকোর ও ফার্নিচার কালেকশন',
    desc: 'IKEA অনুপ্রাণিত ৫০/৫০ স্প্লিট শোকেস ও লিভিং স্পেস মোজাইক',
    theme: { primaryColor: '#CC5500', secondaryColor: '#7C2D12', font: 'Montserrat', buttonRadius: '12px' },
    headerStyle: 'classic',
    footerStyle: 'modern_split',
    enabled: ['basic_storefront', 'hero', 'split_showcase', 'categories', 'bento_mosaic', 'product_grid', 'mood_board', 'editorial_story', 'photo_reviews'],
    gradient: 'from-amber-600 to-orange-700',
  },
  sports_fitness: {
    id: 'sports_fitness',
    category: 'sports',
    label: '👟 High-Performance Sports & Gym',
    namebn: 'স্পোর্টস গিয়ার ও ফিটনেস অ্যাথলিট',
    desc: 'Nike স্টাইল পাওয়ারফুল হিরো, ডায়নামিক প্রোডাক্ট গ্রিড ও ভিডিও',
    theme: { primaryColor: '#EA580C', secondaryColor: '#18181B', font: 'Outfit', buttonRadius: '50px' },
    headerStyle: 'classic',
    footerStyle: 'classic_4col',
    enabled: ['basic_storefront', 'hero', 'trust_strip', 'categories', 'product_spotlight', 'product_grid', 'video_reels', 'photo_reviews'],
    gradient: 'from-orange-600 to-red-600',
  },
  restaurant_food: {
    id: 'restaurant_food',
    category: 'food',
    label: '🍕 Restaurant & Food Express',
    namebn: 'ফুড ডেলিভারি ও রেস্টুরেন্ট মেনু',
    desc: 'স্পিডি ফুড মেনু গ্রিড, হটলাইন ও ইনস্ট্যান্ট কম্বো প্যাক',
    theme: { primaryColor: '#DC2626', secondaryColor: '#450A0A', font: 'Hind Siliguri', buttonRadius: '20px' },
    headerStyle: 'search_first',
    footerStyle: 'grocery_fresh',
    enabled: ['basic_storefront', 'hero', 'categories', 'bundle_section', 'flash_sale', 'product_grid', 'deal_of_the_day', 'photo_reviews'],
    gradient: 'from-red-600 to-rose-700',
  },
  jewelry_gold: {
    id: 'jewelry_gold',
    category: 'luxury',
    label: '💎 Obsidian 24K Fine Jewelry',
    namebn: 'অবসিডিয়ান গোল্ড ও লাক্সারি জুয়েলারি',
    desc: 'অভিজাত ডার্ক অবসিডিয়ান ব্যাকড্রপ ও ২৪কে গোল্ড ফ্রেম লুকবুক',
    theme: { primaryColor: '#D4AF37', secondaryColor: '#18181B', font: 'Playfair Display', buttonRadius: '4px' },
    headerStyle: 'fashion_editorial',
    footerStyle: 'editorial_story',
    enabled: ['basic_storefront', 'hero', 'product_spotlight', 'lookbook', 'product_grid', 'editorial_story', 'photo_reviews'],
    gradient: 'from-amber-500 via-yellow-600 to-stone-900',
  },
  books_stationery: {
    id: 'books_stationery',
    category: 'general',
    label: '📚 Books, Library & Stationery',
    namebn: 'বইঘর, লাইব্রেরি ও স্টেশনারি',
    desc: 'বইপ্রেমীদের জন্য কিউরেটেড ট্যাবড কালেকশন ও ক্যাটাগরি স্ক্রলার',
    theme: { primaryColor: '#4338CA', secondaryColor: '#1E1B4B', font: 'Hind Siliguri', buttonRadius: '8px' },
    headerStyle: 'mega_nav',
    footerStyle: 'classic_4col',
    enabled: ['basic_storefront', 'hero', 'categories', 'tabbed_collection', 'product_grid', 'brand_marquee', 'photo_reviews'],
    gradient: 'from-indigo-600 to-purple-800',
  },
  health_pharmacy: {
    id: 'health_pharmacy',
    category: 'general',
    label: '💊 Health, Wellness & Pharmacy',
    namebn: 'স্বাস্থ্যসেবা, ফার্মেসি ও ওয়েলনেস',
    desc: 'প্রয়োজনীয় স্বাস্থ্যপণ্য, কনসার্ন গ্রিড ও বিশ্বস্ত ডেলিভারি স্ট্রিপ',
    theme: { primaryColor: '#0284C7', secondaryColor: '#082F49', font: 'Inter', buttonRadius: '12px' },
    headerStyle: 'search_first',
    footerStyle: 'trust_badge',
    enabled: ['basic_storefront', 'hero', 'trust_strip', 'concern_grid', 'product_grid', 'price_tier_store', 'photo_reviews'],
    gradient: 'from-sky-600 to-blue-800',
  },
  wholesale_b2b: {
    id: 'wholesale_b2b',
    category: 'b2b',
    label: '🏢 B2B & Bulk Wholesale',
    namebn: 'হোলসেল ও বালক বিটুবি মার্কেট',
    desc: 'বালক ডিসকাউন্ট প্রাইস ল্যাডার, ভলিউম টিয়ার ও রিয়েলটাইম কোট',
    theme: { primaryColor: '#1E3A8A', secondaryColor: '#0F172A', font: 'Inter', buttonRadius: '8px' },
    headerStyle: 'marketplace',
    footerStyle: 'marketplace',
    enabled: ['basic_storefront', 'hero', 'trust_strip', 'price_ladder', 'product_grid', 'price_tier_store', 'deal_of_the_day', 'brand_marquee'],
    gradient: 'from-slate-800 via-blue-900 to-slate-900',
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
  style: 'classic_4col',
  showCategories: true,
  showContact: true,
  showSocials: true,
  showCopyright: true,
  showPrivacy: true,
  customTagline: '',
  attributionStyle: 'option_a',
  attributionAlign: 'center',
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
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewTemplateKey, setPreviewTemplateKey] = useState(null);
  const [appliedTemplateKey, setAppliedTemplateKey] = useState('fashion_editorial');
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
          const existingTypeMap = new Map(config.sections.map(s => [s.type, s]));
          let merged = config.sections.map((s, idx) => ({ ...s, order: idx }));

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
    setAppliedTemplateKey(key);
    setPreviewTemplateKey(null);
    const newSections = DEFAULT_SECTIONS.map(s => ({
      ...s,
      enabled: tpl.enabled.includes(s.id) || tpl.enabled.includes(s.type),
    }));
    setSections(newSections);
    setTheme(prev => ({ ...prev, ...tpl.theme }));
    if (tpl.headerStyle) setHeaderConfig(h => ({ ...h, style: tpl.headerStyle }));
    if (tpl.footerStyle) setFooterConfig(f => ({ ...f, style: tpl.footerStyle }));
    setHasChanges(true);
    toast.success(`✅ ${tpl.namebn} টেমপ্লেট ড্রাফটে অ্যাপ্লাই হয়েছে!`);
  };

  const TEMPLATE_FILTER_CATEGORIES = [
    { id: 'all', label: 'সব টেমপ্লেট' },
    { id: 'fashion', label: 'ফ্যাশন' },
    { id: 'grocery', label: 'গ্রোসারি' },
    { id: 'tech', label: 'টেক ও গেজেট' },
    { id: 'beauty', label: 'বিউটি' },
    { id: 'home', label: 'হোম ডেকোর' },
    { id: 'sports', label: 'স্পোর্টস' },
    { id: 'b2b', label: 'B2B' },
  ];

  const filteredTemplates = Object.entries(CATEGORY_TEMPLATES).filter(([_, tpl]) => {
    if (templateCategoryFilter === 'all') return true;
    return tpl.category === templateCategoryFilter;
  });

  // Compute effective state for live simulator preview
  const currentPreviewTpl = previewTemplateKey ? CATEGORY_TEMPLATES[previewTemplateKey] : null;
  const effectiveSections = currentPreviewTpl
    ? DEFAULT_SECTIONS.map(s => ({
        ...s,
        enabled: currentPreviewTpl.enabled.includes(s.id) || currentPreviewTpl.enabled.includes(s.type),
      }))
    : sections;
  const effectiveTheme = currentPreviewTpl ? { ...theme, ...currentPreviewTpl.theme } : theme;
  const effectiveHeader = currentPreviewTpl && currentPreviewTpl.headerStyle ? { ...headerConfig, style: currentPreviewTpl.headerStyle } : headerConfig;
  const effectiveFooter = currentPreviewTpl && currentPreviewTpl.footerStyle ? { ...footerConfig, style: currentPreviewTpl.footerStyle } : footerConfig;

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
                <h1 className="text-sm font-black text-slate-900 leading-none">BDRetailers Visual Store Designer</h1>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black uppercase">
                  Universal Builder
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                {lastSaved ? `সর্বশেষ সেভ: ${lastSaved.toLocaleTimeString('bn-BD')}` : 'ভিজ্যুয়ালি সাজান ও তাৎক্ষণিক লাইভ প্রিভিউ দেখুন'}
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

          {/* Template Tab Content — 14 Universal Templates */}
          {activeTab === 'template' && (
            <div className="space-y-3">
              <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                <div>
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    ⚡ ইউনিভার্সাল টেমপ্লেট লাইব্রেরি (১৪টি ডিজাইন)
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    যেকোনো টেমপ্লেট আপনার দোকানের জন্য ক্লিক করে অ্যাপ্লাই করুন
                  </p>
                </div>

                {/* Category Filter Chips — Wrapped into 2 clean lines without horizontal swipe */}
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {TEMPLATE_FILTER_CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setTemplateCategoryFilter(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        templateCategoryFilter === c.id
                          ? 'bg-purple-600 text-white shadow-xs scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Template Cards Grid — High-contrast & clear preview vs apply */}
                <div className="grid grid-cols-1 gap-3 max-h-[620px] overflow-y-auto pr-1">
                  {filteredTemplates.map(([key, tpl]) => {
                    const isPreviewing = previewTemplateKey === key;
                    const isApplied = appliedTemplateKey === key && !previewTemplateKey;
                    return (
                      <div
                        key={key}
                        onClick={() => setPreviewTemplateKey(isPreviewing ? null : key)}
                        className={`rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer shadow-xs bg-white ${
                          isPreviewing
                            ? 'border-purple-600 ring-2 ring-purple-100 bg-purple-50/30 shadow-md scale-[1.005]'
                            : isApplied
                            ? 'border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50/20'
                            : 'border-slate-200 hover:border-purple-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                                style={{ background: tpl.theme?.primaryColor || '#6D28D9' }} 
                              />
                              <p className="text-sm font-black text-slate-900 leading-snug">{tpl.label}</p>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mt-1 leading-normal">{tpl.desc}</p>
                            
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {tpl.enabled.slice(0, 4).map(sId => (
                                <span key={sId} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                                  {sId.replace(/_/g, ' ')}
                                </span>
                              ))}
                              {tpl.enabled.length > 4 && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">
                                  +{tpl.enabled.length - 4} সেকশন
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {isApplied ? (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black flex items-center gap-1 border border-emerald-300 shadow-2xs">
                                <Check size={13} className="text-emerald-700 stroke-[3]" />
                                অ্যাপ্লাইড
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  applyTemplate(key, tpl);
                                }}
                                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
                              >
                                Apply
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplateKey(isPreviewing ? null : key);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors cursor-pointer ${
                                isPreviewing 
                                  ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {isPreviewing ? '👁️ প্রিভিউ চালু' : '👁️ প্রিভিউ দেখুন'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
            sections={effectiveSections}
            theme={effectiveTheme}
            headerConfig={effectiveHeader}
            footerConfig={effectiveFooter}
            shop={shop}
            mode={previewMode}
            onModeChange={setPreviewMode}
            products={products}
            highlightId={highlightSectionId}
            previewTemplateName={currentPreviewTpl ? currentPreviewTpl.namebn : null}
            onApplyPreviewTemplate={() => {
              if (currentPreviewTpl && previewTemplateKey) {
                applyTemplate(previewTemplateKey, currentPreviewTpl);
              }
            }}
            onCancelPreview={() => setPreviewTemplateKey(null)}
          />
        </div>
      </div>
    </div>
  );
}
