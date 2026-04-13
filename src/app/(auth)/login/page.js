'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithGoogle, handleLoginRedirect, getUserData } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, ShieldAlert, Store, User, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user: authUser, userData: authData, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // 1. Immediate redirect if already logged in via Context
  useEffect(() => {
    if (!authLoading && authUser && authData && !redirecting) {
      setRedirecting(true);
      handleRedirection(authUser, authData.role || 'user');
    }
  }, [authUser, authData, authLoading, router]);

  const handleRedirection = (currUser, role) => {
    if (role === 'superadmin') {
      toast.success(`Welcome back Admin! 👑`);
      router.push('/superadmin');
    } else if (role === 'retailer') {
      toast.success(`Dashboard access authorized 🚀`);
      router.push('/dashboard');
    } else {
      toast.success(`স্বাগতম, ${currUser.displayName}! 🎉`);
      router.push('/');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result?.user && result?.userData) {
        handleRedirection(result.user, result.userData.role || 'user');
      }
    } catch (err) {
      toast.error('Login failed: ' + (err.message || 'Server error'));
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

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4.5 px-6 rounded-2xl flex items-center justify-center gap-4 bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all font-black text-lg shadow-xl shadow-slate-200 disabled:opacity-50 group"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                <span>Continue with Google</span>
                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </>
            )}
          </button>

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
                Webmaa Identity Services &bull; 2026
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
