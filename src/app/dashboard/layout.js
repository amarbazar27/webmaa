'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { X, Info, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  // ⚠️ Staff Role Update Notice:
  // যখন স্টোর ওনার কাউকে স্টাফ হিসেবে অ্যাড করেন, তখন ওই নতুন স্টাফের
  // ডিভাইসে userData ইনস্ট্যান্ট আপডেট হয় না কারণ ফায়ারবেস অথেন্টিকেশন
  // সেশন আগে থেকেই চলতে থাকে। সমাধান: স্টাফকে একবার Logout করে পুনরায়
  // Login করতে বলুন। এরপরই সে Staff Dashboard অ্যাক্সেস পাবে।
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else if (userData?.role !== 'retailer' && userData?.role !== 'superadmin' && userData?.role !== 'staff') {
        router.push('/');
      } else if (userData?.role === 'staff') {
        // 🔒 Security: Staff without a valid accessShopId cannot enter ANY dashboard
        if (!userData?.accessShopId) {
          router.push('/');
          return;
        }
        // Show notice to newly added staff if they haven't dismissed it
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || (userData?.role !== 'retailer' && userData?.role !== 'superadmin' && userData?.role !== 'staff')) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Primary Sidebar */}
      <Sidebar />

      {/* Main Context Area */}
      <main className="flex-1 lg:ml-64 min-h-screen relative p-4 pb-24 md:p-8 md:pb-8">
        
        {/* 📱 Mobile Top Header */}
        <div className="lg:hidden flex items-center justify-between bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 mb-4 sticky top-4 z-40">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-md">
                 <span className="text-white font-black text-sm">W</span>
              </div>
              <span className="font-black text-slate-800 text-sm">Dashboard</span>
           </div>
           <button 
             onClick={async () => {
                const { logoutUser } = await import('@/lib/auth');
                await logoutUser();
                router.push('/login');
             }} 
             className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors shadow-sm border border-red-100"
           >
              <LogOut size={16} className="-ml-0.5" />
           </button>
        </div>

        <div className="max-w-7xl mx-auto">

          {/* ⚠️ Staff Access Notice - শুধুমাত্র Staff রোলের জন্য দেখাবে */}
          {showNotice && userData?.role === 'staff' && (
            <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <Info size={16} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-amber-900 mb-0.5">স্টাফ অ্যাক্সেস নোটিশ</p>
                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                  আপনি সফলভাবে স্টাফ হিসেবে যুক্ত হয়েছেন! 🎉 ভবিষ্যতে যদি ড্যাশবোর্ড অ্যাক্সেস না পান,
                  তাহলে একবার <strong>Logout</strong> করে পুনরায় <strong>Login</strong> করুন।
                  ফায়ারবেস সেশনের কারণে রোল আপডেট হতে কিছু সময় লাগতে পারে।
                </p>
              </div>
              <button
                onClick={dismissNotice}
                className="text-amber-400 hover:text-amber-600 transition-colors p-1 rounded-lg hover:bg-amber-100"
              >
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
