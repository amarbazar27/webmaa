'use client';

import { useEffect, useState } from 'react';
import {
  getRetailerInvites, addRetailerInvite, removeRetailerInvite, getAllShops,
  getRetailerRequests, approveRetailerRequest, denyRetailerRequest,
  getGlobalConfig, updateGlobalConfig
} from '@/lib/firestore';
import {
  UserPlus, Mail, Trash2, Crown, Store, Activity, ShieldCheck, Search,
  Phone, CheckCircle, XCircle, Clock, ArrowUpRight, Users, Loader2, Sparkles, Key
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { logoutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SuperAdminPage() {
  const [invites, setInvites] = useState([]);
  const [shops, setShops] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  
  const [globalApiKey, setGlobalApiKey] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  
  const router = useRouter();

  const loadData = async () => {
    setLoading(true);
    try {
      const [invitesData, shopsData, requestsData, configData] = await Promise.all([
        getRetailerInvites(),
        getAllShops(),
        getRetailerRequests(),
        getGlobalConfig()
      ]);
      setInvites(invitesData);
      setShops(shopsData);
      setRequests(requestsData);
      setGlobalApiKey(configData?.geminiApiKey || '');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setInviting(true);
    try {
      await addRetailerInvite(newEmail);
      toast.success(`Access granted to ${newEmail}!`);
      setNewEmail('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Invitation failed');
    }
    setInviting(false);
  };

  const handleRemoveInvite = async (inviteId, email) => {
    if (!confirm(`Revoke access for ${email}?`)) return;
    try {
      await removeRetailerInvite(inviteId);
      toast.success(`Access revoked for ${email}`);
      loadData();
    } catch (err) {
      toast.error('Failed to revoke access');
    }
  };

  const handleApprove = async (req) => {
    setProcessingId(req.id);
    try {
      await approveRetailerRequest(req.id, req.email);
      toast.success(`Approved: ${req.email} is now a retailer!`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Approval failed');
    }
    setProcessingId(null);
  };

  const handleDeny = async (req) => {
    setProcessingId(req.id);
    try {
      await denyRetailerRequest(req.id);
      toast.success(`Request from ${req.email} denied.`);
      loadData();
    } catch (err) {
      toast.error('Denial failed');
    }
    setProcessingId(null);
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await updateGlobalConfig({ geminiApiKey: globalApiKey });
      toast.success('Global AI Configuration updated!');
    } catch (err) {
      toast.error('Failed to update global config');
    }
    setSavingConfig(false);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-8 animate-slide-in pb-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Control</h1>
        <p className="text-sm text-slate-500 font-medium">Manage retailers, review requests, and monitor the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title={invites.length} subtitle="Authorized Retailers" icon={Crown} className="border-l-4 border-l-purple-500" />
        <Card title={shops.length} subtitle="Live Stores" icon={Store} className="border-l-4 border-l-blue-500" />
        <Card title={pendingRequests.length} subtitle="Pending Requests" icon={Clock} className="border-l-4 border-l-amber-500" />
        <Card title="Healthy" subtitle="System Engine" icon={Activity} className="border-l-4 border-l-green-500" />
      </div>

      {/* 🚀 Platform AI Intelligence (Global Settings) */}
      <Card title="Platform Intelligence" subtitle="Manage global AI nodes and API keys" icon={Sparkles} className="border-2 border-purple-100 bg-purple-50/20">
        <form onSubmit={handleUpdateConfig} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
           <div className="md:col-span-10">
              <Input
                label="Global Gemini API Key"
                placeholder="AIzaSy..."
                type="password"
                value={globalApiKey}
                onChange={e => setGlobalApiKey(e.target.value)}
                icon={Key}
              />
              <p className="text-[10px] text-slate-400 font-bold mt-2 px-1 uppercase tracking-wider">
                This key is used as a fallback if a retailer does not provide their own Gemini API key.
              </p>
           </div>
           <div className="md:col-span-2">
              <Button type="submit" loading={savingConfig} className="w-full bg-slate-900 border-b-4 border-slate-950 hover:bg-black py-4">
                Update
              </Button>
           </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Pending Retailer Requests Section */}
        <div className="lg:col-span-12">
          <Card
            title="Pending Retailer Requests"
            subtitle="Users requesting seller access from the demo store"
            icon={Users}
            className="border-2 border-amber-100 bg-amber-50/20"
          >
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="animate-spin mx-auto mb-3 text-slate-400" size={24} />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading requests...</p>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <CheckCircle size={40} className="mx-auto mb-4 text-emerald-400" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-white border-2 border-amber-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-200 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                      {req.photoURL ? (
                        <img src={req.photoURL} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm" alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-lg">
                          {req.name?.[0] || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-slate-900">{req.name}</p>
                        <p className="text-xs text-slate-500 font-bold">{req.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone size={12} className="text-emerald-600" />
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{req.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={processingId === req.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {processingId === req.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />} Approve
                      </button>
                      <button
                        onClick={() => handleDeny(req)}
                        disabled={processingId === req.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-colors border border-red-100 disabled:opacity-50"
                      >
                        <XCircle size={14} /> Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Processed requests history */}
            {processedRequests.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Processed History</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {processedRequests.map((req) => (
                    <div key={req.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs shrink-0">
                          {req.name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-600 truncate">{req.email}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{req.phone}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md ${
                        req.status === 'approved' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'
                      }`}>
                        {req.status === 'approved' ? 'Approved' : 'Denied'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Invitation Area */}
        <div className="lg:col-span-12">
          <Card
            title="Retailer Management"
            subtitle="Manually invite partners via email"
            icon={UserPlus}
          >
            <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="retailer.email@gmail.com"
                icon={Mail}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                loading={inviting}
                icon={UserPlus}
                className="md:w-56 h-[52px]"
              >
                Invite Retailer
              </Button>
            </form>

            <div className="mt-12 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorized Access Pool ({invites.length})</p>
              </div>

              {loading ? (
                <div className="py-20 text-center animate-pulse">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching records...</p>
                </div>
              ) : invites.length === 0 ? (
                <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <UserPlus size={40} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active invitations found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {invites.map((invite) => (
                    <div key={invite.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between group hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 text-sm">
                          {invite.email?.[0]?.toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm text-slate-900 truncate max-w-[150px]">{invite.email}</p>
                          <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Authorized</p>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        icon={Trash2}
                        onClick={() => handleRemoveInvite(invite.id, invite.email)}
                        className="opacity-0 group-hover:opacity-100 px-3 py-2 shrink-0 scale-90"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
