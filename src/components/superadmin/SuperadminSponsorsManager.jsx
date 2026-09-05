'use client';

import { useState, useEffect } from 'react';
import { 
  Handshake, Plus, Trash2, Edit2, CheckCircle2, XCircle, 
  ExternalLink, Globe, Image, Mail, Phone, Clock, 
  Sparkles, Check, X, ArrowUp, ArrowDown, Save, Loader2, Upload 
} from 'lucide-react';
import { 
  getSponsorRequests, 
  deleteSponsorRequest, 
  updateSponsorRequestStatus, 
  updateGlobalConfig,
  subscribeGlobalConfig
} from '@/lib/firestore';
import toast from 'react-hot-toast';

const DEFAULT_SPONSORS_FALLBACK = [
  {
    id: 'sp-1',
    companyName: 'Steadfast Courier',
    tier: 'অফিসিয়াল লজিস্টিক পার্টনার',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><rect width="400" height="120" rx="16" fill="%23004b93"/><g fill="%23ffffff"><path d="M40 35 L65 20 L90 35 L90 65 L65 80 L40 65 Z" fill="none" stroke="%23ffffff" stroke-width="6"/><circle cx="65" cy="50" r="10" fill="%23ffc20e"/><text x="110" y="60" font-family="sans-serif" font-size="28" font-weight="900" fill="%23ffffff">STEADFAST</text><text x="110" y="85" font-family="sans-serif" font-size="15" font-weight="700" fill="%23ffc20e" letter-spacing="4">COURIER BD</text></g></svg>',
    websiteUrl: 'https://steadfast.com.bd'
  },
  {
    id: 'sp-2',
    companyName: 'UddoktaPay',
    tier: 'পেমেন্ট গেটওয়ে পার্টনার',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><rect width="400" height="120" rx="16" fill="%235a31f4"/><circle cx="65" cy="60" r="30" fill="%23ffffff"/><path d="M52 45 L68 60 L52 75 M64 45 L80 60 L64 75" fill="none" stroke="%235a31f4" stroke-width="5" stroke-linecap="round"/><text x="115" y="64" font-family="sans-serif" font-size="28" font-weight="900" fill="%23ffffff">UddoktaPay</text><text x="115" y="86" font-family="sans-serif" font-size="13" font-weight="700" fill="%23c4b5fd" letter-spacing="2">PAYMENT GATEWAY</text></svg>',
    websiteUrl: 'https://uddoktapay.com'
  },
  {
    id: 'sp-3',
    companyName: 'Bkash Merchant',
    tier: 'ডিজিটাল পেমেন্ট নেটওয়ার্ক',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><rect width="400" height="120" rx="16" fill="%23e2136e"/><polygon points="40,35 75,35 60,65" fill="%23ffffff"/><polygon points="60,65 95,50 80,85" fill="%23ffffff"/><polygon points="40,35 60,65 35,80" fill="%23ffffff"/><text x="115" y="62" font-family="sans-serif" font-size="28" font-weight="900" fill="%23ffffff">bKash</text><text x="115" y="86" font-family="sans-serif" font-size="13" font-weight="700" fill="%23ffffff" letter-spacing="2">MERCHANT NETWORK</text></svg>',
    websiteUrl: 'https://www.bkash.com'
  }
];

