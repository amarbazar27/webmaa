'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bot, X, Send, BarChart2, Package, Lightbulb, Loader2, 
  Maximize2, Minimize2, Trash2, Sparkles, TrendingUp, AlertTriangle, 
  ShoppingBag, CheckCircle, ArrowRight, Copy, Check, History, Plus,
  MessageSquare, ChevronLeft, ChevronRight, User
} from 'lucide-react';
import { getProducts, getOrders, getShop } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const DEMO_PROMPTS = [
  { id: 1, label: '📈 সেলস ও রেভিনিউ রিপোর্ট', text: 'আমার স্টোরের বর্তমান সেলস, রেভিনিউ এবং অর্ডারের সম্পূর্ণ এনালাইসিস দাও।' },
  { id: 2, label: '⚠️ লো স্টক প্রোডাক্টের তালিকা', text: 'কোন কোন পণ্যের স্টক ফুরিয়ে যাচ্ছে বা শেষ হতে চলেছে তাদের তালিকা ও স্টক পরিমাণ জানাও।' },
  { id: 3, label: '🚚 পেন্ডিং অর্ডারের সামারি', text: 'বর্তমানে কয়টি অর্ডার পেন্ডিং আছে এবং সেগুলো দ্রুত ডেলিভারি করার জন্য কী করণীয়?' },
  { id: 4, label: '💡 সেলস দ্বিগুণ করার ৩টি আইডিয়া', text: 'আমার স্টোরের প্রোডাক্টগুলোর ওপর ভিত্তি করে সেলস দ্বিগুণ করার ৩টি বাস্তবধর্মী মার্কেটিং আইডিয়া দাও।' },
  { id: 5, label: '✍️ ফেসবুক প্রমোশনাল অফার পোস্ট', text: 'আমার দোকানের জন্য ফেসবুকে পোস্ট করার মতো একটি আকর্ষণীয় অফার ও ডিসকাউন্ট ক্যাপশন লিখে দাও।' },
  { id: 6, label: '🏆 বেস্ট সেলিং প্রোডাক্ট ও টিপস', text: 'কোন প্রোডাক্টগুলো বেশি বিক্রি হচ্ছে এবং সেগুলোর বিজ্ঞাপন কীভাবে বাড়ানো যায়?' },
];

