'use client';

import { useEffect, useState } from 'react';
import {
  getRetailerInvites, addRetailerInvite, removeRetailerInvite, getAllShops,
  getRetailerRequests, approveRetailerRequest, denyRetailerRequest,
  subscribeGlobalConfig, updateGlobalConfig, getOrders,
  pauseShop, resumeShop, deleteRetailerRequest
} from '@/lib/firestore';
import {
  UserPlus, Mail, Trash2, Crown, Store, Activity, ShieldCheck,
  Phone, CheckCircle, XCircle, Clock, ArrowUpRight, Users, Loader2, Sparkles, Key, Eye, EyeOff,
  Globe, Link2, Pause, Play
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
  const [processingShopId, setProcessingShopId] = useState(null);
  
  const [globalConfig, setGlobalConfig] = useState({ geminiApiKey: '', contactWa: '', contactFb: '', contactEmail: '', promotedLinks: [] });
  const [savingConfig, setSavingConfig] = useState(false);
  
  const router = useRouter();
  const [showKey, setShowKey] = useState(false);

  // Helper to mask key
  const maskKey = (key) => {
    if (!key) return '';
    if (key.length < 15) return '*'.repeat(key.length);
    return `${key.substring(0, 4)}********${key.substring(key.length - 4)}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [invitesData, shopsData, requestsData] = await Promise.all([
        getRetailerInvites(),
        getAllShops(),
        getRetailerRequests()
      ]);
      
      // Fetch metrics for each shop in parallel
      const shopsWithMetrics = await Promise.all(shopsData.map(async (shop) => {
        try {
          const orders = await getOrders(shop.id);
          const completedOrders = orders.filter(o => o.status === 'completed');
          const totalSales = completedOrders.length;
          const totalRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
          
          // Match owner email from requests
          const owner = requestsData.find(r => r.id === shop.id);
          
          return {
            ...shop,
            totalSales,
            totalRevenue,
            ownerEmail: owner?.email || shop.ownerEmail || 'Unknown',
            orderCount: orders.length
          };
        } catch (e) {
          return { ...shop, totalSales: 0, totalRevenue: 0, ownerEmail: 'Error' };
        }
      }));

      setInvites(invitesData);
      setShops(shopsWithMetrics);
      setRequests(requestsData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { 
    loadData(); 
    const unsubscribe = subscribeGlobalConfig((configData) => {
      setGlobalConfig({
        geminiApiKey: configData?.geminiApiKey || '',
        contactWa: configData?.contactWa || '',
        contactFb: configData?.contactFb || '',
        contactEmail: configData?.contactEmail || '',
        promotedLinks: configData?.promotedLinks || []
      });
    });
    return () => unsubscribe();
  }, []);

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

  const handlePauseShop = async (shop) => {
    const action = shop.isActive !== false ? 'পজ' : 'চালু';
    if (!confirm(`"${shop.shopName}" স্টোরটি ${action} করতে চান?`)) return;
    setProcessingShopId(shop.id);
    try {
      if (shop.isActive !== false) {
        await pauseShop(shop.id);
        toast.success(`"${shop.shopName}" পজ করা হয়েছে।`);
      } else {
        await resumeShop(shop.id);
        toast.success(`"${shop.shopName}" পুনরায় চালু হয়েছে!`);
      }
      loadData();
    } catch (err) {
      toast.error('স্টোর আপডেট করতে ব্যর্থ হয়েছে।');
    }
    setProcessingShopId(null);
  };

  const handleDeleteRequest = async (req) => {
    if (!confirm(`${req.email}-এর আবেদনটি সম্পূর্ণ মুছে ফেলবেন? এরপর তারা আবার আবেদন করতে পারবে।`)) return;
    setProcessingId(req.id);
    try {
      await deleteRetailerRequest(req.id);
      toast.success('আবেদন মুছে ফেলা হয়েছে। ব্যবহারকারী আবার আবেদন করতে পারবে।');
      loadData();
    } catch (err) {
      toast.error('মুছে ফেলতে সমস্যা হয়েছে।');
    }
    setProcessingId(null);
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await updateGlobalConfig(globalConfig);
      toast.success('Global Configuration updated!');
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
      <Card title="Platform Intelligence" subtitle="Manage global AI nodes and API keys (Groq Engine)" icon={Sparkles} className="border-2 border-purple-100 bg-purple-50/20">
        <form onSubmit={handleUpdateConfig} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
           <div className="md:col-span-10">
              <div className="relative">
                 <Input
                   label="Global Groq API Key"
                   placeholder="gsk_..."
                   type={showKey ? "text" : "password"}
                   value={globalConfig.geminiApiKey}
                   onChange={e => setGlobalConfig({...globalConfig, geminiApiKey: e.target.value})}
                   icon={Key}
                 />
                 <button 
                   type="button" 
                   className="absolute right-4 top-10 text-slate-400 hover:text-purple-600 transition-colors"
                   onClick={() => setShowKey(!showKey)}
                 >
                   {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                 </button>
              </div>
              {!showKey && globalConfig.geminiApiKey && (
                 <p className="text-xs font-mono text-purple-700 bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg mt-3 inline-block">Current Key: {maskKey(globalConfig.geminiApiKey)}</p>
              )}
              <p className="text-[10px] text-slate-400 font-bold mt-3 px-1 uppercase tracking-wider">
                This key is used as a fallback if a retailer does not provide their own Groq API key.
              </p>
           </div>
           
           <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-purple-100">
             <div className="md:col-span-3">
               <p className="text-xs font-black text-slate-900 mb-1 flex items-center gap-2"><Phone size={14}/> Platform Global Contact Links</p>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">Displayed on the Webmaa Landing Page for support</p>
             </div>
             <Input label="WhatsApp Number" placeholder="017XXX..." value={globalConfig.contactWa} onChange={e => setGlobalConfig({...globalConfig, contactWa: e.target.value})} />
             <Input label="Facebook Page Link" placeholder="https://facebook.com/..." value={globalConfig.contactFb} onChange={e => setGlobalConfig({...globalConfig, contactFb: e.target.value})} />
             <Input label="Support Email" placeholder="support@webmaa.cloud" value={globalConfig.contactEmail} onChange={e => setGlobalConfig({...globalConfig, contactEmail: e.target.value})} />
           </div>

           <div className="md:col-span-12 grid grid-cols-1 gap-4 pt-6 border-t border-purple-100">
             <div>
               <p className="text-xs font-black text-slate-900 mb-1 flex items-center gap-2"><ArrowUpRight size={14}/> Promoted Shops (Landing Page Portfolio)</p>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">Add shops built with Webmaa to showcase on the main landing page</p>
             </div>
             
             {globalConfig.promotedLinks.map((link, idx) => (
               <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                 <input type="text" placeholder="Shop Name" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold bg-white" value={link.title} onChange={e => {
                   const newArr = [...globalConfig.promotedLinks];
                   newArr[idx].title = e.target.value;
                   setGlobalConfig({...globalConfig, promotedLinks: newArr});
                 }} />
                 <input type="text" placeholder="URL (e.g., https://example.com)" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold bg-white" value={link.url} onChange={e => {
                   const newArr = [...globalConfig.promotedLinks];
                   newArr[idx].url = e.target.value;
                   setGlobalConfig({...globalConfig, promotedLinks: newArr});
                 }} />
                 <button type="button" onClick={() => {
                   const newArr = globalConfig.promotedLinks.filter((_, i) => i !== idx);
                   setGlobalConfig({...globalConfig, promotedLinks: newArr});
                 }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
               </div>
             ))}
             
             <button type="button" onClick={() => setGlobalConfig({...globalConfig, promotedLinks: [...globalConfig.promotedLinks, { title: '', url: '' }]})} className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl w-max border border-purple-200">
               + Add Promoted Shop
             </button>
           </div>

           <div className="md:col-span-12 flex justify-end">
              <Button type="submit" loading={savingConfig} className="bg-slate-900 border-b-4 border-slate-950 hover:bg-black w-40 h-12">
                Update All settings
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
                    <div key={req.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs shrink-0">
                          {req.name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-600 truncate">{req.email}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{req.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md ${
                          req.status === 'approved' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'
                        }`}>
                          {req.status === 'approved' ? 'Approved' : 'Denied'}
                        </span>
                        {req.status === 'denied' && (
                          <button
                            onClick={() => handleDeleteRequest(req)}
                            disabled={processingId === req.id}
                            title="মুছে ফেলুন (user আবার apply করতে পারবে)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            {processingId === req.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
        {/* Live Shops Oversight Section */}
        <div className="lg:col-span-12">
          <Card
            title="Platform Ecosystem Overview"
            subtitle="Monitor all active stores, their domains, and estimated storage footprints"
            icon={Store}
            className="border-2 border-emerald-100 bg-emerald-50/10"
          >
            {loading ? (
              <div className="py-10 text-center animate-pulse">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Scanning ecosystem...</p>
              </div>
            ) : shops.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Store size={40} className="mx-auto mb-4 text-emerald-300" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active stores found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="pb-2 px-4 border-b border-slate-100">Store Name</th>
                      <th className="pb-2 px-4 border-b border-slate-100">Retailer Gmail</th>
                      <th className="pb-2 px-4 border-b border-slate-100">Performance (Sales/Money)</th>
                      <th className="pb-2 px-4 border-b border-slate-100">Domain Map</th>
                      <th className="pb-2 px-4 border-b border-slate-100">Approx. Storage</th>
                      <th className="pb-2 px-4 border-b border-slate-100 text-right">Status</th>
                      <th className="pb-2 px-4 border-b border-slate-100 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.map((shop) => {
                      // Estimate size: basic 2MB base + ~500kb per banner + assumed product footprint
                      const bannerFootprintMB = (shop.banners?.length || 0) * 0.5;
                      const productFootprintMB = (shop.orderCount || 0) * 0.1 + 5.2; 
                      const estimatedTotalMB = (2.0 + bannerFootprintMB + productFootprintMB).toFixed(1);
                      
                      return (
                        <tr key={shop.id} className="bg-white group hover:bg-emerald-50/50 transition-colors border-b border-slate-50 last:border-0">
                          <td className="p-4 first:rounded-l-2xl">
                            <div className="flex items-center gap-3">
                              {shop.logoUrl ? (
                                <img src={shop.logoUrl} className="w-8 h-8 rounded-lg object-cover border border-slate-200" alt="" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center font-black text-emerald-600 text-xs text-center leading-none">
                                  {shop.shopName?.[0] || 'S'}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-tight">{shop.shopName || 'Unnamed Store'}</p>
                                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[120px]">{shop.slogan || 'No slogan'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                               <p className="font-bold text-xs text-slate-600">{shop.ownerEmail}</p>
                               <p className="font-mono text-[9px] text-slate-400">UID: {shop.id.substring(0,8)}...</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                               <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-black text-slate-800">{shop.totalSales} Sales</span>
                                  <span className="text-[11px] font-black text-emerald-600">৳{shop.totalRevenue.toLocaleString()}</span>
                               </div>
                               <div className="mt-1 flex items-center gap-1">
                                  {shop.totalSales > 10 ? (
                                    <span className="text-[8px] font-black uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">High Growth</span>
                                  ) : shop.totalSales > 0 ? (
                                    <span className="text-[8px] font-black uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Active</span>
                                  ) : (
                                    <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">No Sales</span>
                                  )}
                               </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {shop.customDomain && (
                                <a href={`https://${shop.customDomain}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] font-black text-purple-600 hover:text-purple-800 hover:underline">
                                  <Globe size={11} /> {shop.customDomain}
                                </a>
                              )}
                              {shop.subdomainSlug && (
                                <a href={`https://${shop.subdomainSlug}.webmaa.vercel.app`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline">
                                  <Link2 size={11} /> {shop.subdomainSlug}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[60px]">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (estimatedTotalMB / 20) * 100)}%` }}></div>
                              </div>
                              <span className="text-[10px] font-black text-slate-500">{estimatedTotalMB} MB</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                             <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${shop.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                               <span className={`w-1.5 h-1.5 rounded-full ${shop.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                               {shop.isActive !== false ? 'Live' : 'Paused'}
                             </span>
                          </td>
                          <td className="p-4 text-right last:rounded-r-2xl">
                            <button
                              onClick={() => handlePauseShop(shop)}
                              disabled={processingShopId === shop.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all disabled:opacity-50 ${
                                shop.isActive !== false
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {processingShopId === shop.id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : shop.isActive !== false ? (
                                <><Pause size={11} /> Pause</>
                              ) : (
                                <><Play size={11} /> Resume</>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
