"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Search, Star, ArrowRight, Phone, Store,
  X, Loader2, CheckCircle, Sparkles, Package, ChevronRight,
  ShoppingCart, Plus, Minus, Trash2, Filter, Globe, ArrowUpRight,
  MessageCircle, Mail, ArrowUp, ArrowDown, Bot, ImagePlus, Lightbulb, Mic,
  Share2, Copy, PlayCircle, Download, Briefcase, LogOut, Menu, Tag, User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logoutUser, loginWithGoogle } from '@/lib/auth';
import { subscribeGlobalConfig, getAllMarketplaceProducts, getShopBySlug, getAllShops, getUserOrders } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import AiShoppingList from '@/components/shop/AiShoppingList';
import AiVoicePanel from '@/components/shop/AiVoicePanel';

// Imports for unified product details modal
import ProductImage from '@/features/product/components/ProductImage';
import ProductInfo from '@/features/product/components/ProductInfo';
import ProductVariants from '@/features/product/components/ProductVariants';
import LegacySizes from '@/features/product/components/LegacySizes';
import ProductQuantity from '@/features/product/components/ProductQuantity';
import AiCustomization from '@/features/product/components/AiCustomization';
import SmartCalculator from '@/features/product/components/SmartCalculator';
import ProductActions from '@/features/product/components/ProductActions';
import ReviewSection from '@/components/shop/ReviewSection';

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
  'mas': 'মাছ',
  'lobon': 'লবণ',
  'nobon': 'লবণ',
  'masala': 'মসলা',
  'moshla': 'মসলা',
  'morich': 'مরিচ',
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

// Vowel-insensitive character normalization for phonetic translit matches
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

