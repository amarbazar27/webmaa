'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { X, Info, LogOut, Menu, Globe } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import NotificationInbox from '@/components/shared/NotificationInbox';
import ImpersonationBadge from '@/components/shared/ImpersonationBadge';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardLayout({ children }) {
  const { user, userData, loading, isImpersonating, impersonation } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const router = useRouter();
  const [showNotice, setShowNotice] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login?redirect=/dashboard');
      } else if (
        userData?.role !== 'retailer' &&
        userData?.role !== 'superadmin' &&
        userData?.role !== 'staff' &&
        userData?.role !== 'admin' &&
        !isImpersonating
      ) {
        router.replace('/become-retailer');
      } else if (userData?.role === 'staff') {
        if (!userData?.accessShopId) {
          router.replace('/');
          return;
        }
        const noticeKey = `staff_notice_${user.uid}`;
        if (!sessionStorage.getItem(noticeKey)) {
          // Use setTimeout to avoid synchronous setState in effect
          setTimeout(() => setShowNotice(true), 0);
        }
      }
    }
  }, [user, userData, loading, router, isImpersonating]);


  const dismissNotice = () => {
    const noticeKey = `staff_notice_${user?.uid}`;
    sessionStorage.setItem(noticeKey, 'dismissed');
    setShowNotice(false);
  };

  if (loading) return <LoadingScreen text="Assembling Console" />;

  if (!user || (
    userData?.role !== 'retailer' &&
    userData?.role !== 'superadmin' &&
    userData?.role !== 'staff' &&
    userData?.role !== 'admin' &&
    !isImpersonating
  )) {
    return <LoadingScreen text="লগইন প্রয়োজন... রিডাইরেক্ট করা হচ্ছে" />;
  }

  return (
    <div className="min-h-screen flex w-full max-w-full overflow-x-hidden" style={{background:'var(--bg-color)',color:'var(--text-color)'}}>

      {/* 🔴 Impersonation Badge — সবার উপরে */}
      <ImpersonationBadge />

      {/* Primary Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 max-w-full overflow-x-clip lg:ml-64 min-h-screen relative p-3 sm:p-4 md:p-8 pb-32 md:pb-8 ${isImpersonating ? 'mt-11' : ''}`}>

        {/* 📱 Mobile Top Header */}
        <div className="lg:hidden flex items-center justify-between bg-white dark:bg-slate-900 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800 mb-6 sticky top-4 z-40">
           <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 sm:p-2 -ml-1 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Menu size={18} />
              </button>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-md shrink-0">
                 <span className="text-white font-black text-xs sm:text-sm">W</span>
              </div>
              <span className="font-black text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                {isImpersonating ? `👁️ ${impersonation?.shopName}` : t('কনসোল', 'Console')}
              </span>
           </div>

           <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={toggleLanguage}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                title={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
              >
                <Globe size={12} className="text-purple-600 dark:text-purple-400" />
                <span className="text-[10px] font-mono font-bold">{language === 'bn' ? 'বাং' : 'EN'}</span>
              </button>
              <ThemeToggleButton size="sm" />
              <NotificationInbox shopId={userData?.activeShopId} isDashboard={true} />
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-purple-600 dark:text-purple-400 shrink-0">
                {userData?.name?.[0] || 'U'}
              </div>
           </div>
        </div>

        <div className="max-w-7xl mx-auto w-full min-w-0">

          {/* Staff notice */}
          {showNotice && userData?.role === 'staff' && (
            <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <Info size={16} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-amber-900 mb-0.5">স্টাফ অ্যাক্সেস নোটিশ</p>
                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                  আপনি সফলভাবে স্টাফ হিসেবে যুক্ত হয়েছেন! 🎉 যদি ড্যাশবোর্ড লোড হতে সমস্যা হয়, একবার Logout করে পুনরায় Login করুন।
                </p>
              </div>
              <button onClick={dismissNotice} className="text-amber-400 hover:text-amber-600 transition-colors p-1 rounded-lg hover:bg-amber-100">
                <X size={16} />
              </button>
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}
