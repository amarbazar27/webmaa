'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { 
  Globe, Camera, Phone, MessageCircle, Bot, Zap, Users, Loader2, 
  CheckCircle2, TrendingUp, Download, ShieldCheck, Trash2, ExternalLink 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/auth';
import { collection, collectionGroup, query, orderBy, limit, onSnapshot, doc, getDocs } from 'firebase/firestore';
import clsx from 'clsx';

export default function SuperadminSocialHub() {
  const [activeTab, setActiveTab] = useState('overview');
  const [leads, setLeads] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Live stream leads across all shops
    const qLeads = query(
      collectionGroup(db, 'leads'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const unsubLeads = onSnapshot(qLeads, (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.warn('Superadmin leads stream error:', err);
      setLoading(false);
    });

    // 2. Live stream conversations across all shops
    const qConv = query(
      collectionGroup(db, 'conversations'),
      orderBy('lastMessageAt', 'desc'),
      limit(100)
    );
    const unsubConv = onSnapshot(qConv, (snap) => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    // 3. Live stream all connected social accounts
    const qConn = query(collection(db, 'social_connections'), limit(100));
    const unsubConn = onSnapshot(qConn, (snap) => {
      setConnections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    return () => {
      unsubLeads();
      unsubConv();
      unsubConn();
    };
  }, []);

  const tabs = [
    { id: 'overview', label: 'সারসংক্ষেপ (Overview)', icon: TrendingUp },
    { id: 'leads', label: `সকল সংগৃহীত লিড (${leads.length})`, icon: Users },
    { id: 'accounts', label: `সংযুক্ত শপ অ্যাকাউন্টস (${connections.length})`, icon: Globe },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <MessageCircle className="text-purple-600" size={28} />
            সুপারএডমিন সোশ্যাল কন্ট্রোল হাব
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            পুরো প্ল্যাটফর্মের সমস্ত রিটেইলার শপ ও বিডি রিটেইলার্স মেইন সাইটের সোশ্যাল মিডিয়া কার্যক্রম ও লিড তদারকি।
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar border-b border-slate-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer',
                isActive 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'
              )}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewSection 
            leadsCount={leads.length} 
            conversationsCount={conversations.length} 
            connectionsCount={connections.length} 
          />
        )}
        {activeTab === 'leads' && <LeadsSection leads={leads} loading={loading} />}
        {activeTab === 'accounts' && <AccountsSection connections={connections} />}
      </div>
    </div>
  );
}

