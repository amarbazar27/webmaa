'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, ShoppingCart, Users, Tag, 
  Settings, LogOut, ShieldCheck, Menu, X, Crown, Lock, Paintbrush, Radio,
  Truck, FileText, ChevronDown, ChevronRight, CircleDot, Circle
} from 'lucide-react';
import { logoutUser } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { getShop, subscribeGlobalConfig } from '@/lib/firestore';
import { checkIsSubscriptionActive } from '@/lib/subscription';
import clsx from 'clsx';
import AiCompanion from './AiCompanion';
import NotificationInbox from '@/components/shared/NotificationInbox';

const navGroups = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    href: '/dashboard', 
    staffAllowed: true 
  },
  { 
    id: 'product', 
    label: 'Product', 
    icon: ShoppingBag, 
    staffAllowed: true,
    subItems: [
      { href: '/dashboard/products', label: 'Product List' },
      { href: '/dashboard/products/new', label: 'Add Product' },
      { href: '/dashboard/smart-inventory', label: 'Smart Inventory', condition: 'messerbazar' }
    ]
  },
  { 
    id: 'category', 
    label: 'Category', 
    icon: Tag, 
    staffAllowed: true,
    subItems: [
      { href: '/dashboard/categories', label: 'Category List' }
    ]
  },
  { 
    id: 'order', 
    label: 'Order', 
    icon: ShoppingCart, 
    staffAllowed: true,
    subItems: [
      { href: '/dashboard/orders', label: 'All Orders' },
      { href: '/dashboard/incomplete-orders', label: 'Incomplete Orders' }
    ]
  },
  { 
    id: 'homepage_builder', 
    label: 'Homepage Builder', 
    icon: Paintbrush, 
    href: '/dashboard/homepage-builder', 
    staffAllowed: false 
  },
  { 
    id: 'customers', 
    label: 'Customers', 
    icon: Users, 
    href: '/dashboard/customers', 
    staffAllowed: false 
  },
  { 
    id: 'broadcast', 
    label: 'Broadcast', 
    icon: Radio, 
    href: '/dashboard/broadcast', 
    staffAllowed: false 
  },
  { 
    id: 'billing', 
    label: 'Billing', 
    icon: ShieldCheck, 
    href: '/dashboard/billing', 
    staffAllowed: false 
  },
  { 
    id: 'settings', 
    label: 'Store Settings', 
    icon: Settings, 
    href: '/dashboard/settings',
    staffAllowed: false, 
    isLockable: true
  }
];

