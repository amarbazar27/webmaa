"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, LayoutDashboard, ArrowRight, Store, LogOut,
  Globe, Zap, ShieldCheck, Rocket, Sparkles, TrendingUp,
  Smartphone, BarChart3, Users, CheckCircle, Star, ChevronRight,
  Package, CreditCard, Headphones, Mail, MessageSquare, Phone
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logoutUser, loginWithGoogle } from '@/lib/auth';
import { addRetailerRequest, subscribeGlobalConfig } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestPhone, setRequestPhone] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
 
  useEffect(() => {
    return subscribeGlobalConfig(setGlobalConfig);
  }, []);

  // Update mouse position for glowing cursor effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const getDashboardHref = () => {
    if (userData?.role === 'superadmin') return '/superadmin';
    if (userData?.role === 'retailer') return '/dashboard';
    if (userData?.role === 'staff') return '/dashboard';
    return null;
  };

  const handleSmartLogin = async () => {
    setLoggingIn(true);
    try {
      const result = await loginWithGoogle();
      const role = result?.userData?.role;
      if (role === 'superadmin') router.push('/superadmin');
      else if (role === 'retailer' || role === 'staff') router.push('/dashboard');
    } catch (err) {} finally {
      setLoggingIn(false);
    }
  };

  const handleRequestClick = async () => {
    let currentUser = user;
    if (!currentUser) {
      try {
        const result = await loginWithGoogle();
        currentUser = result.user;
      } catch (err) {
        toast.error('লগইন ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
        return;
      }
    }
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    let currentUser = user;
    if (!currentUser) return;
    setRequesting(true);
    try {
      await addRetailerRequest(currentUser, requestPhone.trim());
      toast.success('আবেদন জমা দেওয়া হয়েছে! অ্যাডমিন শীঘ্রই যাচাই করবেন। 🙏');
      setShowRequestModal(false);
      setRequestPhone('');
    } catch (err) {
      toast.error(err.message || 'আবেদন জমা দিতে সমস্যা হয়েছে।');
      if (err.message.includes('অনুমোদিত')) setShowRequestModal(false);
    } finally {
      setRequesting(false);
    }
  };

  const features = [
    {
      icon: Rocket,
      title: "1-Click Launch",
      desc: "Transform your physical business into a scalable online empire without writing a single line of code.",
      color: "from-[#ef4444] to-[#f97316]",
      shadow: "shadow-[#ef4444]"
    },
    {
      icon: Smartphone,
      title: "Native PWA Experience",
      desc: "Instant app installation directly from the browser. Lightning fast, offline-ready, and push-notification capable.",
      color: "from-[#3b82f6] to-[#0ea5e9]",
      shadow: "shadow-[#3b82f6]"
    },
    {
      icon: TrendingUp,
      title: "Precision Analytics",
      desc: "Google Analytics 4 & MS Clarity built-in. Watch your customers behave in real-time with heatmap recording.",
      color: "from-[#10b981] to-[#14b8a6]",
      shadow: "shadow-[#10b981]"
    },
    {
      icon: Users,
      title: "Role-Based Staff",
      desc: "Delegate efficiently. Specific dashboards for your staff to manage orders securely without admin access.",
      color: "from-[#f59e0b] to-[#eab308]",
      shadow: "shadow-[#f59e0b]"
    },
    {
      icon: Sparkles,
      title: "GPT-4 AI Assistant",
      desc: "Train an active AI with your inventory. It replies to your customers 24/7 with custom pricing knowledge.",
      color: "from-[#8b5cf6] to-[#c084fc]",
      shadow: "shadow-[#8b5cf6]"
    },
    {
      icon: ShieldCheck,
      title: "Ironclad Security",
      desc: "Cryptographically secure requests, PIN-locked order status modification, and fully sandboxed environments.",
      color: "from-[#64748b] to-[#94a3b8]",
      shadow: "shadow-[#64748b]"
    }
  ];

  return (
    <div className="min-h-screen relative bg-[#030014] text-white selection:bg-purple-900 selection:text-white font-sans overflow-hidden">
      
      {/* ── Keyframe Injector ── */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --magic-blue: #3b82f6;
          --magic-purple: #8b5cf6;
          --magic-pink: #ec4899;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
        .magic-bg {
          background: linear-gradient(
            to right,
            var(--magic-blue),
            var(--magic-purple),
            var(--magic-pink),
            var(--magic-purple),
            var(--magic-blue)
          );
          -webkit-background-clip: text;
          color: transparent;
          background-size: 200% auto;
          animation: gradient-x 3s linear infinite;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}} />

      {/* ── Dynamic Cursor Glow ── */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.07), transparent 40%)`
        }}
      />

      {/* ── Background Blobs ── */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob" />
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cyan-600/30 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-600/30 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob animation-delay-4000" />

      {/* ── Session Bar ── */}
      {user && (
        <div className="fixed top-6 right-6 z-50 animate-float" style={{ animationDuration: '4s' }}>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-sm">
              {userData?.name?.[0] || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-white/90 leading-tight">{userData?.name || user.email}</p>
              <p className="text-[9px] text-purple-400 font-black uppercase tracking-widest">{userData?.role || 'User'}</p>
            </div>
            <div className="w-[1px] h-5 bg-white/10 mx-1" />
            <button onClick={logoutUser} className="text-[10px] font-bold text-white/50 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-1">
              <LogOut size={12} /> Exit
            </button>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="relative z-40 max-w-7xl mx-auto px-6 pt-8">
        <div className="flex justify-between items-center glass-panel rounded-full px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(255,255,255,0.5)]">W</div>
            <span className="text-xl font-black tracking-tight">Webmaa</span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-widest text-white/70">Pro</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-bold text-white/60 hover:text-white uppercase tracking-widest transition-colors">Architecture</a>
            <a href="#showcase" className="text-xs font-bold text-white/60 hover:text-white uppercase tracking-widest transition-colors">Showcase</a>
            {user && getDashboardHref() ? (
              <Link href={getDashboardHref()} className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-xs font-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                <LayoutDashboard size={14} /> Workspace
              </Link>
            ) : !user ? (
              <button onClick={handleSmartLogin} disabled={loggingIn} className="flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white transition-colors uppercase tracking-widest">
                {loggingIn ? "Connecting..." : "Portal Login"} <ArrowRight size={14} />
              </button>
            ) : null}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">Next Generation Commerce</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[1.05] mb-8">
          Build Your Store.<br />
          <span className="magic-bg">Dominate The Market.</span>
        </h1>

        <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
          Experience the ultimate fusion of performance, design, and AI. Deploy a fully functional, enterprise-grade e-commerce platform in exactly zero clicks.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link
            href="/demo"
            className="group relative px-8 py-4 rounded-full text-sm font-black flex items-center justify-center gap-2 bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">Explore Alpha Build <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          {userData?.role === 'retailer' || userData?.role === 'superadmin' ? (
            <Link
              href={userData?.role === 'superadmin' ? "/superadmin" : "/dashboard"}
              className="group px-8 py-4 rounded-full text-sm font-black flex items-center justify-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur"
            >
              <LayoutDashboard size={16} className="text-purple-400" /> Enter Workspace
            </Link>
          ) : (
            <button
              onClick={handleRequestClick}
              disabled={requesting}
              className="group px-8 py-4 rounded-full text-sm font-black flex items-center justify-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur disabled:opacity-50"
            >
              <Store size={16} className="text-cyan-400" /> Request Deployment License
            </button>
          )}
        </div>
      </div>

      {/* ── Architecture/Features Grid ── */}
      <div id="features" className="relative z-20 max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Engineered for Scale</h2>
          <p className="text-white/40 font-medium">Under the hood of every Webmaa storefront.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative glass-panel p-8 rounded-[2rem] hover:-translate-y-2 transition-transform duration-500 overflow-hidden"
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-[5deg] transition-all duration-500 shadow-lg ${feature.shadow}/30`}>
                <feature.icon size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black mb-3">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed font-medium group-hover:text-white/70 transition-colors">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Promoted Shops Showcase ── */}
      {(globalConfig?.promotedLinks && globalConfig.promotedLinks.length > 0) && (
        <div id="showcase" className="relative z-20 py-32 border-t border-white/10 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Elite Merchants</h2>
               <p className="text-white/40 font-medium">Stores powering their infrastructure via Webmaa.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {globalConfig.promotedLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="group glass-panel p-6 rounded-3xl flex items-center gap-5 hover:bg-white/5 transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] w-full sm:w-[350px]">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-inner border border-white/10 group-hover:border-white/30 transition-colors">
                    <Globe size={24} className="text-white/50 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/50 transition-all">{link.title}</h4>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">Open Store <ArrowUpRight size={10} /></p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Waitlist Footer CTA ── */}
      <div className="relative z-20 py-32 border-t border-white/5">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-3xl opacity-50 mb-[-50px]" />
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">Stop Building.<br/>Start Selling.</h2>
            <button
              onClick={handleRequestClick}
              disabled={requesting}
              className="px-10 py-5 rounded-full text-base font-black bg-white text-black hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-50"
            >
              Get Beta Access
            </button>
         </div>
      </div>

      {/* ── Contact Protocol ── */}
      <footer className="relative z-20 border-t border-white/10 py-12 bg-black/50 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white text-black rounded-md flex items-center justify-center font-black text-[10px]">W</div>
            <span className="text-xs font-black text-white/40 tracking-widest uppercase">Webmaa Protocol</span>
          </div>
          
          <div className="flex items-center gap-6">
             {globalConfig?.contactWa && (
               <a href={`https://wa.me/${globalConfig.contactWa.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors"><Phone size={18} /></a>
             )}
             {globalConfig?.contactFb && (
               <a href={globalConfig.contactFb} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors"><MessageSquare size={18} /></a>
             )}
             {globalConfig?.contactEmail && (
               <a href={`mailto:${globalConfig.contactEmail}`} className="text-white/40 hover:text-white transition-colors"><Mail size={18} /></a>
             )}
          </div>
        </div>
      </footer>

      {/* ── Request Modal ── */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="glass-panel border-white/20 rounded-3xl p-8 max-w-sm w-full relative animate-float shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <button onClick={() => setShowRequestModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <LogOut className="rotate-180" size={20} />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
               <ShieldCheck size={20} className="text-white" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Secure Line</h3>
            <p className="text-white/50 text-xs font-bold mb-6 leading-relaxed">Provide your contact number. Our deployment team will reach out to provision your instance.</p>
            
            <input 
              type="tel" 
              maxLength={11}
              placeholder="01XXXXXXXXX" 
              value={requestPhone}
              onChange={(e) => setRequestPhone(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl mb-4 font-black text-white outline-none focus:border-purple-500 focus:bg-white/5 transition-all text-center tracking-widest"
            />
            <button 
              onClick={handleSubmitRequest}
              disabled={requesting || requestPhone.length < 11}
              className="w-full py-4 bg-white text-black rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              {requesting ? 'Provisioning...' : 'Request Instance'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
