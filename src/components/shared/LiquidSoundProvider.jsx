'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { playClickSound, playTabSound, isSoundEnabled, toggleSoundEnabled } from '@/lib/sound';

export default function LiquidSoundProvider() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());

    const handleClick = (e) => {
      const target = e.target.closest('button, [role="button"], [role="tab"], .liquid-btn, a[href]');
      if (!target) return;

      // Ignore certain passive links or inspector UI
      if (target.closest('#agentation-inspector-container')) return;

      if (target.getAttribute('role') === 'tab' || target.classList.contains('tab-btn')) {
        playTabSound();
      } else {
        playClickSound();
      }
    };

    window.addEventListener('click', handleClick, { passive: true });
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleToggle = () => {
    const newState = toggleSoundEnabled();
    setEnabled(newState);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`p-2 rounded-xl transition-all cursor-pointer backdrop-blur-md border ${
        enabled
          ? 'bg-slate-100 hover:bg-slate-200 text-purple-600 dark:bg-slate-800 dark:text-purple-400 border-slate-200 dark:border-slate-700'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-700'
      }`}
      title={enabled ? 'সাউন্ড এফেক্ট চালু আছে (ক্লিক করে মিউট করুন)' : 'সাউন্ড এফেক্ট বন্ধ আছে (ক্লিক করে চালু করুন)'}
      aria-label="UI Sound Effects Toggle"
    >
      {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  );
}
