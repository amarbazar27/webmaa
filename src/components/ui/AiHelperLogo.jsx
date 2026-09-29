'use client';

import React, { useId } from 'react';

/**
 * 🌟 AiHelperLogo
 * Premium, friendly, non-generic AI Helper Assistant Logo for BD Retailers.
 * Features:
 * - Ultra-crisp vector geometry (scalable from 16px to 128px)
 * - Friendly glowing smart-assistant visor with warm expressive eyes
 * - Dynamic 4-point AI intelligence nexus spark
 * - Unique SVG gradient IDs via React useId() to prevent DOM collisions
 * - Optional micro-glow / breathing animation
 */
export default function AiHelperLogo({ 
  size = 24, 
  className = '', 
  animated = false,
  showSparkle = true,
  variant = 'icon' // 'icon' | 'badge'
}) {
  const rawId = useId();
  // Sanitize useId for valid SVG url(#id) in all browsers
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const bodyGradientId = `ai_body_grad_${id}`;
  const visorGradientId = `ai_visor_grad_${id}`;
  const eyeGradientId = `ai_eye_grad_${id}`;
  const sparkGradientId = `ai_spark_grad_${id}`;
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
        {/* Helper Head / Chassis Gradient */}
        <linearGradient id={bodyGradientId} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="35%" stopColor="#10B981" />
          <stop offset="70%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>

        {/* Visor Glass Gradient */}
        <linearGradient id={visorGradientId} x1="24" y1="14" x2="24" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#090D16" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Friendly Expressive Glowing Eyes */}
        <linearGradient id={eyeGradientId} x1="14" y1="20" x2="34" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>

        {/* Intelligence Nexus Sparkle Gradient */}
        <linearGradient id={sparkGradientId} x1="32" y1="2" x2="46" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="45%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Ambient Soft Glow Filter */}
        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#059669" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* ── 1. Smart Helper Head Chassis (Super-ellipse / aerodynamic curved capsule) ── */}
      <rect 
        x="6" 
        y="8" 
        width="36" 
        height="32" 
        rx="16" 
        fill={`url(#${bodyGradientId})`} 
        filter={`url(#${glowFilterId})`}
      />

      {/* Head Top Helper Antenna Puck */}
      <path 
        d="M21 8V5C21 4.44772 21.4477 4 22 4H26C26.5523 4 27 4.44772 27 5V8H21Z" 
        fill={`url(#${bodyGradientId})`} 
      />

      {/* Headset / Smart Audio Sensor Ears (Friendly headphone nodes) */}
      <rect x="3.5" y="18" width="4.5" height="12" rx="2.25" fill="#0D9488" />
      <rect x="40" y="18" width="4.5" height="12" rx="2.25" fill="#0D9488" />

      {/* ── 2. Visor Screen Glass ── */}
      <rect 
        x="10.5" 
        y="13.5" 
        width="27" 
        height="21" 
        rx="10.5" 
        fill={`url(#${visorGradientId})`} 
        stroke="rgba(255,255,255,0.18)" 
        strokeWidth="1.2"
      />

      {/* Visor Glass Curved Top Reflection Highlight */}
      <path 
        d="M14 17C16.5 15.2 20.5 14.5 24 14.5C27.5 14.5 31.5 15.2 34 17" 
        stroke="rgba(255,255,255,0.3)" 
        strokeWidth="1" 
        strokeLinecap="round" 
      />

      {/* ── 3. Friendly Animated Eyes (Warm, Happy, Approachable helper arcs) ── */}
      {/* Left Eye */}
      <g>
        <path 
          d="M15.5 24.5C15.5 22 17.5 20.5 19.5 20.5C21.5 20.5 23.5 22 23.5 24.5" 
          stroke={`url(#${eyeGradientId})`} 
          strokeWidth="2.4" 
          strokeLinecap="round" 
        />
        {/* Subtle eye pupil glow center */}
        <circle cx="19.5" cy="23.5" r="1" fill="#FFFFFF" opacity="0.9" />
      </g>

      {/* Right Eye */}
      <g>
        <path 
          d="M24.5 24.5C24.5 22 26.5 20.5 28.5 20.5C30.5 20.5 32.5 22 32.5 24.5" 
          stroke={`url(#${eyeGradientId})`} 
          strokeWidth="2.4" 
          strokeLinecap="round" 
        />
        {/* Subtle eye pupil glow center */}
        <circle cx="28.5" cy="23.5" r="1" fill="#FFFFFF" opacity="0.9" />
      </g>

      {/* ── 4. Friendly Helper Smile (Subtle micro-smile indicator) ── */}
      <path 
        d="M21.5 29C22.8 30.2 25.2 30.2 26.5 29" 
        stroke="#6EE7B7" 
        strokeWidth="1.6" 
        strokeLinecap="round" 
        opacity="0.85"
      />

      {/* ── 5. AI Cognition Nexus Sparkle (Top-Right Spark) ── */}
      {showSparkle && (
        <g className="transform origin-[39px_8px] transition-transform">
          {/* Glowing 4-point Diamond Star */}
          <path 
            d="M39 2C39.4 5.5 41.5 7.6 45 8C41.5 8.4 39.4 10.5 39 14C38.6 10.5 36.5 8.4 33 8C36.5 7.6 38.6 5.5 39 2Z" 
            fill={`url(#${sparkGradientId})`}
          />
          {/* Core White Sparkle Center */}
          <circle cx="39" cy="8" r="1.3" fill="#FFFFFF" />
        </g>
      )}
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
