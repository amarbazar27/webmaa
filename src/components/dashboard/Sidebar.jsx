'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, ShoppingCart, Users, Tag, Settings, LogOut, ChevronRight, Store, Bot } from 'lucide-react';
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

  useEffect(() => {
    if (activeShopId) {
      getShop(activeShopId).then(setShop);
    }
  }, [activeShopId]);

  const isStaff = userData?.role === 'staff';
  const visibleNavItems = isStaff 
    ? navItems.filter(item => item.label !== 'Preferences' && item.label !== 'Customers') 
    : navItems;

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  return (
    <aside className="w-64 hidden lg:flex flex-col h-screen fixed left-0 top-0 bg-white border-r border-slate-100 z-50">
      {/* Brand Logo */}
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-white font-black text-xl">W</span>
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-slate-900 block leading-none">Webmaa</span>
            <span className="text-[10px] text-purple-600 font-black uppercase tracking-[0.1em] mt-1 block">Cloud Panel</span>
          </div>
        </div>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
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
  );
}
