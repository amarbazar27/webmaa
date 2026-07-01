"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Search, Star, ArrowRight, Phone, Store,
  X, Loader2, CheckCircle, Sparkles, Package, ChevronRight,
  ShoppingCart, Plus, Minus, Trash2, Filter, Globe, ArrowUpRight,
  MessageCircle, Mail, ArrowUp, ArrowDown, Bot, ImagePlus, Lightbulb, Mic,
  Share2, Copy, PlayCircle, Download, Briefcase, LogOut, Menu, Tag
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
    { id: 1, role: 'bot', text: 'আসসালামু আলাইকুম! আমি দারিপাল্লা এআই শপিং অ্যাসিস্ট্যান্ট। আমি আপনাকে পুরো মার্কেটপ্লেস থেকে পণ্য খুঁজে পেতে এবং ভয়েস বা ফর্দ এনালাইসিস করে সরাসরি অর্ডার করতে সাহায্য করব। বলুন, আজ কীভাবে সাহায্য করতে পারি? 😊' }
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
          text: `দারিপাল্লা মার্কেটপ্লেসে '${product.name}' দেখুন! 🛒`,
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

              🔴 বিশেষ নির্দেশ (একই পণ্যের বিভিন্ন রূপ): যদি কোনো পণ্যের একই নামে একাধিক ভেরিয়েশন/ইউনিট থাকে (যেমন: 'বয়লার মুরগি' পিস হিসেবে এবং কেজি হিসেবে আলাদা আলাদা পণ্য), তাহলে ইউজারকে অবশ্যই দুটি অপশনের কথাই স্পষ্টভাবে জানাবে (যেমন: 'পিস হিসেবেও আছে এবং কেজি হিসেবেও আছে') এবং জিজ্ঞেস করবে সে কোনটি নিতে চায়। কখনো নিজের থেকে যেকোনো একটি ধরে নিয়ে বাকি অপশনের কথা গোপন করবে না।`
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
    <div className="neo-root font-sans overflow-x-hidden selection:bg-purple-100 selection:text-purple-800 pb-20 lg:pb-10">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-[100] neo-navbar px-3 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between">
        {/* Left: Stores button (mobile) + Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsStoresMenuOpen(true)}
            className="neo-btn flex items-center gap-1.5 px-3 py-2 text-[11px] font-black shrink-0 lg:hidden"
          >
            <Menu size={14} style={{color:'var(--neo-accent)'}} />
            <span style={{color:'var(--neo-text-2)'}}>Stores</span>
          </button>
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            {(globalConfig?.logoUrl || mainShopData?.logoUrl) ? (
              <img src={globalConfig?.logoUrl || mainShopData?.logoUrl} className="h-8 sm:h-9 object-contain group-hover:scale-105 transition-transform" alt="Logo" />
            ) : (
              <img src="/logo.png" className="h-8 sm:h-9 object-contain group-hover:scale-105 transition-transform" alt="Logo" />
            )}
            <span className="text-sm sm:text-base font-black tracking-tight whitespace-nowrap hidden xs:block" style={{color:'var(--neo-text)'}}>
              {globalConfig?.brandName || 'BDRetailers'}
            </span>
          </div>
        </div>

        {/* Center: desktop nav links */}
        <div className="hidden md:flex items-center gap-4">
          <a href="#marketplace" className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all hover:opacity-70" style={{color:'var(--neo-text-2)'}}>
            <ShoppingBag size={12} /> Marketplace
          </a>
          <Link href="/showcase" className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all hover:opacity-70" style={{color:'var(--neo-text-2)'}}>
            <Sparkles size={12} /> Showcase
          </Link>
          {mainShopData?.howToOrderVideo && (
            <a href={mainShopData.howToOrderVideo} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black text-white bg-red-500 hover:bg-red-600 transition-all shadow-sm">
              <PlayCircle size={11} /> How to Order
            </a>
          )}
        </div>

        {/* Right: Cart + Auth */}
        <div className="flex items-center gap-2 shrink-0">
          {!pwaInstalled && (
            <button onClick={handleAppDownload}
              className="neo-btn hidden sm:flex items-center gap-1.5 px-3 py-2 text-[10px] font-black"
              style={{color:'var(--neo-accent)'}}>
              <Download size={12} /> App
            </button>
          )}
          <button onClick={() => setIsCartOpen(true)}
            className="neo-btn relative p-2.5 flex items-center justify-center"
            style={{color:'var(--neo-text-2)'}}
            title="Cart">
            <ShoppingCart size={15} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
          {user ? (
            <>
              <button onClick={() => setIsProfileOpen(true)}
                className="neo-btn hidden sm:flex items-center gap-1.5 px-3 py-2 text-[10px] font-black"
                style={{color:'var(--neo-text-2)'}}>
                <div className="w-5 h-5 rounded-full overflow-hidden border-2 border-purple-400 flex items-center justify-center bg-purple-100 font-bold text-purple-700 text-[9px] shrink-0">
                  {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : user.displayName?.[0] || 'U'}
                </div>
                <span>Orders</span>
              </button>
              {getDashboardHref() && (
                <Link href={getDashboardHref()} className="neo-btn-primary flex items-center gap-1.5 px-3 py-2 text-[10px] font-black">
                  <Briefcase size={11} /> Workspace
                </Link>
              )}
              <button onClick={logoutUser} className="neo-btn hidden sm:flex items-center gap-1 px-2.5 py-2 text-[9px] font-black" style={{color:'#ef4444'}}>
                <LogOut size={11} />
              </button>
            </>
          ) : (
            <button onClick={handleSmartLogin} disabled={loggingIn}
              className="neo-btn-primary flex items-center gap-1 px-4 py-2 text-[10px] font-black">
              {loggingIn ? 'Connecting...' : 'Login'}
            </button>
          )}
        </div>
      </nav>

      {/* ── Banner Carousel (Optional — only shows if superadmin has uploaded banners) ── */}
      {mainShopData?.banners && mainShopData.banners.length > 0 && (
        <div
          className="relative w-full overflow-hidden shadow-md"
          style={{paddingTop:'62px', height:'calc(clamp(180px,33vh,420px) + 62px)'}}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="absolute inset-0 top-[62px]">
            {mainShopData.banners.map((banner, i) => {
              const isActive = i === activeBanner;
              const bannerUrl = banner.url || '';
              return (
                <div
                  key={i}
                  className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img
                    src={bannerUrl}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover object-center"
                    style={{display:'block',width:'100%',height:'100%'}}
                  />
                  {(banner.title || banner.subtitle) && (
                    <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-black/50 to-transparent">
                      {banner.title && <p className="text-white font-black text-sm sm:text-base drop-shadow">{banner.title}</p>}
                      {banner.subtitle && <p className="text-white/80 text-xs font-bold drop-shadow">{banner.subtitle}</p>}
                    </div>
                  )}
                </div>
              );
            })}
            {mainShopData.banners.length > 1 && (
              <>
                <button onClick={() => setActiveBanner(p => (p - 1 + mainShopData.banners.length) % mainShopData.banners.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-lg bg-black/30 hover:bg-black/50 transition-all cursor-pointer">❮</button>
                <button onClick={() => setActiveBanner(p => (p + 1) % mainShopData.banners.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-lg bg-black/30 hover:bg-black/50 transition-all cursor-pointer">❯</button>
                <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center gap-1.5">
                  {mainShopData.banners.map((_,idx)=>(<button key={idx} onClick={()=>setActiveBanner(idx)} className={`w-2 h-2 rounded-full transition-all ${idx===activeBanner?'bg-white w-5':'bg-white/50'}`}/>))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Marketplace Section ── */}
      <section id="marketplace" className="relative z-10 scroll-mt-0">
        <div className="flex items-start">

          {/* ── Desktop Sidebar ── */}
          <aside className="neo-sidebar hidden lg:flex flex-col w-60 xl:w-64 shrink-0 sticky top-[62px] h-[calc(100vh-62px)] overflow-y-auto py-4 px-3">
            <div className="flex items-center gap-2 px-3 pb-3 mb-2 border-b" style={{borderColor:'var(--neo-border)'}}>
              {(globalConfig?.logoUrl || mainShopData?.logoUrl) ? (
                <img src={globalConfig?.logoUrl || mainShopData?.logoUrl} className="h-7 object-contain" alt="Logo"/>
              ) : (
                <img src="/logo.png" className="h-7 object-contain" alt="Logo"/>
              )}
              <span className="text-xs font-black truncate" style={{color:'var(--neo-text)'}}>{globalConfig?.brandName||'BDRetailers'}</span>
            </div>

            <div className="neo-section-header px-1">Stores</div>
            <button
              onClick={()=>{setActiveShopFilter('All');setActiveCategory('All');setActiveSubcategory('');}}
              className={`neo-sidebar-item w-full ${activeShopFilter==='All'?'active':''}`}
            >
              <ShoppingBag size={14}/> All Stores
              <span className="ml-auto text-[10px] font-bold opacity-60">{products.length}</span>
            </button>

            {allShops.filter(s=>s.shopSlug!=='daripallah-store'&&s.shopSlug!=='webmaa-store').map(shop=>{
              const isShopSideActive = activeShopFilter===shop.shopName;
              const shopSideProds = products.filter(p=>p.shopSlug===shop.shopSlug||p.shopName===shop.shopName);
              const shopSideCats = [...new Set(shopSideProds.map(p=>p.category).filter(Boolean))];
              return (
                <div key={shop.id}>
                  <button onClick={()=>{setActiveShopFilter(shop.shopName);setActiveCategory('All');setActiveSubcategory('');}}
                    className={`neo-sidebar-item w-full ${isShopSideActive?'active':''}`}>
                    {shop.logoUrl?<img src={shop.logoUrl} className="w-5 h-5 rounded-md object-contain bg-white border" style={{borderColor:'var(--neo-border)'}} alt=""/>:<div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{background:'var(--neo-bg-dark)',color:'var(--neo-accent)'}}>{shop.shopName?.[0]}</div>}
                    <span className="truncate flex-1 text-left">{shop.shopName}</span>
                    <span className="ml-auto text-[10px] font-bold opacity-50">{shopSideProds.length}</span>
                  </button>
                  {isShopSideActive && shopSideCats.length>0 && (
                    <div className="pl-4 mt-0.5 space-y-0.5 border-l-2 ml-5" style={{borderColor:'var(--neo-accent)'}}>
                      <button onClick={()=>{setActiveCategory('All');setActiveSubcategory('');}}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold"
                        style={{color:activeCategory==='All'?'var(--neo-accent)':'var(--neo-text-3)'}}>
                        All Categories
                      </button>
                      {shopSideCats.map(cat=>(
                        <button key={cat} onClick={()=>{setActiveCategory(cat);setActiveSubcategory('');}}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold truncate"
                          style={{color:activeCategory===cat?'var(--neo-accent)':'var(--neo-text-3)'}}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="mt-auto px-1 pt-4 space-y-2">
              <Link href="/become-retailer" className="neo-btn-primary w-full flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl">
                🤝 Become a Merchant
              </Link>
              {getDashboardHref() && user && (
                <Link href={getDashboardHref()} className="neo-btn w-full flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl" style={{color:'var(--neo-text-2)'}}>
                  <Briefcase size={13}/> Workspace
                </Link>
              )}
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0 px-3 sm:px-5 py-5">

            {/* ── Main Site Description Box (Editable via Superadmin) ── */}
            <div className="neo-info-card mb-4 py-3 px-5 flex flex-wrap items-center gap-3">
              <p className="text-xs sm:text-sm font-bold flex-1 min-w-0 leading-relaxed" style={{color:'var(--neo-text-2)'}}>
                ✨ <strong className="font-black" style={{color:'var(--neo-accent)'}}>{globalConfig?.brandName || 'BDRetailers'}:</strong>{' '}
                {renderClickableText(globalConfig?.platformDescription || 'BDRetailers — বাংলাদেশের সবচেয়ে গতিশীল ও আধুনিক ই-কমার্স হোলসেল এবং রিটেল নেটওয়ার্ক। আপনার পছন্দের স্টোর থেকে সরাসরি কিনুন।')}
              </p>
              <Link href="/become-retailer" className="neo-btn-primary shrink-0 flex items-center gap-1.5 px-4 py-2 text-[11px] font-black rounded-xl whitespace-nowrap">
                🤝 Become a Merchant
              </Link>
            </div>

            {/* ── AI Shopping List Integration ── */}
            {mainShopData && (
              <div className="mb-4">
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

            {/* ── Unified Compact Search, Store & Sort Row ── */}
            <div className="neo-card mb-4 p-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={13} style={{color:'var(--neo-text-3)'}}/>
                  <input
                    type="text"
                    placeholder="পণ্য খুঁজুন..."
                    className="neo-search w-full pl-9 pr-3 py-2.5 text-xs"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>
                {/* Store filter (hidden on desktop since sidebar does this) */}
                <div className="relative shrink-0 lg:hidden">
                  <select
                    value={activeShopFilter}
                    onChange={e => {setActiveShopFilter(e.target.value);setActiveCategory('All');setActiveSubcategory('');}}
                    className="neo-select px-3 py-2.5 text-xs pr-7"
                  >
                    <option value="All">🏪 All Stores</option>
                    {uniqueShops.filter(s=>s!=='All').map(shopName=>(
                      <option key={shopName} value={shopName}>{shopName}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px]" style={{color:'var(--neo-text-3)'}}>▾</div>
                </div>
                {/* Sort */}
                <div className="relative shrink-0">
                  <select
                    value={sortOption}
                    onChange={e=>setSortOption(e.target.value)}
                    className="neo-select px-3 py-2.5 text-xs pr-7"
                  >
                    <option value="name_asc">A→Z</option>
                    <option value="price_asc">দাম ↑</option>
                    <option value="price_desc">দাম ↓</option>
                    <option value="name_desc">Z→A</option>
                    <option value="newest">নতুন</option>
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px]" style={{color:'var(--neo-text-3)'}}>▾</div>
                </div>
              </div>

              {/* Categories (horizontal scroll) */}
              {activeShopFilter !== 'All' && (
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none items-center">
                  {availableCategories.map(cat => {
                    const isSelected = activeCategory===cat;
                    return (
                      <button key={cat} onClick={()=>{setActiveCategory(cat);setActiveSubcategory('');}}
                        className={`neo-tag shrink-0 ${isSelected?'active':''}`}>
                        {cat==='All'?'সব':cat}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-categories */}
              {activeShopFilter!=='All'&&activeCategory!=='All'&&availableSubcategories.length>0&&(
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none items-center">
                  <button onClick={()=>setActiveSubcategory('')} className={`neo-tag shrink-0 ${!activeSubcategory?'active':''}`}>সব</button>
                  {availableSubcategories.map(sub=>(
                    <button key={sub} onClick={()=>setActiveSubcategory(sub)} className={`neo-tag shrink-0 ${activeSubcategory===sub?'active':''}`}>{sub}</button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Products Grid ── */}
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 animate-pulse">
                {[1,2,3,4,5,6,7,8].map(n=>(
                  <div key={n} className="neo-product-card p-3 space-y-3">
                    <div className="aspect-square rounded-xl w-full" style={{background:'var(--neo-bg-dark)'}}/>
                    <div className="h-3 rounded w-2/3" style={{background:'var(--neo-bg-dark)'}}/>
                    <div className="h-5 rounded w-1/3" style={{background:'var(--neo-bg-dark)'}}/>
                  </div>
                ))}
              </div>
            ) : activeShopFilter === 'All' ? (
              /* ── Amazon Bento Groups (All Stores) ── */
              <>
                {flatGroupedByShop.length === 0 ? (
                  <div className="py-20 text-center neo-card">
                    <ShoppingBag size={48} className="mx-auto mb-4" style={{color:'var(--neo-text-3)'}}/>
                    <h4 className="text-lg font-black" style={{color:'var(--neo-text-2)'}}>কোনো পণ্য পাওয়া যায়নি</h4>
                    <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{color:'var(--neo-text-3)'}}>ফিল্টার বা সার্চ পরিবর্তন করুন</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {flatGroupedByShop.map(({ shopName, shopSlug, shopLogo, isPrimary, products: shopProds }) => {
                      const displayProds = shopProds.slice(0, 4);
                      return (
                        <div key={shopSlug}
                          className="neo-card p-5 flex flex-col justify-between cursor-pointer hover:-translate-y-1 transition-all"
                          onClick={() => {setActiveShopFilter(shopName);setActiveCategory('All');setActiveSubcategory('');}}
                        >
                          <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{borderColor:'var(--neo-border)'}}>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border" style={{background:'var(--neo-bg-dark)',borderColor:'var(--neo-border)'}}>
                                {shopLogo ? (
                                  <img src={shopLogo} className="w-full h-full object-contain" alt="" />
                                ) : (
                                  <span className="font-black text-sm" style={{color:'var(--neo-accent)'}}>{shopName?.[0]}</span>
                                )}
                              </div>
                              <div>
                                <p className="font-extrabold text-sm tracking-tight" style={{color:'var(--neo-text)'}}>{shopName}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{color:'var(--neo-text-3)'}}>{shopProds.length} products</p>
                              </div>
                            </div>
                            {isPrimary && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200">Primary</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {displayProds.map(product => (
                              <div key={product.id}
                                className="relative aspect-square rounded-xl overflow-hidden group/item transition-all"
                                style={{background:'var(--neo-bg-dark)',boxShadow:'inset 2px 2px 6px rgba(160,165,185,0.3)'}}
                                onClick={e => {e.stopPropagation(); setSelectedProduct(product); setIsProductModalOpen(true);}}
                              >
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-item/hover:scale-110 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                                )}
                                <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                                  <p className="text-white text-[9px] font-bold truncate">{product.name}</p>
                                  <p className="text-white/80 text-[8px] font-black">৳{product.price}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-black" style={{borderColor:'var(--neo-border)',color:'var(--neo-accent)'}}>
                            <span>View all {shopProds.length} products</span>
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* ── Single Store Product Grid ── */
              <>
                {paginatedProducts.length === 0 ? (
                  <div className="py-20 text-center neo-card">
                    <ShoppingBag size={48} className="mx-auto mb-4" style={{color:'var(--neo-text-3)'}}/>
                    <h4 className="text-lg font-black" style={{color:'var(--neo-text-2)'}}>কোনো পণ্য পাওয়া যায়নি</h4>
                    <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{color:'var(--neo-text-3)'}}>ফিল্টার বা সার্চ পরিবর্তন করুন</p>
                  </div>
                ) : (
                  <>
                    {/* Shop header */}
                    {(() => {
                      const currentShop = allShops.find(s => s.shopName === activeShopFilter);
                      return currentShop ? (
                        <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{borderColor:'var(--neo-border)'}}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border" style={{background:'var(--neo-bg-dark)',borderColor:'var(--neo-border)'}}>
                              {currentShop.logoUrl ? (
                                <img src={currentShop.logoUrl} className="w-full h-full object-contain" alt=""/>
                              ) : (
                                <span className="font-black text-base" style={{color:'var(--neo-accent)'}}>{currentShop.shopName?.[0]}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-extrabold text-base tracking-tight" style={{color:'var(--neo-text)'}}>{currentShop.shopName}</p>
                              <p className="text-[10px] font-bold uppercase tracking-wider" style={{color:'var(--neo-text-3)'}}>{filteredProducts.length} products</p>
                            </div>
                          </div>
                          <Link href={`/shop/${currentShop.shopSlug}`}
                            className="neo-btn-primary px-4 py-2 rounded-xl text-xs font-black">
                            Visit Store
                          </Link>
                        </div>
                      ) : null;
                    })()}

                    {/* Product grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                      {paginatedProducts.map(product => {
                        const cartItem = cart.find(i => i.id === product.id);
                        const inCart = cartItem?.quantity > 0;
                        const hasCustomOptions = product.customOptions && product.customOptions.length > 0;
                        return (
                          <div key={product.id} className="neo-product-card">
                            <div
                              className="relative aspect-square overflow-hidden cursor-pointer border-b"
                              style={{background:'var(--neo-bg-dark)',borderColor:'var(--neo-border)'}}
                              onClick={() => { setSelectedProduct(product); setIsProductModalOpen(true); }}
                            >
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                              )}
                              {product.stock === 0 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white text-[10px] font-black px-2 py-1 bg-red-600 rounded-lg">Stock Out</span>
                                </div>
                              )}
                              {product.discountPercent > 0 && (
                                <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-black text-white bg-red-500 rounded-lg">-{product.discountPercent}%</span>
                              )}
                            </div>
                            <div className="p-3 flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[70%]" style={{color:'var(--neo-accent)'}}>{product.category || ''}</span>
                                <Link href={`/shop/${product.shopSlug}`}
                                  className="text-[9px] font-bold truncate max-w-[80px] hover:opacity-70 transition-colors"
                                  style={{color:'var(--neo-text-3)'}}
                                  onClick={e=>e.stopPropagation()}>
                                  {product.shopName}
                                </Link>
                              </div>
                              <h3
                                className="font-extrabold text-xs tracking-tight leading-tight line-clamp-2 min-h-[2rem] cursor-pointer hover:opacity-70 transition-colors"
                                style={{color:'var(--neo-text)'}}
                                onClick={() => { setSelectedProduct(product); setIsProductModalOpen(true); }}
                              >
                                {product.name}
                              </h3>
                              <div className="space-y-3 pt-2 border-t" style={{borderColor:'var(--neo-border)'}}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-[9px] font-bold block" style={{color:'var(--neo-text-3)'}}>মূল্য</span>
                                    <span className="font-black text-sm" style={{color:'var(--neo-text)'}}>৳{product.price}</span>
                                  </div>
                                  {product.wholesalePrice && (
                                    <div className="text-right">
                                      <span className="text-[9px] font-bold block" style={{color:'var(--neo-text-3)'}}>হোলসেল</span>
                                      <span className="font-black text-xs text-emerald-600">৳{product.wholesalePrice}</span>
                                    </div>
                                  )}
                                </div>
                                {product.stock === 0 ? (
                                  <div className="w-full py-2.5 rounded-2xl font-black text-[9px] bg-red-50 text-red-500 border border-red-200 flex items-center justify-center gap-1.5 cursor-not-allowed">
                                    <span>Stock Out</span>
                                  </div>
                                ) : inCart && !hasCustomOptions ? (
                                  <div className="neo-qty-ctrl">
                                    <button onClick={() => handleAddToCart({...product, quantity: -1})} className="neo-qty-btn">−</button>
                                    <span className="font-black text-xs" style={{color:'var(--neo-text)'}}>{cartItem.quantity}</span>
                                    <button onClick={() => handleAddToCart(product)} className="neo-qty-btn">+</button>
                                  </div>
                                ) : hasCustomOptions ? (
                                  <button
                                    onClick={() => { setSelectedProduct(product); setIsProductModalOpen(true); }}
                                    className="neo-btn w-full py-2.5 rounded-2xl font-black text-[9px] flex items-center justify-center gap-1.5"
                                    style={{color:'var(--neo-accent)'}}
                                  >
                                    <Sliders size={10} /> Customize
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAddToCart(product)}
                                    className="neo-btn-primary w-full py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
                                  >
                                    <ShoppingCart size={10} /> Add
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {Math.ceil(filteredProducts.length / itemsPerPage) > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-10 neo-card p-3 w-max mx-auto">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="neo-btn px-3 py-1.5 rounded-xl text-[10px] font-black uppercase disabled:opacity-30 disabled:pointer-events-none"
                        >
                          Prev
                        </button>
                        {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === Math.ceil(filteredProducts.length / itemsPerPage) || Math.abs(p - currentPage) <= 2)
                          .map((page, idx, arr) => {
                            const isActive = page === currentPage;
                            const showDots = idx > 0 && page - arr[idx - 1] > 1;
                            return (
                              <React.Fragment key={page}>
                                {showDots && <span className="text-xs font-bold" style={{color:'var(--neo-text-3)'}}>…</span>}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center cursor-pointer ${isActive?'neo-btn-primary':'neo-btn'}`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })}
                        <button
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), p + 1))}
                          disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                          className="neo-btn px-3 py-1.5 rounded-xl text-[10px] font-black uppercase disabled:opacity-30 disabled:pointer-events-none"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </section>

      {/* ── Promoted Shops Showcase / Registry ── */}
      {(globalConfig?.promotedLinks && globalConfig.promotedLinks.length > 0) && (
        <section id="showcase" className="relative z-10 py-16 overflow-hidden" style={{background:'var(--neo-bg-dark)',borderTop:'1px solid var(--neo-border)',borderBottom:'1px solid var(--neo-border)'}}>
          <div className="max-w-[96%] xl:max-w-[98%] mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
              <div className="text-left">
                <span className="inline-block px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-4" style={{background:'rgba(108,71,255,0.1)',color:'var(--neo-accent)'}}>Verified Registry</span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none" style={{color:'var(--neo-text)'}}>Elite Merchants</h2>
              </div>
              <p className="text-xs font-bold leading-relaxed max-w-sm" style={{color:'var(--neo-text-3)'}}>
                আমাদের ভেরিফাইড মার্চেন্ট পার্টনারদের সাথে পরিচিত হন। প্রতিটি স্টোর যাচাই করা এবং বিশ্বস্ত।
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalConfig.promotedLinks.map((link, idx) => (
                <a key={idx}
                  href={link.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-card group p-5 flex flex-col items-start gap-4 hover:-translate-y-1 transition-all no-underline"
                >
                  {link.logoUrl && (
                    <img src={link.logoUrl} className="h-10 w-auto object-contain" alt={link.name || ''} />
                  )}
                  <div>
                    <p className="font-extrabold text-sm tracking-tight mb-1" style={{color:'var(--neo-text)'}}>{link.name || 'Store'}</p>
                    <p className="text-xs font-bold leading-relaxed" style={{color:'var(--neo-text-3)'}}>{link.description || ''}</p>
                  </div>
                  <span className="mt-auto text-xs font-black flex items-center gap-1" style={{color:'var(--neo-accent)'}}>
                    Visit Store <ArrowRight size={12} />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Stores Drawer (Mobile) ── */}
      <div className={`fixed inset-0 z-[200] transition-all duration-300 ${isStoresMenuOpen ? 'visible' : 'invisible'}`}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsStoresMenuOpen(false)} />
        <div className={`neo-drawer absolute top-0 left-0 h-full w-72 flex flex-col transition-transform duration-300 ease-out ${isStoresMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 flex items-center justify-between" style={{borderBottom:'1px solid var(--neo-border)'}}>
            <h2 className="text-sm font-black flex items-center gap-2" style={{color:'var(--neo-text)'}}>
              <Store size={16} style={{color:'var(--neo-accent)'}}/> Stores
            </h2>
            <button onClick={() => setIsStoresMenuOpen(false)} className="neo-btn w-8 h-8 flex items-center justify-center" style={{color:'var(--neo-text-2)'}}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar" style={{background:'var(--neo-bg)'}}>
            <button
              onClick={() => { setActiveShopFilter('All'); setActiveCategory('All'); setActiveSubcategory(''); setIsStoresMenuOpen(false); }}
              className={`neo-sidebar-item w-full ${activeShopFilter==='All'?'active':''}`}
            >
              <ShoppingBag size={14}/> All Stores
              <span className="ml-auto text-[10px] font-bold opacity-60">{products.length}</span>
            </button>
            {allShops.filter(s=>s.shopSlug!=='daripallah-store'&&s.shopSlug!=='webmaa-store').map(shop => {
              const isShopActive = activeShopFilter === shop.shopName;
              const shopProdsCount = products.filter(p=>p.shopSlug===shop.shopSlug||p.shopName===shop.shopName).length;
              const drawerShopProds = products.filter(p=>p.shopSlug===shop.shopSlug||p.shopName===shop.shopName);
              const drawerCats = [...new Set(drawerShopProds.map(p=>p.category).filter(Boolean))];
              return (
                <div key={shop.id}>
                  <button
                    onClick={() => { setActiveShopFilter(shop.shopName); setActiveCategory('All'); setActiveSubcategory(''); setIsStoresMenuOpen(false); }}
                    className={`neo-sidebar-item w-full ${isShopActive?'active':''}`}
                  >
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} className="w-5 h-5 rounded-md object-contain bg-white border" style={{borderColor:'var(--neo-border)'}} alt=""/>
                    ) : (
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{background:'var(--neo-bg-dark)',color:'var(--neo-accent)'}}>{shop.shopName?.[0]}</div>
                    )}
                    <span className="truncate flex-1 text-left">{shop.shopName}</span>
                    <span className="text-[10px] font-bold opacity-50">{shopProdsCount}</span>
                  </button>
                  {isShopActive && drawerCats.length > 0 && (
                    <div className="pl-4 space-y-0.5 border-l-2 ml-5 mt-0.5" style={{borderColor:'var(--neo-accent)'}}>
                      <button onClick={()=>{setActiveCategory('All');setActiveSubcategory('');}}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold"
                        style={{color:activeCategory==='All'?'var(--neo-accent)':'var(--neo-text-3)'}}>
                        All Categories
                      </button>
                      {drawerCats.map(cat => {
                        const isCatActive = activeCategory === cat;
                        const catSubcats = [...new Set(drawerShopProds.filter(p=>p.category===cat).map(p=>p.subcategory).filter(Boolean))];
                        return (
                          <div key={cat}>
                            <button
                              onClick={()=>{setActiveCategory(cat);setActiveSubcategory('');}}
                              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-bold"
                              style={{color:isCatActive?'var(--neo-accent)':'var(--neo-text-3)'}}
                            >
                              <span>{cat}</span>
                            </button>
                            {isCatActive && catSubcats.length > 0 && (
                              <div className="pl-3 mt-0.5 space-y-0.5">
                                {catSubcats.map(sub => (
                                  <button key={sub}
                                    onClick={()=>setActiveSubcategory(sub)}
                                    className="w-full text-left px-2 py-1 rounded-md text-[10px] font-bold"
                                    style={{color:activeSubcategory===sub?'var(--neo-accent)':'var(--neo-text-3)'}}>
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
          <div className="p-4 border-t" style={{borderColor:'var(--neo-border)'}}>
            <Link href="/become-retailer" onClick={()=>setIsStoresMenuOpen(false)}
              className="neo-btn-primary w-full flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl">
              🤝 Become a Merchant
            </Link>
          </div>
        </div>
      </div>

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
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b-[4px] border-purple-600 shrink-0">
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

            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
              {[
                {id:'chat',label:'চ্যাট',icon:'💬'},
                {id:'voice',label:'ভয়েস',icon:'🎤'},
                {id:'image',label:'ছবি OCR',icon:'📷'},
                {id:'text',label:'লিস্ট',icon:'📝'},
              ].map(tab => (
                <button key={tab.id} onClick={() => setAiTab(tab.id)}
                  className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all ${aiTab === tab.id ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

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

            {/* Voice / OCR / Text List tabs */}
            {aiTab !== 'chat' && (
              <div className="flex-1 overflow-y-auto bg-slate-50">
                <AiVoicePanel 
                  shop={mainShopData || { id: 'daripallah-store' }} 
                  products={products}
                  onAddToCart={handleAddToCart}
                  onDirectOrder={handleAddToCart}
                  isOpen={true}
                  onClose={() => setIsAiOpen(false)}
                  activeTab={aiTab}
                />
              </div>
            )}
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
        href={mainShopData?.socialLinks?.wa ? getFormattedContactUrl(mainShopData.socialLinks.wa, 'whatsapp') : "https://wa.me/8801734763306"}
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
