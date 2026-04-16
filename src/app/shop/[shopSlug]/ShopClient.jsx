'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Search, X, Plus, Minus, Phone, MapPin, 
  CheckCircle, Package, ArrowRight, Loader2, ShoppingCart,
  User, Download, LogOut, ArrowUpDown, Bot, MessageCircle, AlertCircle, Share, Settings,
  ChevronLeft, ChevronRight, Sparkles, Star, Flame, Gift, ExternalLink
} from 'lucide-react';
import { placeOrder, getOrderSerial, getUserStreak } from '@/lib/firestore';
import { logoutUser, loginWithGoogle } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

function validatePhone(phone) {
  return /^01[3-9]\d{8}$/.test(phone.replace(/\s/g, ''));
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
function ServiceBanner({ shop }) {
  const [status, setStatus] = useState('idle'); // idle | checking | available | unavailable | denied
  const [manualInput, setManualInput] = useState('');
  const serviceAreas = shop.serviceAreas || [];

  useEffect(() => {
    if (serviceAreas.length === 0) return;
    setStatus('checking');
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
            headers: { 'User-Agent': 'WebmaaShop/1.0' }
          });
          const data = await resp.json();
          const area = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
          const isAvailable = serviceAreas.some(sa => 
            area.toLowerCase().includes(sa.toLowerCase()) || sa.toLowerCase().includes(area.toLowerCase())
          );
          setStatus(isAvailable ? 'available' : 'unavailable');
        } catch {
          setStatus('denied');
        }
      },
      () => setStatus('denied')
    );
  }, [serviceAreas.length]);

  const checkManual = () => {
    if (!manualInput.trim()) return;
    const isAvailable = serviceAreas.some(sa =>
      manualInput.toLowerCase().includes(sa.toLowerCase()) || sa.toLowerCase().includes(manualInput.toLowerCase())
    );
    setStatus(isAvailable ? 'available' : 'unavailable');
  };

  if (serviceAreas.length === 0 || status === 'idle') return null;

  if (status === 'checking') return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center gap-2 text-blue-700 text-sm font-bold">
      <Loader2 size={14} className="animate-spin" /> আপনার এলাকায় সার্ভিস আছে কিনা যাচাই করা হচ্ছে...
    </div>
  );

  if (status === 'denied') return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-slate-600">আপনার এলাকার নাম লিখুন:</span>
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkManual()}
            placeholder="যেমন: Dhaka, Rangpur..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-purple-500"
          />
          <button onClick={checkManual} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-black hover:bg-purple-700 transition-colors">যাচাই করুন</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`border-b px-4 py-2 text-sm font-black ${status === 'available' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
      <div className="max-w-7xl mx-auto">
        {status === 'available' ? '✅ আপনার এলাকায় আমাদের সার্ভিস আছে!' : '❌ দুঃখিত, এই মুহূর্তে আপনার এলাকায় সার্ভিস নেই।'}
      </div>
    </div>
  );
}

