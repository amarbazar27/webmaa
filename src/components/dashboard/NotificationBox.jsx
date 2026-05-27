'use client';
import { useState, useEffect } from 'react';
import { Send, Bell, Info, AlertTriangle, Sparkles, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscribeBroadcasts, deleteBroadcast } from '@/lib/firestore';

export default function NotificationBox({ senderRole, shopId = null }) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [target, setTarget] = useState('all');
  const [loading, setLoading] = useState(false);

  // ── Sent Box / History Broadcast State & Handlers ───────────────────────
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    const unsub = subscribeBroadcasts((data) => {
      // Filter: only show broadcasts sent by this retailer for this shop
      const shopBroadcasts = data.filter(b => b.shopId === shopId && b.senderRole === 'retailer');
      setBroadcasts(shopBroadcasts);
      setLoadingHistory(false);
    }, (err) => {
      console.warn('[NotificationBox] Listener failed:', err.message);
      setLoadingHistory(false);
    }, shopId);
    return () => unsub();
  }, [shopId]);

  const handleDeleteBroadcast = async (id) => {
    if (!confirm('আপনি কি নিশ্চিত যে আপনি এই নোটিফিকেশনটি মুছে ফেলতে চান? এটি কাস্টমারদের স্ক্রীন থেকেও মুছে যাবে।')) return;
    try {
      await deleteBroadcast(id);
      toast.success('নোটিফিকেশনটি সফলভাবে মুছে ফেলা হয়েছে! 🗑️');
    } catch (err) {
      toast.error('মুছে ফেলতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('বার্তা লিখুন');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          type,
          target: senderRole === 'superadmin' ? target : 'shop_users',
          senderRole,
          shopId,
          senderName: senderRole === 'superadmin' ? 'System Admin' : 'Shop Owner'
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('নোটিফিকেশন সফলভাবে পাঠানো হয়েছে! 🚀');
      setMessage('');
    } catch (err) {
      toast.error(err.message || 'নোটিফিকেশন পাঠাতে সমস্যা হয়েছে');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { id: 'info', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', label: 'তথ্য' },
    { id: 'warning', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', label: 'সতর্কতা' },
    { id: 'promo', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', label: 'অফার' },
  ];

  return (
    <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Bell size={28} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">নোটিফিকেশন বক্স</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">সরাসরি সবার কাছে বার্তা পাঠান</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Type Selector */}
        <div className="flex gap-3">
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`flex-1 py-3 px-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-black ${
                type === t.id 
                  ? `${t.bg} ${t.border} ${t.color} shadow-sm scale-[1.02]` 
                  : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-100'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Message Area */}
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="আপনার বার্তা এখানে লিখুন..."
            className="w-full h-32 p-5 bg-slate-50 border-2 border-transparent rounded-3xl text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-500/30 transition-all resize-none"
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${message.length > 150 ? 'text-red-500' : 'text-slate-300'}`}>
              {message.length}/200
            </span>
          </div>
        </div>

        {/* Target (Superadmin only) */}
        {senderRole === 'superadmin' && (
          <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">Target:</span>
             <select 
               value={target} 
               onChange={e => setTarget(e.target.value)}
               className="bg-transparent text-xs font-black text-indigo-700 outline-none flex-1"
             >
                <option value="all">Everyone (All Shops + Visitors)</option>
                <option value="retailers">Retailers Only</option>
                <option value="customers">Customers Only</option>
             </select>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={loading || !message.trim()}
          className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              প্রেরণ করা হচ্ছে...
            </>
          ) : (
            <>
              <Send size={18} />
              বার্তা পাঠান
            </>
          )}
        </button>

        {/* Sent History (Send Box) */}
        <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Send size={12} className="text-purple-600" /> প্রেরিত বার্তা (Sent History)
              </h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">আপনার সাম্প্রতিক প্রেরিত নোটিফিকেশন সমূহ</p>
            </div>
            <span className="text-[10px] font-black bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">
              {broadcasts.length} টি প্রেরিত
            </span>
          </div>

          {loadingHistory ? (
            <div className="py-6 text-center">
              <Loader2 className="animate-spin mx-auto text-slate-300 mb-2" size={16} />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">লোড হচ্ছে...</p>
            </div>
          ) : broadcasts.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              কোনো নোটিফিকেশন পাঠানো হয়নি
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {broadcasts.map(notif => {
                const isWarning = notif.type === 'warning';
                const isPromo = notif.type === 'promo';
                const bgClass = isWarning ? 'bg-amber-50 border-amber-100 text-amber-800' : isPromo ? 'bg-purple-50 border-purple-100 text-purple-800' : 'bg-blue-50 border-blue-100 text-blue-800';

                return (
                  <div key={notif.id} className={`p-4 rounded-2xl border flex items-start justify-between gap-4 shadow-sm relative group overflow-hidden ${bgClass}`}>
                    <div className="flex-1 min-w-0 pr-8 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          notif.type === 'warning' ? 'bg-amber-100 text-amber-700' : notif.type === 'promo' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {notif.type}
                        </span>
                      </div>
                      <p className="text-xs font-bold leading-relaxed break-words">
                        {notif.message}
                      </p>
                      <p className="text-[9px] opacity-65 font-bold">
                        {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'নতুন'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteBroadcast(notif.id)}
                      className="shrink-0 p-2.5 bg-red-100/50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      title="মুছে ফেলুন"
                      style={{ minWidth: '36px', minHeight: '36px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
        {senderRole === 'superadmin' 
          ? '⚠️ এই বার্তাটি প্ল্যাটফর্মের সকল ব্যবহারকারীর কাছে সাথে সাথে পৌঁছে যাবে।' 
          : '⚠️ এই বার্তাটি আপনার স্টোরের সকল ভিজিটরদের কাছে দৃশ্যমান হবে।'}
      </p>
    </div>
  );
}
