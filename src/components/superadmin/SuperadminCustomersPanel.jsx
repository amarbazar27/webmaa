'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Phone, Mail, ShoppingBag, MapPin, 
  Download, Eye, X, ShieldAlert, ShieldCheck, CheckCircle2, 
  AlertTriangle, MessageCircle, ExternalLink, Calendar, 
  TrendingUp, CreditCard, Store, Loader2, Sparkles, RefreshCw
} from 'lucide-react';
import { Card, Input, Button } from '@/components/ui';
import { getAllUsers, getAllShops, getOrders, reportCustomerFraud } from '@/lib/firestore';
import toast from 'react-hot-toast';

export default function SuperadminCustomersPanel() {
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'registered' | 'buyers' | 'vip' | 'reported'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Report Modal
  const [reportModal, setReportModal] = useState({ open: false, phone: '', customerName: '', reason: 'fake_order', comment: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  const standardizePhone = (phone) => {
    if (!phone) return '';
    let cleaned = phone.toString().trim().replace(/\D/g, '');
    if (cleaned.startsWith('880')) cleaned = cleaned.slice(2);
    else if (cleaned.startsWith('80')) cleaned = '0' + cleaned.slice(2);
    else if (cleaned.startsWith('1')) cleaned = '0' + cleaned;
    if (!cleaned.startsWith('0')) cleaned = '0' + cleaned;
    return cleaned.slice(0, 11);
  };

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [allUsersData, allShopsData] = await Promise.all([
        getAllUsers(),
        getAllShops()
      ]);

      setUsers(allUsersData || []);
      setShops(allShopsData || []);

      // Fetch all orders across all shops
      const shopOrdersPromises = (allShopsData || []).map(async (shop) => {
        try {
          const orders = await getOrders(shop.id);
          return orders.map(o => ({ ...o, shopId: shop.id, shopName: shop.shopName, shopSlug: shop.shopSlug }));
        } catch {
          return [];
        }
      });

      const allOrdersArrays = await Promise.all(shopOrdersPromises);
      const allOrders = allOrdersArrays.flat();

      // Aggregate unified customer map
      const customerMap = {};

      // 1. Seed with registered users
      (allUsersData || []).forEach(u => {
        const emailKey = u.email ? u.email.toLowerCase().trim() : null;
        const stdPhone = standardizePhone(u.phone);
        const key = emailKey || (stdPhone ? `phone_${stdPhone}` : `uid_${u.uid || u.id}`);

        customerMap[key] = {
          id: u.uid || u.id,
          uid: u.uid || u.id,
          name: u.name || u.displayName || 'ব্যবহারকারী',
          email: u.email || '',
          phone: stdPhone || u.phone || '',
          address: u.address || '',
          photoURL: u.photoURL || '',
          role: u.role || 'user',
          isRegistered: true,
          registeredAt: u.createdAt,
          lastLogin: u.lastLogin,
          totalOrders: 0,
          totalSpent: 0,
          orders: [],
          shops: new Set()
        };
      });

      // 2. Cross-reference all orders from all shops
      allOrders.forEach(order => {
        const orderEmail = order.customerEmail ? order.customerEmail.toLowerCase().trim() : null;
        const stdPhone = standardizePhone(order.customerPhone);
        
        let foundKey = null;
        if (orderEmail && customerMap[orderEmail]) {
          foundKey = orderEmail;
        } else if (stdPhone) {
          // Check if any registered user has this phone
          const existingByPhone = Object.keys(customerMap).find(k => customerMap[k].phone && standardizePhone(customerMap[k].phone) === stdPhone);
          if (existingByPhone) {
            foundKey = existingByPhone;
          } else if (customerMap[`phone_${stdPhone}`]) {
            foundKey = `phone_${stdPhone}`;
          }
        }

        const orderTotal = parseFloat(order.total || 0) || 0;

        if (foundKey) {
          const cust = customerMap[foundKey];
          cust.totalOrders += 1;
          cust.totalSpent += orderTotal;
          cust.orders.push(order);
          if (order.shopName) cust.shops.add(order.shopName);
          if (!cust.phone && order.customerPhone) cust.phone = stdPhone || order.customerPhone;
          if (!cust.address && order.customerAddress) cust.address = order.customerAddress;
          if (cust.name === 'ব্যবহারকারী' && order.customerName) cust.name = order.customerName;
        } else {
          // Unregistered guest customer record
          const guestKey = orderEmail || (stdPhone ? `phone_${stdPhone}` : `order_${order.id}`);
          if (!customerMap[guestKey]) {
            customerMap[guestKey] = {
              id: guestKey,
              uid: null,
              name: order.customerName || 'সম্মানিত কাস্টমার',
              email: order.customerEmail || '',
              phone: stdPhone || order.customerPhone || '',
              address: order.customerAddress || '',
              photoURL: '',
              role: 'guest_customer',
              isRegistered: false,
              registeredAt: null,
              lastLogin: null,
              totalOrders: 1,
              totalSpent: orderTotal,
              orders: [order],
              shops: new Set(order.shopName ? [order.shopName] : [])
            };
          } else {
            const cust = customerMap[guestKey];
            cust.totalOrders += 1;
            cust.totalSpent += orderTotal;
            cust.orders.push(order);
            if (order.shopName) cust.shops.add(order.shopName);
            if (!cust.phone && order.customerPhone) cust.phone = stdPhone || order.customerPhone;
            if (!cust.address && order.customerAddress) cust.address = order.customerAddress;
          }
        }
      });

      // Convert Set of shops to Array and sort by totalSpent descending
      const customerList = Object.values(customerMap).map(c => ({
        ...c,
        shopNames: Array.from(c.shops),
        orders: c.orders.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        })
      })).sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));

      setCustomers(customerList);
    } catch (err) {
      console.error('Failed to load customers data:', err);
      toast.error('কাস্টমার তথ্য লোড করতে ত্রুটি হয়েছে।');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Search
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term || 
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.phone && c.phone.includes(term)) ||
        (c.address && c.address.toLowerCase().includes(term)) ||
        (c.shopNames && c.shopNames.some(s => s.toLowerCase().includes(term)));

      if (!matchSearch) return false;

      // Filter tab
      if (activeFilter === 'registered') return c.isRegistered;
      if (activeFilter === 'buyers') return c.totalOrders > 0;
      if (activeFilter === 'vip') return c.totalSpent >= 5000;
      return true;
    });
  }, [customers, searchTerm, activeFilter]);

  // Overall platform statistics
  const stats = useMemo(() => {
    const totalUsersCount = users.length;
    const totalBuyersCount = customers.filter(c => c.totalOrders > 0).length;
    const totalOrdersCount = customers.reduce((sum, c) => sum + c.totalOrders, 0);
    const totalPlatformLtv = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    return { totalUsersCount, totalBuyersCount, totalOrdersCount, totalPlatformLtv };
  }, [users, customers]);

  // Export CSV
  const handleExportCsv = () => {
    if (filteredCustomers.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো কাস্টমার ডাটা নেই।');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Address', 'Role', 'Is Registered', 'Total Orders', 'Total Spent (BDT)', 'Shops'];
    const rows = filteredCustomers.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${c.role || 'user'}"`,
      c.isRegistered ? 'Yes' : 'No',
      c.totalOrders,
      c.totalSpent,
      `"${c.shopNames.join(', ').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `webmaa_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('কাস্টমার লিস্ট CSV হিসেবে ডাউনলোড হয়েছে! 📥');
  };

  const handleOpenReport = (customer) => {
    setReportModal({
      open: true,
      phone: customer.phone,
      customerName: customer.name,
      reason: 'fake_order',
      comment: ''
    });
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportModal.phone) return;
    setSubmittingReport(true);
    try {
      await reportCustomerFraud(reportModal.phone, {
        shopId: 'superadmin',
        shopName: 'Superadmin Platform',
        customerName: reportModal.customerName,
        reason: reportModal.reason,
        comment: reportModal.comment
      });
      toast.success('কাস্টমার সফলভাবে সেন্ট্রাল ফ্রড ডাটাবেজে যুক্ত হয়েছে! 🛡️');
      setReportModal({ open: false, phone: '', customerName: '', reason: 'fake_order', comment: '' });
    } catch (err) {
      console.error(err);
      toast.error('রিপোর্ট জমা দিতে সমস্যা হয়েছে।');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Overview Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">রেজিস্টার্ড একাউন্ট</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalUsersCount} জন</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">সক্রিয় ক্রেতা</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalBuyersCount} জন</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট অর্ডার সংখ্যা</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalOrdersCount} টি</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">প্ল্যাটফর্ম কাস্টমার LTV</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">৳ {stats.totalPlatformLtv.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ── Main Customer List Card ── */}
      <Card
        title="সেন্ট্রাল কাস্টমার ও ইউজার ডিরেক্টরি"
        subtitle="মেইন প্ল্যাটফর্ম এবং সমস্ত রিটেইলার স্টোরের নিবন্ধিত ইউজার ও ক্রেতাদের সমন্বিত তালিকা"
        icon={Users}
        className="border border-slate-200 shadow-sm bg-white"
        headerAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>রিফ্রেশ</span>
            </Button>
            <Button
              onClick={handleExportCsv}
              size="sm"
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-sm shadow-purple-500/20"
            >
              <Download size={14} />
              <span>CSV এক্সপোর্ট</span>
            </Button>
          </div>
        }
      >
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center pb-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="নাম, ফোন, ইমেইল, এলাকা বা শপ দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: `সকল কাস্টমার (${customers.length})` },
              { id: 'registered', label: `রেজিস্টার্ড (${users.length})` },
              { id: 'buyers', label: `ক্রেতা (${stats.totalBuyersCount})` },
              { id: 'vip', label: `ভিআইপি (৳৫,০০০+)` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto pt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <Loader2 className="animate-spin text-purple-600" size={28} />
              <p className="text-xs font-black uppercase tracking-widest">কাস্টমার ডাটা লোড হচ্ছে...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Users size={36} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-500">কোনো কাস্টমার তথ্য পাওয়া যায়নি</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-4">কাস্টমার / ইউজার</th>
                  <th className="py-3 px-4">যোগাযোগ</th>
                  <th className="py-3 px-4 text-center">টাইপ / স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-center">অর্ডার সংখ্যা</th>
                  <th className="py-3 px-4 text-right">মোট ব্যয় (LTV)</th>
                  <th className="py-3 px-4">সংযুক্ত স্টোরসমূহ</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-100 text-purple-700 font-black flex items-center justify-center border border-purple-200 shrink-0">
                          {cust.photoURL ? (
                            <img src={cust.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            cust.name?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 truncate">{cust.name}</p>
                          <p className="text-[11px] text-slate-400 font-bold truncate mt-0.5">{cust.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      {cust.phone ? (
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 tracking-tight">{cust.phone}</span>
                          <a
                            href={`https://wa.me/88${standardizePhone(cust.phone)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-colors"
                            title="WhatsApp Chat"
                          >
                            <MessageCircle size={12} />
                          </a>
                          <a
                            href={`tel:${cust.phone}`}
                            className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors"
                            title="Direct Call"
                          >
                            <Phone size={12} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">N/A</span>
                      )}
                    </td>

                    {/* Role & Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {cust.isRegistered ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          <CheckCircle2 size={10} /> {cust.role === 'superadmin' ? 'Superadmin' : cust.role === 'retailer' ? 'Retailer' : 'App Member'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Store Guest
                        </span>
                      )}
                    </td>

                    {/* Orders count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block text-xs font-black px-2 py-0.5 rounded-md ${
                        cust.totalOrders > 0 ? 'bg-indigo-50 text-indigo-700 font-black border border-indigo-200' : 'text-slate-400'
                      }`}>
                        {cust.totalOrders}
                      </span>
                    </td>

                    {/* LTV */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-slate-900">৳ {cust.totalSpent.toLocaleString()}</span>
                    </td>

                    {/* Stores */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {cust.shopNames.length > 0 ? (
                          cust.shopNames.map(s => (
                            <span key={s} className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[120px]">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">—</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-purple-600 text-slate-700 hover:text-white rounded-xl text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer"
                          title="বিস্তারিত হিস্ট্রি দেখুন"
                        >
                          <Eye size={12} />
                          <span>প্রোফাইল</span>
                        </button>
                        {cust.phone && (
                          <button
                            onClick={() => handleOpenReport(cust)}
                            className="p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition-colors border border-red-200 cursor-pointer"
                            title="ফ্রড রিপোর্ট করুন"
                          >
                            <ShieldAlert size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* ── Customer Details & Full Order History Modal ── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in text-slate-900">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-purple-100 text-purple-700 font-black flex items-center justify-center border-2 border-purple-200 text-xl shrink-0 shadow-sm">
                  {selectedCustomer.photoURL ? (
                    <img src={selectedCustomer.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedCustomer.name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{selectedCustomer.name}</h3>
                    {selectedCustomer.isRegistered && (
                      <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                        {selectedCustomer.role || 'Member'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedCustomer.email || 'No email provided'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ফোন নম্বর</p>
                  <p className="text-xs font-black text-slate-900 mt-1">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট অর্ডার</p>
                  <p className="text-xs font-black text-indigo-700 mt-1">{selectedCustomer.totalOrders} টি</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট খরচ (LTV)</p>
                  <p className="text-xs font-black text-emerald-700 mt-1">৳ {selectedCustomer.totalSpent.toLocaleString()}</p>
                </div>
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ডেলিভারি ঠিকানা</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{selectedCustomer.address || 'কোনো ঠিকানা সংরক্ষিত নেই'}</p>
                </div>
              </div>

              {/* Order History Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-purple-700 flex items-center gap-1.5">
                    <ShoppingBag size={14} /> সমস্ত স্টোরের অর্ডার ইতিহাস ({selectedCustomer.orders.length})
                  </h4>
                </div>

                {selectedCustomer.orders.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-400">এই কাস্টমারের কোনো অর্ডার পাওয়া যায়নি</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.orders.map((order, idx) => (
                      <div key={order.id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                              #{order.orderIdVisual || order.id?.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-xs font-black text-slate-900">🏪 {order.shopName}</span>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                            order.status === 'completed' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                            order.status === 'cancelled' ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                          }`}>
                            {order.status || 'Pending'}
                          </span>
                        </div>

                        {/* Items list */}
                        <div className="text-xs text-slate-600 space-y-1 pl-1">
                          {order.items?.map((item, iIdx) => (
                            <p key={iIdx} className="truncate">
                              • <span className="font-bold text-slate-800">{item.name}</span> — ৳{item.price} × {item.quantity}
                            </p>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <span className="text-xs font-black text-slate-900">
                            মোট: <span className="text-purple-700">৳ {(order.total || 0).toLocaleString()}</span>
                          </span>
                          <a
                            href={`/shop/${order.shopSlug}/order/${order.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-black text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                          >
                            <span>মেমো দেখুন (Invoice)</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl text-xs font-black"
              >
                বন্ধ করুন
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Fraud Modal ── */}
      {reportModal.open && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-scale-in text-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">কাস্টমার ফ্রড রিপোর্ট</h3>
                <p className="text-xs text-slate-500 font-bold">{reportModal.phone} — {reportModal.customerName}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">রিপোর্টের কারণ</label>
                <select
                  value={reportModal.reason}
                  onChange={(e) => setReportModal({ ...reportModal, reason: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                >
                  <option value="fake_order">ভুয়া অর্ডার / অর্ডার বাতিল</option>
                  <option value="unreachable">ফোন রিসিভ করে না / ভুল নাম্বার</option>
                  <option value="refused_delivery">ডেলিভারি রিজেক্ট করেছে</option>
                  <option value="harassment">অসদাচরণ বা হুমকি</option>
                  <option value="fraud_payment">পেমেন্ট জালিয়াতি</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">বিস্তারিত মন্তব্য (ঐচ্ছিক)</label>
                <textarea
                  rows={3}
                  value={reportModal.comment}
                  onChange={(e) => setReportModal({ ...reportModal, comment: e.target.value })}
                  placeholder="ঘটনা সম্পর্কে সংক্ষেপে লিখুন..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModal({ open: false, phone: '', customerName: '', reason: 'fake_order', comment: '' })}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs transition-all cursor-pointer border border-slate-200"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-red-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submittingReport ? <Loader2 size={14} className="animate-spin" /> : 'রিপোর্ট জমা দিন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
