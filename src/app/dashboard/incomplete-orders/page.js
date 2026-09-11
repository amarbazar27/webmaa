'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeIncompleteOrders, getShop } from '@/lib/firestore';
import { 
  ShoppingBag, Clock, CheckCircle, Phone, MapPin, 
  Package, FileText, Trash2, ArrowUpRight, MessageSquare, 
  AlertCircle, TrendingUp, Users, RefreshCw, Search, Download,
  Copy, BookOpen, Sparkles, Check, Flame, ShoppingCart, HelpCircle, X,
  Smartphone, Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function IncompleteOrdersPage() {
  const { user, userData, activeShopId, loading: authLoading } = useAuth();
  const [shop, setShop] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('hot_leads'); // default show hot leads with phone number
  const [searchTerm, setSearchTerm] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [convertingId, setConvertingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (authLoading || !activeShopId || !user) return;

    getShop(activeShopId).then(setShop);

    const unsub = subscribeIncompleteOrders(
      activeShopId, 
      (data) => {
        setDrafts(data);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load drafts:', err);
        const isRetailerOrAdmin = userData?.role === 'retailer' || userData?.role === 'superadmin' || userData?.role === 'staff' || userData?.role === 'admin';
        if (isRetailerOrAdmin) {
          toast.error(`ড্রাফট কার্ট লোড করতে সমস্যা হয়েছে। [Firestore: subscribeIncompleteOrders] এরর: ${err.message || err.code || err}`);
        } else {
          toast.error('ড্রাফট কার্ট লোড করতে সমস্যা হয়েছে।');
        }
        setLoading(false);
      }
    );

    return () => unsub();
  }, [activeShopId, userData, authLoading, user]);

  // Handle converting an abandoned draft into a confirmed order
  const handleConvertToOrder = async (draft) => {
    const hasContact = draft.customerPhone || draft.customerName;
    if (!hasContact) {
      toast.error('কাস্টমারের কোনো নাম বা ফোন নম্বর নেই, অর্ডারে রূপান্তর করা সম্ভব নয়।');
      return;
    }

    const confirmMsg = `আপনি কি নিশ্চিত যে "${draft.customerName || draft.customerPhone}"-এর এই ড্রাফটটিকে একটি কনফার্মড ক্যাশ-অন-ডেলিভারি অর্ডারে রূপান্তর করতে চান?`;
    if (!confirm(confirmMsg)) return;

    try {
      setConvertingId(draft.id);
      const token = await user.getIdToken();
      const res = await fetch('/api/checkout/recover-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId: activeShopId,
          draftId: draft.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'অর্ডারে রূপান্তর করতে ব্যর্থ হয়েছে');
      }

      toast.success(`🎉 ড্রাফটটি সফলভাবে অর্ডারে রূপান্তরিত হয়েছে! আইডি: ${data.orderIdVisual || ''}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'অর্ডারে রূপান্তর করতে সমস্যা হয়েছে');
    } finally {
      setConvertingId(null);
    }
  };

  // Copy customer phone to clipboard
  const handleCopyPhone = (phone, id) => {
    if (!phone) return;
    try {
      navigator.clipboard.writeText(phone);
      setCopiedId(id);
      toast.success('ফোন নম্বর কপি করা হয়েছে! 📋');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      toast.error('কপি করা যায়নি');
    }
  };

  // Handle deleting draft manually
  const handleDeleteDraft = async (draftId) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ড্রাফটটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'shops', activeShopId, 'incomplete_orders', draftId));
      toast.success('ড্রাফটটি সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (err) {
      console.error(err);
      const isRetailerOrAdmin = userData?.role === 'retailer' || userData?.role === 'superadmin' || userData?.role === 'staff' || userData?.role === 'admin';
      if (isRetailerOrAdmin) {
        toast.error(`ড্রাফট মুছতে সমস্যা হয়েছে। [deleteDoc: incomplete_orders] এরর: ${err.message || err}`);
      } else {
        toast.error('ড্রাফট মুছতে সমস্যা হয়েছে');
      }
    }
  };

  // Recovery Analytics
  const hotLeadsList = drafts.filter(d => d.customerPhone && d.status === 'abandoned');
  const abandonedList = drafts.filter(d => d.status === 'abandoned');
  const recoveredList = drafts.filter(d => d.status === 'recovered');

  const totalHotLeadsCount = hotLeadsList.length;
  const totalAbandonedCount = abandonedList.length;
  const totalRecoveredCount = recoveredList.length;
  const totalDraftCount = drafts.length;

  const recoveryRate = totalDraftCount > 0 
    ? ((totalRecoveredCount / totalDraftCount) * 100).toFixed(1) 
    : '0.0';

  const potentialRevenue = abandonedList.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const recoveredRevenue = recoveredList.reduce((acc, curr) => acc + (curr.total || 0), 0);

  // Filter drafts based on tab selection & search query
  const filteredDrafts = drafts.filter(d => {
    // Tab Filter
    if (filter === 'hot_leads') {
      if (!d.customerPhone || d.status !== 'abandoned') return false;
    } else if (filter === 'abandoned') {
      if (d.status !== 'abandoned') return false;
    } else if (filter === 'recovered') {
      if (d.status !== 'recovered') return false;
    }

    // Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const nameMatch = d.customerName?.toLowerCase().includes(q);
      const phoneMatch = d.customerPhone?.includes(q);
      const emailMatch = d.customerEmail?.toLowerCase().includes(q);
      const addressMatch = d.customerAddress?.toLowerCase().includes(q);
      const itemMatch = (d.items || []).some(i => i.name?.toLowerCase().includes(q));
      return nameMatch || phoneMatch || emailMatch || addressMatch || itemMatch;
    }

    return true;
  });

  // Pre-fill WhatsApp message link generator
  const getWhatsAppLink = (phone, name, items = []) => {
    if (!phone) return '#';
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '88' + clean;
    else if (!clean.startsWith('88')) clean = '88' + clean;

    const shopName = shop?.shopName || 'আমাদের স্টোর';
    const firstItem = items?.[0]?.name ? `"${items[0].name}"` : 'আপনার পছন্দের পণ্যটি';
    const text = `আসসালামু আলাইকুম ${name ? name + ' ভাই' : 'সম্মানিত গ্রাহক'}, ${shopName}-এ ${firstItem} আপনার শপিং ব্যাগে ছিল। কোনো কারণে কি অর্ডারটি সম্পন্ন করতে সমস্যা হয়েছিল? আপনাকে অর্ডারে কোনো স্পেশাল অফার বা সহায়তা করতে পারি? ধন্যবাদ!`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  };

  const exportDraftsToCSV = () => {
    if (filteredDrafts.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো ইনকমপ্লিট অর্ডার বা লিড পাওয়া যায়নি।');
      return;
    }

    const headers = [
      'Draft ID',
      'Date & Time',
      'Customer Name',
      'Customer Phone',
      'Delivery Address',
      'Items in Cart',
      'Cart Total (BDT)',
      'Status',
      'Lead Quality',
      'Device',
      'Last Step Completed'
    ];

    const rows = filteredDrafts.map(d => {
      let dateStr = '';
      try {
        const dateObj = d.updatedAt?.toDate ? d.updatedAt.toDate() : d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt || d.updatedAt);
        dateStr = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleString('bn-BD');
      } catch (e) {}

      const itemsStr = (d.items || []).map(i => `${i.name} (Qty: ${i.quantity}, Price: ${i.price})`).join('; ');
      const leadQuality = d.customerPhone ? 'Hot Lead (Phone)' : (d.customerEmail ? 'Warm Lead' : 'Cart Session');

      return [
        `"#${d.id?.slice(-6).toUpperCase()}"`,
        `"${dateStr}"`,
        `"${(d.customerName || '').replace(/"/g, '""')}"`,
        `"${(d.customerPhone || '').replace(/"/g, '""')}"`,
        `"${(d.customerAddress || '').replace(/"/g, '""')}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        d.total || 0,
        `"${d.status || 'abandoned'}"`,
        `"${leadQuality}"`,
        `"${d.device || 'unknown'}"`,
        `"${d.step || 'cart'}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_and_abandoned_carts_${shop?.shopSlug || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filteredDrafts.length} টি লিড ও ড্রাফট সফলভাবে CSV ফাইলে ডাউনলোড হয়েছে! 📥`);
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              লিডস ও অসম্পূর্ণ কার্ট ম্যানেজার (Lead Capture & Recovery)
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">
            গ্রাহক অর্ডার বাটনে ক্লিক না করলেও স্বয়ংক্রিয়ভাবে ফোন ও তথ্য সংরক্ষণ হয় — ১-ক্লিকে কল, হোয়াটসঅ্যাপ বা কনফার্ম করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Lead Indicator */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider shadow-xs">
             <span className="relative flex h-2.5 w-2.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
             </span>
             <span>অটো-ক্যাপচার সক্রিয়</span>
          </div>

          {/* Guide Button */}
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            title="এটি কিভাবে কাজ করে এবং কিভাবে সেলস বাড়াবেন জানুন"
          >
            <BookOpen size={14} />
            <span>কিভাবে কাজ করে? (গাইড)</span>
          </button>

          {/* CSV Export */}
          <button
            type="button"
            onClick={exportDraftsToCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-black rounded-2xl text-xs flex items-center gap-1.5 border border-slate-200 shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
            title="লিডস তালিকা এক্সপোর্ট করুন"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Recovery Analytics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Hot Leads (Direct Actionable Phone Numbers) */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white rounded-3xl p-6 border-2 border-amber-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                <Flame size={13} className="text-amber-500 fill-amber-500" /> Hot Leads (ফোন সহ)
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{totalHotLeadsCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
              <Phone size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">সরাসরি কল বা মেসেজ করার উপযোগী লিড</p>
        </div>

        {/* Card 2: Potential Revenue */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Potential Revenue</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">৳{potentialRevenue}</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-xs">
              <ShoppingBag size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{totalAbandonedCount}টি অসম্পূর্ণ কার্ট পেন্ডিং আছে</p>
        </div>

        {/* Card 3: Recovered Revenue */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recovered Revenue</p>
              <h3 className="text-3xl font-black text-emerald-600 mt-2">৳{recoveredRevenue}</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{totalRecoveredCount}টি কার্ট অর্ডারে রূপান্তর হয়েছে</p>
        </div>

        {/* Card 4: Recovery Rate */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recovery Success Rate</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{recoveryRate}%</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">মোট {totalDraftCount}টি কার্ট সেশনের মধ্যে সফলতার হার</p>
        </div>

      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xs">
        
        {/* Tab Filters */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl w-full lg:w-auto shrink-0 gap-1">
          <button
            onClick={() => setFilter('hot_leads')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              filter === 'hot_leads'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-700 hover:text-amber-900 hover:bg-amber-100/60'
            }`}
          >
            <Flame size={13} className={filter === 'hot_leads' ? 'fill-white' : 'fill-amber-500'} />
            <span>হট লিডস ({totalHotLeadsCount})</span>
          </button>
          <button
            onClick={() => setFilter('abandoned')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filter === 'abandoned'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            সব পেন্ডিং ({totalAbandonedCount})
          </button>
          <button
            onClick={() => setFilter('recovered')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filter === 'recovered'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            রিকভারড ({totalRecoveredCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            সব ড্রাফট ({totalDraftCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 w-full max-w-md">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="গ্রাহকের নাম, ফোন, পণ্য বা ঠিকানা দিয়ে খুঁজুন..."
            className="bg-transparent border-0 outline-none text-xs font-bold text-slate-800 w-full placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cart List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="animate-spin text-purple-600" size={32} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">ড্রাফট ও লিডস লোড হচ্ছে...</p>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] py-20 text-center flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 shadow-inner">
             <Package size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-800">কোন ড্রাফট বা লিড পাওয়া যায়নি।</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            গ্রাহক আপনার স্টোরে এসে চেকআউটে তথ্য লেখা শুরু করলেই রিয়েল-টাইমে এখানে তাদের লিড ও ইনকমপ্লিট কার্ট দেখতে পাবেন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrafts.map((draft) => {
            const hasPhone = Boolean(draft.customerPhone);
            const hasContact = Boolean(draft.customerPhone || draft.customerName || draft.customerEmail);
            const isConverting = convertingId === draft.id;

            return (
              <div 
                key={draft.id} 
                className={`bg-white rounded-[2.5rem] p-6 border-2 shadow-sm flex flex-col justify-between space-y-5 hover:shadow-md transition-shadow relative overflow-hidden ${
                  draft.status === 'recovered' 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : hasPhone 
                      ? 'border-amber-200/90 ring-1 ring-amber-400/20' 
                      : 'border-slate-100'
                }`}
              >
                
                {/* Draft Header status badges */}
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       {draft.updatedAt?.toDate 
                         ? draft.updatedAt.toDate().toLocaleString('en-GB') 
                         : draft.createdAt?.toDate 
                           ? draft.createdAt.toDate().toLocaleString('en-GB') 
                           : 'Just now'}
                    </span>
                    {draft.device && (
                      <span className="text-[10px] text-slate-400 flex items-center" title={`ডিভাইস: ${draft.device}`}>
                        {draft.device === 'mobile' ? <Smartphone size={11} /> : <Monitor size={11} />}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasPhone && draft.status === 'abandoned' && (
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                        <Flame size={9} className="fill-amber-600" /> হট লিড
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                      draft.status === 'recovered' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {draft.status === 'recovered' ? 'Recovered' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Customer Contact details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      hasPhone ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-purple-50 text-purple-600 border-purple-100'
                    }`}>
                      <Users size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">গ্রাহকের বিবরণ</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5 truncate">{draft.customerName || 'অজানা গ্রাহক (Unnamed)'}</p>
                      
                      {draft.customerPhone ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                            {draft.customerPhone}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(draft.customerPhone, draft.id)}
                            className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                            title="ফোন নম্বর কপি করুন"
                          >
                            {copiedId === draft.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5 italic">কোন ফোন নম্বর দেওয়া হয়নি</p>
                      )}

                      {draft.customerEmail && (
                         <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{draft.customerEmail}</p>
                      )}
                    </div>
                  </div>

                  {draft.customerAddress && (
                     <div className="flex items-start gap-2.5 pt-2 border-t border-slate-50">
                        <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ডেলিভারি ঠিকানা</p>
                           <p className="text-xs font-bold text-slate-700 leading-relaxed truncate">{draft.customerAddress}</p>
                        </div>
                     </div>
                  )}

                  {draft.customerNote && (
                     <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100 text-[11px] text-amber-800">
                       <span className="font-bold">নোট:</span> {draft.customerNote}
                     </div>
                  )}
                </div>

                {/* Cart Items Details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">পণ্য তালিকা ({draft.items?.length || 0})</p>
                  <div className="max-h-28 overflow-y-auto space-y-2 scrollbar-thin">
                     {(draft.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center gap-2">
                           <p className="text-xs font-bold text-slate-800 truncate flex-1">{item.name}</p>
                           <p className="text-xs font-black text-slate-600 shrink-0">{item.quantity}x ৳{item.price}</p>
                        </div>
                     ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                     <span className="text-[9px] font-black text-slate-500 uppercase">কার্ট মোট মূল্য</span>
                     <span className="text-sm font-black text-slate-900">৳{draft.total}</span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {draft.status === 'abandoned' && hasPhone ? (
                     <div className="space-y-2">
                       <div className="grid grid-cols-2 gap-2">
                          <a 
                             href={`tel:${draft.customerPhone}`}
                             className="py-2.5 bg-purple-600 hover:bg-purple-700 text-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                          >
                             <Phone size={12} /> কল দিন
                          </a>
                          <a 
                             href={getWhatsAppLink(draft.customerPhone, draft.customerName, draft.items)}
                             target="_blank"
                             rel="noreferrer"
                             className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
                          >
                             <MessageSquare size={12} /> WhatsApp
                          </a>
                       </div>

                       {/* Convert to Confirmed Order */}
                       <button
                         type="button"
                         disabled={isConverting}
                         onClick={() => handleConvertToOrder(draft)}
                         className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                       >
                         {isConverting ? (
                           <RefreshCw size={12} className="animate-spin" />
                         ) : (
                           <ShoppingCart size={12} />
                         )}
                         <span>{isConverting ? 'অর্ডার তৈরি হচ্ছে...' : 'অর্ডারে রূপান্তর করুন'}</span>
                       </button>
                     </div>
                  ) : draft.status === 'recovered' ? (
                     <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-center flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-emerald-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest">অর্ডার সফলভাবে রিকভারড হয়েছে</span>
                        </div>
                        {draft.orderIdVisual && (
                          <span className="text-xs font-black text-emerald-800">অর্ডার আইডি: {draft.orderIdVisual}</span>
                        )}
                     </div>
                  ) : (
                     <div className="space-y-2">
                       <div className="bg-slate-50 border border-slate-200 text-slate-400 rounded-xl p-2.5 text-center flex items-center justify-center gap-1.5">
                          <AlertCircle size={13} />
                          <span className="text-[10px] font-black uppercase tracking-widest">যোগাযোগের ফোন নম্বর মেলেনি</span>
                       </div>
                       {hasContact && (
                         <button
                           type="button"
                           disabled={isConverting}
                           onClick={() => handleConvertToOrder(draft)}
                           className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                         >
                           <ShoppingCart size={11} /> অর্ডারে রূপান্তর
                         </button>
                       )}
                     </div>
                  )}

                  <button 
                     type="button"
                     onClick={() => handleDeleteDraft(draft.id)}
                     className="w-full py-2 bg-white text-red-500 hover:bg-red-50 border border-red-100 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-colors mt-1"
                  >
                     <Trash2 size={11} /> সেশন ডিলিট করুন
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Retailer Interactive Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    লিড ক্যাপচার ও সেলস রিকভারি গাইড
                  </h3>
                  <p className="text-xs font-bold text-slate-400">
                    অর্ডার প্লেস না করলেও কীভাবে কাস্টমারের তথ্য পাবেন এবং সেলস বাড়াবেন
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              
              {/* Feature 1 */}
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-2">
                <h4 className="font-black text-purple-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600" />
                  ১. ফিচারটি কিভাবে স্বয়ংক্রিয়ভাবে কাজ করে?
                </h4>
                <p className="text-slate-700 font-medium">
                  যেকোনো গ্রাহক যখন আপনার ওয়েবসাইটে ঢুকে পণ্য ব্যাগে নেয় এবং চেকআউটে গিয়ে নাম, ফোন নম্বর বা ঠিকানা লেখা শুরু করে — আমাদের সিস্টেম তৎক্ষণাৎ ব্যাকগ্রাউন্ডে তা সংরক্ষণ করে ফেলে।
                </p>
                <p className="text-slate-700 font-medium">
                  গ্রাহক যদি কোনো কারণে <strong>"অর্ডার কনফার্ম করুন" বাটনে ক্লিক নাও করে</strong>, অথবা হঠাৎ করে ব্রাউজার ট্যাব কেটে দেয় বা ফোন লক করে ফেলে — তাও তার দেওয়া ফোন নম্বর ও সিলেক্ট করা পণ্যের তালিকা এই ড্যাশবোর্ডে সুরক্ষিত থাকবে!
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-2">
                <h4 className="font-black text-emerald-900 flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600" />
                  ২. রিটেইলারদের কি কোনো ম্যানুয়াল কাজ বা কোডিং করতে হবে?
                </h4>
                <p className="text-slate-700 font-medium">
                  <strong>না, বিন্দুমাত্র কিছু করতে হবে না!</strong> আপনার শপ বা কাস্টম ডোমেইনে এই ফিচারটি শুরু থেকেই ১০০% সক্রিয় (Active) ও স্বয়ংক্রিয়। কোনো স্ক্রিপ্ট বসানো, প্লাগিন ইন্সটল বা অন/অফ করতে হবে না।
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-2.5">
                <h4 className="font-black text-amber-900 flex items-center gap-2">
                  <Flame size={16} className="text-amber-600 fill-amber-600" />
                  ৩. এই লিডগুলো কাজে লাগিয়ে কিভাবে বিক্রি দ্বিগুণ করবেন?
                </h4>
                <div className="space-y-2 text-slate-700 font-medium pl-1">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">১</span>
                    <p>
                      <strong>সরাসরি কল দিন:</strong> "কল দিন" বাটনে ট্যাপ করে কাস্টমারকে ভালোবেসে জিজ্ঞেস করুন তাদের কোনো পণ্য নির্বাচনে সাহায্য বা ডেলিভারি তথ্য জানতে চাওয়া আছে কি না।
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">২</span>
                    <p>
                      <strong>হোয়াটসঅ্যাপে ওয়ান-ক্লিক মেসেজ:</strong> "WhatsApp" বাটনে চাপ দিলেই কাস্টমারের নামে ও পছন্দের পণ্যের নাম উল্লেখ করে স্বয়ংক্রিয় ড্রাফট মেসেজ তৈরি হবে। প্রয়োজনে ৫-১০% স্পেশাল ছাড় বা ফ্রি ডেলিভারি অফার দিন।
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">৩</span>
                    <p>
                      <strong>১-ক্লিকে অর্ডারে রূপান্তর:</strong> কাস্টমার ফোনে রাজি হলে প্রতিটি লিড কার্ডের নিচে থাকা <span className="font-black text-emerald-700">"অর্ডারে রূপান্তর করুন"</span> বাটনে চাপ দিন। সাথে সাথে এই ড্রাফটটি একটি বাস্তব ক্যাশ-অন-ডেলিভারি অর্ডারে রূপান্তরিত হয়ে আপনার মূল অর্ডার লিস্টে চলে যাবে!
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                ধন্যবাদ, বুঝেছি!
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

