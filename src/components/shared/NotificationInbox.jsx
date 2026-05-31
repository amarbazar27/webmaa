'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Info, AlertTriangle, Sparkles, Store, Search, Trash2, CheckCheck } from 'lucide-react';
import { subscribeBroadcasts } from '@/lib/firestore';

const parseTimestamp = (ts) => {
  if (!ts) return Date.now();
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000 + (ts.nanoseconds ? ts.nanoseconds / 1000000 : 0);
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  const parsed = new Date(ts).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
};

const TYPE_CONFIG = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', iconColor: 'text-amber-500' },
  promo: { icon: Sparkles, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', iconColor: 'text-purple-500' },
};

export default function NotificationInbox({ shopId = null, isDashboard = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [readIds, setReadIds] = useState([]);

  useEffect(() => {
    try {
      const storedDeleted = localStorage.getItem('deleted_notifications');
      if (storedDeleted) setDeletedIds(JSON.parse(storedDeleted));
      
      const storedRead = localStorage.getItem('read_notifications');
      if (storedRead) setReadIds(JSON.parse(storedRead));
    } catch {}
  }, []);

  useEffect(() => {
    const unsub = subscribeBroadcasts((allBroadcasts) => {
      let relevant = allBroadcasts.filter(b => {
        // 1. If specific shop, it must match shopId
        if (b.target === 'specific_shop' || b.target === 'shop_users') {
          return b.shopId === shopId;
        }
        
        // 2. If retailers only, must be in dashboard
        if (b.target === 'retailers') {
          return isDashboard;
        }
        
        // 3. If customers only, must be in storefront
        if (b.target === 'customers') {
          return !isDashboard;
        }
        
        // 4. Global target 'all' or empty target
        if (b.target === 'all' || !b.target) {
          return true;
        }
        
        return false;
      });

      // Sort newest first, limit to 30
      relevant.sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt));

      setNotifications(relevant.slice(0, 30));
    }, (err) => {
      console.warn('[NotificationInbox] Listener failed:', err.message);
    }, shopId);

    return () => unsub();
  }, [shopId, isDashboard]);

  const visibleNotifications = notifications.filter(n => !deletedIds.includes(n.id)).slice(0, 20);
  const unreadCount = visibleNotifications.filter(n => !readIds.includes(n.id)).length;

  const handleDelete = (id) => {
    try {
      const stored = localStorage.getItem('deleted_notifications');
      const persisted = stored ? JSON.parse(stored) : [];
      const merged = [...new Set([...persisted, id])];
      localStorage.setItem('deleted_notifications', JSON.stringify(merged));
      setDeletedIds(merged);
    } catch {
      const newDeleted = [...new Set([...deletedIds, id])];
      setDeletedIds(newDeleted);
    }
  };

  const handleClearAll = () => {
    try {
      const stored = localStorage.getItem('deleted_notifications');
      const persisted = stored ? JSON.parse(stored) : [];
      // Clear ALL loaded notifications in state to prevent hidden older ones from appearing!
      const merged = [...new Set([...persisted, ...notifications.map(n => n.id)])];
      localStorage.setItem('deleted_notifications', JSON.stringify(merged));
      setDeletedIds(merged);
    } catch {
      const allIds = [...new Set([...deletedIds, ...notifications.map(n => n.id)])];
      setDeletedIds(allIds);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    // Mark all visible as read
    try {
      const newReadIds = [...new Set([...readIds, ...visibleNotifications.map(n => n.id)])];
      localStorage.setItem('read_notifications', JSON.stringify(newReadIds));
      setReadIds(newReadIds);
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
                {visibleNotifications.length > 0 && (
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
              {visibleNotifications.length === 0 ? (
                <div className="text-center py-20 opacity-50 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                     <Bell size={32} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500">কোনো নোটিফিকেশন নেই</p>
                </div>
              ) : (
                visibleNotifications.map(notif => {
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
                        className="absolute top-1 right-1 p-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
                        title="ডিলিট করুন"
                        style={{ minWidth: '40px', minHeight: '40px' }}
                      >
                        <Trash2 size={16} />
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
                               {notif.senderName || (isSystem ? 'Daripallah' : 'Shop')}
                             </span>
                             <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                             <span className="text-[10px] font-bold opacity-50">
                               {notif.createdAt ? new Date(parseTimestamp(notif.createdAt)).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'New'}
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
