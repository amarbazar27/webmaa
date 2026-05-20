'use client';
import { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, Sparkles, Bell } from 'lucide-react';
import { subscribeBroadcasts } from '@/lib/firestore';

const TYPE_CONFIG = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', iconColor: 'text-amber-500' },
  promo: { icon: Sparkles, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', iconColor: 'text-purple-500' },
};

export default function NotificationBanner({ shopId = null }) {
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    // Load dismissed IDs from sessionStorage
    try {
      const stored = sessionStorage.getItem('dismissed_notifications');
      if (stored) setDismissed(JSON.parse(stored));
    } catch {}

    const unsub = subscribeBroadcasts((allBroadcasts) => {
      // Filter: show global broadcasts (target=all) + shop-specific ones
      const relevant = allBroadcasts.filter(b => {
        // Fix for old retailer broadcasts mistakenly sent as 'all'
        if (b.target === 'all' && (b.senderRole === 'superadmin' || b.senderRole === 'system')) return true;
        if (b.target === 'customers') return true;
        if (b.target === 'specific_shop' && b.shopId === shopId) return true;
        if (b.target === 'shop_users' && b.shopId === shopId) return true;
        return false;
      });
      // Sort newest first
      relevant.sort((a, b) => {
        const timeA = a.createdAt?.seconds || Date.now();
        const timeB = b.createdAt?.seconds || Date.now();
        return timeB - timeA;
      });
      setNotifications(relevant);
    }, (err) => {
      console.warn('[NotificationBanner] Listener failed:', err.message);
    });

    return () => unsub();
  }, [shopId]);

  const handleDismiss = (id) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    try {
      sessionStorage.setItem('dismissed_notifications', JSON.stringify(newDismissed));
    } catch {}
  };

  const visible = notifications.filter(n => !dismissed.includes(n.id));
  if (visible.length === 0) return null;

  const latestNotif = visible[0];
  const config = TYPE_CONFIG[latestNotif.type] || TYPE_CONFIG.info;
  const Icon = config.icon;

  return (
    <div className="space-y-0 relative z-[100]">
      <div
        key={latestNotif.id}
        className={`${config.bg} ${config.border} border-b px-4 py-3 animate-slide-in`}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className={`shrink-0 ${config.iconColor}`}>
            <Icon size={18} />
          </div>
          <p className={`flex-1 text-sm font-bold ${config.text}`}>
            {latestNotif.message}
          </p>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40 hidden md:block">
            {latestNotif.senderRole === 'superadmin' ? 'System' : 'Shop'}
          </span>
          <button
            onClick={() => handleDismiss(latestNotif.id)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X size={14} className="opacity-40" />
          </button>
        </div>
      </div>
    </div>
  );
}
