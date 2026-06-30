'use client';
import { useEffect, useState } from 'react';
import { getAllShops } from '@/lib/firestore';
import { Store, ExternalLink, Star, ShoppingBag, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export default function ShowcasePage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllShops().then(data => {
      setShops(data.filter(s => {
        const isTest = s.shopSlug === 'test' || s.subdomainSlug === 'test' || s.shopName?.toLowerCase() === 'test';
        return s.isActive !== false && s.showOnMainSite !== false && (!isTest || s.showOnMainSite === true);
      }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = shops.filter(s =>
    (s.shopName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.shopSlug || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.subdomainSlug || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStoreLink = (shopSlug, customDomain, domainStatus) => {
    if (customDomain && domainStatus === 'connected') {
      return `https://${customDomain}`;
    }
    return `/${shopSlug}`;
  };

  const gradients = [
    'from-purple-600 to-indigo-600',
    'from-rose-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-blue-500 to-cyan-500',
    'from-amber-500 to-yellow-500',
    'from-pink-500 to-fuchsia-500',
    'from-slate-700 to-slate-900',
    'from-violet-500 to-purple-600',
  ];

  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .glass-panel { background:rgba(255,255,255,0.03); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.06); }
      `}} />

      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay" />
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px]" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[120px]" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center glass-panel rounded-full px-8 py-4 shadow-2xl">
          <Logo href="/" className="text-white scale-110" text="bdretailers.com" />
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[11px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em] transition-all hidden md:block">Home</Link>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black tracking-[0.3em] uppercase text-purple-400">
              <Sparkles size={12} className="inline mr-1.5 mb-0.5" />
              Showcase
            </span>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <h1 className="text-6xl md:text-[100px] font-black tracking-tighter leading-[0.9] mb-8">
          LIVE<br />
          <span className="text-white/10">MERCHANTS.</span>
        </h1>
        <p className="text-xl text-white/30 font-medium max-w-xl mb-12">
          Explore all active storefronts powered by the Daripallah protocol. No login required.
        </p>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="Search stores..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-white/15"
          />
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        {loading ? (
          <div className="py-32 text-center">
            <div className="w-10 h-10 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Loading Nodes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center">
            <Store size={64} className="mx-auto mb-6 text-white/10" />
            <p className="text-white/20 font-bold">No stores found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((shop, idx) => {
              const grad = gradients[idx % gradients.length];
              const slug = shop.subdomainSlug || shop.shopSlug;
              const storeLink = getStoreLink(slug, shop.customDomain, shop.domainStatus);
              return (
                <a
                  key={shop.id}
                  href={storeLink}
                  target="_blank"
                  rel="noreferrer"
                  className="group glass-panel rounded-[2.5rem] p-10 flex flex-col gap-8 hover:bg-white/5 hover:-translate-y-2 transition-all duration-500 border-white/5 hover:border-white/15 hover:shadow-[0_0_80px_rgba(139,92,246,0.08)] cursor-pointer"
                >
                  <div className={`w-20 h-20 bg-gradient-to-br ${grad} rounded-[1.5rem] flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-500`}>
                    <span className="text-3xl font-black text-white">{(shop.shopName || 'S')[0]}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight group-hover:text-white transition-colors mb-2">{shop.shopName || 'Unnamed Store'}</h3>
                    <p className="text-[11px] font-black text-white/15 uppercase tracking-[0.3em]">{slug}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-auto">
                    <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] group-hover:text-purple-400 transition-colors flex items-center gap-2">
                      Visit Store <ExternalLink size={12} />
                    </span>
                    <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center">
        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Daripallah Showcase © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
