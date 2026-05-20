'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut, Store, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * ImpersonationBadge — Superadmin রিটেইলার হিসেবে লগইন থাকলে দেখায়
 * Dashboard layout-এ সবসময় দৃশ্যমান থাকবে
 */
export default function ImpersonationBadge() {
  const { impersonation, exitImpersonation, isImpersonating } = useAuth();
  const router = useRouter();
  const [elapsed, setElapsed] = useState('');
  const [exiting, setExiting] = useState(false);

  // Session duration timer
  useEffect(() => {
    if (!impersonation?.startedAt) return;

    const update = () => {
      const start = new Date(impersonation.startedAt);
      const diff = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${s}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [impersonation?.startedAt]);

  if (!isImpersonating || !impersonation) return null;

  const handleExit = async () => {
    setExiting(true);
    try {
      await exitImpersonation();
      toast.success('ইম্পার্সোনেশন শেষ — সুপারঅ্যাডমিন মোডে ফিরে এসেছেন');
      router.push('/superadmin');
    } catch (err) {
      toast.error('Exit failed: ' + err.message);
      setExiting(false);
    }
  };

  return (
    <>
      {/* ── Fixed Top Banner ── */}
      <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 py-2.5"
        style={{
          background: 'linear-gradient(135deg, #DC2626, #991B1B)',
          boxShadow: '0 2px 20px rgba(220,38,38,0.4)',
        }}>

        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <ShieldAlert size={14} className="text-white" />
          </div>
          <div>
            <p className="text-white text-[10px] font-black uppercase tracking-widest leading-none">
              ⚠️ ইম্পার্সোনেশন মোড সক্রিয়
            </p>
            <p className="text-red-200 text-xs font-bold mt-0.5">
              আপনি এখন <span className="text-white font-black">{impersonation.shopName}</span>-এর ড্যাশবোর্ড দেখছেন
            </p>
          </div>
        </div>

        {/* Center: Session info */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
            <Store size={12} className="text-red-200" />
            <span className="text-white text-xs font-bold">{impersonation.email || impersonation.shopId}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
            <Clock size={12} className="text-red-200" />
            <span className="text-white text-xs font-mono font-bold">{elapsed}</span>
          </div>
        </div>

        {/* Right: Exit button */}
        <button
          onClick={handleExit}
          disabled={exiting}
          className="flex items-center gap-2 px-4 py-2 bg-white text-red-700 rounded-xl text-xs font-black hover:bg-red-50 transition-all disabled:opacity-60 shadow-lg"
        >
          <LogOut size={13} />
          {exiting ? 'বের হচ্ছে...' : 'ইম্পার্সোনেশন শেষ করুন'}
        </button>
      </div>

      {/* Spacer to push dashboard content below the fixed banner */}
      <div className="h-11" />
    </>
  );
}
