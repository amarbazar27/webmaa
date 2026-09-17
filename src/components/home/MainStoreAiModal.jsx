'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, X, Send, Trash2, Sparkles, ShoppingCart, 
  RotateCcw, Copy, Check, MessageSquare, Plus,
  Maximize2, Minimize2, ChevronLeft, Store, Tag, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const MARKETPLACE_SUGGESTED_PROMPTS = [
  { id: 1, label: '🛒 সেরা সাশ্রয়ী অফার', text: 'আজকের মার্কেটপ্লেসের সবচেয়ে জনপ্রিয় ও সাশ্রয়ী পণ্য কোনগুলো?' },
  { id: 2, label: '🚚 ফ্রি ডেলিভারি নিয়ম', text: 'মার্কেটপ্লেসের বিভিন্ন স্টোরের ডেলিভারি চার্জ কত এবং ফ্রি ডেলিভারির নিয়ম কী?' },
  { id: 3, label: '🥩 ফ্রেশ মাংস ও গ্রোসারি', text: 'ফ্রেশ মুরগি, গরুর মাংস ও ডিম কোন স্টোর থেকে অর্ডার করা যাবে?' },
  { id: 4, label: '🏪 ৫ মিনিটে নিজস্ব স্টোর', text: 'আমি কীভাবে মাত্র ৫ মিনিটে কোনো কোডিং ছাড়াই নিজস্ব অনলাইন শপ ও ল্যান্ডিং পেজ তৈরি করতে পারব?' },
];

