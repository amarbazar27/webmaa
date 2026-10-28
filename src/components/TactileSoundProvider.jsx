'use client';

import { useEffect } from 'react';
import { playWaterDropSound, isSoundEnabled } from '@/lib/sound';

export default function TactileSoundProvider({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleGlobalClick = (e) => {
      if (!isSoundEnabled()) return;

      // Find if clicked element or parent is a button, tab, toggle, or interactive item
      const interactiveEl = e.target.closest('button, [role="button"], [role="tab"], .liquid-wave-btn, .segmented-glass-box, input[type="checkbox"], input[type="radio"], select, .tab-btn');
      
      if (interactiveEl) {
        // Skip silent buttons if explicitly marked
        if (interactiveEl.dataset?.silent === 'true') return;
        playWaterDropSound();
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  return children;
}
