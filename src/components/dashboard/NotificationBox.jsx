'use client';
import { useState } from 'react';
import { Send, Bell, Info, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { sendBroadcast } from '@/lib/firestore';
import toast from 'react-hot-toast';

export default function NotificationBox({ senderRole, shopId = null }) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // info, warning, promo
  const [target, setTarget] = useState('all'); // all, customers (if retailer)
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('বার্তা লিখুন');
      return;
    }

    setLoading(true);
    try {
      await sendBroadcast({
        message,
        type,
        target: senderRole === 'superadmin' ? target : 'shop_users',
        senderRole,
        shopId,
        senderName: senderRole === 'superadmin' ? 'System Admin' : 'Shop Owner'
      });
      toast.success('নোটিফিকেশন সফলভাবে পাঠানো হয়েছে! 🚀');
      setMessage('');
    } catch (err) {
      toast.error('নোটিফিকেশন পাঠাতে সমস্যা হয়েছে');
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
      </div>

      <p className="mt-6 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
        {senderRole === 'superadmin' 
          ? '⚠️ এই বার্তাটি প্ল্যাটফর্মের সকল ব্যবহারকারীর কাছে সাথে সাথে পৌঁছে যাবে।' 
          : '⚠️ এই বার্তাটি আপনার স্টোরের সকল ভিজিটরদের কাছে দৃশ্যমান হবে।'}
      </p>
    </div>
  );
}
