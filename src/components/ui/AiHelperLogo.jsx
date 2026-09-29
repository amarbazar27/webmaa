'use client';

import React, { useId } from 'react';

/**
 * 🌟 AiHelperLogo v2 — Elite Neural Intelligence Star & Helper Orbit
 * World-class modern AI emblem inspired by DeepMind, Claude, and Apple Intelligence.
 * - Zero cartoonish / boxy robot clichés
 * - Multi-faceted 4-point hyperbolic intelligence diamond star
 * - Dynamic 3D-feel crystalline light reflection facets
 * - Helper guidance orbit ring with satellite sparks
 * - Unique SVG gradient IDs to prevent collisions
 */
export default function AiHelperLogo({ 
  size = 24, 
  className = '', 
  animated = false,
  showOrbit = true,
  variant = 'icon' // 'icon' | 'badge'
}) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const facetTopLeftId = `ai_tl_${id}`;
  const facetTopRightId = `ai_tr_${id}`;
  const facetBottomLeftId = `ai_bl_${id}`;
  const facetBottomRightId = `ai_br_${id}`;
  const miniSparkId = `ai_mini_${id}`;
  const orbitGradId = `ai_orb_${id}`;
  const glowFilterId = `ai_glow_${id}`;

  const svgContent = (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`overflow-visible select-none ${animated ? 'animate-pulse' : ''} ${className}`}
      role="img"
      aria-label="BD Retailers AI Helper"
    >
      <defs>
        {/* Top-Left Facet: Pure crystalline light reflection */}
        <linearGradient id={facetTopLeftId} x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Top-Right Facet: Cyan / Electric Teal intelligence flare */}
        <linearGradient id={facetTopRightId} x1="44" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Bottom-Left Facet: Deep Emerald body */}
        <linearGradient id={facetBottomLeftId} x1="4" y1="44" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="60%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Bottom-Right Facet: Rich Teal / Jade shade */}
        <linearGradient id={facetBottomRightId} x1="44" y1="44" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F766E" />
          <stop offset="50%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>

        {/* Mini Helper Spark Gradient */}
        <linearGradient id={miniSparkId} x1="31" y1="3" x2="45" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Orbit Ring Gradient */}
        <linearGradient id={orbitGradId} x1="6" y1="12" x2="42" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#10B981" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.2" />
        </linearGradient>

        {/* Soft Ambient Radial Glow */}
        <filter id={glowFilterId} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10B981" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* ── 1. Helper Guidance Orbit Ring (Elliptical Neural Track) ── */}
      {showOrbit && (
        <g opacity="0.85">
          <ellipse 
            cx="24" 
            cy="24" 
            rx="20" 
            ry="7.5" 
            transform="rotate(-26 24 24)" 
            stroke={`url(#${orbitGradId})`} 
            strokeWidth="1.3" 
            strokeDasharray="4 2.5"
          />
          {/* Orbiting Satellite Node 1 */}
          <circle cx="8" cy="20" r="1.5" fill="#38BDF8" />
          {/* Orbiting Satellite Node 2 */}
          <circle cx="40" cy="28" r="1.5" fill="#34D399" />
        </g>
      )}

      {/* ── 2. Master AI Intelligence Star (Faceted 4-Point Diamond Nexus) ── */}
      <g filter={`url(#${glowFilterId})`}>
        {/* Top-Left Facet */}
        <path 
          d="M 24 4 C 24 14.5, 14.5 24, 4 24 L 24 24 Z" 
          fill={`url(#${facetTopLeftId})`} 
        />

        {/* Top-Right Facet */}
        <path 
          d="M 24 4 C 24 14.5, 33.5 24, 44 24 L 24 24 Z" 
          fill={`url(#${facetTopRightId})`} 
        />

        {/* Bottom-Left Facet */}
        <path 
          d="M 4 24 C 14.5 24, 24 33.5, 24 44 L 24 24 Z" 
          fill={`url(#${facetBottomLeftId})`} 
        />

        {/* Bottom-Right Facet */}
        <path 
          d="M 44 24 C 33.5 24, 24 33.5, 24 44 L 24 24 Z" 
          fill={`url(#${facetBottomRightId})`} 
        />

        {/* Sleek Facet Separation Seams for Dimensional Luxury */}
        <line x1="24" y1="4" x2="24" y2="44" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <line x1="4" y1="24" x2="44" y2="24" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      </g>

      {/* ── 3. Central Crystalline Sparkle Core ── */}
      <circle cx="24" cy="24" r="2.8" fill="#FFFFFF" />
      <circle cx="24" cy="24" r="1.4" fill="#A7F3D0" />

      {/* ── 4. Mini Auxiliary Helper Spark (Top-Right Assistant Star) ── */}
      <g>
        <path 
          d="M 38 4 C 38 7.5, 34.5 10, 31 10 C 34.5 10, 38 12.5, 38 16 C 38 12.5, 41.5 10, 45 10 C 41.5 10, 38 7.5, 38 4 Z" 
          fill={`url(#${miniSparkId})`}
        />
        <circle cx="38" cy="10" r="1.1" fill="#FFFFFF" />
      </g>
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div className={`relative inline-flex items-center justify-center p-2 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-emerald-500/30 shadow-lg shadow-emerald-950/20 ${className}`}>
        {svgContent}
      </div>
    );
  }

  return svgContent;
}
