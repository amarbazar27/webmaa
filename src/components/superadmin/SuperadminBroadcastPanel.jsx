'use client';
import { useState } from 'react';
import { Send, Bell, Mail, Users, Store, Loader2, Info, AlertTriangle, Sparkles, ChevronDown, ChevronUp, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const NOTIFICATION_TYPES = [
  { id: 'info', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', label: 'তথ্য' },
  { id: 'warning', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', label: 'সতর্কতা' },
  { id: 'promo', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', label: 'অফার' },
];

export default function SuperadminBroadcastPanel({ shops = [] }) {
  const [tab, setTab] = useState('notification'); // 'notification' | 'email'

  // Notification state
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('info');
  const [notifTarget, setNotifTarget] = useState('all'); // all | retailers | specific_retailer | specific_shop_customers
  const [selectedShopId, setSelectedShopId] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  // Email state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailTarget, setEmailTarget] = useState('all_customers'); // all_customers | shop_customers
  const [emailShopId, setEmailShopId] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailShopDropdown, setShowEmailShopDropdown] = useState(false);

  const selectedShop = shops.find(s => s.id === selectedShopId);
  const selectedEmailShop = shops.find(s => s.id === emailShopId);

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

      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) { toast.error('বিষয় ও মেসেজ লিখুন'); return; }
    if (emailTarget === 'shop_customers' && !emailShopId) { toast.error('একটি শপ সিলেক্ট করুন'); return; }
    setSendingEmail(true);
    try {
      const res = await fetch('/api/superadmin/broadcast-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailMessage,
          target: emailTarget,
          shopId: emailTarget === 'shop_customers' ? emailShopId : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ইমেইল ব্যর্থ');
      toast.success(`${data.sent || 0} জনকে ইমেইল পাঠানো হয়েছে! 📧`);
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
      </div>

      {/* Notification Tab */}
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

          {/* Shop Selector (when specific shop) */}
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
              onChange={e => setNotifMessage(e.target.value)}
              placeholder="আপনার বার্তা এখানে লিখুন..."
              className="w-full h-32 p-5 bg-slate-50 border-2 border-transparent rounded-3xl text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-500/30 transition-all resize-none"
            />
            <span className={`absolute bottom-4 right-4 text-[10px] font-black ${notifMessage.length > 180 ? 'text-red-500' : 'text-slate-300'}`}>
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

      {/* Email Tab */}
      {tab === 'email' && (
        <div className="space-y-6">
          {/* Target */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Target</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all_customers', label: 'সব কাস্টমার', desc: 'All shops customers' },
                { id: 'shop_customers', label: 'নির্দিষ্ট শপ', desc: 'One shop customers' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setEmailTarget(opt.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    emailTarget === opt.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-black text-slate-900">{opt.label}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Shop Selector for email */}
          {emailTarget === 'shop_customers' && (
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
            disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
            className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            {sendingEmail ? <><Loader2 size={18} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Mail size={18} /> ইমেইল পাঠান</>}
          </button>
        </div>
      )}
    </div>
  );
}
