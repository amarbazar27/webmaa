'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getOrders, reportCustomerFraud, getShop } from '@/lib/firestore';
import { 
  Users, Mail, Phone, ShoppingBag, Calendar, Search, MapPin, TrendingUp, 
  CreditCard, ShieldAlert, ShieldCheck, Star, AlertTriangle, MessageSquare, 
  Download, Filter, CheckCircle2, Ban, Eye, X, Loader2
} from 'lucide-react';
import { Card, Input, Button } from '@/components/ui';
import toast from 'react-hot-toast';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CustomersPage() {
  const { user, activeShopId } = useAuth();
  const [shop, setShop] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState('all'); // 'all' | 'vip' | 'verified' | 'high_risk' | 'blacklisted'
  
  // Fraud Profiles listener
  const [fraudProfiles, setFraudProfiles] = useState({});
  const [blacklistedPhones, setBlacklistedPhones] = useState([]);

  // Report Modal State
  const [reportModal, setReportModal] = useState({ open: false, phone: '', customerName: '', reason: 'fake_order', comment: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  // Selected Customer Details Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const standardizePhone = (phone) => {
    if (!phone) return '';
    let cleaned = phone.trim().replace(/\D/g, '');
    if (cleaned.startsWith('880')) cleaned = cleaned.slice(2);
    else if (cleaned.startsWith('80')) cleaned = '0' + cleaned.slice(2);
    else if (cleaned.startsWith('1')) cleaned = '0' + cleaned;
    if (!cleaned.startsWith('0')) cleaned = '0' + cleaned;
    return cleaned.slice(0, 11);
  };

  useEffect(() => {
    if (!activeShopId) return;

    getShop(activeShopId).then(data => {
      setShop(data);
      if (data?.blacklistedCustomers) {
        setBlacklistedPhones(data.blacklistedCustomers);
      }
    });

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const orders = await getOrders(activeShopId);
        
        // Extract unique customers from orders
        const customerMap = {};
        orders.forEach(order => {
          const rawPhone = order.customerPhone || '';
          const stdPhone = standardizePhone(rawPhone);
          const key = stdPhone || order.customerEmail || 'unknown';
          
          if (!customerMap[key]) {
            customerMap[key] = {
              id: key,
              name: order.customerName || 'সম্মানিত কাস্টমার',
              phone: stdPhone || rawPhone,
              email: order.customerEmail || '',
              address: order.customerAddress || '',
              totalOrders: 1,
              totalSpent: parseFloat(order.total || 0),
              lastOrderAt: order.createdAt,
              orders: [order]
            };
          } else {
            customerMap[key].totalOrders += 1;
            customerMap[key].totalSpent += parseFloat(order.total || 0);
            customerMap[key].orders.push(order);
            if (!customerMap[key].email && order.customerEmail) {
              customerMap[key].email = order.customerEmail;
            }
            if (!customerMap[key].address && order.customerAddress) {
              customerMap[key].address = order.customerAddress;
            }
          }
        });

        const customerList = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
        setCustomers(customerList);

        // Realtime Fraud Profile Listeners for all phones
        const phones = customerList.map(c => c.phone).filter(Boolean);
        if (phones.length > 0) {
          phones.forEach(phone => {
            const docRef = doc(db, 'fraud_profiles', phone);
            onSnapshot(docRef, (snap) => {
              if (snap.exists()) {
                setFraudProfiles(prev => ({ ...prev, [phone]: snap.data() }));
              }
            });
          });
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [user, activeShopId]);

  const handleOpenReportModal = (customer) => {
    setReportModal({
      open: true,
      phone: customer.phone,
      customerName: customer.name,
      reason: 'fake_order',
      comment: ''
    });
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportModal.phone) return;
    setSubmittingReport(true);
    try {
      await reportCustomerFraud(reportModal.phone, {
        shopId: activeShopId,
        shopName: shop?.shopName || 'BDRetailers Store',
        customerName: reportModal.customerName,
        reason: reportModal.reason,
        comment: reportModal.comment
      });
      toast.success('কাস্টমার রিপোর্ট সফলভাবে ফ্রড ডাটাবেজে যুক্ত হয়েছে! 🛡️');
      setReportModal({ open: false, phone: '', customerName: '', reason: 'fake_order', comment: '' });
    } catch (err) {
      console.error(err);
      toast.error('রিপোর্ট জমা দিতে সমস্যা হয়েছে।');
    } finally {
      setSubmittingReport(false);
    }
  };

  const toggleBlacklistCustomer = async (phone) => {
    if (!activeShopId || !phone) return;
    const isCurrentlyBlacklisted = blacklistedPhones.includes(phone);
    const shopRef = doc(db, 'shops', activeShopId);
    try {
      if (isCurrentlyBlacklisted) {
        await updateDoc(shopRef, { blacklistedCustomers: arrayRemove(phone) });
        setBlacklistedPhones(prev => prev.filter(p => p !== phone));
        toast.success('কাস্টমার ব্লকলিস্ট থেকে মুক্ত করা হয়েছে');
      } else {
        await updateDoc(shopRef, { blacklistedCustomers: arrayUnion(phone) });
        setBlacklistedPhones(prev => [...prev, phone]);
        toast.error('কাস্টমারকে আপনার শপের ব্লকলিস্টে যুক্ত করা হয়েছে 🚫');
      }
    } catch (err) {
      toast.error('ব্লকলিস্ট আপডেট ব্যর্থ হয়েছে');
    }
  };

  const getCustomerBadge = (customer) => {
    const isBlacklisted = blacklistedPhones.includes(customer.phone);
    const fraudData = fraudProfiles[customer.phone];
    const fraudReportsCount = fraudData?.reports?.length || 0;

    if (isBlacklisted) {
      return { label: 'ব্লকলিস্টেড', type: 'blacklisted', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: Ban };
    }
    if (fraudReportsCount > 0) {
      return { label: `হাই রিস্ক (${fraudReportsCount} রিপোর্ট)`, type: 'high_risk', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: ShieldAlert };
    }
    if (customer.totalSpent >= 4000 || customer.totalOrders >= 3) {
      return { label: 'ভিআইপি বায়ার', type: 'vip', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Star };
    }
    return { label: 'ভেরিফাইড কাস্টমার', type: 'verified', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: ShieldCheck };
  };

  const exportToCSV = () => {
    if (customers.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো কাস্টমার ডেটা নেই!');
      return;
    }
    const headers = ['Name', 'Phone', 'Email', 'Total Orders', 'Total Spent (BDT)', 'Address', 'Status'];
    const rows = customers.map(c => {
      const badge = getCustomerBadge(c);
      return [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${c.phone}"`,
        `"${c.email}"`,
        c.totalOrders,
        c.totalSpent,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        `"${badge.label}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('কাস্টমার ডেটা সফলভাবে CSV ফাইলে ডাউনলোড হয়েছে! 📥');
  };

  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || (
      (c.name || '').toLowerCase().includes(term) ||
      (c.phone || '').includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.address || '').toLowerCase().includes(term)
    );

    if (!matchesSearch) return false;

    if (selectedBadgeFilter === 'all') return true;
    const badge = getCustomerBadge(c);
    return badge.type === selectedBadgeFilter;
  });

  return (
    <div className="space-y-8 animate-slide-in pb-12">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">কাস্টমার ডেটাবেজ ও ফ্রড প্রোটেকশন (Customer CRM & Fraud Shield)</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">কাস্টমার অ্যানালিটিক্স, ভিআইপি স্কোর, রিপোর্ট ও ওয়ান-ট্যাপ যোগাযোগ</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportToCSV}
            className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-black rounded-2xl text-xs flex items-center gap-2 border border-slate-200 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Download size={16} />
            <span>CSV এক্সপোর্ট</span>
          </button>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card title={customers.length} subtitle="মোট রেজিস্টার্ড কাস্টমার" icon={Users} className="border-l-4 border-l-purple-500 shadow-sm" />
        <Card 
          title={`৳${customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}`} 
          subtitle="মোট লাইফটাইম সেলস ভ্যালু" 
          icon={TrendingUp} 
          className="border-l-4 border-l-blue-500 shadow-sm" 
        />
        <Card 
          title={`৳${customers.length > 0 ? (customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(0) : 0}`} 
          subtitle="গড় অর্ডার মূল্য (AOV)" 
          icon={CreditCard} 
          className="border-l-4 border-l-emerald-500 shadow-sm" 
        />
      </div>

      {/* Search & Badges Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="bg-white border border-slate-100 p-2 rounded-2xl flex-1 flex items-center gap-3 shadow-sm">
          <div className="pl-4 text-slate-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="কাস্টমারের নাম, ফোন নম্বর, ঠিকানা বা ইমেইল দিয়ে খুঁজুন..." 
            className="bg-transparent border-none outline-none w-full py-2.5 text-sm font-bold text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'সকল কাস্টমার' },
            { id: 'vip', label: '⭐ VIP বায়ার' },
            { id: 'verified', label: '🛡️ ভেরিফাইড' },
            { id: 'high_risk', label: '⚠️ হাই রিস্ক' },
            { id: 'blacklisted', label: '🚫 ব্লকলিস্টেড' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedBadgeFilter(f.id)}
              className={`px-3 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border cursor-pointer ${
                selectedBadgeFilter === f.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Processing Customer Records...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white py-20 text-center border-dashed border-2 border-slate-100 rounded-3xl">
          <Users size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="text-lg font-black text-slate-900">কোনো কাস্টমার পাওয়া যায়নি</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">অর্ডার প্লেস হলে কাস্টমার প্রোফাইল স্বয়ংক্রিয়ভাবে তৈরি হবে।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((customer) => {
            const badge = getCustomerBadge(customer);
            const BadgeIcon = badge.icon;
            const isBlacklisted = blacklistedPhones.includes(customer.phone);
            const cleanPhone = customer.phone.startsWith('0') ? `88${customer.phone}` : customer.phone;

            return (
              <div key={customer.id} className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Profile Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-lg border border-purple-100 shadow-xs shrink-0">
                      {customer.name[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-slate-900 text-base">{customer.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badge.color}`}>
                          <BadgeIcon size={12} />
                          <span>{badge.label}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1 flex-wrap">
                        <span className="flex items-center gap-1"><Phone size={12} className="text-purple-500" /> {customer.phone}</span>
                        {customer.email && <span className="flex items-center gap-1"><Mail size={12} className="text-blue-500" /> {customer.email}</span>}
                        {customer.address && <span className="flex items-center gap-1"><MapPin size={12} className="text-emerald-500" /> {customer.address}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Middle Engagement Stats */}
                  <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-2xl border border-slate-100 self-start lg:self-auto">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">মোট অর্ডার</p>
                      <p className="text-sm font-black text-slate-900">{customer.totalOrders} টি</p>
                    </div>
                    <div className="border-l border-slate-200 pl-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">লাইফটাইম সেলস</p>
                      <p className="text-sm font-black text-purple-700">৳{customer.totalSpent.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {customer.phone && (
                      <>
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black border border-emerald-200 flex items-center gap-1.5 transition-all shadow-xs"
                          title="WhatsApp Message"
                        >
                          <MessageSquare size={14} />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:${customer.phone}`}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-black border border-blue-200 flex items-center gap-1.5 transition-all shadow-xs"
                          title="Call Customer"
                        >
                          <Phone size={14} />
                          <span>কল করুন</span>
                        </a>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenReportModal(customer)}
                      className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-black border border-amber-200 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Report Customer for Fraud"
                    >
                      <ShieldAlert size={14} />
                      <span>রিপোর্ট / ফ্ল্যাগ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleBlacklistCustomer(customer.phone)}
                      className={`px-3 py-2 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        isBlacklisted
                          ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                      }`}
                      title={isBlacklisted ? 'Unblock Customer' : 'Blacklist Customer'}
                    >
                      <Ban size={14} />
                      <span>{isBlacklisted ? 'আনব্লক' : 'ব্লকলিস্ট'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(customer)}
                      className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-black border border-purple-200 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="View Orders History"
                    >
                      <Eye size={14} />
                      <span>অর্ডার হিস্ট্রি</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Report / Fraud Modal ── */}
      {reportModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert size={22} />
                <h3 className="text-lg font-black text-slate-900">কাস্টমার ফ্রড রিপোর্ট</h3>
              </div>
              <button onClick={() => setReportModal({ open: false, phone: '', customerName: '', reason: 'fake_order', comment: '' })} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 text-xs font-medium text-rose-800 space-y-1">
              <p className="font-bold">🚨 রিপোর্ট সতর্কবার্তা:</p>
              <p>রিপোর্ট জমা দিলে এই ফোন নম্বরের বিরুদ্ধে ফ্রড অ্যালার্ট যুক্ত হবে এবং অন্যান্য মার্চেন্টরা সতর্ক হতে পারবে।</p>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">কাস্টমার ফোন নম্বর</label>
                <input type="text" readOnly value={reportModal.phone} className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-700 outline-none" />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">রিপোর্টের কারণ</label>
                <select
                  value={reportModal.reason}
                  onChange={e => setReportModal({ ...reportModal, reason: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="fake_order">🚫 ভুয়া অর্ডার / কাল্পনিক ঠিকানা (Fake Order)</option>
                  <option value="refused_delivery">📦 পার্সেল রিসিভ না করা / ইচ্ছাকৃত রিটার্ন (Return Abuser)</option>
                  <option value="phone_switched_off">📞 ফোনে যোগাযোগ না হওয়া (Unreachable Phone)</option>
                  <option value="scam_payment">💳 পেমেন্ট প্রতারণা / ফেক ট্রানজেকশন (Payment Scam)</option>
                  <option value="abusive_behavior">⚠️ কাস্টমার কেয়ারে অশালীন আচরণ</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">বিস্তারিত বিবরণ (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="কী ধরণের সমস্যা হয়েছে বিস্তারিত লিখুন..."
                  value={reportModal.comment}
                  onChange={e => setReportModal({ ...reportModal, comment: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReportModal({ open: false, phone: '', customerName: '', reason: 'fake_order', comment: '' })}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200"
                >
                  বাতিল
                </button>
                <Button type="submit" loading={submittingReport} variant="danger" className="px-6">
                  রিপোর্ট সাবমিট করুন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Customer Orders Timeline Modal ── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedCustomer.name}-এর অর্ডার হিস্ট্রি</h3>
                <p className="text-xs text-slate-400 font-medium">ফোন: {selectedCustomer.phone} | মোট অর্ডার: {selectedCustomer.orders.length} টি</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {selectedCustomer.orders.map((order, idx) => (
                <div key={order.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-700">#{order.id?.slice(0, 8)}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
                      {order.status || 'pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                    <span>তারিখ: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                    <span className="font-black text-slate-900">৳{order.total || 0}</span>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <p className="text-[11px] text-slate-500 truncate">
                      আইটেম: {order.items.map(i => `${i.name} (x${i.quantity || 1})`).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
