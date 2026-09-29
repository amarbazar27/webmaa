'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { loginWithGoogle } from '@/lib/auth';
import toast from 'react-hot-toast';
import { ShieldAlert, Trash2, Mail, Info, Loader2, ArrowLeft, Globe } from 'lucide-react';
import Link from 'next/link';

export default function AccountDeletePage() {
  const { user, userData, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      if (!response.ok) throw new Error(res.error || t('কোড পাঠাতে ব্যর্থ হয়েছে।', 'Failed to send verification code.'));
      setOtpSent(true);
      toast.success(res.message || t('ভেরিফিকেশন কোড পাঠানো হয়েছে।', 'Verification code sent to your email.'));
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
      if (!response.ok) throw new Error(res.error || t('কোড ভেরিফিকেশন ব্যর্থ হয়েছে।', 'Verification failed.'));

      toast.success(t('আপনার অ্যাকাউন্টটি সফলভাবে মুছে ফেলা হয়েছে।', 'Your account has been successfully deleted.'));
      
      try {
        await user.delete();
      } catch (authErr) {
        console.warn('Client auth user deletion skipped:', authErr.message);
      }
      
      await logout();
      router.push('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result?.user) {
        toast.success(t('সফলভাবে লগইন করা হয়েছে।', 'Signed in successfully.'));
      }
    } catch (err) {
      toast.error(t('লগইন ব্যর্থ হয়েছে: ', 'Login failed: ') + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-100 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-100 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

      <div className="max-w-2xl w-full mx-auto bg-white border border-slate-200/60 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-purple-600 transition-colors uppercase tracking-wider">
            <ArrowLeft size={16} /> {t('হোম পেজে ফিরুন', 'Back to Home')}
          </Link>

          <button
            onClick={toggleLanguage}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
            title="Change Language / ভাষা পরিবর্তন"
          >
            <Globe size={13} />
            <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10 shrink-0">
            <Trash2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {t('অ্যাকাউন্ট মুছে ফেলুন', 'Delete Your Account')}
            </h1>
            <p className="text-xs font-black text-red-500 uppercase tracking-widest mt-1">
              {t('স্থায়ী অ্যাকাউন্ট মোছার অনুরোধ', 'Permanent Deletion Request')}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
          {t(
            'আপনি যদি স্থায়ীভাবে আপনার BDRetailers অ্যাকাউন্ট এবং সংশ্লিষ্ট ব্যক্তিগত তথ্য মুছে ফেলতে চান, তবে নিচের নির্দেশাবলী অনুসরণ করুন। দয়া করে মনে রাখবেন এই কাজটি অপরিবর্তনীয়।',
            'If you wish to permanently delete your BDRetailers account and associated personal data, follow the instructions below. Please note that this action is irreversible.'
          )}
        </p>

        {user ? (
          <div className="bg-red-50/50 border border-red-200/60 p-6 rounded-3xl space-y-6">
            <div className="flex gap-3">
              <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-extrabold text-red-950 text-sm">
                  {t('স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলুন (Instant Delete)', 'Instant Permanent Deletion')}
                </h3>
                <p className="text-xs text-red-800 font-bold mt-1">
                  {t('লগইন করা ইমেইল: ', 'Signed in as: ')}<span className="font-mono">{user.email}</span>
                </p>
              </div>
            </div>

            {!otpSent ? (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-red-700/80 font-bold leading-relaxed">
                  {t(
                    'নিচের বাটনে ক্লিক করলে আপনার ইমেইলে একটি ভেরিফিকেশন কোড পাঠানো হবে। কোডটি নিশ্চিত করার সাথে সাথে আপনার অ্যাকাউন্ট এবং দোকান সম্পর্কিত সকল ডেটা ডাটাবেজ থেকে চিরতরে মুছে ফেলা হবে।',
                    'Clicking the button below will dispatch a 6-digit confirmation code to your email. Confirming the code will immediately and permanently purge your account and store data.'
                  )}
                </p>
                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-500/10 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : t('ভেরিফিকেশন কোড পাঠান', 'Send Verification Code')}
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-red-700 uppercase tracking-widest ml-1">
                    {t('৬ ডিজিট ভেরিফিকেশন কোড', '6-Digit Verification Code')}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="••••••"
                    value={code}
                    className="w-full px-5 py-3.5 bg-white border border-red-200 rounded-2xl text-sm font-bold outline-none focus:border-red-600 text-center tracking-widest"
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <p className="text-[9px] text-red-700/70 font-bold mt-1">
                    {t(
                      '⚠️ ওটিপি (OTP) না পেলে দয়া করে আপনার ইমেইলের Spam (স্প্যাম) ফোল্ডার চেক করুন।',
                      '⚠️ If you do not see the email, please check your Spam / Junk folder.'
                    )}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setOtpSent(false)}
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    {t('পিছনে যান', 'Go Back')}
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={submitting || code.length < 6}
                    className="flex-2 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-500/10 disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : t('নিশ্চিত ও স্থায়ীভাবে মুছুন', 'Confirm & Delete Permanently')}
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
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {t('তাত্ক্ষণিকভাবে মুছে ফেলতে লগইন করুন', 'Sign In for Instant Automated Deletion')}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {t('অ্যাকাউন্ট ভেরিফিকেশন সাপেক্ষে স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট মুছে ফেলুন।', 'Sign in to authenticate ownership and delete immediately.')}
                </p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="mt-3.5 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs transition-all active:scale-95 cursor-pointer"
                >
                  {t('সাইন ইন করুন', 'Sign In with Google')}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Mail size={16} className="text-purple-600" /> {t('ম্যানুয়াল অনুরোধ জানানোর উপায় (Manual Request)', 'Submit Manual Deletion Request')}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {t(
                  'আপনি যদি লগইন করতে না চান, তবে ইমেলের মাধ্যমে অ্যাকাউন্ট মুছে ফেলার অনুরোধ পাঠাতে পারেন:',
                  'If you prefer not to sign in, send an email request to our support team:'
                )}
              </p>
              
              <ul className="text-xs text-slate-600 font-bold bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-2.5 list-disc pl-6 leading-relaxed">
                <li>{t('ইমেইল পাঠান:', 'Email us at:')} <span className="font-mono text-purple-600">bdretailers26@gmail.com</span></li>
                <li>{t('ইমেইল সাবজেক্ট:', 'Email Subject:')} <span className="text-slate-900 font-extrabold">Account Deletion Request</span></li>
                <li>{t('আপনার অ্যাকাউন্টের সাথে যুক্ত মোবাইল নম্বর বা ইমেইল উল্লেখ করুন।', 'Specify the phone number and email registered with the store.')}</li>
                <li>{t('আপনার সকল ব্যক্তিগত ডেটা ৭ কার্যদিবসের মধ্যে স্থায়ীভাবে মুছে ফেলা হবে।', 'All data will be permanently cleared within 7 business days.')}</li>
              </ul>
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pt-6 mt-8">
          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest mb-3">
            {t('আইনগতভাবে সংরক্ষিত ডেটা (Data Retention Policy)', 'Legal Data Retention Policy')}
          </h4>
          <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
            {t(
              'আইনগত বাধ্যবাধকতা ও প্রতারণা প্রতিরোধের স্বার্থে সম্পন্ন হওয়া অর্ডারের ইনভয়েস এবং ট্যাক্স রেকর্ড নির্দিষ্ট মেয়াদে সংরক্ষিত থাকতে পারে।',
              'Certain transaction records, including completed tax invoices and fraud prevention audit logs, may be retained for statutory legal compliance.'
            )}
          </p>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8">
        BDRetailers Platform &bull; {new Date().getFullYear()}
      </div>
    </div>
  );
}
