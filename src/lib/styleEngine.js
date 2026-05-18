/**
 * Webmaa Style Engine — styleEngine.js
 * Converts a template config → complete CSS variable map + layout attributes.
 * Uses contrastEngine for WCAG-compliant text colors automatically.
 * SSR-safe: pure JS, no browser APIs.
 */

import { buildContrastSafeThemeVars, getContrastText } from './contrastEngine';

/**
 * Given a template's defaultTheme (merged with retailer overrides),
 * build the complete inline style object to apply on the root wrapper.
 *
 * Combines:
 * 1. --sp-* shop theme variables (via contrastEngine)
 * 2. Template-specific --sf-* structural variables
 *
 * @param {Object} template - from templates/index.js
 * @param {Object} mergedTheme - retailer-customized theme (defaultTheme + overrides)
 * @returns {{ style: Object, dataAttrs: Object }}
 */
export function buildStyleEngineOutput(template, mergedTheme = {}) {
  const {
    primaryColor   = '#6C47FF',
    secondaryColor = '#8B5CF6',
    accentColor    = '#F59E0B',
    bgColor        = '#F8FAFC',
    textColor,
    headerBg       = '#6C47FF',
    headerText,
    cardBg         = '#ffffff',
    cardBorder     = '#E2E8F0',
    buttonRadius   = '16px',
    cardRadius     = '16px',
    fontFamily     = 'Inter, sans-serif',
    fontSize       = 'base',
    shadow         = 'md',
    gridCols       = 3,
    spacing        = 'comfortable',
    animationLevel = 'smooth',
  } = mergedTheme;

  // ── Build contrast-safe --sp-* vars ──────────────────────────────
  const spVars = buildContrastSafeThemeVars({
    primary:    primaryColor,
    accent:     accentColor,
    bg:         bgColor,
    text:       textColor,         // may be undefined → auto-computed
    card:       cardBg,
    border:     cardBorder,
    radius:     cardRadius,
    headerBg:   headerBg,
    headerText: headerText,        // may be undefined → auto-computed
    font:       fontFamily,
  });

  // ── Template structural --sf-* vars ──────────────────────────────
  const shadowMap = {
    none: 'none',
    sm:   '0 1px 3px rgba(0,0,0,0.08)',
    md:   '0 4px 16px rgba(0,0,0,0.10)',
    lg:   '0 8px 32px rgba(0,0,0,0.12)',
    xl:   '0 20px 60px rgba(0,0,0,0.15)',
  };

  const spacingMap = {
    tight:       '0.5rem',
    compact:     '0.75rem',
    comfortable: '1.5rem',
    relaxed:     '2rem',
    editorial:   '3rem',
    futuristic:  '2rem',
  };

  const sfVars = {
    '--sf-primary':     primaryColor,
    '--sf-secondary':   secondaryColor,
    '--sf-accent':      accentColor,
    '--sf-shadow':      shadowMap[shadow] || shadowMap.md,
    '--sf-spacing':     spacingMap[spacing] || '1.5rem',
    '--sf-card-radius': cardRadius,
    '--sf-btn-radius':  buttonRadius,
    '--sf-grid-cols':   String(gridCols),
    '--sf-font':        fontFamily,
  };

  // ── Google Font URL to preload ────────────────────────────────────
  const fontName = extractGoogleFontName(fontFamily);

  // ── Data attributes for CSS targeting ────────────────────────────
  const dataAttrs = {
    'data-sf-style':     template?.styleType || 'bold-commerce',
    'data-sf-layout':    template?.layoutClass || 'layout-commerce',
    'data-sf-dark':      mergedTheme.bgColor ? isColorDark(mergedTheme.bgColor) ? '1' : '0' : '0',
    'data-sf-anim':      animationLevel,
    'data-sf-spacing':   spacing,
    'data-sf-grid':      String(gridCols),
  };

  return {
    style:     { ...spVars, ...sfVars },
    dataAttrs,
    fontName,
    isDark:    isColorDark(bgColor),
  };
}

/**
 * Extract Google Font name from font-family string for <link> preloading.
 */
function extractGoogleFontName(fontFamily = '') {
  const knownFonts = ['Outfit', 'Inter', 'DM Sans', 'Nunito', 'Cormorant Garamond',
    'Playfair Display', 'Roboto Mono', 'Hind Siliguri', 'Noto Sans Bengali', 'Exo 2'];
  return knownFonts.find(f => fontFamily.includes(f)) || 'Inter';
}

/**
 * Simple luminance-based dark check (avoids importing full engine just for this).
 */
function isColorDark(color = '#ffffff') {
  if (!color || color.includes('gradient') || color.includes('linear')) return false;
  const m = color.replace('#', '').match(/[0-9a-f]{2}/gi);
  if (!m || m.length < 3) return false;
  const [r, g, b] = m.map(c => parseInt(c, 16));
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

/**
 * Apply data attributes to a DOM element (client-side only).
 * Call after mount to avoid hydration mismatch.
 */
export function applyDataAttrsToElement(el, dataAttrs) {
  if (!el || typeof document === 'undefined') return;
  Object.entries(dataAttrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
}
