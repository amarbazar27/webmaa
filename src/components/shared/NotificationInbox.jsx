'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Info, AlertTriangle, Sparkles, Store, Search, Trash2, CheckCheck } from 'lucide-react';
import { subscribeBroadcasts } from '@/lib/firestore';

const TYPE_CONFIG = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', iconColor: 'text-amber-500' },
  promo: { icon: Sparkles, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', iconColor: 'text-purple-500' },
};

export default function NotificationInbox({ shopId = null, isDashboard = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletedIds, setDeletedIds] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('deleted_notifications');
      if (stored) setDeletedIds(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    // Determine which notifications are relevant
    const unsub = subscribeBroadcasts((allBroadcasts) => {
      let relevant = allBroadcasts.filter(b => {
        if (b.target === 'all') return true;
        
        // Dashboard user (Retailer/Staff)
        if (isDashboard) {
           if (b.target === 'shop_users') return true;
           if (b.target === 'specific_shop' && b.shopId === shopId) return true;
        } 
        // Storefront user (Customer)
        else {
           if (b.target === 'customers') return true;
           if (b.target === 'specific_shop' && b.shopId === shopId) return true;
           if (b.target === 'shop_users' && b.shopId === shopId) return true; // Keep local broadcasts visible to customers too
        }
        return false;
      });

      // Sort newest first
      relevant.sort((a, b) => {
        const timeA = a.createdAt?.seconds || Date.now();
        const timeB = b.createdAt?.seconds || Date.now();
        return timeB - timeA;
      });

      setNotifications(relevant);

      // Check read status from local storage
      let readIds = [];
      try {
        const stored = localStorage.getItem('read_notifications');
        if (stored) readIds = JSON.parse(stored);
      } catch {}

      // Filter out deleted notifications
      relevant = relevant.filter(n => !deletedIds.includes(n.id));

      const unread = relevant.filter(n => !readIds.includes(n.id)).length;
      setUnreadCount(unread);

    }, (err) => {
      console.warn('[NotificationInbox] Listener failed:', err.message);
    });

    return () => unsub();
  }, [shopId, isDashboard, deletedIds]);

  const handleDelete = (id) => {
    const newDeleted = [...deletedIds, id];
    setDeletedIds(newDeleted);
    try {
      localStorage.setItem('deleted_notifications', JSON.stringify(newDeleted));
    } catch {}
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    const allIds = [...new Set([...deletedIds, ...notifications.map(n => n.id)])];
    setDeletedIds(allIds);
    try {
      localStorage.setItem('deleted_notifications', JSON.stringify(allIds));
    } catch {}
    setNotifications([]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    // Mark all as read
    try {
      const readIds = notifications.map(n => n.id);
      localStorage.setItem('read_notifications', JSON.stringify(readIds));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <>
      <button 
        onClick={handleOpen}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      >
        <Bell size={20} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {/* Slide-over Inbox */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] overflow-hidden pointer-events-auto">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div>
                 <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Bell size={18} className="text-purple-600" />
                    নোটিফিকেশন
                 </h2>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Updates & Alerts</p>
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    title="সব ডিলিট করুন"
                    className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center py-20 opacity-50 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                     <Bell size={32} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500">কোনো নোটিফিকেশন নেই</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                  const Icon = config.icon;
                  const isSystem = notif.senderRole === 'superadmin' || notif.senderRole === 'system';

                  return (
                    <div key={notif.id} className={`p-4 rounded-2xl border ${config.bg} ${config.border} shadow-sm relative overflow-hidden group`}>
                      {isSystem && (
                         <div className="absolute top-0 right-0 px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-lg opacity-80">
                           System
                         </div>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        title="ডিলিট করুন"
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      <div className="flex items-start gap-3 relative z-10 pr-6">
                        <div className={`mt-0.5 shrink-0 ${config.iconColor}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold leading-snug ${config.text}`}>
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-[10px] font-bold opacity-50 uppercase tracking-wider flex items-center gap-1">
                               {isSystem ? <Store size={10} /> : <Store size={10} />}
                               {notif.senderName || (isSystem ? 'Webmaa' : 'Shop')}
                             </span>
                             <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                             <span className="text-[10px] font-bold opacity-50">
                               {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString() : 'New'}
                             </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
