'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loginWithGoogle } from '@/lib/auth';
import { Store, ShieldCheck, Zap, Globe, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result?.user) {
        toast.success("Welcome aboard! 🚀 Account initialized.");
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error('Registration failed: ' + (err.message || 'Server error'));
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("সকল তথ্য পূরণ করুন।");
      return;
    }
    if (password.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ ডিজিটের হতে হবে।");
      return;
    }
    setLoading(true);
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { auth } = await import('@/lib/auth');
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, { displayName: name.trim() });
      
      const { handleUserSession } = await import('@/lib/auth');
      await handleUserSession(userCredential.user);
      
      toast.success("Welcome aboard! 🚀 Account initialized.");
      router.push('/dashboard');
    } catch (err) {
      let errorMsg = err.message;
      if (err.code === 'auth/email-already-in-use') errorMsg = 'এই ইমেইলটি ইতিপূর্বে ব্যবহার করা হয়েছে';
      else if (err.code === 'auth/weak-password') errorMsg = 'পাসওয়ার্ড অতি দুর্বল';
      toast.error('নিবন্ধন ব্যর্থ: ' + errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Soft Background Accents */}
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-purple-100 blur-[130px] rounded-full opacity-60"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-blue-100 blur-[130px] rounded-full opacity-60"></div>

        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10 animate-slide-in">
          <div className="space-y-10 text-center lg:text-left">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 shadow-sm">
                <Sparkles size={12} /> Strategic Partnership
             </div>
             
             <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95]">
                Launch your <br />
                <span className="text-purple-600">Premium Shop</span> <br />
                in seconds.
             </h1>
             
             <p className="text-xl text-slate-500 max-w-md mx-auto lg:mx-0 font-medium leading-relaxed">
                Join the Daripallah merchant network and drive your business with world-class cloud tools.
             </p>

             <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto lg:mx-0 text-left">
                {[
                  { icon: ShieldCheck, title: 'Verified Security', desc: 'Enterprise data sovereignty for your brand.' },
                  { icon: Zap, title: 'Instant Activation', desc: 'Automated shop scaffolding for rapid launch.' },
                  { icon: Globe, title: 'Edge Delivery', desc: 'Ultra-low latency content for global users.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-white/50 rounded-2xl border border-slate-100">
                     <div className="p-2.5 bg-white rounded-xl text-purple-600 border border-slate-100 shadow-sm">
                        <item.icon size={18} />
                     </div>
                     <div>
                        <h4 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-1.5">{item.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white p-10 md:p-14 border border-slate-100 rounded-[3rem] shadow-2xl relative overflow-hidden">
             {/* Gradient accent */}
             <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 animate-pulse"></div>
             
             <div className="text-center mb-12">
                <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-slate-200">
                   <Store size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Merchant Access</h2>
                <p className="text-sm text-slate-400 mt-2 font-medium uppercase tracking-[0.1em]">Create your digital identity</p>
             </div>

             <div className="space-y-6">
                 <button 
                    onClick={handleRegister}
                    disabled={loading || authLoading}
                    className="w-full h-16 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl font-black text-lg flex items-center justify-center gap-4 active:scale-95 transition-all shadow-md shadow-slate-100 disabled:opacity-50 group cursor-pointer"
                 >
                    {loading ? (
                      <Loader2 className="animate-spin text-slate-800" size={24} />
                    ) : (
                      <>
                         <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                         <span className="text-slate-800">Continue with Google</span>
                      </>
                    )}
                 </button>

                 <div className="flex items-center gap-4 py-4">
                    <div className="flex-1 h-px bg-slate-100"></div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-slate-100"></div>
                 </div>

                 <form onSubmit={handleEmailRegister} className="space-y-4 text-left">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                       <input 
                          type="text" 
                          required
                          placeholder="John Doe"
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all shadow-sm"
                          value={name}
                          onChange={e => setName(e.target.value)}
                       />
                    </div>

                    <div className="space-y-1">
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
                    
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
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
                       disabled={loading || authLoading}
                       className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg disabled:opacity-60 cursor-pointer"
                    >
                       {loading ? (
                          <div className="w-5 h-5 border-2 border-slate-200 border-t-white rounded-full animate-spin"></div>
                       ) : 'Sign Up with Email'}
                    </button>
                 </form>

                <div className="flex items-center gap-4 py-4">
                   <div className="flex-1 h-px bg-slate-100"></div>
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Entry Options</span>
                   <div className="flex-1 h-px bg-slate-100"></div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   <Link href="/login" className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 transition-all">
                      Already have an account? Sign In
                   </Link>
                </div>
             </div>

             <p className="mt-12 text-[9px] text-slate-300 text-center leading-relaxed font-black uppercase tracking-[0.2em] max-w-[250px] mx-auto">
                By initiating registration, you agree to our <br />
                <span className="text-purple-600">Platform Terms</span> and <span className="text-purple-600">Merchant Policies</span>.
             </p>
          </div>
        </div>
    </div>
  );
}
