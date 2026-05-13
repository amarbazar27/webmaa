'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, ShoppingCart, X } from 'lucide-react';
import useVoiceOrder from '@/hooks/useVoiceOrder';
import useMicrophonePermission from '@/hooks/useMicrophonePermission';
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
  const { permissionState, error: micHookError, requestMicrophone, stopMicrophone: stopMicStream, isSupported: isMicSupported } = useMicrophonePermission();
  const [textInput, setTextInput] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  const {
    isListening, transcript, interimTranscript, isProcessing: isVoiceProcessing,
    voiceResult, error: voiceError, lang, setLang,
    startVoice, stopVoice, addVoiceResultToCart, isVoiceSupported
  } = useVoiceOrder({ products, shopId: shop.id, onAddToCart });

  // ── Clean up stream on modal close ───────────────────────────────
  useEffect(() => {
    if (!isOpen) stopMicStream();
  }, [isOpen, stopMicStream]);

  // ── Request microphone permission FIRST, then start voice ────────────────
  const handleMicClick = useCallback(async () => {
    if (isListening) {
      stopVoice();
      stopMicStream();
      return;
    }

    if (permissionState === 'granted') {
      startVoice();
      return;
    }

    // Direct request without setTimeout to preserve user-gesture token for Safari/iOS
    const granted = await requestMicrophone();
    if (granted) {
      toast.success('মাইক্রোফোন অ্যাক্সেস পাওয়া গেছে!', { duration: 2000 });
      setTimeout(() => startVoice(), 300);
    } else {
      toast.error('মাইক্রোফোন অ্যাক্সেস পাওয়া যায়নি।', { duration: 4000 });
    }
  }, [isListening, permissionState, startVoice, stopVoice, requestMicrophone, stopMicStream]);

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
            content: `এই বাজারের লিস্ট থেকে পণ্য বের করো:\n"${textInput}"\n\nউপলব্ধ পণ্য (ID|নাম|দাম):\n${productList}\n\nশুধু এই JSON দাও: {"items":[{"productId":"ID","quantity":1}]}`
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
      return { ...product, quantity: item.quantity || 1, note: 'AI Detected' };
    }).filter(Boolean);
    if (items.length === 0) { toast.error('কোনো পণ্য পাওয়া যায়নি'); return; }
    items.forEach(item => onAddToCart(item));
    toast.success(`${items.length}টি পণ্য কার্টে যোগ হয়েছে!`);
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
          <div className="text-center">
            <p className="text-sm font-bold text-slate-600 mb-1">ভয়েসে বলুন: "২ কেজি আলু, ১ লিটার তেল"</p>
            <select value={lang} onChange={e => setLang(e.target.value)} className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 font-bold">
              <option value="bn-BD">বাংলা</option>
              <option value="en-US">English</option>
            </select>
          </div>

          {/* Permission denied banner */}
          {permissionState === 'denied' && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-3">
              <p className="text-sm font-black text-amber-700">🎤 মাইক্রোফোন অ্যাক্সেস দিন</p>
              <p className="text-[11px] text-amber-600 leading-relaxed">
                নিচের বাটনে ক্লিক করুন। ব্রাউজার অনুমতি চাইলে <strong>Allow</strong> করুন।
              </p>
              <button
                onClick={handleMicClick}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl text-sm font-black hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Mic size={16} /> মাইক্রোফোন Allow করুন
              </button>
              <p className="text-[10px] text-amber-500">
                কাজ না করলে: ব্রাউজারের Address bar-এ 🔒 আইকনে ক্লিক করে Microphone Allow করুন।
              </p>
            </div>
          )}
          
          {permissionState === 'unsupported' && (
            <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 text-center space-y-2">
              <p className="text-xs font-black text-red-700">ব্রাউজার সাপোর্ট করে না</p>
              <p className="text-[11px] text-red-600">{micHookError}</p>
            </div>
          )}

          {/* Mic button */}
          {permissionState !== 'denied' && permissionState !== 'unsupported' && (
            <button
              onClick={handleMicClick}
              disabled={!isVoiceSupported || isVoiceProcessing || permissionState === 'requesting'}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all
                ${isListening ? 'bg-red-500 animate-pulse scale-110' : isVoiceProcessing || permissionState === 'requesting' ? 'bg-purple-400' : (permissionState === 'loading' || permissionState === 'prompt') ? 'bg-slate-700 hover:bg-slate-900' : 'bg-purple-600 hover:bg-purple-700'}
                text-white disabled:opacity-50`}
            >
              {isVoiceProcessing || permissionState === 'requesting' ? <Loader2 size={36} className="animate-spin" /> : isListening ? <MicOff size={36} strokeWidth={2.5} /> : <Mic size={36} strokeWidth={2.5} />}
            </button>
          )}

          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {isListening ? '🔴 শুনছি...' : isVoiceProcessing ? 'AI বিশ্লেষণ করছে...' : permissionState === 'requesting' ? 'অনুমতি চাওয়া হচ্ছে...' : (permissionState === 'loading' || permissionState === 'prompt') ? 'মাইক বাটনে চাপুন (অ্যাক্সেস চাইবে)' : 'মাইক বাটনে চাপুন'}
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

          {voiceError && !voiceError.includes('অনুমতি') && (
            <p className="text-xs font-bold text-red-600 text-center bg-red-50 px-3 py-2 rounded-xl">{voiceError}</p>
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
                    <div><p className="text-sm font-bold text-slate-900">{prod.name}</p><p className="text-xs text-purple-600 font-black">৳{prod.price}</p></div>
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
                    <div><p className="text-sm font-bold text-slate-900">{prod.name}</p><p className="text-xs text-purple-600 font-black">৳{prod.price}</p></div>
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
    </div>
  );
}