export default function Home() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [loggingIn, setLoggingIn] = useState(false);
  const [globalConfig, setGlobalConfig] = useState(null);
  const globalWhatsapp = globalConfig?.whatsapp || globalConfig?.contactLinks?.find(link => 
    link.name?.toLowerCase().includes('whatsapp') || link.url?.includes('wa.me')
  )?.url || '';
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
 
  // ── Marketplace & Cart States ──
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeShopFilter, setActiveShopFilter] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');

  // ── Product Details Modal & Customization States ──
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customizationNote, setCustomizationNote] = useState('');

  // ── Stepped Filters & AI Product Clustering States ──
  const [filterMode, setFilterMode] = useState('merchant'); // 'merchant' or 'type'
  const [activeTypeFilter, setActiveTypeFilter] = useState('All');

  // ── 5-Row Pagination States ──
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // ── Superadmin own shop dynamic settings ──
  const [mainShopData, setMainShopData] = useState(null);
  const [activeBanner, setActiveBanner] = useState(0);

  // ── Banner Swiper Touch States ──
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // ── AI Companion/Shopping Bot Modal States ──
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiTab, setAiTab] = useState('chat');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: 'bot', text: 'আসসালামু আলাইকুম! আমি BDRetailers এআই শপিং অ্যাসিস্ট্যান্ট। আমি আপনাকে পুরো মার্কেটপ্লেস থেকে পণ্য খুঁজে পেতে এবং ভয়েস বা ফর্দ এনালাইসিস করে সরাসরি অর্ডার করতে সাহায্য করব। বলুন, আজ কীভাবে সাহায্য করতে পারি? 😊' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [allShops, setAllShops] = useState([]);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStoresMenuOpen, setIsStoresMenuOpen] = useState(false);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // ── AI Product Clustering Helper ──
  const getProductType = (product) => {
    if (product.superadminType) return product.superadminType;
    const name = (product.name || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();
    
    if (name.includes('মুরগি') || name.includes('murgi') || name.includes('chicken') || name.includes('মাংস') || name.includes('meat') || name.includes('গোরু') || name.includes('beef') || name.includes('ডিম') || name.includes('egg') || cat.includes('meat') || cat.includes('মাংস')) {
      return 'মাংস ও ডিম (Poultry & Eggs)';
    }
    if (name.includes('আলু') || name.includes('পটল') || name.includes('পেঁয়াজ') || name.includes('রসুন') || name.includes('আদা') || name.includes('গাজর') || name.includes('বেগুন') || name.includes('টমেটো') || name.includes('সবজি') || name.includes('শাক') || name.includes('লেবু') || name.includes('ফল') || name.includes('tomato') || name.includes('shosa') || name.includes('sosa') || name.includes('cabbage') || cat.includes('সবজি') || cat.includes('vegetable')) {
      return 'সবজি ও ফল (Vegetables & Fruits)';
    }
    if (name.includes('চাল') || name.includes('ডাল') || name.includes('তেল') || name.includes('লবণ') || name.includes('চিনি') || name.includes('আটা') || name.includes('ময়দা') || name.includes('মসলা') || name.includes('morich') || name.includes('holud') || name.includes('oil') || name.includes('dal') || name.includes('chal') || cat.includes('grocer') || cat.includes('মুদি')) {
      return 'মুদি ও নিত্যপ্রয়োজনীয় (Groceries)';
    }
    if (name.includes('দুধ') || name.includes('চা') || name.includes('কফি') || name.includes('পানি') || name.includes('juice') || name.includes('dudh') || name.includes('tea') || name.includes('coffee') || name.includes('water') || cat.includes('drink') || cat.includes('পানীয়')) {
      return 'পানীয় ও দুগ্ধজাত (Drinks & Dairy)';
    }
    return 'অন্যান্য পণ্য (Others)';
  };

  // Helper to resolve custom domain redirection links
  const getStoreLink = (shopSlug, customDomain, domainStatus) => {
    if (customDomain && domainStatus === 'connected') {
      return `https://${customDomain}`;
    }
    return `/${shopSlug}`;
  };

  const renderClickableText = (text) => {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,6}(?:\/[^\s]*)?)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        let href = part;
        if (!/^https?:\/\//i.test(href)) {
          href = 'https://' + href;
        }
        return (
          <a 
            key={i} 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-purple-400 hover:text-purple-300 underline font-black transition-colors cursor-pointer"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Responsive itemsPerPage calculator (exactly 5 rows)
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1800) setItemsPerPage(50); // 10 cols
      else if (w >= 1536) setItemsPerPage(40); // 8 cols
      else if (w >= 1280) setItemsPerPage(30); // 6 cols
      else if (w >= 1024) setItemsPerPage(25); // 5 cols
      else if (w >= 768) setItemsPerPage(20); // 4 cols
      else if (w >= 640) setItemsPerPage(15); // 3 cols
      else setItemsPerPage(10); // 2 cols
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load products, global config, superadmin shop & cart on mount
  useEffect(() => {
    getAllMarketplaceProducts().then(data => {
      // 🚨 Admin Shop Mapping & Overwrites
      const mapped = data.map(p => {
        if (p.shopSlug === 'daripallah-store' || p.shopSlug === 'webmaa-store' || p.shopName?.toLowerCase() === 'webmaa store' || p.shopName?.toLowerCase() === 'daripallah store') {
          return { ...p, shopName: 'ADMIN' };
        }
        return p;
      });
      setProducts(mapped);
      setProductsLoading(false);

      // ── Stepped category query parameters parser ──
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const shopParam = params.get('shop');
        const catParam = params.get('category');
        const subcatParam = params.get('subcategory');
        if (shopParam) setActiveShopFilter(shopParam);
        if (catParam) setActiveCategory(catParam);
        if (subcatParam) setActiveSubcategory(subcatParam);

        if (shopParam || catParam || subcatParam) {
          setTimeout(() => {
            const gridEl = document.getElementById('products-grid-section');
            if (gridEl) {
              gridEl.scrollIntoView({ behavior: 'smooth' });
            }
          }, 800); // 800ms delay to ensure page rendering is complete
        }
      }
    }).catch(err => {
      console.error(err);
      setProductsLoading(false);
    });

    getShopBySlug('daripallah-store').then(async (shopData) => {
      let finalShopData = shopData;
      if (!finalShopData) {
        finalShopData = await getShopBySlug('webmaa-store');
      }
      if (finalShopData) {
        // Normalize banners array if elements are raw image strings
        const normalized = (finalShopData.banners || []).map(b => {
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
        });
        setMainShopData({ ...finalShopData, banners: normalized });
      }
    }).catch(err => console.error("Error loading superadmin settings:", err));

    const localCart = localStorage.getItem('cart_daripallah-store');
    if (localCart) {
      try {
        setCart(JSON.parse(localCart));
      } catch (e) {
        setCart([]);
      }
    }

    return subscribeGlobalConfig(setGlobalConfig);
  }, []);

  // Load active shops and PWA logic
  useEffect(() => {
    getAllShops().then(shopsData => {
      setAllShops(shopsData || []);
    }).catch(err => console.error("Error loading shops:", err));

    if (typeof window === 'undefined') return;

    // Register Service Worker on the main website
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
        .then(reg => console.log('[PWA] Service Worker registered for main website:', reg.scope))
        .catch(err => console.error('[PWA] Service Worker registration failed:', err));
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setPwaInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaInstalled(false);
      localStorage.removeItem('pwa_installed'); // Clean if uninstalled
      
      const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setShowPwaBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installed = localStorage.getItem('pwa_installed');
    if (installed) setPwaInstalled(true);

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
  }, []);

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
        toast('আমাদের ওয়েব অ্যাপটি সরাসরি ব্রাউজার মেনু থেকে "Install" বা "Add to Home Screen" করতে পারেন।');
      }
    }
  };

  const loadAllUserOrders = async (email) => {
    if (!email || !allShops || allShops.length === 0) return;
    setLoadingOrders(true);
    try {
      const promises = allShops.map(shop => 
        getUserOrders(shop.id, email).then(orders => 
          orders.map(o => ({ 
            ...o, 
            shopName: shop.shopName, 
            shopSlug: shop.shopSlug, 
            shopId: shop.id,
            customDomain: shop.customDomain || '',
            domainStatus: shop.domainStatus || ''
          }))
        )
      );
      const results = await Promise.all(promises);
      const merged = results.flat().sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
      setUserOrders(merged);
    } catch (err) {
      console.error("Error loading user orders across shops:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user && allShops.length > 0) {
      loadAllUserOrders(user.email);
    } else {
      setUserOrders([]);
    }
  }, [user, allShops]);

  // Custom banner slider interval timer
  useEffect(() => {
    if (!mainShopData?.banners || mainShopData.banners.length <= 1) return;
    const intervalTime = (mainShopData.bannerInterval || 4) * 1000;
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % mainShopData.banners.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [mainShopData?.banners, mainShopData?.bannerInterval]);

  // Update mouse position for glowing cursor effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const getDashboardHref = () => {
    if (userData?.role === 'superadmin') return '/superadmin';
    if (userData?.role === 'retailer') return '/dashboard';
    if (userData?.role === 'staff') return '/dashboard';
    if (userData?.role === 'admin') return '/dashboard';
    return null;
  };

  const handleSmartLogin = async () => {
    setLoggingIn(true);
    try {
      const result = await loginWithGoogle();
      if (!result) return;
      
      const role = result?.userData?.role;
      if (role === 'superadmin') router.push('/superadmin');
      else if (role === 'retailer' || role === 'staff' || role === 'admin') router.push('/dashboard');
      else toast.success(`স্বাগতম, ${result.user.displayName}!`);
    } catch (err) {
      console.error("[SmartLogin] Error:", err);
      toast.error(err.message || 'লগইন করতে সমস্যা হয়েছে।');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleAddToCart = (product, customNote = '') => {
    if (Array.isArray(product)) {
      let updatedCart = [...cart];
      let addedCount = 0;
      let shopId = '';

      product.forEach(item => {
        let actualProduct = item.product || item;
        let qty = Number(item.quantity) || 1;
        let note = item.customNote || item.note || '';
        if (Number(actualProduct.stock) === 0) return;

        const existingIndex = updatedCart.findIndex(cartItem => cartItem.productId === actualProduct.id && (cartItem.customNote || '') === note);
        if (existingIndex > -1) {
          updatedCart[existingIndex].quantity += qty;
        } else {
          updatedCart.push({
            id: `${actualProduct.id}_${Date.now()}_${Math.random()}`,
            productId: actualProduct.id,
            name: actualProduct.name,
            price: Number(actualProduct.price) || 0,
            quantity: qty,
            imageUrl: actualProduct.imageUrl || '',
            shopId: actualProduct.shopId,
            shopName: actualProduct.shopName,
            shopSlug: actualProduct.shopSlug,
            customDomain: actualProduct.customDomain || '',
            domainStatus: actualProduct.domainStatus || '',
            isThirdParty: actualProduct.shopSlug !== 'daripallah-store' && actualProduct.shopSlug !== 'webmaa-store',
            customNote: note,
            isCustomized: !!note
          });
        }
        shopId = actualProduct.shopId;
        addedCount++;
      });

      if (addedCount > 0) {
        setCart(updatedCart);
        localStorage.setItem('cart_daripallah-store', JSON.stringify(updatedCart));

        if (shopId) {
          const storeCartKey = `cart_${shopId}`;
          try {
            const storeCart = JSON.parse(localStorage.getItem(storeCartKey) || '[]');
            product.forEach(item => {
              let actualProduct = item.product || item;
              let qty = Number(item.quantity) || 1;
              let note = item.customNote || item.note || '';
              if (Number(actualProduct.stock) === 0) return;

              const storeExistingIdx = storeCart.findIndex(cartItem => cartItem.productId === actualProduct.id && (cartItem.customizedText || '') === note);
              if (storeExistingIdx > -1) {
                storeCart[storeExistingIdx].quantity += qty;
              } else {
                storeCart.push({
                  id: `${actualProduct.id}_${Date.now()}_${Math.random()}`,
                  productId: actualProduct.id,
                  name: actualProduct.name,
                  price: Number(actualProduct.price) || 0,
                  clientPrice: Number(actualProduct.price) || 0,
                  quantity: qty,
                  imageUrl: actualProduct.imageUrl || '',
                  note: note,
                  isCustomized: !!note,
                  customizedText: note,
                  variantsText: ''
                });
              }
            });
            localStorage.setItem(storeCartKey, JSON.stringify(storeCart));
          } catch (err) {
            console.error('Failed to sync individual shop cart:', err);
          }
        }

        toast.success(`সফলভাবে ${addedCount}টি পণ্য ঝুড়িতে যোগ হয়েছে! 🎉`);
      }
      return;
    }

    if (Number(product.stock) === 0) {
      toast.error('দুঃখিত, এই পণ্যটি স্টকে নেই');
      return;
    }
    let updatedCart = [...cart];
    // If customized, treat it as a separate cart item so they can add multiple customized products!
    const existingIndex = updatedCart.findIndex(item => item.productId === product.id && (item.customNote || '') === customNote);
    
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({
        id: `${product.id}_${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        quantity: 1,
        imageUrl: product.imageUrl || '',
        shopId: product.shopId,
        shopName: product.shopName,
        shopSlug: product.shopSlug,
        customDomain: product.customDomain || '',
        domainStatus: product.domainStatus || '',
        isThirdParty: product.shopSlug !== 'daripallah-store' && product.shopSlug !== 'webmaa-store',
        customNote: customNote,
        isCustomized: !!customNote
      });
    }
    setCart(updatedCart);
    localStorage.setItem('cart_daripallah-store', JSON.stringify(updatedCart));

    // Sync to individual store cart in localStorage
    const storeCartKey = `cart_${product.shopId}`;
    try {
      const storeCart = JSON.parse(localStorage.getItem(storeCartKey) || '[]');
      const storeExistingIdx = storeCart.findIndex(item => item.productId === product.id && (item.customizedText || '') === customNote);
      if (storeExistingIdx > -1) {
        storeCart[storeExistingIdx].quantity += 1;
      } else {
        storeCart.push({
          id: `${product.id}_${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          clientPrice: Number(product.price) || 0,
          quantity: 1,
          imageUrl: product.imageUrl || '',
          note: customNote,
          isCustomized: !!customNote,
          customizedText: customNote,
          variantsText: ''
        });
      }
      localStorage.setItem(storeCartKey, JSON.stringify(storeCart));
    } catch (err) {
      console.error('Failed to sync individual shop cart:', err);
    }

    toast.success(`${product.name} কার্টে যোগ হয়েছে! 🛒`);
  };

  const updateCartQty = (productId, amount) => {
    let updatedCart = cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);

    setCart(updatedCart);
    localStorage.setItem('cart_daripallah-store', JSON.stringify(updatedCart));

    const item = cart.find(i => i.productId === productId);
    if (item) {
      const storeCartKey = `cart_${item.shopId}`;
      try {
        let storeCart = JSON.parse(localStorage.getItem(storeCartKey) || '[]');
        storeCart = storeCart.map(si => {
          if (si.productId === productId) {
            const newQty = si.quantity + amount;
            return newQty > 0 ? { ...si, quantity: newQty } : null;
          }
          return si;
        }).filter(Boolean);
        localStorage.setItem(storeCartKey, JSON.stringify(storeCart));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const setCartQtyDirect = (productId, newQtyVal) => {
    if (newQtyVal === '') {
      let updatedCart = cart.map(item => {
        if (item.productId === productId) {
          return { ...item, quantity: '' };
        }
        return item;
      });
      setCart(updatedCart);
      return;
    }
    const qty = parseFloat(newQtyVal);
    if (isNaN(qty)) return;
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    
    let updatedCart = cart.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: qty };
      }
      return item;
    });

    setCart(updatedCart);
    localStorage.setItem('cart_daripallah-store', JSON.stringify(updatedCart));

    const item = cart.find(i => i.productId === productId);
    if (item) {
      const storeCartKey = `cart_${item.shopId}`;
      try {
        let storeCart = JSON.parse(localStorage.getItem(storeCartKey) || '[]');
        storeCart = storeCart.map(si => {
          if (si.productId === productId) {
            return { ...si, quantity: qty };
          }
          return si;
        });
        localStorage.setItem(storeCartKey, JSON.stringify(storeCart));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const removeFromCart = (productId) => {
    const item = cart.find(i => i.productId === productId);
    const updatedCart = cart.filter(i => i.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart_daripallah-store', JSON.stringify(updatedCart));

    if (item) {
      const storeCartKey = `cart_${item.shopId}`;
      try {
        let storeCart = JSON.parse(localStorage.getItem(storeCartKey) || '[]');
        storeCart = storeCart.filter(si => si.productId !== productId);
        localStorage.setItem(storeCartKey, JSON.stringify(storeCart));
      } catch (e) {
        console.error(e);
      }
    }
    toast.success('পণ্যটি কার্ট থেকে সরানো হয়েছে');
  };

  const clearCart = () => {
    cart.forEach(item => {
      localStorage.removeItem(`cart_${item.shopId}`);
    });
    setCart([]);
    localStorage.removeItem('cart_daripallah-store');
    toast.success('কার্ট খালি করা হয়েছে');
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // Group items by shop for dynamic third-party cart segmenting
  const thirdPartyItemsByShop = cart.reduce((acc, item) => {
    if (item.isThirdParty) {
      if (!acc[item.shopId]) {
        acc[item.shopId] = {
          shopName: item.shopName,
          shopSlug: item.shopSlug,
          customDomain: item.customDomain || '',
          domainStatus: item.domainStatus || '',
          items: []
        };
      }
      acc[item.shopId].items.push(item);
    }
    return acc;
  }, {});

  const daripallahStoreItems = cart.filter(item => !item.isThirdParty);
  const daripallahStoreTotal = daripallahStoreItems.reduce((t, i) => t + i.price * i.quantity, 0);

  const handleCheckoutDaripallah = () => {
    const superadminItem = cart.find(i => !i.isThirdParty);
    const slug = superadminItem ? superadminItem.shopSlug : 'daripallah-store';
    router.push(`/shop/${slug}`);
    setIsCartOpen(false);
  };

  const handleCheckoutThirdParty = async (shopData, shopCheckoutUrl) => {
    if (!user) {
      toast.error('চেকআউট করতে প্রথমে লগইন সম্পন্ন করুন।');
      try {
        await handleSmartLogin();
      } catch (err) {
        console.error(err);
      }
      return;
    }

    const serialized = shopData.items.map(i => ({
      productId: i.productId || i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      imageUrl: i.imageUrl || '',
      note: i.customNote || '',
      isCustomized: i.isCustomized || false,
      customizedText: i.customizedText || '',
      variantsText: i.variantsText || ''
    }));

    const importCartParam = encodeURIComponent(JSON.stringify(serialized));
    const separator = shopCheckoutUrl.includes('?') ? '&' : '?';
    const redirectUrl = `${shopCheckoutUrl}${separator}importCart=${importCartParam}`;

    window.open(redirectUrl, '_blank');
  };

  // Dynamic Contact Formats
  const getFormattedContactUrl = (url, type) => {
    if (!url) return '#';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('no contact') || lowerUrl.includes('registered') || lowerUrl.includes('endpoint')) {
      return '#';
    }
    const cleanNum = url.replace(/[^0-9]/g, '');
    const isWhatsapp = type?.includes('whatsapp') || 
                       lowerUrl.includes('wa.me') || 
                       (lowerUrl.includes('whatsapp.com') && !lowerUrl.includes('share')) ||
                       (!url.startsWith('http') && /^\+?[0-9\s\-]+$/.test(url) && cleanNum.length >= 10);
                       
    if (isWhatsapp) {
      const withCountry = cleanNum.startsWith('88') ? cleanNum : `88${cleanNum}`;
      return `https://wa.me/${withCountry}`;
    }
    return url;
  };

  const handleCopyShopSectorLink = (e, shopName) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/?shop=${encodeURIComponent(shopName)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success(`"${shopName}" স্টোরের শেয়ার লিংক কপি করা হয়েছে! 🔗`);
    }).catch(() => {
      toast.error('লিংক কপি করতে ব্যর্থ হয়েছে।');
    });
  };

  // ── Merchant-Category Filter Double Flow ──
  const uniqueShops = ['All', ...Array.from(new Set(products.map(p => p.shopName).filter(Boolean)))];

  const uniqueTypes = ['All', 'মাংস ও ডিম (Poultry & Eggs)', 'সবজি ও ফল (Vegetables & Fruits)', 'মুদি ও নিত্যপ্রয়োজনীয় (Groceries)', 'পানীয় ও দুগ্ধজাত (Drinks & Dairy)', 'অন্যান্য পণ্য (Others)'];

  const availableCategories = ['All', ...Array.from(new Set(
    products
      .filter(p => {
        if (filterMode === 'merchant') {
          return activeShopFilter === 'All' || p.shopName === activeShopFilter;
        } else {
          return activeTypeFilter === 'All' || getProductType(p) === activeTypeFilter;
        }
      })
      .map(p => p.category)
      .filter(Boolean)
  ))];

  const availableSubcategories = Array.from(new Set(
    products
      .filter(p => {
        if (filterMode === 'merchant') {
          return (activeShopFilter === 'All' || p.shopName === activeShopFilter) &&
                 (activeCategory === 'All' || p.category === activeCategory);
        } else {
          return (activeTypeFilter === 'All' || getProductType(p) === activeTypeFilter) &&
                 (activeCategory === 'All' || p.category === activeCategory);
        }
      })
      .map(p => p.subcategory)
      .filter(Boolean)
  ));

  // Reset category filters if active filter makes them invalid
  useEffect(() => {
    if (!availableCategories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [activeShopFilter, activeTypeFilter, filterMode, products]);

  useEffect(() => {
    if (!availableSubcategories.includes(activeSubcategory)) {
      setActiveSubcategory('');
    }
  }, [activeCategory, activeShopFilter, activeTypeFilter, filterMode, products]);

  // Reset all filters when filterMode changes
  useEffect(() => {
    setActiveShopFilter('All');
    setActiveTypeFilter('All');
    setActiveCategory('All');
    setActiveSubcategory('');
    setCurrentPage(1);
  }, [filterMode]);

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeShopFilter, activeTypeFilter, activeCategory, activeSubcategory, productSearch]);

  const handleShareProduct = async (product) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bdretailers.com';
    const shareUrl = `${origin}/?product=${product.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `BDRetailers মার্কেটপ্লেসে '${product.name}' দেখুন! 🛒`,
          url: shareUrl
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopyLink(product);
    }
  };

  const handleCopyLink = (product) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bdretailers.com';
    const shareUrl = `${origin}/?product=${product.id}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("পণ্য শেয়ারিং লিংক কপি হয়েছে! 🔗");
    }).catch(err => {
      toast.error("লিংক কপি করতে সমস্যা হয়েছে");
    });
  };

  const handleShareFilter = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bdretailers.com';
    const params = new URLSearchParams();
    if (activeShopFilter !== 'All') params.set('shop', activeShopFilter);
    if (activeTypeFilter !== 'All') params.set('type', activeTypeFilter);
    if (activeCategory !== 'All') params.set('category', activeCategory);
    if (activeSubcategory) params.set('subcategory', activeSubcategory);
    
    const shareUrl = `${origin}/?${params.toString()}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("ফিল্টার শেয়ারিং লিংক কপি হয়েছে! 🔗");
    }).catch(err => {
      toast.error("লিংক কপি করতে সমস্যা হয়েছে");
    });
  };

  // Phonetic transliteration match engine
  const matchPhoneticSearch = (product, queryText) => {
    if (!queryText) return true;
    const q = queryText.toLowerCase().trim();
    
    const prodName = (product.name || '').toLowerCase().trim();
    const prodCategory = (product.category || '').toLowerCase().trim();
    const prodShop = (product.shopName || '').toLowerCase().trim();
    
    if (prodName.includes(q) || prodCategory.includes(q) || prodShop.includes(q)) {
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

  // Compile active products list based on hierarchy & search options
  let filteredProducts = products.filter(p => {
    if (p.showOnMainSite === false) return false;
    // 1. Curation Whitelist Filters
    if (globalConfig?.showcaseCuration?.enabled) {
      const allowedShops = globalConfig.showcaseCuration.allowedShops || [];
      const allowedCategories = globalConfig.showcaseCuration.allowedCategories || [];
      const allowedSubcategories = globalConfig.showcaseCuration.allowedSubcategories || [];
      
      if (allowedShops.length > 0 && !allowedShops.includes(p.shopId)) return false;
      if (allowedCategories.length > 0 && !allowedCategories.includes(p.category)) return false;
      if (allowedSubcategories.length > 0 && p.subcategory && !allowedSubcategories.includes(p.subcategory)) return false;
    }

    // 2. Interactive Selection Filters
    const matchesShop = filterMode === 'merchant'
      ? (activeShopFilter === 'All' || p.shopName === activeShopFilter)
      : true;
    const matchesType = filterMode === 'type'
      ? (activeTypeFilter === 'All' || getProductType(p) === activeTypeFilter)
      : true;
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSubcategory = !activeSubcategory || p.subcategory === activeSubcategory;
    const matchesSearch = !productSearch || matchPhoneticSearch(p, productSearch);
    
    return matchesShop && matchesType && matchesCategory && matchesSubcategory && matchesSearch;
  });

  // Sort products
  filteredProducts = filteredProducts.sort((a, b) => {
    if (sortOption === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
    if (sortOption === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
    if (sortOption === 'name_desc') return b.name.localeCompare(a.name, 'bn');
    if (sortOption === 'newest') return (b.createdAt ? new Date(b.createdAt) : 0) - (a.createdAt ? new Date(a.createdAt) : 0);
    return a.name.localeCompare(b.name, 'bn');
  });

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
    if (!touchStart || !touchEnd || !mainShopData?.banners) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setActiveBanner(prev => (prev === mainShopData.banners.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe) {
      setActiveBanner(prev => (prev === 0 ? mainShopData.banners.length - 1 : prev - 1));
    }
  };

  // ── Chat Bot Integration ──
  const getSuggestedProductsForMessage = (msg) => {
    if (!msg || !msg.text || typeof msg.text !== 'string') return [];
    const match = msg.text.match(/PRODUCTS_JSON:([\s\S]*)$/);
    if (!match) return [];
    try {
      const parsed = JSON.parse(match[1].trim());
      return parsed.map(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return null;
        return { product, qty: item.qty || 1 };
      }).filter(Boolean);
    } catch (e) {
      return [];
    }
  };

  const addAllSuggestedToCart = (msgText) => {
    const suggested = getSuggestedProductsForMessage({ text: msgText });
    if (suggested.length === 0) return;
    suggested.forEach(({ product, qty }) => {
      for (let i = 0; i < qty; i++) {
        handleAddToCart(product);
      }
    });
    toast.success('সবগুলো পণ্য কার্টে যোগ করা হয়েছে! 🛒');
  };

  const sendChatMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const shopsInfo = allShops.filter(s => {
        const isTestStore = s.shopSlug === 'test' || s.subdomainSlug === 'test' || s.shopName?.toLowerCase() === 'test';
        return s.isActive !== false && s.showOnMainSite !== false && (!isTestStore || s.showOnMainSite === true);
      }).map(s => {
        const delFee = s.deliveryConfig?.advanceFee || '60';
        const freeDelMin = s.deliveryConfig?.freeDeliveryMinOrder ? `৳${s.deliveryConfig.freeDeliveryMinOrder}` : 'নেই';
        return `স্টোর: ${s.shopName} (slug: ${s.shopSlug}), ক্যাটাগরি: ${s.businessType || 'সাধারণ'}, ডেলিভারি চার্জ: ৳${delFee}, ফ্রি ডেলিভারি মিনিমাম অর্ডার: ${freeDelMin}, বিবরণ: ${s.description || 'নেই'}।`;
      }).join('\n');

      const productList = products.slice(0, 150).map(p => `${p.id}|${p.name}|৳${p.price}|${p.unit || 'piece'}|${p.description || ''}`).join('\n');
      
      const response = await fetch(`/api/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shopId: 'daripallah-store',
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a professional retail shopping assistant for the BDRetailers platform (bdretailers.com) in Bangladesh. 
              Always greet with "Assalamu Alaikum". Speak in Bengali. Be helpful and friendly.
              
              প্লাটফর্মের সকল স্টোরের তথ্য (স্টোরের নাম, ডেলিভারি চার্জ, এবং অন্যান্য তথ্য):
              ${shopsInfo || 'BDRetailers Store - Delivery Charge: ৳60'}
              
              Current Available Products in the Marketplace (ID|Name|Price|Unit|Description):
              ${productList || 'No products listed yet.'}
              
              Rule: If a user wants to buy or shows interest in products, list the matched products and write:
              "PRODUCTS_JSON:[{\"id\":\"product_id\",\"qty\":1}]" at the very end of your response so we can generate product cards for them.

              Rule: If a user wants to view their cart, check out, or place their order, write:
              "ACTION:OPEN_CART" at the very end of your response, and tell them you are opening their cart/checkout panel for them.

              🔴 বিশেষ নির্দেশ (একই পণ্যের বিভিন্ন রূপ): যদি কোনো পণ্যের একই নামে একাধিক ভেরিয়েশন/ইউনিট থাকে (যেমন: 'বয়লার মুরগি' পিস হিসেবে এবং কেজি হিসেবে আলাদা আলাদা পণ্য), তাহলে ইউজারকে অবশ্যই দুটি অপশনের কথাই স্পষ্টভাবে জানাবে (যেমন: 'পিস হিসেবেও আছে এবং কেজি হিসেবেও আছে') এবং জিজ্ঞেস করবে সে কোনটি নিতে চায়। কখনো নিজের থেকে যেকোনো একটি ধরে নিয়ে বাকি অপশনের কথা গোপন করবে না।
              ১০. পণ্য অনুসন্ধান এবং প্রাপ্যতা (Product Search & Availability): ব্যবহারকারী যদি নির্দিষ্ট কোনো পণ্যের (যেমন: ক্যামেরা) খোঁজ করে, তবে তুমি প্রথমে প্রদত্ত পণ্য তালিকায় তা খুঁজবে। যদি পণ্যটি তালিকায় থাকে, তবে সেটি সাজেস্ট করবে। কিন্তু যদি পণ্যটি তালিকায় না থাকে, তবে স্পষ্টভাবে ব্যবহারকারীকে বলবে যে পণ্যটি এই মুহূর্তে দোকানে উপলব্ধ নেই (available নেই)। এরপর তুমি বিকল্প হিসেবে অন্য কোনো সম্পর্কিত পণ্য (যেমন ক্যামেরা না থাকলে লেন্স বা অন্য কোনো অ্যাক্সেসরিজ যা তালিকায় আছে) বা বিকল্প ব্যবস্থা সাজেস্ট করতে পারো। কখনোই দোকানে না থাকা পণ্যের বদলে অন্য পণ্যকে সরাসরি মূল পণ্য হিসেবে সাজেস্ট করবে না।`
            },
            {
              role: 'user',
              content: text
            }
          ]
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'AI Error');

      const botText = data.choices?.[0]?.message?.content || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।';
      const botMsg = { id: Date.now() + 1, role: 'bot', text: botText };
      setChatMessages(prev => [...prev, botMsg]);

      // Auto open cart if action detected
      if (botText.includes("ACTION:OPEN_CART")) {
        setTimeout(() => {
          setIsCartOpen(true);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: 'দুঃখিত, এআই কানেকশন ফেইল করেছে। সাধারণ অফার এবং সাহায্য লাগলে দয়া করে সরাসরি মার্কেটপ্লেস ব্রাউজ করুন।' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Calculate Amazon style groups if enabled
  const shopGroups = {};
  if (globalConfig?.showAmazonBoxes) {
    products.forEach(p => {
      if (p.showOnMainSite === false) return;
      // 1. Curation Whitelist Filters
      if (globalConfig?.showcaseCuration?.enabled) {
        const allowedShops = globalConfig.showcaseCuration.allowedShops || [];
        const allowedCategories = globalConfig.showcaseCuration.allowedCategories || [];
        const allowedSubcategories = globalConfig.showcaseCuration.allowedSubcategories || [];
        
        if (allowedShops.length > 0 && !allowedShops.includes(p.shopId)) return;
        if (allowedCategories.length > 0 && !allowedCategories.includes(p.category)) return;
        if (allowedSubcategories.length > 0 && p.subcategory && !allowedSubcategories.includes(p.subcategory)) return;
      }

      // 2. Search & Filters
      const matchesSearch = !productSearch || matchPhoneticSearch(p, productSearch);
      const matchesType = filterMode === 'type'
        ? (activeTypeFilter === 'All' || getProductType(p) === activeTypeFilter)
        : true;
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSubcategory = !activeSubcategory || p.subcategory === activeSubcategory;

      if (matchesSearch && matchesType && matchesCategory && matchesSubcategory) {
        const groupType = globalConfig?.amazonBoxType || 'shop_recent';
        
        if (groupType === 'shop_featured' && !p.isFeatured && !p.featured) {
          return; // skip non-featured products
        }

        if (groupType === 'product_type') {
          const key = p.category || 'Other Category';
          if (!shopGroups[key]) {
            shopGroups[key] = {
              isCategory: true,
              categoryName: key,
              products: []
            };
          }
          shopGroups[key].products.push(p);
        } else {
          const key = p.shopName || 'Other Store';
          if (!shopGroups[key]) {
            shopGroups[key] = {
              isCategory: false,
              shopName: p.shopName,
              shopSlug: p.shopSlug,
              customDomain: p.customDomain,
              domainStatus: p.domainStatus,
              products: []
            };
          }
          shopGroups[key].products.push(p);
        }
      }
    });
  }

  // Group products by shop for the main list view when viewing "All Stores"
  const flatGroupedByShop = {};
  if (activeShopFilter === 'All') {
    filteredProducts.forEach(p => {
      const key = p.shopName || 'Other Store';
      if (!flatGroupedByShop[key]) {
        const matchingShop = allShops.find(s => s.shopSlug === p.shopSlug || s.shopName === p.shopName);
        flatGroupedByShop[key] = {
          shopName: key,
          shopSlug: p.shopSlug,
          shopLogoUrl: matchingShop?.logoUrl || '/logo.png',
          customDomain: p.customDomain,
          domainStatus: p.domainStatus,
          products: []
        };
      }
      flatGroupedByShop[key].products.push(p);
    });
  }

  return (
    <div className="neo-root font-sans overflow-x-hidden pb-20 lg:pb-10">
      <style jsx global>{`
        body {
          background-color: #e8eaf0 !important;
          color: #2e3040 !important;
        }
        .neo-root {
          --bg-color: #e8eaf0 !important;
          --text-color: #2e3040 !important;
          --surface: #e8eaf0 !important;
          --surface-2: #dcdee4 !important;
          --surface-3: #d6d8de !important;
          --panel-bg: #e8eaf0 !important;
          --border-color: rgba(0, 0, 0, 0.08) !important;
          
          /* Custom variables used in components */
          --neo-text: #2e3040 !important;
          --neo-text-2: #4a4d66 !important;
          --neo-text-3: #6b6f8a !important;
          --neo-border: rgba(0, 0, 0, 0.08) !important;
          --neo-bg-dark: #dcdee4 !important;
          --neo-accent: #4f46e5 !important;
          --neo-shadow-light: #ffffff !important;
          --neo-shadow-dark: rgba(165,170,190,0.5) !important;
          
          background-color: #e8eaf0 !important;
          color: #2e3040 !important;
          min-height: 100vh;
        }
        .neo-raised {
          background: #e8eaf0 !important;
          box-shadow: 6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6) !important;
          border: 1px solid rgba(255,255,255,0.4) !important;
          border-radius: 1.5rem;
        }
        .neo-inset {
          background: #e8eaf0 !important;
          box-shadow: inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          border-radius: 1.0rem;
        }
        .neo-button {
          background: #e8eaf0 !important;
          box-shadow: 4px 4px 8px rgba(0,0,0,0.08), -4px -4px 8px rgba(255,255,255,0.6) !important;
          border: 1px solid rgba(255,255,255,0.3) !important;
          border-radius: 0.75rem;
          transition: all 0.2s ease-in-out;
        }
        .neo-button:active, .neo-button-active {
          box-shadow: inset 3px 3px 6px rgba(0,0,0,0.06), inset -3px -3px 6px rgba(255,255,255,0.5) !important;
          transform: scale(0.98);
        }
        .neo-product-card {
          background: #e8eaf0 !important;
          box-shadow: 6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6) !important;
          border: 1px solid rgba(255,255,255,0.4) !important;
          border-radius: 1.25rem;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        .neo-product-card:hover {
          transform: translateY(-2px);
          box-shadow: 8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7) !important;
        }
        
        /* Dynamic neomorphic inputs override */
        .neo-search {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: #2e3040 !important;
        }
        .neo-select {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: #2e3040 !important;
          appearance: none;
          cursor: pointer;
          font-weight: 700;
        }
        .neo-select option {
          background-color: #e8eaf0 !important;
          color: #2e3040 !important;
        }

        /* ── Readability overrides for text overlays inside product image boxes ── */
        .bg-gradient-to-t.from-black\\/80.via-black\\/40 p {
          color: #ffffff !important;
        }
        .bg-gradient-to-t.from-black\\/80.via-black\\/40 .text-purple-400 {
          color: #fcd34d !important; /* Vibrant high-contrast amber yellow for price tags */
          font-weight: 900 !important;
        }
        
        /* ── Premium High-contrast Neomorphic Footer overrides ── */
        footer#contact {
          background-color: #dcdee4 !important;
          color: #2e3040 !important;
          border-top: 1px solid rgba(0, 0, 0, 0.08) !important;
          box-shadow: inset 0 6px 12px rgba(0,0,0,0.03) !important;
        }
        footer#contact h4 {
          color: #1e1b4b !important;
          font-weight: 900 !important;
        }
        footer#contact p {
          color: #2e3040 !important;
          font-weight: 700 !important;
        }
        footer#contact a, footer#contact span {
          color: #4a4d66 !important;
          font-weight: 700 !important;
        }
        footer#contact a:hover {
          color: #4f46e5 !important;
        }
        footer#contact .bg-white\\/5 {
          background-color: rgba(0, 0, 0, 0.05) !important;
          border-color: rgba(0, 0, 0, 0.08) !important;
          color: #4f46e5 !important;
        }
        footer#contact .text-purple-400 {
          color: #4f46e5 !important;
        }
        footer#contact svg {
          stroke: #4f46e5 !important;
        }
      `}</style>
      
      {/* ── Keyframe Injector ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animation-delay-2000 { animation-delay: 2.5s; }
        .animation-delay-4000 { animation-delay: 5s; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .hero-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.06) 0%, transparent 60%);
        }
      `}} />

      {/* ── Dynamic Cursor Glow ── */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.04), transparent 40%)`
        }}
      />

      {/* ── Background Blobs ── */}
      <div className="fixed inset-0 -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay" />
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] animate-blob" />
      <div className="fixed top-[-15%] right-[-5%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] animate-blob animation-delay-2000" />
      <div className="fixed bottom-[-15%] left-[10%] w-[600px] h-[600px] bg-pink-600/800 opacity-[0.05] rounded-full blur-[140px] animate-blob animation-delay-4000" />

      {/* ── Neomorphic Navigation Header ── */}
      <header className="sticky top-0 z-50 px-4 py-4 bg-[#e8eaf0] border-b border-black/5 shadow-sm neo-raised rounded-none transition-all duration-300">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center gap-4">
          {/* Left Area: Mobile Login/Workspace, Stores Button, and Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Workspace/Login (On the LEFT so it is fully visible & clickable on mobile) */}
            <div className="md:hidden">
              {user ? (
                <div>
                  {getDashboardHref() ? (
                    <Link href={getDashboardHref()} className="neo-button px-2.5 py-1.5 bg-indigo-600 text-white font-extrabold text-[10px] active:scale-95 transition-all flex items-center gap-1 shrink-0">
                      <Briefcase size={10} /> Workspace
                    </Link>
                  ) : (
                    <button onClick={() => setIsProfileOpen(true)} className="neo-button px-2.5 py-1.5 text-indigo-600 font-extrabold text-[10px] active:scale-95 transition-all shrink-0">
                      Profile
                    </button>
                  )}
                </div>
              ) : (
                <button 
                  onClick={handleSmartLogin} 
                  disabled={loggingIn} 
                  className="neo-button px-3 py-1.5 bg-indigo-600 text-white font-extrabold text-[10px] active:scale-95 transition-all shrink-0"
                >
                  {loggingIn ? "..." : "Login"}
                </button>
              )}
            </div>

            {/* Stores trigger */}
            <button 
              onClick={() => setIsStoresMenuOpen(true)} 
              className="neo-button px-3 py-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Menu size={13} className="shrink-0" />
              <span className="hidden xs:inline">Stores</span>
            </button>
            
            {/* Logo */}
            <div 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="flex items-center gap-2.5 group cursor-pointer select-none"
            >
              {globalConfig?.logoUrl || mainShopData?.logoUrl ? (
                <img src={globalConfig?.logoUrl || mainShopData?.logoUrl} className="h-7 sm:h-9 object-contain" alt="Logo" />
              ) : (
                <div className="w-8 h-8 neo-raised flex items-center justify-center text-indigo-600 font-black text-xs rounded-xl">BD</div>
              )}
              <span className="text-lg sm:text-xl font-black text-slate-800 tracking-tight whitespace-nowrap hidden sm:block">
                {globalConfig?.brandName || 'BDRetailers'}
              </span>
            </div>
          </div>

          {/* Center Links (Desktop only) */}
          <nav className="hidden md:flex items-center gap-8 font-bold text-xs uppercase tracking-wider">
            <a href="#marketplace" className="text-indigo-600 border-b-2 border-indigo-600 pb-1">Marketplace</a>
            <button onClick={() => { if(user) setIsProfileOpen(true); else handleSmartLogin(); }} className="text-slate-500 hover:text-indigo-600 transition-colors">Orders</button>
            {getDashboardHref() && (
              <Link href={getDashboardHref()} className="text-slate-500 hover:text-indigo-600 transition-colors">Workspace</Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* PWA App Download */}
            {!pwaInstalled && (
              <button 
                onClick={handleAppDownload}
                className="neo-button px-3 py-2 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 cursor-pointer hidden xs:flex items-center gap-1"
              >
                <Download size={12} /> App
              </button>
            )}

            {/* Video Guide */}
            {mainShopData?.howToOrderVideo && (
              <a 
                href={mainShopData.howToOrderVideo} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="neo-button px-3 py-2 text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <PlayCircle size={12} /> Video
              </a>
            )}

            {/* Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="neo-button p-2 text-indigo-600 flex items-center justify-center active:scale-95 transition-all relative cursor-pointer"
            >
              <ShoppingCart size={15} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-indigo-600 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Desktop Actions Block (Hidden on mobile) */}
            <div className="hidden md:flex items-center gap-3">
              <div className="w-[1px] h-4 bg-black/10 mx-0.5" />
              {user ? (
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="neo-button px-3.5 py-1.5 text-xs font-bold text-indigo-600 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-black/10 flex items-center justify-center bg-indigo-600 font-bold text-white text-[9px] shrink-0">
                      {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : user.displayName?.[0] || 'U'}
                    </div>
                    <span className="hidden sm:inline">Orders</span>
                  </button>

                  {getDashboardHref() && (
                    <Link href={getDashboardHref()} className="neo-button px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-extrabold text-xs active:scale-95 transition-all shrink-0 flex items-center gap-1.5 shadow-sm">
                      <Briefcase size={12} className="shrink-0" /> Workspace
                    </Link>
                  )}

                  <button onClick={logoutUser} className="text-[10px] font-black text-red-500 hover:text-red-600 transition-colors uppercase cursor-pointer flex items-center gap-1"><LogOut size={12} /> Sign Out</button>
                </div>
              ) : (
                <button 
                  onClick={handleSmartLogin} 
                  disabled={loggingIn} 
                  className="neo-button px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-extrabold text-xs active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
                >
                  {loggingIn ? "Connecting..." : "Portal Login"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Marketplace Section ── */}
      <section id="marketplace" className="relative z-20 max-w-[96%] xl:max-w-[98%] 2xl:max-w-[99%] mx-auto px-2 sm:px-6 py-2 md:py-6 scroll-mt-24">
        
        {/* ── Main Site Description Box (Editable via Superadmin) ── */}
        <div className="mb-4 py-3 px-5 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md relative shadow-md">
          <p className="text-xs sm:text-sm font-bold text-white/80 leading-relaxed">
            ✨ <strong className="text-purple-400 font-black">{globalConfig?.brandName || 'BDRetailers'} প্ল্যাটফর্ম:</strong>{' '}
            {renderClickableText(globalConfig?.platformDescription || 'BDRetailers — বাংলাদেশের সবচেয়ে গতিশীল ও আধুনিক ই-কমার্স হোলসেল এবং রিটেল নেটওয়ার্ক।')}
            <Link 
              href="/become-retailer"
              className="inline-flex items-center gap-1 ml-2 text-purple-400 hover:text-purple-300 hover:underline font-black whitespace-nowrap"
            >
              🤝 মার্চেন্ট বা রিটেইলার হোন →
            </Link>
          </p>
        </div>
        
        {/* ── AI Shopping List Integration ── */}
        {mainShopData && (
          <div className="mb-4 md:mb-8">
            <AiShoppingList 
              shop={mainShopData} 
              products={products} 
              onAddToCart={(items) => {
                if (Array.isArray(items)) {
                  items.forEach(item => handleAddToCart(item));
                } else {
                  handleAddToCart(items);
                }
              }} 
              onDirectOrder={(items) => {
                if (Array.isArray(items)) {
                  items.forEach(item => handleAddToCart(item));
                } else {
                  handleAddToCart(items);
                }
                setIsCartOpen(true);
              }}
            />
          </div>
        )}

        {/* ── Neomorphic Search & Filters Card ── */}
        <div className="neo-raised p-4 mb-4 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search bar inset */}
            <div className="flex-grow neo-inset flex items-center px-4 py-2">
              <Search className="text-slate-400 mr-3 shrink-0" size={16} />
              <input
                id="search-input-field"
                type="text"
                placeholder="Search products..."
                className="bg-transparent border-none focus:ring-0 w-full text-xs font-bold text-slate-800 placeholder-slate-400 p-0 outline-none h-full font-body animate-none"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-3 shrink-0">
              {/* Store select */}
              <div className="relative neo-button px-4 py-2 flex items-center justify-between min-w-[140px] cursor-pointer">
                <select
                  value={activeShopFilter}
                  onChange={e => {
                    setActiveShopFilter(e.target.value);
                    setActiveCategory('All');
                    setActiveSubcategory('');
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                >
                  <option value="All">All Stores</option>
                  {uniqueShops.filter(s => s !== 'All').map(shopName => (
                    <option key={shopName} value={shopName}>{shopName}</option>
                  ))}
                </select>
                <span className="text-xs font-bold text-slate-700 truncate pr-4">🏪 {activeShopFilter === 'All' ? 'All Stores' : activeShopFilter}</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </div>

              {/* Sort Options */}
              <div className="relative neo-button px-4 py-2 flex items-center justify-between min-w-[130px] cursor-pointer">
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                >
                  <option value="name_asc">Name (A→Z)</option>
                  <option value="price_asc">Price (Low→High)</option>
                  <option value="price_desc">Price (High→Low)</option>
                  <option value="name_desc">Name (Z→A)</option>
                  <option value="newest">New Arrivals</option>
                </select>
                <span className="text-xs font-bold text-slate-700 truncate pr-4">
                  {sortOption === 'name_asc' ? 'Name (A→Z)' :
                   sortOption === 'price_asc' ? 'Price (Low→High)' :
                   sortOption === 'price_desc' ? 'Price (High→Low)' :
                   sortOption === 'name_desc' ? 'Name (Z→A)' : 'New Arrivals'}
                </span>
                <span className="text-[10px] text-slate-400">▼</span>
              </div>
            </div>
          </div>

          {/* Compact categories row (Horizontal scroll) */}
          {activeShopFilter !== 'All' && (
            <div className="flex gap-2 overflow-x-auto pb-0.5 mt-0.5 scrollbar-none items-center border-t border-black/5 pt-2">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest shrink-0">Categories:</span>
              {availableCategories.map(cat => {
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveSubcategory('');
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all shrink-0 cursor-pointer neo-button ${
                      isSelected ? 'neo-button-active text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {cat === 'All' ? 'All' : cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Compact subcategories row */}
          {activeShopFilter !== 'All' && activeCategory !== 'All' && availableSubcategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-0.5 mt-0.5 scrollbar-none items-center border-t border-black/5 pt-1.5">
              <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest shrink-0">Subcategories:</span>
              <button
                onClick={() => setActiveSubcategory('')}
                className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold shrink-0 cursor-pointer neo-button ${
                  !activeSubcategory ? 'neo-button-active text-cyan-600 font-extrabold' : 'text-slate-500'
                }`}
              >
                All
              </button>
              {availableSubcategories.map(sub => {
                const isSelected = activeSubcategory === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => setActiveSubcategory(sub)}
                    className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold shrink-0 cursor-pointer neo-button ${
                      isSelected ? 'neo-button-active text-cyan-600 font-extrabold' : 'text-slate-500'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Amazon-style Box View Layout */}
        {globalConfig?.showAmazonBoxes && activeShopFilter === 'All' && (
          <div className="mb-12 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Object.values(shopGroups).map(group => {
                const isCat = !!group.isCategory;
                const displayProducts = group.products.slice(0, 4);
                
                // If it is category, we show a generic icon and category details
                const matchingShop = !isCat ? allShops.find(s => s.shopSlug === group.shopSlug) : null;
                const shopLogo = !isCat ? (matchingShop?.logoUrl || '/logo.png') : null;
                const headerTitle = isCat ? group.categoryName : group.shopName;
                const uniqueKey = isCat ? `cat_${group.categoryName}` : `shop_${group.shopSlug}`;
                
                return (
                  <div 
                    key={uniqueKey}
                    className="group glass-panel border-white/5 rounded-3xl p-5 hover:border-white/10 hover:shadow-[0_0_50px_rgba(139,92,246,0.1)] transition-all duration-500 flex flex-col justify-between bg-slate-950/45 cursor-pointer"
                    onClick={() => {
                      if (isCat) {
                        setActiveCategory(group.categoryName);
                        const gridEl = document.getElementById('products-grid-section');
                        if (gridEl) {
                          gridEl.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else {
                        setFilterMode('merchant');
                        setActiveShopFilter(group.shopName);
                      }
                    }}
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2.5 max-w-[70%]">
                          <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                            {isCat ? (
                              <div className="w-full h-full flex items-center justify-center font-black text-purple-400 text-xs">📁</div>
                            ) : (
                              <img src={shopLogo} alt={group.shopName} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <h3 className="font-extrabold text-white text-sm tracking-tight truncate">{headerTitle}</h3>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {!isCat && (
                            <button
                              onClick={(e) => handleCopyShopSectorLink(e, group.shopName)}
                              className="p-1.5 bg-white/5 border border-white/5 hover:bg-purple-600/30 hover:border-purple-500/20 text-white/40 hover:text-purple-400 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                              title={`"${group.shopName}" স্টোরের লিংক কপি করুন`}
                            >
                              <Share2 size={11} />
                            </button>
                          )}
                          <ArrowUpRight size={14} className="text-white/40 group-hover:text-purple-400 transition-colors" />
                        </div>
                      </div>

                      {/* 2x2 Grid */}
                      <div className="grid grid-cols-2 gap-3.5">
                        {displayProducts.map(p => (
                          <div 
                            key={p.id}
                            className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900/60 border border-white/[0.03] group/item hover:border-purple-500/30 transition-all flex flex-col justify-between"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(p);
                              setCustomizationNote('');
                            }}
                          >
                            <img src={p.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'} alt={p.name} className="w-full h-full object-cover opacity-90 group-hover/item:opacity-100 group-hover/item:scale-105 transition-transform duration-500" />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-[10px] text-white">
                              <p className="font-bold truncate">{p.name}</p>
                              <p className="font-black text-purple-400 mt-0.5">৳ {Number(p.price).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                        {Array.from({ length: Math.max(0, 4 - displayProducts.length) }).map((_, idx) => (
                          <div key={idx} className="aspect-square rounded-2xl bg-white/[0.02] border border-dashed border-white/5 flex items-center justify-center text-white/10 text-[10px] font-bold">
                            Empty Slot
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer view link */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-black text-purple-400 group-hover:text-purple-300 transition-colors">
                      <span>{isCat ? 'ক্যাটাগরি দেখুন (Explore Category)' : 'সবগুলো দেখুন (Explore Shop)'}</span>
                      <span className="text-[10px] text-white/30 font-bold bg-white/5 group-hover:bg-purple-600/20 group-hover:text-white px-2 py-0.5 rounded-lg transition-all">{group.products.length} Items</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Showcase Grid (Premium Wide 10-column Layout - Zero Wasted Spacing) */}
        <div id="products-grid-section">
        {(!globalConfig?.showAmazonBoxes || globalConfig?.showAllProductsDirectly || activeShopFilter !== 'All') && (
          productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 3xl:grid-cols-10 gap-4 md:gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="glass-panel border-white/5 rounded-3xl p-4 space-y-4">
                <div className="aspect-square bg-white/5 rounded-2xl w-full" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="h-6 bg-white/5 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center glass-panel rounded-3xl border-white/5">
            <ShoppingBag size={48} className="mx-auto text-white/20 mb-4" />
            <h4 className="text-lg font-black text-white/60">কোনো পণ্য পাওয়া যায়নি</h4>
            <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">অনুগ্রহ করে ফিল্টার অথবা সার্চের শব্দ পরিবর্তন করে ট্রাই করুন</p>
          </div>
        ) : activeShopFilter === 'All' ? (
          <div className="space-y-16">
            {Object.values(flatGroupedByShop).map(group => {
              const storeLink = getStoreLink(group.shopSlug, group.customDomain, group.domainStatus);
              return (
                <div key={group.shopName} className="space-y-6">
                  {/* Shop Section Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                        <img src={group.shopLogoUrl || '/logo.png'} alt={group.shopName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-base tracking-tight">{group.shopName}</h3>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">পণ্য সংখ্যা: {group.products.length}টি</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFilterMode('merchant');
                        setActiveShopFilter(group.shopName);
                      }}
                      className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/20 hover:border-purple-500 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      স্টোর ভিজিট করুন →
                    </button>
                  </div>

                  {/* Products Grid for this shop */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 3xl:grid-cols-10 gap-4 sm:gap-6">
                    {group.products.map(product => {
                      const storeLinkOfProduct = getStoreLink(product.shopSlug, product.customDomain, product.domainStatus);
                      const cartItem = cart.find(item => item.productId === product.id && !item.isCustomized);
                      
                      return (
                        <div
                          key={product.id}
                          className="group glass-panel border-white/5 rounded-3xl overflow-hidden hover:border-white/10 hover:shadow-[0_0_50px_rgba(139,92,246,0.08)] transition-all duration-500 flex flex-col justify-between bg-slate-950/20"
                        >
                          <div 
                            onClick={() => {
                              setSelectedProduct(product);
                              setCustomizationNote('');
                            }}
                            className="relative aspect-square overflow-hidden bg-slate-950/40 border-b border-white/5 cursor-pointer"
                          >
                            <img
                              src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                            />
                            {(product.shopSlug === 'daripallah-store' || product.shopSlug === 'webmaa-store') && (
                              <span className="absolute top-3 left-3 px-2 py-0.5 bg-amber-500/95 text-[8px] font-black text-black uppercase tracking-wider rounded-md shadow-md flex items-center gap-1">
                                👑 Primary Store
                              </span>
                            )}
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-1 mb-4">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest truncate max-w-[80px]">{product.category || 'General'}</span>
                                <a 
                                  href={storeLinkOfProduct} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-[9px] font-black text-white/40 hover:text-purple-400 truncate max-w-[100px] transition-colors flex items-center gap-0.5"
                                >
                                  🏪 {product.shopName} <ArrowUpRight size={8} />
                                </a>
                              </div>
                              <h3 
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setCustomizationNote('');
                                }}
                                className="font-extrabold text-white text-xs tracking-tight leading-tight line-clamp-2 min-h-[2rem] cursor-pointer hover:text-purple-400 transition-colors"
                              >
                                {product.name}
                              </h3>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-white/5">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-[9px] font-bold">দাম (Price)</span>
                                <span className="text-white font-black text-xs">৳ {Number(product.price).toLocaleString()}</span>
                              </div>

                              {product.stock === 0 ? (
                                <div className="w-full py-2.5 rounded-2xl font-black text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center gap-1.5 cursor-not-allowed">
                                  🚫 স্টক শেষ (Stock Out)
                                </div>
                              ) : (
                                cartItem ? (
                                  <div className="flex items-center justify-between bg-purple-900/40 rounded-2xl p-1 border border-purple-500/30">
                                    <button onClick={() => updateCartQty(product.id, -1)} className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-sm font-black shrink-0 cursor-pointer">
                                      <Minus size={12} strokeWidth={2.5} />
                                    </button>
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="any"
                                      value={cartItem.quantity}
                                      onChange={e => setCartQtyDirect(product.id, e.target.value)}
                                      className="font-black text-white text-xs w-full text-center bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button onClick={() => updateCartQty(product.id, 1)} className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-sm font-black shrink-0 cursor-pointer">
                                      <Plus size={12} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAddToCart(product)}
                                    className="w-full py-2.5 bg-white/5 hover:bg-purple-600 hover:text-white border border-white/10 hover:border-purple-500 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 text-white/70"
                                  >
                                    <ShoppingCart size={11} /> Add to Cart
                                  </button>
                                )
                              )}

                              {product.stock !== 0 && (product.allowCustomize || (product.sizes && product.sizes.length > 0) || (product.variants && product.variants.length > 0)) && (
                                <button
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setCustomizationNote('');
                                  }}
                                  className="w-full py-2 rounded-2xl font-black text-[9px] border border-purple-500/20 hover:border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                  <Sparkles size={11} /> কাস্টমাইজ (Customize)
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 3xl:grid-cols-10 gap-4 sm:gap-6">
              {filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(product => {
                const storeLink = getStoreLink(product.shopSlug, product.customDomain, product.domainStatus);
                const cartItem = cart.find(item => item.productId === product.id && !item.isCustomized);
                return (
                  <div
                    key={product.id}
                    className="group glass-panel border-white/5 rounded-3xl overflow-hidden hover:border-white/10 hover:shadow-[0_0_50px_rgba(139,92,246,0.08)] transition-all duration-500 flex flex-col justify-between bg-slate-950/20"
                  >
                    <div 
                      onClick={() => {
                        setSelectedProduct(product);
                        setCustomizationNote('');
                      }}
                      className="relative aspect-square overflow-hidden bg-slate-950/40 border-b border-white/5 cursor-pointer"
                    >
                      <img
                        src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      />
                      {(product.shopSlug === 'daripallah-store' || product.shopSlug === 'webmaa-store') && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 bg-amber-500/95 text-[8px] font-black text-black uppercase tracking-wider rounded-md shadow-md flex items-center gap-1">
                          👑 Primary Store
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1 mb-4">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest truncate max-w-[80px]">{product.category || 'General'}</span>
                          <a 
                            href={storeLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[9px] font-black text-white/40 hover:text-purple-400 truncate max-w-[100px] transition-colors flex items-center gap-0.5"
                          >
                            🏪 {product.shopName} <ArrowUpRight size={8} />
                          </a>
                        </div>
                        <h3 
                          onClick={() => {
                            setSelectedProduct(product);
                            setCustomizationNote('');
                          }}
                          className="font-extrabold text-white text-xs tracking-tight leading-tight line-clamp-2 min-h-[2rem] cursor-pointer hover:text-purple-400 transition-colors"
                        >
                          {product.name}
                        </h3>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-white/40 text-[9px] font-bold">দাম (Price)</span>
                          <span className="text-white font-black text-xs">৳ {Number(product.price).toLocaleString()}</span>
                        </div>

                        {product.stock === 0 ? (
                          <div className="w-full py-2.5 rounded-2xl font-black text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center gap-1.5 cursor-not-allowed">
                            🚫 স্টক শেষ (Stock Out)
                          </div>
                        ) : (
                          cartItem ? (
                            <div className="flex items-center justify-between bg-purple-900/40 rounded-2xl p-1 border border-purple-500/30">
                              <button onClick={() => updateCartQty(product.id, -1)} className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-sm font-black shrink-0 cursor-pointer">
                                <Minus size={12} strokeWidth={2.5} />
                              </button>
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={cartItem.quantity}
                                onChange={e => setCartQtyDirect(product.id, e.target.value)}
                                className="font-black text-white text-xs w-full text-center bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button onClick={() => updateCartQty(product.id, 1)} className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-sm font-black shrink-0 cursor-pointer">
                                <Plus size={12} strokeWidth={2.5} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="w-full py-2.5 bg-white/5 hover:bg-purple-600 hover:text-white border border-white/10 hover:border-purple-500 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 text-white/70"
                            >
                              <ShoppingCart size={11} /> Add to Cart
                            </button>
                          )
                        )}

                        {product.stock !== 0 && (product.allowCustomize || (product.sizes && product.sizes.length > 0) || (product.variants && product.variants.length > 0)) && (
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setCustomizationNote('');
                            }}
                            className="w-full py-2 rounded-2xl font-black text-[9px] border border-purple-500/20 hover:border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles size={11} /> কাস্টমাইজ (Customize)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Glassmorphic Numbered Pagination Controls */}
            {Math.ceil(filteredProducts.length / itemsPerPage) > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 bg-white/[0.02] border border-white/5 rounded-3xl p-3 w-max mx-auto shadow-2xl animate-fade-in">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-white/50 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer border border-white/5"
                >
                  Prev
                </button>
                
                {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }, (_, i) => i + 1).map(page => {
                  const isActive = currentPage === page;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer border ${
                        isActive
                          ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                          : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-white/50 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer border border-white/5"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ))}
        </div>
      </section>

      {/* ── Promoted Shops Showcase / Registry ── */}
      {(globalConfig?.promotedLinks && globalConfig.promotedLinks.length > 0) && (
        <section id="showcase" className="relative z-20 py-24 bg-white/[0.01] border-y border-white/5 overflow-hidden">
          <div className="max-w-[96%] xl:max-w-[98%] mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-10">
               <div className="text-left">
                  <span className="inline-block px-5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 mb-6">Verified Registry</span>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase">Elite Merchants</h2>
               </div>
               <div className="md:text-right max-w-sm">
                  <p className="text-xs text-white/40 font-bold leading-relaxed">
                     A curated registry of elite retail storefronts built and hosted securely on our high-performance cloud network.
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {globalConfig.promotedLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="group relative glass-panel p-8 rounded-[2rem] flex flex-col items-start gap-6 hover:bg-white/5 transition-all hover:-translate-y-1 hover:shadow-xl border-white/5">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[1.2rem] flex items-center justify-center shadow-2xl border border-white/10 group-hover:border-purple-500/50 transition-all">
                    <Globe size={24} className="text-white/20 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black group-hover:text-white transition-all tracking-tight">{link.title}</h4>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-1.5 group-hover:text-purple-400 transition-colors">
                       Visit Store <ArrowUpRight size={12} />
                    </p>
                  </div>
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      
      {/* ── Bottom Navigation Bar (Mobile Only) ── */}
      <nav className="neo-raised fixed bottom-0 w-full z-50 lg:hidden flex justify-around items-center h-16 px-4 border-t border-black/5 bg-[#e8eaf0] shadow-[0_-6px_12px_rgba(0,0,0,0.08)]">
        <button 
          onClick={() => {
            setActiveShopFilter('All');
            setActiveCategory('All');
            setActiveSubcategory('');
            document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center text-indigo-600 rounded-full p-2 active:scale-90 transition-transform duration-150 cursor-pointer"
        >
          <ShoppingBag size={18} />
          <span className="text-[9px] font-semibold mt-1">Marketplace</span>
        </button>
        <button 
          onClick={() => {
            document.getElementById('search-input-field')?.focus();
            document.getElementById('search-input-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 rounded-lg p-2 active:scale-90 transition-transform duration-150 cursor-pointer"
        >
          <Search size={18} />
          <span className="text-[9px] font-semibold mt-1">Search</span>
        </button>
        <button 
          onClick={() => {
            if (user) {
              setIsProfileOpen(true);
            } else {
              handleSmartLogin();
            }
          }}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 rounded-lg p-2 active:scale-90 transition-transform duration-150 cursor-pointer"
        >
          <Package size={18} />
          <span className="text-[9px] font-semibold mt-1">My Orders</span>
        </button>
        <button 
          onClick={() => {
            if (user) {
              const dashHref = getDashboardHref();
              if (dashHref) {
                router.push(dashHref);
              } else {
                setIsProfileOpen(true);
              }
            } else {
              handleSmartLogin();
            }
          }}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 rounded-lg p-2 active:scale-90 transition-transform duration-150 cursor-pointer"
        >
          <User size={18} />
          <span className="text-[9px] font-semibold mt-1">
            {user ? 'Workspace' : 'Login'}
          </span>
        </button>
      </nav>
    {/* ── Stores Drawer (Left Side) ── */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isStoresMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsStoresMenuOpen(false)} />
        <div className={`absolute top-0 left-0 h-full w-72 bg-slate-900 border-r border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isStoresMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Store size={16} className="text-purple-400" /> আমাদের স্টোরসমূহ (Stores)
            </h2>
            <button onClick={() => setIsStoresMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer">
              <X size={16} strokeWidth={3} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            <button
              onClick={() => {
                setActiveShopFilter('All');
                setActiveCategory('All');
                setActiveSubcategory('');
                setIsStoresMenuOpen(false);
                document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                activeShopFilter === 'All'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              সব স্টোর (All Stores)
            </button>
            
            {allShops.filter(s => s.shopSlug !== 'daripallah-store' && s.shopSlug !== 'webmaa-store').map(shop => {
              const isShopActive = activeShopFilter === shop.shopName;
              
              // Get categories for this shop
              const shopProducts = products.filter(p => p.shopSlug === shop.shopSlug || p.shopName === shop.shopName);
              const shopCats = [...new Set(shopProducts.map(p => p.category).filter(Boolean))];
              
              return (
                <div key={shop.id} className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveShopFilter(shop.shopName);
                      setActiveCategory('All');
                      setActiveSubcategory('');
                      if (shopCats.length === 0) {
                        setIsStoresMenuOpen(false);
                        document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                      isShopActive
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {shop.logoUrl ? (
                        <img src={shop.logoUrl} className="w-5 h-5 rounded-md object-contain border border-white/10 bg-white" alt="" />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-purple-900/50 flex items-center justify-center text-[10px] text-purple-200 font-bold">{shop.shopName?.[0]}</div>
                      )}
                      <span className="truncate">{shop.shopName}</span>
                    </div>
                    {shopCats.length > 0 && <span className="text-[10px] text-white/40">{isShopActive ? '▲' : '▼'}</span>}
                  </button>
                  
                  {isShopActive && shopCats.length > 0 && (
                    <div className="pl-4 space-y-1 border-l border-white/10 ml-4">
                      <button
                        onClick={() => {
                          setActiveCategory('All');
                          setActiveSubcategory('');
                          setIsStoresMenuOpen(false);
                          document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                          activeCategory === 'All' ? 'bg-purple-500/20 text-purple-300' : 'text-white/50 hover:bg-white/5'
                        }`}
                      >
                        সব ক্যাটাগরি
                      </button>
                      {shopCats.map(cat => {
                        const isCatActive = activeCategory === cat;
                        const catProducts = shopProducts.filter(p => p.category === cat);
                        const catSubs = [...new Set(catProducts.map(p => p.subcategory).filter(Boolean))];
                        
                        return (
                          <div key={cat} className="space-y-1">
                            <button
                              onClick={() => {
                                setActiveCategory(cat);
                                setActiveSubcategory('');
                                if (catSubs.length === 0) {
                                  setIsStoresMenuOpen(false);
                                  document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                                isCatActive ? 'bg-purple-500/20 text-purple-300' : 'text-white/50 hover:bg-white/5'
                              }`}
                            >
                              <span className="truncate">{cat}</span>
                              {catSubs.length > 0 && <span className="text-[9px] text-white/30">{isCatActive ? '▲' : '▼'}</span>}
                            </button>
                            
                            {isCatActive && catSubs.length > 0 && (
                              <div className="pl-3 space-y-1 border-l border-purple-500/30 ml-3">
                                {catSubs.map(sub => (
                                  <button
                                    key={sub}
                                    onClick={() => {
                                      setActiveSubcategory(sub);
                                      setIsStoresMenuOpen(false);
                                      document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className={`w-full text-left px-2 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                                      activeSubcategory === sub ? 'text-purple-300 font-black' : 'text-white/40 hover:bg-white/5'
                                    }`}
                                  >
                                    {sub}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer (Dynamic contacts with platform safety fallbacks) ── */}
      <footer id="contact" className="relative z-20 border-t border-white/5 pt-20 pb-12 bg-[#030612]">
        <div className="max-w-[96%] xl:max-w-[98%] mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
              
              {/* Brand Description Footer */}
              <div>
                 {globalConfig?.logoUrl || mainShopData?.logoUrl ? (
                    <img src={globalConfig?.logoUrl || mainShopData?.logoUrl} className="h-10 object-contain mb-6" alt="Logo" />
                  ) : (
                    <Logo href="/" className="text-white scale-[1.3] origin-left mb-6" text="bdretailers.com" />
                  )}
                 <p className="text-xs text-white/50 leading-relaxed max-w-sm mb-6 font-bold">
                    BDRetailers — বাংলাদেশের সবচেয়ে আধুনিক ই-কমার্স প্ল্যাটফর্ম। কাস্টমারদের জন্য সরাসরি ভেরিফাইড লোকাল মার্চেন্ট নেটওয়ার্ক থেকে সুরক্ষিত ও দ্রুত কেনাকাটার ওয়ান-স্টপ হাব।
                 </p>
                 <span className="text-[9px] font-black text-white/30 tracking-[0.4em] uppercase">bdretailers global platform © {new Date().getFullYear()}</span>
              </div>
              
              {/* Navigation Links */}
              <div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80 mb-6">Navigation</h4>
                 <ul className="space-y-4 text-xs font-bold text-white/50">
                    <li><Link href="/showcase" className="hover:text-white transition-colors">Live Showcase Registry</Link></li>
                    <li><a href="#marketplace" className="hover:text-white transition-colors">All Products Marketplace</a></li>
                    <li><Link href="/dashboard" className="hover:text-white transition-colors">Store Admin Portal</Link></li>
                    <li><Link href="/become-retailer" className="text-purple-400 hover:text-purple-300 font-black uppercase tracking-wider transition-colors flex items-center gap-1">🤝 Become Retailer</Link></li>
                    <li><Link href="/reviews" className="text-purple-400 hover:text-purple-300 font-black uppercase tracking-wider transition-colors flex items-center gap-1">⭐ Platform Reviews</Link></li>
                 </ul>
              </div>

              {/* Working Contact Links with Bulletproof Fallbacks */}
              <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80 mb-6">Contact Us</h4>
                  <ul className="space-y-4">
                    {/* 1. Superadmin Custom WhatsApp or Platform WhatsApp */}
                    {mainShopData?.socialLinks?.wa && getFormattedContactUrl(mainShopData.socialLinks.wa, 'whatsapp') !== '#' ? (
                      <li>
                        <a 
                          href={getFormattedContactUrl(mainShopData.socialLinks.wa, 'whatsapp')} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 text-xs font-bold text-white/70 group hover:text-white transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-purple-600 transition-all shrink-0">
                            <MessageCircle size={14} />
                          </div>
                          <span>WhatsApp (সরাসরি চ্যাট)</span>
                        </a>
                      </li>
                    ) : (globalWhatsapp && getFormattedContactUrl(globalWhatsapp, 'whatsapp') !== '#') ? (
                      <li>
                        <a 
                          href={getFormattedContactUrl(globalWhatsapp, 'whatsapp')} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 text-xs font-bold text-white/70 group hover:text-white transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-purple-600 transition-all shrink-0">
                            <MessageCircle size={14} />
                          </div>
                          <span>WhatsApp (সাপোর্ট)</span>
                        </a>
                      </li>
                    ) : (
                      <li>
                        <a 
                          href="https://wa.me/8801734763306" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 text-xs font-bold text-white/70 group hover:text-white transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-purple-600 transition-all shrink-0">
                            <MessageCircle size={14} />
                          </div>
                          <span>WhatsApp (অফিশিয়াল সাপোর্ট)</span>
                        </a>
                      </li>
                    )}

                    {/* 2. Superadmin Email or Platform Email */}
                    {mainShopData?.ownerEmail && !mainShopData.ownerEmail.toLowerCase().includes('no contact') && !mainShopData.ownerEmail.toLowerCase().includes('registered') ? (
                      <li>
                        <a 
                          href={`mailto:${mainShopData.ownerEmail}`} 
                          className="flex items-center gap-3 text-xs font-bold text-white/70 group hover:text-white transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-purple-600 transition-all shrink-0">
                            <Mail size={14} />
                          </div>
                          <span>{mainShopData.ownerEmail}</span>
                        </a>
                      </li>
                    ) : (
                      <li>
                        <a 
                          href="mailto:support@bdretailers.com" 
                          className="flex items-center gap-3 text-xs font-bold text-white/70 group hover:text-white transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-purple-600 transition-all shrink-0">
                            <Mail size={14} />
                          </div>
                          <span>support@bdretailers.com</span>
                        </a>
                      </li>
                    )}

                    {/* 3. Global Dynamic Config Extra Links */}
                    {globalConfig?.contactLinks?.filter(link => link.url && getFormattedContactUrl(link.url, link.name) !== '#').map((link, idx) => {
                      const formattedUrl = getFormattedContactUrl(link.url, link.name?.toLowerCase());
                      const isWa = link.name?.toLowerCase().includes('whatsapp') || link.url.includes('wa.me');
                      
                      return (
                        <li key={`extra-${idx}`}>
                           <a 
                             href={formattedUrl} 
                             target="_blank" 
                             rel="noreferrer" 
                             className="flex items-center gap-3 text-xs font-bold text-white/70 group hover:text-white transition-colors cursor-pointer"
                           >
                             <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-purple-600 transition-all shrink-0">
                                {isWa ? <MessageCircle size={14} /> : <Mail size={14} />}
                             </div>
                             <span>{link.name || 'Direct Connection'}</span>
                           </a>
                        </li>
                      );
                    })}
                  </ul>
              </div>
           </div>
        </div>
      </footer>

      {/* ── Cart Drawer Overlay ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsCartOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#09090f] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl animate-slide-in text-white z-10">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#05050a]">
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={20} className="text-purple-400 animate-pulse" />
                <div>
                  <h3 className="font-black text-lg text-white">Shopping Cart</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{cartItemCount} Products Selected</p>
                </div>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer">
                <X size={20} className="text-white/60 hover:text-white" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="py-24 text-center space-y-4">
                  <ShoppingCart size={64} className="mx-auto text-white/10" />
                  <p className="text-white/40 font-black uppercase tracking-wider text-xs">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 1. Primary Daripallah Store Section */}
                  {daripallahStoreItems.length > 0 && (
                    <div className="bg-purple-950/10 border border-purple-500/20 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                        👑 {globalConfig?.brandName || 'BDRetailers'} Store Products
                      </p>
                      <div className="space-y-3 divide-y divide-purple-500/10">
                        {daripallahStoreItems.map(item => (
                          <div key={item.id} className="flex gap-4 pt-3 first:pt-0">
                            <img src={item.imageUrl} className="w-12 h-12 object-contain bg-slate-900 rounded-lg border border-white/10 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-black text-white truncate">{item.name}</h4>
                              <p className="text-[10px] text-white/50 font-bold mt-1">৳ {item.price.toLocaleString()} x {item.quantity}</p>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <button onClick={() => updateCartQty(item.productId, -1)} className="p-1 hover:bg-white/10 rounded border border-white/10 text-white/60 hover:text-white shrink-0"><Minus size={10} /></button>
                                <input 
                                  type="number" 
                                  min="1" 
                                  value={item.quantity} 
                                  onChange={(e) => setCartQtyDirect(item.productId, e.target.value)} 
                                  className="w-12 bg-white/5 border border-white/10 rounded px-1 text-center text-xs font-black focus:outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-white shrink-0" 
                                />
                                <button onClick={() => updateCartQty(item.productId, 1)} className="p-1 hover:bg-white/10 rounded border border-white/10 text-white/60 hover:text-white shrink-0"><Plus size={10} /></button>
                                <button onClick={() => removeFromCart(item.productId)} className="ml-auto text-[10px] font-black text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"><Trash2 size={10} /> remove</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Third-Party Shops Section */}
                  {Object.entries(thirdPartyItemsByShop).map(([shopId, shopData]) => {
                    const shopCheckoutUrl = getStoreLink(shopData.shopSlug, shopData.customDomain, shopData.domainStatus);
                    return (
                      <div key={shopId} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                          🏪 {shopData.shopName}
                        </p>
                        <div className="space-y-3 divide-y divide-white/5">
                          {shopData.items.map(item => (
                            <div key={item.id} className="flex gap-4 pt-3 first:pt-0">
                              <img src={item.imageUrl} className="w-12 h-12 object-contain bg-slate-900 rounded-lg border border-white/10 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-white truncate">{item.name}</h4>
                                <p className="text-[10px] text-white/50 font-bold mt-1">৳ {item.price.toLocaleString()} x {item.quantity}</p>
                                
                                <div className="flex items-center gap-2 mt-2">
                                  <button onClick={() => updateCartQty(item.productId, -1)} className="p-1 hover:bg-white/10 rounded border border-white/10 text-white/60 hover:text-white shrink-0"><Minus size={10} /></button>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={item.quantity} 
                                    onChange={(e) => setCartQtyDirect(item.productId, e.target.value)} 
                                    className="w-12 bg-white/5 border border-white/10 rounded px-1 text-center text-xs font-black focus:outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-white shrink-0" 
                                  />
                                  <button onClick={() => updateCartQty(item.productId, 1)} className="p-1 hover:bg-white/10 rounded border border-white/10 text-white/60 hover:text-white shrink-0"><Plus size={10} /></button>
                                  <button onClick={() => removeFromCart(item.productId)} className="ml-auto text-[10px] font-black text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"><Trash2 size={10} /> remove</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="pt-2">
                          <button
                            onClick={() => handleCheckoutThirdParty(shopData, shopCheckoutUrl)}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 active:scale-95 transition-all text-center cursor-pointer"
                          >
                            Checkout at {shopData.shopName} (৳ {shopData.items.reduce((t, i) => t + i.price * i.quantity, 0).toLocaleString()})
                          </button>
                          <p className="text-[8px] text-center text-white/40 mt-1">অন্যান্য স্টোরের চেকআউট ঐ স্টোরে গিয়ে করতে হবে</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-[#05050a] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm font-bold">Subtotal Total</span>
                  <span className="text-white text-xl font-black">৳ {cartTotal.toLocaleString()}</span>
                </div>

                <div className="space-y-2">
                  {daripallahStoreItems.length > 0 && (
                    <button
                      onClick={handleCheckoutDaripallah}
                      className="w-full py-4 bg-white text-black hover:scale-[1.02] rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl cursor-pointer active:scale-95 transition-all"
                    >
                      Checkout {globalConfig?.brandName || 'BDRetailers'} Products (৳ {daripallahStoreTotal.toLocaleString()})
                    </button>
                  )}
                  <button
                    onClick={clearCart}
                    className="w-full py-3 bg-red-950/20 hover:bg-red-900/30 border border-red-500/10 hover:border-red-500/30 text-red-400 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Empty Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Platform-Wide Purchases Profile Drawer ── */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsProfileOpen(false)} />
          <div className="relative w-full max-w-md bg-[#09090f] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl animate-slide-in text-white z-10">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-[#05050a] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-purple-500/20 bg-purple-700/20 flex items-center justify-center font-black text-2xl">
                  {user?.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : user?.displayName?.[0] || 'U'}
                </div>
                <button onClick={() => setIsProfileOpen(false)} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 transition-colors cursor-pointer shrink-0"><X size={16} /></button>
              </div>
              <h3 className="text-xl font-black relative z-10 text-white">{user?.displayName || 'সম্মানিত কাস্টমার'}</h3>
              <p className="text-xs text-white/40 font-bold relative z-10 mt-0.5">{user?.email}</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto min-h-0">
              <div className="border-b border-white/5 pb-2 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-purple-400">আমার সকল অর্ডার ইতিহাস</h4>
                <span className="text-[10px] text-white/30 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{userOrders.length} Orders</span>
              </div>
              
              <div className="space-y-4">
                {loadingOrders ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/40">
                    <Loader2 className="animate-spin text-purple-500" size={24} />
                    <p className="text-[10px] font-black uppercase tracking-widest">অর্ডার লোড হচ্ছে...</p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-16 bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
                    <ShoppingBag size={32} className="mx-auto text-white/10 mb-2" />
                    <p className="text-xs font-bold text-white/40">কোনো অর্ডার ইতিহাস পাওয়া যায়নি</p>
                  </div>
                ) : userOrders.map(order => {
                  const viewLink = order.customDomain && order.domainStatus === 'connected'
                    ? `https://${order.customDomain}/order/${order.id}`
                    : `/shop/${order.shopSlug}/order/${order.id}`;
                    
                  return (
                    <div key={order.id} className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/20 transition-colors group">
                      <div className="p-4 bg-white/[0.01]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">#{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${order.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : order.status === 'cancelled' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>{order.status || 'Pending'}</span>
                        </div>
                        <p className="text-xs text-white/40 font-bold truncate">শপ: <span className="text-white font-extrabold">{order.shopName}</span></p>
                        <p className="font-extrabold text-white text-sm mt-1">{order.items?.length || 0} Items <span className="text-purple-400">(৳{order.total?.toLocaleString()})</span></p>
                      </div>
                      <div className="border-t border-white/5 bg-white/[0.005]">
                        <a 
                          href={viewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 text-[10px] font-black text-white/60 hover:text-white hover:bg-purple-600/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Package size={11} /> মেমো দেখুন (View Invoice)
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 text-center bg-[#05050a]">
              <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-black">{globalConfig?.brandName || 'BDRetailers'} Customer Profile &bull; 2026</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Circular Glassy Scroll Button Group (Bottom-Left) ── */}
      <div className="fixed bottom-8 left-8 z-[120] flex flex-col gap-2 animate-fade-in">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-purple-600 border border-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
          title="Scroll to Top"
        >
          <ArrowUp size={16} />
        </button>
        <button 
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })} 
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-purple-600 border border-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
          title="Scroll to Bottom"
        >
          <ArrowDown size={16} />
        </button>
      </div>

      {/* ── AI Modal (Chat + Voice + OCR + Text) ── */}
      {isAiOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAiOpen(false)} />
          <div className="relative w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] max-h-[700px] border border-slate-200 animate-slide-in text-slate-800">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-4 flex justify-between items-center border-b-[4px] border-purple-600 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-lg shadow-md shrink-0 animate-bounce">
                  😊
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight leading-tight">{mainShopData?.aiConfig?.botName || (globalConfig?.brandName ? `${globalConfig.brandName} Bot` : 'BDRetailers Bot')}</h3>
                  <p className="text-[10px] uppercase font-black text-purple-300 tracking-widest">AI Marketplace Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsAiOpen(false)} className="hover:bg-white/20 p-2 rounded-xl text-slate-300 hover:text-white transition-colors"><X size={20} strokeWidth={2.5}/></button>
            </div>

            {/* Tab Bar Removed - Kept only Chat tab view */}

            {/* Chat Tab */}
            {aiTab === 'chat' && (
              <>
                <div className="flex-1 p-4 bg-slate-50 flex flex-col gap-3 overflow-y-auto relative pb-4">
                  {chatMessages.map(msg => {
                    const suggestedItems = getSuggestedProductsForMessage(msg);
                    return (
                      <div key={msg.id} className={`max-w-[90%] flex flex-col gap-2 ${msg.role === 'bot' ? 'self-start' : 'self-end'}`}>
                        <div className={`p-3.5 rounded-2xl text-sm font-bold shadow-sm leading-relaxed ${msg.role === 'bot' ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-purple-600 text-white rounded-tr-none'}`}>
                          {msg && msg.text && typeof msg.text === 'string' 
                            ? msg.text.replace(/PRODUCTS_JSON:.*$/s, '').trim() 
                            : (msg ? msg.text : '')}
                        </div>
                        
                        {/* AI Suggested Products list */}
                        {suggestedItems && suggestedItems.length > 0 && (
                          <div className="mt-1 flex flex-col gap-2 bg-slate-100/90 p-2.5 rounded-2xl border border-slate-200/60 max-w-full">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-1">AI সাজেস্টেড প্রোডাক্টস:</p>
                            <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                              {suggestedItems.map(({ product, qty }) => {
                                const inCart = cart?.find(item => item.productId === product.id);
                                return (
                                  <div key={product.id} className="bg-white p-2 rounded-xl border border-slate-200/50 flex items-center justify-between gap-3 shadow-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-8 h-8 rounded-lg object-cover bg-slate-50 shrink-0" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 text-xs font-black flex items-center justify-center shrink-0">🛍</div>
                                      )}
                                      <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-slate-800 truncate">{product.name}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold">
                                          ৳{product.price} {qty > 1 && ` (qty: ${qty})`}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        for (let i = 0; i < qty; i++) {
                                          handleAddToCart(product);
                                        }
                                      }}
                                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${inCart ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                                    >
                                      {inCart ? 'যুক্ত আছে' : '+ কার্ট'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            
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
                <div className="p-3.5 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                  <button onClick={() => setChatMessages([{ id: 1, role: 'bot', text: 'নতুন চ্যাট শুরু হলো!' }])} className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 text-xs font-black transition-colors" title="Clear">🗑</button>
                  <input type="text" placeholder="ম্যাসেজ লিখুন..." className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-colors placeholder:text-slate-400" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage(chatInput)} />
                  <button onClick={() => sendChatMessage(chatInput)} className="bg-slate-900 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors shadow-md shrink-0"><MessageCircle size={20} strokeWidth={2.5}/></button>
                </div>
              </>
            )}

            {/* Other tabs (Voice/OCR/List) views removed */}
          </div>
        </div>
      )}

      {/* ── Circular Glassy AI Companion Trigger (Bottom-Right, shifted for alignment) ── */}
      <button 
        onClick={() => {
          setAiTab('chat');
          setIsAiOpen(true);
        }}
        className="fixed bottom-8 right-40 z-[120] w-15 h-15 bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/10 cursor-pointer shadow-purple-500/30 group animate-bounce animation-delay-1000"
        title="AI Assistant (এআই শপিং অ্যাসিস্ট্যান্ট)"
      >
        <span className="text-2xl group-hover:scale-120 transition-transform duration-300 animate-pulse select-none">😊</span>
        {/* Cute breathing ring */}
        <span className="absolute inset-0 rounded-full bg-purple-500/40 -z-10 animate-ping opacity-75" />
      </button>

      {/* ── Floating WhatsApp Chat Button (Bottom-Right, shifted for alignment) ── */}
      <a
        href={mainShopData?.socialLinks?.wa 
          ? getFormattedContactUrl(mainShopData.socialLinks.wa, 'whatsapp') 
          : (globalWhatsapp ? getFormattedContactUrl(globalWhatsapp, 'whatsapp') : "https://wa.me/8801734763306")}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-8 right-24 z-[120] w-14 h-14 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-115 active:scale-95 transition-all border border-emerald-400/30 cursor-pointer shadow-emerald-500/20"
        title="WhatsApp Support (সরাসরি যোগাযোগ)"
      >
        <MessageCircle size={24} />
      </a>

      {/* Floating Cart Trigger (Bottom-Right) */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-8 right-8 z-[120] w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/40 hover:scale-115 active:scale-95 transition-all border border-white/10 cursor-pointer"
      >
        <ShoppingCart size={24} />
        {cartItemCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-lg border border-black">
            {cartItemCount}
          </span>
        )}
      </button>

      {/* ── Unified Product Details Modal ── */}
      {selectedProduct && (
        <LandingProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          cart={cart}
          setCart={setCart}
        />
      )}

    </div>
  );
}

// ── Unified Product Details Modal Component ──
function LandingProductDetailModal({ product, onClose, cart, setCart }) {
  const [shop, setShop] = useState(null);
  const [loadingShop, setLoadingShop] = useState(true);

  useEffect(() => {
    if (product) {
      setLoadingShop(true);
      getShopBySlug(product.shopSlug)
        .then(data => {
          setShop(data);
          setLoadingShop(false);
        })
        .catch(err => {
          console.error(err);
          setShop({ id: product.shopId, shopName: product.shopName, shopSlug: product.shopSlug });
          setLoadingShop(false);
        });
    }
  }, [product]);

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
      <div className="relative w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col gap-6 animate-scale-in my-8 max-h-[90vh] overflow-y-auto scrollbar-thin text-slate-900">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer z-10"
        >
          <X size={20} />
        </button>

        {loadingShop ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="animate-spin text-purple-600" size={40} />
          </div>
        ) : (
          <LandingProductDetailInner 
            shop={shop} 
            product={product} 
            onClose={onClose}
            cart={cart}
            setCart={setCart}
          />
        )}
      </div>
    </div>
  );
}

function LandingProductDetailInner({ shop, product, onClose, cart, setCart }) {
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

  const handleLandingAddToCart = () => {
    try {
      if (Number(safeProduct.stock) === 0) return toast.error('স্টক নেই');

      const safeQty = Number(logic.qty) || 1;
      const safeAiPrice = logic.aiPrice !== null ? Number(logic.aiPrice) : null;
      const unitPrice = safeAiPrice !== null ? safeAiPrice / safeQty : safeBasePrice;
      const finalPrice = safeAiPrice !== null ? safeAiPrice : safeBasePrice * safeQty;

      if (finalPrice <= 0 || isNaN(finalPrice)) return toast.error('মূল্য সঠিক নয়');

      let variantString = logic.isLegacySizes ? (logic.selectedSize?.label || '') : 
        Object.entries(logic.selectedVariants || {}).filter(([n, o]) => n && o).map(([n, o]) => `${n}: ${o.label}`).join(', ');

      const displayName = safeProduct.name + (variantString ? ` (${variantString})` : '');

      const globalCartItem = {
        id: `${safeProduct.id}_${Date.now()}`,
        productId: safeProduct.id,
        name: displayName,
        price: unitPrice,
        quantity: safeQty,
        imageUrl: safeProduct.imageUrl || '',
        shopId: safeProduct.shopId,
        shopName: safeProduct.shopName === 'ADMIN' ? 'Daripallah Store' : safeProduct.shopName,
        shopSlug: safeProduct.shopSlug,
        customDomain: safeProduct.customDomain || '',
        domainStatus: safeProduct.domainStatus || '',
        isThirdParty: safeProduct.shopSlug !== 'daripallah-store' && safeProduct.shopSlug !== 'webmaa-store',
        customNote: logic.customerNote || logic.customInput || '',
        isCustomized: safeAiPrice !== null || !!logic.customerNote || !!logic.customInput
      };

      // Add to global landing page cart
      let updatedCart = [...cart];
      const existingIndex = updatedCart.findIndex(item => 
        item.productId === safeProduct.id && 
        item.name === displayName && 
        (item.customNote || '') === (globalCartItem.customNote || '')
      );

      if (existingIndex > -1) {
        updatedCart[existingIndex].quantity += safeQty;
      } else {
        updatedCart.push(globalCartItem);
      }
      setCart(updatedCart);
      localStorage.setItem('cart_daripallah-store', JSON.stringify(updatedCart));

      // Sync to individual store cart in localStorage
      const storeCartKey = `cart_${safeProduct.shopId}`;
      try {
        const storeCart = JSON.parse(localStorage.getItem(storeCartKey) || '[]');
        const storeExistingIdx = storeCart.findIndex(item => 
          item.productId === safeProduct.id && 
          item.name === displayName && 
          (item.note || '') === (globalCartItem.customNote || '')
        );

        if (storeExistingIdx > -1) {
          storeCart[storeExistingIdx].quantity += safeQty;
        } else {
          storeCart.push({
            id: `${safeProduct.id}_${Date.now()}`,
            productId: safeProduct.id,
            name: displayName,
            price: unitPrice,
            clientPrice: unitPrice,
            quantity: safeQty,
            imageUrl: safeProduct.imageUrl || '',
            note: globalCartItem.customNote,
            isCustomized: globalCartItem.isCustomized,
            customizedText: logic.customInput || '',
            variantsText: variantString || ''
          });
        }
        localStorage.setItem(storeCartKey, JSON.stringify(storeCart));
      } catch (err) {
        console.error('Failed to sync individual shop cart:', err);
      }

      toast.success(`${safeProduct.name} কার্টে যোগ হয়েছে! 🛒`);
      onClose();
    } catch (err) {
      console.error('[LandingAddToCart] Error:', err);
      toast.error('কার্টে যোগ করতে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="space-y-6 text-slate-900 pr-1 scrollbar-thin">
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
          onAddToCart={handleLandingAddToCart} 
        />
        <ReviewSection shopId={safeShop?.id} />

      </div>
    </div>
  );
}
