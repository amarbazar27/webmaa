"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, LayoutDashboard, ArrowRight, Store, LogOut,
  Globe, Zap, ShieldCheck, Rocket, Sparkles, TrendingUp,
  Smartphone, BarChart3, Users, CheckCircle, Star, ChevronRight,
  Package, CreditCard, Headphones, Mail, MessageSquare, Phone, ArrowUpRight,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logoutUser, loginWithGoogle } from '@/lib/auth';
import { addRetailerRequest, subscribeGlobalConfig } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import Image from 'next/image';

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
      if (!result) return;
      
      const role = result?.userData?.role;
      if (role === 'superadmin') router.push('/superadmin');
      else if (role === 'retailer' || role === 'staff') router.push('/dashboard');
      else toast.success(`স্বাগতম, ${result.user.displayName}!`);
    } catch (err) {
      console.error("[SmartLogin] Error:", err);
      toast.error(err.message || 'লগইন করতে সমস্যা হয়েছে।');
    } finally {
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
      toast.success('আপনার অনুরোধ সফলভাবে জমা হয়েছে! অ্যাডমিন শীঘ্রই যাচাই করবেন। 🙏');
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
      color: "from-rose-500 to-orange-500",
      shadow: "shadow-rose-500/20"
    },
    {
      icon: Smartphone,
      title: "Native PWA Experience",
      desc: "Instant app installation directly from the browser. Lightning fast, offline-ready, and push-notification capable.",
      color: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/20"
    },
    {
      icon: TrendingUp,
      title: "Precision Analytics",
      desc: "Google Analytics 4 & MS Clarity built-in. Watch your customers behave in real-time with heatmap recording.",
      color: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/20"
    },
    {
      icon: Users,
      title: "Role-Based Staff",
      desc: "Delegate efficiently. Specific dashboards for your staff to manage orders securely without admin access.",
      color: "from-amber-500 to-yellow-500",
      shadow: "shadow-amber-500/20"
    },
    {
      icon: Sparkles,
      title: "GPT-4 AI Assistant",
      desc: "Train an active AI with your inventory. It replies to your customers 24/7 with custom pricing knowledge.",
      color: "from-purple-500 to-pink-500",
      shadow: "shadow-purple-500/20"
    },
    {
      icon: ShieldCheck,
      title: "Ironclad Security",
      desc: "Cryptographically secure requests, PIN-locked order status modification, and fully sandboxed environments.",
      color: "from-slate-500 to-slate-700",
      shadow: "shadow-slate-500/20"
    }
  ];

  const socialLinks = [
    { 
      name: 'Facebook', 
      icon: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, 
      color: '#1877F2', 
      url: globalConfig?.contactFb || '#' 
    },
    { 
      name: 'Instagram', 
      icon: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>, 
      color: '#E4405F', 
      url: '#' 
    },
    { 
      name: 'LinkedIn', 
      icon: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, 
      color: '#0077B5', 
      url: '#' 
    },
    { 
      name: 'YouTube', 
      icon: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>, 
      color: '#FF0000', 
      url: '#' 
    },
    { 
      name: 'WhatsApp', 
      icon: MessageCircle, 
      color: '#25D366', 
      url: globalConfig?.contactWa ? `https://wa.me/${globalConfig.contactWa.replace(/[^0-9]/g, '')}` : '#' 
    },
    { 
      name: 'TikTok', 
      icon: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>, 
      color: '#FFFFFF', 
      url: '#' 
    },
  ];

  return (
    <div className="min-h-screen relative bg-[#030014] text-white selection:bg-purple-900 selection:text-white font-sans overflow-x-hidden">
      
      {/* ── Keyframe Injector ── */}
      <style dangerouslySetInnerHTML={{__html: `
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
        @keyframes gradient-text {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-text {
          background-size: 200% auto;
          animation: gradient-text 4s linear infinite;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .hero-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
        }
        .magazine-heading {
          line-height: 0.9;
          letter-spacing: -0.04em;
        }
      `}} />

      {/* ── Dynamic Cursor Glow ── */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.05), transparent 40%)`
        }}
      />

      {/* ── Background Blobs ── */}
      <div className="fixed inset-0 -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-blob" />
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      <div className="fixed bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000" />

      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center glass-panel rounded-full px-8 py-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <Logo href="/" className="text-white scale-110" />
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[11px] font-black text-white/50 hover:text-white uppercase tracking-[0.2em] transition-all">Home</a>
            <a href="#features" className="text-[11px] font-black text-white/50 hover:text-white uppercase tracking-[0.2em] transition-all">Architecture</a>
            <a href="#showcase" className="text-[11px] font-black text-white/50 hover:text-white uppercase tracking-[0.2em] transition-all">Showcase</a>
            <a href="#contact" className="text-[11px] font-black text-white/50 hover:text-white uppercase tracking-[0.2em] transition-all">Contact</a>
            
            <div className="w-[1px] h-4 bg-white/10 mx-2" />
            
            {user && getDashboardHref() ? (
              <Link href={getDashboardHref()} className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-xs font-black hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                <LayoutDashboard size={14} /> Workspace
              </Link>
            ) : !user ? (
              <button onClick={handleSmartLogin} disabled={loggingIn} className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-full text-xs font-black hover:bg-purple-500 hover:scale-105 transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                {loggingIn ? "Connecting..." : "Portal Login"} <ArrowRight size={14} />
              </button>
            ) : (
              <button onClick={logoutUser} className="text-[11px] font-black text-red-400/80 hover:text-red-400 uppercase tracking-[0.2em] transition-all">Sign Out</button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative z-20 pt-52 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-left animate-slide-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/60">The Future of Digital Commerce</span>
            </div>

            <h1 className="text-7xl md:text-[110px] font-black tracking-tighter magazine-heading mb-10">
              CRAFT YOUR<br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-text">DIGITAL EMPIRE.</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/40 max-w-xl font-medium leading-relaxed mb-14">
              Deploy a high-performance, AI-driven storefront in seconds. Designed for merchants who demand absolute aesthetic and technical perfection.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/demo"
                className="group relative px-10 py-5 rounded-2xl text-sm font-black flex items-center justify-center gap-3 bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">Launch Alpha Experience <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <button
                onClick={handleRequestClick}
                disabled={requesting}
                className="group px-10 py-5 rounded-2xl text-sm font-black flex items-center justify-center gap-3 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-xl disabled:opacity-50"
              >
                <Store size={18} className="text-cyan-400" /> Get Early Access
              </button>
            </div>
            
            <div className="mt-16 flex items-center gap-6 opacity-40">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#030014] bg-slate-800" />
                ))}
              </div>
              <p className="text-sm font-bold tracking-tight">Trusted by 500+ premium retailers worldwide</p>
            </div>
          </div>

          <div className="relative lg:block hidden">
            <div className="absolute -inset-4 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 blur-[100px] -z-10 animate-float" />
            <div className="glass-panel rounded-[3rem] p-4 p-b-0 overflow-hidden shadow-2xl border-white/10 rotate-2 hover:rotate-0 transition-transform duration-700">
               <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden">
                  <Image 
                    src="/webmaa_hero_v3_1777693927857.png" 
                    alt="Webmaa UI" 
                    fill 
                    className="object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-transparent to-transparent" />
                  
                  <div className="absolute bottom-8 left-8 right-8 p-6 glass-panel rounded-3xl border-white/10 animate-float">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">System Status</span>
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          All Nodes Active
                       </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 w-[85%] rounded-full" />
                    </div>
                  </div>
               </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 glass-panel rounded-3xl border-white/10 flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
              <Zap size={40} className="text-yellow-400 fill-yellow-400/20" />
            </div>
            <div className="absolute bottom-20 -left-16 px-6 py-4 glass-panel rounded-2xl border-white/10 animate-float" style={{ animationDelay: '2s' }}>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle size={16} className="text-white" />
                 </div>
                 <p className="text-xs font-black uppercase tracking-widest text-white/80">Order Sync Success</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 py-20 border-y border-white/5 bg-white/[0.01]">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Uptime', val: '99.99%', sub: 'Global Availability' },
              { label: 'Latency', val: '<25ms', sub: 'Instant Edge Rendering' },
              { label: 'Transactions', val: '$5.4M+', sub: 'Processed Weekly' },
              { label: 'Merchant Growth', val: '314%', sub: 'Average YOY' },
            ].map((stat, i) => (
              <div key={i} className="group">
                 <p className="text-4xl md:text-5xl font-black mb-2 tracking-tighter group-hover:scale-110 transition-transform">{stat.val}</p>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{stat.label}</p>
                 <p className="text-[9px] font-bold text-purple-500/60 tracking-widest">{stat.sub}</p>
              </div>
            ))}
         </div>
      </section>

      {/* ── Architecture/Features Grid ── */}
      <section id="features" className="relative z-20 max-w-7xl mx-auto px-6 py-40">
        <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-32">
          <div className="max-w-3xl">
            <h2 className="text-6xl md:text-[120px] font-black tracking-tighter magazine-heading mb-10">
              BUILT FOR<br />
              <span className="text-white/10 uppercase italic">Infinite Scale.</span>
            </h2>
            <p className="text-2xl text-white/30 font-medium leading-relaxed">
              Every component is a masterpiece of engineering. From sub-millisecond edge rendering to autonomous AI agents that sell while you sleep.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative glass-panel p-12 rounded-[4rem] hover:-translate-y-4 transition-all duration-700 overflow-hidden border-white/5 hover:border-white/20 hover:shadow-[0_0_80px_rgba(139,92,246,0.1)]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-700`} />
              
              <div className={`w-20 h-20 rounded-[2rem] bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-12 group-hover:scale-110 group-hover:rotate-[15deg] transition-all duration-700 shadow-2xl ${feature.shadow}`}>
                <feature.icon size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl font-black mb-6 tracking-tight">{feature.title}</h3>
              <p className="text-base text-white/30 leading-relaxed font-medium group-hover:text-white/70 transition-colors">{feature.desc}</p>
              
              <div className="mt-12 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white/10 group-hover:text-white transition-colors">
                 Deep Dive <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Promoted Shops Showcase ── */}
      {(globalConfig?.promotedLinks && globalConfig.promotedLinks.length > 0) && (
        <section id="showcase" className="relative z-20 py-40 bg-white/[0.01] border-y border-white/5 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[180px] -z-10" />
          
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-32 gap-10">
               <div className="text-left">
                  <span className="inline-block px-5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 mb-8">The Registry</span>
                  <h2 className="text-6xl md:text-9xl font-black tracking-tighter magazine-heading uppercase">Elite<br />Merchants</h2>
               </div>
               <div className="md:text-right max-w-sm">
                  <p className="text-lg text-white/20 font-bold leading-snug">
                     A curated selection of the world's most innovative brands running on the Webmaa protocol.
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {globalConfig.promotedLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="group relative glass-panel p-10 rounded-[3rem] flex flex-col items-start gap-8 hover:bg-white/5 transition-all hover:-translate-y-2 hover:shadow-[0_0_100px_rgba(255,255,255,0.05)] border-white/5">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-white/10 group-hover:border-purple-500/50 transition-all">
                    <Globe size={32} className="text-white/20 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-black group-hover:text-white transition-all tracking-tight">{link.title}</h4>
                    <p className="text-[11px] text-white/20 font-black uppercase tracking-[0.3em] mt-4 flex items-center gap-2 group-hover:text-purple-400 transition-colors">
                       Secure Endpoint <ArrowUpRight size={12} />
                    </p>
                  </div>
                  <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Waitlist Footer CTA ── */}
      <section className="relative z-20 py-64 overflow-hidden">
         <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple-600/10 rounded-full blur-[250px] -z-10" />
            <h2 className="text-7xl md:text-[140px] font-black tracking-tighter magazine-heading mb-16 uppercase italic leading-none">
               Don't Wait.<br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/20">Dominate.</span>
            </h2>
            <button
              onClick={handleRequestClick}
              disabled={requesting}
              className="group relative px-20 py-8 rounded-[2rem] text-xl font-black bg-white text-black hover:scale-105 transition-all shadow-[0_0_80px_rgba(255,255,255,0.4)] disabled:opacity-50"
            >
              INITIALIZE PROTOCOL
            </button>
         </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="relative z-20 border-t border-white/5 pt-32 pb-16 bg-black">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">
              <div className="lg:col-span-2">
                 <Logo href="/" className="text-white scale-[1.5] origin-left mb-12" />
                 <p className="text-2xl text-white/20 max-w-lg font-medium leading-relaxed mb-12 italic">
                    "The first e-commerce protocol designed for the high-end retailer. Built for speed, scaled with AI, and secured by default."
                 </p>
                 
                 <div className="flex flex-wrap gap-6">
                    {socialLinks.map((social, i) => (
                      <a 
                        key={i} 
                        href={social.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center hover:scale-110 transition-all shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:border-white/20"
                        style={{ color: social.color }}
                        title={social.name}
                      >
                         <social.icon size={24} strokeWidth={2.5} />
                      </a>
                    ))}
                 </div>
              </div>
              
              <div>
                 <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/10 mb-10">Ecosystem</h4>
                 <ul className="space-y-5">
                    <li><a href="#" className="text-base font-bold text-white/30 hover:text-white transition-colors">Developer Docs</a></li>
                    <li><a href="#" className="text-base font-bold text-white/30 hover:text-white transition-colors">Retailer Hub</a></li>
                    <li><a href="#" className="text-base font-bold text-white/30 hover:text-white transition-colors">Merchant Portal</a></li>
                    <li><a href="#" className="text-base font-bold text-white/30 hover:text-white transition-colors">Node Status</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/10 mb-10">Contact</h4>
                 <ul className="space-y-6">
                    {globalConfig?.contactEmail && (
                      <li className="flex items-center gap-4 text-base font-bold text-white/30 group hover:text-white transition-colors cursor-pointer">
                         <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                            <Mail size={18} />
                         </div>
                         <span>{globalConfig.contactEmail}</span>
                      </li>
                    )}
                    {globalConfig?.contactWa && (
                      <li className="flex items-center gap-4 text-base font-bold text-white/30 group hover:text-white transition-colors cursor-pointer">
                         <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <MessageCircle size={18} />
                         </div>
                         <span>{globalConfig.contactWa}</span>
                      </li>
                    )}
                 </ul>
              </div>
           </div>
           
           <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">W</div>
                 <span className="text-[11px] font-black text-white/10 tracking-[0.5em] uppercase">Webmaa Global Protocol © {new Date().getFullYear()}</span>
              </div>
              <div className="flex gap-12">
                 <a href="#" className="text-[11px] font-black text-white/10 uppercase tracking-widest hover:text-white transition-colors">Terms</a>
                 <a href="#" className="text-[11px] font-black text-white/10 uppercase tracking-widest hover:text-white transition-colors">Privacy</a>
                 <a href="#" className="text-[11px] font-black text-white/10 uppercase tracking-widest hover:text-white transition-colors">Security</a>
              </div>
           </div>
        </div>
      </footer>

      {/* ── Request Modal ── */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
          <div className="glass-panel border-white/10 rounded-[4rem] p-16 max-w-xl w-full relative animate-slide-in shadow-[0_0_150px_rgba(0,0,0,0.8)]">
            <button onClick={() => setShowRequestModal(false)} className="absolute top-10 right-10 text-white/20 hover:text-white transition-colors">
              <X size={32} />
            </button>
            
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-[2rem] flex items-center justify-center mb-12 shadow-2xl shadow-purple-500/20">
               <ShieldCheck size={48} className="text-white" />
            </div>
            
            <h3 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase italic leading-none">Access Required</h3>
            <p className="text-white/30 text-base font-medium mb-12 leading-relaxed uppercase tracking-[0.1em]">Provisioning a new node on the Webmaa protocol requires a verified mobile endpoint.</p>
            
            <div className="space-y-8">
              <div className="relative">
                <input 
                  type="tel" 
                  maxLength={11}
                  placeholder="01XXXXXXXXX" 
                  value={requestPhone}
                  onChange={(e) => setRequestPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-10 py-8 bg-white/5 border border-white/10 rounded-[2rem] font-black text-4xl text-white outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-center tracking-[0.4em] placeholder:tracking-normal placeholder:text-white/5"
                />
              </div>
              <button 
                onClick={handleSubmitRequest}
                disabled={requesting || requestPhone.length < 11}
                className="w-full py-8 bg-white text-black rounded-[2rem] font-black text-base uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50 disabled:hover:scale-100"
              >
                {requesting ? 'PROVISIONING NODE...' : 'AUTHORIZE DEPLOYMENT'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
