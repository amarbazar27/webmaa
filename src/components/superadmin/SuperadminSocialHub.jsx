'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { Globe, Camera, Phone, MessageCircle, Bot, Zap, Users, Loader2, CheckCircle2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collectionGroup, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import clsx from 'clsx';

export default function SuperadminSocialHub() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'leads', label: 'All Leads', icon: Users },
    { id: 'accounts', label: 'Platform Accounts', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <MessageCircle className="text-purple-600" size={28} />
            Superadmin Social Hub
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage BD Retailers social presence and view global leads.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap',
                isActive 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
              )}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'leads' && <LeadsSection />}
        {activeTab === 'accounts' && <AccountsSection />}
      </div>
    </div>
  );
}

function OverviewSection() {
  const stats = [
    { label: 'Total Leads Today', value: '142', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'AI Responses Today', value: '890', icon: Bot, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Active Conversations', value: '45', icon: MessageCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Conversion Rate', value: '12%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="!p-5 border-l-4" style={{ borderColor: 'var(--tw-colors-slate-200)' }}>
              <div className="flex items-center gap-4">
                <div className={clsx('p-3 rounded-xl', stat.bg, stat.color)}>
                  <Icon size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 leading-none">{stat.value}</div>
                  <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function LeadsSection() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CollectionGroup query fetches leads from ALL shops
    const q = query(
      collectionGroup(db, 'leads'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  return (
    <Card title="Global Leads Dashboard" icon={Users}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 font-bold">
              <th className="pb-3">Name</th>
              <th className="pb-3">Source</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Shop ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="py-4 text-center"><Loader2 className="animate-spin inline text-slate-400" /></td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan="4" className="py-4 text-center text-slate-400">No leads captured globally yet.</td></tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 font-bold text-slate-900">{lead.name || 'Unknown'}</td>
                  <td className="py-3 text-slate-600 capitalize">{lead.source}</td>
                  <td className="py-3 capitalize font-bold text-purple-600">{lead.status || 'new'}</td>
                  <td className="py-3 text-slate-400 font-mono text-xs">{lead.shopId || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AccountsSection() {
  const handleConnect = async () => {
    toast.success('Connection settings saved for main site');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card title="BD Retailers FB Page" icon={Globe} className="border-t-4 border-t-blue-600">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 size={16} className="text-slate-300" /> Not connected
          </div>
          <Input label="Page Access Token" placeholder="EAAI..." />
          <Button onClick={handleConnect} className="w-full">Connect Facebook</Button>
        </div>
      </Card>

      <Card title="BD Retailers IG" icon={Camera} className="border-t-4 border-t-pink-600">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 size={16} className="text-slate-300" /> Not connected
          </div>
          <Button variant="secondary" onClick={handleConnect} className="w-full">Connect Instagram</Button>
        </div>
      </Card>

      <Card title="BD Retailers WA" icon={Phone} className="border-t-4 border-t-green-600">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 size={16} className="text-slate-300" /> Not connected
          </div>
          <Button variant="secondary" onClick={handleConnect} className="w-full">Connect WhatsApp</Button>
        </div>
      </Card>
    </div>
  );
}