export default function MainStoreAiModal({ 
  isOpen, 
  onClose, 
  allShops = [], 
  products = [], 
  globalConfig = {}, 
  mainShopData = {},
  onAddToCart,
  onOpenCart 
}) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  
  // Sessions Management
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load Sessions from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = 'bd_marketplace_ai_sessions';
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages || []);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not parse saved marketplace AI sessions:', e);
    }

    // Default first session
    startNewSession();
  }, []);

  // Save Sessions to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !currentSessionId || messages.length === 0) return;
    const storageKey = 'bd_marketplace_ai_sessions';
    try {
      setSessions(prevSessions => {
        const updated = prevSessions.map(s => {
          if (s.id === currentSessionId) {
            const firstUserMsg = messages.find(m => m.role === 'user');
            const title = firstUserMsg ? (firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '')) : s.title;
            return { ...s, title, messages };
          }
          return s;
        });

        const exists = updated.some(s => s.id === currentSessionId);
        const finalSessions = exists ? updated : [{
          id: currentSessionId,
          title: 'নতুন চ্যাট',
          createdAt: new Date().toISOString(),
          messages
        }, ...updated];

        localStorage.setItem(storageKey, JSON.stringify(finalSessions.slice(0, 25)));
        return finalSessions;
      });
    } catch (e) {
      console.warn('Could not save sessions:', e);
    }
  }, [messages, currentSessionId]);

  const startNewSession = () => {
    const newId = 'session_' + Date.now();
    const botName = mainShopData?.aiConfig?.botName || (globalConfig?.brandName ? `${globalConfig.brandName} AI` : 'BDRetailers AI');
    const initMsgs = [
      {
        id: 'welcome_' + Date.now(),
        role: 'bot',
        text: `আসসালামু আলাইকুম! আমি **${botName}**। পুরো মার্কেটপ্লেস থেকে আপনার পছন্দের সেরা পণ্য খুঁজে পেতে, বিভিন্ন স্টোরের ডেলিভারি চার্জ জানতে অথবা সরাসরি কার্টে যোগ করতে আমাকে যেকোনো প্রশ্ন করুন। আজ আপনাকে কীভাবে সাহায্য করতে পারি? 😊`
      }
    ];

    const newSession = {
      id: newId,
      title: 'নতুন চ্যাট',
      createdAt: new Date().toISOString(),
      messages: initMsgs
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setMessages(initMsgs);
    setShowHistoryDrawer(false);
  };

  const handleSwitchSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setShowHistoryDrawer(false);
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== sessionId);
    setSessions(filtered);
    try {
      localStorage.setItem('bd_marketplace_ai_sessions', JSON.stringify(filtered));
    } catch (err) {}

    if (sessionId === currentSessionId) {
      if (filtered.length > 0) {
        setCurrentSessionId(filtered[0].id);
        setMessages(filtered[0].messages || []);
      } else {
        startNewSession();
      }
    }
    toast.success('চ্যাট সেশন মুছে ফেলা হয়েছে');
  };

  const handleClearAllHistory = () => {
    if (!confirm('আপনি কি নিশ্চিত যে আপনার সমস্ত AI চ্যাট হিস্ট্রি মুছে ফেলতে চান?')) return;
    try {
      localStorage.removeItem('bd_marketplace_ai_sessions');
    } catch (err) {}
    setSessions([]);
    startNewSession();
    toast.success('সমস্ত চ্যাট হিস্ট্রি মুছে ফেলা হয়েছে');
  };

  // Helper to extract JSON from AI bot message
  const getSuggestedProductsForMessage = (msg) => {
    if (!msg || msg.role !== 'bot' || !msg.text) return null;
    try {
      const match = msg.text.match(/PRODUCTS_JSON:(.*)$/s);
      if (match && match[1]) {
        const jsonStr = match[1].trim();
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const itemsWithProduct = parsed.map(item => {
            const product = products.find(p => p.id === item.id);
            return product ? { product, qty: item.qty || 1 } : null;
          }).filter(Boolean);
          return itemsWithProduct.length > 0 ? itemsWithProduct : null;
        }
      }
    } catch (e) {}
    return null;
  };

  const handleCopyMessage = (id, text) => {
    const cleanText = text.replace(/PRODUCTS_JSON:.*$/s, '').replace(/ACTION:.*$/s, '').trim();
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('টেক্সট কপি করা হয়েছে');
    });
  };

  const handleAddAllSuggested = (msgText) => {
    try {
      const match = msgText.match(/PRODUCTS_JSON:(.*)$/s);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1].trim());
        if (Array.isArray(parsed)) {
          let addedCount = 0;
          parsed.forEach(item => {
            const prod = products.find(p => p.id === item.id);
            if (prod && onAddToCart) {
              for (let i = 0; i < (item.qty || 1); i++) {
                onAddToCart(prod);
              }
              addedCount++;
            }
          });
          if (addedCount > 0) {
            toast.success(`${addedCount}টি পণ্য কার্টে যোগ করা হয়েছে! 🛒`);
          }
        }
      }
    } catch (err) {
      toast.error('পণ্য কার্টে যোগ করতে সমস্যা হয়েছে');
    }
  };

  const sendMessage = async (textToSend) => {
    const q = (textToSend || input).trim();
    if (!q || isTyping) return;

    const userMsg = { id: 'user_' + Date.now(), role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Build shops context
      const shopsInfo = allShops.filter(s => {
        const isTest = s.shopSlug === 'test' || s.shopName?.toLowerCase() === 'test';
        return s.isActive !== false && s.showOnMainSite !== false && !isTest;
      }).slice(0, 20).map(s => {
        const delFee = s.deliveryConfig?.advanceFee || '60';
        const freeMin = s.deliveryConfig?.freeDeliveryMinOrder ? `৳${s.deliveryConfig.freeDeliveryMinOrder}` : 'নেই';
        return `স্টোর: ${s.shopName} (slug: ${s.subdomainSlug || s.shopSlug}), ক্যাটাগরি: ${s.businessType || 'সাধারণ'}, ডেলিভারি চার্জ: ৳${delFee}, ফ্রি ডেলিভারি মিনিমাম: ${freeMin}`;
      }).join('\n');

      // Top 100 products for prompt context
      const productList = products.slice(0, 100).map(p => 
        `${p.id}|${p.name}|৳${p.price}|${p.unit || 'piece'}|${p.shopName || ''}`
      ).join('\n');

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: 'main-marketplace',
          model: 'google/gemini-2.0-flash',
          messages: [
            {
              role: 'system',
              content: `You are the friendly, professional AI Shopping Assistant for BDRetailers platform (bdretailers.com) in Bangladesh.
Speak fluently in Bengali. Be helpful, concise, and polite.

প্লাটফর্মের সক্রিয় ভেরিফাইড স্টোরসমূহ:
${shopsInfo || 'BDRetailers Platform - Delivery Charge: ৳60'}

মার্কেটপ্লেসের পণ্যসমূহ (ID|Name|Price|Unit|Shop):
${productList || 'পণ্য লোড করা হয়েছে'}

Rules:
1. When recommending products, list their names, price, and store name. At the very end of your response, attach:
"PRODUCTS_JSON:[{\"id\":\"product_id\",\"qty\":1}]" so interactive product cards will render.
2. If the user asks to see their cart, checkout, or view ordered items, write:
"ACTION:OPEN_CART" at the end of the response.
3. If a requested product is not available, politely inform that it is currently unavailable and suggest the closest available alternative.`
            },
            ...messages.slice(-6).map(m => ({
              role: m.role === 'bot' ? 'assistant' : 'user',
              content: m.text
            })),
            {
              role: 'user',
              content: q
            }
          ]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'AI সংযোগে সমস্যা হয়েছে');

      const botText = data.choices?.[0]?.message?.content || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।';
      const botMsg = { id: 'bot_' + Date.now(), role: 'bot', text: botText };
      setMessages(prev => [...prev, botMsg]);

      // Open cart if action detected
      if (botText.includes('ACTION:OPEN_CART') && onOpenCart) {
        setTimeout(() => {
          onOpenCart();
        }, 1000);
      }
    } catch (err) {
      console.error('Marketplace AI error:', err);
      setMessages(prev => [...prev, {
        id: 'bot_err_' + Date.now(),
        role: 'bot',
        text: 'দুঃখিত, এই মুহূর্তে AI সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা সরাসরি মার্কেটপ্লেস ব্রাউজ করুন।'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className={`relative w-full bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 transition-all duration-300 text-slate-800 ${
        isFullScreen 
          ? 'h-full sm:h-[95vh] max-w-4xl' 
          : 'h-[85vh] max-h-[720px] max-w-lg'
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-3.5 sm:p-4 flex justify-between items-center border-b border-purple-600/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center text-white shadow-xs shrink-0">
              <Bot size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm tracking-tight leading-tight">
                  {mainShopData?.aiConfig?.botName || 'BDRetailers AI Assistant'}
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-purple-200 font-bold tracking-wide">স্মার্ট মার্কেটপ্লেস সহকারী • লাইভ হিস্ট্রি</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* History Drawer Toggle */}
            <button
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className={`p-2 rounded-xl transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer ${
                showHistoryDrawer ? 'bg-white/30 text-white' : 'hover:bg-white/20 text-purple-100'
              }`}
              title="চ্যাট হিস্ট্রি দেখুন"
            >
              <MessageSquare size={16} />
              <span className="hidden xs:inline text-[11px]">হিস্ট্রি</span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={startNewSession}
              className="p-2 rounded-xl hover:bg-white/20 text-purple-100 transition-colors cursor-pointer"
              title="নতুন চ্যাট শুরু করুন"
            >
              <Plus size={17} strokeWidth={2.5} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="hidden sm:block p-2 rounded-xl hover:bg-white/20 text-purple-100 transition-colors cursor-pointer"
              title={isFullScreen ? 'ছোট করুন' : 'বড় করুন'}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="hover:bg-white/20 p-2 rounded-xl text-purple-100 hover:text-white transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X size={19} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Main Body with History Drawer Overlay */}
        <div className="relative flex-1 flex overflow-hidden">
          
          {/* History Drawer (Sliding Left Panel) */}
          <div className={`absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-slate-50 border-r border-slate-200 z-20 flex flex-col transition-transform duration-300 shadow-xl ${
            showHistoryDrawer ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <MessageSquare size={14} className="text-purple-600" />
                <span>সংরক্ষিত চ্যাটসমূহ ({sessions.length})</span>
              </div>
              <button 
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <button
                onClick={startNewSession}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-purple-200 cursor-pointer mb-2"
              >
                <Plus size={14} />
                <span>নতুন কথোপকথন শুরু করুন</span>
              </button>

              {sessions.map(s => {
                const isActive = s.id === currentSessionId;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSwitchSession(s)}
                    className={`group w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-purple-600 text-white shadow-xs' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <div className="truncate min-w-0">
                      <p className="truncate text-xs">{s.title || 'কথোপকথন'}</p>
                      <p className={`text-[9px] ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                        {new Date(s.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })} • {s.messages?.length || 0} মেসেজ
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        isActive ? 'text-purple-200 hover:bg-purple-700' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title="মুছুন"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>

            {sessions.length > 0 && (
              <div className="p-2 border-t border-slate-200 bg-white">
                <button
                  onClick={handleClearAllHistory}
                  className="w-full py-2 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>সমস্ত হিস্ট্রি মুছে ফেলুন</span>
                </button>
              </div>
            )}
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 custom-scrollbar">
              
              {/* Quick Prompt Chips (When few messages) */}
              {messages.length <= 2 && (
                <div className="space-y-1.5 pb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">সাজেস্টেড প্রশ্নসমূহ:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {MARKETPLACE_SUGGESTED_PROMPTS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => sendMessage(p.text)}
                        className="p-2 rounded-xl bg-white border border-purple-100 hover:border-purple-300 hover:bg-purple-50/60 text-slate-700 hover:text-purple-700 text-left text-xs font-bold transition-all shadow-2xs flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="truncate">{p.label}</span>
                        <ArrowRight size={12} className="text-purple-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Message List */}
              {messages.map(msg => {
                const suggestedItems = getSuggestedProductsForMessage(msg);
                const isUser = msg.role === 'user';

                return (
                  <div key={msg.id} className={`flex flex-col gap-1.5 max-w-[88%] ${isUser ? 'self-end' : 'self-start'}`}>
                    <div className={`group relative p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                      isUser 
                        ? 'bg-purple-600 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}>
                      {/* Copy message button */}
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className={`absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                          isUser ? 'hover:bg-purple-700 text-purple-200' : 'hover:bg-slate-100 text-slate-400'
                        }`}
                        title="কপি করুন"
                      >
                        {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>

                      {/* Clean Text (removing JSON and action tags) */}
                      <div className="whitespace-pre-wrap pr-4">
                        {msg.text
                          .replace(/PRODUCTS_JSON:.*$/s, '')
                          .replace(/ACTION:OPEN_CART/g, '')
                          .trim()}
                      </div>
                    </div>

                    {/* AI Suggested Product Cards */}
                    {suggestedItems && suggestedItems.length > 0 && (
                      <div className="bg-purple-50/70 border border-purple-100 p-2.5 rounded-2xl space-y-2 mt-1">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} /> পণ্য প্রস্তাবনা ({suggestedItems.length}):
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                          {suggestedItems.map(({ product, qty }) => (
                            <div key={product.id} className="bg-white p-2 rounded-xl border border-purple-100 flex items-center justify-between gap-2 shadow-2xs">
                              <div className="flex items-center gap-2 min-w-0">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">🛍</div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
                                  <p className="text-[10px] text-slate-500 font-bold">
                                    ৳{product.price} {product.shopName && <span className="text-purple-600">({product.shopName})</span>}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => onAddToCart && onAddToCart(product)}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black shrink-0 transition-colors shadow-2xs cursor-pointer active:scale-95"
                              >
                                + কার্ট
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => handleAddAllSuggested(msg.text)}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <ShoppingCart size={12} />
                          <span>সব কার্টে যোগ করুন</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="p-3 rounded-2xl bg-white border border-slate-200 self-start flex items-center gap-1.5 shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] font-bold text-slate-400 ml-1">AI উত্তর তৈরি করছে...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="আপনার কাঙ্ক্ষিত পণ্য বা প্রশ্ন লিখুন..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-all placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0 cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
