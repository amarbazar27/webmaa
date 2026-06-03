'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loginWithGoogle } from '@/lib/auth';
import { addRetailerRequest, getRetailerRequests } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Phone, Sparkles, ShieldCheck, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function BecomeRetailerPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading, forceUpdateAuth } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [existingStatus, setExistingStatus] = useState(null); // 'pending' | 'approved' | 'denied' | null
  const [loginLoading, setLoginLoading] = useState(false);

  // Check if user has already submitted a request
  useEffect(() => {
    if (user) {
      setCheckingExisting(true);
      getRetailerRequests()
        .then(reqs => {
          const myReq = reqs.find(r => r.id === user.uid);
          if (myReq) {
            setExistingStatus(myReq.status || 'pending');
            if (myReq.phone) setPhone(myReq.phone);
          }
        })
        .catch(err => console.error("Error loading request status:", err))
        .finally(() => setCheckingExisting(false));
    } else {
      setExistingStatus(null);
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result?.user && result?.userData) {
        forceUpdateAuth(result.user, result.userData);
        toast.success(`লগইন সফল হয়েছে! 🎉`);
      }
    } catch (err) {
      toast.error('লগইন ব্যর্থ হয়েছে: ' + (err.message || 'সার্ভার ত্রুটি'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('আবেদন করতে প্রথমে আপনার গুগল অ্যাকাউন্ট দিয়ে লগইন করুন।');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      toast.error('দয়া করে আপনার সচল মোবাইল নম্বরটি লিখুন।');
      return;
    }

    if (cleanPhone.length < 10) {
      toast.error('দয়া করে একটি সঠিক মোবাইল নম্বর লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      // Pass user auth info and phone to Firestore helper
      const reqUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || userData?.name || 'ব্যবহারকারী',
        photoURL: user.photoURL || userData?.photoURL || ''
      };
      await addRetailerRequest(reqUser, cleanPhone);
      setSubmitted(true);
      setExistingStatus('pending');
      toast.success('আবেদনটি সফলভাবে জমা দেওয়া হয়েছে! 🚀');
    } catch (err) {
      toast.error(err.message || 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070e24]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-white/5 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">অপেক্ষা করুন...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#070e24] via-[#091535] to-[#040a17] text-slate-100 selection:bg-purple-900 selection:text-white font-sans overflow-x-hidden pb-10 flex flex-col justify-between">
      
      {/* Decorative Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

      {/* Header Bar */}
      <header className="relative z-10 w-full px-6 py-5 border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-white/60 hover:text-white transition-all text-xs font-black uppercase tracking-wider">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>হোমপেজে ফিরুন</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center font-black text-xs text-white">D</div>
            <span className="font-extrabold text-xs text-white">Daripallah</span>
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="relative z-10 max-w-lg w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-slate-950/40 border border-white/5 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          {/* Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500"></div>

          {submitted || existingStatus === 'pending' ? (
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-purple-600/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto text-purple-400 animate-pulse">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">আবেদনটি সফলভাবে প্রক্রিয়াধীন আছে</h2>
              <p className="text-xs text-white/50 leading-relaxed font-bold">
                ধন্যবাদ! আপনার রিটেইলার অ্যাকাউন্ট ডিলারের আবেদনটি দাঁড়িপাল্লা এডমিন প্যানেলে জমা হয়েছে। আমাদের টীম আপনার মোবাইল নম্বরে শীঘ্রই যোগাযোগ করবে।
              </p>
              
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left space-y-2 text-xs">
                <p className="text-white/40 uppercase tracking-widest font-black text-[9px]">আবেদনের বিবরণ (Application Details)</p>
                <p className="text-white/80 font-bold"><span className="text-white/40">নাম:</span> {user?.displayName || 'ব্যবহারকারী'}</p>
                <p className="text-white/80 font-bold"><span className="text-white/40">ইমেইল:</span> {user?.email}</p>
                <p className="text-white/80 font-bold"><span className="text-white/40">মোবাইল:</span> {phone || 'N/A'}</p>
                <p className="text-purple-400 font-extrabold mt-2 flex items-center gap-1.5"><ShieldCheck size={12} /> স্ট্যাটাস: পেন্ডিং (Pending Approval)</p>
              </div>

              <Link href="/" className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 border border-purple-500 rounded-full text-xs font-black uppercase tracking-wider text-white transition-all hover:scale-105 active:scale-95 shadow-md">
                হোমপেজে যান
              </Link>
            </div>
          ) : existingStatus === 'approved' ? (
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">আপনার আবেদন অনুমোদিত হয়েছে!</h2>
              <p className="text-xs text-white/50 leading-relaxed font-bold">
                অভিনন্দন! আপনার আবেদনটি এডমিন দ্বারা অনুমোদিত হয়েছে। এখন আপনি আপনার দাঁড়িপাল্লা রিটেইলার ড্যাশবোর্ডে প্রবেশ করতে পারবেন।
              </p>
              
              <Link href="/dashboard" className="inline-block px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-full text-xs font-black uppercase tracking-wider text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20">
                ড্যাশবোর্ডে প্রবেশ করুন <ChevronRight size={14} className="inline-block" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="text-center">
                <span className="inline-block px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-black uppercase tracking-[0.3em] text-purple-400 mb-4">
                  Merchant Partnership
                </span>
                <h1 className="text-3xl font-black tracking-tight text-white leading-none">Become a Retailer</h1>
                <p className="text-xs text-white/40 mt-3 font-bold leading-relaxed">
                  দাঁড়িপাল্লা প্ল্যাটফর্মে আপনার দোকান লিস্টিং করে রিটেইলার হিসেবে পণ্য বিক্রি শুরু করুন।
                </p>
              </div>

              {!user ? (
                <div className="space-y-6">
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl text-center space-y-4">
                    <p className="text-xs text-white/60 font-bold leading-relaxed">
                      আবেদন জমা দিতে প্রথমে আপনার সঠিক গুগল অ্যাকাউন্ট দিয়ে লগইন সম্পন্ন করুন।
                    </p>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loginLoading}
                      className="w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.98] transition-all font-black text-sm shadow-xl disabled:opacity-50 cursor-pointer"
                    >
                      {loginLoading ? (
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                          <span>Google অ্যাকাউন্ট দিয়ে লগইন করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Disabled Mobile Input Mockup to give visual feedback */}
                  <div className="space-y-2 opacity-40 pointer-events-none">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                      <Phone size={12} /> মোবাইল নম্বর দিন
                    </label>
                    <input 
                      type="text" 
                      placeholder="01XXXXXXXXX" 
                      disabled
                      className="w-full px-5 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/20 text-sm font-bold" 
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Logged in User Badge */}
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3 animate-fade-in">
                    <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={18} className="text-white/40" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{user.displayName || 'ব্যবহারকারী'}</p>
                      <p className="text-[10px] font-bold text-white/30 truncate max-w-[200px]">{user.email}</p>
                    </div>
                  </div>

                  {/* Active Phone Number Box */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                      <Phone size={12} /> মোবাইল নম্বর দিন
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                      placeholder="01XXXXXXXXX"
                      required
                      className="w-full px-5 py-3.5 rounded-2xl border border-white/10 focus:border-purple-500 bg-white/5 text-white placeholder-white/20 text-sm font-black transition-all outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider px-1">
                      * এই নম্বরে অ্যাডমিন প্যানেল থেকে আপনার সাথে যোগাযোগ করা হবে।
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || checkingExisting}
                    className="w-full py-4.5 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Sparkles size={14} /> আবেদন সাবমিট করুন (Submit Request)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Security Badge */}
              <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-white/40">
                  <Zap size={14} className="text-purple-400/80" />
                  <span className="text-[9px] font-black uppercase tracking-wider leading-none">Instant Verification</span>
                </div>
                <div className="flex items-center gap-2 text-white/40 justify-end">
                  <ShieldCheck size={14} className="text-cyan-400/80" />
                  <span className="text-[9px] font-black uppercase tracking-wider leading-none">Secure Session</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="relative z-10 w-full text-center py-6 border-t border-white/5">
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">
          Daripallah Retailer Services &bull; 2026
        </p>
      </footer>
    </div>
  );
}
