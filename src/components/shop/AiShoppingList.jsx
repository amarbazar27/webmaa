'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Camera, Loader2, ListPlus, X, ShoppingCart, Sparkles, RotateCcw, AlertTriangle, Search, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════════════════
// AI Shopping List — Production v3 (Full Fix)
// ═══════════════════════════════════════════════════════════════════════

function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export default function AiShoppingList({ shop, products, onAddToCart }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [lastImage, setLastImage] = useState(null);
  const [manualSearch, setManualSearch] = useState('');
  const fileInputRef = useRef(null);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Image Upload Handler ────────────────────────────────────────
  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setIsProcessing(true);

    try {
      for (const file of files) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name} অনেক বড় (১৫MB এর কম ছবি দিন)`);
          continue;
        }

        // iPhone HEIC check
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          toast.error('HEIC ফরম্যাট সাপোর্ট করে না। JPEG/PNG ছবি দিন।');
          continue;
        }

        try {
          const compressed = await compressImage(file);
          setLastImage(compressed);
          await processImage(compressed);
        } catch (compErr) {
          toast.error(`${file.name} প্রসেস করা যায়নি`);
        }
      }
    } catch (err) {
      setError('ছবি প্রসেস করতে সমস্যা হয়েছে।');
    } finally {
      resetInput();
      setIsProcessing(false);
    }
  }, [shop.id]);

  // ── Process Image via API ───────────────────────────────────────
  const processImage = async (base64Img) => {
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch('/api/ai-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          shopId: shop.id,
          imageBase64: base64Img
        })
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('সার্ভার থেকে ভুল রেসপন্স এসেছে');
      }

      if (!res.ok) {
        if (res.status === 429) {
          setError('অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।');
          toast.error('অনেক বেশি রিকোয়েস্ট। এক মিনিট পর চেষ্টা করুন।');
        } else {
          setError(`AI সমস্যা: ${data.error || 'Unknown error'}`);
          toast.error(data.error || 'AI প্রসেসিং ব্যর্থ');
        }
        return;
      }

      if (data.items && data.items.length > 0) {
        setDetectedItems(prev => [...prev, ...data.items]);
        setShowModal(true);
        toast.success(`${data.items.length}টি পণ্য পাওয়া গেছে!`);
      } else {
        setError('ছবি থেকে কোনো পণ্য সনাক্ত হয়নি। আবার চেষ্টা করুন।');
        toast.error('কোনো পণ্য সনাক্ত হয়নি।');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('টাইমআউট হয়েছে। ছোট ছবি দিয়ে আবার চেষ্টা করুন।');
        toast.error('টাইমআউট হয়েছে।');
      } else {
        setError(`AI সমস্যা: ${err.message || 'সার্ভারে সংযোগ করা যাচ্ছে না'}`);
        toast.error('AI কানেকশন ব্যর্থ।');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleRetry = () => {
    if (lastImage) {
      setIsProcessing(true);
      processImage(lastImage).finally(() => setIsProcessing(false));
    } else {
      fileInputRef.current?.click();
    }
  };

  const updateQuantity = (index, delta) => {
    setDetectedItems(prev => {
      const newItems = [...prev];
      const newQty = (newItems[index].quantity || 1) + delta;
      if (newQty < 1) return prev;
      newItems[index] = { ...newItems[index], quantity: newQty };
      return newItems;
    });
  };

  const removeItem = (index) => {
    setDetectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddAllToCart = () => {
    if (detectedItems.length === 0) return;

    const itemsToAdd = detectedItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (product && product.stock !== 0) {
        return { ...product, quantity: item.quantity || 1, note: 'AI Detected' };
      }
      return null;
    }).filter(Boolean);

    if (itemsToAdd.length === 0) {
      toast.error('স্টকে থাকা কোনো পণ্য পাওয়া যায়নি।');
      return;
    }

    onAddToCart(itemsToAdd);
    setShowModal(false);
    setLastImage(null);
    setDetectedItems([]);
  };

  // Manual search
  const filteredManualProducts = manualSearch.trim()
    ? products.filter(p =>
        p.name?.toLowerCase().includes(manualSearch.toLowerCase()) &&
        p.stock !== 0
      ).slice(0, 8)
    : [];

  const addManualItem = (product) => {
    setDetectedItems(prev => {
      const existing = prev.findIndex(i => i.productId === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantity: (updated[existing].quantity || 1) + 1 };
        return updated;
      }
      return [...prev, { productId: product.id, name: product.name, quantity: 1, confidence: 'high' }];
    });
    setManualSearch('');
    if (!showModal) setShowModal(true);
  };

  // Feature toggle
  if (shop.settings?.enableAiShoppingList === false) return null;

  const confidenceBadge = (level) => {
    if (level === 'low') return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-md border border-amber-200">
        <AlertTriangle size={10} /> AI নিশ্চিত নয়
      </span>
    );
    if (level === 'medium') return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-md border border-blue-200">
        সম্ভাব্য
      </span>
    );
    return null;
  };

  return (
    <>
      {/* Upload Box */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-purple-100 flex items-center justify-center shrink-0">
              <Sparkles className="text-purple-600" size={28} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">AI শপিং লিস্ট</h3>
              <p className="text-sm font-bold text-slate-600 mt-0.5">ফর্দের ছবি তুলুন বা গ্যালারি থেকে দিন!</p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto flex gap-2">
            {/* Hidden file input - positioned offscreen for iOS compatibility */}
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
              tabIndex={-1}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-6 py-3 bg-purple-600 text-white font-black rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none"
            >
              {isProcessing ? <><Loader2 className="animate-spin" size={18} /> প্রসেস হচ্ছে...</> : <><ImagePlus size={18} /> ছবি দিন</>}
            </button>
          </div>
        </div>

        {/* Error + Retry state */}
        {error && !isProcessing && (
          <div className="relative z-10 mt-4 bg-white border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-amber-700 flex-1">{error}</p>
            <button
              onClick={handleRetry}
              className="shrink-0 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-black text-xs rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> আবার চেষ্টা
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-in">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ListPlus className="text-purple-600" size={24} /> সনাক্তকৃত পণ্য ({detectedItems.length})
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
              {/* Manual search fallback */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ম্যানুয়ালি পণ্য খুঁজুন..."
                  value={manualSearch}
                  onChange={e => setManualSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-purple-500 transition-colors placeholder:text-slate-400"
                />
                {filteredManualProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                    {filteredManualProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addManualItem(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-purple-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                      >
                        <span className="text-sm font-bold text-slate-800 truncate">{p.name}</span>
                        <span className="text-xs font-black text-purple-600 shrink-0 ml-2">৳{p.price}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* আরেকটা ছবি আপলোড বাটন */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-2.5 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 font-black text-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ImagePlus size={16} /> আরেকটা ছবি যোগ করুন
              </button>

              {detectedItems.map((item, index) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;
                return (
                  <div key={`${item.productId}-${index}`} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      {product.imageUrl
                        ? <img src={product.imageUrl} loading="lazy" className="w-full h-full object-cover" alt={product.name} />
                        : <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-black">{product.name?.[0]}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm text-slate-900 truncate">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs font-bold text-purple-600">৳{product.price}</p>
                        {confidenceBadge(item.confidence)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => updateQuantity(index, -1)} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black text-sm">-</button>
                      <span className="w-6 text-center font-black text-sm">{item.quantity || 1}</span>
                      <button onClick={() => updateQuantity(index, 1)} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black text-sm">+</button>
                    </div>
                    <button onClick={() => removeItem(index)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                );
              })}

              {detectedItems.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <p className="font-bold text-sm">কোনো পণ্য যোগ করা হয়নি।</p>
                  <p className="text-xs mt-1">উপরে সার্চ বক্স ব্যবহার করে ম্যানুয়ালি যোগ করুন।</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.03)] safe-bottom">
              <button
                onClick={handleAddAllToCart}
                disabled={detectedItems.length === 0}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={20} strokeWidth={2.5} /> সব কার্টে যোগ করুন ({detectedItems.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
