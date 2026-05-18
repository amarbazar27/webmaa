'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { X, Info, LogOut, Menu } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import NotificationInbox from '@/components/shared/NotificationInbox';

export default function DashboardLayout({ children }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [showNotice, setShowNotice] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else if (userData?.role !== 'retailer' && userData?.role !== 'superadmin' && userData?.role !== 'staff') {
        router.push('/');
      } else if (userData?.role === 'staff') {
        if (!userData?.accessShopId) {
          router.push('/');
          return;
        }
        const noticeKey = `staff_notice_${user.uid}`;
        if (!sessionStorage.getItem(noticeKey)) {
          setShowNotice(true);
        }
      }
    }
  }, [user, userData, loading, router]);

  const dismissNotice = () => {
    const noticeKey = `staff_notice_${user?.uid}`;
    sessionStorage.setItem(noticeKey, 'dismissed');
    setShowNotice(false);
  };

  if (loading) return <LoadingScreen text="Assembling Console" />;

  if (!user || (userData?.role !== 'retailer' && userData?.role !== 'superadmin' && userData?.role !== 'staff')) return null;

  return (
    <div className="min-h-screen flex" style={{background:'var(--bg-color)',color:'var(--text-color)'}}>
      {/* Primary Sidebar - Now supports mobile overlay */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
      />

      {/* Main Context Area */}
      <main className="flex-1 lg:ml-64 min-h-screen relative p-4 pb-32 md:p-8 md:pb-8">
        
        {/* 📱 Mobile Top Header */}
        <div className="lg:hidden flex items-center justify-between bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 mb-6 sticky top-4 z-40">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Menu size={20} />
              </button>
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-md">
                 <span className="text-white font-black text-sm">W</span>
              </div>
              <span className="font-black text-slate-800 text-sm">Console</span>
           </div>
           
           <div className="flex items-center gap-2">
              <ThemeToggleButton size="sm" />
              <NotificationInbox shopId={userData?.activeShopId} isDashboard={true} />
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-purple-600">
                {userData?.name?.[0] || 'U'}
              </div>
           </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {showNotice && userData?.role === 'staff' && (
            <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <Info size={16} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-amber-900 mb-0.5">স্টাফ অ্যাক্সেস নোটিশ</p>
                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                  আপনি সফলভাবে স্টাফ হিসেবে যুক্ত হয়েছেন! 🎉 যদি ড্যাশবোর্ড লোড হতে সমস্যা হয়, একবার Logout করে পুনরায় Login করুন।
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
