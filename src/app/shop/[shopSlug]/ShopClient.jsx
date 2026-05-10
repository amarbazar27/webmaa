'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import useLocation from '@/lib/useLocation';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { 
  ShoppingBag, Search, X, Plus, Minus, Phone, MapPin, 
  CheckCircle, Package, ArrowRight, Loader2, ShoppingCart, Edit2,
  User, Download, LogOut, ArrowUpDown, Bot, MessageCircle, AlertCircle, Share, Settings,
  ChevronLeft, ChevronRight, Sparkles, Star, Flame, Gift, ExternalLink, Menu, Tag,
  Truck, ShieldCheck, Clock
} from 'lucide-react';
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
import AiShoppingList from '@/components/shop/AiShoppingList';
import AiVoicePanel from '@/components/shop/AiVoicePanel';
import ServiceBanner from '@/components/shop/ServiceBanner';
import NotificationBanner from '@/components/shop/NotificationBanner';

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
  const [shop] = useState(initialShop);
  const [products] = useState(initialProducts || []);
  const [categories] = useState(initialCategories || []);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');
  const { isOnline, isLiteMode, setLiteMode } = useNetworkStatus();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShowSplash(false), 1500); return () => clearTimeout(t); }, []);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(CART_KEY);
      if (local) {
        setCart(JSON.parse(local));
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
  const [pwaInstalled, setPwaInstalled] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '', note: '', txnId: '', paymentNumber: '', coordinates: null });
  const [pdfProgress, setPdfProgress] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [orderImage, setOrderImage] = useState(null);

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

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setPwaInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaInstalled(false);
      localStorage.removeItem('pwa_installed'); // Reset if uninstalled
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installed = localStorage.getItem('pwa_installed');
    if (!installed) setPwaInstalled(false);

    const onInstall = () => {
      setPwaInstalled(true);
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
    if (!shop.banners || shop.banners.length <= 1) return;
    const interval = parseInt(shop.bannerInterval) || 4;
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % shop.banners.length);
    }, interval * 1000);
    return () => clearInterval(timer);
  }, [shop.banners, shop.bannerInterval]);

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


  // ── AI Chat ────────────────────────────────────
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: 'bot', text: `আসসালামু আলাইকুম! আমি ${shop.aiConfig?.botName || 'Webmaa AI'}। ${shop.shopName}-এ আপনাকে স্বাগতম। কোনো প্রশ্ন থাকলে করুন!` }
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
          orderHistory: (userOrders || []).slice(0, 5).map(o => ({ id: o.id, orderIdVisual: o.orderIdVisual, total: o.total, items: (o.items || []).map(i => ({ name: i.name, quantity: i.quantity, price: i.price })) })),
          messages: [
            { role: 'system', content: `তুমি "${shop.shopName}"-এর AI বাজার সহকারী। নাম: ${shop.aiConfig?.botName || 'Bazar Bot'}।

পণ্য তালিকা (ID|নাম|দাম):
${products.map(p => `${p.id}|${p.name}|৳${p.price}/${p.unit || 'piece'}${p.stock === 0 ? '|[স্টক নেই]' : ''}`).join('\n')}

ডেলিভারি: ৳${shop.deliveryConfig?.advanceFee || 60} | পেমেন্ট: ${shop.deliveryConfig?.methods || 'বিকাশ/নগদ'}

নিয়ম:
1. বাজার লিস্ট suggest করলে শেষে লেখো: 🛒 [বাজার লিস্ট তৈরি]
2. তারপর এই ফরম্যাটে লেখো: PRODUCTS_JSON:[{"id":"PRODUCT_ID_HERE","qty":1}]
3. শুধু স্টক আছে এমন পণ্য দাও। টাকা/৳ = মূল্য।
4. বাংলায়, সংক্ষিপ্ত উত্তর।
5. কাস্টমারের অর্ডার ইতিহাস দেখে পার্সোনালাইজড value-for-money সাজেশন দাও।` },
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
          const product = products.find(p => p.id === item.id && p.stock !== 0);
          if (product && !addedIds.has(product.id)) {
            const qty = Math.max(1, parseInt(item.qty) || 1);
            if (!cart.find(i => i.id === product.id)) {
              setCart(prev => [...prev, { ...product, quantity: qty, note: '' }]);
              addedIds.add(product.id);
              added++;
            }
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
          if (!cart.find(i => i.id === product.id)) {
            setCart(prev => [...prev, { ...product, quantity: 1, note: '' }]);
            addedIds.add(product.id);
            added++;
          }
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
    // Category filter: if activeSubcategory is set, MUST match category too
    const catMatch = activeCategory === 'All' || activeCategory === 'সব' || p.category === activeCategory;
    // Subcategory filter: only show products of that exact subcategory
    const subMatch = !activeSubcategory || p.subcategory === activeSubcategory;
    // If subcategory is selected, also enforce category match (no 'All' bypass)
    const strictCatMatch = !activeSubcategory ? catMatch : p.category === activeCategory;
    const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return strictCatMatch && subMatch && searchMatch;
  });
  filteredProducts = filteredProducts.sort((a, b) => {
    if (sortOption === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
    if (sortOption === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
    if (sortOption === 'name_desc') return b.name.localeCompare(a.name, 'bn');
    if (sortOption === 'newest') return (b.createdAt ? new Date(b.createdAt) : 0) - (a.createdAt ? new Date(a.createdAt) : 0);
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
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
    });
  }, []);

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
      if (p && p.stock === 0) {
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

  const addToCart = (product) => {
    if (product.stock === 0) {
      toast.error('দুঃখিত, এই মুহূর্তে স্টকে নেই');
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(prev => prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      toast.success(`${product.name} পরিমাণ বাড়ানো হয়েছে`);
    } else {
      const newCart = [...cart, { ...product, quantity: 1, note: '' }];
      setCart(newCart);
      trackStoreEvent('add_to_cart', { id: product.id, name: product.name, price: product.price });
      toast.success(`${product.name} ঝুড়িতে যোগ হয়েছে!`);
    }
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
    const v = parseInt(qty);
    if (isNaN(v) || v < 1) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: v } : item));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const deliveryAdvanceFee = shop.deliveryConfig?.advanceFee ? parseInt(shop.deliveryConfig.advanceFee) : 60;
  const isCOD = shop.deliveryConfig?.isCOD !== false;
  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);
  const isAdvanceRequired = !isCOD || (shop.deliveryConfig?.advanceFee && shop.deliveryConfig.advanceFee !== '0');

  const { hasFreeDelivery } = getUserStreak(userOrders);
  const effectiveDelivery = hasFreeDelivery ? 0 : deliveryAdvanceFee;

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.error('কার্ট থেকে সরানো হয়েছে');
  };



    const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.coordinates) {
      toast.error('📍 অর্ডার করতে লোকেশন বাটনে ক্লিক করে আপনার ঠিকানা নিশ্চিত করুন।', { duration: 4000 });
      return;
    }
    if (shop.isStrictLocation && locationStatus !== 'available') {
      toast.error('দুঃখিত, আপনার লোকেশনে আমাদের ডেলিভারি সার্ভিস নেই।');
      return;
    }
    if (cart.length === 0 && !orderImage) return;
    trackStoreEvent('begin_checkout', { value: cart.length === 0 && orderImage ? 1 : cartTotal, currency: 'BDT', items: cart.map(i => i.name) });
    const requireLogin = shop.authSettings?.requireLoginBeforeOrder ?? true;
    if (requireLogin && !user) {
      toast.error('অর্ডার করতে অনুগ্রহ করে লগইন করুন।');
      setIsOrderOpen(false);
      setIsProfileOpen(true);
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
      localId: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      shopId: shop.id,
      customerName: orderForm.name,
      customerPhone: orderForm.phone,
      customerEmail: user?.email || '',
      customerAddress: orderForm.address,
      customerNote: orderForm.note,
      transactionId: orderForm.txnId,
      paymentNumber: orderForm.paymentNumber,
      items: cart.map(i => ({ 
        id: i.productId || i.id, 
        quantity: i.quantity, 
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
      setCart([]);
      localStorage.removeItem(CART_KEY);
      toast.success('অর্ডার প্লেস করা হয়েছে! 🎉');
      setOrderImage(null);
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
      router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/order/${orderId}`);
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
    el.style.cssText = 'position:fixed;left:-9999px;top:0;width:500px;padding:30px;background:white;font-family:Arial,sans-serif;color:black;';
    el.innerHTML = `
      <div style="text-align:center;border-bottom:2px solid black;padding-bottom:10px;margin-bottom:15px">
        <h1 style="font-size:20px;font-weight:900;margin:0">${orderData.shopName}</h1>
        <p style="font-size:8px;margin:2px 0 0;text-transform:uppercase;letter-spacing:1px">Order Receipt / অর্ডার রশিদ</p>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <div>
          <p style="font-size:8px;text-transform:uppercase;font-weight:700;margin:0">Order ID</p>
          <p style="font-size:14px;font-weight:900;margin:2px 0 0">#${orderData.orderIdVisual}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:8px;text-transform:uppercase;font-weight:700;margin:0">Date</p>
          <p style="font-size:12px;font-weight:700;margin:2px 0 0">${orderData.date}</p>
        </div>
      </div>
      <div style="border:1px solid black;padding:10px;margin-bottom:12px;font-size:11px">
        <p style="margin:0 0 4px;font-weight:900">${orderData.customerName} — ${orderData.customerPhone}</p>
        <p style="margin:0;line-height:1.4"><b>Addr:</b> ${orderData.customerAddress}</p>
        ${orderData.coordinates?.link ? `<p style="margin:4px 0 0;font-size:9px;color:#2563eb"><b>Map:</b> ${orderData.coordinates.link}</p>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
        <thead>
          <tr style="border-bottom:1px solid black;border-top:1px solid black">
            <th style="padding:6px 4px;text-align:left;font-size:10px">Item</th>
            <th style="padding:6px 4px;text-align:center;font-size:10px">Qty</th>
            <th style="padding:6px 4px;text-align:right;font-size:10px">Price</th>
          </tr>
        </thead>
        <tbody>
          ${orderData.items.map((item) => `
            <tr style="border-bottom:1px dashed #ccc">
              <td style="padding:6px 4px;font-size:11px;font-weight:700">${item.name}</td>
              <td style="padding:6px 4px;text-align:center;font-size:11px">${item.quantity}</td>
              <td style="padding:6px 4px;text-align:right;font-size:11px;font-weight:900">৳${(parseFloat(item.price)*item.quantity).toFixed(0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-left:auto;width:180px;font-size:11px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span>Subtotal</span>
          <span>৳${orderData.items.reduce((s,i)=>s+parseFloat(i.price)*i.quantity,0).toFixed(0)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span>Delivery</span>
          <span>৳${orderData.deliveryFee}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1.5px solid black;padding-top:6px;font-weight:900;font-size:14px">
          <span>Total</span>
          <span>৳${orderData.total}</span>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    document.body.removeChild(el);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
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

  // NOTE: We no longer block the storefront on authLoading.
  // Auth state resolves in background — shopping is always public.
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      {/* ── Splash Loading Screen (1.5s, with shop branding) ── */}
      {showSplash && <LoadingScreen visible={showSplash} shop={shop} products={products} minDuration={1500} />}
      <StoreAnalytics shop={shop} />
      {/* ── Category Drawer (Mobile) ── */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${isCategoryMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCategoryMenuOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isCategoryMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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

      {/* ── Service Area Banner ── */}
      <ServiceBanner 
         shop={shop} 
         status={locationStatus} 
         setStatus={setLocationStatus}
         manualInput={locationManualInput}
         setManualInput={setLocationManualInput}
         detectedLocation={detectedLocation}
         setDetectedLocation={setDetectedLocation}
      />



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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          {/* Logo/Brand (Left Side) */}
          <div className="flex items-center gap-3">
            <button className="hidden">
              <Menu size={20} strokeWidth={2.5} />
            </button>
            {/* Static logo - no href to prevent 'No store found' navigation */}
            <div className="flex items-center gap-2 select-none cursor-default">
              {shop.logoUrl ? (
                <img loading="lazy" src={shop.logoUrl} className="w-9 h-9 rounded-xl object-contain border border-slate-100" alt={shop.shopName} />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                  {shop.shopName?.[0] || 'S'}
                </div>
              )}
              <span className="font-black text-slate-900 text-[17px] leading-tight">{shop.shopName || 'Shop'}</span>
            </div>
          </div>

          {/* Actions (Left side of the brand) */}
          <div className="flex items-center gap-2 md:gap-4">
            {((userData?.role === 'staff' && userData?.accessShopId === shop.id) || (userData?.role === 'retailer' && user?.uid === shop.ownerId) || userData?.role === 'superadmin') && (
              <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-lg">
                <Settings size={15} /> <span>প্যানেলে যান</span>
              </button>
            )}

            {/* App Download */}
            {!pwaInstalled && (
              <button onClick={handleAppDownload} className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors shadow-sm">
                <Download size={15} /> <span>অ্যাপ</span>
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggleButton size="sm" />

            {/* Profile */}
            <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 md:w-11 md:h-11 aspect-square bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl transition-colors shadow-sm border border-purple-200 overflow-hidden flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} className="w-full h-full object-cover aspect-square" alt="Profile" />
              ) : (
                <User size={20} className="font-bold" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Banner/Carousel Section (20% height) ── */}
      <div className="relative h-[22vh] md:h-[32vh] w-full bg-slate-900 overflow-hidden border-b border-slate-200 group/banner">
        {shop.banners && shop.banners.length > 0 ? (
          <div className="relative w-full h-full">
            {shop.banners.map((img, i) => (
              <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === activeBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <img src={img} loading={i === 0 ? "eager" : "lazy"} alt={`Banner ${i+1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ))}
            {shop.banners.length > 1 && (
              <>
                <button onClick={() => setActiveBanner(prev => (prev === 0 ? shop.banners.length - 1 : prev - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all opacity-0 group-hover/banner:opacity-100">
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>
                <button onClick={() => setActiveBanner(prev => (prev === shop.banners.length - 1 ? 0 : prev + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all opacity-0 group-hover/banner:opacity-100">
                  <ChevronRight size={24} strokeWidth={3} />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {shop.banners.map((_, i) => (
                    <button key={i} onClick={() => setActiveBanner(i)} className={`h-2 rounded-full transition-all ${i === activeBanner ? 'bg-white w-6' : 'bg-white/40 w-2 hover:bg-white/60'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-800 via-purple-600 to-blue-700 flex items-center justify-center p-6 text-center shadow-inner relative">
            {shop.coverImg && <img loading="eager" src={shop.coverImg} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />}
            <h2 className="relative z-10 text-3xl md:text-5xl font-black text-white drop-shadow-xl tracking-tight">{shop.welcomeMessage || 'স্বাগতম আমাদের স্টোরে!'}</h2>
          </div>
        )}
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 md:space-y-8">
        
        {/* ── AI Shopping List Upload ── */}
        

        {/* ── Search, Sort & Categories ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <div className="relative shrink-0 w-44 sm:w-52">
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
            </select>
          </div>

          <div className="w-[1px] h-8 bg-slate-200 shrink-0 mx-1 hidden md:block" />

          {/* Hidden on mobile, visible on md+ */}
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto scrollbar-hide w-full pb-2 md:pb-0">
            <button
              onClick={() => { setActiveCategory('All'); setActiveSubcategory(''); }}
              className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-200 border ${activeCategory === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
            >সব</button>
            {categories.map(c => (
              <button key={c.id} onClick={() => { setActiveCategory(c.name); setActiveSubcategory(''); }} className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-200 border ${activeCategory === c.name ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

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

        {/* ── Product Grid ── */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-300">
            <Package size={64} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
            <h3 className="text-2xl font-black text-slate-800">কোনো পণ্য পাওয়া যায়নি। 🥺</h3>
            <p className="text-slate-500 text-sm mt-3 font-semibold">অন্য ক্যাটাগরিতে খুঁজে দেখুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {filteredProducts.map((product, index) => {
              const cartItem = cart.find(i => i.id === product.id);
              return (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-slate-200 flex flex-col">
                  {/* Image — clickable to detail page */}
                  <div 
                    className="relative h-44 sm:h-52 overflow-hidden bg-white border-b border-slate-100 cursor-pointer" 
                    onClick={() => {
                      trackStoreEvent('select_content', { content_type: 'product', item_id: product.id, name: product.name });
                      router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/product/${product.id}`);
                    }}
                  >
                    {product.imageUrl ? (
                      <Image 
                        src={product.imageUrl} 
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
                    <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md text-slate-900 px-2.5 py-1 rounded-xl text-sm font-black shadow-lg border border-slate-100/50">
                      ৳{product.price}
                    </div>
                    {product.allowCustomize && (
                      <div className="absolute top-2.5 left-2.5 bg-purple-600/90 text-white px-2 py-1 rounded-lg text-[10px] font-black backdrop-blur-sm flex items-center gap-1">
                        <Sparkles size={10} /> কাস্টম
                      </div>
                    )}
                  </div>

                  {/* Info + Actions */}
                  <div className="p-3.5 sm:p-4 flex flex-col flex-1 bg-white">
                    <h3 className="font-extrabold text-slate-900 text-[14px] leading-tight group-hover:text-purple-700 transition-colors line-clamp-2 mb-3">{product.name}</h3>

                    {/* Cart Controls */}
                    <div className="mt-auto space-y-2">
                      {product.stock === 0 ? (
                        <div className="w-full py-2.5 rounded-xl font-black text-sm bg-red-50 text-red-500 border border-red-200 flex flex-col items-center justify-center gap-1 cursor-not-allowed">
                          <div className="flex items-center gap-1.5"><span className="text-base">🚫</span> স্টক আউট</div>
                          <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Frozen — অর্ডার বন্ধ</span>
                        </div>
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
                          onClick={() => router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/product/${product.id}?customize=true`)}
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
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
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                <span className="text-xs text-slate-500 font-bold ml-1">বিশ্বস্ত সেবা</span>
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
                {shop.deliveryConfig?.contactEmail && (
                  <div className="flex items-center gap-2 text-slate-400 group">
                    <Bot size={14} className="group-hover:text-purple-400" />
                    <span className="text-sm font-bold group-hover:text-slate-200 transition-colors">{shop.deliveryConfig.contactEmail}</span>
                  </div>
                )}
                {shop.deliveryConfig?.contactWhatsapp && (
                  <div className="flex items-center gap-2 text-slate-400 group">
                    <Phone size={14} className="group-hover:text-emerald-400" />
                    <span className="text-sm font-bold group-hover:text-slate-200 transition-colors">{shop.deliveryConfig.contactWhatsapp}</span>
                  </div>
                )}
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
            <p className="text-slate-600 text-xs font-black uppercase tracking-[0.25em]">
              © {new Date().getFullYear()} {shop.shopName} — সর্বস্বত্ত্ব সংরক্ষিত।
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-600">Powered by Webmaa</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Floating Buttons (Right Bottom - Updated) ── */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
        
        {/* AI Floating Companion (Stacked Above Cart) */}
        <div className="relative group flex flex-col items-end gap-3">
          <button onClick={() => setIsAiOpen(true)} className="w-[60px] h-[60px] bg-white rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.1)] flex items-center justify-center hover:scale-110 transition-transform relative group border-2 border-purple-100">
            <CuteAIIcon />
          </button>
          <div className="bg-slate-900 px-5 py-3 rounded-2xl rounded-br-none shadow-2xl border border-slate-700 text-sm font-black text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-2 absolute right-[75px] bottom-0 pointer-events-none">
            প্রশ্ন করুন! ✨
          </div>
        </div>

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

        {/* Messenger Button */}
        <MessengerButton shop={shop} />
      </div>

      {/* ── Mobile Bottom Nav Bar (hamburger + cart) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-200 shadow-xl flex items-center justify-around px-4 py-3 safe-bottom">
        <button onClick={() => setIsCategoryMenuOpen(true)} className="flex flex-col items-center gap-1 text-slate-600 hover:text-purple-700 transition-colors">
          <Menu size={22} strokeWidth={2} />
          <span className="text-[10px] font-black uppercase tracking-wide">মেনু</span>
        </button>
        <button onClick={() => setIsAiOpen(true)} className="flex flex-col items-center gap-1 text-slate-600 hover:text-purple-700 transition-colors">
          <svg width="22" height="22" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#a855f7" /><circle cx="35" cy="45" r="5" fill="white" /><circle cx="65" cy="45" r="5" fill="white" /><path d="M40,65 Q50,72 60,65" stroke="white" strokeWidth="3" strokeLinecap="round" /></svg>
          <span className="text-[10px] font-black uppercase tracking-wide">এআই</span>
        </button>
        <button onClick={() => setIsCartOpen(true)} className="relative flex flex-col items-center gap-1 text-slate-600 hover:text-purple-700 transition-colors">
          <ShoppingCart size={22} strokeWidth={2} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">{cartCount}</span>
          )}
          <span className="text-[10px] font-black uppercase tracking-wide">কার্ট</span>
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
                {id:'voice',label:'ভয়েস',icon:'🎤', always: true},
                {id:'image',label:'ছবি OCR',icon:'📷', show: shop.aiConfig?.enableAiShoppingList !== false},
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
              <div className="absolute top-[68px] right-4 z-10">
                <button onClick={() => setShowAiSuggestionModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors">
                  <Sparkles size={12}/> স্মার্ট সাজেশন
                </button>
              </div>
              <div className="flex-1 p-4 bg-slate-50 flex flex-col gap-3 overflow-y-auto relative pt-12">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`max-w-[90%] flex flex-col gap-2 ${msg.role === 'bot' ? 'self-start' : 'self-end'}`}>
                    <div className={`p-3.5 rounded-2xl text-sm font-bold shadow-sm leading-relaxed ${msg.role === 'bot' ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-purple-600 text-white rounded-tr-none'}`}>
                      {msg.text}
                    </div>
                    {msg.hasSuggestions && (
                      <button onClick={() => addAllSuggestedToCart(msg.text)}
                        className="self-start flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-colors">
                        <ShoppingCart size={14} /> সব কার্টে যোগ করুন
                      </button>
                    )}
                  </div>
                ))}
                {isAiTyping && <div className="max-w-[85%] p-3.5 rounded-2xl bg-white border border-slate-200 self-start flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div>}
              </div>
              <div className="p-3.5 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                <button onClick={() => setChatMessages([{ id: 1, role: 'bot', text: 'নতুন চ্যাট শুরু হলো!' }])} className="px-2 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 text-[10px] font-black transition-colors" title="Clear">🗑</button>
                <input type="text" placeholder="ম্যাসেজ লিখুন..." className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-colors placeholder:text-slate-400" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage(chatInput)} />
                <button onClick={() => sendChatMessage(chatInput)} className="bg-slate-900 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors shadow-md"><MessageCircle size={20} strokeWidth={2.5}/></button>
              </div>
              
              {showAiSuggestionModal && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 rounded-2xl">
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
                        sendChatMessage(`আমাদের মেসের বর্ডার ${suggestionForm.members || 1} জন। বাজারের বাজেট ${suggestionForm.budget || 500} টাকা। এই বাজেটে সেরা ভ্যালু ফর মানি এবং টপ সেল বাজার লিস্ট তৈরি করো।`);
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
            {aiTab !== 'chat' && (
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
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all"><X size={20} strokeWidth={2.5} /></button>
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
                    <p className="font-black text-purple-700 text-sm mt-0.5">৳{(parseFloat(item.price) * item.quantity).toLocaleString()}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100"><Minus size={12} strokeWidth={2.5}/></button>
                      <input type="number" min="1" value={item.quantity} onChange={e => setQuantityDirect(item.id, e.target.value)} className="w-10 text-center text-sm font-black text-slate-900 bg-slate-50 border border-slate-200 rounded outline-none focus:border-purple-500" />
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 bg-slate-900 text-white rounded flex items-center justify-center hover:bg-purple-600"><Plus size={12} strokeWidth={2.5}/></button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                      <button onClick={() => { trackStoreEvent('select_content', { content_type: 'product', item_id: item.productId, name: item.name }); router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/product/${item.productId || item.id}`); setIsCartOpen(false); }} className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors p-2 rounded-lg" title="Edit/Customize"><Edit2 size={16} strokeWidth={2.5} /></button>
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
                      toast.error('অর্ডার করতে অনুগ্রহ করে লগইন করুন।');
                      if (typeof sessionStorage !== 'undefined') {
                        sessionStorage.setItem('returnToCheckout', 'true');
                      }
                      setIsCartOpen(false);
                      setIsProfileOpen(true);
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
                      onClick={handleGetLocation} 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 border-2 ${orderForm.coordinates ? 'bg-emerald-500 border-emerald-200 text-white' : 'bg-red-500 border-red-200 text-white animate-pulse'}`}
                      title="আমার বর্তমান লোকেশন দিন"
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

              {isAdvanceRequired && (
                <div className="bg-purple-50 p-5 rounded-2xl border-2 border-purple-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-purple-700 mt-0.5 shrink-0" strokeWidth={2.5} />
                    <p className="text-sm font-bold text-purple-900 leading-snug">
                      {isCOD ? <>অর্ডার নিশ্চিত করতে ডেলিভারি চার্জ বাবদ <span className="font-black text-lg text-purple-700">৳{effectiveDelivery === 0 ? 'FREE' : effectiveDelivery}</span> অগ্রিম প্রদান করুন।</> : <>সর্বমোট <span className="font-black text-lg text-purple-700">৳{cartTotal + effectiveDelivery}</span> পেমেন্ট করুন।</>}
                    </p>
                  </div>
                  {effectiveDelivery > 0 && (
                    <>
                      <div className="bg-white px-3 py-2 rounded-xl border border-purple-100 shadow-sm">
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-1">পেমেন্ট নাম্বার</p>
                        <p className="text-sm font-black text-purple-700">{shop.deliveryConfig?.methods}</p>
                      </div>
                      
                      <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">পেমেন্ট নাম্বার (যে নাম্বার থেকে টাকা পাঠিয়েছেন) *</label>
                          <input required type="tel" maxLength={11} placeholder="01XXXXXXXXX" className="w-full p-3.5 rounded-xl bg-white border-2 border-purple-300 text-sm font-black text-slate-900 outline-none focus:border-purple-600 shadow-sm" value={orderForm.paymentNumber} onChange={e => setOrderForm(f => ({ ...f, paymentNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">ট্রানজেকশন আইডি (TxnID) *</label>
                          <input required type="text" placeholder="বিকাশ/নগদ/রকেট TxnID" className="w-full p-3.5 rounded-xl bg-white border-2 border-purple-300 text-sm font-black text-slate-900 outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/20 shadow-sm" value={orderForm.txnId} onChange={e => setOrderForm(f => ({ ...f, txnId: e.target.value }))} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-slate-100 border-2 border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm text-slate-600 font-bold"><span>প্রোডাক্টস (×{cartCount || (orderImage ? 'ছবি থেকে' : 0)})</span><span className="text-slate-900 font-black">৳{cart.length === 0 && orderImage ? 1 : cartTotal}</span></div>
                <div className="flex justify-between text-sm text-slate-600 font-bold">
                  <span>ডেলিভারি চার্জ</span>
                  <span className={`font-black ${effectiveDelivery === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{effectiveDelivery === 0 ? 'FREE 🎁' : `৳${effectiveDelivery}`}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200 font-black text-slate-900 text-xl">
                  <span>সর্বমোট</span>
                  <span className="text-purple-700 text-2xl">৳{(cart.length === 0 && orderImage ? 1 : cartTotal) + effectiveDelivery}</span>
                </div>
              </div>

              <button disabled={placing} type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-xl disabled:opacity-50 mt-4">
                {placing ? <><Loader2 className="animate-spin" size={20} /> প্রসেস হচ্ছে...</> : <><CheckCircle size={20} strokeWidth={2.5}/> অর্ডার প্লেস করুন</>}
              </button>
            </form>
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
                  
                  {shop.authSettings?.googleAuth !== false ? (
                    <button onClick={handleGoogleLogin} className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center gap-3 font-black text-slate-800 hover:bg-slate-50 transition-all shadow-sm">
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt=""/>
                      গুগল দিয়ে লগইন
                    </button>
                  ) : (
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
                        className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-purple-300 transition-colors cursor-pointer group"
                        onClick={() => { setIsProfileOpen(false); router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/order/${order.id}`); }}
                      >
                        <div className="p-4 bg-slate-50">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-1 rounded-md border border-purple-200">#{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</span>
                            <span className={`text-[11px] font-black px-2 py-1 rounded-md border ${order.status === 'completed' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : order.status === 'cancelled' ? 'text-red-700 bg-red-100 border-red-200' : 'text-amber-700 bg-amber-100 border-amber-200'}`}>{order.status || 'Pending'}</span>
                          </div>
                          <p className="font-extrabold text-slate-900 text-base">{order.items?.length || 0} Items <span className="text-purple-600">(৳{order.total?.toLocaleString()})</span></p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB') : ''}</p>
                        </div>
                        <div className="bg-slate-900 text-white text-center py-2 text-xs font-black group-hover:bg-purple-600 transition-colors">
                          বিস্তারিত ও PDF ডাউনলোড →
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
