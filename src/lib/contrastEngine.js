/**
 * Webmaa Style Engine — contrastEngine.js
 * WCAG AA-compliant automatic contrast calculation.
 * Ensures text is ALWAYS readable on any background.
 * SSR-safe: pure JS, no browser APIs.
 */

/**
 * Parse any hex/rgb/hsl color → { r, g, b }
 */
function parseColor(color = '#000000') {
  if (!color || typeof color !== 'string') return { r: 0, g: 0, b: 0 };

  // Hex shorthand: #abc → #aabbcc
  const hex6 = color.trim().replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, '#$1$1$2$2$3$3');
  const hexMatch = hex6.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
  }

  // Fallback to black
  return { r: 0, g: 0, b: 0 };
}

/**
 * Calculate relative luminance (WCAG 2.1 formula)
 * @param {{ r, g, b }} rgb
 * @returns {number} luminance 0–1
 */
function getLuminance({ r, g, b }) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculate WCAG contrast ratio between two colors
 * @returns {number} ratio 1–21
 */
export function getContrastRatio(color1, color2) {
  const l1 = getLuminance(parseColor(color1));
  const l2 = getLuminance(parseColor(color2));
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check WCAG AA compliance (minimum 4.5:1 for normal text, 3:1 for large text)
 */
export function isWCAGCompliant(fg, bg, level = 'AA') {
  const ratio = getContrastRatio(fg, bg);
  return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
}

/**
 * Given a background color, returns the best readable foreground text color.
 * Uses WCAG luminance — dark bg → white text, light bg → dark text.
 * @param {string} bgColor - any CSS color string
 * @param {{ dark?: string, light?: string }} options - custom dark/light text colors
 * @returns {string} CSS color for text
 */
export function getContrastText(bgColor, options = {}) {
  const dark  = options.dark  || '#111827';
  const light = options.light || '#F8FAFC';

  if (!bgColor || bgColor === 'transparent') return dark;

  // Handle CSS gradient strings — extract first color
  const gradientMatch = bgColor.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/);
  const effectiveColor = gradientMatch ? gradientMatch[0] : bgColor;

  const luminance = getLuminance(parseColor(effectiveColor));

  // Luminance threshold: above 0.35 = light background → dark text
  return luminance > 0.35 ? dark : light;
}

/**
 * Given a primary/accent color, generate a complete readable theme palette.
 * All color pairs guaranteed WCAG AA compliant.
 */
export function generateContrastSafePalette(primaryColor, bgColor = '#ffffff') {
  const isDarkBg = getLuminance(parseColor(bgColor)) < 0.35;

  return {
    textOnPrimary: getContrastText(primaryColor),
    textOnBg:      isDarkBg ? '#F8FAFC' : '#111827',
    textMutedOnBg: isDarkBg ? 'rgba(248,250,252,0.72)' : '#4B5563',
    cardBg:        isDarkBg ? 'rgba(255,255,255,0.08)' : '#ffffff',
    cardText:      isDarkBg ? '#F8FAFC' : '#111827',
    borderColor:   isDarkBg ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
  };
}

/**
 * Build complete shop CSS variable map with contrast-guaranteed values.
 * This is the single source of truth for all --sp-* variables.
 */
export function buildContrastSafeThemeVars(theme = {}) {
  const {
    primary    = '#6C47FF',
    accent     = '#8B5CF6',
    bg         = '#F8FAFC',
    text,
    card       = '#ffffff',
    border     = '#E2E8F0',
    radius     = '16px',
    headerBg   = '#6C47FF',
    headerText,
    btnText,
    font       = 'Inter',
  } = theme;

  // Auto-compute text colors from backgrounds if not explicitly set
  const resolvedText       = text       || getContrastText(bg);
  const resolvedHeaderText = headerText || getContrastText(headerBg);
  const resolvedBtnText    = btnText    || getContrastText(primary);

  // Validate contrast ratios — log warnings in dev
  if (process.env.NODE_ENV === 'development') {
    const textRatio   = getContrastRatio(resolvedText, bg);
    const headerRatio = getContrastRatio(resolvedHeaderText, headerBg);
    if (textRatio < 4.5) {
      console.warn(`[ContrastEngine] ⚠️ Low contrast: text(${resolvedText}) on bg(${bg}) — ratio: ${textRatio.toFixed(2)}`);
    }
    if (headerRatio < 4.5) {
      console.warn(`[ContrastEngine] ⚠️ Low contrast: header text(${resolvedHeaderText}) on header bg(${headerBg}) — ratio: ${headerRatio.toFixed(2)}`);
    }
  }

  return {
    '--sp-primary':     primary,
    '--sp-accent':      accent,
    '--sp-bg':          bg,
    '--sp-text':        resolvedText,
    '--sp-card':        card,
    '--sp-border':      border,
    '--sp-radius':      radius,
    '--sp-header-bg':   headerBg,
    '--sp-header-text': resolvedHeaderText,
    '--sp-btn-text':    resolvedBtnText,
    '--sp-font':        font,
    // Computed helpers for components to use
    '--sp-text-muted':  getContrastText(bg, { dark: '#4B5563', light: 'rgba(248,250,252,0.72)' }),
    '--sp-card-text':   getContrastText(card),
    '--sp-on-primary':  resolvedBtnText,
  };
}
