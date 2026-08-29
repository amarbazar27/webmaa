'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { logoutUser } from '@/lib/auth';
import Link from 'next/link';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';

export default function SuperAdminLayout({ children }) {
  const { user, userData, loading } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userData?.role !== 'superadmin') {
        router.push('/dashboard');
      }
    }
  }, [user, userData, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-red-500/10 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || userData?.role !== 'superadmin') return null;

  return (
    <div className="min-h-screen" style={{background:'var(--bg-color)',color:'var(--text-color)'}}>
      {/* Subtle Background Accent */}
      <div className="fixed top-0 inset-x-0 h-64 bg-gradient-to-b from-red-50 to-transparent pointer-events-none"></div>

      {/* Super Admin Navbar */}
      <nav className="sticky top-0 z-50 glass-panel max-w-[1700px] mx-auto mt-4 p-4 flex justify-between items-center bg-white/80 border-red-100 shadow-md w-[calc(100%-2rem)]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 border border-red-100 shadow-sm">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tighter text-slate-900 flex items-center gap-2">
              DARIPALLAH <span className="text-red-600">OVERWATCH</span>
              <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Root</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Central Control Node</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggleButton size="sm" showLabel />
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back to Site
          </Link>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs font-black border border-red-100 shadow-sm uppercase tracking-wider cursor-pointer"
          >
            <LogOut size={14}/> Sign Out
          </button>
        </div>
      </nav>

      {/* Superadmin Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 text-center animate-scale-in">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <LogOut size={26} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">লগআউট নিশ্চিতকরণ</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                আপনি কি নিশ্চিত যে সুপারঅ্যাডমিন প্যানেল থেকে লগআউট করতে চান?
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
                  await logoutUser();
                  router.push('/login');
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-red-500/20 cursor-pointer active:scale-95"
              >
                হ্যাঁ, লগআউট
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1700px] mx-auto px-6 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
