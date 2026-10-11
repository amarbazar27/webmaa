'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { 
  Globe, Camera, Phone, MessageCircle, Bot, Zap, Users, Loader2, 
  CheckCircle2, TrendingUp, Download, ShieldCheck, Trash2, ExternalLink,
  Sparkles, Layers, Sliders, LayoutDashboard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/auth';
import { collection, collectionGroup, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import clsx from 'clsx';
import SocialHubPanel from '@/components/dashboard/SocialHubPanel';

export default function SuperadminSocialHub() {
  // Mode switcher: Main Platform vs All Shops Overview
  const [viewMode, setViewMode] = useState('main_platform'); // 'main_platform' | 'platform_overview'
  const [leads, setLeads] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShopFilter, setSelectedShopFilter] = useState('all');

  useEffect(() => {
    // 1. Live stream leads across all shops
    const qLeads = query(
      collectionGroup(db, 'leads'),
      orderBy('createdAt', 'desc'),
      limit(250)
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
    const qConn = query(collection(db, 'social_connections'), limit(150));
    const unsubConn = onSnapshot(qConn, (snap) => {
      setConnections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    return () => {
      unsubLeads();
      unsubConv();
      unsubConn();
    };
  }, []);

  const filteredLeads = selectedShopFilter === 'all' 
    ? leads 
    : leads.filter(l => l.shopId === selectedShopFilter);

  const uniqueShops = Array.from(new Set(leads.map(l => l.shopId).filter(Boolean)));

  const exportAllLeadsCsv = () => {
    if (leads.length === 0) {
      toast.error('কোনো লিড নেই');
      return;
    }
    const headers = ['Name,Phone,Source,Status,ShopId,Date\n'];
    const rows = filteredLeads.map(l => {
      const d = l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toISOString() : '';
      return `"${l.name || 'Unknown'}","${l.phone || ''}","${l.source || ''}","${l.status || 'new'}","${l.shopId || ''}","${d}"\n`;
    });
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bdretailers-all-leads-${Date.now()}.csv`;
    a.click();
    toast.success('প্ল্যাটফর্মের সকল লিড CSV ডাউনলোড সম্পন্ন!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header & Mode Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <MessageCircle className="text-purple-600" size={28} />
            সুপারএডমিন সোশ্যাল কন্ট্রোল হাব
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            প্রধান bdretailers.com ওয়েবসাইট ও সমগ্র প্ল্যাটফর্মের সমস্ত রিটেইলার শপের সোশ্যাল সেলস ও অটোমেশন কেন্দ্র।
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('main_platform')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer',
              viewMode === 'main_platform'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            )}
          >
            <Globe size={15} />
            <span>bdretailers.com (মেইন সাইট)</span>
          </button>

          <button
            onClick={() => setViewMode('platform_overview')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer',
              viewMode === 'platform_overview'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            )}
          >
            <Layers size={15} />
            <span>সকল শপ ও গ্লোবাল লিড ({leads.length})</span>
          </button>
        </div>
      </div>

      {/* ── Mode 1: Main Platform bdretailers.com Full AiPraktor Control Plane ── */}
      {viewMode === 'main_platform' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <Sparkles size={16} className="text-purple-600" />
              <span>আপনি এখন প্রধান bdretailers.com ওয়েবসাইটের সোশ্যাল হাব কন্ট্রোল করছেন (Shop ID: &quot;main&quot;)</span>
            </div>
            <span className="text-[10px] bg-purple-200 text-purple-800 font-black px-2 py-0.5 rounded-md uppercase">
              SUPERADMIN MODE
            </span>
          </div>

          <SocialHubPanel shopId="main" />
        </div>
      )}

      {/* ── Mode 2: Multi-Tenant Platform-Wide Aggregation ── */}
      {viewMode === 'platform_overview' && (
        <div className="space-y-6">
          {/* Top Aggregation KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="!p-4 border-l-4 border-l-blue-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users size={20} />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{leads.length}</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">মোট সংগৃহীত লিড</div>
                </div>
              </div>
            </Card>

            <Card className="!p-4 border-l-4 border-l-purple-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{conversations.length}</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">মোট সক্রিয় চ্যাট</div>
                </div>
              </div>
            </Card>

            <Card className="!p-4 border-l-4 border-l-emerald-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{connections.length}</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">সংযুক্ত পেজ ও চ্যানেল</div>
                </div>
              </div>
            </Card>

            <Card className="!p-4 border-l-4 border-l-amber-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Bot size={20} />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">Agnes 3.0</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Vyce AI Flash Engine</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Global Leads Table with Shop Filter */}
          <Card 
            title="প্ল্যাটফর্ম-ওয়াইড কাস্টমার লিড সেন্ট্রাল ডেটাবেজ" 
            icon={Users}
            headerRight={
              <div className="flex items-center gap-2">
                {uniqueShops.length > 0 && (
                  <select
                    value={selectedShopFilter}
                    onChange={e => setSelectedShopFilter(e.target.value)}
                    className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-white outline-none cursor-pointer"
                  >
                    <option value="all">সকল শপ ({leads.length})</option>
                    {uniqueShops.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
                <Button variant="outline" onClick={exportAllLeadsCsv} className="!text-xs font-bold !py-1.5 !px-3">
                  <Download size={13} className="mr-1" /> CSV এক্সপোর্ট
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
                    <th className="pb-3">শপ আইডি</th>
                    <th className="pb-3">তারিখ</th>
                    <th className="pb-3 text-right">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="py-8 text-center"><Loader2 className="animate-spin inline text-purple-600" size={24} /></td></tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr><td colSpan="6" className="py-12 text-center text-slate-400">কোনো লিড পাওয়া যায়নি।</td></tr>
                  ) : (
                    filteredLeads.map(lead => (
                      <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-slate-900">{lead.name || 'অপরিচিত'}</td>
                        <td className="py-3 capitalize text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold">
                            {lead.source || 'social'}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-600">{lead.phone || lead.fbId || 'N/A'}</td>
                        <td className="py-3 font-mono font-bold text-purple-700">{lead.shopId || 'global'}</td>
                        <td className="py-3 text-slate-400 text-[10px]">
                          {lead.createdAt?.seconds 
                            ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) 
                            : 'আজ'}
                        </td>
                        <td className="py-3 text-right">
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

          {/* Connected Pages Table across platform */}
          <Card title={`সংযুক্ত সমস্ত ফেসবুক পেজের তালিকা (${connections.length})`} icon={ShieldCheck}>
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">পেজের নাম</th>
                    <th className="pb-3">শপ আইডি</th>
                    <th className="pb-3">Page ID</th>
                    <th className="pb-3">Webhook স্ট্যাটাস</th>
                    <th className="pb-3 text-right">কানেকশন তারিখ</th>
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
      )}
    </div>
  );
}
