---
tokens:
  colors:
    primary: "#059669"
    secondary: "#0f172a"
    accent: "#10b981"
    background: "#f8fafc"
    surface: "#ffffff"
    text: "#0f172a"
    muted: "#64748b"
    border: "#e2e8f0"
    success: "#10b981"
    danger: "#ef4444"
    warning: "#f59e0b"
  typography:
    fontFamily:
      sans: "Outfit, Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      heading: "Outfit, sans-serif"
      body: "Outfit, sans-serif"
      mono: "ui-monospace, SFMono-Regular, monospace"
    fontSize:
      xs: "0.75rem"
      sm: "0.875rem"
      base: "1rem"
      lg: "1.125rem"
      xl: "1.25rem"
      "2xl": "1.5rem"
      "3xl": "1.875rem"
      "4xl": "2.25rem"
  radii:
    none: "0px"
    sm: "4px"
    md: "8px"
    lg: "12px"
    xl: "16px"
    "2xl": "24px"
    full: "9999px"
  elevation:
    none: "none"
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
---
# Design System — BD Retailers (BDRetailers.com)

## Overview
BD Retailers is Bangladesh's premier e-commerce platform and multi-vendor white-label marketplace.
This design system enforces clean, human-crafted, content-first visual hierarchy, avoiding generic AI starter kit templates.

## Principles
1. **Human-Crafted Restraint**: Clean white surfaces, subtle 1px border lines, and zero unmotivated decorative glows or floating blobs.
2. **High-Contrast Readability**: WCAG AAA/AA compliant text with deep Slate (#0f172a) typography on clean Slate-50 (#f8fafc) and White (#ffffff) backgrounds.
3. **Decisive Emerald Accents**: High-trust Emerald (#059669) for primary conversion CTAs, badges, and positive actions.
4. **Performance & Speed**: Zero heavy backdrop blurs, 60fps responsiveness across mobile, tablet, and desktop devices.

## Palette
- **Primary Action (Brand Emerald)**: `#059669` (RGB: 5, 150, 105)
- **Primary Hover**: `#047857` (RGB: 4, 120, 87)
- **Deep Slate (Headings & Ink)**: `#0f172a` (RGB: 15, 23, 42)
- **Body Text**: `#1e293b` (RGB: 30, 41, 59)
- **Secondary Text (Muted)**: `#64748b` (RGB: 100, 116, 139)
- **Surface (Card & Panel)**: `#ffffff`
- **Background (Canvas)**: `#f8fafc`
- **Border / Divider**: `#e2e8f0` (1px clean structural lines)
- **Accent**: `#10b981` (Emerald 500)

## Typography
- **Primary Family**: `Outfit`, sans-serif (Display, Headings, and Body)
- **System Fallbacks**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Code / Mono**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
- **Hierarchy**:
  - H1 / Hero: 2.25rem - 3.5rem (Outfit Semibold/Bold, tracking tight)
  - H2 / Section: 1.75rem - 2.25rem (Outfit Bold)
  - H3 / Subsection: 1.25rem - 1.5rem (Outfit Semibold)
  - Body: 1rem (16px, line-height 1.6, normal tracking)
  - Caption / Label: 0.875rem (14px, line-height 1.4)

## Layout & Structure
- **Max Width**: `1280px` (`max-w-7xl`), centered with fluid horizontal padding (`px-4 sm:px-6 lg:px-8`).
- **Spacing Scale**: 4px base grid (`p-2: 8px`, `p-4: 16px`, `p-6: 24px`, `p-8: 32px`).
- **Cards**: Flat 1px borders (`border border-slate-200`) with white backgrounds (`bg-white`).
- **No Nested Cards**: Do not nest bordered, rounded cards inside bordered, rounded cards. Use semantic list rows or clean separators.

## Elevation & Radii
- **Border Radii**:
  - Buttons & Inputs: 8px to 12px (`rounded-lg` / `rounded-xl`)
  - Cards & Modals: 16px to 24px (`rounded-2xl` / `rounded-3xl`)
  - Pills & Badges: 9999px (`rounded-full`)
- **Box Shadows**: Flat or minimal subtle elevation: `0 1px 3px rgba(0,0,0,0.06)`, `0 4px 6px -1px rgba(0,0,0,0.08)`.

## Do's and Don'ts
- **DO**: Use Emerald `#059669` and Slate `#0f172a` for clear, readable actions.
- **DO**: Maintain clean contrast ratios exceeding WCAG AA (4.5:1 for normal text).
- **DO**: Keep button labels direct, active, and localized ("১ মিনিটে ফ্রি স্টোর খুলুন", "অর্ডার করুন").
- **DON'T**: Use VibeCode Indigo/Purple (`#6366f1`, `#8b5cf6`, `#6C47FF`) as primary CTAs.
- **DON'T**: Use generic AI sparkle icons (`✨` or Lucide `Sparkles`) to brand features as AI.
- **DON'T**: Use `backdrop-filter: blur(...)` glassmorphism layers on opaque surfaces.
- **DON'T**: Add multiple gradient backgrounds, radial aurora blobs, or conic glows.
- **DON'T**: Use all-caps uppercase section labels with wide tracking (`TRACKING-WIDEST`).
