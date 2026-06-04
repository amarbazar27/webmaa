'use client';

/**
 * Text-to-Speech utility — Browser speechSynthesis (100% free)
 * Supports Bangla + English
 */

let currentUtterance = null;

export function speak(text, lang = 'bn-BD', onEnd = null) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.95;
  utter.pitch = 1;
  utter.volume = 1;

  if (onEnd) {
    utter.onend = onEnd;
    utter.onerror = onEnd;
  }

  // Try to find a Bengali voice
  const voices = window.speechSynthesis.getVoices();
  const bnVoice = voices.find(v => v.lang.startsWith('bn'));
  if (bnVoice) utter.voice = bnVoice;

  currentUtterance = utter;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
}

export function isSpeaking() {
  if (typeof window === 'undefined') return false;
  return window.speechSynthesis?.speaking ?? false;
}
