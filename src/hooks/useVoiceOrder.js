'use client';
import { useState, useCallback, useRef } from 'react';
import { createRecognition, startListening, stopListening, isSupported } from '@/lib/speechRecognition';
import { speak } from '@/lib/tts';

/**
 * useVoiceOrder — Voice-based cart addition hook
 * Flow: Mic → STT → Gemini AI extract → structured JSON → cart
 */
export default function useVoiceOrder({ products, shopId, onAddToCart }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('bn-BD');
  const recRef = useRef(null);

  const processWithAI = useCallback(async (text) => {
    if (!text?.trim()) return;
    setIsProcessing(true);
    setError(null);

    const productList = products
      .filter(p => p.stock !== 0)
      .map(p => `${p.id}|${p.name}|${p.price}`)
      .join('\n');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          messages: [{
            role: 'user',
            content: `তুমি একটি বাজার সহকারী। ব্যবহারকারী বলেছে: "${text}"

এই পণ্যগুলো থেকে ম্যাচ করো (ID|নাম|দাম):
${productList}

শুধু JSON রিটার্ন করো এই ফরম্যাটে:
{"items":[{"id":"PRODUCT_ID","name":"পণ্যের নাম","quantity":1,"unit":"কেজি/লিটার/পিস", "customizedText":"৪০০ গ্রাম"}]}

যদি ইউজার কোনো নির্দিষ্ট পরিমাণ (যেমন: ৪০০ গ্রাম) বলে এবং বেস ইউনিট কেজি হয়, তবে quantity এর জায়গায় ১ দিবে এবং customizedText এ "৪০০ গ্রাম" লিখে দিবে। 
যদি কোনো পণ্য না মিলে, {"items":[]} রিটার্ন করো।`
          }]
        })
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '{"items":[]}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid AI response');

      const parsed = JSON.parse(jsonMatch[0]);
      const matched = (parsed.items || []).map(item => {
        const product = products.find(p => p.id === item.id && p.stock !== 0);
        if (!product) return null;
        return { product, quantity: Math.max(1, parseInt(item.quantity) || 1), unit: item.unit, customizedText: item.customizedText || '' };
      }).filter(Boolean);

      setVoiceResult(matched);

      if (matched.length > 0) {
        speak(`${matched.length}টি পণ্য পাওয়া গেছে। কার্টে যোগ করতে চাপুন।`);
      } else {
        speak('কোনো পণ্য মিলে যায়নি। আবার বলুন।');
        setError('পণ্য মিলে যায়নি। আরেকবার বলুন।');
      }
    } catch (e) {
      setError(`AI সমস্যা: ${e.message}`);
      speak('AI প্রসেস করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  }, [products, shopId]);

  const startVoice = useCallback(() => {
    if (!isSupported()) {
      setError('আপনার ব্রাউজার ভয়েস সাপোর্ট করে না। Chrome ব্যবহার করুন।');
      return;
    }
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setVoiceResult(null);

    const rec = createRecognition({
      lang,
      onResult: ({ final, interim }) => {
        if (final) setTranscript(prev => prev + final);
        setInterimTranscript(interim);
      },
      onEnd: () => {
        setIsListening(false);
        setInterimTranscript('');
        const finalText = recRef.current?._finalText || '';
        if (finalText) processWithAI(finalText);
      },
      onError: (msg) => {
        setIsListening(false);
        setError(msg);
      }
    });

    if (rec) {
      // Track final text in ref
      rec.onresult = (event) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }
        if (final) {
          recRef.current._finalText = (recRef.current._finalText || '') + final;
          setTranscript(prev => prev + final);
        }
        setInterimTranscript(interim);
      };
      recRef.current = rec;
      recRef.current._finalText = '';
      startListening(rec);
      setIsListening(true);
      speak('বলুন...', lang);
    }
  }, [lang, processWithAI]);

  const stopVoice = useCallback(() => {
    stopListening(recRef.current);
    setIsListening(false);
  }, []);

  const addVoiceResultToCart = useCallback(() => {
    if (!voiceResult || voiceResult.length === 0) return;
    voiceResult.forEach(({ product, quantity, customizedText }) => {
      onAddToCart({ ...product, quantity, note: 'Voice Order', customizedText });
    });
    speak(`${voiceResult.length}টি পণ্য কার্টে যোগ হয়েছে!`);
    setVoiceResult(null);
    setTranscript('');
  }, [voiceResult, onAddToCart]);

  return {
    isListening, transcript, interimTranscript, isProcessing,
    voiceResult, error, lang, setLang,
    startVoice, stopVoice, addVoiceResultToCart,
    isVoiceSupported: isSupported()
  };
}
