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
import { Bell, BellOff, X, Sparkles } from 'lucide-react';
import { isPushSupported, getPermissionStatus, requestPermission, getFCMToken } from '@/lib/fcm';

const STORAGE_KEY = 'daripallah_notif_permission_asked';
const ALLOWED_KEY = 'daripallah_notif_allowed';
// কতদিন পর আবার জিজ্ঞেস করবে (deny করলে)
const ASK_AGAIN_DAYS = 3;

export default function NotificationPermissionModal({ shopId = null, userId = null }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('ask'); // 'ask' | 'success' | 'denied'

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isPushSupported()) return;

    // ইতিমধ্যে browser-এ granted — modal দরকার নেই
    const perm = getPermissionStatus();
    if (perm === 'granted') return;
    if (perm === 'denied') return; // browser-level deny — আর কিছু করার নেই

    // User already clicked Allow
    if (localStorage.getItem(ALLOWED_KEY)) return;

    // Check last asked time (deny হলে কতদিন পর আবার জিজ্ঞেস করব)
    const lastAsked = localStorage.getItem(STORAGE_KEY);
    if (lastAsked) {
      const daysSince = (Date.now() - parseInt(lastAsked)) / (1000 * 60 * 60 * 24);
      if (daysSince < ASK_AGAIN_DAYS) return;
    }

    // Page load-এর ৩ সেকেন্ড পরে দেখাও (less annoying)
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    try {
      const result = await requestPermission();
      if (result === 'granted') {
        localStorage.setItem(ALLOWED_KEY, '1');
        localStorage.removeItem(STORAGE_KEY);
        if (shopId) {
          await getFCMToken(shopId, userId);
        }
        setStep('success');
        setTimeout(() => setShow(false), 2500);
      } else {
        // User clicked "Block" in browser dialog
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        setStep('denied');
        setTimeout(() => setShow(false), 3000);
      }
    } catch (err) {
      console.error('Permission request failed:', err);
      setShow(false);
    }
    setLoading(false);
  };

  const handleDeny = () => {
    // পরের visit-এ আবার জিজ্ঞেস করব
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop — subtle, not full block */}
      <div
        className="fixed inset-0 z-[150] pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.15)' }}
      />

      {/* Modal — bottom center */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[160] w-full max-w-sm mx-4 animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label="নোটিফিকেশন অনুমতি"
      >
        <div
          className="rounded-3xl shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(108,71,255,0.2)',
          }}
        >
          {step === 'ask' && (
            <div className="p-6">
              {/* Close */}
              <button
                onClick={handleDeny}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
              >
                <X size={14} />
              </button>

              {/* Icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(139,92,246,0.3)', border: '1px solid rgba(139,92,246,0.5)' }}>
                  <Bell size={22} className="text-violet-300" />
                </div>
                <div>
                  <p className="text-white font-black text-sm leading-tight">নোটিফিকেশন চালু করুন</p>
                  <p className="text-violet-300 text-[11px] font-bold mt-0.5">অর্ডার আপডেট পেতে</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-violet-200 text-xs font-medium leading-relaxed mb-5">
                নতুন অর্ডার, ডেলিভারি স্ট্যাটাস, এবং অফার সম্পর্কে তাৎক্ষণিক আপডেট পান। 
                যেকোনো সময় বন্ধ করতে পারবেন।
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAllow}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition-all disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #6C47FF)',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(108,71,255,0.4)',
                  }}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Bell size={15} />
                  )}
                  {loading ? 'অপেক্ষা করুন...' : 'হ্যাঁ, চালু করুন'}
                </button>

                <button
                  onClick={handleDeny}
                  className="px-4 py-3 rounded-2xl text-xs font-black text-violet-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  এখন না
                </button>
              </div>

              <p className="text-center text-violet-400 text-[10px] font-bold mt-3">
                ✨ একবার Allow করলে আর জিজ্ঞেস করব না
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} className="text-emerald-400" />
              </div>
              <p className="text-white font-black text-sm mb-1">✅ নোটিফিকেশন চালু হয়েছে!</p>
              <p className="text-emerald-300 text-xs font-bold">এখন থেকে সব আপডেট পাবেন</p>
            </div>
          )}

          {step === 'denied' && (
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-3">
                <BellOff size={24} className="text-red-400" />
              </div>
              <p className="text-white font-black text-sm mb-1">নোটিফিকেশন বন্ধ আছে</p>
              <p className="text-red-300 text-xs font-bold">{ASK_AGAIN_DAYS} দিন পরে আবার জিজ্ঞেস করব</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
