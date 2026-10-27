'use client';

/**
 * 🔊 sound.js — Pure Web Audio API tactile acoustic sound generator
 * Synthesizes crisp, louder, fluid waterfall droplet & mechanical pop UI sounds.
 * Zero external mp3/wav assets, 0 latency, 60fps fast.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('bd_ui_sound_enabled') !== 'false';
}

export function toggleSoundEnabled() {
  if (typeof window === 'undefined') return true;
  const current = isSoundEnabled();
  localStorage.setItem('bd_ui_sound_enabled', current ? 'false' : 'true');
  return !current;
}

/**
 * 💧 Waterfall / Fluid Water Droplet Sound (Authentic acoustic liquid bubble "টুপ" / "ডপ")
 * Louder, smooth, resonant liquid drop on button switch / tab change
 */
export function playWaterDropSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Primary Droplet Oscillator (fast upward fluid sweep)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(700, now);
    osc1.frequency.exponentialRampToValueAtTime(1650, now + 0.05);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(1200, now);
    filter1.Q.setValueAtTime(3.5, now);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.1);

    // Secondary sub-surface acoustic ripple (resonance)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(420, now + 0.01);
    osc2.frequency.exponentialRampToValueAtTime(280, now + 0.07);

    gain2.gain.setValueAtTime(0.001, now + 0.01);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.025);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.01);
    osc2.stop(now + 0.09);
  } catch (_) {}
}

/**
 * 🎵 Crisp tactile mechanical click / tap sound (iOS / macOS mechanical pop)
 * Enhanced with louder volume and deeper acoustic pop
 */
export function playClickSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.04);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(500, now);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  } catch (_) {}
}

/**
 * 🌊 Liquid tab transition / sliding switch sound (plays waterfall fluid drop)
 */
export function playTabSound() {
  playWaterDropSound();
}

/**
 * ✨ Success / Complete chime (delicate crystal dual chime, louder & sparkling)
 */
export function playSuccessSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.12, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.18);
    });
  } catch (_) {}
}
