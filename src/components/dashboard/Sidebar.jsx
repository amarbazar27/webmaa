'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, ShoppingCart, Users, Tag, Settings, LogOut, ChevronRight, Store, Bot, ShieldCheck, Download } from 'lucide-react';
import { logoutUser } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { getShop } from '@/lib/firestore';
import clsx from 'clsx';
import { Button } from '@/components/ui';
import AiCompanion from './AiCompanion';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/products', icon: ShoppingBag, label: 'Inventory' },
  { href: '/dashboard/categories', icon: Tag, label: 'Categories' },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/dashboard/customers', icon: Users, label: 'Customers' },
  { href: '/dashboard/settings', icon: Settings, label: 'Preferences' },
];

export default function Sidebar() {
  const { userData, activeShopId } = useAuth();
  const [shop, setShop] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (activeShopId) {
      getShop(activeShopId).then(setShop);
    }
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [activeShopId]);

  // Inject Shop-specific Manifest for Admin Panel downloads
  useEffect(() => {
    if (shop?.subdomainSlug) {
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = `/api/manifest?shop=${shop.subdomainSlug}`;
    }
  }, [shop?.subdomainSlug]);

  const handleAppDownload = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      alert('App is already installed or your browser does not support it.');
    }
  };

  const isStaff = userData?.role === 'staff';
  const visibleNavItems = isStaff 
    ? navItems.filter(item => item.label !== 'Preferences' && item.label !== 'Customers') 
    : navItems;

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  return (
    <>
      <aside className="w-64 hidden lg:flex flex-col h-screen fixed left-0 top-0 bg-white border-r border-slate-100 z-50">
        {/* Brand Logo */}
        <div className="p-8 pb-10">
          <div className="flex items-center gap-3">
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt="Store Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm border border-slate-100" />
            ) : (
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-black text-xl">{shop?.shopName?.[0] || 'W'}</span>
              </div>
            )}
            <div className="overflow-hidden">
              <span className="font-black text-lg tracking-tight text-slate-900 block leading-none truncate">{shop?.shopName || 'Webmaa'}</span>
              <span className="text-[10px] text-purple-600 font-black uppercase tracking-[0.1em] mt-1 block">Dashboard</span>
            </div>
          </div>
        </div>

        {/* Nav Section */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-10">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Navigation</p>
          
          {visibleNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200',
                  isActive
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={clsx('transition-colors', isActive ? 'text-purple-600' : 'group-hover:text-slate-900')} />
                  {label}
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(138,43,226,0.6)]" />}
              </Link>
            );
          })}
        </nav>

        {/* 🚀 AI Sidekick */}
        {!isStaff && <AiCompanion shop={shop} />}


        {/* Footer / Account */}
        <div className="p-4 mt-auto">
          {deferredPrompt ? (
             <button
                onClick={handleAppDownload}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-3 px-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 mb-4 animate-pulse"
             >
                <Download size={16} /> Install Webmaa App
             </button>
          ) : (
             <div className="w-full bg-slate-50 border border-slate-200 text-slate-400 font-black text-[10px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 mb-4 opacity-60">
                <ShieldCheck size={14} /> Device Verified
             </div>
          )}

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3 mb-4">
             <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-purple-600 shadow-sm border border-slate-100">
                <Store size={16} />
             </div>
             <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-900 truncate">Premium Tier</p>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Verified Shop</p>
             </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-red-500 hover:bg-red-50 w-full transition-all group"
          >
            <LogOut size={18} className="transition-transform group-hover:translate-x-0.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 📱 Mobile Bottom Navigation (Visible only on tablets & phones) */}
      <div className="lg:hidden flex flex-col fixed bottom-0 left-0 right-0 z-50">
        
        {/* Mobile App Install Banner - pops up above the navigation if available */}
        {deferredPrompt && (
           <div className="bg-purple-600 px-4 py-3 shadow-[0_-5px_20px_-5px_rgba(147,51,234,0.3)] flex items-center justify-between animate-slide-in cursor-pointer" onClick={handleAppDownload}>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                 <Store size={18} className="text-white" />
               </div>
               <div>
                  <p className="text-white font-black text-xs">Install Dashboard App</p>
                  <p className="text-purple-200 text-[10px] font-bold">Fast & secure access</p>
               </div>
             </div>
             <span className="bg-white text-purple-700 text-xs font-black px-3 py-1.5 rounded-lg">Install</span>
           </div>
        )}

        <div className="bg-white border-t border-slate-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] px-2 pb-safe">
          <div className="flex items-center justify-around py-3">
             {visibleNavItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                   <Link key={href} href={href} className="flex flex-col items-center gap-1 group w-16">
                      <div className={clsx(
                         "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                         isActive ? "bg-purple-100/50 text-purple-600" : "text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-600"
                      )}>
                         <Icon size={20} className={isActive ? "scale-110" : "scale-100 group-hover:scale-105"} />
                      </div>
                      <span className={clsx("text-[9px] font-black uppercase tracking-wider text-center", isActive ? "text-purple-600" : "text-slate-400")}>{label.split(' ')[0]}</span>
                   </Link>
                );
             })}
          </div>
        </div>
      </div>
      
      {/* 🚀 Mobile AI Sidekick */}
      <AiCompanion shop={shop} isMobile={true} />
    </>
  );
}
