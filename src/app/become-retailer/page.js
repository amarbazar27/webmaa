'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loginWithGoogle } from '@/lib/auth';
import { addRetailerRequest, getRetailerRequests } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Phone, Sparkles, ShieldCheck, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';

const countries = [
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh', length: 10 },
  { code: '+91', flag: '🇮🇳', name: 'India', length: 10 },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan', length: 10 },
  { code: '+1', flag: '🇺🇸', name: 'USA/Canada', length: 10 },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom', length: 10 },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia', length: 9 },
  { code: '+971', flag: '🇦🇪', name: 'UAE', length: 9 },
  { code: '+968', flag: '🇴🇲', name: 'Oman', length: 8 },
  { code: '+974', flag: '🇶🇦', name: 'Qatar', length: 8 },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait', length: 8 },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain', length: 8 },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia', length: 9 },
  { code: '+65', flag: '🇸🇬', name: 'Singapore', length: 8 },
  { code: '+39', flag: '🇮🇹', name: 'Italy', length: 10 },
  { code: '+34', flag: '🇪🇸', name: 'Spain', length: 9 },
  { code: '+33', flag: '🇫🇷', name: 'France', length: 9 },
  { code: '+49', flag: '🇩🇪', name: 'Germany', length: 10 },
  { code: '+61', flag: '🇦🇺', name: 'Australia', length: 9 },
  { code: '+81', flag: '🇯🇵', name: 'Japan', length: 10 },
  { code: '+90', flag: '🇹🇷', name: 'Turkey', length: 10 },
  { code: '+960', flag: '🇲🇻', name: 'Maldives', length: 7 },
  { code: '+27', flag: '🇿🇦', name: 'South Africa', length: 9 },
  { code: '+82', flag: '🇰🇷', name: 'South Korea', length: 9 },
  { code: '+7', flag: '🇷🇺', name: 'Russia', length: 10 },
  { code: '+55', flag: '🇧🇷', name: 'Brazil', length: 11 },
  { code: '+86', flag: '🇨🇳', name: 'China', length: 11 },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands', length: 9 },
  { code: '+32', flag: '🇧🇪', name: 'Belgium', length: 9 },
  { code: '+41', flag: '🇨🇭', name: 'Switzerland', length: 9 },
  { code: '+46', flag: '🇸🇪', name: 'Sweden', length: 9 },
  { code: '+64', flag: '🇳🇿', name: 'New Zealand', length: 9 },
  { code: '+94', flag: '🇱🇰', name: 'Sri Lanka', length: 9 },
  { code: '+977', flag: '🇳🇵', name: 'Nepal', length: 10 },
  { code: '+93', flag: '🇦🇫', name: 'Afghanistan', length: 9 },
  { code: '+20', flag: '🇪🇬', name: 'Egypt', length: 10 },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia', length: 10 },
  { code: '+63', flag: '🇵🇭', name: 'Philippines', length: 10 },
  { code: '+66', flag: '🇹🇭', name: 'Thailand', length: 9 },
  { code: '+84', flag: '🇻🇳', name: 'Vietnam', length: 9 },
  { code: '+98', flag: '🇮🇷', name: 'Iran', length: 10 },
  { code: '+964', flag: '🇮🇶', name: 'Iraq', length: 10 },
  { code: '+962', flag: '🇯🇴', name: 'Jordan', length: 9 },
  { code: '+961', flag: '🇱🇧', name: 'Lebanon', length: 8 },
  { code: '+212', flag: '🇲🇦', name: 'Morocco', length: 9 },
  { code: '+218', flag: '🇱🇾', name: 'Libya', length: 9 },
  { code: '+216', flag: '🇹🇳', name: 'Tunisia', length: 8 },
  { code: '+213', flag: '🇩🇿', name: 'Algeria', length: 9 },
  { code: '+351', flag: '🇵🇹', name: 'Portugal', length: 9 },
  { code: '+30', flag: '🇬🇷', name: 'Greece', length: 10 },
  { code: '+353', flag: '🇮🇪', name: 'Ireland', length: 9 },
  { code: '+45', flag: '🇩🇰', name: 'Denmark', length: 8 },
  { code: '+47', flag: '🇳🇴', name: 'Norway', length: 8 },
  { code: '+358', flag: '🇫🇮', name: 'Finland', length: 9 },
  { code: '+43', flag: '🇦🇹', name: 'Austria', length: 10 },
  { code: '+48', flag: '🇵🇱', name: 'Poland', length: 9 },
  { code: '+380', flag: '🇺🇦', name: 'Ukraine', length: 9 },
  { code: '+40', flag: '🇷🇴', name: 'Romania', length: 9 },
  { code: '+36', flag: '🇭🇺', name: 'Hungary', length: 9 },
  { code: '+352', flag: '🇱🇺', name: 'Luxembourg', length: 9 },
  { code: '+354', flag: '🇮🇸', name: 'Iceland', length: 9 },
  { code: '+356', flag: '🇲🇹', name: 'Malta', length: 8 },
  { code: '+370', flag: '🇱🇹', name: 'Lithuania', length: 8 },
  { code: '+371', flag: '🇱🇻', name: 'Latvia', length: 8 },
  { code: '+372', flag: '🇪🇪', name: 'Estonia', length: 7 },
  { code: '+381', flag: '🇷🇸', name: 'Serbia', length: 9 },
  { code: '+385', flag: '🇭🇷', name: 'Croatia', length: 9 },
  { code: '+386', flag: '🇸🇮', name: 'Slovenia', length: 9 },
  { code: '+359', flag: '🇧🇬', name: 'Bulgaria', length: 9 },
  { code: '+420', flag: '🇨🇿', name: 'Czech Republic', length: 9 },
  { code: '+421', flag: '🇸🇰', name: 'Slovakia', length: 9 },
  { code: '+357', flag: '🇨🇾', name: 'Cyprus', length: 8 },
  { code: '+506', flag: '🇨🇷', name: 'Costa Rica', length: 8 },
  { code: '+507', flag: '🇵🇦', name: 'Panama', length: 8 },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador', length: 9 },
  { code: '+57', flag: '🇨🇴', name: 'Colombia', length: 10 },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela', length: 10 },
  { code: '+51', flag: '🇵🇪', name: 'Peru', length: 9 },
  { code: '+56', flag: '🇨🇱', name: 'Chile', length: 9 },
  { code: '+54', flag: '🇦🇷', name: 'Argentina', length: 10 },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay', length: 8 },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay', length: 9 },
  { code: '+502', flag: '🇬🇹', name: 'Guatemala', length: 8 },
  { code: '+503', flag: '🇸🇻', name: 'El Salvador', length: 8 },
  { code: '+504', flag: '🇭🇳', name: 'Honduras', length: 8 },
  { code: '+505', flag: '🇳🇮', name: 'Nicaragua', length: 8 },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia', length: 8 },
  { code: 'other', flag: '🌐', name: 'Other (অন্যান্য)', length: 15 }
];

