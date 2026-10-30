'use client';

/**
 * 🔊 sound.js — High-Fidelity Tactile Mechanical UI Sound Engine
 * Synthesizes crisp, satisfying, tactile pops and mechanical clicks (iOS / Reels style).
 * Replaces dull muffled thuds with snappy, crystal-clear acoustic transients:
 *   - playNavSectionSound: Crisp acoustic bubble pop ("টক্" / "পপ")
 *   - playSubNavSound: Delicate crystal pebble tap ("টিক্")
 *   - playActionSound: Snappy mechanical switch click ("ক্লিক")
 *   - playCancelSound: Light airy reverse bubble pop
 *   - playSuccessSound: Sparkling crystal kalimba chime
 * Zero external audio assets, 0 latency, 60fps fast, zero ear fatigue.
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
 * 🫧 1. Main Navigation Sound — Crisp Acoustic Bubble Pop ("টক্" / "পপ")
 * Fast frequency sweep (750Hz -> 1180Hz) with sharp attack and 22ms decay.
 * Sounds ultra-crisp, tactile, and modern (identical to viral tech UI reels).
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
    // Snappy upward acoustic bubble pop
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(1150, now + 0.016);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.026);

    // Peaking filter to enhance crisp presence without harshness
    filter.type = 'peaking';
    filter.frequency.setValueAtTime(1200, now);
    filter.gain.setValueAtTime(4, now);
    filter.Q.setValueAtTime(1.5, now);

    // Snappy envelope (1.5ms attack, 24ms decay)
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.0015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.028);
  } catch (_) {}
}

/**
 * 💧 2. Sub-Navigation / Toggle Sound — Delicate Pebble Tap ("টিক্")
 * Light, airy high-register tap (1250Hz -> 1550Hz) for switches, filters & pills.
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
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1550, now + 0.014);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(2.0, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);
  } catch (_) {}
}

/**
 * 🔘 3. Action Button Sound — Snappy Mechanical Switch Click ("ক্লিক")
 * Dual-transient tactile mechanism:
 * Layer A: Sharp tactile snap (1800Hz -> 950Hz in 7ms)
 * Layer B: Crisp acoustic woodblock body (820Hz -> 540Hz in 18ms)
 * Total duration: 22ms. Feels like a premium mechanical switch or iOS haptic click.
 */
export function playActionSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Transient 1: Sharp micro-click snap
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    const filterClick = ctx.createBiquadFilter();

    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(1800, now);
    oscClick.frequency.exponentialRampToValueAtTime(950, now + 0.007);

    filterClick.type = 'highpass';
    filterClick.frequency.setValueAtTime(800, now);

    gainClick.gain.setValueAtTime(0.0001, now);
    gainClick.gain.linearRampToValueAtTime(0.14, now + 0.001);
    gainClick.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

    oscClick.connect(filterClick);
    filterClick.connect(gainClick);
    gainClick.connect(ctx.destination);

    oscClick.start(now);
    oscClick.stop(now + 0.014);

    // Transient 2: Crisp resonant key body
    const oscBody = ctx.createOscillator();
    const gainBody = ctx.createGain();

    oscBody.type = 'sine';
    oscBody.frequency.setValueAtTime(820, now);
    oscBody.frequency.exponentialRampToValueAtTime(540, now + 0.018);

    gainBody.gain.setValueAtTime(0.0001, now);
    gainBody.gain.linearRampToValueAtTime(0.10, now + 0.002);
    gainBody.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    oscBody.connect(gainBody);
    gainBody.connect(ctx.destination);

    oscBody.start(now);
    oscBody.stop(now + 0.024);
  } catch (_) {}
}

/**
 * 🍃 4. Cancel / Close Sound — Soft Descending Bubble Tap
 * Smooth downward glide (920Hz -> 550Hz) for closing modals and dismissing toasts.
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
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.022);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.028);
  } catch (_) {}
}

/**
 * ✨ 5. Success Sound — Sparkling Crystal Kalimba Chime ("টুন-টুন-টিং")
 * Bright, airy G-Major ascending chime (G5: 784Hz, B5: 988Hz, E6: 1319Hz) with crystalline resonance.
 */
export function playSuccessSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [783.99, 987.77, 1318.51].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      const startTime = now + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, startTime);
      filter.Q.setValueAtTime(3.0, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.11, startTime + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.14);
    });
  } catch (_) {}
}

// ── Backwards Compatibility Aliases ────────────────────────────────
export const playWaterDropSound = playNavSectionSound;
export const playClickSound = playActionSound;
export const playTabSound = playNavSectionSound;
