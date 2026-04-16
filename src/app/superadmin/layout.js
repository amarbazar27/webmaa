'use client';
import { useEffect } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, LogOut, ArrowLeft, MessageCircle, X, Globe, Camera, Share2, Link2, MessageSquare, Phone } from 'lucide-react';
import { logoutUser } from '@/lib/auth';
import Link from 'next/link';

export default function SuperAdminLayout({ children }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [showContact, setShowContact] = useState(false);

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
          <button 
            onClick={() => setShowContact(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-black shadow-sm uppercase tracking-wider"
          >
            <MessageCircle size={14} /> Contact Us
          </button>
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

      {/* Contact Us Modal */}
      {showContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative shadow-2xl animate-slide-in overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <button onClick={() => setShowContact(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors z-10">
              <X size={18} className="stroke-[3]" />
            </button>
            
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 transform -rotate-6">
              <MessageCircle size={32} className="rotate-6" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight leading-tight">Admin Support Line</h3>
            <p className="text-slate-500 text-sm font-bold mb-8 leading-relaxed">System administrator is available for technical support and emergency overrides.</p>
            
            <div className="space-y-4 relative z-10">
              {/* WhatsApp */}
              <a href="https://wa.me/8801700000000" target="_blank" rel="noreferrer" className="w-full relative flex items-center p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-[#25D366] hover:shadow-[0_8px_30px_rgba(37,211,102,0.15)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                <div className="absolute inset-0 bg-[#25D366]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <MessageCircle size={24} className="text-[#25D366]" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 group-hover:text-[#25D366] transition-colors">WhatsApp</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Quick Response</p>
                </div>
              </a>

              {/* Direct Call */}
              <a href="tel:+8801700000000" className="w-full relative flex items-center p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-blue-500 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Phone size={24} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">Direct Call</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Emergency Only</p>
                </div>
              </a>

              {/* Facebook Page */}
              <a href="https://facebook.com/webmaa" target="_blank" rel="noreferrer" className="w-full relative flex items-center p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-[#1877F2] hover:shadow-[0_8px_30px_rgba(24,119,242,0.15)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                <div className="absolute inset-0 bg-[#1877F2]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 bg-[#1877F2]/10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Globe size={24} className="text-[#1877F2]" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 group-hover:text-[#1877F2] transition-colors">Facebook Page</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Community & Updates</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
