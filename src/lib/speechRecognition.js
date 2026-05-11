'use client';

/**
 * Speech Recognition utility — Browser Web Speech API (100% free)
 * Supports Bangla (bn-BD) + English (en-US)
 */

let recognition = null;

export function isSupported() {
  return typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function createRecognition({ lang = 'bn-BD', onResult, onEnd, onError } = {}) {
  if (!isSupported()) {
    onError?.('আপনার ব্রাউজার ভয়েস ইনপুট সাপোর্ট করে না। Chrome ব্যবহার করুন।');
    return null;
  }
  
  if (recognition) {
    try { recognition.abort(); } catch (e) {}
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let final = '';
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t;
      else interim += t;
    }
    onResult?.({ final, interim });
  };

  recognition.onend = () => onEnd?.();
  recognition.onerror = (e) => {
    console.error('[Speech] Recognition error:', e.error);
    const msgs = {
      'not-allowed': 'মাইক্রোফোনের অনুমতি দিন।',
      'no-speech': 'কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন।',
      'network': 'নেটওয়ার্ক সমস্যা।',
      'aborted': 'ভয়েস ইনপুট বাতিল করা হয়েছে।',
    };
    onError?.(msgs[e.error] || `Voice recognition unavailable: ${e.error}`);
  };

  return recognition;
}

export function startListening(rec) {
  try { 
    if (rec) {
      rec.abort(); // Ensure clean state before starting
      setTimeout(() => {
        try { rec.start(); } catch(e) { console.warn('Speech start error:', e); }
      }, 50); // slight delay to allow abort to process
    }
  } catch (e) { console.warn('Speech start wrapper error:', e); }
}

export function stopListening(rec) {
  try { rec?.stop(); } catch (e) { /* already stopped */ }
}
