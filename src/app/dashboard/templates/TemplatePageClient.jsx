'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { getShop } from '@/lib/firestore';
import dynamic from 'next/dynamic';
import { LayoutTemplate, Sliders, Loader2 } from 'lucide-react';

// Client-only dynamic imports
const TemplateMarketplace = dynamic(
  () => import('@/components/dashboard/TemplateMarketplace'),
  {
    ssr: false,
    loading: () => (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-3" />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">টেমপ্লেট লোড হচ্ছে...</p>
      </div>
    ),
  }
);

const StoreCustomizationPanel = dynamic(
  () => import('@/components/dashboard/StoreCustomizationPanel'),
  {
    ssr: false,
    loading: () => (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-3" />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">কাস্টমাইজার লোড হচ্ছে...</p>
      </div>
    ),
  }
);

export default function TemplatePageClient() {
  const { activeShopId, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('templates');
  const [shop, setShop] = useState(null);
  const [loadingShop, setLoadingShop] = useState(true);

  useEffect(() => {
    if (!activeShopId) return;
    setLoadingShop(true);
    getShop(activeShopId)
      .then(data => setShop(data))
      .catch(() => setShop(null))
      .finally(() => setLoadingShop(false));
  }, [activeShopId]);

  // Staff cannot access template settings
  if (userData?.role === 'staff') {
    return (
      <div className="py-20 text-center font-black text-slate-400">
        টেমপ্লেট সেটিংস শুধুমাত্র স্টোর মালিকের জন্য।
      </div>
    );
  }

  const tabs = [
    { id: 'templates', label: 'টেমপ্লেট গ্যালারি', icon: LayoutTemplate },
    { id: 'customizer', label: 'কাস্টমাইজার', icon: Sliders },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20">
          <LayoutTemplate size={26} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">টেমপ্লেট ইঞ্জিন</h1>
          <p className="text-sm text-slate-500 font-medium">আপনার স্টোরকে প্রফেশনাল রূপ দিন</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all border-b-2 rounded-t-xl ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-700 bg-purple-50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loadingShop ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-3" />
          <p className="text-slate-400 text-xs font-bold">স্টোর ডেটা লোড হচ্ছে...</p>
        </div>
      ) : (
        <>
          {/* Template Gallery */}
          {activeTab === 'templates' && (
            <TemplateMarketplace
              shopId={activeShopId}
              activeTemplateId={shop?.templateId || 'modern-commerce'}
              onTemplateApplied={(tid) => {
                setShop(prev => ({ ...prev, templateId: tid }));
                setActiveTab('customizer');
              }}
            />
          )}

          {/* Customizer */}
          {activeTab === 'customizer' && (
            <div className="max-w-2xl">
              <StoreCustomizationPanel
                shopId={activeShopId}
                templateId={shop?.templateId || 'modern-commerce'}
                currentOverrides={shop?.themeOverrides || {}}
                onSave={({ theme }) => setShop(prev => ({ ...prev, themeOverrides: theme }))}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
