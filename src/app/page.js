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
 
  useEffect(() => {
    return subscribeGlobalConfig(setGlobalConfig);
  }, []);

  // Smart dashboard redirect based on user role
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
      // Regular users just stay on landing page
    } catch (err) {
      // silently ignore
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
    
    // Show phone modal
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
      title: "Launch in Minutes",
      desc: "Set up your online store instantly. No coding required, no technical skills needed.",
      color: "from-violet-500 to-purple-600",
      shadow: "shadow-purple-500/25"
    },
    {
      icon: Smartphone,
      title: "Progressive Web App",
      desc: "Your store automatically becomes a mobile app. Customers can install it directly from the browser.",
      color: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/25"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      desc: "Track orders, revenue, and customer behavior with a powerful dashboard built for growth.",
      color: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/25"
    },
    {
      icon: Users,
      title: "Multi-Staff Access",
      desc: "Add team members with isolated dashboards. Delegate order management without sharing passwords.",
      color: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/25"
    },
    {
      icon: Sparkles,
      title: "AI Shopping Assistant",
      desc: "Built-in intelligent chatbot that knows your products, prices, and delivery rules automatically.",
      color: "from-pink-500 to-rose-500",
      shadow: "shadow-pink-500/25"
    },
    {
      icon: ShieldCheck,
      title: "Secure Transactions",
      desc: "Enterprise-grade security with PIN-protected actions, transaction verification, and audit trails.",
      color: "from-slate-600 to-slate-800",
      shadow: "shadow-slate-500/25"
    }
  ];

  const stats = [
    { value: "99.9%", label: "Uptime SLA" },
    { value: "<50ms", label: "Response Time" },
    { value: "24/7", label: "Cloud Hosting" },
    { value: "0", label: "Monthly Fees" }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f]">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/15 blur-[150px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '4s' }} />

      {/* Session Bar */}
      {user && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xs shadow-lg">
                {user.displayName?.[0] || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] font-bold text-white/90 leading-none">{userData?.name || user.displayName || user.email}</p>
                <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest mt-1">{userData?.role || 'User'}</p>
              </div>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <button
              onClick={logoutUser}
              className="text-[10px] font-bold text-white/40 hover:text-red-400 flex items-center gap-1.5 uppercase tracking-widest transition-colors"
            >
              <LogOut size={12} /> Exit
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-20 max-w-7xl mx-auto px-6 pt-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 text-white font-black text-xl border border-white/10">W</div>
            <span className="text-xl font-black text-white tracking-tight">Webmaa</span>
            <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full ml-1">Beta</span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a href="#features" className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">Features</a>
            <a href="#stats" className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">Performance</a>
            <Link href="/demo" className="text-xs font-bold text-white bg-white/10 backdrop-blur border border-white/10 px-5 py-2.5 rounded-full hover:bg-white/20 transition-all">
              Live Demo
            </Link>
            {user && getDashboardHref() ? (
              <Link
                href={getDashboardHref()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-xs font-black text-white hover:scale-105 transition-all shadow-lg shadow-purple-500/30"
              >
                <LayoutDashboard size={14} /> My Panel
              </Link>
            ) : !user ? (
              <button
                onClick={handleSmartLogin}
                disabled={loggingIn}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 rounded-full text-xs font-black hover:scale-105 transition-all shadow-lg disabled:opacity-70"
              >
                {loggingIn ? (
                  <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <LogOut size={14} className="rotate-180" />
                )}
                Login as Known
              </button>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 border border-purple-500/30 bg-purple-500/10 backdrop-blur rounded-full text-[11px] font-bold uppercase tracking-[0.2em] text-purple-400">
            <Zap size={14} className="text-purple-400" /> The Future of E-Commerce is Here
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white tracking-tight leading-[0.95]">
            Build Your Store.
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Own Your Growth.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto font-medium leading-relaxed">
            Launch a fully-featured, AI-powered storefront in minutes.
            No coding. No monthly fees. Just pure commerce.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-6">
            <Link
              href="/demo"
              className="group relative px-10 py-5 rounded-2xl text-lg font-black flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl shadow-purple-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex items-center gap-3">
                <ShoppingBag size={22} /> Start Shopping
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {userData?.role === 'retailer' || userData?.role === 'superadmin' ? (
              <Link
                href={userData?.role === 'superadmin' ? "/superadmin" : "/dashboard"}
                className="group px-10 py-5 rounded-2xl text-lg font-black flex items-center justify-center gap-3 bg-white/5 backdrop-blur border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <LayoutDashboard size={22} /> {userData?.role === 'superadmin' ? "Admin Panel" : "Dashboard"}
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <button
                onClick={handleRequestClick}
                disabled={requesting}
                className="group px-10 py-5 rounded-2xl text-lg font-black flex items-center justify-center gap-3 bg-white/5 backdrop-blur border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50"
              >
                <Store size={22} /> Become a Seller
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-8 pt-8 text-white/30">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <CheckCircle size={14} className="text-emerald-500" /> Free Forever
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <CheckCircle size={14} className="text-emerald-500" /> No Credit Card
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <CheckCircle size={14} className="text-emerald-500" /> Setup in 2 Min
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div id="stats" className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="text-center p-8 rounded-3xl bg-white/[0.03] backdrop-blur border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 cursor-default group"
            >
              <p className="text-4xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-blue-300 transition-all duration-500">{stat.value}</p>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-3 group-hover:text-white/50 transition-colors">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <p className="text-[11px] font-bold text-purple-400 uppercase tracking-[0.3em] mb-4">Capabilities</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Everything You Need.<br />
            <span className="text-white/30">Nothing You Don&apos;t.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group relative p-8 rounded-3xl bg-white/[0.03] backdrop-blur border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-500 cursor-default hover:-translate-y-3 hover:shadow-2xl ${feature.shadow}`}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              {/* Glow Effect on Hover */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />

              <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg ${feature.shadow} mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <feature.icon size={24} strokeWidth={2} />
              </div>
              <h3 className="relative text-lg font-black text-white mb-3 group-hover:text-white transition-colors">{feature.title}</h3>
              <p className="relative text-sm text-white/40 font-medium leading-relaxed group-hover:text-white/60 transition-colors">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Support Section */}
      <div id="contact" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <p className="text-[11px] font-bold text-purple-400 uppercase tracking-[0.3em] mb-4">Support</p>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                We're Here to<br />
                <span className="text-white/30">Help You Grow.</span>
              </h2>
            </div>
            <p className="text-lg text-white/50 leading-relaxed font-medium">
              Have questions about setting up your store or need technical assistance? Our team is available 24/7 to support your journey.
            </p>
            <div className="flex flex-col gap-4">
              {globalConfig?.contactWa && (
                <a href={`https://wa.me/${globalConfig.contactWa.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">WhatsApp</p>
                    <p className="text-white font-bold">{globalConfig.contactWa}</p>
                  </div>
                </a>
              )}
              {globalConfig?.contactFb && (
                <a href={globalConfig.contactFb} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Facebook Message</p>
                    <p className="text-white font-bold">Webmaa Official</p>
                  </div>
                </a>
              )}
              {globalConfig?.contactEmail && (
                <a href={`mailto:${globalConfig.contactEmail}`} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-purple-500/10 hover:border-purple-500/30 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Email Support</p>
                    <p className="text-white font-bold">{globalConfig.contactEmail}</p>
                  </div>
                </a>
              )}
            </div>
          </div>
          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 blur-[100px] rounded-full" />
             <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-purple-500/20">
                  <Headphones size={40} />
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Dedicated Support</h3>
                <p className="text-white/40 font-medium leading-relaxed mb-8">
                  Every merchant on Webmaa gets access to a dedicated account manager to help with SEO, marketing strategies, and store optimization.
                </p>
                <div className="flex -space-x-3 mb-8">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-white">
                      {['A','B','C','D'][i-1]}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-purple-600 flex items-center justify-center text-[10px] font-black text-white">
                    +12
                  </div>
                </div>
                <div className="text-sm font-bold text-white/60 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Support members online
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* CTA Bottom Section */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="p-12 md:p-16 rounded-[2rem] bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur border border-purple-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent" />
          <div className="relative">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Ready to Transform Your Business?
            </h3>
            <p className="text-white/50 font-medium mb-10 max-w-lg mx-auto">
              Join hundreds of entrepreneurs who have already launched their stores on Webmaa. Your journey starts with one click.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo"
                className="group px-10 py-4 rounded-2xl font-black bg-white text-slate-900 hover:bg-purple-100 hover:scale-105 transition-all duration-300 shadow-2xl flex items-center justify-center gap-3"
              >
                <Rocket size={20} /> View Live Demo
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={handleRequestClick}
                disabled={requesting}
                className="px-10 py-4 rounded-2xl font-black bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Store size={20} /> Request Seller Access
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative">
            <button onClick={() => setShowRequestModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500">
              <LogOut className="rotate-180" size={20} />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2">আপনার ফোন নম্বর</h3>
            <p className="text-slate-500 text-sm font-bold mb-6">অ্যাডমিন আপনার সাথে যোগাযোগ করতে পারে। অনুগ্রহ করে একটি সচল নম্বর দিন।</p>
            <label htmlFor="requestPhoneInput" className="sr-only">Phone Number</label>
            <input 
              id="requestPhoneInput"
              name="requestPhone"
              type="tel" 
              maxLength={11}
              placeholder="01XXXXXXXXX" 
              value={requestPhone}
              onChange={(e) => setRequestPhone(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-300 rounded-xl mb-4 font-black text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-colors"
            />
            <button 
              onClick={handleSubmitRequest}
              disabled={requesting || requestPhone.length < 11}
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black hover:bg-purple-600 transition-colors shadow-lg disabled:opacity-50"
            >
              {requesting ? 'জমা হচ্ছে...' : 'আবেদন জমা দিন'}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg text-sm">W</div>
              <span className="text-sm font-black text-white/60">Webmaa</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/demo" className="text-xs font-bold text-white/30 hover:text-white/60 transition-colors">Demo</Link>
              <a href="#features" className="text-xs font-bold text-white/30 hover:text-white/60 transition-colors">Features</a>
              <a href="#stats" className="text-xs font-bold text-white/30 hover:text-white/60 transition-colors">Performance</a>
              <a href="#contact" className="text-xs font-bold text-white/30 hover:text-white/60 transition-colors">Contact Support</a>
            </div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Webmaa. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
