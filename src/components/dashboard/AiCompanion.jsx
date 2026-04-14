'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, BarChart2, Package, Lightbulb, Loader2 } from 'lucide-react';
import { getProducts, subscribeOrders } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';

export default function AiCompanion({ shop, isMobile }) {
  const { activeShopId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: `আসসালামু আলাইকুম! আমি আপনার স্টোর অ্যাসিস্ট্যান্ট ${shop?.aiConfig?.botName || 'Webmaa AI'}। আপনার আজকের সেলস বা ইনভেন্টরি সম্পর্কে কোনো এনালাইসিস লাগবে?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({ orders: [], products: [] });

  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeShopId) {
      // Fetch data for context
      const unsub = subscribeOrders(activeShopId, (orders) => {
        getProducts(activeShopId).then(products => {
           setAnalyticsData({ orders, products });
        });
      });
      return () => unsub();
    }
  }, [isOpen, activeShopId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateReply = (query) => {
    const q = query.toLowerCase();
    const { orders, products } = analyticsData;

    if (q.includes('order') || q.includes('সেল') || q.includes('analysis')) {
      const delivered = orders.filter(o => o.status === 'completed').length;
      const pending = orders.filter(o => o.status === 'pending').length;
      return `আপনার এই মুহূর্তে মোট ${orders.length}টি অর্ডার আছে। এর মধ্যে ${delivered}টি ডেলিভার হয়েছে এবং ${pending}টি পেন্ডিং। আপনার কাস্টমাররা বেশিরভাগই ${orders[0]?.customerAddress?.split(',')[0] || 'লোকাল'} এরিয়া থেকে অর্ডার করছেন। আপনি চাইলে ঐসব এরিয়ায় ফেসবুক এড ট্রাই করতে পারেন! 📈`;
    }

    if (q.includes('stock') || q.includes('ইনভেন্টরি') || q.includes('পণ্য')) {
      const lowStock = products.filter(p => p.stock < 5).length;
      return `আপনার স্টোরে এখন ${products.length}টি পণ্য আছে। ${lowStock > 0 ? `${lowStock}টি পণ্যের স্টক কম আছে।` : 'সবগুলো প্রডাক্টের স্টক ঠিক আছে।'} আপনি কি কোনো পণ্যের দাম বা তথ্য আপডেট করতে চান? 📦`;
    }

    if (q.includes('marketing') || q.includes('আইডিয়া') || q.includes('বিপণন')) {
      return `মার্কেটিং আইডিয়া: আপনার ফেইসবুক পেজে "ফ্রি ডেলিভারি" অফার দিয়ে একটি পোস্ট দিতে পারেন। এতে অর্ডার ২০% পর্যন্ত বাড়তে পারে বলে আমাদের রিপোর্ট বলছে! 💡`;
    }

    const botName = shop?.aiConfig?.botName || 'Webmaa AI';
    return `আমি এখনো পুরোপুরি ট্রেনড না, তবে আমি আপনার অর্ডার, স্টক এবং মার্কেটিং আইডিয়া নিয়ে কথা বলতে পারি। নিচের বাটনগুলো ট্রাই করুন অথবা সরাসরি প্রশ্ন করুন! — ${botName} 🤖`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = shop?.aiConfig?.apiKey || 'AIzaSyDkw6nSHsJHh1ieqOtuFsVbc503N5NxI8g';
      const prompt = `You are a professional e-commerce AI assistant named ${shop?.aiConfig?.botName || 'Webmaa AI'}, assisting the shop owner in Bengali. 
      Current Store Context: 
      - Total Products: ${analyticsData.products.length}
      - Total Orders: ${analyticsData.orders.length} 
      (Use this context to answer intelligently, but only if relevant).
      User Query: "${userMsg.text}"`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gemini API Error');
      }

      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const botMsg = { id: Date.now() + 1, role: 'bot', text: botText || generateReply(userMsg.text) };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      // Fallback but include error so user knows what failed
      const errorContext = err.message.includes('API') ? `[API Error: ${err.message}] ` : '';
      const botMsg = { id: Date.now() + 1, role: 'bot', text: errorContext + generateReply(userMsg.text) };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {isMobile ? (
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
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-200 opacity-80">{shop?.aiConfig?.botName || 'AI Assistant'}</p>
                <p className="text-sm font-black">AI Companion</p>
              </div>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-125 transition-transform">
              <Bot size={80} />
            </div>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[70vh] border border-slate-200 animate-slide-in">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b-[4px] border-purple-600">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight leading-tight">{shop?.aiConfig?.botName || 'Webmaa AI'}</h3>
                    <p className="text-[10px] uppercase font-black text-purple-300 tracking-widest">Shop Analytics Assistant</p>
                  </div>
               </div>
               <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl text-slate-400 hover:text-white transition-colors">
                  <X size={20} strokeWidth={2.5}/>
               </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 p-5 bg-slate-50 overflow-y-auto space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={clsx(
                  "max-w-[85%] p-4 rounded-2xl text-sm font-bold shadow-sm",
                  msg.role === 'bot' 
                    ? "bg-white border border-slate-200 text-slate-800 rounded-tl-none self-start" 
                    : "bg-purple-600 text-white rounded-tr-none self-end ml-auto"
                )}>
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="bg-white border border-slate-200 p-4 rounded-2xl text-slate-400 self-start animate-pulse flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Thinking...
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-5 py-3 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide">
              <button 
                onClick={() => setInput('অর্ডার এনালাইসিস')}
                className="shrink-0 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[11px] font-black text-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
              >
                <BarChart2 size={14} /> Analysis
              </button>
              <button 
                onClick={() => setInput('স্টক চেক')}
                className="shrink-0 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[11px] font-black text-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
              >
                <Package size={14} /> Stock Check
              </button>
              <button 
                onClick={() => setInput('মার্কেটিং আইডিয়া')}
                className="shrink-0 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[11px] font-black text-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
              >
                <Lightbulb size={14} /> Marketing ideas
              </button>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
               <input 
                  type="text" 
                  placeholder="Ask anything..." 
                  className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-colors"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
               />
               <button 
                onClick={handleSend}
                className="bg-purple-600 text-white px-5 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-purple-500/20"
               >
                  <Send size={18} />
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
