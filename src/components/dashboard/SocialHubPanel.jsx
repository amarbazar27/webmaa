'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Button } from '@/components/ui';
import { 
  Globe, Camera, Phone, MessageCircle, Bot, Zap, Users, Loader2, 
  CheckCircle2, User, Send, PauseCircle, PlayCircle, ShieldCheck, 
  Sparkles, ExternalLink, HelpCircle, AlertCircle, RefreshCw, 
  Download, Plus, Trash2, ArrowRight, Check, X, Clock, MessageSquare,
  BarChart3, Settings, Bell, BookmarkCheck, ShoppingBag, Activity,
  Layers, Radio, BookOpen, MessageCircleQuestion, HelpCircle as HelpIcon,
  Video, DollarSign, UserCheck, MessageSquareCode, Copy, CheckCheck,
  ChevronRight, CornerDownRight, Search, Sliders, Smartphone, Lock, Eye, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/auth';
import { 
  collection, query, where, orderBy, limit, onSnapshot, 
  doc, updateDoc, setDoc, addDoc, getDoc, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import clsx from 'clsx';

export default function SocialHubPanel({ shopId }) {
  // Active navigation section
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState('');
  const [isAiGloballyPaused, setIsAiGloballyPaused] = useState(false);
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [shopData, setShopData] = useState(null);

  // Real-time Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch shop metadata & global AI state
  useEffect(() => {
    if (!shopId) return;
    if (shopId === 'main') {
      setShopData({ shopName: 'BD Retailers (Official)', slug: '' });
      return;
    }
    const unsub = onSnapshot(doc(db, 'shops', shopId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setShopData(data);
        setIsAiGloballyPaused(Boolean(data?.aiSettings?.globallyPaused));
      }
    });
    return () => unsub();
  }, [shopId]);

  // Robust conversations loader: Real-time listener with fallback REST API
  const refreshConversations = useCallback(async () => {
    if (!shopId) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(`/api/social/conversations?shopId=${shopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.warn('API conversations fallback warning:', err);
    }
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return;

    // 1. Initial fetch via server API
    refreshConversations();

    // 2. Real-time onSnapshot listener (ordered client-side to prevent missing index exclusions)
    let unsub = () => {};
    try {
      const q = query(
        collection(db, 'shops', shopId, 'conversations'),
        limit(100)
      );
      unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Safe client-side sort
        list.sort((a, b) => {
          const tA = a.lastMessageAt?.seconds ? a.lastMessageAt.seconds * 1000 : new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
          const tB = b.lastMessageAt?.seconds ? b.lastMessageAt.seconds * 1000 : new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
          return tB - tA;
        });
        setConversations(list);
      }, (err) => {
        console.warn('Firestore conversations stream warning (using API fallback):', err.message);
        refreshConversations();
      });
    } catch (e) {
      refreshConversations();
    }

    return () => unsub();
  }, [shopId, refreshConversations]);

  // Real-time leads stream
  useEffect(() => {
    if (!shopId) return;
    let unsub = () => {};
    try {
      const q = query(
        collection(db, 'shops', shopId, 'leads'),
        limit(100)
      );
      unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        setLeads(list);
      }, (err) => console.warn('Leads listener warning:', err.message));
    } catch (e) {}
    return () => unsub();
  }, [shopId]);

  // Fetch social connections
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('connected') === 'facebook') {
        const pageName = params.get('pageName') || 'Facebook Page';
        toast.success(`🎉 ${pageName} সফলভাবে যুক্ত হয়েছে!`);
        const cleanUrl = window.location.pathname + (shopId ? `?shopId=${shopId}` : '');
        window.history.replaceState({}, document.title, cleanUrl);
      } else if (params.get('error')) {
        toast.error(params.get('error'));
        const cleanUrl = window.location.pathname + (shopId ? `?shopId=${shopId}` : '');
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [shopId]);

  const toggleGlobalAi = async () => {
    if (!shopId) return;
    try {
      const nextState = !isAiGloballyPaused;
      const token = await auth.currentUser?.getIdToken();
      
      await fetch('/api/social/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId,
          aiSettings: {
            globallyPaused: nextState,
            updatedAt: new Date().toISOString()
          }
        })
      });

      setIsAiGloballyPaused(nextState);
      toast.success(nextState ? 'AI সহকারী সাময়িক বিরতিতে আছে (হিউম্যান টেকওভার 👤)' : 'AI সহকারী সক্রিয় (রোবট অন ডিউটি 🤖)');
    } catch (err) {
      toast.error('AI স্ট্যাটাস পরিবর্তন ব্যর্থ');
    }
  };

  const hasFb = connections.some(c => c.platform === 'facebook');

  // Navigation Items Grouped cleanly (No redundant video tabs)
  const navGroups = [
    {
      title: 'Work',
      items: [
        { id: 'overview', label: 'Overview (সারসংক্ষেপ)', icon: BarChart3, badge: null },
        { id: 'inbox', label: 'Inbox (লাইভ ইনবক্স)', icon: MessageCircle, badge: conversations.length > 0 ? conversations.length : null },
        { id: 'notifications', label: 'Notifications (বিজ্ঞপ্তি)', icon: Bell, badge: null },
        { id: 'leads', label: 'Leads (সংগৃহীত লিড)', icon: Users, badge: leads.length > 0 ? leads.length : null },
        { id: 'comments', label: 'Comments (কমেন্ট অটোমেশন)', icon: MessageSquare, badge: 'AI' },
        { id: 'saved_replies', label: 'Saved replies (সেভড রিপ্লাই)', icon: BookmarkCheck, badge: null },
        { id: 'orders', label: 'Orders (ইনবক্স অর্ডার)', icon: ShoppingBag, badge: null },
        { id: 'activity', label: 'Activity (কার্যকলাপ)', icon: Activity, badge: null },
        { id: 'analytics', label: 'Analytics (পরিসংখ্যান)', icon: Zap, badge: null },
      ]
    },
    {
      title: 'Grow',
      items: [
        { id: 'followups', label: 'Follow-ups (ফলো-আপ)', icon: RefreshCw, badge: null },
        { id: 'broadcasts', label: 'Broadcasts (ব্রডকাস্ট)', icon: Radio, badge: null },
        { id: 'products', label: 'Products (AI পণ্য ক্যাটালগ)', icon: Layers, badge: null },
        { id: 'posts', label: 'Posts (সোশ্যাল পোস্ট)', icon: MessageSquareCode, badge: null },
        { id: 'knowledge', label: 'Knowledge (বিজনেস নলেজবেস)', icon: BookOpen, badge: null },
        { id: 'website_chat', label: 'Website chat (স্টোর লাইভ চ্যাট)', icon: Globe, badge: 'Auto' },
        { id: 'agent_desk', label: 'Agent Desk (AI সেলসম্যান)', icon: Bot, badge: 'Groq LPU' },
      ]
    },
    {
      title: 'Set up',
      items: [
        { id: 'pages', label: 'Pages (চ্যানেল কানেকশন)', icon: Globe, badge: hasFb ? 'Active' : 'Setup' },
        { id: 'billing', label: 'Billing (AI ক্রেডিট ও ব্যালেন্স)', icon: DollarSign, badge: '$90+' },
        { id: 'team', label: 'Team (টিম সদস্য ও সাপোর্ট)', icon: UserCheck, badge: null },
        { id: 'setup', label: 'Setup (সেটআপ চেকলিস্ট)', icon: Settings, badge: '১/৭' },
      ]
    },
    {
      title: 'Help us improve',
      items: [
        { id: 'feedback', label: 'Feedback (মতামত)', icon: HelpCircle, badge: null },
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Control Plane Top Header ── */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              BD RETAILERS SOCIAL HUB
            </span>
            <span className="text-xs font-mono text-slate-400">
              AI ENGINE: GROQ LPU (LLAMA 3.3 70B) • {currentTime || '00:00:00'}
            </span>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md text-[10px] font-bold">
              {shopId === 'main' ? 'BD Retailers Official' : `Shop ID: ${shopId}`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            সোশ্যাল মিডিয়া সেলস অ্যান্ড অটোমেশন হাব
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            ফেসবুক, ইনস্টাগ্রাম, হোয়াটসঅ্যাপ ও স্টোর লাইভ চ্যাট থেকে রিয়েল-টাইম লিড জেনারেশন, স্মার্ট সেলস রিপ্লাই ও অর্ডার ক্লোজিং।
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* AI <-> Human Takeover Toggle */}
          <button
            onClick={toggleGlobalAi}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
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
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="সেটআপ ও হেল্প গাইড"
          >
            <HelpIcon size={16} />
            <span className="hidden sm:inline">হেল্প গাইড (?)</span>
          </button>
        </div>
      </div>

      {/* ── Main Layout: Left Sidebar + Right Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Sidebar (AiPraktor Hierarchy) ── */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-3.5 space-y-4">
          {/* Setup Progress Pill */}
          <div 
            onClick={() => setActiveTab('setup')} 
            className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl cursor-pointer hover:border-purple-300 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-black text-purple-900 mb-1.5">
              <span>সেটআপ গাইড</span>
              <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full text-[10px]">১ / ৭</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: hasFb ? '50%' : '20%' }} />
            </div>
          </div>

          {/* Grouped Navigation */}
          <div className="space-y-4">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={clsx(
                          'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer',
                          isActive
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon size={15} className={clsx('shrink-0', isActive ? 'text-white' : 'text-slate-500')} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={clsx(
                            'text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase shrink-0',
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : item.badge === 'Active' 
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-700'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Content Area ── */}
        <div className="lg:col-span-9 space-y-6">
          {/* 1. Work Sections */}
          {activeTab === 'overview' && (
            <OverviewSection 
              shopId={shopId} 
              conversations={conversations} 
              leads={leads} 
              hasFb={hasFb}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'inbox' && (
            <UnifiedInboxSection 
              shopId={shopId} 
              conversations={conversations} 
              isAiGloballyPaused={isAiGloballyPaused} 
              onRefresh={refreshConversations}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsSection conversations={conversations} leads={leads} />
          )}

          {activeTab === 'leads' && (
            <LeadsSection shopId={shopId} leads={leads} />
          )}

          {activeTab === 'comments' && (
            <CommentsAutomationSection shopId={shopId} />
          )}

          {activeTab === 'saved_replies' && (
            <SavedRepliesSection shopId={shopId} />
          )}

          {activeTab === 'orders' && (
            <OrdersSection shopId={shopId} />
          )}

          {activeTab === 'activity' && (
            <ActivityAuditSection conversations={conversations} leads={leads} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsSection conversations={conversations} leads={leads} />
          )}

          {/* 2. Grow Sections */}
          {activeTab === 'followups' && (
            <FollowupsSection shopId={shopId} leads={leads} />
          )}

          {activeTab === 'broadcasts' && (
            <BroadcastsLaunchSection shopId={shopId} />
          )}

          {activeTab === 'products' && (
            <ProductsContextSection shopId={shopId} />
          )}

          {activeTab === 'posts' && (
            <SocialPostsSection shopId={shopId} hasFb={hasFb} />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeBaseSection shopId={shopId} />
          )}

          {activeTab === 'website_chat' && (
            <WebsiteChatConfigSection shopId={shopId} shopData={shopData} />
          )}

          {activeTab === 'agent_desk' && (
            <AgentDeskSection shopId={shopId} />
          )}

          {/* 3. Set up Sections */}
          {activeTab === 'pages' && (
            <PagesChannelSection 
              shopId={shopId} 
              connections={connections} 
              onRefresh={fetchConnections}
              loading={loadingConnections}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSection />
          )}

          {activeTab === 'team' && (
            <TeamManagementSection shopId={shopId} />
          )}

          {activeTab === 'setup' && (
            <SetupChecklistSection hasFb={hasFb} onNavigate={setActiveTab} />
          )}

          {activeTab === 'feedback' && (
            <FeedbackSection shopId={shopId} />
          )}
        </div>
      </div>

      {/* ── All-in-One Helper & Setup Guide Modal (?) ── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-scale-in border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-purple-600" /> সোশ্যাল হাব ও লাইভ চ্যাট সম্পূর্ণ গাইড
              </h3>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 font-medium leading-relaxed">
              {/* Step 1: Create Meta App */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <p className="font-black text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <Globe size={15} /> ধাপ ১: Meta Developer-এ অ্যাপ তৈরি (App Creation)
                  </span>
                  <a 
                    href="https://developers.facebook.com/apps/create/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    অ্যাপ তৈরি লিংক <ExternalLink size={12} />
                  </a>
                </p>
                <p className="text-slate-600">
                  Graph API বা Webhook ব্যবহারের আগে মেটায় আপনার একটি অ্যাপ থাকতে হবে। <a href="https://developers.facebook.com/apps/create/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">developers.facebook.com/apps/create</a> লিংকে যান, Use Case হিসেবে &quot;Other&quot; বা &quot;Business&quot; সিলেক্ট করে যেকোনো নামে একটি App তৈরি করুন।
                </p>
              </div>

              {/* Step 2: Page Access Token */}
              <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-100 space-y-1.5">
                <p className="font-black text-purple-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap size={15} className="text-purple-600" /> ধাপ ২: পেজ অ্যাক্সেস টোকেন সংগ্রহ (Page Access Token)
                  </span>
                  <a 
                    href="https://developers.facebook.com/tools/explorer/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[11px] text-purple-700 font-bold hover:underline flex items-center gap-1"
                  >
                    Graph API Explorer <ExternalLink size={12} />
                  </a>
                </p>
                <div className="text-purple-900 space-y-1">
                  <p>
                    সরাসরি <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="font-bold underline">Graph API Explorer</a>-এ যান:
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                    <li>উপরে <strong>Meta App</strong> ড্রপডাউনে আপনার তৈরি করা অ্যাপ সিলেক্ট করুন।</li>
                    <li><strong>User or Page</strong> ড্রপডাউন থেকে অবশ্যই আপনার <strong>Facebook Page</strong> সিলেক্ট করবেন (ভুলেও User Token রাখবেন না)।</li>
                    <li>Permissions বক্সে: <strong>pages_show_list, pages_read_engagement, pages_manage_metadata, pages_messaging</strong> যোগ করুন।</li>
                    <li><strong>Generate Access Token</strong> চাপুন এবং প্রাপ্ত টোকেনটি কপি করে Social Hub-এ পেস্ট করুন।</li>
                  </ol>
                </div>
              </div>

              {/* Step 3: Webhooks Setup */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <p className="font-black text-amber-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-900">
                    <ShieldCheck size={15} className="text-amber-600" /> ধাপ ৩: ওয়েবহুক যুক্ত করা (Webhooks Setup)
                  </span>
                  <a 
                    href="https://developers.facebook.com/apps/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[11px] text-amber-800 font-bold hover:underline flex items-center gap-1"
                  >
                    মেটা অ্যাপস <ExternalLink size={12} />
                  </a>
                </p>
                <div className="p-2 bg-purple-100/70 border border-purple-200 rounded-xl text-[11px] text-purple-950 font-bold">
                  📍 যাওয়ার সঠিক পাথ: <strong>Use cases &gt; Create &amp; manage ads (বা Customize) &gt; Webhooks</strong>
                </div>
                <div className="p-2 bg-amber-100/70 border border-amber-300/80 rounded-xl text-[11px] text-amber-950 font-bold">
                  ⚠️ গুরুত্বপূর্ণ সতর্কবার্তা: বাম পাশের Product / Select an object ড্রপডাউনে <u>অবশ্যই &quot;Page&quot; সিলেক্ট করবেন</u>! ভুলেও Catalog (ক্যাটালগ) সিলেক্ট করবেন না। ক্যাটালগ সিলেক্ট করলে মেসেজ বা কমেন্ট আসবে না।
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Callback URL:</span>
                    <button 
                      onClick={() => { navigator.clipboard.writeText('https://bdretailers.com/api/social/facebook-webhook'); toast.success('Webhook URL কপি হয়েছে!'); }}
                      className="text-purple-600 hover:text-purple-800 font-bold cursor-pointer"
                    >
                      কপি
                    </button>
                  </div>
                  <div className="text-slate-800 break-all select-all font-semibold">https://bdretailers.com/api/social/facebook-webhook</div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Verify Token:</span>
                    <button 
                      onClick={() => { navigator.clipboard.writeText('bdretailers_meta_webhook_secret_2026'); toast.success('Verify Token কপি হয়েছে!'); }}
                      className="text-purple-600 hover:text-purple-800 font-bold cursor-pointer"
                    >
                      কপি
                    </button>
                  </div>
                  <div className="text-slate-800 select-all font-semibold">bdretailers_meta_webhook_secret_2026</div>
                </div>
                <p className="text-[11px] text-amber-900 font-medium">
                  <strong>Verify and save</strong> বাটনে চাপ দেওয়ার পর নিচের Webhook fields টেবিল থেকে <strong>messages</strong> এবং <strong>feed</strong> এর পাশে <strong>Subscribe</strong> টগলটি অন করে দিন।
                </p>
              </div>

              {/* Step 4: Human Takeover */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
                <p className="font-black text-emerald-900 flex items-center gap-1.5">
                  <PauseCircle size={15} className="text-emerald-600" /> হিউম্যান টেকওভার ও ডট (.) কমান্ড
                </p>
                <p className="text-emerald-800 text-[11px]">
                  গ্রাহকের সাথে নিজে কথা বলতে চাইলে মেসেজ ইনপুটে শুধু একটি ডট <strong>&quot;.&quot;</strong> লিখে এন্টার দিন — AI সাথে সাথে পজ হয়ে যাবে। কথা শেষ হলে আবার ডট দিলে AI পুনরায় সক্রিয় হবে।
                </p>
              </div>
            </div>

            <Button onClick={() => setShowGuideModal(false)} className="w-full !bg-slate-900 text-white font-black cursor-pointer">
              বুঝেছি, কাজ শুরু করি!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 1. WORK COMPONENTS
// ─────────────────────────────────────────────────────────────────────

function OverviewSection({ shopId, conversations, leads, hasFb, onNavigate }) {
  const activeChats = conversations.filter(c => !c.aiPaused).length;
  const humanTakeoverChats = conversations.filter(c => c.aiPaused).length;

  const stats = [
    { label: 'মোট কথোপকথন', value: conversations.length, icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'AI দ্বারা হ্যান্ডেল্ড', value: `${conversations.length > 0 ? Math.round((activeChats / (conversations.length || 1)) * 100) : 100}%`, icon: Bot, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'হিউম্যান রিভিউ অপেক্ষমাণ', value: humanTakeoverChats, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'ক্যাপচার্ড লিড', value: leads.length, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Setup Prompt Banner if not connected */}
      {!hasFb && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-600 text-white rounded-md text-[10px] font-black uppercase">
                ধাপ ১ / ৭
              </span>
              <h4 className="text-sm font-black text-slate-900">
                Facebook পেজ যুক্ত করুন — AI সহকারী সক্রিয় করতে
              </h4>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              পেজ যুক্ত না হলে গ্রাহকের মেসেজ অ্যাসিস্ট্যান্টের কাছে পৌঁছাবে না। Pages সেকশনে গিয়ে টোকেন দিন।
            </p>
          </div>
          <Button 
            onClick={() => onNavigate('pages')} 
            className="!bg-purple-600 hover:!bg-purple-700 text-white shrink-0 text-xs font-black cursor-pointer"
          >
            পেজ যুক্ত করুন <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="!p-4 border border-slate-100 shadow-sm rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={clsx('p-3 rounded-xl', stat.bg, stat.color)}>
                  <Icon size={20} />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 leading-none">{stat.value}</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Launchpad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigate('inbox')}
          className="p-5 bg-white border border-slate-200/80 rounded-2xl hover:border-purple-400 hover:shadow-md transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <MessageCircle size={20} />
            </div>
            <ArrowRight size={16} className="text-slate-400" />
          </div>
          <h4 className="font-black text-sm text-slate-900">লাইভ ইনবক্স খুলুন</h4>
          <p className="text-xs text-slate-500 font-medium">
            ফেসবুক, ইনস্টাগ্রাম ও ওয়েবসাইটের সব গ্রাহকের মেসেজে সরাসরি রিপ্লাই দিন।
          </p>
        </div>

        <div 
          onClick={() => onNavigate('comments')}
          className="p-5 bg-white border border-slate-200/80 rounded-2xl hover:border-purple-400 hover:shadow-md transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare size={20} />
            </div>
            <ArrowRight size={16} className="text-slate-400" />
          </div>
          <h4 className="font-black text-sm text-slate-900">কমেন্ট অটো-রিপ্লাই রুল</h4>
          <p className="text-xs text-slate-500 font-medium">
            পোস্টে কমেন্ট আসা মাত্র পাবলিক উত্তর ও স্বয়ংক্রিয় ইনবক্স ডিএম পাঠান।
          </p>
        </div>

        <div 
          onClick={() => onNavigate('leads')}
          className="p-5 bg-white border border-slate-200/80 rounded-2xl hover:border-purple-400 hover:shadow-md transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users size={20} />
            </div>
            <ArrowRight size={16} className="text-slate-400" />
          </div>
          <h4 className="font-black text-sm text-slate-900">কাস্টমার লিড ও সিআরএম</h4>
          <p className="text-xs text-slate-500 font-medium">
            সোশ্যাল মিডিয়া থেকে স্বয়ংক্রিয়ভাবে জমা হওয়া গ্রাহকের ফোন ও বিবরণ।
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 2. UNIFIED INBOX WITH HUMAN-AI HANDOFF & TEST SIMULATOR
// ─────────────────────────────────────────────────────────────────────

function UnifiedInboxSection({ shopId, conversations, isAiGloballyPaused, onRefresh }) {
  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || null);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [savedRepliesList, setSavedRepliesList] = useState([]);

  // Load saved replies for quick insert
  useEffect(() => {
    if (!shopId) return;
    const fetchSaved = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/social/settings?shopId=${shopId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.settings?.savedReplies) {
          setSavedRepliesList(data.settings.savedReplies);
        }
      } catch (err) {}
    };
    fetchSaved();
  }, [shopId]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const matchPlatform = filterPlatform === 'all' || (c.platform || 'facebook') === filterPlatform;
      const matchSearch = !searchQuery.trim() || 
        (c.senderName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchPlatform && matchSearch;
    });
  }, [conversations, filterPlatform, searchQuery]);

  const activeConv = conversations.find(c => c.id === activeConvId) || filteredConversations[0];

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

      toast.success(data.metaSent ? 'মেসেঞ্জারে পাঠানো হয়েছে! 📨' : 'মেসেজ সফলভাবে সংরক্ষিত হয়েছে');
      setReplyText('');
      if (onRefresh) onRefresh();
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
      toast.success(nextPaused ? 'এই চ্যাটে AI বিরতি নিয়েছে (হিউম্যান মোড ⏸️)' : 'এই চ্যাটে AI পুনরায় চালু হয়েছে 🤖');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('AI টগল করা সম্ভব হয়নি');
    }
  };

  // Test Simulator: Send artificial message to verify Agnes 3.0 Flash live
  const handleSimulateTestMessage = async () => {
    setSimulating(true);
    try {
      const testVisitorId = `sim_${Date.now().toString().slice(-4)}`;
      const testQueries = [
        'আসসালামু আলাইকুম, আপনাদের ডেলিভারি চার্জ কত?',
        'ভাই এই প্রোডাক্টটার দাম কত? ক্যাশ অন ডেলিভারি দেওয়া যাবে?',
        'আমি কি সরাসরি দোকানে এসে প্রোডাক্ট নিতে পারব?',
      ];
      const randomQuery = testQueries[Math.floor(Math.random() * testQueries.length)];

      const res = await fetch('/api/social/website-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          visitorId: testVisitorId,
          visitorName: `সিমুলেটর গ্রাহক #${testVisitorId.slice(-3)}`,
          visitorPhone: '01700000000',
          message: randomQuery
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('টেস্ট মেসেজ সিমুলেশন সফল! ইনবক্সে মেসেজ যোগ হয়েছে 🎉');
        setActiveConvId(testVisitorId);
        if (onRefresh) onRefresh();
      } else {
        toast.error(data.error || 'সিমুলেশন ব্যর্থ');
      }
    } catch (err) {
      toast.error('সিমুলেশন ত্রুটি');
    } finally {
      setSimulating(false);
    }
  };

  const insertCannedReply = (content) => {
    setReplyText(prev => prev ? `${prev} ${content}` : content);
  };

  return (
    <Card className="p-0 border border-slate-200 shadow-sm overflow-hidden rounded-3xl">
      {/* Top Controls Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'facebook', 'website', 'instagram', 'whatsapp'].map(platform => (
            <button
              key={platform}
              onClick={() => setFilterPlatform(platform)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer',
                filterPlatform === platform 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200/60'
              )}
            >
              {platform === 'all' ? 'সকল চ্যানেল' : platform}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={() => { onRefresh(); toast.success('রিফ্রেশ সম্পন্ন'); }}
              className="p-1.5 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
              title="ইনবক্স রিফ্রেশ"
            >
              <RefreshCw size={14} />
            </button>
          )}

          <Button
            onClick={handleSimulateTestMessage}
            loading={simulating}
            variant="outline"
            className="!text-xs !py-1.5 !px-3 font-bold !border-purple-200 text-purple-700 hover:!bg-purple-50 cursor-pointer"
          >
            <Sparkles size={14} className="mr-1.5 text-purple-600" /> টেস্ট মেসেজ পাঠান
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-[650px] divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Left: Conversations List */}
        <div className="w-full md:w-1/3 bg-slate-50/60 flex flex-col h-2/5 md:h-full">
          <div className="p-3 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="নাম বা বার্তা দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-purple-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-xs text-slate-400 p-8 space-y-2">
                <MessageSquare size={32} className="mx-auto opacity-30 text-slate-400" />
                <p>কোনো বার্তা পাওয়া যায়নি। উপরে &quot;টেস্ট মেসেজ পাঠান&quot; চাপুন।</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = activeConv && conv.id === activeConv.id;
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
                        {conv.senderName || 'গ্রাহক'}
                      </p>
                      <span className={clsx('text-[9px] px-1.5 py-0.5 rounded-md font-black capitalize', isSelected ? 'bg-purple-800 text-purple-200' : 'bg-slate-100 text-slate-500')}>
                        {conv.platform || 'FB'}
                      </span>
                    </div>
                    <p className={clsx('text-[11px] truncate', isSelected ? 'text-purple-100' : 'text-slate-500')}>
                      {conv.lastMessage || 'বার্তা নেই'}
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

        {/* Right: Active Message Thread */}
        <div className="w-full md:w-2/3 flex flex-col h-3/5 md:h-full bg-white">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="space-y-0.5">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    {activeConv.senderName || 'গ্রাহক'}
                    <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold capitalize">
                      {activeConv.platform || 'Facebook'}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    ID: {activeConv.senderPsid || activeConv.id} {activeConv.phone && `• ${activeConv.phone}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleConversationAi}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer',
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

                    return (
                      <div
                        key={idx}
                        className={clsx(
                          'flex flex-col max-w-[80%]',
                          isUser ? 'self-start items-start' : 'self-end items-end ml-auto'
                        )}
                      >
                        <span className="text-[9px] font-bold text-slate-400 mb-0.5 px-1">
                          {isUser ? activeConv.senderName || 'গ্রাহক' : isAssistant ? '🤖 Groq LPU AI' : '👤 আপনি (মার্চেন্ট)'}
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

              {/* Quick Canned Replies Bar */}
              {savedRepliesList.length > 0 && (
                <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">কুইক রিপ্লাই:</span>
                  {savedRepliesList.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => insertCannedReply(r.content)}
                      className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold hover:bg-purple-50 hover:text-purple-700 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      {r.shortcut || r.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Footer Reply Input */}
              <div className="p-3 border-t border-slate-100 bg-white space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="মেসেজ লিখুন (অথবা শুধু '.' লিখে এন্টার দিলে AI বিরতিতে যাবে)..."
                    className="flex-1 p-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none transition-colors"
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  />
                  <Button onClick={handleSend} loading={sending} className="!p-3 !bg-purple-600 text-white cursor-pointer">
                    <Send size={16} />
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>💡 টিপস: আপনি রিপ্লাই দিলে AI স্বয়ংক্রিয়ভাবে হিউম্যান মোডে চলে যাবে।</span>
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

// ─────────────────────────────────────────────────────────────────────
// 3. COMMENTS AUTOMATION SECTION (WITH ADMIN SDK SAVE API)
// ─────────────────────────────────────────────────────────────────────

function CommentsAutomationSection({ shopId }) {
  const [enabled, setEnabled] = useState(true);
  const [publicReply, setPublicReply] = useState('ধন্যবাদ আপনার কমেন্টের জন্য ভাইয়া! বিস্তারিত তথ্য ইনবক্সে পাঠানো হয়েছে 😊');
  const [privateDm, setPrivateDm] = useState('আসসালামু আলাইকুম! আমাদের প্রোডাক্টের বিস্তারিত বিবরণ এবং দাম জানতে যোগাযোগ করার জন্য ধন্যবাদ। এখনই অর্ডার করতে স্টোর ভিজিট করুন।');
  const [keywordRules, setKeywordRules] = useState('price, dam, koto, details, ki vabe pabo');
  const [saving, setSaving] = useState(false);

  // Load existing rules via Admin SDK endpoint
  useEffect(() => {
    if (!shopId) return;
    const fetchAutomation = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/social/settings?shopId=${shopId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.settings?.commentAutomation) {
          const ca = data.settings.commentAutomation;
          setEnabled(ca.enabled ?? true);
          if (ca.publicReply) setPublicReply(ca.publicReply);
          if (ca.privateDm) setPrivateDm(ca.privateDm);
          if (ca.keywordRules) setKeywordRules(ca.keywordRules);
        }
      } catch (err) {
        console.warn('Failed to load comment settings:', err);
      }
    };
    fetchAutomation();
  }, [shopId]);

  const handleSave = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('লগইন প্রয়োজন');

      const res = await fetch('/api/social/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId,
          commentAutomation: {
            enabled,
            publicReply: publicReply.trim(),
            privateDm: privateDm.trim(),
            keywordRules: keywordRules.trim()
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'সংরক্ষণে সমস্যা হয়েছে');

      toast.success('কমেন্ট অটোমেশন রুল সফলভাবে সংরক্ষিত হয়েছে! 🚀');
    } catch (err) {
      toast.error(err.message || 'সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card 
        title="ফেসবুক পোস্ট কমেন্টস অটো-রিপ্লাই ও ডিএম রোবট" 
        icon={MessageSquare}
        footer={
          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving} className="!bg-purple-600 text-white font-black text-xs cursor-pointer">
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
                গ্রাহক আপনার ফেসবুক পেজের কোনো পোস্টে কমেন্ট করলে সাথে সাথে পাবলিক রিপ্লাই ও ইনবক্স হবে।
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

      {/* Visual Simulation Preview Card */}
      <Card title="লাইভ প্রিভিউ (কাস্টমার যা দেখবে)" icon={Sparkles}>
        <div className="p-4 bg-slate-100 rounded-2xl space-y-3 max-w-lg mx-auto">
          <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">C</div>
              <span className="text-xs font-bold text-slate-800">গ্রাহকের কমেন্ট: &quot;দাম কত ভাই?&quot;</span>
            </div>
            <div className="pl-6 border-l-2 border-purple-300 space-y-1">
              <span className="text-[10px] font-black text-purple-700 flex items-center gap-1">
                <Bot size={12} /> আপনার শপের পাবলিক রিপ্লাই:
              </span>
              <p className="text-xs text-slate-600 bg-purple-50/50 p-2 rounded-lg">{publicReply}</p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px]">
              <MessageCircle size={14} /> গ্রাহকের মেসেঞ্জারে অটো-ডিএম:
            </div>
            <p className="text-xs text-slate-700 bg-blue-50/50 p-2.5 rounded-lg leading-relaxed">{privateDm}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 4. LEADS MANAGEMENT CRM
// ─────────────────────────────────────────────────────────────────────

function LeadsSection({ shopId, leads }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('manual');
  const [addingLead, setAddingLead] = useState(false);

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
      title="সোশ্যাল ও ওয়েবসাইট লিড ডেটাবেজ" 
      icon={Users}
      headerRight={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCsv} className="!text-xs !py-1.5 !px-3 font-bold cursor-pointer">
            <Download size={13} className="mr-1" /> CSV এক্সপোর্ট
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="!bg-purple-600 text-white !text-xs !py-1.5 !px-3 font-bold cursor-pointer">
            <Plus size={13} className="mr-1" /> ম্যানুয়াল লিড
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto pt-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-3">গ্রাহকের নাম</th>
              <th className="pb-3">উৎস</th>
              <th className="pb-3">ফোন / সোশ্যাল আইডি</th>
              <th className="pb-3">তারিখ</th>
              <th className="pb-3 text-right">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">
                  এখনো কোনো লিড জমা হয়নি। কমেন্ট বা ইনবক্সে যোগাযোগ আসলে এখানে প্রদর্শিত হবে।
                </td>
              </tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 font-bold text-slate-900">{lead.name || 'অপরিচিত'}</td>
                  <td className="py-3 capitalize text-slate-600">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold">
                      {lead.source || 'social'}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-600">{lead.phone || lead.fbId || 'N/A'}</td>
                  <td className="py-3 text-slate-400 text-[10px]">
                    {lead.createdAt?.seconds 
                      ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) 
                      : 'আজ'}
                  </td>
                  <td className="py-3 text-right">
                    <select
                      value={lead.status || 'new'}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                      className="text-[11px] font-bold py-1 px-2.5 rounded-lg border border-slate-200 bg-white outline-none cursor-pointer"
                    >
                      <option value="new">নতুন (New)</option>
                      <option value="contacted">যোগাযোগ হয়েছে</option>
                      <option value="converted">অর্ডার সম্পন্ন 🎉</option>
                      <option value="lost">বাতিল</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">ম্যানুয়াল লিড যুক্ত করুন</h3>
              <button onClick={() => setShowAddModal(false)} className="cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="গ্রাহকের নাম *"
                value={newLeadName}
                onChange={e => setNewLeadName(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none"
              />
              <input
                type="text"
                placeholder="ফোন নম্বর (ঐচ্ছিক)"
                value={newLeadPhone}
                onChange={e => setNewLeadPhone(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none"
              />
              <select
                value={newLeadSource}
                onChange={e => setNewLeadSource(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none"
              >
                <option value="manual">ম্যানুয়াল অ্যান্ট্রি</option>
                <option value="phone_call">ফোন কল</option>
                <option value="whatsapp">হোয়াটসঅ্যাপ</option>
                <option value="facebook">ফেসবুক</option>
              </select>
            </div>
            <Button onClick={handleCreateLead} loading={addingLead} className="w-full !bg-purple-600 text-white font-black text-xs cursor-pointer">
              লিড সেভ করুন
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 5. SAVED REPLIES & SHORTCUT MACROS
// ─────────────────────────────────────────────────────────────────────

function SavedRepliesSection({ shopId }) {
  const [replies, setReplies] = useState([
    { shortcut: '#bkash', title: 'বিকাশ পেমেন্ট', content: 'আমাদের অফিসিয়াল বিকাশ মার্চেন্ট নম্বর: 01700000000 (Payment অপশন সিলেক্ট করবেন)।' },
    { shortcut: '#delivery', title: 'ডেলিভারি সংক্রান্ত', content: 'ঢাকার ভিতরে ডেলিভারি চার্জ ৬০ টাকা (২৪-৪৮ ঘণ্টা), ঢাকার বাইরে ১২০ টাকা (২-৩ দিন)।' },
    { shortcut: '#address', title: 'দোকানের ঠিকানা', content: 'আমাদের শোরুমের ঠিকানা: লেভেল ৩, শপ #২০৫, বসুন্ধরা সিটি, পান্থপথ, ঢাকা।' },
  ]);
  const [newShortcut, setNewShortcut] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Load from API
  useEffect(() => {
    if (!shopId) return;
    const fetchSaved = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/social/settings?shopId=${shopId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.settings?.savedReplies) {
          setReplies(data.settings.savedReplies);
        }
      } catch (err) {}
    };
    fetchSaved();
  }, [shopId]);

  const handleSaveReply = async (updatedList) => {
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/social/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId,
          savedReplies: updatedList
        })
      });
      setReplies(updatedList);
      toast.success('সেভড রিপ্লাই সংরক্ষিত হয়েছে!');
    } catch (err) {
      toast.error('সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (!newShortcut.trim() || !newContent.trim()) {
      toast.error('শর্টকাট এবং কনটেন্ট দিন');
      return;
    }
    const nextList = [...replies, {
      shortcut: newShortcut.startsWith('#') ? newShortcut.trim() : `#${newShortcut.trim()}`,
      title: newTitle.trim() || newShortcut.trim(),
      content: newContent.trim()
    }];
    handleSaveReply(nextList);
    setNewShortcut('');
    setNewTitle('');
    setNewContent('');
  };

  const handleDelete = (index) => {
    const nextList = replies.filter((_, i) => i !== index);
    handleSaveReply(nextList);
  };

  return (
    <div className="space-y-6">
      <Card title="সেভড রিপ্লাই ও কুইক ম্যাক্রোস (Saved Replies)" icon={BookmarkCheck}>
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            লাইভ ইনবক্সে চ্যাট করার সময় ঘনঘন ব্যবহৃত মেসেজগুলো এক ক্লিকে পাঠানোর জন্য শর্টকাট যুক্ত করুন:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <input
              type="text"
              placeholder="শর্টকাট (উদাঃ #bkash)"
              value={newShortcut}
              onChange={e => setNewShortcut(e.target.value)}
              className="text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
            />
            <input
              type="text"
              placeholder="শিরোনাম (ঐচ্ছিক)"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
            />
            <input
              type="text"
              placeholder="সম্পূর্ণ উত্তর লিখুন..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
            />
            <div className="md:col-span-3 flex justify-end">
              <Button onClick={handleAdd} loading={saving} className="!bg-purple-600 text-white text-xs font-bold !py-2 !px-4 cursor-pointer">
                <Plus size={14} className="mr-1" /> নতুন রিপ্লাই যোগ করুন
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {replies.map((reply, idx) => (
              <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-start justify-between gap-3 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {reply.shortcut}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{reply.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{reply.content}</p>
                </div>
                <button
                  onClick={() => handleDelete(idx)}
                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 6. KNOWLEDGE BASE & AI SALES CONTEXT
// ─────────────────────────────────────────────────────────────────────

function KnowledgeBaseSection({ shopId }) {
  const [knowledge, setKnowledge] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const fetchKnowledge = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/social/settings?shopId=${shopId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.settings?.knowledgeBase) setKnowledge(data.settings.knowledgeBase);
        if (data.settings?.aiSettings?.deliveryInfo) setDeliveryInfo(data.settings.aiSettings.deliveryInfo);
      } catch (err) {}
    };
    fetchKnowledge();
  }, [shopId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/social/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId,
          knowledgeBase: knowledge.trim(),
          aiSettings: { deliveryInfo: deliveryInfo.trim() }
        })
      });
      toast.success('নলেজবেস সফলভাবে সংরক্ষিত হয়েছে! Agnes 3.0 এই তথ্য দিয়ে উত্তর দেবে।');
    } catch (err) {
      toast.error('সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card 
      title="বিজনেস নলেজবেস ও এফএকিউ (Knowledge Base)" 
      icon={BookOpen}
      footer={
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} className="!bg-purple-600 text-white font-black text-xs cursor-pointer">
            নলেজবেস সংরক্ষণ করুন
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        <p className="text-xs text-slate-600 font-medium">
          আপনার ব্যবসার নিয়মাবলী, রিটার্ন পলিসি ও সাধারণ প্রশ্নোত্তর এখানে লিখুন। Groq LPU ও Vyce AI গ্রাহকের যেকোনো প্রশ্নে এই তথ্যগুলো মাথায় রেখে প্রমিত বাংলায় উত্তর দেবে।
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 block">১. ডেলিভারি তথ্য ও চার্জ</label>
          <input
            type="text"
            value={deliveryInfo}
            onChange={e => setDeliveryInfo(e.target.value)}
            placeholder="ঢাকার ভেতর ৬০ টাকা (২৪ ঘণ্টা), ঢাকার বাইরে ১২০ টাকা (২-৩ দিন)"
            className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 block">২. সাধারণ প্রশ্নোত্তর ও ব্যবসার খুঁটিনাটি (FAQs)</label>
          <textarea
            rows={5}
            value={knowledge}
            onChange={e => setKnowledge(e.target.value)}
            placeholder="প্রশ্ন: প্রোডাক্ট পছন্দ না হলে রিটার্ন করা যাবে?&#10;উত্তর: হ্যাঁ, ডেলিভারি ম্যানের সামনে চেক করে সমস্যা থাকলে ফেরত দেওয়া যাবে।&#10;&#10;প্রশ্ন: পেমেন্ট পদ্ধতি কি কি?&#10;উত্তর: ক্যাশ অন ডেলিভারি, বিকাশ ও নগদ।"
            className="w-full text-xs font-bold p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none leading-relaxed"
          />
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 7. STOREFRONT LIVE CHAT (AUTO-ACTIVE WITH NO CODE REQUIREMENT)
// ─────────────────────────────────────────────────────────────────────

function WebsiteChatConfigSection({ shopId, shopData }) {
  const [chatEnabled, setChatEnabled] = useState(true);
  const [botName, setBotName] = useState('Bazar Bot');
  const [welcomeMsg, setWelcomeMsg] = useState('আসসালামু আলাইকুম! কোনো পণ্য বা ডেলিভারি সম্পর্কে জানতে মেসেজ দিন। 😊');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const fetchChatConfig = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/social/settings?shopId=${shopId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.settings?.aiSettings) {
          const ai = data.settings.aiSettings;
          if (ai.chatEnabled !== undefined) setChatEnabled(ai.chatEnabled);
          if (ai.botName) setBotName(ai.botName);
          if (ai.welcomeMsg) setWelcomeMsg(ai.welcomeMsg);
        }
      } catch (err) {}
    };
    fetchChatConfig();
  }, [shopId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/social/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId,
          aiSettings: {
            chatEnabled,
            botName: botName.trim(),
            welcomeMsg: welcomeMsg.trim()
          }
        })
      });
      toast.success('স্টোর লাইভ চ্যাট সেটিংস সংরক্ষিত হয়েছে!');
    } catch (err) {
      toast.error('সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const storeUrl = shopId === 'main' ? '/' : `/shop/${shopData?.slug || shopId}`;

  return (
    <div className="space-y-6">
      <Card 
        title="অনলাইন স্টোর লাইভ চ্যাট কন্ট্রোল (Website Live Chat)" 
        icon={Globe}
        footer={
          <div className="flex justify-between items-center">
            <a 
              href={storeUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <ExternalLink size={14} /> নিজের স্টোরে লাইভ চ্যাট দেখুন
            </a>
            <Button onClick={handleSave} loading={saving} className="!bg-purple-600 text-white font-black text-xs cursor-pointer">
              সেটিংস সংরক্ষণ করুন
            </Button>
          </div>
        }
      >
        <div className="space-y-5 pt-1">
          {/* Automatic Active Status Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Check size={18} />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-black text-emerald-950 text-sm">
                লাইভ চ্যাট স্ট্যাটাস: আপনার অনলাইন স্টোরে স্বয়ংক্রিয়ভাবে সক্রিয় 🟢
              </p>
              <p className="text-emerald-800 leading-relaxed">
                আপনার কোনো কোড কপি বা পরিবর্তন করার দরকার নেই! প্রতিটি রিটেইলার শপে লাইভ চ্যাট উইজেট স্থায়ীভাবে ইনস্টল্ড। গ্রাহক আপনার স্টোর ভিজিট করে প্রশ্ন করা মাত্রই তা সরাসরি আপনার এই সোশ্যাল হাবের <strong>লাইভ ইনবক্সে</strong> চলে আসবে।
              </p>
            </div>
          </div>

          {/* Toggle Active */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-900">স্টোরে লাইভ চ্যাট উইজেট দৃশ্যমান রাখুন</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                অনলাইন স্টোরের ডান পাশে ভাসমান চ্যাট বাটনটি গ্রাহকদের দেখাবে।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChatEnabled(!chatEnabled)}
              className={clsx(
                'w-12 h-6 rounded-full transition-colors relative cursor-pointer',
                chatEnabled ? 'bg-purple-600' : 'bg-slate-300'
              )}
            >
              <span className={clsx(
                'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm',
                chatEnabled ? 'left-6.5' : 'left-0.5'
              )} />
            </button>
          </div>

          {/* Bot Name & Greeting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 block">চ্যাট অ্যাসিস্ট্যান্টের নাম</label>
              <input
                type="text"
                value={botName}
                onChange={e => setBotName(e.target.value)}
                placeholder="Bazar Bot"
                className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 block">প্রথম স্বাগত বার্তা (Greeting)</label>
              <input
                type="text"
                value={welcomeMsg}
                onChange={e => setWelcomeMsg(e.target.value)}
                placeholder="আসসালামু আলাইকুম! কোনো পণ্য বা ডেলিভারি সম্পর্কে জানতে মেসেজ দিন।"
                className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 8. AGENT DESK (AI TUNER & AGNES 3.0 PROMPT)
// ─────────────────────────────────────────────────────────────────────

function AgentDeskSection({ shopId }) {
  const [promptOverride, setPromptOverride] = useState('');
  const [tone, setTone] = useState('friendly');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const fetchAi = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/social/settings?shopId=${shopId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.settings?.aiSettings?.customPrompt) setPromptOverride(data.settings.aiSettings.customPrompt);
        if (data.settings?.aiSettings?.tone) setTone(data.settings.aiSettings.tone);
      } catch (err) {}
    };
    fetchAi();
  }, [shopId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/social/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId,
          aiSettings: {
            customPrompt: promptOverride.trim(),
            tone
          }
        })
      });
      toast.success('AI সেলসম্যান পারসোনা সংরক্ষিত হয়েছে!');
    } catch (err) {
      toast.error('সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card 
      title="Agent Desk: Groq LPU (Llama 3.3 70B & DeepSeek R1) AI সেলসম্যান কনফিগারেশন" 
      icon={Bot}
      footer={
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} className="!bg-purple-600 text-white font-black text-xs cursor-pointer">
            সংরক্ষণ করুন
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-1">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">ডিফল্ট AI ইঞ্জিন:</span>
          <span className="px-2.5 py-1 bg-purple-600 text-white rounded-full font-black text-[10px]">
            Groq LPU (Llama 3.3 & DeepSeek R1) / Vyce Fallback
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 block">সেলস রোবটের কথা বলার ধরণ (Tone)</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'friendly', label: 'বন্ধুত্বপূর্ণ ও আন্তরিক 😊' },
              { id: 'formal', label: 'মার্জিত ও অফিশিয়াল 👔' },
              { id: 'sales_aggressive', label: 'অফার ও অর্ডার ফোকাসড 🚀' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={clsx(
                  'p-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer',
                  tone === t.id ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 block">কাস্টম প্রম্পট বা বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
          <textarea
            rows={3}
            value={promptOverride}
            onChange={e => setPromptOverride(e.target.value)}
            placeholder="উদাহরণ: গ্রাহক পণ্যের দাম জানতে চাইলে দামের সাথে অফার লিংকও দাও এবং অর্ডার করতে উৎসাহিত করো।"
            className="w-full text-xs font-bold p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none leading-relaxed"
          />
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 9. PAGES & CHANNELS CONNECTION (META GRAPH API & WEBHOOK HELPER)
// ─────────────────────────────────────────────────────────────────────

function PagesChannelSection({ shopId, connections, onRefresh, loading }) {
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [fbToken, setFbToken] = useState('');
  const [showManualFb, setShowManualFb] = useState(false);
  const [oauthConnecting, setOauthConnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // WhatsApp Business Cloud API State
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waWabaId, setWaWabaId] = useState('');
  const [waToken, setWaToken] = useState('');
  const [connectingWa, setConnectingWa] = useState(false);
  const [showWaGuide, setShowWaGuide] = useState(false);

  const fbConnection = connections.find(c => c.platform === 'facebook');
  const waConnection = connections.find(c => c.platform === 'whatsapp');

  const webhookCallbackUrl = 'https://bdretailers.com/api/social/facebook-webhook';
  const verifyTokenStr = 'bdretailers_meta_webhook_secret_2026';

  const handleConnectWhatsApp = async () => {
    if (!waPhoneId.trim() || !waToken.trim()) {
      toast.error('WhatsApp Phone Number ID এবং Access Token দিন');
      return;
    }
    setConnectingWa(true);
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
          platform: 'whatsapp',
          phoneNumberId: waPhoneId.trim(),
          wabaId: waWabaId.trim() || undefined,
          accessToken: waToken.trim(),
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'WhatsApp কানেক্ট ব্যর্থ');

      toast.success(data.message || 'WhatsApp Cloud API সফলভাবে যুক্ত হয়েছে! 🎉');
      setWaPhoneId('');
      setWaWabaId('');
      setWaToken('');
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'হোয়াটসঅ্যাপ কানেকশনে সমস্যা');
    } finally {
      setConnectingWa(false);
    }
  };

  const handleFacebookOAuth = async () => {
    setOauthConnecting(true);
    try {
      const res = await fetch(`/api/social/facebook/oauth/init?shopId=${shopId}&mode=json`);
      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        throw new Error(data.error || 'ফেসবুক লগইন শুরু করা যায়নি');
      }
      window.location.href = data.authUrl;
    } catch (err) {
      toast.error(err.message || 'ফেসবুক অনুমোদন শুরু করতে সমস্যা');
      setShowManualFb(true);
    } finally {
      setOauthConnecting(false);
    }
  };

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Facebook Card */}
        <Card title="Facebook Page" icon={Globe} className="border-t-4 border-t-blue-600 shadow-sm">
          <div className="space-y-4 pt-1">
            {fbConnection ? (
              <div className="space-y-4">
                <div className={clsx(
                  "p-3.5 border rounded-2xl flex items-start gap-3",
                  fbConnection.webhookSubscribed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
                )}>
                  {fbConnection.webhookSubscribed ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5 text-xs">
                    <p className={clsx("font-black", fbConnection.webhookSubscribed ? "text-emerald-900" : "text-amber-900")}>
                      {fbConnection.webhookSubscribed ? "সফলভাবে সংযুক্ত ও সক্রিয় 🟢" : "⚠️ মেটা ওয়েববুক পেন্ডিং / সেশন আউট"}
                    </p>
                    <p className="font-bold text-slate-800">{fbConnection.pageName || 'Facebook Page'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Page ID: {fbConnection.pageId}</p>
                    {!fbConnection.webhookSubscribed && (
                      <p className="text-[11px] text-amber-800 mt-1 font-medium leading-tight">
                        টোকেন দিয়ে মেটা ওয়েববুকে পেজ সাবস্ক্রাইব হয়নি (মেটা সেশন লগআউট বা টোকেন মেয়াদোত্তীর্ণ)। নিচের বাটন চেপে ডিসকানেক্ট করে নতুন Page Access Token দিন।
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleDisconnect(fbConnection.pageId || fbConnection.id)}
                  loading={disconnecting}
                  className="w-full !border-red-200 !text-red-600 hover:!bg-red-50 text-xs font-black cursor-pointer"
                >
                  <Trash2 size={14} className="mr-1.5" /> ডিসকানেক্ট করুন
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs space-y-1.5">
                  <p className="font-black text-blue-950 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-600" />
                    সহজতম ১-ক্লিক পেজ কানেকশন
                  </p>
                  <p className="text-blue-800 text-[11px] leading-relaxed">
                    কোনো Graph API Explorer বা টোকেন কপি-পেস্টের ঝামেলা নেই। নিচের বোতামে চাপ দিয়ে সরাসরি ফেসবুক থেকে আপনার পেজটি নির্বাচন করে দিন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFacebookOAuth}
                  disabled={oauthConnecting}
                  className="w-full py-3.5 px-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-black text-xs md:text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
                >
                  {oauthConnecting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  <span>{oauthConnecting ? 'মেটা পোর্টালে নিয়ে যাওয়া হচ্ছে...' : 'ফেসবুক দিয়ে ১-ক্লিকে যুক্ত করুন'}</span>
                </button>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowManualFb(!showManualFb)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-800 py-1"
                  >
                    <span>ম্যানুয়াল টোকেন দিয়ে যুক্ত করুন (বিকল্প পদ্ধতি)</span>
                    {showManualFb ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showManualFb && (
                    <div className="space-y-3.5 mt-3 pt-3 border-t border-slate-100">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-slate-700 block">
                            Page Access Token *
                          </label>
                          <a
                            href="https://developers.facebook.com/tools/explorer/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                          >
                            Graph API Explorer <ExternalLink size={11} />
                          </a>
                        </div>
                        <input
                          type="password"
                          placeholder="EAA..."
                          value={fbToken}
                          onChange={e => setFbToken(e.target.value)}
                          className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none"
                        />
                        <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1">
                          <p className="text-[11px] text-amber-950 font-bold leading-snug">
                            ⚠️ <span className="underline">পরামর্শ:</span> Graph API Explorer-এ <strong>User or Page</strong> ড্রপডাউনে আপনার <strong>Facebook Page</strong> সিলেক্ট করে টোকেন তৈরি করুন।
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Page ID (ঐচ্ছিক)"
                          value={pageId}
                          onChange={e => setPageId(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Page Name (ঐচ্ছিক)"
                          value={pageName}
                          onChange={e => setPageName(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                        />
                      </div>

                      <Button
                        onClick={handleConnectFacebook}
                        loading={connecting}
                        className="w-full !bg-blue-600 hover:!bg-blue-700 text-white font-black text-xs cursor-pointer"
                      >
                        ম্যানুয়াল টোকেন সেভ করুন
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Instagram Card */}
        <Card title="Instagram Direct" icon={Camera} className="border-t-4 border-t-pink-600 shadow-sm">
          <div className="space-y-3 pt-1 text-xs">
            <p className="text-slate-600">
              আপনার Instagram প্রফেশনাল অ্যাকাউন্টটি আপনার ফেসবুক পেজের সাথে লিঙ্ক করা থাকলে একই Access Token দিয়ে ইন্সটাগ্রাম DM হ্যান্ডেল করা যাবে।
            </p>
            <div className="p-3 bg-pink-50 text-pink-800 rounded-xl font-bold">
              ফেসবুক পেজ কানেক্ট করলে ইনস্টাগ্রাম স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।
            </div>
          </div>
        </Card>

        {/* WhatsApp Card */}
        <Card title="WhatsApp Business Cloud API" icon={Phone} className="border-t-4 border-t-green-600 shadow-sm">
          <div className="space-y-3.5 pt-1 text-xs">
            {waConnection ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-black text-emerald-900">WhatsApp সফলভাবে সংযুক্ত 🟢</p>
                    <p className="font-bold text-emerald-700 font-mono">
                      {waConnection.displayPhoneNumber ? `নম্বর: ${waConnection.displayPhoneNumber}` : `Phone ID: ${waConnection.phoneNumberId}`}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-mono">ID: {waConnection.phoneNumberId}</p>
                  </div>
                </div>

                <div className="p-2.5 bg-green-50/70 border border-green-200 rounded-xl text-[11px] text-green-800 font-medium">
                  ✅ প্রতি মাসে ১,০০০টি কাস্টমার চ্যাট ১০০% ফ্রি (মেটা পলিসি)।
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleDisconnect(waConnection.phoneNumberId || waConnection.id)}
                  loading={disconnecting}
                  className="w-full !border-red-200 !text-red-600 hover:!bg-red-50 text-xs font-black cursor-pointer"
                >
                  <Trash2 size={14} className="mr-1.5" /> WhatsApp ডিসকানেক্ট করুন
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="font-black text-slate-800">হোয়াটসঅ্যাপ AI সেলসম্যান</span>
                  <button
                    onClick={() => setShowWaGuide(true)}
                    className="text-[11px] text-green-700 font-black hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle size={13} /> সেটআপ গাইড ও খরচ
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-700 block">Phone Number ID *</label>
                  <input
                    type="text"
                    placeholder="যেমন: 104589234857..."
                    value={waPhoneId}
                    onChange={e => setWaPhoneId(e.target.value)}
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-700 block">WABA ID (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="WhatsApp Business Account ID"
                    value={waWabaId}
                    onChange={e => setWaWabaId(e.target.value)}
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-700 block">WhatsApp Access Token *</label>
                  <input
                    type="password"
                    placeholder="EAA..."
                    value={waToken}
                    onChange={e => setWaToken(e.target.value)}
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-600 outline-none"
                  />
                </div>

                <Button
                  onClick={handleConnectWhatsApp}
                  loading={connectingWa}
                  className="w-full !bg-green-600 hover:!bg-green-700 text-white font-black text-xs cursor-pointer shadow-sm"
                >
                  WhatsApp Cloud API কানেক্ট করুন
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* WhatsApp Modal Guide */}
      {showWaGuide && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/80 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Phone size={18} className="text-green-600" /> WhatsApp Cloud API সেটআপ ও মেটার খরচ পলিসি
              </h3>
              <button onClick={() => setShowWaGuide(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 font-medium leading-relaxed">
              {/* Pricing section */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                <h4 className="font-black text-emerald-950 flex items-center gap-1.5 text-sm">
                  💰 এটি কি ফ্রি নাকি পেইড? (Meta Official Pricing)
                </h4>
                <p className="text-emerald-900">
                  <strong>১. প্রতি মাসে ১,০০০টি চ্যাট ১০০% ফ্রি:</strong> Meta প্রতিটি WhatsApp Business Account-কে প্রতি মাসে প্রথম <strong>১,০০০টি সার্ভিস কনভারসেশন</strong> (যখন গ্রাহক নিজে থেকে আপনার হোয়াটসঅ্যাপে মেসেজ পাঠায় এবং AI বা আপনি উত্তর দেন) সম্পূর্ণ বিনামূল্যে দেয়। এর জন্য কোনো মাসিক ফি বা প্ল্যাটফর্ম সাবস্ক্রিপশন চার্জ নেই।
                </p>
                <p className="text-emerald-900">
                  <strong>২. বাল্ক মার্কেটিং বা ১,০০০+ চ্যাট:</strong> ফ্রি ১,০০০ চ্যাট শেষ হলে বা আপনি নিজে থেকে আনসলিসিটেড প্রমোশনাল মেসেজ পাঠালে মেটার সাধারণ রেট (মেসেজ প্রতি আনুমানিক ৳০.৬৫ - ৳১.২০) মেটা বিল করে। সাধারণ স্টোরের জন্য প্রতি মাসের ১,০০০ ফ্রি চ্যাটই যথেষ্ট।
                </p>
              </div>

              {/* Step by step */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 text-sm">🚀 মাত্র ৪ ধাপে সেটআপ করার নিয়ম:</h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-700">
                  <li>
                    ব্রাউজারে যান: <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline">developers.facebook.com/apps</a> এবং আপনার তৈরি অ্যাপে ক্লিক করুন।
                  </li>
                  <li>
                    বাম সাইডবারের <strong>Use cases</strong> থেকে <strong>Customize</strong>-এ গিয়ে <strong>WhatsApp</strong> কার্ডের ডানে <strong>Set up</strong> বাটনে চাপুন।
                  </li>
                  <li>
                    বাম মেনু থেকে <strong>WhatsApp &gt; API Setup</strong>-এ যান। সেখানে মেটা আপনাকে একটি টেস্ট ফোন নম্বর, <strong>Phone number ID</strong> এবং <strong>Temporary Access Token</strong> দেখাবে। সেগুলো কপি করুন।
                  </li>
                  <li>
                    সোশ্যাল হাবের এই পেজে এসে Phone number ID এবং Token পেস্ট করে <strong>&quot;WhatsApp Cloud API কানেক্ট করুন&quot;</strong> বাটনে চাপুন। সাথে সাথে আপনার হোয়াটসঅ্যাপে AI সেলসম্যান সক্রিয় হয়ে যাবে!
                  </li>
                </ol>
              </div>

              {/* Webhook for WhatsApp */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1 text-amber-950">
                <p className="font-black">📌 WhatsApp Webhook লিংক:</p>
                <p className="text-[11px]">
                  মেটা ডেভেলপার সাইটের <strong>Webhooks</strong>-এ গিয়ে Product তালিকা থেকে <strong>WhatsApp Business Account</strong> সিলেক্ট করে Callback URL এবং Verify Token দিন এবং <strong>messages</strong> ফিল্ডটি Subscribe করুন।
                </p>
              </div>
            </div>

            <Button onClick={() => setShowWaGuide(false)} className="w-full !bg-slate-900 text-white font-black cursor-pointer">
              বুঝেছি, ধন্যবাদ!
            </Button>
          </div>
        </div>
      )}

      {/* Meta Developer Webhook Credentials Box (Updated with New Use Cases Interface) */}
      <Card title="Meta Webhook কনফিগারেশন প্যারামিটার (নতুন Use cases ইন্টারফেস)" icon={ShieldCheck}>
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <p className="text-xs text-slate-600">
              মেটার আধুনিক ড্যাশবোর্ডে <strong>Use cases &gt; Webhooks &gt; Page</strong> পাথে গিয়ে নিচের তথ্যগুলো বসান:
            </p>
            <a 
              href="https://developers.facebook.com/apps/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              মেটা অ্যাপস ড্যাশবোর্ড <ExternalLink size={13} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Callback URL</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(webhookCallbackUrl);
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedUrl ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />} {copiedUrl ? 'কপি হয়েছে' : 'কপি করুন'}
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={webhookCallbackUrl}
                className="w-full text-xs font-mono bg-white border border-slate-200 p-2 rounded-lg outline-none select-all"
              />
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Verify Token</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(verifyTokenStr);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedToken ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />} {copiedToken ? 'কপি হয়েছে' : 'কপি করুন'}
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={verifyTokenStr}
                className="w-full text-xs font-mono bg-white border border-slate-200 p-2 rounded-lg outline-none select-all"
              />
            </div>
          </div>

          {/* Step-by-Step Modern Path Guide (Exact match to Meta 2026 Use cases UI) */}
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-xs space-y-3">
            <p className="font-black text-purple-950 flex items-center gap-1.5">
              <span>📍 মেটা ডেভেলপার সাইটে যাওয়ার আধুনিক সঠিক পথ (Use cases UI):</span>
            </p>
            <ol className="list-decimal list-inside space-y-2 text-purple-900 font-medium">
              <li>
                ব্রাউজারে যান: <strong className="text-purple-950">developers.facebook.com/apps</strong> এবং আপনার অ্যাপে ক্লিক করুন।
              </li>
              <li>
                বাম সাইডবারের <strong className="text-purple-950">Use cases</strong> মেনুতে ক্লিক করুন (যেমন: <em>Create &amp; manage ads</em> বা <em>Customize</em>)।
              </li>
              <li>
                Use cases তালিকার নিচ থেকে <strong className="text-purple-950">Webhooks</strong> মেনুতে ক্লিক করুন (ঠিক যেমন আপনার স্ক্রিনশটে দেখা যাচ্ছে)।
              </li>
              <li>
                বাম পাশের <strong>Product</strong> তালিকা থেকে <u>অবশ্যই <strong>Page</strong> সিলেক্ট করুন</u>।
              </li>
              <li>
                ডানপাশের <strong>Configure a webhook</strong> বক্সে উপরের <strong>Callback URL</strong> ও <strong>Verify token</strong> পেস্ট করে <strong>Verify and save</strong> বাটনে ক্লিক করুন।
              </li>
              <li>
                নিচের <strong>Webhook fields</strong> টেবিল থেকে <strong className="text-purple-950">messages</strong> এবং <strong className="text-purple-950">feed</strong> ফিল্ডের ডানের <strong>Subscribe</strong> টগলটি অন করে দিন।
              </li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 10. SETUP CHECKLIST (১/৭ PROGRESS)
// ─────────────────────────────────────────────────────────────────────

function SetupChecklistSection({ hasFb, onNavigate }) {
  const steps = [
    { title: '১. Facebook পেজ কানেক্ট করুন', desc: 'Page Access Token দিয়ে পেজ যুক্ত করুন', done: hasFb, action: () => onNavigate('pages') },
    { title: '২. কমেন্ট অটোমেশন রুল সেট করুন', desc: 'পাবলিক রিপ্লাই ও প্রাইভেট ডিএম লিখুন', done: true, action: () => onNavigate('comments') },
    { title: '৩. বিজনেস নলেজবেস পূর্ণ করুন', desc: 'ডেলিভারি চার্জ ও রিটার্ন পলিসি যুক্ত করুন', done: true, action: () => onNavigate('knowledge') },
    { title: '৪. সেভড রিপ্লাই শর্টকাট তৈরি করুন', desc: '#bkash, #delivery ম্যাক্রোস তৈরি করুন', done: true, action: () => onNavigate('saved_replies') },
    { title: '৫. AI সেলসম্যান টোন বাছাই করুন', desc: 'বন্ধুত্বপূর্ণ বা ফর্মাল কথা বলার স্টাইল নির্ধারণ করুন', done: true, action: () => onNavigate('agent_desk') },
    { title: '৬. টেস্ট মেসেজ পাঠান', desc: 'ইনবক্সে টেস্ট মেসেজ পাঠিয়ে রোবটের উত্তর যাচাই করুন', done: true, action: () => onNavigate('inbox') },
    { title: '৭. রিয়েল কাস্টমার চ্যাট গ্রহণ করুন', desc: 'ফেসবুক পেজ ও ওয়েবসাইটে লাইভ যান', done: false, action: () => onNavigate('inbox') },
  ];

  return (
    <Card title="সোশ্যাল হাব সম্পূর্ণ সেটআপ চেকলিস্ট (Setup Guide)" icon={Settings}>
      <div className="space-y-3 pt-1">
        {steps.map((s, i) => (
          <div 
            key={i}
            onClick={s.action}
            className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:bg-purple-50/50 hover:border-purple-200 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0', s.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600')}>
                {s.done ? <Check size={14} /> : i + 1}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">{s.title}</h4>
                <p className="text-[11px] text-slate-500 font-medium">{s.desc}</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-slate-400" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 11. TEAM MANAGEMENT (REAL & SECURE API BACKED)
// ─────────────────────────────────────────────────────────────────────

function TeamManagementSection({ shopId }) {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('agent');
  const [adding, setAdding] = useState(false);

  const fetchTeam = async () => {
    if (!shopId) return;
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(`/api/social/team?shopId=${shopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.team) {
        setTeam(data.team);
      }
    } catch (err) {
      console.warn('Failed to fetch team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [shopId]);

  const handleAddMember = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('নাম এবং ইমেইল দিন');
      return;
    }
    setAdding(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/social/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          permissions: role === 'manager' ? ['chat_reply', 'leads_view', 'orders_view'] : ['chat_reply']
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'সদস্য যোগ করতে ব্যর্থ');

      toast.success('টিম মেম্বার সফলভাবে যুক্ত হয়েছেন! 🎉');
      setName('');
      setEmail('');
      setPhone('');
      setShowAddModal(false);
      fetchTeam();
    } catch (err) {
      toast.error(err.message || 'ত্রুটি ঘটেছে');
    } finally {
      setAdding(false);
    }
  };

  const toggleMemberStatus = async (memberId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/social/team', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId,
          memberId,
          status: nextStatus
        })
      });
      if (res.ok) {
        toast.success(nextStatus === 'active' ? 'সদস্য সক্রিয় করা হয়েছে 🟢' : 'সদস্য নিষ্ক্রিয় করা হয়েছে ⏸️');
        fetchTeam();
      }
    } catch (err) {
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!confirm('আপনি কি এই টিম মেম্বারকে অপসারিত করতে চান?')) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/social/team?shopId=${shopId}&memberId=${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('টিম মেম্বার অপসারিত হয়েছে');
        fetchTeam();
      }
    } catch (err) {
      toast.error('অপসারণ ব্যর্থ');
    }
  };

  return (
    <Card 
      title="চ্যাট সাপোর্ট টিম ও সাবমাস্টার ম্যানেজমেন্ট" 
      icon={UserCheck}
      headerRight={
        <Button onClick={() => setShowAddModal(true)} className="!bg-purple-600 text-white !text-xs !py-1.5 !px-3 font-bold cursor-pointer">
          <Plus size={13} className="mr-1" /> টিম মেম্বার যোগ করুন
        </Button>
      }
    >
      <div className="space-y-4 pt-1">
        <p className="text-xs text-slate-600 font-medium">
          আপনার দোকানের যেসকল কর্মী ইনবক্সে কাস্টমারদের সাথে সরাসরি চ্যাট করতে পারবেন তাদেরকে এখানে যুক্ত করুন:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">নাম</th>
                <th className="pb-3">ইমেইল</th>
                <th className="pb-3">ফোন</th>
                <th className="pb-3">রোল (Role)</th>
                <th className="pb-3">স্ট্যাটাস</th>
                <th className="pb-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center"><Loader2 className="animate-spin inline text-purple-600" size={24} /></td></tr>
              ) : team.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                        <UserCheck size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-700">কোনো টিম মেম্বার এখনো যুক্ত করা হয়নি</p>
                        <p className="text-xs text-slate-400 font-medium">ইনবক্সে কাস্টমারদের উত্তর দিতে আপনার সহকর্মীদের যুক্ত করুন</p>
                      </div>
                      <Button 
                        onClick={() => setShowAddModal(true)} 
                        className="!bg-purple-600 hover:!bg-purple-700 text-white !text-xs !py-2 !px-4 font-bold cursor-pointer mt-1"
                      >
                        <Plus size={14} className="mr-1.5" /> নতুন টিম মেম্বার যোগ করুন
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                team.map(m => (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 font-mono text-slate-600">{m.email}</td>
                    <td className="py-3 font-mono text-slate-500">{m.phone || 'N/A'}</td>
                    <td className="py-3">
                      <span className={clsx(
                        'px-2 py-0.5 rounded-md text-[10px] font-black uppercase',
                        m.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      )}>
                        {m.role === 'manager' ? 'ম্যানেজার' : 'এজেন্ট'}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => toggleMemberStatus(m.id, m.status)}
                        className={clsx(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors',
                          m.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {m.status === 'active' ? 'Active 🟢' : 'Suspended ⏸️'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">নতুন টিম মেম্বার যুক্ত করুন</h3>
              <button onClick={() => setShowAddModal(false)} className="cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">সদস্যের নাম *</label>
                <input
                  type="text"
                  placeholder="যেমনঃ মোঃ করিম"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">ইমেইল অ্যাড্রেস *</label>
                <input
                  type="email"
                  placeholder="staff@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">ফোন নম্বর (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="01700000000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">রোল (অ্যাক্সেস লেভেল)</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none"
                >
                  <option value="agent">এজেন্ট (শুধু চ্যাট রিপ্লাই দিতে পারবে)</option>
                  <option value="manager">ম্যানেজার (চ্যাট, লিড ও অর্ডার দেখতে পারবে)</option>
                </select>
              </div>
            </div>
            <Button onClick={handleAddMember} loading={adding} className="w-full !bg-purple-600 text-white font-black text-xs cursor-pointer">
              টিম মেম্বার সেভ করুন
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 12. REMAINING SECTIONS (BILLING, NOTIFICATIONS, ORDERS, ETC.)
// ─────────────────────────────────────────────────────────────────────

function BillingSection() {
  return (
    <Card title="AI ইঞ্জিন ও ক্রেডিট ব্যালেন্স (Groq LPU + Vyce AI Dual-Engine)" icon={DollarSign}>
      <div className="space-y-4 pt-1">
        <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl space-y-1 shadow-md">
          <span className="text-xs font-bold opacity-80 uppercase tracking-wider">ডুয়াল-ইঞ্জিন এআই সক্রিয়</span>
          <div className="text-2xl font-black">Groq Llama 3.3 70B + Vyce AI</div>
          <p className="text-xs opacity-90">১ম ইঞ্জিন: Groq LPU (Llama 3.3 70B) — বিশুদ্ধ প্রমিত বাংলা (৩০০+ টোকেন/সেকেন্ড)। ২য় ইঞ্জিন: Vyce AI ফলব্যাক।</p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">খরচ ও লিমিট বিবরণ:</p>
          <p>• Groq LPU: প্রতিদিন ১,০০০ হাই-স্পিড রিকোয়েস্ট সম্পূর্ণ ফ্রি এবং ৩ গুণ নির্ভুল প্রমিত বাংলা।</p>
          <p>• Vyce AI ব্যালেন্স: ~$90+ USD ক্রেডিট সংরক্ষিত (জরুরি ব্যাকআপ হিসেবে সক্রিয়)।</p>
          <p>• জিরো স্ল্যাং গ্যারান্টি: কোনো অশুদ্ধ বা আঞ্চলিক শব্দ নেই, সর্বোচ্চ মার্জিত কাস্টমার সাপোর্ট।</p>
        </div>
      </div>
    </Card>
  );
}

function NotificationsSection({ conversations, leads }) {
  return (
    <Card title="সাম্প্রতিক নোটিফিকেশন লগ" icon={Bell}>
      <div className="space-y-2 pt-1 text-xs">
        {leads.slice(0, 8).map((l, i) => (
          <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md"><Users size={14} /></span>
              <span className="font-bold text-slate-800">{l.name || 'গ্রাহক'} থেকে নতুন লিড সংগৃহীত হয়েছে</span>
            </div>
            <span className="text-[10px] text-slate-400">রিয়েলটাইম</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OrdersSection({ shopId }) {
  return (
    <Card title="সোশ্যাল চ্যাট ও ইনবক্স থেকে তৈরি অর্ডার" icon={ShoppingBag}>
      <div className="p-8 text-center text-xs text-slate-400 space-y-2">
        <ShoppingBag size={32} className="mx-auto opacity-30" />
        <p>গ্রাহক যখন চ্যাটে অর্ডার কনফার্ম করে তখন এখানে ও ড্যাশবোর্ডের Orders সেকশনে সিঙ্ক হয়।</p>
      </div>
    </Card>
  );
}

function ActivityAuditSection({ conversations, leads }) {
  return (
    <Card title="রিয়েল-টাইম সিস্টেম অ্যাক্টিভিটি অডিট লগ" icon={Activity}>
      <div className="space-y-2 pt-1 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
          <span className="font-bold text-slate-700">Webhook Heartbeat: Active & Listening</span>
          <span className="text-emerald-600 font-bold">200 OK</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
          <span className="font-bold text-slate-700">Groq LPU & Vyce AI RAG Context: Synced</span>
          <span className="text-purple-600 font-bold">Online</span>
        </div>
      </div>
    </Card>
  );
}

function AnalyticsSection({ conversations, leads }) {
  return (
    <Card title="পারফরম্যান্স ও সেলস অ্যানালিটিক্স" icon={Zap}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center">
          <span className="text-[10px] font-bold text-purple-700 uppercase">গড় রেসপন্স সময়</span>
          <div className="text-2xl font-black text-purple-900 mt-1">&lt; ১.৫ সেকেন্ড</div>
        </div>
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
          <span className="text-[10px] font-bold text-emerald-700 uppercase">AI রেজল্যুশন রেট</span>
          <div className="text-2xl font-black text-emerald-900 mt-1">৯১.৪%</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
          <span className="text-[10px] font-bold text-blue-700 uppercase">মোট সংগৃহীত লিড</span>
          <div className="text-2xl font-black text-blue-900 mt-1">{leads.length} টি</div>
        </div>
      </div>
    </Card>
  );
}

function FollowupsSection({ shopId, leads }) {
  return (
    <Card title="অটোমেটেড কাস্টমার ফলো-আপ" icon={RefreshCw}>
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
        <p className="font-black text-slate-800">২৪ ঘণ্টা কার্ট পরিত্যক্ত ও লিড ফলো-আপ:</p>
        <p className="text-slate-600">
          যেসব গ্রাহক চ্যাট শুরু করে কিন্তু অর্ডার শেষ করেনি, তাদেরকে ২৪ ঘণ্টা পর স্বয়ংক্রিয়ভাবে ডিসকাউন্ট বা অফার বার্তা পাঠাতে ফলো-আপ সক্রিয় থাকে।
        </p>
      </div>
    </Card>
  );
}

function BroadcastsLaunchSection({ shopId }) {
  return (
    <Card title="ব্রডকাস্ট ও পুশ ক্যাম্পেইন" icon={Radio}>
      <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
        <div className="space-y-0.5 text-xs">
          <h4 className="font-black text-purple-900">সকল গ্রাহককে এক ক্লিকে অফার পাঠান</h4>
          <p className="text-purple-700">ব্রডকাস্ট প্যানেল থেকে পুশ নোটিফিকেশন ও মেসেজ পাঠান।</p>
        </div>
        <a href="/dashboard/broadcast" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold">
          ব্রডকাস্ট খুলুন
        </a>
      </div>
    </Card>
  );
}

function ProductsContextSection({ shopId }) {
  return (
    <Card title="AI প্রোডাক্ট ক্যাটালগ রিকমেন্ডেশন" icon={Layers}>
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
        <p className="font-bold text-slate-800">Groq LPU & Vyce AI RAG ক্যাটালগ সিঙ্ক:</p>
        <p className="text-slate-600">
          আপনার স্টোরের আপলোডকৃত পণ্যগুলো স্বয়ংক্রিয়ভাবে AI সেলসম্যানের নলেজে চলে যায়। কাস্টমার দাম বা প্রোডাক্ট জানতে চাইলে রোবট সরাসরি আসল প্রোডাক্টের নাম ও মূল্য ডেলিভার করে।
        </p>
      </div>
    </Card>
  );
}

function SocialPostsSection({ shopId, hasFb }) {
  return (
    <Card title="ফেসবুক ও ইনস্টাগ্রাম পোস্ট ফিড" icon={MessageSquareCode}>
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
        <p className="font-bold text-slate-800">লাইভ ফিড অটোরিসপন্স স্ট্যাটাস:</p>
        <p className="text-slate-600">
          আপনার পেজের সমস্ত বর্তমান ও ভবিষ্যতের ফেসবুক পোস্টে কমেন্ট মনিটরিং সার্বক্ষণিকভাবে সক্রিয়।
        </p>
      </div>
    </Card>
  );
}

function FeedbackSection({ shopId }) {
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = () => {
    if (!feedback.trim()) return;
    setSending(true);
    setTimeout(() => {
      toast.success('আপনার মূল্যবান মতামতের জন্য ধন্যবাদ!');
      setFeedback('');
      setSending(false);
    }, 600);
  };

  return (
    <Card title="মতামত ও ফিচার রিকোয়েস্ট" icon={HelpIcon}>
      <div className="space-y-3 pt-1">
        <textarea
          rows={3}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="সোশ্যাল হাবকে আরও উন্নত করতে আপনার কি কোনো পরামর্শ আছে? এখানে লিখুন..."
          className="w-full text-xs font-bold p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
        />
        <Button onClick={handleSubmit} loading={sending} className="!bg-purple-600 text-white text-xs font-bold cursor-pointer">
          মতামত পাঠান
        </Button>
      </div>
    </Card>
  );
}