export default function Sidebar({ isOpen, onClose, onOpen }) {
  const { userData, activeShopId } = useAuth();
  const [shop, setShop] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (activeShopId) {
      getShop(activeShopId).then(setShop);
    }
    const unsub = subscribeGlobalConfig((config) => {
      setGlobalConfig(config);
    });
    return () => { unsub(); };
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

  const isStaff = userData?.role === 'staff';
  const isAdmin = userData?.role === 'admin';

  const isMesserBazar =
    shop?.subdomainSlug === 'messerbazar' ||
    shop?.shopSlug === 'messerbazar' ||
    shop?.customDomain === 'messerbazar.com' ||
    shop?.shopName === 'Messer Bazar' ||
    shop?.shopName === 'মেসের বাজার';

  // Auto-expand active group on initial load
  useEffect(() => {
    navGroups.forEach(group => {
      if (group.subItems) {
        const isChildActive = group.subItems.some(sub => {
          const basePath = sub.href.split('?')[0];
          return pathname === basePath || (basePath !== '/dashboard' && pathname.startsWith(basePath));
        });
        if (isChildActive) {
          setOpenGroups({ [group.id]: true });
        }
      }
    });
  }, [pathname]);

  // Exclusive Accordion: opening one group automatically closes all previous groups
  const toggleGroup = (groupId) => {
    setOpenGroups(prev => {
      if (prev[groupId]) {
        return {}; // Close if clicking already active group
      } else {
        return { [groupId]: true }; // Open this group, close others
      }
    });
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  const isSubActive = checkIsSubscriptionActive(shop, userData, globalConfig);

  const filteredGroups = navGroups.filter(g => {
    if (isStaff && !isAdmin && g.staffAllowed === false) return false;
    return true;
  }).map(g => {
    if (!g.subItems) return g;
    return {
      ...g,
      subItems: g.subItems.filter(sub => {
        if (sub.condition === 'messerbazar' && !isMesserBazar) return false;
        return true;
      })
    };
  });

  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="p-6 pb-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt="Store Logo" className="w-10 h-10 rounded-xl object-contain shadow-xs border border-slate-100" />
            ) : (
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-black text-xl">{shop?.shopName?.[0] || 'D'}</span>
              </div>
            )}
            <div className="overflow-hidden">
              <span className="font-black text-base tracking-tight block leading-none truncate text-slate-900">{shop?.shopName || 'Daripallah'}</span>
              <span className="text-[10px] text-purple-600 font-extrabold uppercase tracking-[0.1em] mt-1 block">Retailer Console</span>
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

      {/* Navigation Accordion Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar pb-10">
        {filteredGroups.map((group) => {
          const Icon = group.icon;
          const hasSubItems = Array.isArray(group.subItems) && group.subItems.length > 0;
          const isGroupOpen = !!openGroups[group.id];

          // Check if direct link is active
          const isDirectActive = group.href && (pathname === group.href || (group.href !== '/dashboard' && pathname.startsWith(group.href)));

          // Check if any sub-item is active
          const isChildActive = hasSubItems && group.subItems.some(sub => {
            const basePath = sub.href.split('?')[0];
            return pathname === basePath || (basePath !== '/dashboard' && pathname.startsWith(basePath));
          });

          const isLocked = group.isLockable && !isSubActive;

          // Single Direct Item (e.g. Dashboard, Billing)
          if (!hasSubItems) {
            return (
              <Link
                key={group.id}
                href={group.href}
                onClick={onClose}
                className={clsx(
                  'group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all duration-200',
                  isDirectActive
                    ? 'bg-purple-50 text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={clsx('transition-colors', isDirectActive ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-700')} />
                  <span>{group.label}</span>
                </div>
                {isDirectActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-600 shadow-xs" />}
              </Link>
            );
          }

          // Expandable Sub-Navigation Accordion
          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={clsx(
                  'w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer select-none',
                  isChildActive || isGroupOpen
                    ? 'bg-purple-50/70 text-purple-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={clsx('transition-colors', (isChildActive || isGroupOpen) ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-700')} />
                  <span>{group.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isLocked && (
                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                      <Lock size={8} /> Lock
                    </span>
                  )}
                  {isGroupOpen ? (
                    <ChevronDown size={15} className="text-purple-600 transition-transform duration-200" />
                  ) : (
                    <ChevronRight size={15} className="text-slate-400 group-hover:text-slate-700 transition-transform duration-200" />
                  )}
                </div>
              </button>

              {/* Sub items dropdown */}
              {isGroupOpen && (
                <div className="pl-6 pr-2 py-1 space-y-1 border-l-2 border-purple-100 ml-5 my-0.5 animate-slide-in">
                  {group.subItems.map((sub, idx) => {
                    const subBasePath = sub.href.split('?')[0];
                    const isSubActive = pathname === subBasePath || (subBasePath !== '/dashboard' && pathname.startsWith(subBasePath));

                    return (
                      <Link
                        key={idx}
                        href={sub.href}
                        onClick={onClose}
                        className={clsx(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150',
                          isSubActive
                            ? 'text-purple-700 font-black bg-purple-100/60'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        )}
                      >
                        {isSubActive ? (
                          <CircleDot size={12} className="text-purple-600 shrink-0" />
                        ) : (
                          <Circle size={10} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                        )}
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Superadmin Panel Link */}
        {userData?.role === 'superadmin' && (
          <>
            <div className="my-3 border-t border-slate-100" />
            <p className="px-3 text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1.5">Admin Zone</p>
            <Link
              href="/superadmin"
              onClick={onClose}
              className={clsx(
                'group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all duration-200',
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

      {/* Bottom actions */}
      <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50/50">
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 transition-all group cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
          {(!isStaff || isAdmin) && (
            <div className="shrink-0">
              <AiCompanion shop={shop} compact />
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 hidden lg:flex flex-col h-screen fixed left-0 top-0 border-r border-slate-100 z-50 shadow-xs bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div className={clsx(
        "fixed inset-0 z-[100] lg:hidden transition-opacity duration-300",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        <aside className={clsx(
          "absolute left-0 top-0 bottom-0 w-72 flex flex-col transition-transform duration-300 ease-out shadow-2xl bg-white",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <SidebarContent />
        </aside>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 text-center animate-scale-in">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <LogOut size={26} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">লগআউট নিশ্চিতকরণ</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                আপনি কি নিশ্চিত যে আপনার রিটেইলার ড্যাশবোর্ড থেকে লগআউট করতে চান?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs transition-all cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await handleLogout();
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-lg shadow-red-500/25 transition-all cursor-pointer"
              >
                লগআউট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
