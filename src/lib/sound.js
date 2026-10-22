'use client';

/**
 * 🔊 sound.js — Pure Web Audio API tactile sound generator
 * Synthesizes crisp, subtle, Apple-grade micro-haptic UI sounds in pure browser JS.
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
 * 🎵 Crisp tactile click / tap sound (iOS / macOS mechanical pop)
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

    // Pitch envelope: fast subtle pitch drop from 1400Hz to 300Hz
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

    // Highpass filter for crispness
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(600, now);

    // Volume envelope: ultra-fast attack and rapid smooth decay
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch (_) {}
}

/**
 * 🌊 Liquid tab transition / sliding switch sound (gentle soft fluid blip)
 */
export function playTabSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.065);
  } catch (_) {}
}

/**
 * ✨ Success / Complete chime (delicate crystal dual chime)
 */
export function playSuccessSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [1046.5, 1318.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.035, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.15);
    });
  } catch (_) {}
}
