'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ShoppingCart, Plus, Minus, Sparkles, Loader2,
  CheckCircle, Package, Tag, Layers, MessageSquare, Info,
  Share2, Link as LinkIcon, Send, Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';
import ReviewSection from '@/components/shop/ReviewSection';
import { trackStoreEvent } from '@/components/shop/StoreAnalytics';

// Deterministic fallback colors
const FALLBACK_COLORS = ['bg-indigo-600','bg-emerald-600','bg-rose-600','bg-amber-600','bg-cyan-600','bg-fuchsia-600'];
function getFallbackColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export default function ProductDetailClient({ shop, product }) {
  const router = useRouter();
  const { user } = useAuth();

  // Variant State (Shopify style)
  const isLegacySizes = !product.variants && (product.sizes?.length > 0);
  const variants = product.variants || [];
  
  // For legacy sizes
  const sizes = product.sizes || [];
  const [selectedSize, setSelectedSize] = useState(sizes.length > 0 ? sizes[0] : null);

  // For new variants system
  const [selectedVariants, setSelectedVariants] = useState(() => {
    const init = {};
    variants.forEach(v => {
      if(v.options?.length) init[v.name] = v.options[0];
    });
    return init;
  });

  // Quantity
  const [qty, setQty] = useState(1);

  // Customization AI & Local Storage Memory
  const [customInput, setCustomInput] = useState('');
  const [aiPrice, setAiPrice] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [customerNote, setCustomerNote] = useState(() => {
    if (typeof window !== 'undefined') {
       return localStorage.getItem(`note_${product.id}`) || '';
    }
    return '';
  });

  // Cart (read from localStorage + sync)
  const CART_KEY = `cart_${shop.id}`;
  const getCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  };

  // ── SSR-safe page URL (prevents hydration mismatch) ──
  const [pageUrl, setPageUrl] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  const copyToClipboard = useCallback((url) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers / insecure contexts
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setLinkCopied(true);
      toast.success('লিংক কপি করা হয়েছে! 📋');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('লিংক কপি করা যায়নি।');
    }
  }, []);

  const handleShare = useCallback(async (platform) => {
    if (!pageUrl) return;
    trackStoreEvent('share', { content_type: 'product', item_id: product.id, method: platform || 'native' });

    if (platform) return; // Platform-specific links handle themselves

    const shareData = {
      title: `${product.name} - ${shop.shopName}`,
      text: product.description || `${shop.shopName}-এ দারুণ এই পণ্যটি দেখুন!`,
      url: pageUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(pageUrl);
        }
      }
    } else {
      copyToClipboard(pageUrl);
    }
  }, [pageUrl, product.id, product.name, product.description, shop.shopName, copyToClipboard]);

  // Price Calculation Logic
  let calculatedBasePrice = parseFloat(product.price) || 0;
  if (isLegacySizes && selectedSize) {
    calculatedBasePrice = parseFloat(selectedSize.price) || 0;
  } else if (!isLegacySizes && variants.length > 0) {
    let hasVariantPrice = false;
    let maxVariantPrice = 0;
    Object.values(selectedVariants).forEach(opt => {
      let p = parseFloat(opt.price);
      if (p > 0) {
        hasVariantPrice = true;
        if (p > maxVariantPrice) maxVariantPrice = p;
      }
    });
    if (hasVariantPrice) {
      calculatedBasePrice = maxVariantPrice;
    }
  }
  const basePrice = calculatedBasePrice;
  const displayPrice = aiPrice !== null ? aiPrice : basePrice * qty;

  // Auto-scroll to customization if parameter is set
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('customize') === 'true') {
        setTimeout(() => {
            const el = document.getElementById('customization-box');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }
  }, []);

  // Auto-save note
  useEffect(() => {
    localStorage.setItem(`note_${product.id}`, customerNote);
  }, [customerNote, product.id]);

  const handleQtyChange = (delta) => {
    setQty(prev => Math.max(1, Math.min(999, prev + delta)));
    setAiPrice(null); // reset AI price when qty changes
    setAiResult('');
  };

  const handleQtyInput = (e) => {
    const v = parseInt(e.target.value);
    if (!isNaN(v) && v >= 1) { setQty(v); setAiPrice(null); setAiResult(''); }
  };

  // AI price calculation
  const handleAiCalculate = async () => {
    if (!customInput.trim()) {
      toast.error('কাস্টমাইজ করতে কিছু লিখুন (যেমন: ১৫০ গ্রাম)');
      return;
    }
    setAiLoading(true);
    setAiResult('');
    setAiPrice(null);

    const shopApiKey = shop?.aiConfig?.apiKey;
    const systemPrompt = `তুমি একটি Bangladeshi retail shop-এর AI কাস্টমাইজেশন অ্যাসিস্ট্যান্ট। তোমার কাজ হলো ইউজারের রিকোয়েস্ট অনুযায়ী সঠিক মূল্য (Price) এবং পরিমাণের হিসাব করা।

📦 প্রোডাক্টের তথ্য:
- নাম: ${product.name}
- বেস মূল্য: ৳${basePrice} (${product.unit || 'প্রতি ইউনিট'})

🧠 তোমার বিচারবুদ্ধি (Logic):
১. **টাকা ভিত্তিক (Budget):** ইউজার যদি "টাকা", "tk", "taka", "৳" উল্লেখ করে (যেমন: "১৫০ টাকার তেল", "100 tk"), তবে সেটা সরাসরি মূল্য (PRICE = ১৫০)। ঐ টাকায় কতটুকু (gram/kg/pcs) পাওয়া যাবে তা হিসাব করে QUANTITY_NOTE এ লিখবে (যেমন: "১৫০ টাকায় পাবেন ৯০০ গ্রাম")।
২. **পরিমাণ ভিত্তিক (Quantity):** যদি ইউজার গ্রাম, কেজি, বা পিস উল্লেখ করে (যেমন: "১৫০ গ্রাম" বা "2 kg", "250g"), তখন ঐ পরিমাণের দাম বের করো (PRICE = দাম)। 
   - হিসাব: (বেস মূল্য / ১০০০) * গ্রামের পরিমাণ। 
   - QUANTITY_NOTE এ লিখবে "১৫০ গ্রামের দাম"।
৩. **উত্তর ফরম্যাট:**
   - সংক্ষেপে বাংলায় ব্যাখ্যা দাও।
   - উত্তরের শেষে অবশ্যই "PRICE: [number]" লিখবে (শুধুমাত্র সংখ্যা)।
   - এবং "QUANTITY_NOTE: [পরিমাণ বা টাকার হিসাব]" লিখবে।`;

    try {
      const resp = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: customInput }
          ]
        })
      });
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      // Extract price from response
      const priceMatch = text.match(/PRICE:\s*(\d+(\.\d+)?)/i);
      const noteMatch = text.match(/QUANTITY_NOTE:\s*(.+)/i);
      if (priceMatch) {
        const calculatedPrice = parseFloat(priceMatch[1]);
        setAiPrice(calculatedPrice);
        
        let displayResult = text.replace(/PRICE:\s*[\d.]+/i, '').replace(/QUANTITY_NOTE:\s*.+/i, '').trim();
        if (noteMatch) {
           setCustomInput(noteMatch[1].trim()); // Store the calculated note as the custom text for cart
        }
        setAiResult(displayResult || noteMatch?.[1] || 'ক্যালকুলেশন সম্পন্ন হয়েছে।');
      } else {
        setAiResult(text || 'মূল্য নির্ধারণ করতে পারিনি। আবার চেষ্টা করুন।');
      }
    } catch (err) {
      setAiResult('AI সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddToCart = () => {
    // 🚨 Stock guard
    if (product.stock === 0) {
      toast.error('এই পণ্যটি বর্তমানে স্টকে নেই।');
      return;
    }

    const cart = getCart();
    const finalPrice = aiPrice !== null ? aiPrice : basePrice * qty;

    // 🚨 Price sanity check
    if (finalPrice <= 0 || isNaN(finalPrice)) {
      toast.error('মূল্য সঠিক নয়। আবার চেষ্টা করুন।');
      return;
    }
    
    // Build variants summary
    let variantString = '';
    if (isLegacySizes && selectedSize) {
      variantString = selectedSize.label;
    } else if (!isLegacySizes && variants.length > 0) {
      variantString = Object.entries(selectedVariants).map(([name, opt]) => `${name}: ${opt.label}`).join(', ');
    }
    
    const cartItem = {
      id: product.id + (variantString ? `_${variantString.replace(/\s+/g, '-')}` : '') + (customInput ? `_custom_${Date.now()}` : ''),
      productId: product.id,
      name: product.name + (variantString ? ` (${variantString})` : ''),
      price: aiPrice !== null ? aiPrice / qty : basePrice,
      realBasePrice: basePrice, // Keep track of the original unit price
      quantity: qty,
      imageUrl: product.imageUrl || '',
      note: customerNote || '',
      isCustomized: aiPrice !== null,
      customizedPrice: aiPrice,
      baseUnit: product.unit || '',
      customizedText: customInput || '',
      variantsText: variantString
    };
    
    // Check if same non-customized product already exists
    const existingIdx = cart.findIndex(i => i.id === cartItem.id);
    if (existingIdx >= 0 && !cartItem.isCustomized) {
      cart[existingIdx].quantity += qty;
    } else {
      cart.push(cartItem);
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    trackStoreEvent('add_to_cart', { id: product.id, name: product.name, price: cartItem.price, quantity: qty });
    toast.success(`${product.name} কার্টে যোগ হয়েছে! 🛒`);
    setTimeout(() => router.back(), 300);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <div>
            <h1 className="font-black text-slate-900 text-lg leading-tight truncate">{product.name}</h1>
            <p className="text-xs text-slate-500 font-bold">{shop.shopName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Product Image */}
        <div className="relative w-full h-72 rounded-3xl overflow-hidden shadow-xl bg-white border border-slate-200">
          {product.imageUrl ? (
            <Image 
              src={product.imageUrl} 
              alt={product.name} 
              fill
              priority
              className="object-cover" 
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${getFallbackColor(product.name)}`}>
              <h2 className="text-4xl font-black text-white drop-shadow-xl text-center px-4">{product.name}</h2>
            </div>
          )}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-slate-900 px-4 py-2 rounded-2xl text-lg font-black shadow-xl border border-slate-200/50">
            ৳{selectedSize ? selectedSize.price : product.price}
          </div>
          {product.category && (
            <div className="absolute top-4 left-4 bg-purple-600/90 text-white px-3 py-1.5 rounded-xl text-xs font-black backdrop-blur-sm">
              {product.category}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{product.name}</h2>
            {product.description && (
              <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">{product.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100">
              <Tag size={16} className="text-purple-600" />
              <span className="font-black text-purple-700 text-lg">৳{selectedSize ? selectedSize.price : product.price}</span>
              {product.unit && <span className="text-xs text-purple-500 font-bold">/{product.unit}</span>}
            </div>
            {product.stock > 0 ? (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${product.stock <= 5 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-100'}`}>
                <CheckCircle size={16} className={product.stock <= 5 ? 'text-amber-600' : 'text-emerald-600'} />
                <span className={`font-black text-sm ${product.stock <= 5 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {product.stock <= 5 ? `স্টক প্রায় শেষ (${product.stock} পিস)` : `স্টকে আছে (${product.stock} পিস)`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                <Package size={16} className="text-red-500" />
                <span className="text-red-600 font-black text-sm">স্টক শেষ</span>
              </div>
            )}
          </div>
        </div>

        {/* Variants UI (New Shopify-style) */}
        {!isLegacySizes && variants.length > 0 && (
          <div className="space-y-4">
            {variants.map((variant, vIdx) => (
              <div key={vIdx} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Layers size={18} className="text-slate-600" />
                  <h3 className="font-black text-slate-900">{variant.name} বেছে নিন</h3>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {variant.options?.map((opt, oIdx) => {
                    const isSelected = selectedVariants[variant.name]?.label === opt.label;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => {
                          setSelectedVariants(prev => ({ ...prev, [variant.name]: opt }));
                          setAiPrice(null);
                          setAiResult('');
                        }}
                        className={`min-w-[4rem] px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm ring-1 ring-purple-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
                        }`}
                      >
                        {opt.label}
                        {parseFloat(opt.price) > 0 && (
                          <span className={`block text-[10px] mt-0.5 font-bold ${isSelected ? 'text-purple-600' : 'text-slate-500'}`}>
                            ৳{opt.price}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legacy Size Variants */}
        {isLegacySizes && sizes.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={18} className="text-slate-600" />
              <h3 className="font-black text-slate-900">সাইজ বেছে নিন</h3>
            </div>
            <div className="flex gap-3 flex-wrap">
              {sizes.map((size, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedSize(size); setAiPrice(null); setAiResult(''); }}
                  className={`px-5 py-3 rounded-2xl font-black text-sm transition-all border-2 ${
                    selectedSize?.label === size.label
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-purple-400 hover:text-purple-700'
                  }`}
                >
                  {size.label}
                  <span className={`block text-xs mt-0.5 font-bold ${selectedSize?.label === size.label ? 'text-slate-300' : 'text-slate-400'}`}>
                    ৳{size.price}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Control */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-black text-slate-900 mb-4">পরিমাণ</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleQtyChange(-1)}
              className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors font-black border border-slate-200"
            >
              <Minus size={18} strokeWidth={2.5} />
            </button>
            <input
              type="number"
              min="1"
              max="999"
              value={qty}
              onChange={handleQtyInput}
              className="w-20 text-center text-2xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl py-2.5 outline-none focus:border-purple-600 transition-colors"
            />
            <button
              onClick={() => handleQtyChange(1)}
              className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors font-black shadow-lg"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
            <div className="ml-auto text-right">
              <p className="text-xs text-slate-500 font-bold">মোট মূল্য</p>
              <p className="text-2xl font-black text-purple-700">৳{(basePrice * qty).toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Customer Note Field (Manual Instructions) */}
        {product.allowNote && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                 <MessageSquare size={18} />
               </div>
               <div>
                 <h3 className="font-black text-slate-900">বিশেষ নির্দেশনা (Special Note)</h3>
                 <p className="text-xs text-slate-500 font-bold">আপনার কোনো অনুরোধ থাকলে এখানে লিখুন (সর্বোচ্চ ৪০ অক্ষর)</p>
               </div>
             </div>
             <textarea
               rows={2}
               maxLength={40}
               placeholder={`যেমন: "বেশি ঝাল দিবেন না" বা "প্যাক করে পাঠাবেন"...`}
               className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-all resize-none"
               value={customerNote}
               onChange={e => setCustomerNote(e.target.value)}
             />
             <div className="flex justify-end text-[10px] uppercase font-black text-slate-400">{(customerNote || '').length}/40</div>
          </div>
        )}

        {/* AI Customization Box */}
        {product.allowCustomize && (
          <div id="customization-box" className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border-2 border-indigo-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">কাস্টম অর্ডার</h3>
                <p className="text-xs text-slate-500 font-bold">AI দিয়ে মূল্য জানুন</p>
              </div>
            </div>

            <textarea
              rows={3}
              maxLength={50}
              placeholder={`সর্বোচ্চ ৫০ অক্ষর। উদাহরণ: "১৫০ গ্রাম চাই" বা "৩ পিস ছোট সাইজ"...`}
              className="w-full p-4 rounded-2xl bg-white border-2 border-indigo-200 text-sm font-bold text-slate-900 outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all resize-none placeholder:font-medium placeholder:text-slate-400"
              value={customInput}
              onChange={e => { 
                const val = e.target.value;
                setCustomInput(val); 
                setAiPrice(null); 
                setAiResult(''); 
                // Auto-save logic (could persist across reloads if requested)
              }}
            />
            <div className="flex justify-end text-[10px] uppercase font-black text-slate-400">{customInput.length}/50</div>

            {aiResult && (
              <div className="bg-white rounded-2xl border border-indigo-200 p-4">
                <p className="text-sm font-bold text-slate-700 leading-relaxed">{aiResult}</p>
                {aiPrice !== null && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">কাস্টম মূল্য:</span>
                    <span className="text-2xl font-black text-purple-700">৳{aiPrice}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleAiCalculate}
              disabled={aiLoading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
            >
              {aiLoading ? <><Loader2 size={18} className="animate-spin" /> AI গণনা করছে...</> : <><Sparkles size={18} /> মূল্য জানুন (AI)</>}
            </button>
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-purple-600 transition-all shadow-xl"
        >
          <ShoppingCart size={22} strokeWidth={2.5} />
          কার্টে যোগ করুন
          <span className="bg-white/20 px-3 py-1 rounded-xl text-sm">
            ৳{aiPrice !== null ? aiPrice : (basePrice * qty).toFixed(0)}
          </span>
        </button>

        {/* ── Verified Buyer Reviews ── */}
        <ReviewSection shopId={shop.id} productId={product.id} />

        <div className="h-8" />
      </div>

      {/* Floating Share Button */}
      {(shop.settings?.enableProductSharing ?? true) && pageUrl && (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 group">
          <div className="hidden group-hover:flex flex-col gap-2 mb-2 transition-all duration-300 origin-bottom">
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => handleShare('facebook')}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
            </a>
            <a 
              href={`https://wa.me/?text=${encodeURIComponent(product.name + ' - ' + pageUrl)}`}
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => handleShare('whatsapp')}
              className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.065-.301-.15-1.265-.462-2.406-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.295-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.098-.21.046-.395-.03-.546-.073-.15-.673-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345z" clipRule="evenodd" /><path fillRule="evenodd" d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.46 0 .104 5.334.104 11.894c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.65c1.745.95 3.68 1.46 5.695 1.46 6.585 0 11.941-5.344 11.941-11.904 0-3.181-1.24-6.165-3.45-8.457zM12.045 21.84c-1.78 0-3.52-.48-5.045-1.38l-.36-.21-3.75.975.99-3.645-.24-.375C2.7 15.69 2.155 13.82 2.155 11.894c0-5.435 4.43-9.855 9.89-9.855 2.64 0 5.115 1.02 6.98 2.895 1.86 1.86 2.88 4.335 2.88 6.96 0 5.42-4.43 9.856-9.86 9.856z" clipRule="evenodd" /></svg>
            </a>
            <a 
              href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(product.name)}`}
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => handleShare('telegram')}
              className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
               <Send size={18} className="-ml-1" />
            </a>
            <button 
              onClick={() => { copyToClipboard(pageUrl); handleShare('copy'); }}
              className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all ${linkCopied ? 'bg-emerald-500' : 'bg-slate-800'}`}
            >
               {linkCopied ? <Check size={18} /> : <LinkIcon size={18} />}
            </button>
          </div>
          <button
            onClick={() => handleShare()}
            className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/50 text-slate-800 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white hover:scale-105 transition-all z-50 ring-4 ring-purple-500/10"
          >
            <Share2 size={24} className="text-purple-600" />
          </button>
        </div>
      )}
    </div>
  );
}