export default function ShopClient({ initialShop, initialProducts, initialCategories }) {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [shop] = useState(initialShop);
  const [products] = useState(initialProducts);
  const [categories] = useState([{ id: 'all', name: 'সব' }, ...initialCategories]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [productNotes, setProductNotes] = useState({});
  const [activeBanner, setActiveBanner] = useState(0);
  const [pwaInstalled, setPwaInstalled] = useState(true); // hide by default
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null); // for PDF download
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '', note: '', txnId: '' });

  // ── PWA: show only if not installed ──────────────────────
  useEffect(() => {
    const installed = localStorage.getItem('pwa_installed');
    if (!installed) setPwaInstalled(false);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaInstalled(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
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
      toast('আপনার ব্রাউজার বা অ্যাপটি ইতিমধ্যেই ইন্সটল আছে।', { icon: 'ℹ️' });
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
      }
    });
    if (!user?.email || !shop?.id) setUserOrders([]);
  }, [user, shop?.id]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('সফলভাবে লগআউট হয়েছে');
      setIsProfileOpen(false);
      window.location.reload();
    } catch {
      toast.error('লগআউট করতে সমস্যা হয়েছে');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success('সফলভাবে লগইন হয়েছে!');
      setIsProfileOpen(false);
    } catch {
      toast.error('লগইন করতে সমস্যা হয়েছে');
    }
  };

  // ── AI Chat ────────────────────────────────────
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: 'bot', text: `আসসালামু আলাইকুম! আমি ${shop.aiConfig?.botName || 'Webmaa AI'}। ${shop.shopName}-এ আপনাকে স্বাগতম। কোনো প্রশ্ন থাকলে করুন!` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

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
          messages: [
            { role: 'system', content: `তুমি "${shop.shopName}"-এর AI shopping assistant। সবসময় "আসসালামু আলাইকুম" দিয়ে শুরু করবে। বাংলায় উত্তর দেবে। Admin panel-এর কোনো তথ্য দেবে না। পণ্যের তালিকা: ${products.slice(0,20).map(p=>`${p.name}: ৳${p.price}`).join(', ')}` },
            { role: 'user', content: text }
          ]
        })
      });
      const data = await resp.json();
      const botText = data.choices?.[0]?.message?.content || getSmartBotReply(text);
      setChatMessages(prev => [...prev, { id: Date.now()+1, role: 'bot', text: botText }]);
    } catch {
      setChatMessages(prev => [...prev, { id: Date.now()+1, role: 'bot', text: getSmartBotReply(text) }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // ── Filters & Sorting ──────────────────────────
  let filteredProducts = products.filter(p =>
    (activeCategory === 'All' || activeCategory === 'সব' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  filteredProducts = filteredProducts.sort((a, b) => {
    if (sortOption === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
    if (sortOption === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
    if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
    if (sortOption === 'name_desc') return b.name.localeCompare(a.name);
    return 0;
  });

  // ── Cart Actions ───────────────────────────────
  const addToCart = (product) => {
    const note = productNotes[product.id] || '';
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(prev => prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1, note: note || item.note } : item));
      toast.success(`${product.name} পরিমাণ বাড়ানো হয়েছে`);
    } else {
      setCart(prev => [...prev, { ...product, quantity: 1, note }]);
      toast.success(`${product.name} কার্টে যোগ করা হয়েছে!`);
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

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.error('কার্ট থেকে সরানো হয়েছে');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const deliveryAdvanceFee = shop.deliveryConfig?.advanceFee ? parseInt(shop.deliveryConfig.advanceFee) : 60;
  const isCOD = shop.deliveryConfig?.isCOD !== false;
  const isAdvanceRequired = !isCOD || (shop.deliveryConfig?.advanceFee && shop.deliveryConfig.advanceFee !== '0');
  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);

  // Free delivery from streak
  const { hasFreeDelivery } = getUserStreak(userOrders);
  const effectiveDelivery = hasFreeDelivery ? 0 : deliveryAdvanceFee;

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setOrderForm(f => ({ ...f, phone: val }));
    if (val.length === 11 && !validatePhone(val)) setPhoneError('বৈধ বাংলাদেশি নম্বর লিখুন (01X-XXXXXXXX)');
    else setPhoneError('');
  };

  // ── Place Order ────────────────────────────────
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!validatePhone(orderForm.phone)) {
      setPhoneError('বৈধ বাংলাদেশি নম্বর লিখুন। 01 দিয়ে শুরু করুন, মোট ১১ ডিজিট।');
      return;
    }
    setPlacing(true);
    try {
      const serial = await getOrderSerial(shop.id);
      const now = new Date();
      const dd = String(now.getDate()).padStart(2,'0');
      const mm = String(now.getMonth()+1).padStart(2,'0');
      const yyyy = now.getFullYear();
      const dateStr = `${dd}${mm}${yyyy}`;
      const orderIdVisual = `${serial}#${dateStr}`;

      const orderRef = await placeOrder(shop.id, {
        customerName: orderForm.name,
        customerPhone: orderForm.phone,
        customerEmail: user?.email || '',
        customerAddress: orderForm.address,
        customerNote: orderForm.note,
        transactionId: orderForm.txnId,
        orderIdVisual,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, note: i.note || '', isCustomized: i.isCustomized || false })),
        total: cartTotal + effectiveDelivery,
        isCOD,
        shopId: shop.id,
        shopName: shop.shopName,
        freeDelivery: hasFreeDelivery,
      });

      // Store order for PDF
      setOrderSuccess({
        orderIdVisual,
        items: cart,
        total: cartTotal + effectiveDelivery,
        deliveryFee: effectiveDelivery,
        customerName: orderForm.name,
        customerPhone: orderForm.phone,
        customerAddress: orderForm.address,
        customerNote: orderForm.note,
        shopName: shop.shopName,
        date: `${dd}/${mm}/${yyyy}`,
      });

      toast.success('অর্ডার সফলভাবে দেওয়া হয়েছে! 🎉');
      setCart([]);
      setIsOrderOpen(false);
      setIsCartOpen(false);
      setOrderForm({ name: '', phone: '', address: '', note: '', txnId: '' });

      if (user?.email) {
        import('@/lib/firestore').then(lib => lib.getUserOrders(shop.id, user.email).then(setUserOrders));
      }
    } catch (err) {
      console.error(err);
      toast.error('অর্ডার দিতে ব্যর্থ হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setPlacing(false);
    }
  };

  // ── PDF Generator (Bengali-safe via html2canvas) ──
  const generatePDF = async (orderData) => {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;padding:40px;background:white;font-family:Arial,sans-serif;direction:ltr';
    el.innerHTML = `
      <div style="text-align:center;border-bottom:3px solid #7c3aed;padding-bottom:20px;margin-bottom:20px">
        <h1 style="font-size:24px;font-weight:900;color:#1e293b;margin:0">${orderData.shopName}</h1>
        <p style="font-size:12px;color:#64748b;margin:4px 0 0">Order Receipt / অর্ডার রশিদ</p>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:16px">
        <div>
          <p style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin:0">Order ID</p>
          <p style="font-size:18px;font-weight:900;color:#7c3aed;margin:4px 0 0">#${orderData.orderIdVisual}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin:0">Date</p>
          <p style="font-size:14px;font-weight:700;color:#1e293b;margin:4px 0 0">${orderData.date}</p>
        </div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px">
        <p style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin:0 0 8px">Customer Info</p>
        <p style="margin:4px 0;font-size:13px;font-weight:700;color:#1e293b">${orderData.customerName} — ${orderData.customerPhone}</p>
        <p style="margin:4px 0;font-size:12px;color:#64748b">${orderData.customerAddress}</p>
        ${orderData.customerNote ? `<p style="margin:8px 0 0;font-size:11px;color:#7c3aed;font-style:italic">Note: ${orderData.customerNote}</p>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="background:#1e293b;color:white">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;border-radius:8px 0 0 0">Item</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;border-radius:0 8px 0 0">Price</th>
          </tr>
        </thead>
        <tbody>
          ${orderData.items.map((item, i) => `
            <tr style="background:${i%2===0?'white':'#f8fafc'}">
              <td style="padding:10px 12px;font-size:12px;font-weight:700;color:#1e293b">${item.name}${item.note ? `<br><span style="font-size:10px;color:#7c3aed;font-style:italic">${item.note}</span>` : ''}</td>
              <td style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;color:#64748b">${item.quantity}</td>
              <td style="padding:10px 12px;text-align:right;font-size:12px;font-weight:900;color:#1e293b">${String.fromCharCode(2547)}${(parseFloat(item.price)*item.quantity).toFixed(0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="border-top:2px solid #e2e8f0;padding-top:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:13px;color:#64748b;font-weight:600">Subtotal</span>
          <span style="font-size:13px;font-weight:700;color:#1e293b">${String.fromCharCode(2547)}${orderData.items.reduce((s,i)=>s+parseFloat(i.price)*i.quantity,0).toFixed(0)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:13px;color:#64748b;font-weight:600">Delivery</span>
          <span style="font-size:13px;font-weight:700;color:${orderData.deliveryFee===0?'#16a34a':'#1e293b'}">${orderData.deliveryFee===0?'FREE':String.fromCharCode(2547)+orderData.deliveryFee}</span>
        </div>
        <div style="display:flex;justify-content:space-between;background:#7c3aed;color:white;padding:14px 16px;border-radius:12px">
          <span style="font-size:16px;font-weight:900">Total</span>
          <span style="font-size:20px;font-weight:900">${String.fromCharCode(2547)}${orderData.total}</span>
        </div>
      </div>
      <p style="text-align:center;margin-top:20px;font-size:10px;color:#94a3b8">Thank you for shopping at ${orderData.shopName}!</p>
    `;
    document.body.appendChild(el);
    
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    document.body.removeChild(el);
    
    const pdf = new jsPDF({ unit: 'px', format: 'a4' });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Order_${orderData.orderIdVisual}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* ── Service Area Banner ── */}
      <ServiceBanner shop={shop} />

      {/* ── Marquee Notice ── */}
      {shop.notices && (
        <div className="bg-purple-600 text-white py-2 overflow-hidden flex whitespace-nowrap border-b border-purple-700">
          <div className="animate-marquee font-bold text-sm tracking-wide">{shop.notices}</div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-row-reverse justify-between items-center">
          {/* Logo/Brand (Right Side as requested) */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{shop.shopName}</h1>
            {shop.logoUrl ? (
              <img src={shop.logoUrl} className="w-10 h-10 md:w-12 md:h-12 rounded-xl border border-slate-200 object-cover shadow-sm" alt="Logo" />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-sm text-xl">{shop.shopName?.[0]}</div>
            )}
          </div>

          {/* Actions (Left side of the brand) */}
          <div className="flex items-center gap-2 md:gap-4">
            {userData?.role === 'staff' && userData?.accessShopId === shop.id && (
              <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-lg">
                <Settings size={15} /> <span className="hidden sm:inline">প্যানেলে যান</span>
              </button>
            )}

            {/* Cart */}
            <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-xl transition-colors shadow-sm">
              <ShoppingCart size={20} className="font-bold" />
              {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">{cartCount}</span>}
            </button>

            {/* App Download */}
            {!pwaInstalled && (
              <button onClick={handleAppDownload} className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors shadow-sm">
                <Download size={15} /> <span className="hidden sm:inline">অ্যাপ</span>
              </button>
            )}

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
                <img src={img} alt={`Banner ${i+1}`} className="w-full h-full object-cover" />
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
            {shop.coverImg && <img src={shop.coverImg} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />}
            <h2 className="relative z-10 text-3xl md:text-5xl font-black text-white drop-shadow-xl tracking-tight">{shop.welcomeMessage || 'স্বাগতম আমাদের স্টোরে!'}</h2>
          </div>
        )}
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">

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

          <div className="w-[1px] h-8 bg-slate-200 shrink-0 mx-1" />

          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.name)} className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-200 border ${activeCategory === c.name ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}>
              {c.name}
            </button>
          ))}
        </div>

        {/* ── Product Grid ── */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-300">
            <Package size={64} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
            <h3 className="text-2xl font-black text-slate-800">কোনো পণ্য পাওয়া যায়নি। 🥺</h3>
            <p className="text-slate-500 text-sm mt-3 font-semibold">অন্য ক্যাটাগরিতে খুঁজে দেখুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {filteredProducts.map(product => {
              const cartItem = cart.find(i => i.id === product.id);
              return (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-slate-200 flex flex-col">
                  {/* Image — clickable to detail page */}
                  <div className="relative h-44 sm:h-52 overflow-hidden bg-white border-b border-slate-100 cursor-pointer" onClick={() => router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/product/${product.id}`)}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                      {cartItem ? (
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
                      {/* Customize button — goes to detail page */}
                      {(product.allowCustomize || (product.sizes && product.sizes.length > 0)) && (
                        <button
                          onClick={() => router.push(`/shop/${shop.shopSlug || shop.subdomainSlug}/product/${product.id}`)}
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
                  <img src={shop.logoUrl} className="w-12 h-12 rounded-2xl border-2 border-purple-500/30 object-cover shadow-lg shadow-purple-900/30" alt="Logo" />
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
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">আমাদের সাথে যুক্ত থাকুন</h3>
              <div className="flex gap-3 flex-wrap">
                {shop.socialLinks?.fb && (
                  <a href={shop.socialLinks.fb} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 text-slate-400 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg font-black text-sm">
                    fb
                  </a>
                )}
                {shop.socialLinks?.insta && (
                  <a href={shop.socialLinks.insta} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gradient-to-br hover:from-pink-600 hover:to-orange-500 hover:border-pink-600 text-slate-400 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg font-black text-sm">
                    ig
                  </a>
                )}
                {shop.socialLinks?.yt && (
                  <a href={shop.socialLinks.yt} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600 hover:border-red-600 text-slate-400 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg font-black text-sm">
                    yt
                  </a>
                )}
                {shop.socialLinks?.wa && (
                  <a href={`https://wa.me/${shop.socialLinks.wa.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-600 hover:border-emerald-600 text-slate-400 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg font-black text-sm">
                    wa
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

      {/* ── AI Floating Companion ── */}
      <div className="fixed bottom-6 right-6 z-40 flex items-end gap-3 group">
        <div className="bg-slate-900 px-5 py-3 rounded-2xl rounded-br-none shadow-2xl border border-slate-700 text-sm font-black text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-2 mr-2">
          প্রশ্ন করুন! ✨
        </div>
        <button onClick={() => setIsAiOpen(true)} className="w-15 h-15 w-[60px] h-[60px] bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-white rounded-full shadow-[0_10px_25px_rgba(147,51,234,0.5)] flex items-center justify-center animate-bounce hover:scale-110 transition-transform relative overflow-hidden group">
          <span className="text-2xl drop-shadow-md group-hover:rotate-12 transition-transform">🤖</span>
        </button>
      </div>

      {/* ── ORDER SUCCESS + PDF DOWNLOAD ── */}
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

      {/* ── AI Chat Modal ── */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAiOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[60vh] max-h-[600px] border border-slate-200 animate-slide-in">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b-[4px] border-purple-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-2xl">🤖</div>
                <div>
                  <h3 className="font-black text-lg tracking-tight leading-tight">{shop.aiConfig?.botName || 'Bazar Bot'}</h3>
                  <p className="text-[10px] uppercase font-black text-purple-300 tracking-widest">AI Shopping Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsAiOpen(false)} className="hover:bg-white/20 p-2 rounded-xl text-slate-300 hover:text-white transition-colors"><X size={20} strokeWidth={2.5}/></button>
            </div>
            <div className="flex-1 p-4 bg-slate-50 flex flex-col gap-3 overflow-y-auto">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`max-w-[85%] p-3.5 rounded-2xl text-sm font-bold shadow-sm ${msg.role === 'bot' ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none self-start' : 'bg-purple-600 text-white rounded-tr-none self-end'}`}>
                  {isAiTyping && msg === chatMessages[chatMessages.length-1] && msg.role === 'bot' ? (
                    <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div>
                  ) : msg.text}
                </div>
              ))}
              {isAiTyping && <div className="max-w-[85%] p-3.5 rounded-2xl bg-white border border-slate-200 self-start flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div>}
            </div>
            <div className="p-3.5 bg-white border-t border-slate-200 flex gap-2">
              <input type="text" placeholder="ম্যাসেজ লিখুন..." className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-colors placeholder:text-slate-400" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage(chatInput)} />
              <button onClick={() => sendChatMessage(chatInput)} className="bg-slate-900 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors shadow-md"><MessageCircle size={20} strokeWidth={2.5}/></button>
            </div>
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
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-lg"><X size={16} strokeWidth={2.5} /></button>
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
                <button onClick={() => setIsOrderOpen(true)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-lg">
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
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">ঠিকানা *</label>
                  <textarea required rows={2} placeholder="বাসা/বাড়ি, রোড, এলাকা" className="w-full p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-sm font-black text-slate-900 outline-none focus:border-purple-600 focus:bg-white placeholder:font-bold placeholder:text-slate-400 transition-colors shadow-sm resize-none" value={orderForm.address} onChange={e => setOrderForm(f => ({ ...f, address: e.target.value }))} />
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
                      <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest block pl-1">ট্রানজেকশন আইডি (TxnID) *</label>
                        <input required type="text" placeholder="বিকাশ/নগদ/রকেট TxnID" className="w-full p-3.5 rounded-xl bg-white border-2 border-purple-300 text-sm font-black text-slate-900 outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/20 shadow-sm" value={orderForm.txnId} onChange={e => setOrderForm(f => ({ ...f, txnId: e.target.value }))} />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-slate-100 border-2 border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm text-slate-600 font-bold"><span>প্রোডাক্টস (×{cartCount})</span><span className="text-slate-900 font-black">৳{cartTotal}</span></div>
                <div className="flex justify-between text-sm text-slate-600 font-bold">
                  <span>ডেলিভারি চার্জ</span>
                  <span className={`font-black ${effectiveDelivery === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{effectiveDelivery === 0 ? 'FREE 🎁' : `৳${effectiveDelivery}`}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200 font-black text-slate-900 text-xl">
                  <span>সর্বমোট</span>
                  <span className="text-purple-700 text-2xl">৳{cartTotal + effectiveDelivery}</span>
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
              <p className="text-sm text-slate-300 font-bold relative z-10 mt-1">{user ? user.email : 'লগইন করা নেই'}</p>
            </div>

            <div className="flex-1 p-5 space-y-5 overflow-y-auto w-full">
              {!user ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 py-10">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><User size={40} /></div>
                  <div className="text-center">
                    <p className="font-black text-slate-900 text-lg">আপনি লগইন করেননি</p>
                    <p className="text-xs text-slate-500 font-bold mt-1">অর্ডার ইতিহাস ও ডেইলি স্ট্রিক দেখতে লগইন করুন।</p>
                  </div>
                  <button onClick={handleGoogleLogin} className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center gap-3 font-black text-slate-800 hover:bg-slate-50 transition-all shadow-sm">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt=""/>
                    গুগল দিয়ে লগইন
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-5">
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
                      <div key={order.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-purple-300 transition-colors cursor-pointer group" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                        <div className="p-4 bg-slate-50">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-1 rounded-md border border-purple-200">#{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</span>
                            <span className={`text-[11px] font-black px-2 py-1 rounded-md border ${order.status === 'completed' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : order.status === 'cancelled' ? 'text-red-700 bg-red-100 border-red-200' : 'text-amber-700 bg-amber-100 border-amber-200'}`}>{order.status || 'Pending'}</span>
                          </div>
                          <p className="font-extrabold text-slate-900 text-base">{order.items?.length || 0} Items <span className="text-purple-600">(৳{order.total?.toLocaleString()})</span></p>
                        </div>
                        {expandedOrder === order.id && (
                          <div className="p-4 border-t-2 border-slate-100 space-y-3">
                            <p className="text-xs font-bold text-slate-500 font-mono">তারিখ: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-GB') : 'Just now'}</p>
                            {order.returnNote && (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">রিটেইলার বার্তা</p>
                                <p className="text-sm font-bold text-amber-900">{order.returnNote}</p>
                              </div>
                            )}
                            {order.deliveryCountdownFormatted && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">ডেলিভারির সময়</p>
                                <p className="text-sm font-bold text-blue-900">{order.deliveryCountdownFormatted}</p>
                              </div>
                            )}
                            <button onClick={() => window.open(`/shop/${shop.shopSlug || shop.subdomainSlug}/invoice/${order.id}`, '_blank')} className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-md">
                              <Download size={14} strokeWidth={2.5}/> ইনভয়েস ডাউনলোড (PDF)
                            </button>
                          </div>
                        )}
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
