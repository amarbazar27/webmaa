'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bot, X, Send, BarChart2, Package, Lightbulb, Loader2, 
  Maximize2, Minimize2, Trash2, Sparkles, TrendingUp, AlertTriangle, 
  ShoppingBag, CheckCircle2, Circle, ArrowRight, Copy, Check, History, Plus,
  MessageSquare, ChevronLeft, ChevronRight, User, ExternalLink, HelpCircle,
  Truck, CreditCard, Palette, Globe, Bell, ChevronDown, ChevronUp, ArrowUpRight
} from 'lucide-react';
import { getProducts, getOrders, getShop, updateShop } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const DEMO_PROMPTS = [
  { id: 1, label: '🚀 স্টোর সেটআপ কীভাবে করব?', text: 'আমার স্টোরটি চালু করার জন্য প্রধান প্রধান কী কী কাজ বাকি আছে এবং কীভাবে করব?' },
  { id: 2, label: '🚚 ডেলিভারি ও কুরিয়ার সেটআপ', text: 'স্টেডফাস্ট কুরিয়ার এপিআই এবং হোম ডেলিভারি চার্জ কীভাবে সেট করব?' },
  { id: 3, label: '📦 পণ্য ও ক্যাটাগরি তৈরি', text: 'আমার স্টোরে নতুন পণ্য ও ক্যাটাগরি কীভাবে সহজে যুক্ত করব?' },
  { id: 4, label: '💳 বিকাশ ও ক্যাশ অন ডেলিভারি', text: 'গ্রাহকদের কাছ থেকে পেমেন্ট নেওয়ার জন্য বিকাশ ও COD কীভাবে অন করব?' },
  { id: 5, label: '📈 সেলস ও রেভিনিউ রিপোর্ট', text: 'আমার স্টোরের বর্তমান সেলস, রেভিনিউ এবং অর্ডারের সম্পূর্ণ এনালাইসিস দাও।' },
  { id: 6, label: '⚠️ লো স্টক প্রোডাক্টের তালিকা', text: 'কোন কোন পণ্যের স্টক ফুরিয়ে যাচ্ছে বা শেষ হতে চলেছে তাদের তালিকা দাও।' },
  { id: 7, label: '🤖 ফেসবুক ও মেসেঞ্জার বট', text: 'ফেসবুক পেজ কানেক্ট করে এআই অটো-কমেন্ট ও মেসেঞ্জার বট কীভাবে চালু করব?' },
  { id: 8, label: '💡 সেলস বৃদ্ধির ৩টি আইডিয়া', text: 'আমার স্টোরের প্রোডাক্টগুলোর ওপর ভিত্তি করে সেলস দ্বিগুণ করার ৩টি বাস্তবধর্মী আইডিয়া দাও।' },
];

