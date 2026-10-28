'use client';

/**
 * 🔊 sound.js — Pure Web Audio API Tactile Acoustic Sound Engine
 * Synthesizes warm, organic, velvety ("মায়াবী") UI sounds without harsh treble.
 * Features hierarchical acoustic signatures:
 *   - playNavSectionSound: Warm hollow wooden drop ("টুপ" / "ঠুক") for top-level navigation
 *   - playSubNavSound: Delicate crystal pebble tap ("টিপ") for sub-items and switches
 *   - playActionSound: Tactile soft-thud mechanical snap for action buttons
 *   - playCancelSound: Gentle reverse bubble pop for close/cancel/delete
 *   - playSuccessSound: Warm acoustic kalimba harmonic chime
 * Zero external mp3/wav assets, 0 latency, 60fps fast, 0 ear fatigue.
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
 * 🪵 1. Main Navigation Section Sound (Warm Hollow Wooden Bubble "টুপ" / "ঠুক")
 * Used for: Sidebar main tabs, Superadmin categories, Floating glass boxes
 * Characteristics: Warm fundamental (280Hz -> 210Hz), gentle lowpass filter @ 580Hz.
 * Zero piercing high frequencies — velvety and comfortable on the ears.
 */
export function playNavSectionSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    // Gentle downward pitch glide (natural acoustic liquid drop)
    osc.frequency.setValueAtTime(290, now);
    osc.frequency.exponentialRampToValueAtTime(215, now + 0.055);

    // Warm Lowpass filter (removes any sharp click or digital harshness)
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(580, now);
    filter.Q.setValueAtTime(1.2, now);

    // Soft Gaussian-like volume envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.13, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch (_) {}
}

/**
 * 💧 2. Sub-Navigation / Dropdown / Toggle Sound (Delicate Pebble Tap "টিপ")
 * Used for: Sub-menu items, checkboxes, accordion children, radio buttons
 * Characteristics: Light, airy, subtle (400Hz -> 460Hz), lowpass @ 720Hz.
 */
export function playSubNavSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.035);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(720, now);
    filter.Q.setValueAtTime(1.0, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (_) {}
}

/**
 * 🔘 3. Action Button Sound (Tactile Low-Thud Mechanical Pop / "ক্লিক")
 * Used for: Save, Submit, Update, Add to Cart, Confirm, Filter
 * Characteristics: Low resonant body (160Hz) with soft tactile snap (380Hz).
 */
export function playActionSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Body thud
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 0.03);

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(450, now);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.004);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.045);

    // Tactile micro-snap
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(360, now);
    osc2.frequency.exponentialRampToValueAtTime(240, now + 0.02);

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.003);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now);
    osc2.stop(now + 0.03);
  } catch (_) {}
}

/**
 * 🍃 4. Cancel / Close / Delete Sound (Gentle Reverse Bubble Pop)
 * Used for: Close modals, dismiss banners, delete items, back buttons
 */
export function playCancelSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.045);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  } catch (_) {}
}

/**
 * ✨ 5. Success / Completed Sound (Warm Acoustic Kalimba Harmonic Chime)
 * Used for: Order placed, settings saved, publish complete
 */
export function playSuccessSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Warm C-Major triad (C5, E5, G5) in kalimba range with lowpass
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      const startTime = now + idx * 0.055;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.09, startTime + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });
  } catch (_) {}
}

// ── Backwards Compatibility Aliases ────────────────────────────────
export const playWaterDropSound = playNavSectionSound;
export const playClickSound = playActionSound;
export const playTabSound = playNavSectionSound;
