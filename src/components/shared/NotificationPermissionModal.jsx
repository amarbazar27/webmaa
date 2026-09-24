'use client';
/**
 * NotificationPermissionModal — Elegant bottom-center permission request
 *
 * Rules:
 * - শুধু একবার দেখাবে (localStorage দিয়ে track)
 * - Allow করলে: কখনো আর দেখাবে না
 * - Deny করলে: পরের visit-এ আবার দেখাবে
 * - Browser-এ already denied থাকলে: দেখাবে না
 * - Mobile + Desktop optimized
 */

import { useState, useEffect } from 'react';
import { Bell, BellOff, X, CheckCircle2 } from 'lucide-react';
import { isPushSupported, getPermissionStatus, requestPermission, getFCMToken } from '@/lib/fcm';

const STORAGE_KEY = 'daripallah_notif_permission_asked';
const ALLOWED_KEY = 'daripallah_notif_allowed';
// কতদিন পর আবার জিজ্ঞেস করবে (deny করলে)
const ASK_AGAIN_DAYS = 5;

export default function NotificationPermissionModal({ shopId = null, userId = null }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [step, setStep] = useState('ask'); // 'ask' | 'success'

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isPushSupported()) return;

    // ইতিমধ্যে browser-এ granted বা denied — modal দরকার নেই
    const perm = getPermissionStatus();
    if (perm === 'granted' || perm === 'denied') return;

    // User already clicked Allow
    if (localStorage.getItem(ALLOWED_KEY)) return;

    // Check last asked time
    const lastAsked = localStorage.getItem(STORAGE_KEY);
    if (lastAsked) {
      const daysSince = (Date.now() - parseInt(lastAsked)) / (1000 * 60 * 60 * 24);
      if (daysSince < ASK_AGAIN_DAYS) return;
    }

    // Page load-এর ৪ সেকেন্ড পরে দেখাও (সবার শেষে শান্তভাবে)
    const timer = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = async () => {
    setLoading(true);
    try {
      if (agreeTerms) {
        const result = await requestPermission();
        if (result === 'granted') {
          localStorage.setItem(ALLOWED_KEY, '1');
          localStorage.removeItem(STORAGE_KEY);
          if (shopId) {
            await getFCMToken(shopId, userId);
          }
          setStep('success');
          setTimeout(() => setShow(false), 2000);
          setLoading(false);
          return;
        }
      }
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setShow(false);
    } catch (err) {
      console.warn('Consent handler error:', err);
      setShow(false);
    }
    setLoading(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:bottom-5 z-[80] max-w-sm sm:max-w-md animate-fade-in select-none"
      role="dialog"
      aria-label="শর্তাবলী ও নোটিফিকেশন সম্মতি"
    >
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-2xl rounded-2xl p-3.5 sm:p-4 text-slate-800 dark:text-slate-100 transition-all">
        {/* Dismiss 'X' */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="বন্ধ করুন"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {step === 'ask' ? (
          <div className="space-y-2.5 pr-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Bell size={15} />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                শর্তাবলী ও নোটিফিকেশন আপডেট
              </h4>
            </div>

            {/* Terms & Notifications Agreement Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer text-left group">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer shrink-0"
              />
              <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-snug">
                আমি ওয়েবসাইট ব্যবহারের <span className="underline font-bold">শর্তাবলী</span> মেনে নিচ্ছি এবং নতুন অর্ডার স্ট্যাটাস ও বিশেষ অফারের নোটিফিকেশন পেতে সম্মত।
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleContinue}
                disabled={loading}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Bell size={13} />
                )}
                <span>{agreeTerms ? 'সম্মত ও চালু করুন' : 'চালিয়ে যান'}</span>
              </button>

              <button
                onClick={handleDismiss}
                className="py-2 px-3 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                পরে
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 py-1">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ধন্যবাদ! আপনার নোটিফিকেশন ও আপডেট সক্রিয় হয়েছে।
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
