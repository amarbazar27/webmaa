'use client';
import { useState, useEffect } from 'react';
import { Send, Mail, Users, ShoppingBag, UserX, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/auth';
import toast from 'react-hot-toast';

const SEGMENTS = [
  { key: 'all', label: 'সকল গ্রাহক', labelEn: 'All Customers', icon: Users, desc: 'যারা কখনো অর্ডার করেছে' },
  { key: 'buyers', label: 'ক্রেতা', labelEn: 'Verified Buyers', icon: ShoppingBag, desc: 'সম্পন্ন অর্ডার আছে' },
  { key: 'abandoned', label: 'অসম্পন্ন', labelEn: 'Abandoned', icon: UserX, desc: 'অর্ডার করেছে কিন্তু সম্পন্ন হয়নি' },
];

export default function BroadcastPanel({ shopId }) {
  const { user } = useAuth();
  const [segment, setSegment] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    fetch(`/api/broadcast?shopId=${shopId}`, {
      headers: user ? { Authorization: `Bearer ${auth.currentUser?.accessToken}` } : {},
    })
      .then(r => r.json())
      .then(data => { setHistory(data.history || []); setLoadingHistory(false); })
      .catch(() => setLoadingHistory(false));
  }, [shopId]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) { toast.error('বিষয় ও মেসেজ লিখুন'); return; }
    if (!user) { toast.error('লগইন করুন'); return; }

    setSending(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shopId, subject, message, segment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`${data.sent}/${data.total} ইমেইল সফলভাবে পাঠানো হয়েছে! 📧`);
      setSubject(''); setMessage('');

      // Refresh history
      const hRes = await fetch(`/api/broadcast?shopId=${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hData = await hRes.json();
      setHistory(hData.history || []);
    } catch (err) {
      toast.error(err.message || 'ব্রডকাস্ট ব্যর্থ হয়েছে');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Mail size={22} />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">ব্রডকাস্ট</h3>
          <p className="text-xs font-bold text-slate-400">গ্রাহকদের ইমেইল পাঠান</p>
        </div>
      </div>

      {/* Segment Selector */}
      <div className="grid grid-cols-3 gap-3">
        {SEGMENTS.map(seg => (
          <button
            key={seg.key}
            onClick={() => setSegment(seg.key)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              segment === seg.key
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <seg.icon size={20} className={segment === seg.key ? 'text-blue-600 mb-2' : 'text-slate-400 mb-2'} />
            <p className="text-xs font-black text-slate-900">{seg.label}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">{seg.desc}</p>
          </button>
        ))}
      </div>

      {/* Compose */}
      <div className="space-y-4">
        <input
          type="text"
          maxLength={200}
          placeholder="বিষয় (Subject)"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full text-sm font-bold text-slate-900 p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-300"
        />
        <textarea
          rows={4}
          maxLength={2000}
          placeholder="মেসেজ লিখুন..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full text-sm font-bold text-slate-900 p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-300 resize-none"
        />
        <button
          onClick={handleSend}
          disabled={sending || !subject.trim() || !message.trim()}
          className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? <><Loader2 size={16} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Send size={16} /> ব্রডকাস্ট পাঠান ({SEGMENTS.find(s => s.key === segment)?.label})</>}
        </button>
      </div>

      {/* History */}
      <div>
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">সাম্প্রতিক ব্রডকাস্ট</h4>
        {loadingHistory ? (
          <div className="py-8 text-center"><Loader2 size={16} className="animate-spin mx-auto text-slate-300" /></div>
        ) : history.length === 0 ? (
          <p className="text-xs font-bold text-slate-400 text-center py-8">কোনো ব্রডকাস্ট পাঠানো হয়নি</p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 5).map(item => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-black text-slate-900">{item.subject}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] uppercase tracking-widest">{item.segment}</span>
                    by {item.sentByName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={12} /> {item.sent} sent
                  </p>
                  {item.failed > 0 && (
                    <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-0.5">
                      <AlertTriangle size={10} /> {item.failed} failed
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
