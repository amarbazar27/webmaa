'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { logoutUser } from '@/lib/auth';
import Link from 'next/link';

export default function SuperAdminLayout({ children }) {
  const { user, userData, loading } = useAuth();
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Subtle Background Accent */}
      <div className="fixed top-0 inset-x-0 h-64 bg-gradient-to-b from-red-50 to-transparent pointer-events-none"></div>

      {/* Super Admin Navbar */}
      <nav className="sticky top-0 z-50 glass-panel mx-4 mt-4 p-4 flex justify-between items-center bg-white/80 border-red-100 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 border border-red-100 shadow-sm">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tighter text-slate-900 flex items-center gap-2">
              WEBMAA <span className="text-red-600">OVERWATCH</span>
              <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Root</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Central Control Node</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back to Site
          </Link>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <button 
            onClick={async () => { await logoutUser(); router.push('/login'); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs font-black border border-red-100 shadow-sm uppercase tracking-wider"
          >
            <LogOut size={14}/> Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
