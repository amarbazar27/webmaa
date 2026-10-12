'use client';
import { useState, useEffect, useMemo } from 'react';
import { Send, Mail, Users, ShoppingBag, UserX, Loader2, CheckCircle, Clock, AlertTriangle, Trash2, X, ChevronDown, ChevronUp, Bell, Sparkles, Info, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/auth';
import { getOrders } from '@/lib/firestore';
import toast from 'react-hot-toast';

const SEGMENTS = [
  { key: 'all', label: 'সকল গ্রাহক', labelEn: 'All Customers', icon: Users, desc: 'যারা কখনো অর্ডার করেছে' },
  { key: 'buyers', label: 'ক্রেতা', labelEn: 'Verified Buyers', icon: ShoppingBag, desc: 'সম্পন্ন অর্ডার আছে' },
  { key: 'abandoned', label: 'অসম্পন্ন', labelEn: 'Abandoned', icon: UserX, desc: 'অর্ডার করেছে কিন্তু সম্পন্ন হয়নি' },
];

const NOTIF_TYPES = [
  { id: 'promo', label: 'অফার ও সেল', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'info', label: 'জরুরি তথ্য', icon: Info, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'warning', label: 'সতর্কতা / নোটিশ', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

export default function BroadcastPanel({ shopId }) {
  const { user } = useAuth();
  const [broadcastMode, setBroadcastMode] = useState('push'); // 'push' | 'email'

  // Push Notification State
  const [pushMessage, setPushMessage] = useState('');
  const [pushType, setPushType] = useState('promo');
  const [sendingPush, setSendingPush] = useState(false);

  // Email State
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
    const emailInfo = {};
    allOrders.forEach(order => {
      const email = order.customerEmail;
      if (!email || !email.includes('@')) return;
      if (excludedEmails.has(email)) return;
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
  const loadHistory = async () => {
    if (!shopId) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/broadcast?shopId=${shopId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [shopId]);

  // Send Push Notification Handler
  const handleSendPush = async () => {
    if (!pushMessage.trim()) { toast.error('নোটিফিকেশন বার্তা লিখুন'); return; }
    if (!user) { toast.error('লগইন করুন'); return; }

    setSendingPush(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          shopId,
          message: pushMessage.trim(),
          type: pushType,
          senderRole: 'retailer',
          senderName: user?.displayName || 'Shop Owner',
          target: 'specific_shop',
          broadcastId: crypto.randomUUID()
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'নোটিফিকেশন পাঠানো ব্যর্থ');

      toast.success('গ্রাহকদের ফোনে নোটিফিকেশন সফলভাবে পাঠানো হয়েছে! 📱');
      setPushMessage('');
      loadHistory();
    } catch (err) {
      toast.error(err.message || 'নোটিফিকেশন পাঠাতে ব্যর্থ');
    } finally {
      setSendingPush(false);
    }
  };

  // Send Email Handler
  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) { toast.error('বিষয় ও মেসেজ লিখুন'); return; }
    if (!user) { toast.error('লগইন করুন'); return; }
    if (selectedEmails.size === 0) { toast.error('কমপক্ষে একটি ইমেইল সিলেক্ট করুন'); return; }

    setSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
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
      loadHistory();
    } catch (err) {
      toast.error(err.message || 'ব্রডকাস্ট ব্যর্থ হয়েছে');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Broadcast Mode Selector */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setBroadcastMode('push')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            broadcastMode === 'push'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell size={16} /> 📱 অ্যাপ ও ফোন পুশ নোটিফিকেশন
        </button>
        <button
          type="button"
          onClick={() => setBroadcastMode('email')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            broadcastMode === 'email'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Mail size={16} /> 📧 গ্রাহক ইমেইল
        </button>
      </div>

      {/* ── Mode A: Push Notification ────────────────────────────────────────── */}
      {broadcastMode === 'push' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">ফোন পুশ নোটিফিকেশন</h3>
              <p className="text-xs font-bold text-slate-400">অ্যাপ ব্যবহারকারী ও কাস্টমারদের ফোনের হোমস্ক্রিনে নোটিফিকেশন পাঠান</p>
            </div>
          </div>

          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-3">
            {NOTIF_TYPES.map(t => {
              const IconComp = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPushType(t.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    pushType === t.id
                      ? `${t.color} font-black shadow-sm`
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <IconComp size={18} className="mb-1" />
                  <p className="text-xs font-black">{t.label}</p>
                </button>
              );
            })}
          </div>

          {/* Message Input */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-700 block">নোটিফিকেশন মেসেজ</label>
            <textarea
              rows={4}
              maxLength={250}
              placeholder="যেমন: আজকের বিশেষ অফার! সব পোশাকে ২০% ছাড়। এখনই ভিজিট করুন... 🛍️"
              value={pushMessage}
              onChange={e => setPushMessage(e.target.value)}
              className="w-full text-sm font-bold text-slate-900 p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-purple-500 focus:bg-white transition-colors placeholder:text-slate-300 resize-none"
            />
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
              <span>{pushMessage.length} / ২৫০ অক্ষর</span>
              <span>সব সক্রিয় ফোন ও অ্যাপ ইনস্টল ডিভাইসে পৌঁছাবে</span>
            </div>
            <button
              type="button"
              onClick={handleSendPush}
              disabled={sendingPush || !pushMessage.trim()}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-black transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {sendingPush ? <><Loader2 size={16} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Smartphone size={16} /> গ্রাহকদের ফোনে নোটিফিকেশন পাঠান</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Mode B: Email Broadcast ────────────────────────────────────────── */}
      {broadcastMode === 'email' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Mail size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">ইমেইল ব্রডকাস্ট</h3>
              <p className="text-xs font-bold text-slate-400">গ্রাহকদের ইনবক্সে প্রফেশনাল ইমেইল পাঠান</p>
            </div>
          </div>

          {/* Segment Selector */}
          <div className="grid grid-cols-3 gap-3">
            {SEGMENTS.map(seg => (
              <button
                key={seg.key}
                type="button"
                onClick={() => setSegment(seg.key)}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
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
              type="button"
              onClick={() => setShowEmailList(prev => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
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
                          type="button"
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

          {/* Compose Email */}
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
              type="button"
              onClick={handleSendEmail}
              disabled={sending || !subject.trim() || !message.trim() || selectedEmails.size === 0}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {sending ? <><Loader2 size={16} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Send size={16} /> ব্রডকাস্ট পাঠান ({selectedEmails.size} জনকে)</>}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">প্রেরিত বার্তা হিস্ট্রি</h4>
        {loadingHistory ? (
          <div className="py-8 text-center"><Loader2 size={16} className="animate-spin mx-auto text-slate-300" /></div>
        ) : history.length === 0 ? (
          <p className="text-xs font-bold text-slate-400 text-center py-8">কোনো ব্রডকাস্ট হিস্ট্রি নেই</p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 8).map(item => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-black text-slate-900">{item.subject || item.message}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] uppercase tracking-widest">{item.segment || item.type || 'push'}</span>
                    by {item.sentByName || 'Owner'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={12} /> {item.sent !== undefined ? `${item.sent} sent` : 'Delivered'}
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
