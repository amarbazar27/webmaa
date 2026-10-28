'use client';

import { useEffect } from 'react';
import { 
  playNavSectionSound, 
  playSubNavSound, 
  playActionSound, 
  playCancelSound, 
  isSoundEnabled 
} from '@/lib/sound';

export default function TactileSoundProvider({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleGlobalClick = (e) => {
      if (!isSoundEnabled()) return;

      // Find if clicked element or parent is a button, tab, toggle, or interactive item
      const interactiveEl = e.target.closest('button, [role="button"], [role="tab"], .liquid-wave-btn, .segmented-glass-box, input[type="checkbox"], input[type="radio"], select, .tab-btn, a[href^="/dashboard"], a[href^="/superadmin"], a[href^="/shop"]');
      
      if (!interactiveEl) return;
      if (interactiveEl.dataset?.silent === 'true') return;

      // ── Hierarchical Acoustic Dispatcher ──────────────────────────
      // 1. Explicit sound override via data attribute
      if (interactiveEl.dataset?.sound === 'sub') {
        playSubNavSound();
        return;
      }
      if (interactiveEl.dataset?.sound === 'action') {
        playActionSound();
        return;
      }
      if (interactiveEl.dataset?.sound === 'cancel') {
        playCancelSound();
        return;
      }
      if (interactiveEl.dataset?.sound === 'nav') {
        playNavSectionSound();
        return;
      }

      // 2. Sub-navigation / dropdown children / form toggles
      if (
        interactiveEl.closest('.pl-6') || 
        interactiveEl.matches('input[type="checkbox"], input[type="radio"]') ||
        interactiveEl.classList.contains('sub-nav-item')
      ) {
        playSubNavSound();
        return;
      }

      // 3. Close, cancel, delete, back actions
      const isDismissive = 
        interactiveEl.getAttribute('aria-label')?.toLowerCase().includes('close') ||
        interactiveEl.innerText?.includes('বাতিল') ||
        interactiveEl.innerText?.includes('Cancel') ||
        interactiveEl.innerText?.includes('Delete') ||
        interactiveEl.innerText?.includes('মুছুন') ||
        interactiveEl.querySelector('.lucide-x, .lucide-trash, .lucide-trash-2, .lucide-arrow-left');

      if (isDismissive) {
        playCancelSound();
        return;
      }

      // 4. Primary actions: Submit, Save, Update, Add to Cart
      const isAction = 
        interactiveEl.type === 'submit' ||
        interactiveEl.innerText?.includes('সেভ') ||
        interactiveEl.innerText?.includes('Save') ||
        interactiveEl.innerText?.includes('কার্ট') ||
        interactiveEl.innerText?.includes('যোগ করুন') ||
        interactiveEl.innerText?.includes('অর্ডার') ||
        interactiveEl.querySelector('.lucide-save, .lucide-shopping-cart, .lucide-plus, .lucide-check');

      if (isAction) {
        playActionSound();
        return;
      }

      // 5. Default: Warm hollow wooden drop ("টুপ") for main tabs & sections
      playNavSectionSound();
    };

    document.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  return children;
}
