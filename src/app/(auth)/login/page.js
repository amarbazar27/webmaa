'use client';

import { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';
import { loginWithGoogle, handleLoginRedirect } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, ShieldAlert, Store, User, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user: authUser, userData: authData, loading: authLoading, forceUpdateAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [globalConfig, setGlobalConfig] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { subscribeGlobalConfig } = await import('@/lib/firestore');
        const unsub = subscribeGlobalConfig((config) => {
          setGlobalConfig(config);
        });
        return unsub;
      } catch (err) {
        console.error(err);
      }
    };
    let unsubFn;
    loadConfig().then(unsub => { unsubFn = unsub; });
    return () => { if (unsubFn) unsubFn(); };
  }, []);

  // Redirection logic — declared before useEffect to avoid hoisting issue
  const handleRedirection = useCallback((currUser, role) => {
    if (role === 'superadmin') {
      toast.success(`Welcome back Admin! 👑`);
      router.push('/superadmin');
    } else if (role === 'retailer' || role === 'staff' || role === 'admin') {
      toast.success(`Dashboard access authorized 🚀`);
      router.push('/dashboard');
    } else {
      toast.success(`স্বাগতম, ${currUser.displayName}! 🎉`);
      router.push('/');
    }
  }, [router]);

  // 1. Immediate redirect if already logged in via Context
  useEffect(() => {
    if (!authLoading && authUser && !redirecting) {
      setRedirecting(true);
      handleRedirection(authUser, authData?.role || 'user');
    }
  }, [authUser, authData, authLoading, redirecting, handleRedirection]);

  // 2. Check Redirect login on mount (Crucial for mobile in-app webview)
  useEffect(() => {
    let isMounted = true;
    const checkRedirect = async () => {
      try {
        const { checkRedirectLogin } = await import('@/lib/auth');
        const result = await checkRedirectLogin();
        if (result?.user && result?.userData && isMounted) {
          forceUpdateAuth(result.user, result.userData);
          setRedirecting(true);
          handleRedirection(result.user, result.userData.role || 'user');
        }
      } catch (err) {
        console.error('Redirect auth check error:', err);
      }
    };
    checkRedirect();
    return () => { isMounted = false; };
  }, [forceUpdateAuth, handleRedirection]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result?.user && result?.userData) {
        forceUpdateAuth(result.user, result.userData);
        setRedirecting(true);
        handleRedirection(result.user, result.userData.role || 'user');
      } else {
        // Null returned when redirect initiated or popup closed
        setLoading(false);
      }
    } catch (err) {
      toast.error('Login failed: ' + (err.message || 'Server error'));
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('ইমেইল ও পাসওয়ার্ড প্রদান করুন।');
      return;
    }
    setLoading(true);
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/auth');
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      const { handleUserSession } = await import('@/lib/auth');
      const result = await handleUserSession(userCredential.user);
      
      if (result?.user && result?.userData) {
        forceUpdateAuth(result.user, result.userData);
        setRedirecting(true);
        handleRedirection(result.user, result.userData.role || 'user');
      }
    } catch (err) {
      let errorMsg = err.message;
      if (err.code === 'auth/wrong-password') errorMsg = 'ভুল পাসওয়ার্ড';
      else if (err.code === 'auth/user-not-found') errorMsg = 'ইমেইল পাওয়া যায়নি';
      else if (err.code === 'auth/invalid-credential') errorMsg = 'ভুল ইমেইল অথবা পাসওয়ার্ড';
      toast.error('লগইন ব্যর্থ: ' + errorMsg);
      setLoading(false);
    }
  };

  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('অনুগ্রহ করে আপনার সঠিক ইমেইল প্রদান করুন।');
      return;
    }
    setLoading(true);
    try {
      const { sendPasswordReset } = await import('@/lib/auth');
      await sendPasswordReset(email);
      toast.success('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে! ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।', { duration: 7000 });
      setForgotPasswordMode(false);
    } catch (err) {
      let errorMsg = err.message;
      if (err?.code === 'auth/user-not-found') errorMsg = 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি';
      else if (err?.code === 'auth/invalid-email') errorMsg = 'সঠিক ইমেইল এড্রেস প্রদান করুন';
      toast.error('রিসেট ব্যর্থ: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin"></div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Validating Session Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Decorative Blur Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-100 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

      <div className="w-full max-w-md relative z-10 animate-slide-in">
        <div className="bg-white p-10 md:p-14 text-center rounded-[2.5rem] border border-slate-100 shadow-2xl relative overflow-hidden">
          {/* Subtle line motif */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-600 to-blue-600"></div>

          <Link href="/" className="inline-block mb-10 group">
             <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20 text-white font-black text-3xl transition-transform group-hover:scale-110">
                W
             </div>
          </Link>
          
          <h1 className="text-3xl font-black mb-3 text-slate-900 tracking-tight">System Login</h1>
          <p className="text-sm text-slate-400 mb-12 font-medium leading-relaxed">Sign in with your verified identity to access the cloud manager.</p>

          {globalConfig?.googleAuth !== false && (
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-md active:scale-[0.98] transition-all font-black text-lg disabled:opacity-50 group cursor-pointer"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  <span className="text-slate-800">Continue with Google</span>
                  <ArrowRight className="w-5 h-5 text-slate-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </>
              )}
            </button>
          )}

          {globalConfig?.googleAuth !== false && globalConfig?.emailPasswordAuth !== false && (
            <div className="flex items-center gap-4 my-8">
               <div className="flex-1 h-px bg-slate-100"></div>
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or</span>
               <div className="flex-1 h-px bg-slate-100"></div>
            </div>
          )}

          {globalConfig?.emailPasswordAuth !== false && !forgotPasswordMode && (
            <form onSubmit={handleEmailLogin} className="space-y-5 text-left">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                     type="email" 
                     required
                     placeholder="name@example.com"
                     className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all shadow-sm"
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                  />
               </div>
               
               <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                    <button 
                      type="button" 
                      onClick={() => setForgotPasswordMode(true)}
                      className="text-[11px] font-extrabold text-purple-600 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input 
                     type="password" 
                     required
                     placeholder="••••••••"
                     className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all shadow-sm"
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                  />
               </div>

               <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg disabled:opacity-60 cursor-pointer"
               >
                  {loading ? (
                     <div className="w-5 h-5 border-2 border-slate-200 border-t-white rounded-full animate-spin"></div>
                  ) : 'Sign In with Email'}
               </button>
            </form>
          )}

          {globalConfig?.emailPasswordAuth !== false && forgotPasswordMode && (
            <form onSubmit={handleResetPassword} className="space-y-5 text-left animate-slide-in">
               <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100 text-xs text-slate-600 font-medium leading-relaxed">
                  Enter your verified account email to receive a password reset authorization link.
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                     type="email" 
                     required
                     placeholder="name@example.com"
                     className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all shadow-sm"
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                  />
               </div>

               <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg disabled:opacity-60 cursor-pointer"
               >
                  {loading ? (
                     <div className="w-5 h-5 border-2 border-slate-200 border-t-white rounded-full animate-spin"></div>
                  ) : 'Send Reset Link'}
               </button>

               <div className="text-center pt-2">
                  <button 
                    type="button" 
                    onClick={() => setForgotPasswordMode(false)}
                    className="text-xs font-black text-slate-500 hover:text-slate-900 underline"
                  >
                    Remember Password? Sign In
                  </button>
               </div>
            </form>
          )}

          {globalConfig?.googleAuth === false && globalConfig?.emailPasswordAuth === false && (
            <div className="bg-slate-100 p-4 rounded-2xl text-center text-xs font-bold text-slate-500 my-4">
              লগইন সুবিধা সাময়িকভাবে বন্ধ আছে।
            </div>
          )}

          <div className="mt-12 grid grid-cols-1 gap-4 text-left">
             <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-sm shadow-purple-500/20">
                   <Zap size={20} />
                </div>
                <div>
                   <p className="font-extrabold text-slate-900 text-sm">One-Click Entry</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Automated Entitlement Check</p>
                </div>
             </div>
             
             <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                   <ShieldCheck size={20} />
                </div>
                <div>
                   <p className="font-extrabold text-slate-900 text-sm">Secure Protocols</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">End-to-End Managed Session</p>
                </div>
             </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col gap-4">
             <Link href="/register" className="text-xs font-black text-purple-600 uppercase tracking-widest hover:text-purple-700 transition-colors">Create Retailer Account</Link>
             <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] font-black">
                Daripallah Identity Services &bull; 2026
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
