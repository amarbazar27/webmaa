'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { 
  Globe, Camera, Phone, MessageCircle, Bot, Zap, Users, Loader2, 
  CheckCircle2, User, Send, PauseCircle, PlayCircle, ShieldCheck, 
  Sparkles, ExternalLink, HelpCircle, AlertCircle, RefreshCw, 
  Download, Plus, Trash2, ArrowRight, Check, X, Clock, MessageSquare 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/auth';
import { 
  collection, query, where, orderBy, limit, onSnapshot, 
  doc, updateDoc, setDoc, addDoc, getDoc, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import clsx from 'clsx';

export default function SocialHubPanel({ shopId }) {
  const [activeTab, setActiveTab] = useState('accounts');
  const [currentTime, setCurrentTime] = useState('');
  const [isAiGloballyPaused, setIsAiGloballyPaused] = useState(false);
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch connections for this shop
  const fetchConnections = async () => {
    if (!shopId) return;
    try {
      setLoadingConnections(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(`/api/social/connect?shopId=${shopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.connections) {
        setConnections(data.connections);
      }
    } catch (err) {
      console.warn('Failed to load connections:', err);
    } finally {
      setLoadingConnections(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [shopId]);

  // Load shop AI settings
  useEffect(() => {
    if (!shopId) return;
    const unsub = onSnapshot(doc(db, 'shops', shopId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsAiGloballyPaused(Boolean(data?.aiSettings?.globallyPaused));
      }
    });
    return () => unsub();
  }, [shopId]);

  const toggleGlobalAi = async () => {
    if (!shopId) return;
    try {
      const nextState = !isAiGloballyPaused;
      await setDoc(doc(db, 'shops', shopId), {
        aiSettings: {
          globallyPaused: nextState,
          updatedAt: new Date().toISOString()
        }
      }, { merge: true });
      setIsAiGloballyPaused(nextState);
      toast.success(nextState ? 'AI সহকারী সাময়িক বিরতিতে আছে (মানুষ অন ডিউটি 👤)' : 'AI সহকারী সক্রিয় (রোবট অন ডিউটি 🤖)');
    } catch (err) {
      toast.error('AI স্ট্যাটাস পরিবর্তন ব্যর্থ');
    }
  };

  const hasFb = connections.some(c => c.platform === 'facebook');

  const tabs = [
    { id: 'accounts', label: 'সংযুক্ত অ্যাকাউন্ট', icon: Globe, badge: hasFb ? 'সক্রিয়' : null },
    { id: 'inbox', label: 'লাইভ ইনবক্স', icon: MessageCircle },
    { id: 'comments', label: 'কমেন্ট অটোমেশন', icon: MessageSquare },
    { id: 'leads', label: 'লিড ম্যানেজমেন্ট', icon: Users },
    { id: 'ai', label: 'এআই সেটিংস (Agnes 3.0)', icon: Bot },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── AiPraktor Style Control Plane Top Bar ── */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE CONTROL PLANE
            </span>
            <span className="text-xs font-mono text-slate-400">
              SYSTEM ONLINE • {currentTime || '00:00:00'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            সোশ্যাল মিডিয়া সেলস অ্যান্ড অটোমেশন হাব
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            ফেসবুক কমেন্ট ও ইনবক্স থেকে অটোমেটিক লিড জেনারেশন, Vyce AI সেলস রিপ্লাই এবং কাস্টমার অর্ডার গ্রহণ।
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* AI <-> Human Toggle */}
          <button
            onClick={toggleGlobalAi}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-sm ${
              isAiGloballyPaused 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' 
                : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/30'
            }`}
          >
            {isAiGloballyPaused ? <PauseCircle size={15} /> : <Bot size={15} />}
            <span>{isAiGloballyPaused ? 'হিউম্যান টেকওভার (AI বিরতি)' : 'AI সক্রিয় (রোবট অন ডিউটি)'}</span>
          </button>

          <button
            onClick={() => setShowGuideModal(true)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="সেটআপ গাইড"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">১ মিনিটের গাইড</span>
          </button>
        </div>
      </div>

      {/* ── Setup Progress Banner (AiPraktor Style) ── */}
      {!hasFb && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-600 text-white rounded-md text-[10px] font-black uppercase">
                ধাপ ১ / ৩
              </span>
              <h4 className="text-sm font-black text-slate-900">
                Facebook পেজ যুক্ত করুন — অ্যাসিস্ট্যান্ট সক্রিয় করতে
              </h4>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              পেজ যুক্ত না হলে গ্রাহকের মেসেজ অ্যাসিস্ট্যান্টের কাছে পৌঁছাবে না। নিচের &quot;Connect Facebook&quot; বাটনে Page Access Token দিয়ে কানেক্ট করুন।
            </p>
          </div>
          <Button 
            onClick={() => setActiveTab('accounts')} 
            className="!bg-purple-600 hover:!bg-purple-700 text-white shrink-0 text-xs font-black"
          >
            পেজ যুক্ত করুন <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      )}

      {/* ── Navigation Tabs ── */}
      <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar border-b border-slate-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 font-black text-xs rounded-2xl transition-all whitespace-nowrap cursor-pointer relative',
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              )}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[9px] font-black">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'accounts' && (
        <AccountsSection 
          shopId={shopId} 
          connections={connections} 
          onRefresh={fetchConnections}
          loading={loadingConnections}
        />
      )}

      {activeTab === 'inbox' && (
        <InboxSection 
          shopId={shopId} 
          isAiGloballyPaused={isAiGloballyPaused} 
          onToggleAi={toggleGlobalAi}
        />
      )}

      {activeTab === 'comments' && (
        <CommentsAutomationSection shopId={shopId} />
      )}

      {activeTab === 'leads' && (
        <LeadsSection shopId={shopId} />
      )}

      {activeTab === 'ai' && (
        <AiSettingsSection shopId={shopId} />
      )}

      {/* ── 1-Minute Guide Modal ── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-purple-600" /> ১ মিনিটের সোশ্যাল হাব সেটআপ গাইড
              </h3>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 font-medium leading-relaxed">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 space-y-1">
                <p className="font-black text-purple-900">১. Facebook পেজ কানেক্ট করুন</p>
                <p>Meta for Developers অথবা Meta Business Suite থেকে আপনার পেজের <strong className="text-purple-700">Page Access Token</strong> নিয়ে এসে &quot;সংযুক্ত অ্যাকাউন্ট&quot; ট্যাবে পেস্ট করে &quot;কানেক্ট&quot; চাপুন।</p>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 space-y-1">
                <p className="font-black text-blue-900">২. কমেন্ট অটো-রিপ্লাই সক্রিয় করুন</p>
                <p>গ্রাহক যেকোনো পোস্টে কমেন্ট করলে AI স্বয়ংক্রিয়ভাবে পাবলিক রিপ্লাই দেবে এবং পার্সোনালাইজড ইনবক্স মেসেজ পাঠিয়ে লিড সংগ্রহ করবে।</p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
                <p className="font-black text-emerald-900">৩. হিউম্যান টেকওভার ও &quot;.&quot; (ডট) কমান্ড</p>
                <p>গ্রাহকের সাথে নিজে কথা বলতে চাইলে মেসেজ ইনপুটে শুধু একটি ডট <strong className="text-emerald-700">&quot;.&quot;</strong> পাঠিয়ে এন্টার দিন — AI সাথে সাথে বিরতিতে যাবে। কথা শেষ হলে আবার ডট দিলে AI পুনরায় সক্রিয় হবে।</p>
              </div>
            </div>

            <Button onClick={() => setShowGuideModal(false)} className="w-full !bg-slate-900 text-white font-black">
              বুঝেছি, কাজ শুরু করি!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 1. ACCOUNTS SECTION ──────────────────────────────────────────────
function AccountsSection({ shopId, connections, onRefresh, loading }) {
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [fbToken, setFbToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fbConnection = connections.find(c => c.platform === 'facebook');

  const handleConnectFacebook = async () => {
    if (!fbToken.trim()) {
      toast.error('Page Access Token দিন');
      return;
    }
    setConnecting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('লগইন করুন');

      const res = await fetch('/api/social/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId,
          pageId: pageId.trim() || undefined,
          pageName: pageName.trim() || undefined,
          pageAccessToken: fbToken.trim(),
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'কানেক্ট ব্যর্থ হয়েছে');

      toast.success(data.message || 'Facebook পেজ সফলভাবে যুক্ত হয়েছে! 🎉');
      setFbToken('');
      setPageId('');
      setPageName('');
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'কানেকশন সমস্যা হয়েছে');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (targetPageId) => {
    if (!confirm('আপনি কি নিশ্চিত যে পেজটি ডিসকানেক্ট করতে চান? এর ফলে AI অটো-রিপ্লাই বন্ধ হয়ে যাবে।')) return;
    setDisconnecting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/social/connect?shopId=${shopId}&pageId=${targetPageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ডিসকানেক্ট ব্যর্থ');
      toast.success('সফলভাবে ডিসকানেক্ট করা হয়েছে');
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'ডিসকানেক্ট সমস্যা');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Facebook Card */}
      <Card title="Facebook Page" icon={Globe} className="border-t-4 border-t-blue-600 shadow-sm">
        <div className="space-y-4 pt-1">
          {fbConnection ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <p className="font-black text-emerald-900">সফলভাবে সংযুক্ত</p>
                  <p className="font-bold text-emerald-700">{fbConnection.pageName || 'Facebook Page'}</p>
                  <p className="text-[10px] text-emerald-600 font-mono">Page ID: {fbConnection.pageId}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-slate-800">
                  <ShieldCheck size={14} className="text-blue-600" /> অটো-রিপ্লাই ও ওয়েবহুক চালু আছে
                </p>
                <p>গ্রাহক কমেন্ট বা ইনবক্স করলে AI তাত্ক্ষণিকভাবে রিপ্লাই দেবে।</p>
              </div>

              <Button
                variant="outline"
                onClick={() => handleDisconnect(fbConnection.pageId || fbConnection.id)}
                loading={disconnecting}
                className="w-full !border-red-200 !text-red-600 hover:!bg-red-50 text-xs font-black"
              >
                <Trash2 size={14} className="mr-1.5" /> ডিসকানেক্ট করুন
              </Button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                <AlertCircle size={15} className="text-amber-500" />
                <span>পেজ কানেক্ট করা নেই</span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-700 block">
                  Page Access Token *
                </label>
                <input
                  type="password"
                  placeholder="EAAI..."
                  value={fbToken}
                  onChange={e => setFbToken(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                />
                <p className="text-[10px] text-slate-400">
                  Meta Graph API Explorer বা Meta Business Suite থেকে Page Access Token নিন।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Page ID (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="100092..."
                    value={pageId}
                    onChange={e => setPageId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Page Name (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="My Store Page"
                    value={pageName}
                    onChange={e => setPageName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <Button
                onClick={handleConnectFacebook}
                loading={connecting}
                className="w-full !bg-blue-600 hover:!bg-blue-700 text-white font-black text-xs"
              >
                Facebook পেজ কানেক্ট করুন
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Instagram Card */}
      <Card title="Instagram Direct" icon={Camera} className="border-t-4 border-t-pink-600 shadow-sm">
        <div className="space-y-4 pt-1">
          <div className="p-3 bg-pink-50 border border-pink-100 rounded-2xl text-xs space-y-1.5 text-pink-900">
            <p className="font-black">ইনস্টাগ্রাম কানেকশন নির্দেশিকা</p>
            <p className="text-[11px] text-pink-800 leading-relaxed">
              আপনার Instagram প্রফেশনাল অ্যাকাউন্টটি আপনার ফেসবুক পেজের সাথে লিঙ্ক করা থাকলে Facebook Access Token দিয়েই ইনস্টাগ্রাম DM হ্যান্ডেল করা যাবে।
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-slate-400" />
            <span>ফেসবুক পেজ কানেক্ট করলে অটোমেটিক সিঙ্ক হবে</span>
          </div>
        </div>
      </Card>

      {/* WhatsApp Card */}
      <Card title="WhatsApp Business" icon={Phone} className="border-t-4 border-t-green-600 shadow-sm">
        <div className="space-y-4 pt-1">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs space-y-1.5 text-emerald-900">
            <p className="font-black">WhatsApp Cloud API</p>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Meta WhatsApp Business Cloud API দিয়ে সরাসরি হোয়াটসঅ্যাপে AI সেলস রোবট চালু করা সম্ভব।
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Meta Cloud API ফোন নম্বর আইডি ও পার্মানেন্ট টোকেন সেটআপ সম্পন্ন করতে সুপারএডমিন সাপোর্টের সহায়তা নিন।
          </p>
          <a
            href="https://wa.me/8801700000000"
            target="_blank"
            rel="noreferrer"
            className="block text-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-colors"
          >
            সাপোর্টে যোগাযোগ করুন
          </a>
        </div>
      </Card>
    </div>
  );
}

// ── 2. INBOX SECTION (UNIFIED INBOX + HUMAN TAKEOVER) ─────────────────
function InboxSection({ shopId, isAiGloballyPaused, onToggleAi }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const q = query(
      collection(db, 'shops', shopId, 'conversations'),
      orderBy('lastMessageAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      const convList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setConversations(convList);
      if (!activeConvId && convList.length > 0) {
        setActiveConvId(convList[0].id);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Conversations listener error:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const handleSend = async () => {
    if (!replyText.trim() || !activeConv || !shopId) return;

    // Check if message is '.' command (Toggle AI pause/resume)
    if (replyText.trim() === '.') {
      toggleConversationAi();
      setReplyText('');
      return;
    }

    setSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('লগইন প্রয়োজন');

      const res = await fetch('/api/social/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId,
          conversationId: activeConv.id,
          recipientId: activeConv.senderPsid || activeConv.id,
          message: replyText.trim(),
          platform: activeConv.platform || 'facebook',
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'মেসেজ পাঠানো ব্যর্থ');

      toast.success(data.metaSent ? 'মেসেঞ্জারে পাঠানো হয়েছে! 📨' : 'মেসেজ সংরক্ষিত হয়েছে');
      setReplyText('');
    } catch (err) {
      toast.error(err.message || 'মেসেজ পাঠাতে সমস্যা হয়েছে');
    } finally {
      setSending(false);
    }
  };

  const toggleConversationAi = async () => {
    if (!activeConv || !shopId) return;
    try {
      const nextPaused = !activeConv.aiPaused;
      await updateDoc(doc(db, 'shops', shopId, 'conversations', activeConv.id), {
        aiPaused: nextPaused,
        updatedAt: serverTimestamp()
      });
      toast.success(nextPaused ? 'এই চ্যাটে AI সাময়িক বিরতিতে আছে ⏸️' : 'এই চ্যাটে AI পুনরায় চালু হয়েছে 🤖');
    } catch (err) {
      toast.error('AI টগল করা সম্ভব হয়নি');
    }
  };

  return (
    <Card className="p-0 border-purple-100 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row h-[620px] divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Left: Conversation List */}
        <div className="w-full md:w-1/3 bg-slate-50/60 flex flex-col h-1/3 md:h-full">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MessageCircle size={15} className="text-purple-600" /> গ্রাহক বার্তা তালিকা ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-600" size={24} /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-xs text-slate-400 p-8 space-y-2">
                <MessageSquare size={32} className="mx-auto opacity-30 text-slate-400" />
                <p>এখনো কোনো মেসেজ আসেনি। Facebook পেজে গ্রাহক মেসেজ পাঠালে এখানে শো করবে।</p>
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = conv.id === activeConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={clsx(
                      'p-3 rounded-2xl cursor-pointer transition-all border text-left',
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                        : 'bg-white hover:bg-slate-100/80 text-slate-800 border-slate-100'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className="font-black text-xs truncate">
                        {conv.senderName || 'অপরিচিত গ্রাহক'}
                      </p>
                      <span className={clsx('text-[9px] px-1.5 py-0.5 rounded-md font-black', isSelected ? 'bg-purple-800 text-purple-200' : 'bg-slate-100 text-slate-500')}>
                        {conv.platform || 'FB'}
                      </span>
                    </div>
                    <p className={clsx('text-[11px] truncate', isSelected ? 'text-purple-100' : 'text-slate-500')}>
                      {conv.lastMessage || 'কোনো বার্তা নেই'}
                    </p>
                    {conv.aiPaused && (
                      <span className={clsx('text-[9px] font-black inline-block mt-1', isSelected ? 'text-amber-300' : 'text-amber-600')}>
                        ⏸️ হিউম্যান মোড
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Thread */}
        <div className="w-full md:w-2/3 flex flex-col h-2/3 md:h-full bg-white">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="space-y-0.5">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    {activeConv.senderName || 'গ্রাহক'}
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                      {activeConv.platform || 'Facebook'}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">ID: {activeConv.senderPsid || activeConv.id}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleConversationAi}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all',
                      activeConv.aiPaused
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                    )}
                    title="ক্লিক করে বা ইনপুটে '.' লিখে টগল করুন"
                  >
                    {activeConv.aiPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                    <span>{activeConv.aiPaused ? 'AI চালু করুন' : 'AI বিরতি (টেকওভার)'}</span>
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
                {(activeConv.messages || []).length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-12">
                    কোনো পূর্ববর্তী বার্তা পাওয়া যায়নি
                  </div>
                ) : (
                  (activeConv.messages || []).map((m, idx) => {
                    const isUser = m.role === 'user';
                    const isAssistant = m.role === 'assistant';
                    const isRetailer = m.role === 'retailer';

                    return (
                      <div
                        key={idx}
                        className={clsx(
                          'flex flex-col max-w-[80%]',
                          isUser ? 'self-start items-start' : 'self-end items-end ml-auto'
                        )}
                      >
                        <span className="text-[9px] font-bold text-slate-400 mb-0.5 px-1">
                          {isUser ? activeConv.senderName || 'গ্রাহক' : isAssistant ? '🤖 Vyce AI' : '👤 আপনি'}
                        </span>
                        <div
                          className={clsx(
                            'p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs',
                            isUser
                              ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                              : isAssistant
                              ? 'bg-purple-600 text-white rounded-tr-sm'
                              : 'bg-slate-900 text-white rounded-tr-sm'
                          )}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Input */}
              <div className="p-3 border-t border-slate-100 bg-white space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="মেসেজ লিখুন (অথবা শুধু '.' লিখে এন্টার দিলে AI বিরতি নেবে)..."
                    className="flex-1 p-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none transition-colors"
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  />
                  <Button onClick={handleSend} loading={sending} className="!p-3 !bg-purple-600 text-white">
                    <Send size={16} />
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>💡 টিপস: আপনি রিপ্লাই দিলে AI স্বয়ংক্রিয়ভাবে পজ হয়ে যাবে।</span>
                  <span className="font-mono text-purple-600 font-bold">Dot (.) = AI Toggle</span>
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 space-y-2">
              <MessageCircle size={48} className="opacity-20 text-purple-600" />
              <p className="text-xs font-bold">কথোপকথন দেখতে বাম পাশ থেকে একটি চ্যাট বেছে নিন</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── 3. COMMENTS AUTOMATION SECTION (AIPRAKTOR SPECIAL) ───────────────
function CommentsAutomationSection({ shopId }) {
  const [enabled, setEnabled] = useState(true);
  const [publicReply, setPublicReply] = useState('ধন্যবাদ আপনার কমেন্টের জন্য ভাইয়া! বিস্তারিত তথ্য ইনবক্সে পাঠানো হয়েছে 😊');
  const [privateDm, setPrivateDm] = useState('আসসালামু আলাইকুম! আমাদের প্রোডাক্টের বিস্তারিত বিবরণ এবং দাম জানতে যোগাযোগ করার জন্য ধন্যবাদ। এখনই অর্ডার কনফার্ম করতে আমাদের স্টোর ভিজিট করুন।');
  const [keywordRules, setKeywordRules] = useState('price, dam, koto, details, ki vabe pabo');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const fetchAutomation = async () => {
      try {
        const snap = await getDoc(doc(db, 'shops', shopId, 'settings', 'commentAutomation'));
        if (snap.exists()) {
          const data = snap.data();
          setEnabled(data.enabled ?? true);
          if (data.publicReply) setPublicReply(data.publicReply);
          if (data.privateDm) setPrivateDm(data.privateDm);
          if (data.keywordRules) setKeywordRules(data.keywordRules);
        }
      } catch (err) {
        console.warn('Failed to load comment automation settings:', err);
      }
    };
    fetchAutomation();
  }, [shopId]);

  const handleSave = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'shops', shopId, 'settings', 'commentAutomation'), {
        enabled,
        publicReply: publicReply.trim(),
        privateDm: privateDm.trim(),
        keywordRules: keywordRules.trim(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success('কমেন্ট অটোমেশন রুল সফলভাবে সংরক্ষিত হয়েছে! 🚀');
    } catch (err) {
      toast.error('সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card 
      title="ফেসবুক পোস্ট কমেন্টস অটো-রিপ্লাই ও ডিএম রোবট" 
      icon={MessageSquare}
      footer={
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} className="!bg-purple-600 text-white font-black text-xs">
            রুল সংরক্ষণ করুন
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-1">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-slate-900">স্বয়ংক্রিয় কমেন্ট রিপ্লাই চালু রাখুন</h4>
            <p className="text-[11px] text-slate-500 font-medium">
              গ্রাহক আপনার ফেসবুক পেজের কোনো পোস্টে কমেন্ট করলে সাথে সাথে রিপ্লাই ও ইনবক্স হবে।
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={clsx(
              'w-12 h-6 rounded-full transition-colors relative cursor-pointer',
              enabled ? 'bg-purple-600' : 'bg-slate-300'
            )}
          >
            <span className={clsx(
              'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm',
              enabled ? 'left-6.5' : 'left-0.5'
            )} />
          </button>
        </div>

        {/* Public Reply */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-800 block">
            ১. ফেসবুক কমেন্টের পাবলিক রিপ্লাই (যা পোস্টের নিচে সবাই দেখবে) *
          </label>
          <textarea
            rows={2}
            value={publicReply}
            onChange={e => setPublicReply(e.target.value)}
            className="w-full text-xs font-bold p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none leading-relaxed transition-colors"
          />
        </div>

        {/* Private DM */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-800 block">
            ২. গ্রাহকের ইনবক্সে অটো-ডিএম (Private Messenger Message) *
          </label>
          <textarea
            rows={3}
            value={privateDm}
            onChange={e => setPrivateDm(e.target.value)}
            className="w-full text-xs font-bold p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none leading-relaxed transition-colors"
          />
          <p className="text-[10px] text-slate-400">
            কমেন্টকারীকে ইনবক্সে এই বার্তা পাঠানো হবে এবং তার প্রোফাইল তথ্য লিড ম্যানেজমেন্টে স্বয়ংক্রিয়ভাবে জমা হবে।
          </p>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-800 block">
            ৩. ফিল্টার কিওয়ার্ড (কমা দিয়ে আলাদা করুন)
          </label>
          <input
            type="text"
            value={keywordRules}
            onChange={e => setKeywordRules(e.target.value)}
            placeholder="price, dam, koto, details"
            className="w-full text-xs font-bold p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none"
          />
        </div>
      </div>
    </Card>
  );
}

// ── 4. LEADS SECTION ─────────────────────────────────────────────────
function LeadsSection({ shopId }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('manual');
  const [addingLead, setAddingLead] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const q = query(
      collection(db, 'shops', shopId, 'leads'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.warn('Leads listener warning:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'shops', shopId, 'leads', id), {
        status,
        updatedAt: serverTimestamp()
      });
      toast.success('স্ট্যাটাস আপডেট হয়েছে');
    } catch (err) {
      toast.error('আপডেট ব্যর্থ');
    }
  };

  const handleCreateLead = async () => {
    if (!newLeadName.trim()) {
      toast.error('নাম লিখুন');
      return;
    }
    setAddingLead(true);
    try {
      await addDoc(collection(db, 'shops', shopId, 'leads'), {
        name: newLeadName.trim(),
        phone: newLeadPhone.trim() || 'N/A',
        source: newLeadSource,
        status: 'new',
        createdAt: serverTimestamp(),
        shopId,
      });
      toast.success('নতুন লিড যুক্ত হয়েছে! 🎉');
      setNewLeadName('');
      setNewLeadPhone('');
      setShowAddModal(false);
    } catch (err) {
      toast.error('লিড তৈরিতে সমস্যা হয়েছে');
    } finally {
      setAddingLead(false);
    }
  };

  const exportCsv = () => {
    if (leads.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো লিড নেই');
      return;
    }
    const headers = ['Name,Phone,Source,Status,Created At\n'];
    const rows = leads.map(l => {
      const dateStr = l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toISOString() : '';
      return `"${l.name || 'Unknown'}","${l.phone || ''}","${l.source || ''}","${l.status || 'new'}","${dateStr}"\n`;
    });
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${shopId}-${Date.now()}.csv`;
    a.click();
    toast.success('CSV ডাউনলোড সম্পন্ন হয়েছে');
  };

  return (
    <Card 
      title="সোশ্যাল লিড কালেকশন ড্যাশবোর্ড" 
      icon={Users}
      headerRight={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCsv} className="!text-xs !py-1.5 !px-3 font-bold">
            <Download size={13} className="mr-1" /> CSV এক্সপোর্ট
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="!bg-purple-600 text-white !text-xs !py-1.5 !px-3 font-bold">
            <Plus size={13} className="mr-1" /> নতুন লিড
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto pt-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-3">গ্রাহকের নাম</th>
              <th className="pb-3">সোর্স / চ্যানেল</th>
              <th className="pb-3">ফোন নম্বর / আইডি</th>
              <th className="pb-3">স্ট্যাটাস</th>
              <th className="pb-3 text-right">তারিখ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="py-8 text-center"><Loader2 className="animate-spin inline text-purple-600" size={24} /></td></tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">
                  <Users size={32} className="mx-auto opacity-30 mb-2" />
                  এখনো কোনো লিড সংগ্রহ হয়নি। ফেসবুক কমেন্ট বা ইনবক্স আসলে অটোমেটিক লিড যুক্ত হবে।
                </td>
              </tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-bold text-slate-900">{lead.name || 'Unknown'}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                      {lead.source || 'social'}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-600">{lead.phone || lead.fbId || 'N/A'}</td>
                  <td className="py-3">
                    <select 
                      value={lead.status || 'new'}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className={clsx(
                        'rounded-lg px-2.5 py-1 text-[11px] font-bold outline-none border transition-colors',
                        lead.status === 'converted' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        lead.status === 'contacted' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      )}
                    >
                      <option value="new">নতুন লিড (New)</option>
                      <option value="contacted">যোগাযোগ হয়েছে (Contacted)</option>
                      <option value="converted">অর্ডার কনফার্ম (Converted)</option>
                    </select>
                  </td>
                  <td className="py-3 text-right text-slate-400 text-[10px] font-mono">
                    {lead.createdAt?.seconds ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) : 'আজ'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-scale-in border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900">ম্যানুয়াল লিড যোগ করুন</h4>
              <button onClick={() => setShowAddModal(false)}><X size={16} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">গ্রাহকের নাম *</label>
                <input
                  type="text"
                  placeholder="যেমন: রহিম আহমেদ"
                  value={newLeadName}
                  onChange={e => setNewLeadName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">ফোন নম্বর</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={newLeadPhone}
                  onChange={e => setNewLeadPhone(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">চ্যানেল / উৎস</label>
                <select
                  value={newLeadSource}
                  onChange={e => setNewLeadSource(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none font-bold"
                >
                  <option value="manual">সরাসরি কল / শপ ভিজিট</option>
                  <option value="facebook_comment">ফেসবুক কমেন্ট</option>
                  <option value="messenger">ফেসবুক মেসেঞ্জার</option>
                  <option value="whatsapp">হোয়াটসঅ্যাপ</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 text-xs">বাতিল</Button>
              <Button onClick={handleCreateLead} loading={addingLead} className="flex-1 !bg-purple-600 text-white text-xs font-black">যোগ করুন</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── 5. AI SETTINGS SECTION (AGNES 3.0 FLASH BY VYCE AI) ───────────────
function AiSettingsSection({ shopId }) {
  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('ঢাকা সিটিতে ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা ডেলিভারি চার্জ। ক্যাশ অন ডেলিভারি প্রযোজ্য।');
  const [customPrompt, setCustomPrompt] = useState('');
  const [botTone, setBotTone] = useState('বন্ধুত্বপূর্ণ ও সাহায্যকারী (Friendly)');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const fetchAiSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'shops', shopId));
        if (snap.exists()) {
          const shopData = snap.data();
          const aiConfig = shopData.aiSettings || shopData.aiConfig || {};
          setBusinessName(shopData.shopName || '');
          if (aiConfig.businessDesc) setBusinessDesc(aiConfig.businessDesc);
          if (aiConfig.deliveryInfo) setDeliveryInfo(aiConfig.deliveryInfo);
          if (aiConfig.customPrompt) setCustomPrompt(aiConfig.customPrompt);
          if (aiConfig.botTone) setBotTone(aiConfig.botTone);
        }
      } catch (err) {
        console.warn('Failed to load AI settings:', err);
      }
    };
    fetchAiSettings();
  }, [shopId]);

  const handleSave = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'shops', shopId), {
        aiSettings: {
          model: 'agnes-3.0-flash', // Vyce AI Agnes 3.0 Flash as requested!
          provider: 'vyceai',
          businessDesc: businessDesc.trim(),
          deliveryInfo: deliveryInfo.trim(),
          customPrompt: customPrompt.trim(),
          botTone,
          updatedAt: serverTimestamp(),
        }
      }, { merge: true });
      toast.success('AI সেটিংস সফলভাবে সংরক্ষিত হয়েছে! 🤖✨');
    } catch (err) {
      toast.error('সেটিংস সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card 
      title="Vyce AI (Agnes 3.0 Flash) স্মার্ট সেলসম্যান কনফিগারেশন" 
      icon={Zap}
      footer={
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} className="!bg-purple-600 text-white font-black text-xs">
            সেটিংস সংরক্ষণ করুন
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-1">
        {/* Model info banner */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                ACTIVE MODEL
              </span>
              <h4 className="text-xs font-black text-purple-950">Agnes 3.0 Flash (Vyce AI)</h4>
            </div>
            <p className="text-[11px] text-purple-800 font-medium">
              সর্বনিম্ন টোকেন খরচ ($0.05/$0.15) ও সর্বোচ্চ দ্রুততার জন্য অপ্টিমাইজড। ক্যাশিং সক্রিয়।
            </p>
          </div>
          <span className="px-3 py-1 bg-white border border-purple-200 text-purple-700 font-mono text-xs font-bold rounded-xl shrink-0">
            ~3M Calls Free
          </span>
        </div>

        {/* Tone Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 block">
            কথা বলার ভঙ্গি (AI Bot Tone)
          </label>
          <select
            value={botTone}
            onChange={e => setBotTone(e.target.value)}
            className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          >
            <option value="বন্ধুত্বপূর্ণ ও সাহায্যকারী (Friendly)">বন্ধুত্বপূর্ণ ও সাহায্যকারী (Friendly & Polite)</option>
            <option value="পেশাদার ও মার্জিত (Professional)">পেশাদার ও মার্জিত (Professional)</option>
            <option value="সংক্ষিপ্ত ও সরাসরি (Concise & Quick)">সংক্ষিপ্ত ও সরাসরি (Concise & Quick)</option>
          </select>
        </div>

        {/* Business Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 block">
            আপনার ব্যবসা সম্পর্কে তথ্য (কী কী পণ্য বিক্রি করেন)
          </label>
          <textarea
            rows={3}
            value={businessDesc}
            onChange={e => setBusinessDesc(e.target.value)}
            placeholder="যেমন: আমরা অরজিনাল চামড়ার জুতা, বেল্ট এবং প্রিমিয়াম মানিব্যাগ পাইকারি ও খুচরা বিক্রি করি..."
            className="w-full text-xs font-bold p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none leading-relaxed"
          />
        </div>

        {/* Delivery Info */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 block">
            ডেলিভারি চার্জ ও শর্তাবলী
          </label>
          <input
            type="text"
            value={deliveryInfo}
            onChange={e => setDeliveryInfo(e.target.value)}
            className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>

        {/* Custom Prompt Override */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 block">
            কাস্টম সিস্টেম প্রম্পট (ঐচ্ছিক অ্যাডভান্সড রুল)
          </label>
          <textarea
            rows={3}
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="যেমন: সব সময় উত্তর দেওয়ার সময় আসসালামু আলাইকুম বলবে এবং অর্ডার করার জন্য ফোন নম্বর চাইবে..."
            className="w-full text-xs font-bold p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none leading-relaxed"
          />
        </div>
      </div>
    </Card>
  );
}
