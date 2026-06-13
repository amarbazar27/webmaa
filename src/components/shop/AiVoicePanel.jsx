'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, ShoppingCart, X } from 'lucide-react';
import useVoiceOrder from '@/hooks/useVoiceOrder';
import toast from 'react-hot-toast';
import { ImagePlus, Sparkles } from 'lucide-react';

// Image compression helper
function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export default function AiVoicePanel({ shop, products, onAddToCart, onDirectOrder, isOpen, onClose, activeTab }) {
  const [textInput, setTextInput] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);
  const [imageError, setImageError] = useState(null);
  const [showMicHelp, setShowMicHelp] = useState(false);
  const [isInsecureContext, setIsInsecureContext] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isHttp = window.location.protocol === 'http:';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isHttp && !isLocal) {
        setIsInsecureContext(true);
      }
    }
  }, []);

  const {
    isListening, transcript, interimTranscript, isProcessing: isVoiceProcessing,
    voiceResult, error: voiceError, lang, setLang,
    startVoice, stopVoice, addVoiceResultToCart, isVoiceSupported
  } = useVoiceOrder({ products, shopId: shop.id, onAddToCart });

  const handleMicClick = useCallback(async () => {
    if (isListening) {
      stopVoice();
      return;
    }
    startVoice();
  }, [isListening, startVoice, stopVoice]);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      toast.success('মাইক্রোফোন অনুমতি সফল হয়েছে! 🎉');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (err) {
      toast.error('অনুমতি দেওয়া হয়নি। দয়া করে ব্রাউজার সেটিংস থেকে অনুমতি দিন।');
    }
  };

  // ── Image upload & OCR ───────────────────────────────────────────────────
  const handleImageSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error('ছবি ১৫MB এর কম হতে হবে'); return; }
    setImageError(null);
    setDetectedItems([]);
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      setImageFile(compressed);
    } catch { toast.error('ছবি প্রসেস করতে সমস্যা'); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleImageAreaClick = useCallback(async () => {
    // Try to request camera/file access (triggers browser prompt for camera on mobile)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
    } catch {}
    // Open file input regardless
    fileInputRef.current?.click();
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!imageFile) return;
    setIsProcessingImage(true);
    setImageError(null);
    try {
      const res = await fetch('/api/ai-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId: shop.id, imageBase64: imageFile })
      });
      const data = await res.json();
      if (!res.ok) { setImageError(data.error || 'AI বিশ্লেষণ ব্যর্থ'); return; }
      if (data.items?.length > 0) {
        setDetectedItems(data.items);
        toast.success(`${data.items.length}টি পণ্য সনাক্ত হয়েছে!`);
      } else {
        setImageError('ছবি থেকে কোনো পণ্য সনাক্ত হয়নি। স্পষ্ট বাংলা/ইংরেজি হাতের লেখার ছবি দিন।');
      }
    } catch (e) { setImageError(`সমস্যা: ${e.message}`); }
    finally { setIsProcessingImage(false); }
  }, [imageFile, shop.id]);

  // ── Text list analysis ───────────────────────────────────────────────────
  const analyzeText = useCallback(async () => {
    if (!textInput.trim()) return;
    setIsProcessingText(true);
    const productList = products.filter(p => p.stock !== 0).map(p => `${p.id}|${p.name}|${p.price}`).join('\n');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          messages: [{
            role: 'user',
            content: `এই বাজারের লিস্ট থেকে পণ্য বের করো:\n"${textInput}"\n\nউপলব্ধ পণ্য (ID|নাম|দাম):\n${productList}\n\nধন্যবাদ! শুধু JSON রিটার্ন করো এই ফরম্যাটে:\n{"items":[{"productId":"ID","name":"পণ্যের নাম","quantity":1,"unit":"কেজি/লিটার/পিস", "customizedText":"৪০০ গ্রাম", "note":"ভাল দেখে দিয়েন"}]}\n\n🔴 বিশেষ নির্দেশ:\n১. যদি ইউজার নির্দিষ্ট কোনো পরিমাণ বলে (যেমন: ৪০০ গ্রাম বা ২০ পিস), তবে quantity তে বেস ইউনিটের ভিত্তিতে সংখ্যা বা ১ দিবে এবং customizedText এ "৪০০ গ্রাম" বা "২০ পিস" লিখে দিবে।\n২. যদি ইউজার কোনো পণ্যের সাথে অতিরিক্ত নির্দেশনা বা অনুরোধ লেখে (যেমন: "ভাল দেখে দিয়েন", "পাকা লাল দেখে"), তবে তা "note" ফিল্ডে স্পষ্টভাবে লিখে দিবে।\n৩. যদি কোনো পণ্য না মিলে, {"items":[]} রিটার্ন করো。\n৪. একই পণ্যের বিভিন্ন রূপ (পিস বনাম কেজি): যদি কোনো পণ্যের একই নামে একাধিক ভেরিয়েশন/ইউনিট থাকে (যেমন: 'বয়লার মুরগি' পিস হিসেবে এবং কেজি হিসেবে আলাদা আলাদা পণ্য), তাহলে ইউজার যে পরিমাণটি চাইছে তার ইউনিট বা কথার ধরন দেখে সঠিক আইডি সিলেক্ট করবে। যেমন 'পিস' উল্লেখ থাকলে পিস ভেরিয়েশন এবং 'কেজি', 'গ্রাম' বা শুধু 'মুরগি' বা কোনো ইউনিট উল্লেখ না থাকলে কেজি ভেরিয়েশনটি বেছে নিবে।`
          }]
        })
      });
      const data = await res.json();
      if (data.error) { toast.error(`AI সমস্যা: ${data.error.message}`); return; }
      const content = data.choices?.[0]?.message?.content || '{"items":[]}';
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const mapped = (parsed.items || []).map(item => ({
          productId: item.productId || item.id,
          name: products.find(p => p.id === (item.productId || item.id))?.name || item.name,
          quantity: parseInt(item.quantity) || 1,
          customizedText: item.customizedText || '',
          note: item.note || '',
          confidence: 'high'
        })).filter(i => products.some(p => p.id === i.productId));
        setDetectedItems(mapped);
        if (mapped.length > 0) toast.success(`${mapped.length}টি পণ্য পাওয়া গেছে!`);
        else toast('কোনো পণ্য মিলে যায়নি।', { icon: 'ℹ️' });
      }
    } catch (e) { toast.error(`AI সমস্যা: ${e.message}`); }
    finally { setIsProcessingText(false); }
  }, [textInput, products, shop.id]);

  const addAllDetectedToCart = () => {
    const items = detectedItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;
      return { 
        ...product, 
        quantity: item.quantity || 1, 
        customizedText: item.customizedText || '', 
        note: item.note || (item.customizedText ? '' : 'AI Detected') 
      };
    }).filter(Boolean);
    if (items.length === 0) { toast.error('কোনো পণ্য পাওয়া যায়নি'); return; }
    onAddToCart(items);
    setDetectedItems([]);
    setImagePreview(null);
    setImageFile(null);
    setTextInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full">

      {/* ── Voice Tab ────────────────────────────────────────────────── */}
      {activeTab === 'voice' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
          {isInsecureContext ? (
            <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600 font-extrabold text-xl">
                🔒
              </div>
              <p className="text-sm font-extrabold text-red-800">
                নিরাপদ সংযোগ (HTTPS) প্রয়োজন
              </p>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                ব্রাউজারের নিরাপত্তা পলিসির কারণে শুধুমাত্র নিরাপদ সংযোগে (HTTPS) ভয়েস বা মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়। আপনি বর্তমানে অনিরাপদ সংযোগে (HTTP) আছেন।
              </p>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = `https://${window.location.host}${window.location.pathname}${window.location.search}`;
                  }
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                🔒 নিরাপদ HTTPS সংযোগে যান
              </button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600 mb-1">ভয়েসে বলুন: "২ কেজি আলু, ১ লিটার তেল"</p>
                <select value={lang} onChange={e => setLang(e.target.value)} className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 font-bold">
                  <option value="bn-BD">বাংলা</option>
                  <option value="en-US">English</option>
                </select>
              </div>

              {/* Mic button with both hold-to-talk and click-to-toggle modes */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleMicClick();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!isVoiceSupported || isVoiceProcessing) return;
                    startVoice();
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    if (isListening) stopVoice();
                  }}
                  onMouseLeave={() => {
                    if (isListening) stopVoice();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (!isVoiceSupported || isVoiceProcessing) return;
                    startVoice();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (isListening) stopVoice();
                  }}
                  disabled={!isVoiceSupported || isVoiceProcessing}
                  className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all select-none cursor-pointer
                    ${isListening ? 'bg-red-500 animate-pulse scale-110 active:scale-105' : isVoiceProcessing ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700 active:scale-95'}
                    text-white disabled:opacity-50`}
                  title="কথা বলতে ক্লিক করুন অথবা চেপে রাখুন"
                >
                  {isVoiceProcessing ? <Loader2 size={36} className="animate-spin" /> : isListening ? <MicOff size={36} strokeWidth={2.5} /> : <Mic size={36} strokeWidth={2.5} />}
                </button>
              </div>

              <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center leading-relaxed">
                {isListening ? '🔴 শুনছি... কথা শেষ হলে আবার বোতামে ক্লিক করুন বা ছেড়ে দিন' : isVoiceProcessing ? 'AI বিশ্লেষণ করছে...' : 'কথা বলতে বোতামে ক্লিক করুন অথবা চেপে রাখুন'}
              </p>

              {!isVoiceSupported && (
                <p className="text-xs font-bold text-amber-600 text-center bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  ভয়েসের জন্য Chrome বা Edge ব্রাউজার প্রয়োজন।
                </p>
              )}

              {(transcript || interimTranscript) && (
                <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                  <p className="text-sm font-bold text-slate-800">{transcript}<span className="text-slate-400 italic">{interimTranscript}</span></p>
                </div>
              )}

              {voiceError && (
                <div className="w-full space-y-3">
                  <p className="text-xs font-bold text-red-600 text-center bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{voiceError}</p>
                  {voiceError.includes('অনুমতি') && (
                    <>
                      <button
                        onClick={requestMicPermission}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        🎤 মাইক্রোফোন অনুমতি দিন
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMicHelp(true)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        ❓ কেন অন হচ্ছে না? (হেল্প গাইড)
                      </button>
                    </>
                  )}
                </div>
              )}

              {voiceResult && voiceResult.length > 0 && (
                <div className="w-full space-y-2">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">সনাক্তকৃত পণ্য:</p>
                  {voiceResult.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
                      <p className="text-sm font-bold text-slate-900">{item.product.name}</p>
                      <span className="text-xs font-black text-purple-600">×{item.quantity}</span>
                    </div>
                  ))}
                  <button onClick={addVoiceResultToCart} className="w-full py-3 bg-purple-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors">
                    <ShoppingCart size={16} /> কার্টে যোগ করুন
                  </button>
                </div>
              )}
            </>
          )}
          <button 
            onClick={onClose} 
            className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-black rounded-xl transition-all uppercase tracking-wider"
          >
            ❌ ভয়েস প্যানেল বন্ধ করুন
          </button>
        </div>
      )}

      {/* ── Image OCR Tab ────────────────────────────────────────────── */}
      {activeTab === 'image' && (
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />

          {!imagePreview ? (
            <div className="flex-1 flex flex-col gap-3">
              {/* Primary action: open file picker (triggers camera on mobile) */}
              <button
                onClick={handleImageAreaClick}
                className="flex-1 border-2 border-dashed border-purple-300 rounded-2xl flex flex-col items-center justify-center gap-3 p-8 hover:bg-purple-50 transition-colors cursor-pointer min-h-[200px]"
              >
                <ImagePlus size={48} className="text-purple-400" />
                <p className="font-black text-slate-700 text-center">বাজারের ফর্দের ছবি দিন</p>
                <p className="text-xs text-slate-400 text-center leading-relaxed">ক্যামেরায় তুলুন বা গ্যালারি থেকে বেছে নিন।<br />AI OCR দিয়ে পণ্য সনাক্ত হবে।</p>
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                ❓ ছবি সিলেক্ট করার সময় ব্রাউজার ক্যামেরা/ফাইলের অনুমতি চাইলে <strong>Allow</strong> করুন।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border-2 border-purple-200 max-h-52">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                <button onClick={() => { setImagePreview(null); setImageFile(null); setDetectedItems([]); setImageError(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-lg">
                  <X size={14} />
                </button>
              </div>

              {imageError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{imageError}</p>
              )}

              {detectedItems.length === 0 && (
                <button onClick={analyzeImage} disabled={isProcessingImage}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
                  {isProcessingImage
                    ? <><Loader2 size={16} className="animate-spin" /> AI বিশ্লেষণ হচ্ছে...</>
                    : <><Sparkles size={16} /> AI দিয়ে ফর্দ পড়ুন</>}
                </button>
              )}
            </div>
          )}

          {detectedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{detectedItems.length}টি পণ্য সনাক্ত:</p>
              {detectedItems.map((item, i) => {
                const prod = products.find(p => p.id === item.productId);
                if (!prod) return null;
                return (
                  <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{prod.name}</p>
                      {item.customizedText ? (
                        <p className="text-[10px] text-purple-600 font-black">{item.customizedText}</p>
                      ) : (
                        <p className="text-xs text-purple-600 font-black">৳{prod.price}</p>
                      )}
                    </div>
                    <span className="text-xs font-black bg-purple-100 text-purple-700 px-2 py-1 rounded-md">×{item.quantity}</span>
                  </div>
                );
              })}
              <button onClick={addAllDetectedToCart} className="w-full py-3 bg-purple-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-purple-700">
                <ShoppingCart size={16} /> সব কার্টে দিন ({detectedItems.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Text Analysis Tab ─────────────────────────────────────── */}
      {activeTab === 'text' && (
        <div className="flex-1 flex flex-col p-4 gap-4">
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder={"বাজারের লিস্ট লিখুন বা পেস্ট করুন...\nযেমন: ২ কেজি আলু, ১ কেজি পেঁয়াজ, ১ লিটার তেল"}
            rows={6}
            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-purple-600 resize-none placeholder:text-slate-400"
          />
          <button onClick={analyzeText} disabled={isProcessingText || !textInput.trim()}
            className="py-3 bg-purple-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50">
            {isProcessingText ? <><Loader2 size={16} className="animate-spin" /> বিশ্লেষণ হচ্ছে...</> : <><Sparkles size={16} /> AI দিয়ে বিশ্লেষণ করুন</>}
          </button>

          {detectedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{detectedItems.length}টি পণ্য পাওয়া গেছে:</p>
              {detectedItems.map((item, i) => {
                const prod = products.find(p => p.id === item.productId);
                if (!prod) return null;
                return (
                  <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{prod.name}</p>
                      {item.customizedText ? (
                        <p className="text-[10px] text-purple-600 font-black">{item.customizedText}</p>
                      ) : (
                        <p className="text-xs text-purple-600 font-black">৳{prod.price}</p>
                      )}
                    </div>
                    <span className="text-xs font-black bg-purple-100 text-purple-700 px-2 py-1 rounded-md">×{item.quantity}</span>
                  </div>
                );
              })}
              <button onClick={addAllDetectedToCart} className="w-full py-3 bg-purple-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-purple-700">
                <ShoppingCart size={16} /> সব কার্টে দিন ({detectedItems.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Mic Help Modal (Placed globally at the root level) ── */}
      {showMicHelp && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowMicHelp(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-800 animate-slide-in space-y-5">
            <div className="flex justify-between items-start">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">🎤 মাইক্রোফোন হেল্প গাইড</h4>
              <button type="button" onClick={() => setShowMicHelp(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed font-bold text-slate-600">
              <div className="space-y-1">
                <p className="text-slate-900 font-extrabold flex items-center gap-1">১. ব্রাউজার পারমিশন নিশ্চিত করুন:</p>
                <p className="pl-4">আপনার ব্রাউজারের অ্যাড্রেস বারের বাম পাশে (লক আইকন 🔒 অথবা সেটিংস আইকন) ক্লিক করুন। সেখানে **Microphone / মাইক্রোফোন** অপশনটি **Allow / অন** করা আছে কিনা চেক করুন। অফ থাকলে অন করে পেজটি রিফ্রেশ দিন।</p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-900 font-extrabold flex items-center gap-1">২. ডিভাইসের (Windows OS) পারমিশন দিন:</p>
                <p className="pl-4">যদি উইন্ডোজ ব্যবহার করেন, তবে **Start Menu &gt; Settings &gt; Privacy & Security &gt; Microphone** এ যান। সেখানে **"Microphone access"** এবং **"Let apps access your microphone"** অপশন দুটি চালু (ON) আছে কিনা নিশ্চিত করুন।</p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-900 font-extrabold flex items-center gap-1">৩. ব্যাকগ্রাউন্ড অ্যাপস চেক করুন:</p>
                <p className="pl-4">অন্য কোনো ব্যাকগ্রাউন্ড অ্যাপ (যেমন Zoom, MS Teams, Skype) মাইক্রোফোন ডিভাইসটি লক করে রেখেছে কিনা চেক করুন। প্রয়োজনে অন্য অ্যাপগুলো বন্ধ করে পুনরায় চেষ্টা করুন।</p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-900 font-extrabold flex items-center gap-1">৪. নিরাপদ সংযোগ (HTTPS) নিশ্চিত করুন:</p>
                <p className="pl-4">ব্রাউজারে নিরাপত্তা পলিসির কারণে অনিরাপদ লিংকে (HTTP) মাইক্রোফোন ব্লক থাকে। যদি ব্রাউজার পারমিশন না চায়, তবে অনুগ্রহ করে পেজটির ইউআরএল এর শুরুতে <strong>https://</strong> (যেমন: https://messerbazar.com) দিয়ে ভিজিট করুন।</p>
              </div>
            </div>

            <button type="button" onClick={() => setShowMicHelp(false)} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-colors uppercase tracking-wider cursor-pointer">
              ঠিক আছে, বুঝতে পেরেছি
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
