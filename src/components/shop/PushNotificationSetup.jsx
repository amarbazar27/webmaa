'use client';

/**
 * PushNotificationSetup — Storefront component
 * Handles push notification permission UI and FCM initialization
 * Shows: ask prompt, denied warning, or success state
 * SSR-safe, mobile-first, works on all domains
 */

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, BellRing, X, Settings, ExternalLink } from 'lucide-react';
import {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  getFCMToken,
  initializeFCM,
} from '@/lib/fcm';

export default function PushNotificationSetup({ shopId, userId = null, shopName = 'স্টোর' }) {
  const [status, setStatus] = useState('idle'); // idle | asking | granted | denied | unsupported | error
  const [dismissed, setDismissed] = useState(false);
  const [token, setToken] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user already dismissed this banner
    const wasDismissed = sessionStorage.getItem(`fcm_banner_dismissed_${shopId}`);
    if (wasDismissed) return;

    // Don't show if already set
    const currentPerm = getPermissionStatus();
    if (currentPerm === 'granted') {
      // Silently init
      initializeFCM(shopId, userId).then(({ token: t }) => {
        if (t) {
          setToken(t);
          setStatus('granted');
          console.log('[FCM] ✅ Token active:', t.substring(0, 20) + '...');
        }
      });
      return;
    }

    if (currentPerm === 'denied') {
      setStatus('denied');
      return;
    }

    if (!isPushSupported()) {
      setStatus('unsupported');
      return;
    }

    // Show banner after 3 seconds (non-intrusive)
    const timer = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(timer);
  }, [shopId, userId]);

  const handleAllow = useCallback(async () => {
    setStatus('asking');
    console.log('[FCM] User clicked Allow notifications');

    const result = await initializeFCM(shopId, userId);
    console.log('[FCM] Init result:', result);

    setStatus(result.status);
    if (result.token) setToken(result.token);
    setShowBanner(false);
  }, [shopId, userId]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setShowBanner(false);
    try {
      sessionStorage.setItem(`fcm_banner_dismissed_${shopId}`, '1');
    } catch {}
  }, [shopId]);

  // Nothing to show
  if (!showBanner && status !== 'denied') return null;

  // Denied state — show a subtle inline warning
  if (status === 'denied') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs">
        <BellOff size={13} className="text-amber-500 shrink-0" />
        <p className="text-amber-700 font-bold flex-1">
          নোটিফিকেশন ব্লক করা আছে।{' '}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open(
                  'https://support.google.com/chrome/answer/3220216?hl=bn',
                  '_blank'
                );
              }
            }}
            className="underline text-amber-800 inline-flex items-center gap-0.5"
          >
            চালু করুন <ExternalLink size={10} />
          </button>
        </p>
      </div>
    );
  }

  // Asking state — spinner
  if (status === 'asking') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs">
        <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
        <p className="text-blue-700 font-bold">অনুমতি নেওয়া হচ্ছে...</p>
      </div>
    );
  }

  // Main banner
  if (!showBanner) return null;

  return (
    <div
      className="relative flex items-start gap-3 p-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl shadow-lg shadow-violet-500/20 text-white animate-slide-in"
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="shrink-0 w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
        <BellRing size={18} className="text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm leading-tight">{shopName}-এর নোটিফিকেশন চালু করুন</p>
        <p className="text-white/75 text-[11px] font-medium mt-0.5">
          অফার, ডেলিভারি আপডেট ও নতুন পণ্যের সংবাদ পান।
        </p>

        {/* Action buttons */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleAllow}
            className="flex-1 py-1.5 bg-white text-violet-700 rounded-lg text-[11px] font-black hover:bg-violet-50 transition-all active:scale-95"
          >
            চালু করুন ✓
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 py-1.5 bg-white/20 text-white rounded-lg text-[11px] font-black hover:bg-white/30 transition-all active:scale-95"
          >
            পরে
          </button>
        </div>
      </div>

      {/* Close */}
      <button
        onClick={handleDismiss}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-all"
        aria-label="Close notification prompt"
      >
        <X size={12} />
      </button>
    </div>
  );
}
