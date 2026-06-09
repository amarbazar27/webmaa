'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  subscribeWallet, 
  subscribeWalletTransactions, 
  subscribeWithdrawalRequests, 
  createWithdrawalRequest, 
  getShop 
} from '@/lib/firestore';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, 
  XCircle, AlertCircle, RefreshCw, Send, Landmark, Smartphone 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const { activeShopId } = useAuth();
  const [shop, setShop] = useState(null);
  const [wallet, setWallet] = useState({ walletBalance: 0, pendingBalance: 0, withdrawableBalance: 0, totalEarned: 0 });
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activeShopId) return;

    getShop(activeShopId).then(setShop);

    const unsubWallet = subscribeWallet(activeShopId, (walletData) => {
      setWallet(walletData);
    });

    const unsubTxs = subscribeWalletTransactions(activeShopId, (txsData) => {
      setTransactions(txsData);
    });

    const unsubWithdrawals = subscribeWithdrawalRequests(activeShopId, (withdrawalsData) => {
      setWithdrawals(withdrawalsData);
      setLoading(false);
    });

    return () => {
      unsubWallet();
      unsubTxs();
      unsubWithdrawals();
    };
  }, [activeShopId]);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!activeShopId || !shop) return;

    const requestAmount = parseFloat(amount);
    if (isNaN(requestAmount) || requestAmount <= 0) {
      toast.error('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন!');
      return;
    }

    if (requestAmount > wallet.withdrawableBalance) {
      toast.error('উত্তোলনযোগ্য ব্যালেন্সের চেয়ে বেশি টাকা তুলতে পারবেন না!');
      return;
    }

    if (!paymentDetails.trim()) {
      toast.error('অনুগ্রহ করে অ্যাকাউন্ট ডিটেইলস (যেমন মোবাইল নাম্বার বা ব্যাংক অ্যাকাউন্ট) প্রদান করুন!');
      return;
    }

    setSubmitting(true);
    try {
      await createWithdrawalRequest(
        activeShopId,
        shop.shopName || 'Unknown Shop',
        requestAmount,
        paymentMethod,
        paymentDetails
      );
      toast.success('টাকা উত্তোলনের আবেদনটি সফলভাবে জমা হয়েছে! এডমিন শীঘ্রই প্রসেস করবেন।');
      setAmount('');
      setPaymentDetails('');
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error('আবেদন জমা দিতে সমস্যা হয়েছে, দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">সফল ✅</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">অপেক্ষমাণ ⏳</span>;
      case 'cancelled':
      case 'rejected':
        return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">বাতিল ❌</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Assembling Wallet Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Retailer Wallet (আমার ওয়ালেট)</h1>
        <p className="text-sm text-slate-500 font-medium">আপনার অনলাইন আয়ের হিসাব, ট্রানজ্যাকশন এবং টাকা উত্তোলনের হিস্ট্রি।</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Withdrawable Balance */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
            <Wallet size={150} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest opacity-80 flex items-center gap-1.5"><CheckCircle size={14} /> Withdrawable Balance (উত্তোলনযোগ্য)</p>
          <h2 className="text-4xl font-black mt-4">৳{wallet.withdrawableBalance || 0}</h2>
          <p className="text-[10px] font-medium opacity-75 mt-2">অর্ডার সফলভাবে ডেলিভারি হওয়ার পর এই টাকাটি উইথড্র করতে পারবেন।</p>
        </div>

        {/* Pending Balance */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={14} className="text-amber-500" /> Pending Balance (পেন্ডিং)</p>
          <h2 className="text-4xl font-black text-slate-900 mt-4">৳{wallet.pendingBalance || 0}</h2>
          <p className="text-[10px] text-slate-400 font-medium mt-2">অনলাইন পেমেন্ট করা অর্ডারসমূহ যা ডেলিভারি হওয়া এখনও বাকি আছে।</p>
        </div>

        {/* Total Lifetime Earnings */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ArrowUpRight size={14} className="text-purple-600" /> Total Earnings (সর্বমোট আয়)</p>
          <h2 className="text-4xl font-black text-slate-900 mt-4">৳{wallet.totalEarned || 0}</h2>
          <p className="text-[10px] text-slate-400 font-medium mt-2">দারিপাল্লা মার্কেটপ্লেস থেকে আপনার এখন পর্যন্ত মোট সফল আয়ের পরিমাণ।</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Withdraw request form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4"><Send size={18} className="text-purple-600"/> Withdraw Money (টাকা তুলুন)</h2>
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">টাকার পরিমাণ (৳)</label>
                <input
                  required
                  type="number"
                  min="50"
                  step="1"
                  placeholder="উইথড্র করতে ইচ্ছুক টাকার অঙ্ক"
                  className="w-full text-base font-bold text-slate-900 p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-purple-500 transition-all placeholder:text-slate-400"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">নূন্যতম উইথড্র সীমা: ৳৫০</span>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">পেমেন্ট মেথড</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'bKash', label: 'বিকাশ', icon: Smartphone },
                    { id: 'Nagad', label: 'নগদ', icon: Smartphone },
                    { id: 'Rocket', label: 'রকেট', icon: Smartphone },
                    { id: 'Bank', label: 'ব্যাংক এ্যাকাউন্ট', icon: Landmark }
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === method.id
                            ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Icon size={14} />
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">অ্যাকাউন্ট বিবরণ (Account Details)</label>
                <textarea
                  required
                  rows={3}
                  placeholder={
                    paymentMethod === 'Bank' 
                      ? 'ব্যাংক নাম, ব্রাঞ্চ, অ্যাকাউন্ট নাম এবং অ্যাকাউন্ট নাম্বার লিখুন।' 
                      : 'বিকাশ/নগদ/রকেট মোবাইল অ্যাকাউন্ট নাম্বারটি লিখুন।'
                  }
                  className="w-full text-xs font-bold text-slate-900 p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-purple-500 transition-all placeholder:text-slate-400"
                  value={paymentDetails}
                  onChange={e => setPaymentDetails(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || wallet.withdrawableBalance <= 0}
                className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 ${
                  wallet.withdrawableBalance > 0
                    ? 'bg-slate-900 text-white hover:bg-purple-600 shadow-md'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {submitting ? 'প্রসেসিং হচ্ছে...' : 'আবেদন পাঠান'}
              </button>

              {wallet.withdrawableBalance <= 0 && (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-2">
                  <AlertCircle size={12}/> আপনার উইথড্র করার মতো পর্যাপ্ত ব্যালেন্স নেই।
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Transactions list & withdrawal history */}
        <div className="lg:col-span-8 space-y-6">
          {/* Withdrawal requests history */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4"><RefreshCw size={18} className="text-amber-500"/> Withdrawal History (উত্তোলনের আবেদনসমূহ)</h2>
            {withdrawals.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                <Clock size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">কোনো টাকা উত্তোলনের আবেদন পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="pb-1 px-3">তারিখ</th>
                      <th className="pb-1 px-3">পদ্ধতি</th>
                      <th className="pb-1 px-3">অ্যাকাউন্ট</th>
                      <th className="pb-1 px-3 text-right">টাকা (৳)</th>
                      <th className="pb-1 px-3 text-right">অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <td className="py-3 px-3 rounded-l-xl text-xs font-bold text-slate-500">
                          {w.createdAt?.toDate ? w.createdAt.toDate().toLocaleDateString('en-GB') : 'সদ্য তৈরি'}
                        </td>
                        <td className="py-3 px-3 text-xs font-black text-slate-800">{w.paymentMethod}</td>
                        <td className="py-3 px-3 text-xs font-medium text-slate-600 truncate max-w-[150px]" title={w.paymentDetails}>
                          {w.paymentDetails}
                        </td>
                        <td className="py-3 px-3 text-xs font-black text-slate-900 text-right">৳{w.amount}</td>
                        <td className="py-3 px-3 rounded-r-xl text-right">{getStatusBadge(w.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transactions list */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4"><RefreshCw size={18} className="text-purple-600"/> Transaction Logs (লেনদেনের খতিয়ান)</h2>
            {transactions.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                <Clock size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">কোনো ট্রানজ্যাকশন রেকর্ড পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="pb-1 px-3">তারিখ</th>
                      <th className="pb-1 px-3">অর্ডার আইডি</th>
                      <th className="pb-1 px-3">বিবরণ</th>
                      <th className="pb-1 px-3 text-right">আয় (৳)</th>
                      <th className="pb-1 px-3 text-right">অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <td className="py-3 px-3 rounded-l-xl text-xs font-bold text-slate-500">
                          {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString('en-GB') : 'সদ্য তৈরি'}
                        </td>
                        <td className="py-3 px-3 text-xs font-black text-slate-800">{tx.orderId || 'N/A'}</td>
                        <td className="py-3 px-3 text-xs font-medium text-slate-600 leading-tight">
                          {tx.description}
                        </td>
                        <td className="py-3 px-3 text-xs font-black text-emerald-600 text-right">
                          ৳{tx.amount}
                        </td>
                        <td className="py-3 px-3 rounded-r-xl text-right">{getStatusBadge(tx.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