function OverviewSection({ leadsCount, conversationsCount, connectionsCount }) {
  const stats = [
    { label: 'মোট সংগৃহীত লিড', value: leadsCount.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'সক্রিয় কথোপকথন', value: conversationsCount.toString(), icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'সংযুক্ত পেজ ও চ্যানেল', value: connectionsCount.toString(), icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'AI মডেল স্ট্যাটাস', value: 'Agnes 3.0', icon: Bot, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="!p-5 border-l-4 border-l-purple-500 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={clsx('p-3 rounded-2xl', stat.bg, stat.color)}>
                  <Icon size={22} />
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

      <Card title="সোশ্যাল মিডিয়া সেলস ইঞ্জিন স্ট্যাটাস" icon={Zap}>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
          <p className="font-bold flex items-center gap-2 text-slate-900">
            <ShieldCheck size={16} className="text-emerald-600" /> Meta Graph API Webhook & Vyce AI RAG ইঞ্জিন সক্রিয়
          </p>
          <p className="leading-relaxed text-slate-600">
            গ্রাহক যেকোনো সংযুক্ত ফেসবুক পেজে কমেন্ট বা ইনবক্স করলে Agnes 3.0 Flash মডেলের মাধ্যমে স্বয়ংক্রিয়ভাবে রিয়েল-টাইম রিপ্লাই তৈরি হচ্ছে এবং ক্যাটালগ প্রোডাক্ট লিংক ডেলিভার করা হচ্ছে।
          </p>
        </div>
      </Card>
    </div>
  );
}

function LeadsSection({ leads, loading }) {
  const exportCsv = () => {
    if (leads.length === 0) {
      toast.error('কোনো লিড নেই');
      return;
    }
    const headers = ['Name,Phone,Source,Status,ShopId,Date\n'];
    const rows = leads.map(l => {
      const d = l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toISOString() : '';
      return `"${l.name || 'Unknown'}","${l.phone || ''}","${l.source || ''}","${l.status || 'new'}","${l.shopId || ''}","${d}"\n`;
    });
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `global-leads-${Date.now()}.csv`;
    a.click();
    toast.success('গ্লোবাল লিড CSV ডাউনলোড সম্পন্ন');
  };

  return (
    <Card 
      title="গ্লোবাল কাস্টমার লিড ডেটাবেজ" 
      icon={Users}
      headerRight={
        <Button variant="outline" onClick={exportCsv} className="!text-xs font-bold !py-1.5 !px-3">
          <Download size={13} className="mr-1" /> CSV এক্সপোর্ট
        </Button>
      }
    >
      <div className="overflow-x-auto pt-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-3">গ্রাহকের নাম</th>
              <th className="pb-3">উৎস</th>
              <th className="pb-3">ফোন / ফেসবুক আইডি</th>
              <th className="pb-3">শপ আইডি</th>
              <th className="pb-3">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="py-8 text-center"><Loader2 className="animate-spin inline text-purple-600" size={24} /></td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan="5" className="py-12 text-center text-slate-400">কোনো লিড পাওয়া যায়নি।</td></tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 font-bold text-slate-900">{lead.name || 'অপরিচিত'}</td>
                  <td className="py-3 capitalize text-slate-600">{lead.source || 'social'}</td>
                  <td className="py-3 font-mono text-slate-600">{lead.phone || lead.fbId || 'N/A'}</td>
                  <td className="py-3 text-purple-700 font-mono font-bold">{lead.shopId || 'global'}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 capitalize">
                      {lead.status || 'new'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AccountsSection({ connections }) {
  const [mainFbToken, setMainFbToken] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleConnectMain = async () => {
    if (!mainFbToken.trim()) {
      toast.error('Page Access Token দিন');
      return;
    }
    setConnecting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/social/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId: 'main',
          pageName: 'BD Retailers Official',
          pageAccessToken: mainFbToken.trim(),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ব্যর্থ');
      toast.success('বিডি রিটেইলার্স ফেসবুক পেজ কানেক্ট হয়েছে! 🎉');
      setMainFbToken('');
    } catch (err) {
      toast.error(err.message || 'কানেকশন ব্যর্থ');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Website Connection Box */}
      <Card title="বিডি রিটেইলার্স মেইন ফেসবুক পেজ ইন্টিগ্রেশন" icon={Globe} className="border-t-4 border-t-purple-600">
        <div className="space-y-3.5 max-w-xl">
          <p className="text-xs text-slate-600 font-medium">
            প্রধান bdretailers.com ফেসবুক পেজের মেসেজ ও কমেন্ট স্বয়ংক্রিয়ভাবে সুপারএডমিন থেকে হ্যান্ডেল করতে টোকেন দিন:
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Page Access Token (EAAI...)"
              value={mainFbToken}
              onChange={e => setMainFbToken(e.target.value)}
              className="flex-1 text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
            <Button onClick={handleConnectMain} loading={connecting} className="!bg-purple-600 text-white text-xs font-bold shrink-0">
              কানেক্ট করুন
            </Button>
          </div>
        </div>
      </Card>

      {/* List of all connected shops */}
      <Card title={`সংযুক্ত সমস্ত শপের ফেসবুক পেজ তালিকা (${connections.length})`} icon={ShieldCheck}>
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">পেজের নাম</th>
                <th className="pb-3">শপ আইডি</th>
                <th className="pb-3">Page ID</th>
                <th className="pb-3">ওয়েবহুক স্ট্যাটাস</th>
                <th className="pb-3 text-right">কানেক্টেড সময়</th>
              </tr>
            </thead>
            <tbody>
              {connections.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-400">কোনো শপ এখনো ফেসবুক কানেক্ট করেনি।</td></tr>
              ) : (
                connections.map(c => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-900">{c.pageName || 'Facebook Page'}</td>
                    <td className="py-3 font-mono text-purple-700 font-bold">{c.shopId}</td>
                    <td className="py-3 font-mono text-slate-500">{c.pageId || c.id}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                        Active
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400 text-[10px]">
                      {c.connectedAt ? new Date(c.connectedAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) : 'আজ'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
