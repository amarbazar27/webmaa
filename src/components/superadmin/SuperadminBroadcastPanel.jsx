'use client';
import { useState, useEffect, useMemo } from 'react';
import { Send, Bell, Mail, Users, Store, Loader2, Info, AlertTriangle, Sparkles, ChevronDown, ChevronUp, Check, X, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscribeBroadcasts, deleteBroadcast } from '@/lib/firestore';
import { auth } from '@/lib/firebase';

const NOTIFICATION_TYPES = [
  { id: 'info', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', label: 'তথ্য' },
  { id: 'warning', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', label: 'সতর্কতা' },
  { id: 'promo', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', label: 'অফার' },
];

export default function SuperadminBroadcastPanel({ shops = [] }) {
  const [tab, setTab] = useState('notification'); // 'notification' | 'email' | 'sent'

  // ── Sent Box / History Broadcast State & Handlers ───────────────────────
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(true);

  useEffect(() => {
    const unsub = subscribeBroadcasts((data) => {
      // Filter: only show superadmin/system broadcast messages
      const adminBroadcasts = data.filter(b => b.senderRole === 'superadmin' || b.senderRole === 'system');
      setBroadcasts(adminBroadcasts);
      setLoadingBroadcasts(false);
    }, (err) => {
      console.warn('[SuperadminBroadcastPanel] Listener failed:', err.message);
      setLoadingBroadcasts(false);
    });
    return () => unsub();
  }, []);

  const handleDeleteBroadcast = async (id) => {
    if (!confirm('আপনি কি নিশ্চিত যে আপনি এই নোটিফিকেশনটি মুছে ফেলতে চান? এটি কাস্টমারদের স্ক্রীন থেকেও মুছে যাবে।')) return;
    try {
      await deleteBroadcast(id);
      toast.success('নোটিফিকেশনটি সফলভাবে মুছে ফেলা হয়েছে! 🗑️');
    } catch (err) {
      toast.error('মুছে ফেলতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  const handleClearAllBroadcasts = async () => {
    if (!confirm('সব নোটিফিকেশন মুছে ফেলতে চান? এটি প্ল্যাটফর্মের সব নোটিফিকেশন চিরতরে মুছে ফেলবে।')) return;
    try {
      const deletePromises = broadcasts.map(b => deleteBroadcast(b.id));
      await Promise.all(deletePromises);
      toast.success('সব নোটিফিকেশন মুছে ফেলা হয়েছে! 🧹');
    } catch (err) {
      toast.error('মুছতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  // ── Notification State ──────────────────────────────────────────────────
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('info');
  const [notifTarget, setNotifTarget] = useState('all'); // all | retailers | specific_retailer | specific_shop_customers
  const [selectedShopId, setSelectedShopId] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  // ── Email State ─────────────────────────────────────────────────────────
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailTarget, setEmailTarget] = useState('all_customers'); 
  const [emailShopId, setEmailShopId] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailShopDropdown, setShowEmailShopDropdown] = useState(false);

  // Email Checklist & Interactivity
  const [emailList, setEmailList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showEmailList, setShowEmailList] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [emailSearch, setEmailSearch] = useState('');
  const [excludedEmails, setExcludedEmails] = useState(new Set());

  const selectedShop = shops.find(s => s.id === selectedShopId);
  const selectedEmailShop = shops.find(s => s.id === emailShopId);

  // ── Load Email List Reactively ──────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'email') return;
    
    // Check if shop selection is required but not provided
    const needsShop = ['shop_customers', 'shop_retailer', 'shop_everyone'].includes(emailTarget);
    if (needsShop && !emailShopId) {
      setEmailList([]);
      setSelectedEmails(new Set());
      setExcludedEmails(new Set());
      return;
    }

    setLoadingEmails(true);
    let url = `/api/superadmin/broadcast-email?target=${emailTarget}`;
    if (emailShopId) url += `&shopId=${emailShopId}`;

    // Get auth token for protected endpoint
    auth.currentUser?.getIdToken().then(token => {
      return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    }).then(r => r.json())
      .then(data => {
        const list = data.emails || [];
        setEmailList(list);
        setExcludedEmails(new Set());
        setSelectedEmails(new Set(list.map(e => e.email)));
      })
      .catch(err => {
        console.error(err);
        toast.error('ইমেইল লিস্ট লোড করতে সমস্যা হয়েছে');
      })
      .finally(() => setLoadingEmails(false));
  }, [emailTarget, emailShopId, tab]);

  // Compute filtered email list based on search and exclusions
  const filteredEmails = useMemo(() => {
    return emailList
      .filter(item => {
        if (excludedEmails.has(item.email)) return false;
        
        const term = emailSearch.trim().toLowerCase();
        if (!term) return true;

        return (
          item.email.toLowerCase().includes(term) ||
          (item.name && item.name.toLowerCase().includes(term)) ||
          (item.shopName && item.shopName.toLowerCase().includes(term))
        );
      });
  }, [emailList, excludedEmails, emailSearch]);

  const toggleEmail = (email) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleAll = () => {
    const allFilteredEmails = filteredEmails.map(e => e.email);
    const areAllSelected = allFilteredEmails.every(email => selectedEmails.has(email));

    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (areAllSelected) {
        // Deselect all in filtered view
        allFilteredEmails.forEach(email => next.delete(email));
      } else {
        // Select all in filtered view
        allFilteredEmails.forEach(email => next.add(email));
      }
      return next;
    });
  };

  const removeEmailFromList = (email) => {
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

  // Reset email list state on target change
  useEffect(() => {
    setEmailSearch('');
  }, [emailTarget]);

  // ── Dispatch Notification ───────────────────────────────────────────────
  const handleSendNotification = async () => {
    if (!notifMessage.trim()) { toast.error('বার্তা লিখুন'); return; }
    if ((notifTarget === 'specific_retailer' || notifTarget === 'specific_shop_customers') && !selectedShopId) {
      toast.error('একটি শপ সিলেক্ট করুন'); return;
    }
    setSendingNotif(true);
    try {
      const body = {
        message: notifMessage,
        type: notifType,
        senderRole: 'superadmin',
        senderName: 'System Admin',
      };

      if (notifTarget === 'all') {
        body.target = 'all';
      } else if (notifTarget === 'retailers') {
        body.target = 'retailers';
      } else if (notifTarget === 'specific_retailer') {
        body.target = 'specific_shop';
        body.shopId = selectedShopId;
      } else if (notifTarget === 'specific_shop_customers') {
        body.target = 'specific_shop';
        body.shopId = selectedShopId;
      }

      const token = await auth.currentUser?.getIdToken();
      if (!token) { toast.error('লগইন করুন'); setSendingNotif(false); return; }
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ব্রডকাস্ট ব্যর্থ');
      toast.success('নোটিফিকেশন সফলভাবে পাঠানো হয়েছে! 🔔');
      setNotifMessage('');
    } catch (err) {
      toast.error(err.message || 'নোটিফিকেশন ব্যর্থ হয়েছে');
    } finally {
      setSendingNotif(false);
    }
  };

  // ── Dispatch Email ──────────────────────────────────────────────────────
  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) { toast.error('বিষয় ও মেসেজ লিখুন'); return; }
    if (selectedEmails.size === 0) { toast.error('কমপক্ষে একটি ইমেইল সিলেক্ট করুন'); return; }
    setSendingEmail(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { toast.error('লগইন করুন'); setSendingEmail(false); return; }
      const res = await fetch('/api/superadmin/broadcast-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailMessage,
          emails: Array.from(selectedEmails),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ইমেইল ব্যর্থ');
      toast.success(`${data.sent || 0}/${data.total || selectedEmails.size} জনকে ইমেইল পাঠানো হয়েছে! 📧`);
      setEmailSubject(''); setEmailMessage('');
    } catch (err) {
      toast.error(err.message || 'ইমেইল পাঠাতে ব্যর্থ হয়েছে');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Bell size={28} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">ব্রডকাস্ট সেন্টার</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Superadmin ব্রডকাস্ট সিস্টেম</p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setTab('notification')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
            tab === 'notification' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell size={14} /> নোটিফিকেশন
        </button>
        <button
          onClick={() => setTab('email')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
            tab === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Mail size={14} /> ইমেইল
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
            tab === 'sent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Send size={14} /> সেন্ট বক্স
        </button>
      </div>

      {/* ── Notification Tab ──────────────────────────────────────────────── */}
      {tab === 'notification' && (
        <div className="space-y-6">
          {/* Type */}
          <div className="flex gap-3">
            {NOTIFICATION_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setNotifType(t.id)}
                className={`flex-1 py-3 px-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-black ${
                  notifType === t.id
                    ? `${t.bg} ${t.border} ${t.color} shadow-sm scale-[1.02]`
                    : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-100'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Target Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'সবাই', desc: 'All Users + Retailers' },
                { id: 'retailers', label: 'রিটেইলার সব', desc: 'All Retailers' },
                { id: 'specific_retailer', label: 'নির্দিষ্ট রিটেইলার', desc: 'One Shop Retailer' },
                { id: 'specific_shop_customers', label: 'নির্দিষ্ট শপ ইউজার', desc: 'One Shop Customers' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setNotifTarget(opt.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    notifTarget === opt.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-black text-slate-900">{opt.label}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Shop Selector */}
          {(notifTarget === 'specific_retailer' || notifTarget === 'specific_shop_customers') && (
            <div className="relative">
              <button
                onClick={() => setShowShopDropdown(prev => !prev)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 hover:border-indigo-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Store size={14} className="text-indigo-500" />
                  {selectedShop ? selectedShop.shopName : 'শপ সিলেক্ট করুন'}
                </span>
                {showShopDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showShopDropdown && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                  {shops.map(shop => (
                    <button
                      key={shop.id}
                      onClick={() => { setSelectedShopId(shop.id); setShowShopDropdown(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-left hover:bg-slate-50 transition-colors ${
                        selectedShopId === shop.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700'
                      }`}
                    >
                      <span>{shop.shopName}</span>
                      {selectedShopId === shop.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message */}
          <div className="relative">
            <textarea
              value={notifMessage}
              onChange={e => setNotifMessage(e.target.value.substring(0, 200))}
              placeholder="আপনার বার্তা এখানে লিখুন..."
              className="w-full h-32 p-5 bg-slate-50 border-2 border-transparent rounded-3xl text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-500/30 transition-all resize-none"
            />
            <span className={`absolute bottom-4 right-4 text-[10px] font-black ${notifMessage.length >= 200 ? 'text-red-500' : 'text-slate-300'}`}>
              {notifMessage.length}/200
            </span>
          </div>

          <button
            onClick={handleSendNotification}
            disabled={sendingNotif || !notifMessage.trim()}
            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            {sendingNotif ? <><Loader2 size={18} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Bell size={18} /> নোটিফিকেশন পাঠান</>}
          </button>
        </div>
      )}

      {/* ── Email Tab ────────────────────────────────────────────────────── */}
      {tab === 'email' && (
        <div className="space-y-6">
          {/* Target Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Target</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: 'all_customers', label: 'সব কাস্টমার', desc: 'All customers' },
                { id: 'all_retailers', label: 'সব রিটেইলার', desc: 'All retailers' },
                { id: 'everyone', label: 'সবাইকে', desc: 'Retailers + Customers' },
                { id: 'shop_customers', label: 'শপ কাস্টমার', desc: 'Shop Customers' },
                { id: 'shop_retailer', label: 'শপ রিটেইলার', desc: 'Shop Retailer' },
                { id: 'shop_everyone', label: 'শপের সবাই', desc: 'Shop Retailer + Customers' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setEmailTarget(opt.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    emailTarget === opt.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-black text-slate-900">{opt.label}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Shop Selector for email */}
          {['shop_customers', 'shop_retailer', 'shop_everyone'].includes(emailTarget) && (
            <div className="relative">
              <button
                onClick={() => setShowEmailShopDropdown(prev => !prev)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 hover:border-blue-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Store size={14} className="text-blue-500" />
                  {selectedEmailShop ? selectedEmailShop.shopName : 'শপ সিলেক্ট করুন'}
                </span>
                {showEmailShopDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showEmailShopDropdown && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                  {shops.map(shop => (
                    <button
                      key={shop.id}
                      onClick={() => { setEmailShopId(shop.id); setShowEmailShopDropdown(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-left hover:bg-slate-50 transition-colors ${
                        emailShopId === shop.id ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
                      }`}
                    >
                      <span>{shop.shopName}</span>
                      {emailShopId === shop.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recipient checklist - loaded reactively */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setShowEmailList(prev => !prev)}
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-blue-500" />
                <span className="text-xs font-black text-slate-700">
                  {loadingEmails ? 'ইমেইল লোড হচ্ছে...' : `${selectedEmails.size} / ${filteredEmails.length + excludedEmails.size} প্রাপক নির্বাচিত`}
                </span>
              </div>
              {showEmailList ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>

            {showEmailList && (
              <div className="border-t border-slate-100 bg-white">
                {/* Search box inside list */}
                <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="ইমেইল, নাম বা শপ দিয়ে খুঁজুন..."
                    value={emailSearch}
                    onChange={e => setEmailSearch(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
                  />
                  {emailSearch && (
                    <button type="button" onClick={() => setEmailSearch('')} className="p-0.5 rounded-full hover:bg-slate-200"><X size={10} /></button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {loadingEmails ? (
                    <div className="py-6 text-center"><Loader2 size={16} className="animate-spin mx-auto text-slate-300" /></div>
                  ) : filteredEmails.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400 text-center py-6">
                      কোনো ইমেইল পাওয়া যায়নি
                    </p>
                  ) : (
                    <div className="p-3 space-y-1.5">
                      {/* Select All */}
                      <div
                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={toggleAll}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          filteredEmails.every(e => selectedEmails.has(e.email)) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                        }`}>
                          {filteredEmails.every(e => selectedEmails.has(e.email)) && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </div>
                        <span className="text-xs font-black text-blue-700">সব সিলেক্ট / আনসিলেক্ট</span>
                      </div>

                      {/* Recipient rows */}
                      {filteredEmails.map((item) => (
                        <div
                          key={item.email}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                            selectedEmails.has(item.email) ? 'bg-emerald-50/30' : 'hover:bg-slate-50'
                          }`}
                          onClick={() => toggleEmail(item.email)}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            selectedEmails.has(item.email) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'
                          }`}>
                            {selectedEmails.has(item.email) && (
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                              {item.name}
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                                item.role === 'retailer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {item.role}
                              </span>
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {item.email} • {item.shopName}
                            </p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); removeEmailFromList(item.email); }}
                            type="button"
                            className="p-1 hover:bg-red-100 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
                            title="তালিকা থেকে রিমুভ করুন"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <input
            type="text"
            maxLength={200}
            placeholder="বিষয় (Subject)"
            value={emailSubject}
            onChange={e => setEmailSubject(e.target.value)}
            className="w-full text-sm font-bold text-slate-900 p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-300"
          />
          <textarea
            rows={5}
            maxLength={3000}
            placeholder="ইমেইল মেসেজ লিখুন..."
            value={emailMessage}
            onChange={e => setEmailMessage(e.target.value)}
            className="w-full text-sm font-bold text-slate-900 p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-300 resize-none"
          />

          <button
            onClick={handleSendEmail}
            disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim() || selectedEmails.size === 0}
            className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            {sendingEmail ? <><Loader2 size={18} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Mail size={18} /> ইমেইল পাঠান ({selectedEmails.size} জনকে)</>}
          </button>
        </div>
      )}

      {/* ── Sent Box Tab ────────────────────────────────────────────────── */}
      {tab === 'sent' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs font-black text-slate-800 flex items-center gap-1.5"><Send size={14} className="text-purple-600"/> প্রেরিত নোটিফিকেশন</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">সবচেয়ে নতুন নোটিফিকেশন সবার উপরে</p>
            </div>
            {broadcasts.length > 0 && (
              <button
                onClick={handleClearAllBroadcasts}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black transition-all border border-red-100 flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 size={12} /> সব নোটিফিকেশন মুছুন
              </button>
            )}
          </div>

          {loadingBroadcasts ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin mx-auto text-slate-300 mb-3" size={24} />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">লোড হচ্ছে...</p>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
              <Bell className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-slate-400 text-xs font-black uppercase tracking-wider">কোনো নোটিফিকেশন পাঠানো হয়নি</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1.5 custom-scrollbar">
              {broadcasts.map((notif) => {
                const isWarning = notif.type === 'warning';
                const isPromo = notif.type === 'promo';
                const bgClass = isWarning ? 'bg-amber-50 border-amber-200' : isPromo ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200';
                const textClass = isWarning ? 'text-amber-800' : isPromo ? 'text-purple-800' : 'text-blue-800';

                return (
                  <div key={notif.id} className={`p-5 rounded-3xl border shadow-sm relative overflow-hidden flex items-start justify-between gap-4 transition-all hover:shadow-md ${bgClass}`}>
                    <div className="space-y-1.5 flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          notif.type === 'warning' ? 'bg-amber-100 text-amber-700' : notif.type === 'promo' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {notif.type === 'warning' ? 'Warning' : notif.type === 'promo' ? 'Promo' : 'Info'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          Target: <strong className="text-slate-700">{notif.target === 'all' ? 'সবাই' : notif.target === 'retailers' ? 'রিটেইলার' : 'নির্দিষ্ট শপ'}</strong>
                        </span>
                      </div>
                      <p className={`text-sm font-bold leading-relaxed ${textClass} break-words`}>
                        {notif.message}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold">
                        {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'হালনাগাদ'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteBroadcast(notif.id)}
                      className="shrink-0 p-3 bg-red-100/50 hover:bg-red-500 hover:text-white text-red-500 rounded-2xl transition-all cursor-pointer flex items-center justify-center"
                      title="মুছে ফেলুন"
                      style={{ minWidth: '40px', minHeight: '40px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