export default function AiCompanion({ shop, isMobile, compact = false }) {
  const { activeShopId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  
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

  // Load Sessions list from localStorage
  useEffect(() => {
    if (!activeShopId) return;
    const storageKey = `bd_ai_sessions_${activeShopId}`;
    try {
      const savedSessions = localStorage.getItem(storageKey);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          // Load most recent session
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages || []);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not parse saved sessions:', e);
    }

    // Start fresh initial session
    const botName = shop?.aiConfig?.botName || 'BDRetailers AI';
    const initSessionId = 'session_' + Date.now();
    const initialMsgs = [
      {
        id: 'welcome_' + Date.now(),
        role: 'bot',
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        text: `আসসালামু আলাইকুম! আমি আপনার শপ অ্যানালিটিক্স অ্যাসিস্ট্যান্ট **${botName}**। 🚀\n\nআপনার স্টোরের **লাইভ সেলস, ইনভেন্টরি স্টক, পেন্ডিং অর্ডার বা মার্কেটিং স্ট্র্যাটেজি** নিয়ে যেকোনো প্রশ্ন আমাকে করতে পারেন। নিচের সাজেস্টেড বাটনগুলো ট্রাই করুন অথবা সরাসরি আপনার প্রশ্নটি লিখুন!`
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
  }, [activeShopId, shop?.aiConfig?.botName]);

  // Persist Current Session & Messages to localStorage
  useEffect(() => {
    if (!activeShopId || !currentSessionId || messages.length === 0) return;
    const storageKey = `bd_ai_sessions_${activeShopId}`;
    try {
      setSessions(prevSessions => {
        const updated = prevSessions.map(s => {
          if (s.id === currentSessionId) {
            // derive title from first user message
            const firstUserMsg = messages.find(m => m.role === 'user');
            const title = firstUserMsg ? firstUserMsg.text.slice(0, 30) + '...' : s.title;
            return { ...s, title, messages };
          }
          return s;
        });

        // if currentSessionId doesn't exist in prev, prepend
        const exists = updated.some(s => s.id === currentSessionId);
        const finalSessions = exists ? updated : [{
          id: currentSessionId,
          title: 'নতুন কথোপকথন',
          createdAt: new Date().toISOString(),
          messages
        }, ...updated];

        localStorage.setItem(storageKey, JSON.stringify(finalSessions.slice(0, 20))); // Keep last 20 sessions
        return finalSessions;
      });
    } catch (e) {
      console.warn('Could not save sessions:', e);
    }
  }, [messages, currentSessionId, activeShopId]);

  // Fetch full live store analytics context
  const refreshStoreContext = useCallback(async () => {
    if (!activeShopId) return;
    try {
      const [prods, ords, shp] = await Promise.all([
        getProducts(activeShopId),
        getOrders(activeShopId),
        getShop(activeShopId)
      ]);

      const rev = ords.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
      const pending = ords.filter(o => o.status === 'pending').length;
      const completed = ords.filter(o => o.status === 'completed').length;
      const lowStock = prods.filter(p => (parseInt(p.stock) || 0) <= 5);

      setStoreContext({
        products: prods || [],
        orders: ords || [],
        shopDetails: shp || shop,
        totalRevenue: rev,
        pendingOrdersCount: pending,
        completedOrdersCount: completed,
        lowStockProducts: lowStock,
        topProducts: prods.slice(0, 10)
      });
    } catch (err) {
      console.error('Error loading AI store context:', err);
    }
  }, [activeShopId, shop]);

  useEffect(() => {
    if (isOpen) {
      refreshStoreContext();
    }
  }, [isOpen, refreshStoreContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Start New Chat Session
  const handleStartNewChat = () => {
    const botName = shop?.aiConfig?.botName || 'BDRetailers AI';
    const newId = 'session_' + Date.now();
    const initialMsgs = [
      {
        id: 'welcome_' + Date.now(),
        role: 'bot',
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        text: `আসসালামু আলাইকুম! আমি **${botName}**। আপনার স্টোরের সেলস, স্টক বা যেকোনো প্রশ্ন করুন, আমি সাহায্য করছি। 📊`
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

  // Switch to an existing session
  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setShowHistoryDrawer(false);
  };

  // Delete an entire session
  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    if (!confirm('আপনি কি এই চ্যাট সেশনটি স্থায়ীভাবে মুছে ফেলতে চান?')) return;
    
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    if (activeShopId) {
      localStorage.setItem(`bd_ai_sessions_${activeShopId}`, JSON.stringify(updated));
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

  // Delete an individual message
  const handleDeleteMessage = (msgId) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    toast.success('মেসেজটি মুছে ফেলা হয়েছে');
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
      const shopName = storeContext.shopDetails?.shopName || shop?.shopName || 'আমার অনলাইন স্টোর';
      const botName = shop?.aiConfig?.botName || 'BDRetailers AI';
      
      const productSummary = storeContext.products.map(p => 
        `- ${p.name}: মূল্য ৳${p.price}, স্টক: ${p.stock} টি, ক্যাটাগরি: ${p.category || 'N/A'}`
      ).slice(0, 30).join('\n');

      const lowStockList = storeContext.lowStockProducts.map(p => 
        `- ${p.name} (স্টক মাত্র ${p.stock} টি)`
      ).join('\n');

      const systemPrompt = `You are a high-level eCommerce Business Analytics & Growth Consultant named "${botName}" for the retail brand "${shopName}" in Bangladesh.

STRICT RULES:
1. Greet with "আসসালামু আলাইকুম" where natural. Always be respectful, enthusiastic, insightful, and professional.
2. Speak in polished Bengali. Use Markdown formatting (bold, bullet points, numbered steps, summary tables) to make answers visually attractive and easy to read.
3. Use the following REAL LIVE STORE DATA to give programmatic, concrete, and accurate insights:

── LIVE STORE CONTEXT ──
• Store Name: ${shopName}
• Total Products in Inventory: ${storeContext.products.length}
• Total Orders Received: ${storeContext.orders.length}
• Total Gross Revenue: ৳${storeContext.totalRevenue.toLocaleString()}
• Pending Orders: ${storeContext.pendingOrdersCount}
• Delivered / Completed Orders: ${storeContext.completedOrdersCount}
• Products with Low Stock (<=5 units): ${storeContext.lowStockProducts.length} items
${lowStockList ? `Low Stock Items:\n${lowStockList}` : 'All products have healthy stock.'}

• Product Inventory Snapshot:
${productSummary || 'No products added yet.'}

• Delivery Policy: ৳${storeContext.shopDetails?.deliveryCharge || '60'} BDT | Service Areas: ${(storeContext.shopDetails?.serviceAreas || []).join(', ') || 'সমগ্র বাংলাদেশ'}
• Payment Methods: Cash on Delivery (COD), bKash / Nagad / Automated Gateway.

── INSTRUCTION ──
Analyze the merchant's query using the above numbers. If asked about stock, cite the exact product names and counts. If asked about sales or growth, provide concrete actionable steps tailored to Bangladeshi eCommerce. If writing social media posts or captions, make them catchy with emojis, hashtags, and strong Call-to-Actions.`;

      const response = await fetch(`/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: activeShopId,
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

      const botText = data.choices?.[0]?.message?.content || 'দুঃখিত, এই মুহূর্তে উত্তর জেনারেট করা সম্ভব হয়নি।';
      const botMsg = { 
        id: Date.now() + 1, 
        role: 'bot', 
        text: botText,
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error('AI Error:', err);
      const fallbackText = `**আপনার স্টোরের সারসংক্ষেপ:**\n• মোট প্রোডাক্ট: **${storeContext.products.length} টি**\n• মোট অর্ডার: **${storeContext.orders.length} টি**\n• সর্বমোট সেলস: **৳${storeContext.totalRevenue.toLocaleString()}**\n• পেন্ডিং অর্ডার: **${storeContext.pendingOrdersCount} টি**\n• লো স্টক প্রোডাক্ট: **${storeContext.lowStockProducts.length} টি**\n\nAI সার্ভারে সাময়িক কানেকশন ইস্যু হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।`;
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
      {compact ? (
        <button
          onClick={() => setIsOpen(true)}
          title="AI Business Assistant"
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md hover:scale-105 transition-all shrink-0"
        >
          <Bot size={16} />
        </button>
      ) : isMobile ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full text-white shadow-[0_5px_20px_-5px_rgba(147,51,234,0.6)] hover:scale-105 transition-all flex items-center justify-center lg:hidden"
        >
          <Bot size={24} />
        </button>
      ) : (
        <div className="px-4 py-2">
          <button 
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl text-white shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02] transition-all group overflow-hidden relative"
          >
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Bot size={20} className="group-hover:rotate-12 transition-transform" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-200 opacity-80">{shop?.aiConfig?.botName || 'AI Advisor'}</p>
                <p className="text-sm font-black">AI Business Analytics</p>
              </div>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-125 transition-transform">
              <Bot size={80} />
            </div>
          </button>
        </div>
      )}

      {/* ── AI Modal / Full-Screen Console ── */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div 
            className={clsx(
              "bg-white shadow-2xl flex flex-col transition-all duration-300 border border-slate-200 overflow-hidden relative",
              isFullScreen 
                ? "w-full h-full sm:rounded-none" 
                : "w-full max-w-2xl h-[92vh] sm:max-h-[800px] rounded-t-3xl sm:rounded-3xl"
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
                    <h3 className="font-black text-base tracking-tight leading-tight text-white">
                      {shop?.aiConfig?.botName || 'BDRetailers AI'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
                      Live Store Sync
                    </span>
                  </div>
                  <p className="text-[10px] uppercase font-bold text-purple-300 tracking-widest mt-0.5">
                    Real-time Business & Analytics Advisor
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

            {/* Live Metrics Quick Strip */}
            <div className="bg-slate-100/80 px-5 sm:px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 overflow-x-auto gap-4 shrink-0">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <TrendingUp size={14} className="text-purple-600" />
                <span>সেলস: <strong className="text-slate-900">৳{storeContext.totalRevenue.toLocaleString()}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <ShoppingBag size={14} className="text-blue-600" />
                <span>অর্ডার: <strong className="text-slate-900">{storeContext.orders.length}</strong> (পেন্ডিং {storeContext.pendingOrdersCount})</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Package size={14} className="text-emerald-600" />
                <span>পণ্য: <strong className="text-slate-900">{storeContext.products.length} টি</strong></span>
              </span>
              {storeContext.lowStockProducts.length > 0 && (
                <span className="flex items-center gap-1.5 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
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
                        className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between group border ${
                          currentSessionId === s.id
                            ? 'bg-purple-950/80 border-purple-500/50 text-white'
                            : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <MessageSquare size={14} className={currentSessionId === s.id ? "text-purple-400" : "text-slate-500"} />
                          <div className="truncate">
                            <p className="text-xs font-bold truncate leading-tight">{s.title || 'কথোপকথন'}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              {s.createdAt ? new Date(s.createdAt).toLocaleDateString('bn-BD') : ''}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="এই চ্যাটটি ডিলিট করুন"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages Stream */}
              <div ref={scrollRef} className="flex-1 p-4 sm:p-6 bg-slate-50 overflow-y-auto space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={clsx("flex gap-2.5 sm:gap-3 group", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.role === 'bot' && (
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm mt-1">
                        <Bot size={16} />
                      </div>
                    )}

                    <div className={clsx(
                      "max-w-[88%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 text-sm leading-relaxed shadow-sm relative transition-all",
                      msg.role === 'user'
                        ? "bg-purple-600 text-white rounded-tr-xs font-medium"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                    )}>
                      <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                        {msg.text}
                      </div>

                      {/* Action Bar inside Message */}
                      <div className={clsx(
                        "flex items-center justify-between pt-2 border-t mt-2 text-[10px]",
                        msg.role === 'user' ? "border-white/20 text-purple-200" : "border-slate-100 text-slate-400"
                      )}>
                        <span className="font-mono">{msg.timestamp || ''}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.text, msg.id)}
                            className={clsx(
                              "font-bold flex items-center gap-1 transition-colors cursor-pointer",
                              msg.role === 'user' ? "hover:text-white" : "hover:text-purple-600"
                            )}
                            title="মেসেজ কপি করুন"
                          >
                            {copiedId === msg.id ? <Check size={12} className={msg.role === 'user' ? "text-white" : "text-emerald-600"} /> : <Copy size={12} />}
                            <span>{copiedId === msg.id ? 'কপি হয়েছে' : 'কপি'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="hover:text-red-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="এই মেসেজটি ডিলিট করুন"
                          >
                            <Trash2 size={12} />
                            <span>মুছুন</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black shrink-0 mt-1">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                      <Bot size={16} />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-500 flex items-center gap-2 shadow-xs">
                      <Loader2 size={14} className="animate-spin text-purple-600" />
                      <span>আপনার স্টোরের ডেটা বিশ্লেষণ করা হচ্ছে...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestion Demo Pills */}
            <div className="px-4 sm:px-5 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap flex items-center gap-1">
                <Sparkles size={12} className="text-purple-500" /> আইডিয়া:
              </span>
              {DEMO_PROMPTS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSend(p.text)}
                  disabled={isTyping}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 text-[11px] font-bold whitespace-nowrap transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="সেলস, স্টক, ফেসবুক অফার বা যেকোনো প্রশ্ন লিখুন..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isTyping}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-purple-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white flex items-center justify-center transition-all shadow-md shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
