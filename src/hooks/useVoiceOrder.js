'use client';
import { useState, useCallback, useRef } from 'react';
import { createRecognition, startListening, stopListening, isSupported } from '@/lib/speechRecognition';
import { speak } from '@/lib/tts';

/**
 * useVoiceOrder — Conversational Voice Agent hook
 * Flow: Mic → STT → Gemini AI conversational flow → auto-speak response → auto-restart mic
 */
export default function useVoiceOrder({ products, shopId, onAddToCart }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('bn-BD');
  const [conversationHistory, setConversationHistory] = useState([]);
  
  const recRef = useRef(null);
  const isVoiceActiveRef = useRef(false);

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
          messages: [
            {
              role: 'system',
              content: `তুমি একটি ভার্চুয়াল ভয়েস শপিং অ্যাসিস্ট্যান্ট (বাজার সহকারী)। ব্যবহারকারীর সাথে সরাসরি কথা বলছ। তাই উত্তর সবসময় খুব সংক্ষিপ্ত এবং বন্ধুত্বপূর্ণ রাখবে (সর্বোচ্চ ৩-৪ বাক্য)। বাংলায় উত্তর দিবে।
              
পণ্য তালিকা (ID|নাম|দাম):
${productList}

🔴 বিশেষ নির্দেশ:
১. যদি ইউজার কোনো প্রোডাক্ট এড করতে চায়, অথবা কোনো ওজনের কথা বলে, তবে সেই অনুযায়ী ম্যাচ করে উত্তরের একদম শেষে PRODUCTS_JSON:[...] ফরম্যাটে ডাটা দিবে।
২. ফরমেট: PRODUCTS_JSON:[{"id":"PRODUCT_ID","qty":1,"customizedText":"৪০০ গ্রাম","note":"পিস করে দিন"}]
৩. ইউজারকে JSON বা PRODUCTS_JSON কোড নিয়ে কোনো কিছু মুখে বলবে না বা উল্লেখ করবে না। ইউজারকে শুধুমাত্র মুখে বলার টেক্সট উত্তরটিই দিবে, যেমন: 'আমি ৫ কেজি আলু এবং ৫০০ গ্রাম পেঁয়াজ আপনার কার্টে যোগ করে দিয়েছি। আর কিছু লাগবে?'
৪. যদি ইউজার জাস্ট প্রশ্ন করে (যেমন: আলুর দাম কত?), তবে শুধু উত্তর দাও, কোনো PRODUCTS_JSON দেওয়ার প্রয়োজন নেই।`
            },
            ...conversationHistory,
            { role: 'user', content: text }
          ]
        })
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || 'কোনো পণ্য পাওয়া যায়নি।';
      
      // Update local history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: content }
      ].slice(-8));

      // Extract PRODUCTS_JSON
      const jsonMatch = content.match(/PRODUCTS_JSON:(\[.*?\])/s);
      let matched = [];
      if (jsonMatch) {
        try {
          const items = JSON.parse(jsonMatch[1]);
          matched = items.map(item => {
            let product = products.find(p => p.id === item.id && p.stock !== 0);
            if (!product && item.name) {
              product = products.find(p => p.name.toLowerCase() === item.name.toLowerCase() && p.stock !== 0);
            }
            if (!product && item.name) {
              const itemWords = item.name.toLowerCase().split(/[\s,()]+/).filter(w => w.length >= 2);
              product = products.find(p => {
                if (p.stock === 0) return false;
                const pWords = p.name.toLowerCase().split(/[\s,()]+/).filter(w => w.length >= 2);
                const overlap = pWords.filter(w => itemWords.includes(w)).length;
                return overlap >= Math.ceil(pWords.length * 0.7);
              });
            }

            if (!product) return null;
            return {
              product,
              quantity: Math.max(1, parseInt(item.quantity) || 1),
              customizedText: item.customizedText || '',
              note: item.note || ''
            };
          }).filter(Boolean);
        } catch (e) {
          console.warn('Failed to parse voice items JSON', e);
        }
      }

      setVoiceResult(matched);

      // Perform actions based on extracted items
      if (matched.length > 0) {
        const itemsToPayload = matched.map(({ product, quantity, customizedText, note }) => ({
          ...product,
          quantity,
          note: note || 'Voice Order',
          customizedText
        }));
        onAddToCart(itemsToPayload);
      }

      // Voice back the response (stripping the JSON part)
      const voiceText = content.replace(/PRODUCTS_JSON:[\s\S]*$/, '').trim();
      speak(voiceText, lang, () => {
        // Auto-restart microphone once bot finishes speaking
        if (isVoiceActiveRef.current) {
          restartListeningLoop();
        }
      });

    } catch (e) {
      setError(`AI সমস্যা: ${e.message}`);
      speak('দুঃখিত, এআই কানেকশন ফেইল করেছে। আবার বলুন।', lang, () => {
        if (isVoiceActiveRef.current) restartListeningLoop();
      });
    } finally {
      setIsProcessing(false);
    }
  }, [products, shopId, conversationHistory, lang, onAddToCart]);

  const restartListeningLoop = useCallback(() => {
    if (!isVoiceActiveRef.current) return;
    setTranscript('');
    setInterimTranscript('');
    setError(null);

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
        if (finalText) {
          processWithAI(finalText);
        } else if (isVoiceActiveRef.current) {
          // If ended with no text, restart listening to keep loop alive
          restartListeningLoop();
        }
      },
      onError: (msg) => {
        setIsListening(false);
        // Avoid looping on repeated error notifications
        if (msg !== 'no-speech') {
          setError(msg);
        } else if (isVoiceActiveRef.current) {
          restartListeningLoop();
        }
      }
    });

    if (rec) {
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
      setIsListening(true);
      startListening(rec);
    }
  }, [lang, processWithAI]);

  const startVoice = useCallback(() => {
    if (!isSupported()) {
      setError('আপনার ব্রাউজার ভয়েস সাপোর্ট করে না। Chrome ব্যবহার করুন।');
      return;
    }
    isVoiceActiveRef.current = true;
    setConversationHistory([]);
    restartListeningLoop();
  }, [restartListeningLoop]);

  const stopVoice = useCallback(() => {
    isVoiceActiveRef.current = false;
    stopListening(recRef.current);
    setIsListening(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return {
    isListening, transcript, interimTranscript, isProcessing,
    voiceResult, error, lang, setLang,
    startVoice, stopVoice,
    isVoiceSupported: isSupported()
  };
}