export default function BecomeRetailerPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading, forceUpdateAuth } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [phoneVal, setPhoneVal] = useState('');
  const [customCode, setCustomCode] = useState('+');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [mockMode, setMockMode] = useState(false);

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
            if (myReq.phone) {
              setPhone(myReq.phone);
              const matchedCountry = countries.find(c => myReq.phone.startsWith(c.code));
              if (matchedCountry) {
                setSelectedCountry(matchedCountry);
                setPhoneVal(myReq.phone.replace(matchedCountry.code, ''));
              } else {
                setPhoneVal(myReq.phone);
              }
            }
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
    
    const cleanPhoneVal = phoneVal.trim();
    if (!cleanPhoneVal) {
      toast.error('দয়া করে আপনার সচল মোবাইল নম্বরটি লিখুন।');
      return;
    }

    if (selectedCountry.code !== 'other') {
      if (cleanPhoneVal.length !== selectedCountry.length) {
        toast.error(`দয়া করে ঠিক ${selectedCountry.length} সংখ্যার নম্বর লিখুন।`);
        return;
      }
    } else {
      if (!customCode.trim() || customCode.trim() === '+') {
        toast.error('দয়া করে সঠিক কান্ট্রি কোড লিখুন। (যেমন: +৮৮০)');
        return;
      }
      if (cleanPhoneVal.length < 6 || cleanPhoneVal.length > 15) {
        toast.error('দয়া করে ৬ থেকে ১৫ সংখ্যার সঠিক মোবাইল নম্বর লিখুন।');
        return;
      }
    }

    let activeUser = user;
    let activeUserData = userData;

    if (!activeUser) {
      setLoginLoading(true);
      const toastId = toast.loading('আবেদন করার জন্য প্রথমে লগইন সম্পন্ন করুন...');
      try {
        const loginResult = await loginWithGoogle();
        if (loginResult?.user) {
          activeUser = loginResult.user;
          activeUserData = loginResult.userData;
          forceUpdateAuth(loginResult.user, loginResult.userData);
          toast.success('লগইন সফল হয়েছে!', { id: toastId });
        } else {
          toast.error('লগইন ব্যর্থ হয়েছে বা বাতিল করা হয়েছে।', { id: toastId });
          setLoginLoading(false);
          return;
        }
      } catch (err) {
        toast.error('লগইন ব্যর্থ হয়েছে।', { id: toastId });
        setLoginLoading(false);
        return;
      } finally {
        setLoginLoading(false);
      }
    }

    const codePrefix = selectedCountry.code === 'other' ? customCode.trim() : selectedCountry.code;
    const fullPhoneNumber = codePrefix + cleanPhoneVal;

    // Send OTP request to server
    if (!otpSent) {
      setSubmitting(true);
      try {
        const token = await activeUser.getIdToken();
        const response = await fetch('/api/auth/become-retailer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'send_otp',
            phone: fullPhoneNumber
          })
        });
        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || 'ভেরিফিকেশন কোড পাঠাতে ব্যর্থ হয়েছে।');
        }

        if (resData.mock) {
          setGeneratedOtp(resData.otp);
          setMockMode(true);
          toast.success(`[টেস্ট মোড] ভেরিফিকেশন কোড: ${resData.otp}`, { duration: 20000 });
        } else {
          setMockMode(false);
          toast.success('ভেরিফিকেশন কোডটি আপনার মোবাইলে পাঠানো হয়েছে।');
        }
        setOtpSent(true);
      } catch (err) {
        toast.error(err.message || 'ভেরিফিকেশন কোড পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Verify OTP code entered by user on server
    setSubmitting(true);
    try {
      const token = await activeUser.getIdToken();
      const response = await fetch('/api/auth/become-retailer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'verify_otp',
          phone: fullPhoneNumber,
          otpCode: userOtp
        })
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'ভেরিফিকেশন কোডটি সঠিক নয়।');
      }

      setSubmitted(true);
      if (resData.autoApproved) {
        setExistingStatus('approved');
        toast.success('আপনার রিটেইলার অ্যাকাউন্ট সফলভাবে সক্রিয় করা হয়েছে! 🎉');
      } else {
        setExistingStatus('pending');
        toast.success('আবেদনটি সফলভাবে জমা দেওয়া হয়েছে! 🚀');
      }
    } catch (err) {
      toast.error(err.message || 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">অপেক্ষা করুন...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-slate-100 text-slate-800 selection:bg-purple-200 selection:text-purple-900 font-sans overflow-x-hidden pb-10 flex flex-col justify-between">
      
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100 via-slate-100 to-slate-100 opacity-50"></div>

      {/* Header Bar */}
      <header className="relative z-10 w-full px-6 py-5 border-b border-slate-200 bg-white/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-slate-500 hover:text-slate-900 transition-all text-xs font-black uppercase tracking-wider">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>হোমপেজে ফিরুন</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center font-black text-xs text-white">B</div>
            <span className="font-extrabold text-xs text-slate-900">BDRetailers</span>
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="relative z-10 max-w-lg w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-slate-800">
          {/* Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500"></div>

          {(submitted && existingStatus !== 'approved') || existingStatus === 'pending' ? (
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-purple-50 border border-purple-100 rounded-full flex items-center justify-center mx-auto text-purple-600 animate-pulse">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">আবেদনটি সফলভাবে প্রক্রিয়াধীন আছে</h2>
              <p className="text-xs text-slate-600 leading-relaxed font-bold">
                ধন্যবাদ! আপনার রিটেইলার অ্যাকাউন্ট ডিলারের আবেদনটি BDRetailers এডমিন প্যানেলে জমা হয়েছে। আমাদের টীম আপনার মোবাইল নম্বরে শীঘ্রই যোগাযোগ করবে।
              </p>
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
                <p className="text-slate-500 uppercase tracking-widest font-black text-[9px]">আবেদনের বিবরণ (Application Details)</p>
                <p className="text-slate-800 font-bold"><span className="text-slate-500">নাম:</span> {user?.displayName || 'ব্যবহারকারী'}</p>
                <p className="text-slate-800 font-bold"><span className="text-slate-500">ইমেইল:</span> {user?.email}</p>
                <p className="text-slate-800 font-bold"><span className="text-slate-500">মোবাইল:</span> {phone || 'N/A'}</p>
                <p className="text-purple-600 font-extrabold mt-2 flex items-center gap-1.5"><ShieldCheck size={12} /> স্ট্যাটাস: পেন্ডিং (Pending Approval)</p>
              </div>

              <Link href="/" className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 border border-purple-500 rounded-full text-xs font-black uppercase tracking-wider text-white transition-all hover:scale-105 active:scale-95 shadow-md">
                হোমপেজে যান
              </Link>
            </div>
          ) : existingStatus === 'approved' ? (
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">আপনার আবেদন অনুমোদিত হয়েছে!</h2>
              <p className="text-xs text-slate-600 leading-relaxed font-bold">
                অভিনন্দন! আপনার আবেদনটি এডমিন দ্বারা অনুমোদিত হয়েছে। এখন আপনি আপনার BDRetailers রিটেইলার ড্যাশবোর্ডে প্রবেশ করতে পারবেন।
              </p>
              
              <Link href="/dashboard" className="inline-block px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-full text-xs font-black uppercase tracking-wider text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20">
                ড্যাশবোর্ডে প্রবেশ করুন <ChevronRight size={14} className="inline-block" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="text-center">
                <span className="inline-block px-4 py-1 rounded-full bg-purple-50 border border-purple-100 text-[9px] font-black uppercase tracking-[0.3em] text-purple-600 mb-4">
                  Merchant Partnership
                </span>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Become a Retailer</h1>
                <p className="text-xs text-slate-600 mt-3 font-bold leading-relaxed">
                  BDRetailers প্ল্যাটফর্মে আপনার দোকান লিস্টিং করে রিটেইলার হিসেবে পণ্য বিক্রি শুরু করুন।
                </p>
              </div>

              <div className="space-y-6">
                {!user ? (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-4">
                    <p className="text-xs text-slate-600 font-bold leading-relaxed">
                      আবেদন জমা দিতে প্রথমে আপনার গুগল অ্যাকাউন্ট দিয়ে লগইন সম্পন্ন করুন।
                    </p>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loginLoading}
                      className="w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all font-black text-sm shadow-xl disabled:opacity-50 cursor-pointer"
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
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 animate-fade-in">
                    <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={18} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{user.displayName || 'ব্যবহারকারী'}</p>
                      <p className="text-[10px] font-bold text-slate-500 truncate max-w-[200px]">{user.email}</p>
                    </div>
                  </div>
                )}

                {/* Country Code and Phone input block */}
                {!otpSent ? (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                      <Phone size={12} /> মোবাইল নম্বর দিন
                    </label>
                    <div className="flex gap-2">
                      <select 
                        value={selectedCountry.code}
                        onChange={e => {
                          const c = countries.find(x => x.code === e.target.value);
                          setSelectedCountry(c);
                          setPhoneVal('');
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3.5 text-slate-800 font-black text-xs outline-none focus:border-purple-500 cursor-pointer"
                      >
                        {countries.map(c => (
                          <option key={c.code} value={c.code} className="bg-white text-slate-900">
                            {c.flag} {c.code === 'other' ? 'Other' : c.code}
                          </option>
                        ))}
                      </select>
                      
                      {selectedCountry.code === 'other' ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={customCode}
                            onChange={e => {
                              let val = e.target.value;
                              if (!val.startsWith('+')) val = '+' + val.replace(/[^0-9]/g, '');
                              else val = '+' + val.slice(1).replace(/[^0-9]/g, '');
                              setCustomCode(val);
                            }}
                            placeholder="+880"
                            required
                            className="w-24 px-4 py-3.5 rounded-2xl border border-slate-300 focus:border-purple-500 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm font-black outline-none focus:ring-2 focus:ring-purple-500/20"
                          />
                          <input
                            type="tel"
                            value={phoneVal}
                            onChange={e => setPhoneVal(e.target.value.replace(/[^0-9]/g, '').slice(0, 15))}
                            placeholder="মোবাইল নম্বর দিন"
                            required
                            className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-300 focus:border-purple-500 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm font-black transition-all outline-none focus:ring-2 focus:ring-purple-500/20"
                          />
                        </div>
                      ) : (
                        <input
                          type="tel"
                          value={phoneVal}
                          onChange={e => setPhoneVal(e.target.value.replace(/[^0-9]/g, '').slice(0, selectedCountry.length))}
                          placeholder={`${selectedCountry.length} ডিজিটের মোবাইল নম্বর`}
                          required
                          className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-300 focus:border-purple-500 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm font-black transition-all outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                      * এই দেশীয় নম্বরে BDRetailers প্যানেল থেকে আপনার সাথে যোগাযোগ করা হবে।
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                       <div>
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Selected Mobile Number</p>
                         <p className="text-xs font-black text-slate-800 mt-0.5">
                           {selectedCountry.code === 'other' ? customCode : selectedCountry.code} {phoneVal}
                         </p>
                       </div>
                       <button
                         type="button"
                         onClick={() => {
                           setOtpSent(false);
                           setUserOtp('');
                         }}
                         className="text-[10px] font-black text-purple-600 hover:text-purple-500 uppercase tracking-wider transition-colors"
                       >
                         Change Number
                       </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                        ভেরিফিকেশন কোড দিন (Enter OTP)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={userOtp}
                        onChange={e => setUserOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="------"
                        required
                        className="w-full text-center tracking-[0.5em] px-5 py-3.5 rounded-2xl border border-slate-300 focus:border-purple-500 bg-slate-50 text-slate-800 placeholder-slate-400 text-lg font-black transition-all outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                      {mockMode ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 mt-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider leading-relaxed">
                            ⚠️ [টেস্ট মোড] এসএমএস গেটওয়ে সেটআপ নেই। আপনার ভেরিফিকেশন কোড: <strong className="text-white bg-amber-600 px-1.5 py-0.5 rounded font-mono">{generatedOtp}</strong>
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                          * আপনার মোবাইলে পাঠানো ৬ ডিজিটের ওটিপি কোডটি এখানে দিন।
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || checkingExisting}
                  className="w-full py-4.5 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles size={14} /> 
                      {otpSent ? 'আবেদন সাবমিট করুন (Submit Request)' : 'ভেরিফিকেশন কোড পাঠান (Send Verification Code)'}
                    </>
                  )}
                </button>
              </div>

              {/* Security Badge */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Zap size={14} className="text-purple-600" />
                  <span className="text-[9px] font-black uppercase tracking-wider leading-none">Instant Verification</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 justify-end">
                  <ShieldCheck size={14} className="text-cyan-600" />
                  <span className="text-[9px] font-black uppercase tracking-wider leading-none">Secure Session</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="relative z-10 w-full text-center py-6 border-t border-slate-200">
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
          BDRetailers Retailer Services &bull; 2026
        </p>
      </footer>
    </div>
  );
}
