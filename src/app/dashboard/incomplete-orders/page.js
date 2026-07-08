'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeIncompleteOrders, getShop } from '@/lib/firestore';
import { 
  ShoppingBag, Clock, CheckCircle, Phone, MapPin, 
  Package, FileText, Trash2, ArrowUpRight, MessageSquare, 
  AlertCircle, TrendingUp, Users, RefreshCw, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function IncompleteOrdersPage() {
  const { user, activeShopId } = useAuth();
  const [shop, setShop] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('abandoned'); // default show abandoned
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!activeShopId) return;

    getShop(activeShopId).then(setShop);

    const unsub = subscribeIncompleteOrders(
      activeShopId, 
      (data) => {
        setDrafts(data);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load drafts:', err);
        toast.error('ড্রাফট কার্ট লোড করতে সমস্যা হয়েছে।');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [activeShopId]);

  // Handle deleting draft manually
  const handleDeleteDraft = async (draftId) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ড্রাফটটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'shops', activeShopId, 'incomplete_orders', draftId));
      toast.success('ড্রাফটটি সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (err) {
      console.error(err);
      toast.error('ড্রাফট মুছতে সমস্যা হয়েছে');
    }
  };

  // Recovery Analytics
  const abandonedList = drafts.filter(d => d.status === 'abandoned');
  const recoveredList = drafts.filter(d => d.status === 'recovered');

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
    if (filter !== 'all' && d.status !== filter) return false;

    // Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const nameMatch = d.customerName?.toLowerCase().includes(q);
      const phoneMatch = d.customerPhone?.includes(q);
      const emailMatch = d.customerEmail?.toLowerCase().includes(q);
      const addressMatch = d.customerAddress?.toLowerCase().includes(q);
      return nameMatch || phoneMatch || emailMatch || addressMatch;
    }

    return true;
  });

  // Pre-fill WhatsApp message link generator
  const getWhatsAppLink = (phone, name) => {
    const formattedPhone = phone.startsWith('0') ? '88' + phone : phone;
    const text = `আসসালামু আলাইকুম ${name || 'গ্রাহক'}, বিডি রিটেইলার্স-এর কার্ট-এ আপনার পছন্দ করা প্রোডাক্টগুলো রয়েছে। অর্ডারটি সম্পূর্ণ করতে এই লিঙ্কে ক্লিক করুন বা আমাদের সাথে যোগাযোগ করুন। ধন্যবাদ!`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">কার্ট রিকভারি ম্যানেজার (Abandoned Carts)</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">
             ইনকমপ্লিট অর্ডার ট্র্যাক করুন এবং ওয়ান-ক্লিক হোয়াটসঅ্যাপ/কল দিয়ে রিকভার করুন
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 text-xs font-black uppercase tracking-wider">
           <RefreshCw size={14} className="animate-spin shrink-0" />
           <span>রিয়েল-টাইম আপডেট হচ্ছে</span>
        </div>
      </div>

      {/* Recovery Analytics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Recovery Rate */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recovery Rate</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{recoveryRate}%</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">মোট কার্ট রিকভারির সফলতার হার</p>
        </div>

        {/* Card 2: Potential Revenue */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Potential Revenue</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">৳{potentialRevenue}</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
              <ShoppingBag size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{totalAbandonedCount}টি কার্ট পেন্ডিং আছে</p>
        </div>

        {/* Card 3: Recovered Revenue */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recovered Revenue</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">৳{recoveredRevenue}</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{totalRecoveredCount}টি কার্ট সফলভাবে রিকভার হয়েছে</p>
        </div>

        {/* Card 4: Total Visits */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Draft Sessions</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{totalDraftCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
              <Users size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">মোট ভিসিটর কার্ট সেশন</p>
        </div>

      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-sm">
        
        {/* Tab Filters */}
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto shrink-0">
          <button
            onClick={() => setFilter('abandoned')}
            className={`flex-1 lg:flex-initial px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filter === 'abandoned'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Abandoned ({totalAbandonedCount})
          </button>
          <button
            onClick={() => setFilter('recovered')}
            className={`flex-1 lg:flex-initial px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filter === 'recovered'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Recovered ({totalRecoveredCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 lg:flex-initial px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Drafts ({totalDraftCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 w-full max-w-md">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="গ্রাহকের নাম, ফোন বা ইমেইল দিয়ে খুঁজুন..."
            className="bg-transparent border-0 outline-none text-xs font-bold text-slate-800 w-full placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Cart List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="animate-spin text-purple-600" size={32} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">ড্রাফট কার্ট লোড হচ্ছে...</p>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] py-20 text-center flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 shadow-inner">
             <Package size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-800">কোন ড্রাফট কার্ট পাওয়া যায়নি।</h3>
          <p className="text-xs text-slate-400 max-w-sm">গ্রাহক চেকআউট শুরু করলে রিয়েল-টাইমে এখানে তাদের ইনকমপ্লিট কার্ট দেখতে পাবেন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrafts.map((draft) => {
            const hasContact = draft.customerPhone || draft.customerName;
            return (
              <div 
                key={draft.id} 
                className={`bg-white rounded-[2.5rem] p-6 border-2 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow relative overflow-hidden ${
                  draft.status === 'recovered' ? 'border-emerald-100' : 'border-slate-100'
                }`}
              >
                
                {/* Draft Header status badge */}
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     {draft.updatedAt?.toDate ? draft.updatedAt.toDate().toLocaleString('en-GB') : 'Just now'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                    draft.status === 'recovered' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {draft.status}
                  </span>
                </div>

                {/* Customer Contact details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/50">
                      <Users size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Details</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5 truncate">{draft.customerName || 'Anonymous User'}</p>
                      {draft.customerPhone && (
                         <p className="text-xs font-bold text-slate-600 mt-0.5">{draft.customerPhone}</p>
                      )}
                      {draft.customerEmail && (
                         <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{draft.customerEmail}</p>
                      )}
                    </div>
                  </div>

                  {draft.customerAddress && (
                     <div className="flex items-start gap-3 pt-2 border-t border-slate-50">
                        <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                           <p className="text-xs font-bold text-slate-700 leading-relaxed truncate">{draft.customerAddress}</p>
                        </div>
                     </div>
                  )}
                </div>

                {/* Cart Items Details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cart Items ({draft.items?.length || 0})</p>
                  <div className="max-h-24 overflow-y-auto space-y-2 scrollbar-thin">
                     {(draft.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center gap-2">
                           <p className="text-xs font-bold text-slate-800 truncate flex-1">{item.name}</p>
                           <p className="text-xs font-black text-slate-600 shrink-0">{item.quantity}x ৳{item.price}</p>
                        </div>
                     ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                     <span className="text-[9px] font-black text-slate-500 uppercase">Subtotal</span>
                     <span className="text-sm font-black text-slate-900">৳{draft.total}</span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {draft.status === 'abandoned' && hasContact ? (
                     <div className="grid grid-cols-2 gap-3">
                        <a 
                           href={`tel:${draft.customerPhone}`}
                           className="py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                           <Phone size={12} /> Call Customer
                        </a>
                        <a 
                           href={getWhatsAppLink(draft.customerPhone, draft.customerName)}
                           target="_blank"
                           rel="noreferrer"
                           className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                           <MessageSquare size={12} /> WhatsApp
                        </a>
                     </div>
                  ) : draft.status === 'recovered' ? (
                     <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-center flex items-center justify-center gap-1.5">
                        <CheckCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Order Completed & Recovered</span>
                     </div>
                  ) : (
                     <div className="bg-slate-50 border border-slate-200 text-slate-400 rounded-xl p-3 text-center flex items-center justify-center gap-1.5">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">No contact info captured yet</span>
                     </div>
                  )}

                  <button 
                     type="button"
                     onClick={() => handleDeleteDraft(draft.id)}
                     className="w-full py-2.5 bg-white text-red-500 hover:bg-red-50 border border-red-100 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-colors mt-2"
                  >
                     <Trash2 size={11} /> Delete Session Log
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
