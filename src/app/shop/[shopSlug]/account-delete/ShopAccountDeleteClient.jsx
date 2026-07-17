'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ShieldAlert, Trash2, Mail, Info, Loader2, ArrowLeft, Key } from 'lucide-react';
import Link from 'next/link';

export default function ShopAccountDeleteClient({ shop, shopSlug }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const shopName = shop?.shopName || 'আমাদের স্টোর';
  const ownerEmail = shop?.ownerEmail || 'support@bdretailers.com';

  const handleSendCode = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'send_code' })
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'কোড পাঠাতে ব্যর্থ হয়েছে।');
      setOtpSent(true);
      toast.success(res.message || 'ভেরিফিকেশন কোড পাঠানো হয়েছে।');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !code) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'confirm_delete', code })
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'কোড ভেরিফিকেশন ব্যর্থ হয়েছে।');

      toast.success('আপনার অ্যাকাউন্টটি সফলভাবে মুছে ফেলা হয়েছে।');
      
      // Attempt client auth deletion
      try {
        await user.delete();
      } catch (authErr) {
        console.warn('Client auth deletion skipped:', authErr.message);
      }
      
      await logout();
      router.push(`/shop/${shopSlug}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-100 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-100 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

      <div className="max-w-2xl w-full mx-auto bg-white border border-slate-200/60 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative z-10">
        <Link href={`/shop/${shopSlug}`} className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-purple-600 transition-colors uppercase tracking-wider mb-8">
          <ArrowLeft size={16} /> Back to Store
        </Link>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10">
            <Trash2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Delete Your {shopName} Account</h1>
            <p className="text-xs font-black text-red-500 uppercase tracking-widest mt-1">Permanent Deletion Request</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
          If you wish to permanently delete your {shopName} customer account and associated personal data, follow the instructions below. Please note that this action is irreversible.
        </p>

        {user ? (
          <div className="bg-red-50/50 border border-red-200/60 p-6 rounded-3xl space-y-6">
            <div className="flex gap-3">
              <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-extrabold text-red-950 text-sm">স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলুন (Instant Delete)</h3>
                <p className="text-xs text-red-800 font-bold mt-1">লগইন করা ইমেইল: <span className="font-mono">{user.email}</span></p>
              </div>
            </div>

            {!otpSent ? (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-red-700/80 font-bold leading-relaxed">
                  নিচের বাটনে ক্লিক করলে আপনার ইমেইলে একটি ভেরিফিকেশন কোড পাঠানো হবে। কোডটি নিশ্চিত করার সাথে সাথে আপনার অ্যাকাউন্ট এবং পার্সোনাল ডেটা চিরতরে মুছে ফেলা হবে।
                </p>
                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-500/10 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'ভেরিফিকেশন কোড পাঠান'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-red-700 uppercase tracking-widest ml-1">৬ ডিজিট ভেরিফিকেশন কোড</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="••••••"
                    value={code}
                    className="w-full px-5 py-3.5 bg-white border border-red-200 rounded-2xl text-sm font-bold outline-none focus:border-red-600 text-center tracking-widest"
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <p className="text-[9px] text-red-700/70 font-bold mt-1">
                    ⚠️ ওটিপি (OTP) না পেলে দয়া করে আপনার ইমেইলের **Spam (স্প্যাম) ফোল্ডার** চেক করুন।
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setOtpSent(false)}
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    পিছনে যান
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={submitting || code.length < 6}
                    className="flex-2 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-500/10 disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : 'নিশ্চিত ও স্থায়ীভাবে মুছুন'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-purple-50 border border-purple-100 flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl text-purple-600 border border-purple-100 shadow-sm shrink-0">
                <Info size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-slate-900 text-sm">তাত্ক্ষণিকভাবে মুছে ফেলতে লগইন করুন</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">অ্যাকাউন্ট ভেরিফিকেশন সাপেক্ষে স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট মুছে ফেলুন।</p>
                <Link
                  href={`/shop/${shopSlug}`}
                  className="mt-3.5 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs transition-all active:scale-95 inline-block text-center cursor-pointer"
                >
                  স্টোরে লগইন করুন
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Mail size={16} className="text-purple-600" /> ম্যানুয়াল অনুরোধ জানানোর উপায় (Manual Request)
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                If you do not want to log in, you can email us to delete your account manually:
              </p>
              
              <ul className="text-xs text-slate-600 font-bold bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-2.5 list-disc pl-6 leading-relaxed">
                <li>Email us at: <span className="font-mono text-purple-600">{ownerEmail}</span> or <span className="font-mono text-purple-600">missionedu306@gmail.com</span></li>
                <li>Use the subject: <span className="text-slate-900 font-extrabold">Account Deletion Request</span></li>
                <li>Include the email address or phone number associated with your account.</li>
                <li>Your account and associated personal data will be deleted within 7 working days.</li>
              </ul>
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pt-6 mt-8">
          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest mb-3">Data Retention Policy</h4>
          <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
            The following data may be retained where required by law: completed order invoices, tax records, and fraud prevention logs.
          </p>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8">
        {shopName} Identity Services &bull; 2026
      </div>
    </div>
  );
}
