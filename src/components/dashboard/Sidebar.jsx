'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, ShoppingCart, Users, Tag, 
  Settings, LogOut, Store, ShieldCheck, Download, Menu, X, LayoutTemplate, Crown, Clock
} from 'lucide-react';
import { logoutUser } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { getShop } from '@/lib/firestore';
import clsx from 'clsx';
import AiCompanion from './AiCompanion';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import NotificationInbox from '@/components/shared/NotificationInbox';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview', staffAllowed: true },
  { href: '/dashboard/products', icon: ShoppingBag, label: 'Inventory', staffAllowed: true },
  { href: '/dashboard/smart-inventory', icon: ShoppingBag, label: 'Smart Inventory', staffAllowed: true },
  { href: '/dashboard/categories', icon: Tag, label: 'Categories', staffAllowed: true },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'Orders', staffAllowed: true },
  { href: '/dashboard/incomplete-orders', icon: Clock, label: 'Cart Recovery', staffAllowed: true },
  { href: '/dashboard/customers', icon: Users, label: 'Customers', staffAllowed: false },
  { href: '/dashboard/templates', icon: LayoutTemplate, label: 'Templates', staffAllowed: false },
  { href: '/dashboard/broadcast', icon: Store, label: 'Broadcast', staffAllowed: false },
  { href: '/dashboard/billing', icon: ShieldCheck, label: 'Billing', staffAllowed: false },
  { href: '/dashboard/settings', icon: Settings, label: 'Preferences', staffAllowed: false, isLockable: true },
];

export default function Sidebar({ isOpen, onClose, onOpen }) {
  const { userData, activeShopId } = useAuth();
  const [shop, setShop] = useState(null);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
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
    }
  };

  const isStaff = userData?.role === 'staff';
  const isAdmin = userData?.role === 'admin';
  const visibleNavItems = isStaff && !isAdmin 
    ? navItems.filter(item => item.staffAllowed !== false) 
    : navItems;

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  const isSubscriptionActive = () => {
    if (!shop) return true; // loading fallback
    if (userData?.role === 'superadmin') return true;
    if (shop.subscriptionStatus === 'expired' || shop.trialClaimed === false) return false;
    return true;
  };

  const isSubActive = isSubscriptionActive();

  const SidebarContent = () => (
    <>
      <div className="p-8 pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt="Store Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm border border-slate-100" />
            ) : (
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-black text-xl">{shop?.shopName?.[0] || 'D'}</span>
              </div>
            )}
            <div className="overflow-hidden">
              <span className="font-black text-lg tracking-tight text-slate-900 block leading-none truncate">{shop?.shopName || 'Daripallah'}</span>
              <span className="text-[10px] text-purple-600 font-black uppercase tracking-[0.1em] mt-1 block">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <NotificationInbox shopId={shop?.id} isDashboard={true} />
             {onClose && (
               <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-900 transition-colors">
                 <X size={20} />
               </button>
             )}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-10">
        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Navigation</p>
        {visibleNavItems.map(({ href, icon: Icon, label, isLockable }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          const isLocked = isLockable && !isSubActive;

          if (isLocked) {
            return (
              <button
                key={href}
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  setIsLockModalOpen(true);
                }}
                className="w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 text-slate-400 hover:text-slate-700 hover:bg-amber-50/50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
                  <span>{label}</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Lock size={10} /> Locked
                </div>
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
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

        {/* Superadmin Panel Link */}
        {userData?.role === 'superadmin' && (
          <>
            <div className="my-3 border-t border-slate-100" />
            <p className="px-4 text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Admin Zone</p>
            <Link
              href="/superadmin"
              onClick={onClose}
              className={clsx(
                'group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200',
                pathname.startsWith('/superadmin')
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
              )}
            >
              <div className="flex items-center gap-3">
                <Crown size={18} className="text-amber-500" />
                Superadmin Panel
              </div>
              {pathname.startsWith('/superadmin') && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </Link>
          </>
        )}
      </nav>

      {(!isStaff || isAdmin) && <AiCompanion shop={shop} />}

      <div className="p-4 mt-auto">
        {deferredPrompt ? (
           <button
              onClick={handleAppDownload}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-3 px-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 mb-4 animate-pulse"
           >
              <Download size={16} /> Install App
           </button>
        ) : (
           <div className="w-full bg-slate-50 border border-slate-200 text-slate-400 font-black text-[10px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 mb-4 opacity-60">
              <ShieldCheck size={14} /> Verified
           </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t" style={{borderColor:'var(--border-color)'}}>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{color:'var(--text-3)'}}>
            {false ? 'Dark' : ''}
          </span>
          <ThemeToggleButton size="sm" showLabel />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-red-500 hover:bg-red-50 w-full transition-all group mx-4 mb-2" style={{width:'calc(100% - 2rem)'}}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 hidden lg:flex flex-col h-screen fixed left-0 top-0 border-r z-50 shadow-sm" style={{background:'var(--surface)',borderColor:'var(--border-color)'}}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div className={clsx(
        "fixed inset-0 z-[100] lg:hidden transition-opacity duration-300",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        <aside className={clsx(
          "absolute left-0 top-0 bottom-0 w-72 flex flex-col transition-transform duration-300 ease-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )} style={{background:'var(--surface)'}}>
          <SidebarContent />
        </aside>
      </div>

      {/* 🔒 Subscription Lock Modal */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl w-full max-w-md p-6 md:p-8 space-y-6 relative animate-scale-in text-center">
            <button 
              onClick={() => setIsLockModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <Lock size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                সেটিংস অপশন লক করা রয়েছে 🔒
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                আপনার ১ মাসের ফ্রি ট্রায়াল ক্লেইম করুন অথবা সাবস্ক্রিপশন নবায়ন করুন! স্টোর সেটিংস, ব্র্যান্ডিং, লোগো ও ডোমেইন কাস্টমাইজ করতে বিলিং পেজে গিয়ে ট্রায়াল শুরু করুন।
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/dashboard/billing"
                onClick={() => setIsLockModalOpen(false)}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 active:scale-95"
              >
                <span>বিলিং পেজে গিয়ে ক্লেইম / রিনিউ করুন →</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
