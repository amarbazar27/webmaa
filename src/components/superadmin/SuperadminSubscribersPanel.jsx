'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, Send, Trash2, CheckSquare, Square, 
  Search, RefreshCw, Users, AlertCircle, CheckCircle2, 
  Calendar, ShieldAlert, Sparkles, Loader2 
} from 'lucide-react';
import { getNewsletterSubscribers, deleteNewsletterSubscriber } from '@/lib/firestore';
import { getAuth } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function SuperadminSubscribersPanel() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  
  // Compose Email States
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const data = await getNewsletterSubscribers();
      setSubscribers(data);
    } catch (err) {
      console.error(err);
      toast.error('সাবস্ক্রাইবার তালিকা লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const filteredSubscribers = subscribers.filter(sub => 
    sub.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected = filteredSubscribers.length > 0 && filteredSubscribers.every(sub => selectedEmails.includes(sub.email));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredSet = new Set(filteredSubscribers.map(s => s.email));
      setSelectedEmails(prev => prev.filter(email => !filteredSet.has(email)));
    } else {
      const newSelected = Array.from(new Set([...selectedEmails, ...filteredSubscribers.map(s => s.email)]));
      setSelectedEmails(newSelected);
    }
  };

  const handleToggleEmail = (email) => {
    setSelectedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleDeleteSubscriber = async (sub) => {
    if (!confirm(`আপনি কি সত্যিই '${sub.email}' সাবস্ক্রিপশন তালিকা থেকে মুছে ফেলতে চান?`)) return;

    setDeletingId(sub.id);
    try {
      await deleteNewsletterSubscriber(sub.id);
      setSubscribers(prev => prev.filter(s => s.id !== sub.id));
      setSelectedEmails(prev => prev.filter(e => e !== sub.email));
      toast.success('সাবস্ক্রাইবার সফলভাবে মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error(err);
      toast.error('মুছে ফেলতে সমস্যা হয়েছে');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmails.length === 0) return;
    if (!confirm(`আপনি কি নির্বাচিত ${selectedEmails.length} টি ইমেইল মুছে ফেলতে চান?`)) return;

    const toastId = toast.loading('সাবস্ক্রাইবারদের মুছে ফেলা হচ্ছে...');
    try {
      const subsToDelete = subscribers.filter(s => selectedEmails.includes(s.email));
      for (const sub of subsToDelete) {
        await deleteNewsletterSubscriber(sub.id);
      }
      setSubscribers(prev => prev.filter(s => !selectedEmails.includes(s.email)));
      setSelectedEmails([]);
      toast.success('নির্বাচিত সাবস্ক্রাইবারগণ সফলভাবে মুছে ফেলা হয়েছে', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('বাল্ক ডিলিট ব্যর্থ হয়েছে', { id: toastId });
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!emailSubject.trim()) {
      toast.error('অনুগ্রহ করে ইমেইলের বিষয় লিখুন');
      return;
    }
    if (!emailMessage.trim()) {
      toast.error('অনুগ্রহ করে ইমেইলের মূল বার্তা লিখুন');
      return;
    }

    const recipients = selectedEmails.length > 0 ? selectedEmails : [];
    const recipientText = recipients.length > 0 
      ? `নির্বাচিত ${recipients.length} জন গ্রাহককে` 
      : `সকল ${subscribers.length} জন গ্রাহককে`;

    if (!confirm(`আপনি কি ${recipientText} এই ব্রডকাস্ট ইমেইল পাঠাতে চান?`)) {
      return;
    }

    setSendingEmail(true);
    const toastId = toast.loading('ইমেইল পাঠানো হচ্ছে...');
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error('অনুগ্রহ করে পুনরায় লগইন করুন।');
      }

      const res = await fetch('/api/admin/broadcast-subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: emailSubject.trim(),
          message: emailMessage.trim(),
          recipientEmails: recipients
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ইমেইল পাঠাতে ব্যর্থ হয়েছে');
      }

      toast.success(data.message || 'ইমেইল সফলভাবে পাঠানো হয়েছে! 🎉', { id: toastId });
      setEmailSubject('');
      setEmailMessage('');
      setSelectedEmails([]);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'ইমেইল ব্রডকাস্টে ত্রুটি হয়েছে', { id: toastId });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs uppercase tracking-wider mb-2 border border-purple-400/20">
              <Mail size={13} />
              <span>নিউজলেটার ও ব্রডকাস্ট হাব</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">ইমেইল সাবস্ক্রাইবার্স ও ব্রডকাস্ট কম্পোজার</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              হোমপেজ থেকে সাবস্ক্রাইব করা সকল গ্রাহকের ইমেইল তালিকা দেখুন এবং এখান থেকেই সরাসরি সবাইকে অথবা নির্বাচিত ব্যক্তিদের ইমেইল পাঠান।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSubscribers}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all flex items-center gap-2 border border-white/10"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Broadcast Email Composer (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Send size={16} className="text-purple-600" />
              <span>ব্রডকাস্ট ইমেইল কম্পোজ করুন</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedEmails.length > 0 ? (
                <span className="text-purple-600 font-bold">
                  🎯 নির্বাচিত {selectedEmails.length} জন গ্রাহককে পাঠানো হবে
                </span>
              ) : (
                <span>📢 কোনো নির্বাচন করা না থাকলে সমস্ত {subscribers.length} জন গ্রাহককে পাঠানো হবে</span>
              )}
            </p>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ইমেইলের বিষয় (Subject)</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="যেমন: BDRetailers এর নতুন অফার ও আপডেট..."
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">মূল বার্তা / মেসেজ (Email Body)</label>
              <textarea
                rows={8}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="আপনার গ্রাহকদের উদ্দেশ্যে বিস্তারিত বার্তা লিখুন..."
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 resize-none font-sans"
                required
              />
            </div>

            <div className="p-3 bg-purple-50 rounded-xl text-purple-900 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles size={13} className="text-purple-600 shrink-0" />
                <span>অটো ব্র্যান্ডেড টেমপ্লেট</span>
              </div>
              <p className="text-purple-700">
                এই মেসেজটি স্বয়ংক্রিয়ভাবে BDRetailers এর প্রিমিয়াম নিউমর্ফিক এইচটিএমএল ইমেইল টেমপ্লেট সহ গ্রাহকের ইনবক্সে পৌঁছাবে।
              </p>
            </div>

            <button
              type="submit"
              disabled={sendingEmail || (subscribers.length === 0)}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              {sendingEmail ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>ইমেইল পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>
                    {selectedEmails.length > 0 
                      ? `${selectedEmails.length} জনকে ইমেইল পাঠান` 
                      : 'সবাইকে ইমেইল পাঠান'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Subscribers List & Selection (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-purple-600" />
                <span>সাবস্ক্রাইবার তালিকা</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-black">
                  {subscribers.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedEmails.length > 0 ? (
                  <span className="text-purple-600 font-bold">{selectedEmails.length} জন নির্বাচিত</span>
                ) : (
                  'ইমেইল পাঠাতে নির্দিষ্ট গ্রাহক নির্বাচন করতে পারেন'
                )}
              </p>
            </div>

            {selectedEmails.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <Trash2 size={13} />
                <span>নির্বাচিত ({selectedEmails.length}) মুছুন</span>
              </button>
            )}
          </div>

          {/* Search & Select All Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ইমেইল দিয়ে সার্চ করুন..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
              />
            </div>

            <button
              onClick={handleToggleSelectAll}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare size={15} className="text-purple-600" />
                  <span>সব বাতিল</span>
                </>
              ) : (
                <>
                  <Square size={15} className="text-slate-400" />
                  <span>সব সিলেক্ট</span>
                </>
              )}
            </button>
          </div>

          {/* Subscribers Table / List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 size={24} className="animate-spin text-purple-600 mx-auto" />
                <p className="text-xs text-slate-400 mt-2">সাবস্ক্রাইবার তালিকা লোড হচ্ছে...</p>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl text-slate-400 text-xs">
                {searchQuery ? 'কোনো ফলাফল পাওয়া যায়নি' : 'এখনও কোনো সাবস্ক্রাইবার যুক্ত হয়নি'}
              </div>
            ) : (
              filteredSubscribers.map((sub) => {
                const isSelected = selectedEmails.includes(sub.email);
                const isDeleting = deletingId === sub.id;

                let dateFormatted = '';
                if (sub.createdAt?.toDate) {
                  dateFormatted = sub.createdAt.toDate().toLocaleDateString('bn-BD');
                } else if (sub.createdAt?.seconds) {
                  dateFormatted = new Date(sub.createdAt.seconds * 1000).toLocaleDateString('bn-BD');
                }

                return (
                  <div
                    key={sub.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-purple-50/70 border-purple-300'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div 
                      onClick={() => handleToggleEmail(sub.email)}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <button type="button" className="text-purple-600 shrink-0">
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-300" />}
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{sub.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar size={10} />
                            <span>{dateFormatted || 'সাম্প্রতিক'}</span>
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                            সক্রিয়
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSubscriber(sub)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
