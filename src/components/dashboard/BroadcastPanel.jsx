'use client';
import { useState, useEffect, useMemo } from 'react';
import { Send, Mail, Users, ShoppingBag, UserX, Loader2, CheckCircle, Clock, AlertTriangle, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/auth';
import { getOrders } from '@/lib/firestore';
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

  // Customer email loading
  const [allOrders, setAllOrders] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [showEmailList, setShowEmailList] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [excludedEmails, setExcludedEmails] = useState(new Set());

  // Load orders to extract emails
  useEffect(() => {
    if (!shopId) return;
    setLoadingEmails(true);
    getOrders(shopId)
      .then(orders => {
        setAllOrders(orders);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingEmails(false));
  }, [shopId]);

  // Reset exclusions when segment changes
  useEffect(() => {
    setExcludedEmails(new Set());
  }, [segment]);

  // Compute emails for selected segment
  const segmentEmails = useMemo(() => {
    const emailSet = new Set();
    const emailInfo = {}; // email -> { name, segment }
    allOrders.forEach(order => {
      const email = order.customerEmail;
      if (!email || !email.includes('@')) return;
      if (excludedEmails.has(email)) return; // Filter out session-excluded emails
      const status = order.status || 'pending';
      let seg = 'all';
      if (status === 'completed') seg = 'buyers';
      else seg = 'abandoned';
      if (!emailInfo[email]) {
        emailInfo[email] = { name: order.customerName || email.split('@')[0], seg };
      }
      emailSet.add(email);
    });

    const filtered = Object.entries(emailInfo)
      .filter(([email, info]) => {
        if (segment === 'all') return true;
        if (segment === 'buyers') return info.seg === 'buyers';
        if (segment === 'abandoned') return info.seg === 'abandoned';
        return true;
      })
      .map(([email, info]) => ({ email, name: info.name }));

    return filtered;
  }, [allOrders, segment, excludedEmails]);

  // Re-initialize selected emails when segment changes
  useEffect(() => {
    setSelectedEmails(new Set(segmentEmails.map(e => e.email)));
  }, [segmentEmails]);

  const toggleEmail = (email) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedEmails.size === segmentEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(segmentEmails.map(e => e.email)));
    }
  };

  const handleRemoveEmail = (email) => {
    setExcludedEmails(prev => {
      const next = new Set(prev);
      next.add(email);
      return next;
    });
    setSelectedEmails(prev => {
      const next = new Set(prev);
      next.delete(email);
      return next;
    });
  };

  // Load history
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
    if (selectedEmails.size === 0) { toast.error('কমপক্ষে একটি ইমেইল সিলেক্ট করুন'); return; }

    setSending(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          shopId, 
          subject, 
          message, 
          segment, 
          emails: Array.from(selectedEmails),
          target: 'specific_shop',
          senderRole: 'retailer',
          senderName: user?.displayName || 'Shop Owner',
          broadcastId: crypto.randomUUID() 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ব্রডকাস্ট ব্যর্থ');

      toast.success(`${data.sent || 0}/${data.total || selectedEmails.size} ইমেইল সফলভাবে পাঠানো হয়েছে! 📧`);
      setSubject(''); setMessage('');

      // Refresh history
      const token2 = await auth.currentUser.getIdToken();
      const hRes = await fetch(`/api/broadcast?shopId=${shopId}`, {
        headers: { Authorization: `Bearer ${token2}` },
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

      {/* Email List Panel */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowEmailList(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-blue-500" />
            <span className="text-xs font-black text-slate-700">
              {loadingEmails ? 'ইমেইল লোড হচ্ছে...' : `${selectedEmails.size} / ${segmentEmails.length} ইমেইল সিলেক্ট করা হয়েছে`}
            </span>
          </div>
          {showEmailList ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </button>

        {showEmailList && (
          <div className="max-h-52 overflow-y-auto">
            {loadingEmails ? (
              <div className="py-6 text-center"><Loader2 size={16} className="animate-spin mx-auto text-slate-300" /></div>
            ) : segmentEmails.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 text-center py-6">
                এই সেগমেন্টে কোনো ইমেইল নেই
              </p>
            ) : (
              <div className="p-3 space-y-1.5">
                {/* Select All */}
                <div
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-blue-50 cursor-pointer"
                  onClick={toggleAll}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selectedEmails.size === segmentEmails.length ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                  }`}>
                    {selectedEmails.size === segmentEmails.length && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </div>
                  <span className="text-xs font-black text-blue-700">সব সিলেক্ট / আনসিলেক্ট</span>
                </div>
                {segmentEmails.map(({ email, name }) => (
                  <div
                    key={email}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                      selectedEmails.has(email) ? 'bg-emerald-50' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => toggleEmail(email)}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedEmails.has(email) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'
                    }`}>
                      {selectedEmails.has(email) && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{email}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveEmail(email); }}
                      className="p-1 hover:bg-red-100 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
          disabled={sending || !subject.trim() || !message.trim() || selectedEmails.size === 0}
          className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? <><Loader2 size={16} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Send size={16} /> ব্রডকাস্ট পাঠান ({selectedEmails.size} জনকে)</>}
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