export default function SuperadminSponsorsManager({ globalConfig = {} }) {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'active_sponsors'
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Active Sponsors State - accurately tracks Firestore state (even empty array)
  const [sponsors, setSponsors] = useState(() => {
    if (Array.isArray(globalConfig?.sponsors)) {
      return globalConfig.sponsors;
    }
    return DEFAULT_SPONSORS_FALLBACK;
  });

  // Upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // New Sponsor Form
  const [newSponsor, setNewSponsor] = useState({
    companyName: '',
    logoUrl: '',
    websiteUrl: '',
    tier: 'অফিসিয়াল পার্টনার'
  });

  // Edit Sponsor State
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    companyName: '',
    logoUrl: '',
    websiteUrl: '',
    tier: ''
  });

  const [savingSponsors, setSavingSponsors] = useState(false);

  // Direct realtime Firestore sync: guarantees deletes, edits, additions persist permanently across refresh!
  useEffect(() => {
    const unsub = subscribeGlobalConfig((configData) => {
      if (Array.isArray(configData?.sponsors)) {
        setSponsors(configData.sponsors);
      } else if (!configData?.sponsors) {
        setSponsors(DEFAULT_SPONSORS_FALLBACK);
        updateGlobalConfig({ sponsors: DEFAULT_SPONSORS_FALLBACK }).catch(() => {});
      }
    });
    return () => unsub && unsub();
  }, []);

  // Load Requests
  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const data = await getSponsorRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error('স্পনসর রিকোয়েস্ট লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // ── Sponsor Request Actions ──
  const handleApproveRequest = async (req) => {
    if (!confirm(`আপনি কি '${req.companyName}' এর আবেদন অনুমোদন করে সরাসরি হোমপেজ স্পনসর হিসেবে যুক্ত করতে চান?`)) return;

    setProcessingId(req.id);
    const toastId = toast.loading('অনুমোদন করা হচ্ছে...');
    try {
      // 1. Update request status in Firestore
      await updateSponsorRequestStatus(req.id, 'approved');
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));

      // 2. Add to active sponsors list
      const newSponsorEntry = {
        id: `sp-${Date.now()}`,
        companyName: req.companyName,
        logoUrl: req.logoUrl || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&q=80',
        websiteUrl: req.websiteUrl || 'https://bdretailers.com',
        tier: req.tier || 'কর্পোরেট পার্টনার'
      };

      const updatedSponsors = [...sponsors, newSponsorEntry];
      setSponsors(updatedSponsors);
      await updateGlobalConfig({ sponsors: updatedSponsors });

      toast.success(`'${req.companyName}' অনুমোদিত ও হোমপেজে যুক্ত করা হয়েছে! 🎉`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('অনুমোদনে সমস্যা হয়েছে', { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (req) => {
    if (!confirm(`আপনি কি '${req.companyName}' এর আবেদন প্রত্যাখ্যান করতে চান?`)) return;

    setProcessingId(req.id);
    try {
      await updateSponsorRequestStatus(req.id, 'rejected');
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
      toast.success('আবেদনটি প্রত্যাখ্যান করা হয়েছে');
    } catch (err) {
      console.error(err);
      toast.error('ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteRequest = async (req) => {
    if (!confirm(`আপনি কি '${req.companyName}' এর রিকোয়েস্ট সম্পূর্ণ মুছে ফেলতে চান?`)) return;

    setProcessingId(req.id);
    try {
      await deleteSponsorRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      toast.success('রিকোয়েস্ট মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error(err);
      toast.error('মুছতে ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  // ── Active Sponsors Actions ──
  const handleAddSponsor = async (e) => {
    e.preventDefault();
    if (!newSponsor.companyName.trim()) {
      toast.error('কোম্পানির নাম লিখুন');
      return;
    }

    setSavingSponsors(true);
    const toastId = toast.loading('নতুন স্পনসর যোগ হচ্ছে...');
    try {
      const entry = {
        id: `sp-${Date.now()}`,
        companyName: newSponsor.companyName.trim(),
        logoUrl: newSponsor.logoUrl.trim() || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&q=80',
        websiteUrl: newSponsor.websiteUrl.trim() || 'https://bdretailers.com',
        tier: newSponsor.tier.trim() || 'অফিসিয়াল পার্টনার'
      };

      const updated = [...sponsors, entry];
      setSponsors(updated);
      await updateGlobalConfig({ sponsors: updated });

      setNewSponsor({
        companyName: '',
        logoUrl: '',
        websiteUrl: '',
        tier: 'অফিসিয়াল পার্টনার'
      });
      toast.success('নতুন স্পনসর সফলভাবে যুক্ত হয়েছে! 🎉', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('যুক্ত করতে ব্যর্থ হয়েছে', { id: toastId });
    } finally {
      setSavingSponsors(false);
    }
  };

  const handleAdminFileUpload = async (e, target = 'new') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const toastId = toast.loading('ছবি আপলোড হচ্ছে...');
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('folder', 'partner-sponsors');
      const res = await fetch('/api/upload', { method: 'POST', body: uploadForm });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          if (target === 'new') {
            setNewSponsor(prev => ({ ...prev, logoUrl: data.url }));
          } else {
            setEditFormData(prev => ({ ...prev, logoUrl: data.url }));
          }
          toast.success('ছবি আপলোড সফল হয়েছে! 📸', { id: toastId });
          setUploadingLogo(false);
          return;
        }
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'new') {
          setNewSponsor(prev => ({ ...prev, logoUrl: reader.result }));
        } else {
          setEditFormData(prev => ({ ...prev, logoUrl: reader.result }));
        }
        toast.success('ছবি যুক্ত হয়েছে! 📸', { id: toastId });
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'new') {
          setNewSponsor(prev => ({ ...prev, logoUrl: reader.result }));
        } else {
          setEditFormData(prev => ({ ...prev, logoUrl: reader.result }));
        }
        toast.success('ছবি যুক্ত হয়েছে!', { id: toastId });
      };
      reader.readAsDataURL(file);
      setUploadingLogo(false);
    }
  };

  const handleStartEdit = (sp) => {
    setEditingId(sp.id);
    setEditFormData({
      companyName: sp.companyName,
      logoUrl: sp.logoUrl,
      websiteUrl: sp.websiteUrl,
      tier: sp.tier
    });
  };

  const handleSaveEdit = async () => {
    if (!editFormData.companyName.trim()) {
      toast.error('কোম্পানির নাম আবশ্যক');
      return;
    }

    setSavingSponsors(true);
    const toastId = toast.loading('আপডেট করা হচ্ছে...');
    try {
      const updated = sponsors.map(s => s.id === editingId ? { ...s, ...editFormData } : s);
      setSponsors(updated);
      await updateGlobalConfig({ sponsors: updated });
      setEditingId(null);
      toast.success('স্পনসর তথ্য সফলভাবে আপডেট হয়েছে!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('আপডেট ব্যর্থ হয়েছে', { id: toastId });
    } finally {
      setSavingSponsors(false);
    }
  };

  const handleDeleteSponsor = async (sp) => {
    if (!confirm(`আপনি কি সত্যিই '${sp.companyName}' কে হোমপেজ স্পনসর থেকে সরিয়ে দিতে চান?`)) return;

    setSavingSponsors(true);
    const toastId = toast.loading('মুছে ফেলা হচ্ছে...');
    try {
      const updated = sponsors.filter(s => s.id !== sp.id);
      setSponsors(updated);
      await updateGlobalConfig({ sponsors: updated });
      toast.success('স্পনসর মুছে ফেলা হয়েছে', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('মুছতে ব্যর্থ হয়েছে', { id: toastId });
    } finally {
      setSavingSponsors(false);
    }
  };

  const handleMoveSponsor = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sponsors.length) return;

    const copy = [...sponsors];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    setSponsors(copy);
    await updateGlobalConfig({ sponsors: copy }).catch(() => {});
  };

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs uppercase tracking-wider mb-2 border border-purple-400/20">
              <Handshake size={13} />
              <span>পার্টনারশিপ ও ব্র্যান্ড কোলাবোরেশন</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">স্পনসর ও পার্টনার্স ম্যানেজার</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              হোমপেজ থেকে আসা স্পনসরশিপ আবেদনগুলো অনুমোদন করুন এবং সক্রিয় পার্টনারদের লোগো ও ওয়েবসাইট লিংক পরিচালনা করুন।
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>আবেদন তালিকা</span>
              {pendingRequestsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('active_sponsors')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'active_sponsors'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>সক্রিয় স্পনসরস ({sponsors.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TAB 1: SPONSOR REQUESTS ── */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Mail size={18} className="text-purple-600" />
                <span>স্পনসরশিপ ও পার্টনারশিপ আবেদনপত্র</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                কোম্পানিগুলোর প্রেরিত আবেদন যাচাই করে এক ক্লিকেই অনুমোদন করুন।
              </p>
            </div>
            <button
              onClick={loadRequests}
              disabled={requestsLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5"
            >
              <Clock size={13} />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {requestsLoading ? (
            <div className="text-center py-12">
              <Loader2 size={24} className="animate-spin text-purple-600 mx-auto" />
              <p className="text-xs text-slate-400 mt-2">আবেদনগুলো লোড হচ্ছে...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl text-slate-400 text-xs">
              এখনও কোনো নতুন স্পনসরশিপ আবেদন জমা পড়েনি।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req) => {
                const isProcessing = processingId === req.id;
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';

                let dateText = '';
                if (req.createdAt?.toDate) {
                  dateText = req.createdAt.toDate().toLocaleDateString('bn-BD');
                } else if (req.createdAt?.seconds) {
                  dateText = new Date(req.createdAt.seconds * 1000).toLocaleDateString('bn-BD');
                }

                return (
                  <div
                    key={req.id}
                    className={`p-5 rounded-3xl border transition-all space-y-4 ${
                      isApproved 
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isPending 
                          ? 'bg-purple-50/30 border-purple-200 shadow-sm'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">{req.companyName}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isApproved 
                              ? 'bg-emerald-100 text-emerald-700'
                              : isPending 
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                          }`}>
                            {isApproved ? 'অনুমোদিত' : isPending ? 'অপেক্ষারত' : 'বাতিল'}
                          </span>
                        </div>
                        {req.tier && (
                          <p className="text-xs font-bold text-purple-600 mt-0.5">{req.tier}</p>
                        )}
                      </div>

                      {req.logoUrl && (
                        <img 
                          src={req.logoUrl} 
                          alt="Logo" 
                          className="w-10 h-10 object-contain rounded-xl bg-white p-1 border border-slate-200 shrink-0" 
                        />
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 bg-white/70 p-3 rounded-2xl border border-slate-100">
                      {req.contactName && (
                        <p className="flex items-center gap-2">
                          <span className="font-bold text-slate-500">যোগাযোগ:</span> {req.contactName}
                        </p>
                      )}
                      {req.email && (
                        <p className="flex items-center gap-2">
                          <Mail size={12} className="text-slate-400" />
                          <a href={`mailto:${req.email}`} className="text-purple-600 hover:underline">{req.email}</a>
                        </p>
                      )}
                      {req.phone && (
                        <p className="flex items-center gap-2">
                          <Phone size={12} className="text-slate-400" />
                          <a href={`tel:${req.phone}`} className="text-slate-700 font-medium">{req.phone}</a>
                        </p>
                      )}
                      {req.websiteUrl && (
                        <p className="flex items-center gap-2">
                          <Globe size={12} className="text-slate-400" />
                          <a href={req.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            <span>{req.websiteUrl}</span>
                            <ExternalLink size={10} />
                          </a>
                        </p>
                      )}
                      {req.note && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-slate-700 font-medium italic">
                          &quot;{req.note}&quot;
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">আবেদনের তারিখ: {dateText || 'সম্প্রতি'}</span>
                      
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(req)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} />
                              <span>অনুমোদন ও যোগ</span>
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req)}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
                            >
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(req)}
                          disabled={isProcessing}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ACTIVE SPONSORS & ADD NEW ── */}
      {activeTab === 'active_sponsors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Add New Sponsor Form (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-purple-600" />
                <span>নতুন পার্টনার / স্পনসর যোগ করুন</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                কোম্পানির নাম, লোগো ইমেজ ও ওয়েবসাইট লিংক দিয়ে সরাসরি হোমপেজে যুক্ত করুন।
              </p>
            </div>

            <form onSubmit={handleAddSponsor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">কোম্পানির নাম *</label>
                <input
                  type="text"
                  value={newSponsor.companyName}
                  onChange={(e) => setNewSponsor({ ...newSponsor, companyName: e.target.value })}
                  placeholder="যেমন: Steadfast Courier"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">স্পনসরশিপ পদবী / টিয়ার</label>
                <input
                  type="text"
                  value={newSponsor.tier}
                  onChange={(e) => setNewSponsor({ ...newSponsor, tier: e.target.value })}
                  placeholder="যেমন: অফিশিয়াল লজিস্টিক পার্টনার"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">লোগো বা ব্যানার ছবি (আপলোড অথবা লিংক)</label>
                <div className="flex gap-2 mb-2">
                  <label className="flex-1 px-3 py-2 rounded-xl border border-dashed border-purple-400 bg-purple-50 hover:bg-purple-100/60 text-purple-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                    {uploadingLogo ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>আপলোড হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={13} />
                        <span>ডিভাইস থেকে ছবি আপলোড</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAdminFileUpload(e, 'new')}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="url"
                  value={newSponsor.logoUrl}
                  onChange={(e) => setNewSponsor({ ...newSponsor, logoUrl: e.target.value })}
                  placeholder="অথবা সরাসরি লিংক: https://example.com/logo.png"
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                />
                {newSponsor.logoUrl && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <img src={newSponsor.logoUrl} alt="Preview" className="h-8 object-contain max-w-[120px] rounded" />
                      <span className="text-[11px] text-emerald-600 font-bold">লোগো প্রিভিউ OK</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewSponsor({ ...newSponsor, logoUrl: '' })}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold"
                    >
                      মুছুন
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ওয়েবসাইট লিংক (Website URL)</label>
                <input
                  type="url"
                  value={newSponsor.websiteUrl}
                  onChange={(e) => setNewSponsor({ ...newSponsor, websiteUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                />
              </div>

              <button
                type="submit"
                disabled={savingSponsors}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                <Plus size={15} />
                <span>{savingSponsors ? 'যুক্ত হচ্ছে...' : 'হোমপেজে যোগ করুন'}</span>
              </button>
            </form>
          </div>

          {/* Right: Active Sponsors List (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Handshake size={18} className="text-purple-600" />
                  <span>হোমপেজ সক্রিয় স্পনসর ও পার্টনার্স</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-black">
                    {sponsors.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">এই পার্টনারদের লোগো bdretailers.com হোমপেজে প্রদর্শিত হচ্ছে।</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {sponsors.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  কোনো সক্রিয় স্পনসর নেই। বামদিকের ফর্ম থেকে যোগ করুন।
                </div>
              ) : (
                sponsors.map((sp, idx) => {
                  const isEditing = editingId === sp.id;

                  return (
                    <div
                      key={sp.id || idx}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-200 transition-all space-y-3"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-1">কোম্পানির নাম</label>
                              <input
                                type="text"
                                value={editFormData.companyName}
                                onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-1">টিয়ার / পদবী</label>
                              <input
                                type="text"
                                value={editFormData.tier}
                                onChange={(e) => setEditFormData({ ...editFormData, tier: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-purple-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">লোগো ছবি (আপলোড বা URL)</label>
                            <div className="flex gap-2 mb-1.5">
                              <label className="px-2.5 py-1 rounded-lg border border-dashed border-purple-400 bg-purple-50 text-purple-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                                <Upload size={11} />
                                <span>ছবি আপলোড</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleAdminFileUpload(e, 'edit')}
                                  disabled={uploadingLogo}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <input
                              type="url"
                              value={editFormData.logoUrl}
                              onChange={(e) => setEditFormData({ ...editFormData, logoUrl: e.target.value })}
                              placeholder="https://example.com/logo.png"
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-purple-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">ওয়েবসাইট URL</label>
                            <input
                              type="url"
                              value={editFormData.websiteUrl}
                              onChange={(e) => setEditFormData({ ...editFormData, websiteUrl: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-purple-500 focus:outline-none"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold"
                            >
                              বাতিল
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-4 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                            >
                              <Save size={12} />
                              <span>সংরক্ষণ</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                              <img
                                src={sp.logoUrl}
                                alt={sp.companyName}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&q=80';
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-900 truncate">{sp.companyName}</h4>
                              <p className="text-[11px] text-purple-600 font-bold">{sp.tier}</p>
                              {sp.websiteUrl && (
                                <a 
                                  href={sp.websiteUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <span className="truncate max-w-[160px]">{sp.websiteUrl}</span>
                                  <ExternalLink size={9} />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleMoveSponsor(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                              title="উপরে নিন"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              onClick={() => handleMoveSponsor(idx, 'down')}
                              disabled={idx === sponsors.length - 1}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                              title="নিচে নিন"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              onClick={() => handleStartEdit(sp)}
                              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              title="সম্পাদনা"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteSponsor(sp)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