export default function AiCompanion({ shop: propShop, isMobile, compact = false }) {
  const { user, userData, activeShopId } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  
  // Sessions Management
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  // Real-time Store Analytics Context
  const [storeContext, setStoreContext] = useState({
    products: [],
    orders: [],
    shopDetails: null,
    totalRevenue: 0,
    pendingOrdersCount: 0,
    completedOrdersCount: 0,
    lowStockProducts: [],
    topProducts: []
  });

  const scrollRef = useRef(null);

  // Fetch full live store analytics context
  const refreshStoreContext = useCallback(async () => {
    const targetShopId = activeShopId || propShop?.id || userData?.activeShopId;
    if (!targetShopId) return;
    try {
      const [prods, ords, shp] = await Promise.all([
        getProducts(targetShopId),
        getOrders(targetShopId),
        getShop(targetShopId)
      ]);

      const rev = (ords || []).reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
      const pending = (ords || []).filter(o => o.status === 'pending').length;
      const completed = (ords || []).filter(o => o.status === 'completed').length;
      const lowStock = (prods || []).filter(p => (parseInt(p.stock, 10) || 0) <= 5);

      setStoreContext({
        products: prods || [],
        orders: ords || [],
        shopDetails: shp || propShop,
        totalRevenue: rev,
        pendingOrdersCount: pending,
        completedOrdersCount: completed,
        lowStockProducts: lowStock,
        topProducts: (prods || []).slice(0, 10)
      });
    } catch (err) {
      console.error('Error loading AI store context:', err);
    }
  }, [activeShopId, propShop, userData?.activeShopId]);

  useEffect(() => {
    refreshStoreContext();
  }, [refreshStoreContext]);

  useEffect(() => {
    if (isOpen) {
      refreshStoreContext();
    }
  }, [isOpen, refreshStoreContext]);

  // Compute Store Setup Progress and Interactive Checklist
  const setupProgress = useMemo(() => {
    const shp = storeContext.shopDetails || propShop || {};
    const prods = storeContext.products || [];
    
    // Core Functions
    const hasName = Boolean(shp.shopName && shp.shopName.trim());
    const hasPhone = Boolean(shp.phone || shp.contactPhone || shp.ownerPhone);
    const hasLogo = Boolean(shp.logoUrl);
    const profileDone = hasName && hasPhone;

    const hasProduct = prods.length > 0;
    const hasCategories = prods.some(p => p.category && p.category !== 'সাধারণ') || Boolean(shp.categories && shp.categories.length > 0);
    const catalogDone = hasProduct;

    const hasDelivery = Boolean(shp.deliveryCharge || shp.deliveryConfig?.insideDhaka || shp.deliveryConfig?.outsideDhaka);
    const hasCourier = Boolean(shp.steadfastApiKey || shp.courierConfig?.apiKey);
    const deliveryDone = hasDelivery || hasCourier;

    const hasPayment = shp.paymentConfig?.cod !== false || Boolean(shp.paymentConfig?.bkashNumber || shp.bkashNumber || shp.nagadNumber);
    const paymentDone = hasPayment;

    const hasBanner = Boolean((shp.banners && shp.banners.length > 0) || shp.themeColor);
    const designDone = hasBanner;

    // Advanced / Optional Functions
    const socialDone = Boolean(shp.facebookPageId || shp.facebookAccessToken);
    const domainDone = Boolean(shp.customDomain && shp.domainStatus === 'active');
    const broadcastDone = false; // Optional

    let score = 0;
    if (profileDone) score += 20;
    if (catalogDone) score += 30;
    if (deliveryDone) score += 25;
    if (paymentDone) score += 15;
    if (designDone) score += 10;

    const percent = Math.min(100, Math.max(10, score));

    return {
      percent,
      mainTasks: [
        { id: 'catalog', title: 'পণ্য ও ইনভেন্টরি যোগ করা', desc: 'কমপক্ষে ১টি পণ্য ও ক্যাটাগরি তৈরি করুন', done: catalogDone, link: '/dashboard/products' },
        { id: 'delivery', title: 'ডেলিভারি ও কুরিয়ার (Steadfast)', desc: 'ডেলিভারি চার্জ ও Steadfast API সেট করুন', done: deliveryDone, link: '/dashboard/settings' },
        { id: 'payment', title: 'পেমেন্ট মেথড (bKash/Nagad/COD)', desc: 'ক্যাশ অন ডেলিভারি ও মোবাইল ব্যাংকিং অন করুন', done: paymentDone, link: '/dashboard/settings' },
        { id: 'profile', title: 'স্টোর তথ্য ও লোগো', desc: 'স্টোরের নাম, হেল্পলাইন ফোন ও লোগো আপলোড করুন', done: profileDone, link: '/dashboard/settings' },
        { id: 'design', title: 'স্টোর থিম ও ব্যানার ডিজাইন', desc: 'আকর্ষণীয় হোমপেজ স্লাইডার ব্যানার সেট করুন', done: designDone, link: '/dashboard/templates' },
      ],
      optionalTasks: [
        { id: 'social', title: 'ফেসবুক ও মেসেঞ্জার এআই বট', desc: 'কমেন্ট অটো-রিপ্লাই ও অটো সেলস বট কানেক্ট করুন', done: socialDone, link: '/dashboard/social' },
        { id: 'domain', title: 'কাস্টম নিজস্ব ডোমেইন কানেক্ট', desc: 'আপনার নিজস্ব .com ডোমেইন ফ্রিতে যুক্ত করুন', done: domainDone, link: '/dashboard/domain' },
        { id: 'broadcast', title: 'পুশ নোটিফিকেশন ব্রডকাস্ট', desc: 'গ্রাহকদের মোবাইলে ফ্রি অফার নোটিফিকেশন পাঠান', done: broadcastDone, link: '/dashboard/broadcast' },
      ]
    };
  }, [storeContext, propShop]);

  // Load Sessions list from localStorage & Welcome Message
  useEffect(() => {
    const targetShopId = activeShopId || propShop?.id || userData?.activeShopId;
    if (!targetShopId) return;
    const storageKey = `bd_ai_sessions_${targetShopId}`;
    try {
      const savedSessions = localStorage.getItem(storageKey);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages || []);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not parse saved sessions:', e);
    }

    // Personalized Welcome message
    const merchantName = userData?.name || user?.displayName || 'রিটেইলার';
    const storeName = storeContext.shopDetails?.shopName || propShop?.shopName || 'আপনার অনলাইন স্টোর';
    const initSessionId = 'session_' + Date.now();
    const initialMsgs = [
      {
        id: 'welcome_' + Date.now(),
        role: 'bot',
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        text: `আসসালামু আলাইকুম **${merchantName}** ভাইয়া/আপু! 🎉\n\nআপনার স্টোর **${storeName}** এর পার্সোনাল **AI Helper ও বিজনেস সহকারী**-তে আপনাকে স্বাগতম!\n\nবর্তমানে আপনার স্টোর সেটআপ **${setupProgress.percent}% সম্পন্ন**।\n\n🎯 **প্রধান যেসব কাজ বাকি থাকতে পারে:**\n• পণ্য ও ক্যাটাগরি আপলোড করা\n• ডেলিভারি চার্জ ও Steadfast কুরিয়ার সেটআপ\n• বিকাশ/নগদ ও ক্যাশ অন ডেলিভারি অন করা\n• হোমপেজ ব্যানার সেট করা\n\nযেকোনো কাজ কীভাবে করতে হবে জানতে নিচে ক্লিক করুন অথবা যেকোনো প্রশ্ন লিখুন, আমি নিজে আপনাকে ধাপে ধাপে বুঝিয়ে দিচ্ছি! 🚀`
      }
    ];

    const newSession = {
      id: initSessionId,
      title: 'নতুন কথোপকথন',
      createdAt: new Date().toISOString(),
      messages: initialMsgs
    };

    setSessions([newSession]);
    setCurrentSessionId(initSessionId);
    setMessages(initialMsgs);
  }, [activeShopId, propShop?.id, propShop?.shopName, userData?.activeShopId, userData?.name, user?.displayName, storeContext.shopDetails?.shopName, setupProgress.percent]);

  // Persist Current Session to localStorage
  useEffect(() => {
    const targetShopId = activeShopId || propShop?.id || userData?.activeShopId;
    if (!targetShopId || !currentSessionId || messages.length === 0) return;
    const storageKey = `bd_ai_sessions_${targetShopId}`;
    try {
      setSessions(prevSessions => {
        const updated = prevSessions.map(s => {
          if (s.id === currentSessionId) {
            const firstUserMsg = messages.find(m => m.role === 'user');
            const title = firstUserMsg ? firstUserMsg.text.slice(0, 30) + '...' : s.title;
            return { ...s, title, messages };
          }
          return s;
        });

        const exists = updated.some(s => s.id === currentSessionId);
        const finalSessions = exists ? updated : [{
          id: currentSessionId,
          title: 'নতুন কথোপকথন',
          createdAt: new Date().toISOString(),
          messages
        }, ...updated];

        localStorage.setItem(storageKey, JSON.stringify(finalSessions.slice(0, 20)));
        return finalSessions;
      });
    } catch (e) {
      console.warn('Could not save sessions:', e);
    }
  }, [messages, currentSessionId, activeShopId, propShop?.id, userData?.activeShopId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Start New Chat Session
  const handleStartNewChat = () => {
    const merchantName = userData?.name || user?.displayName || 'রিটেইলার';
    const storeName = storeContext.shopDetails?.shopName || propShop?.shopName || 'আপনার অনলাইন স্টোর';
    const newId = 'session_' + Date.now();
    const initialMsgs = [
      {
        id: 'welcome_' + Date.now(),
        role: 'bot',
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        text: `আসসালামু আলাইকুম **${merchantName}**! আমি আপনার **AI Helper**। স্টোর সেটআপ, সেলস বৃদ্ধি বা যেকোনো প্রয়োজনে প্রশ্ন করুন, আমি সাহায্য করছি। 📊`
      }
    ];

    const newSession = {
      id: newId,
      title: 'নতুন কথোপকথন',
      createdAt: new Date().toISOString(),
      messages: initialMsgs
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setMessages(initialMsgs);
    setShowHistoryDrawer(false);
    toast.success('নতুন চ্যাট সেশন শুরু হয়েছে! ✨');
  };

  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setShowHistoryDrawer(false);
  };

  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    const targetShopId = activeShopId || propShop?.id || userData?.activeShopId;
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    if (targetShopId) {
      localStorage.setItem(`bd_ai_sessions_${targetShopId}`, JSON.stringify(updated));
    }
    if (currentSessionId === sessionId) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
        setMessages(updated[0].messages || []);
      } else {
        handleStartNewChat();
      }
    }
    toast.success('চ্যাট সেশন মুছে ফেলা হয়েছে');
  };

  const handleCopyMessage = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('কপি হয়েছে! 📋');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (customPrompt) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isTyping) return;

    const userMsg = { 
      id: Date.now(), 
      role: 'user', 
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setIsTyping(true);

    try {
      const shopName = storeContext.shopDetails?.shopName || propShop?.shopName || 'আমার অনলাইন স্টোর';
      const targetShopId = activeShopId || propShop?.id || userData?.activeShopId;
      
      const productSummary = storeContext.products.map(p => 
        `- ${p.name}: মূল্য ৳${p.price}, স্টক: ${p.stock} টি, ক্যাটাগরি: ${p.category || 'N/A'}`
      ).slice(0, 30).join('\n');

      const lowStockList = storeContext.lowStockProducts.map(p => 
        `- ${p.name} (স্টক মাত্র ${p.stock} টি)`
      ).join('\n');

      const systemPrompt = `You are an expert eCommerce Store Helper & Growth Consultant named "AI Helper" for the retail brand "${shopName}" in Bangladesh.

YOUR CORE RESPONSIBILITIES:
1. Always speak respectfully in polite Bengali (use "আপনি", "ভাইয়া/আপু").
2. Answer step-by-step how to configure and run the store:
   - Adding products & categories (/dashboard/products)
   - Configuring delivery charges & Steadfast Courier API (/dashboard/settings)
   - Configuring bKash/Nagad & Cash on Delivery (/dashboard/settings)
   - Setting up Homepage themes & banners (/dashboard/templates)
   - Connecting Facebook Page & Messenger AI Bot (/dashboard/social)
   - Connecting Custom Domain (/dashboard/domain)
   - Sending Push Notifications (/dashboard/broadcast)
3. Provide live data insights:
   • Store Name: ${shopName}
   • Setup Progress: ${setupProgress.percent}%
   • Products in Catalog: ${storeContext.products.length}
   • Orders: ${storeContext.orders.length} (Pending: ${storeContext.pendingOrdersCount}, Completed: ${storeContext.completedOrdersCount})
   • Total Gross Revenue: ৳${storeContext.totalRevenue.toLocaleString()}
   • Low Stock: ${storeContext.lowStockProducts.length} items
   ${lowStockList ? `Low Stock List:\n${lowStockList}` : ''}
   ${productSummary ? `Product Catalog Snapshot:\n${productSummary}` : 'No products uploaded yet.'}
4. When guiding the merchant, provide direct clickable dashboard links or action buttons in Markdown format (e.g. [পণ্য পেজে যান](/dashboard/products), [ডেলিভারি সেটিংস](/dashboard/settings), [থিম ও ব্যানার](/dashboard/templates), [ফেসবুক অটোমেশন](/dashboard/social)).
5. Keep explanations clear, structured, and actionable with emojis and bullet points.`;

      const response = await fetch(`/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: targetShopId,
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-6).map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: textToSend }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'AI Response error');
      }

      const botText = data.choices?.[0]?.message?.content || 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।';
      const botMsg = { 
        id: Date.now() + 1, 
        role: 'bot', 
        text: botText,
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error('AI Error:', err);
      const fallbackText = `**আপনার স্টোরের বর্তমান অবস্থা:**\n• স্টোর সেটআপ: **${setupProgress.percent}% সম্পন্ন**\n• মোট প্রোডাক্ট: **${storeContext.products.length} টি**\n• মোট অর্ডার: **${storeContext.orders.length} টি**\n• সর্বমোট সেলস: **৳${storeContext.totalRevenue.toLocaleString()}**\n\nAI সার্ভারে সাময়িক ধীরগতি হয়েছে। স্টোর সেটিংস পরিবর্তন করতে সংশ্লিষ্ট মেনুতে ক্লিক করুন।`;
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'bot', 
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* ── Compact sidebar button trigger ── */}
      {compact ? (
        <button
          onClick={() => setIsOpen(true)}
          title="AI Helper & Store Guide"
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md hover:scale-105 transition-all shrink-0 cursor-pointer"
        >
          <Bot size={16} />
        </button>
      ) : (
        /* ── Big Floating Trigger in Bottom Right ── */
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
          {/* Helper pill badge */}
          <div className="mb-2 px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-xl flex items-center gap-1.5 border border-white/20 select-none animate-bounce">
            <Sparkles size={11} className="text-yellow-400" />
            <span>Helper • এআই সহকারী</span>
          </div>

          {/* Main Floating Trigger Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-[0_10px_30px_-5px_rgba(124,58,237,0.55)] hover:shadow-[0_15px_35px_-5px_rgba(124,58,237,0.75)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/25"
          >
            <div className="relative">
              <Bot size={24} className="transition-transform group-hover:rotate-12" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-purple-600 animate-pulse" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-black tracking-tight leading-none flex items-center gap-1.5">
                <span>স্টোর হেল্পার</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] font-mono font-bold">AI</span>
              </div>
              <div className="text-[10px] text-purple-200 font-bold mt-1">
                {setupProgress.percent}% সেটআপ সম্পন্ন
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ── AI Modal / Console ── */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div 
            className={clsx(
              "bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-all duration-300 border border-slate-200 dark:border-slate-800 overflow-hidden relative",
              isFullScreen 
                ? "w-full h-full sm:rounded-none" 
                : "w-full max-w-2xl h-[94vh] sm:max-h-[820px] rounded-t-3xl sm:rounded-3xl"
            )}
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b-4 border-purple-600 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 text-[10px] font-black uppercase tracking-wider">
                      Helper
                    </span>
                    <h3 className="font-black text-base tracking-tight leading-tight text-white">
                      {storeContext.shopDetails?.shopName || propShop?.shopName || 'স্টোর বিজনেস সহকারী'}
                    </h3>
                  </div>
                  <p className="text-[10px] font-bold text-slate-300 mt-0.5">
                    স্টোর সেটআপ, কুরিয়ার, পেমেন্ট ও সেলস গাইড
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    showHistoryDrawer ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:bg-white/10'
                  }`}
                  title="আগের চ্যাট হিস্ট্রি দেখুন"
                >
                  <History size={14} />
                  <span className="hidden sm:inline">চ্যাট হিস্ট্রি ({sessions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="p-2 text-purple-300 hover:text-white hover:bg-purple-600/30 rounded-xl transition-colors cursor-pointer"
                  title="নতুন চ্যাট শুরু করুন"
                >
                  <Plus size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer hidden sm:block"
                  title={isFullScreen ? "ছোট করুন" : "ফুল স্ক্রিন করুন"}
                >
                  {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title="বন্ধ করুন"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ── Interactive Setup Progress & Checklist Strip ── */}
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-slate-800/80 dark:to-slate-800/50 px-5 sm:px-6 py-3 border-b border-purple-100 dark:border-slate-700/60 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-100 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
                      <span>স্টোর সেটআপ অগ্রগতি</span>
                    </span>
                    <span className="text-purple-700 dark:text-purple-300 font-mono font-black">{setupProgress.percent}% সম্পন্ন</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${setupProgress.percent}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowChecklist(!showChecklist)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-black border border-purple-200 dark:border-purple-800 shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>চেকলিস্ট</span>
                  {showChecklist ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Collapsible Checklist Card */}
              {showChecklist && (
                <div className="mt-3 pt-3 border-t border-purple-100 dark:border-slate-700 space-y-3 animate-fade-in text-xs">
                  <div>
                    <p className="font-black text-slate-800 dark:text-slate-100 uppercase text-[10px] tracking-wider mb-2">
                      🎯 মূল ফাংশনসমূহ (Main Functions):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {setupProgress.mainTasks.map(t => (
                        <Link
                          key={t.id}
                          href={t.link}
                          onClick={() => setIsOpen(false)}
                          className={clsx(
                            "flex items-center justify-between p-2 rounded-xl border transition-all hover:scale-[1.01]",
                            t.done 
                              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300"
                              : "bg-white border-slate-200 text-slate-800 hover:border-purple-300 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {t.done ? <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> : <Circle size={15} className="text-slate-400 shrink-0" />}
                            <span className="font-bold truncate">{t.title}</span>
                          </div>
                          <ArrowUpRight size={13} className="text-slate-400 shrink-0 ml-1" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">
                      🚀 অ্যাডভান্সড / অপশনাল কাজ:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {setupProgress.optionalTasks.map(t => (
                        <Link
                          key={t.id}
                          href={t.link}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-300 text-[11px] font-bold"
                        >
                          <span className="truncate">{t.title}</span>
                          <ArrowUpRight size={12} className="text-slate-400 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Metrics Quick Strip */}
            <div className="bg-slate-100/90 dark:bg-slate-800/60 px-5 sm:px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 overflow-x-auto gap-4 shrink-0">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <TrendingUp size={14} className="text-purple-600" />
                <span>সেলস: <strong className="text-slate-900 dark:text-white">৳{storeContext.totalRevenue.toLocaleString()}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <ShoppingBag size={14} className="text-blue-600" />
                <span>অর্ডার: <strong className="text-slate-900 dark:text-white">{storeContext.orders.length}</strong> (পেন্ডিং {storeContext.pendingOrdersCount})</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Package size={14} className="text-emerald-600" />
                <span>পণ্য: <strong className="text-slate-900 dark:text-white">{storeContext.products.length} টি</strong></span>
              </span>
              {storeContext.lowStockProducts.length > 0 && (
                <span className="flex items-center gap-1.5 text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-lg whitespace-nowrap">
                  <AlertTriangle size={12} />
                  <span>লো স্টক: {storeContext.lowStockProducts.length} টি</span>
                </span>
              )}
            </div>

            {/* Main Area: Chat or History Sidebar Drawer */}
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* History Drawer */}
              {showHistoryDrawer && (
                <div className="absolute inset-y-0 left-0 w-full sm:w-80 bg-slate-900 text-white z-30 flex flex-col border-r border-slate-800 animate-slide-in shadow-2xl">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-purple-400" />
                      <h4 className="font-black text-sm">পূর্বের চ্যাটসমূহ ({sessions.length})</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHistoryDrawer(false)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-3">
                    <button
                      type="button"
                      onClick={handleStartNewChat}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>+ নতুন চ্যাট শুরু করুন</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {sessions.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                          s.id === currentSessionId 
                            ? 'bg-purple-600/30 border-purple-500 text-white' 
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="overflow-hidden pr-2">
                          <p className="text-xs font-bold truncate">{s.title || 'নতুন চ্যাট'}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(s.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-opacity cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'bot' && (
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                        <Bot size={16} />
                      </div>
                    )}
                    <div
                      className={clsx(
                        "max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 shadow-xs group relative",
                        m.role === 'user'
                          ? "bg-purple-600 text-white rounded-tr-none font-medium"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700"
                      )}
                    >
                      <div className="whitespace-pre-wrap font-sans">
                        {m.text}
                      </div>

                      {/* Interactive Deep Link Shortcuts if suggested */}
                      {m.role === 'bot' && (
                        <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-200 dark:border-slate-700/60 mt-2">
                          <Link
                            href="/dashboard/products"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 font-bold text-[11px] border border-purple-200 dark:border-purple-800 hover:bg-purple-50"
                          >
                            <Package size={12} />
                            <span>পণ্য ও স্টক ↗</span>
                          </Link>
                          <Link
                            href="/dashboard/settings"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200 dark:border-blue-800 hover:bg-blue-50"
                          >
                            <Truck size={12} />
                            <span>ডেলিভারি ও কুরিয়ার ↗</span>
                          </Link>
                          <Link
                            href="/dashboard/templates"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50"
                          >
                            <Palette size={12} />
                            <span>ব্যানার ও থিম ↗</span>
                          </Link>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[10px] opacity-70">
                        <span>{m.timestamp}</span>
                        {m.role === 'bot' && (
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(m.text, m.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="কপি করুন"
                          >
                            {copiedId === m.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 justify-start items-center">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Bot size={16} />
                    </div>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-purple-600" />
                      <span>AI সহকারী উত্তর তৈরি করছে...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Demo Prompts */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-2 shrink-0 scrollbar-none">
              {DEMO_PROMPTS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSend(p.text)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold whitespace-nowrap cursor-pointer transition-all hover:border-purple-300"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="আপনার স্টোর বা যেকোনো সেটিংস সম্পর্কে বাংলায় লিখুন..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isTyping}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span className="hidden sm:inline">পাঠান</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
