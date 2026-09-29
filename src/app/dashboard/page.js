'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getShop, getOrders, getProducts, getGlobalConfig } from '@/lib/firestore';
import { ShoppingBag, DollarSign, Eye, ExternalLink, Package, TrendingUp, Users, ArrowUpRight, ShieldCheck, Zap, Heart, X, Clock, CheckCircle, Copy, Globe, Check } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import AiInsightsPanel from '@/components/dashboard/AiInsightsPanel';
import NotificationBox from '@/components/dashboard/NotificationBox';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardPage() {
  const { user, activeShopId } = useAuth();
  const { language, t } = useLanguage();
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  useEffect(() => {
    if (!activeShopId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { getRecentOrders, updateShop } = await import('@/lib/firestore');
        const shopData = await getShop(activeShopId);
        const productsData = await getProducts(activeShopId);
        const configData = await getGlobalConfig();

        let finalOrders = [];
        let finalRevenue = shopData?.totalRevenue;
        let finalCount = shopData?.orderCount;

        if (finalRevenue === undefined || finalCount === undefined) {
          // One-time self-healing migration: load all orders to compute stats and cache them
          const allOrders = await getOrders(activeShopId);
          finalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
          finalCount = allOrders.length;
          finalOrders = allOrders.slice(0, 100); // Only keep recent 100 in state

          // Cache stats in shop document
          await updateShop(activeShopId, {
            totalRevenue: finalRevenue,
            orderCount: finalCount
          });

          if (shopData) {
            shopData.totalRevenue = finalRevenue;
            shopData.orderCount = finalCount;
          }
        } else {
          // Instant load: load only the last 100 orders for charts and insights
          finalOrders = await getRecentOrders(activeShopId, 100);
        }

        setShop(shopData);
        setOrders(finalOrders);
        setProducts(productsData);
        setGlobalConfig(configData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeShopId]);

  const totalRevenue = shop?.totalRevenue !== undefined ? shop.totalRevenue : orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const totalOrdersCount = shop?.orderCount !== undefined ? shop.orderCount : orders.length;
  const primarySubdomain = (shop?.subdomainSlug || shop?.shopSlug || '').toLowerCase().trim();
  const cleanSubdomainUrl = primarySubdomain ? `https://${primarySubdomain}.bdretailers.com` : '';
  const shopUrl = shop?.customDomain 
    ? `https://${shop.customDomain}` 
    : (cleanSubdomainUrl || `${typeof window !== 'undefined' ? window.location.origin : 'https://bdretailers.com'}/shop/${primarySubdomain}`);
  
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const getSubscriptionExpiryTime = (expiresAt) => {
    if (!expiresAt) return 0;
    try {
      if (typeof expiresAt?.toDate === 'function') return expiresAt.toDate().getTime();
      if (typeof expiresAt === 'object' && (expiresAt.seconds || expiresAt._seconds)) {
        const s = expiresAt.seconds ?? expiresAt._seconds;
        return s * 1000;
      }
      const d = new Date(expiresAt);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    } catch {
      return 0;
    }
  };

  const isTrialEligible = !shop?.trialClaimed && globalConfig?.trialsEnabled !== false;
  const showTrialOfferBanner = isTrialEligible && (shop?.subscriptionStatus !== 'active' || !shop?.subscriptionStatus);

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (!shopUrl) return;
    navigator.clipboard.writeText(shopUrl);
    setCopiedLink(true);
    toast.success('শপ লিংক সফলভাবে কপি হয়েছে! 📋');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4 shadowed-loader"></div>
        <p className="text-slate-400 font-bold text-xs">Assembling Console...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8 animate-slide-in pb-12 w-full min-w-0">
      {/* Welcome Header & Store Live Link Hub */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm w-full min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {t('লাইভ স্টোর চালু আছে', 'Live Storefront Active')}
            </span>
            {globalConfig?.donationEnabled !== false && (
              <button
                onClick={() => setIsDonateModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-full text-xs font-bold transition-colors cursor-pointer"
                title={t('প্ল্যাটফর্ম অনুদান', 'Support Platform')}
              >
                <Heart size={11} className="fill-current text-rose-500" />
                <span>{t('অনুদান', 'Donate')}</span>
              </button>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mt-2 truncate">
            {t('স্বাগতম,', 'Welcome back,')} {user?.displayName?.split(' ')[0] || shop?.shopName || 'Retailer'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            {t('আজ আপনার স্টোরের সাম্প্রতিক হালনাগাদ।', "Here's what's happening with your store today.")}
          </p>
        </div>
        
        {/* Full-width Branded Subdomain Live Card */}
        {shop && (
          <div className="bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/80 dark:from-purple-950/30 dark:via-slate-900 dark:to-indigo-950/30 p-3.5 sm:p-5 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full max-w-xl min-w-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                <Globe size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <span>🌟 {t('লাইভ সাবডোমেইন লিংক', 'Live Store URL')}</span>
                </p>
                <a 
                  href={shopUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs sm:text-base font-black font-mono text-slate-900 dark:text-white hover:text-purple-700 dark:hover:text-purple-300 underline truncate block tracking-tight mt-0.5 max-w-[190px] xs:max-w-xs sm:max-w-sm" 
                  title={shopUrl}
                >
                  {shopUrl}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-black transition-all border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="Copy Store URL"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedLink ? t('কপি হয়েছে', 'Copied') : t('কপি', 'Copy')}</span>
              </button>
              <a 
                href={shopUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
              >
                <span>{t('ভিজিট স্টোর', 'Visit Store')}</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 🎁 1-Month Free Claim Offer Banner for New Retailers / Expired Accounts */}
      {showTrialOfferBanner && (
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 rounded-2xl sm:rounded-3xl p-5 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 border border-purple-400/30 animate-pulse w-full min-w-0">
          <div className="space-y-2 text-left min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-bold shadow-sm">
              🎁 {t('নতুন অ্যাকাউন্ট অফার', 'New Retailer Offer')}
            </div>
            <h2 className="text-lg md:text-2xl font-black tracking-tight">
              {t('১ মাস (৩০ দিন) ফ্রি ক্লেইম করুন!', 'Claim 1 Month (30 Days) Free Trial!')}
            </h2>
            <p className="text-xs text-purple-100 font-medium max-w-xl leading-relaxed">
              {t('আপনার স্টোরের লোগো, কাস্টম ডোমেইন ও প্রেফারেন্স সেটিংস আনলক করতে এখনই ১ মাসের ফ্রি ট্রায়াল ক্লেইম করুন। বিলিং পেজে গিয়ে ট্রায়াল শুরু করুন।', 'Unlock custom domains, store logos, and preference controls by claiming your 1-month free trial now in Billing.')}
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="px-5 py-3 sm:px-6 sm:py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl font-bold text-xs transition-all shadow-lg shadow-amber-400/20 shrink-0 flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <span>{t('বিলিংয়ে ১ মাস ফ্রি ক্লেইম করুন', 'Claim 1 Month Free in Billing')}</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      )}

      {/* 📢 Superadmin Notice for Shared Plan Retailers or Targeted Retailer */}
      {(() => {
        const notice = shop?.sharedNotice || (shop?.subscriptionPackage === 'starter' && globalConfig?.sharedNotice);
        if (!notice || !notice.active || !notice.text) return null;

        return (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl sm:rounded-3xl p-5 md:p-7 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-2 border-amber-300/40 relative overflow-hidden w-full min-w-0">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-inner">
                <Zap size={22} className="fill-current text-yellow-300" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/25 text-white text-xs font-bold">
                  📢 {t('জরুরি নোটিশ', 'Important Notice')}
                </div>
                <div className="text-sm md:text-base font-black tracking-tight text-white leading-snug whitespace-pre-line break-words">
                  {notice.text}
                </div>
                {notice.createdAt && (
                  <p className="text-[10px] font-bold text-amber-100">
                    {t('প্রকাশের তারিখ:', 'Published:')} {new Date(notice.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
            {shop?.subscriptionPackage === 'starter' && (
              <Link
                href="/dashboard/billing"
                className="px-4 py-2.5 sm:px-5 sm:py-3 bg-white hover:bg-amber-50 text-amber-900 rounded-2xl font-bold text-xs transition-all shadow-lg shrink-0 flex items-center gap-1.5 hover:scale-105 active:scale-95"
              >
                <span>{t('বিলিং পেজ', 'Billing Page')}</span>
                <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
        );
      })()}

      {/* Metrics Row — 2 columns on mobile so cards never horizontally overflow */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 w-full min-w-0">
         <Card 
            title={`৳${totalRevenue.toLocaleString()}`} 
            subtitle={t('মোট আয়', 'Gross Revenue')} 
            icon={DollarSign} 
            className="border-l-4 border-l-green-500 shadow-sm" 
         />
         <Card 
            title={totalOrdersCount} 
            subtitle={t('মোট অর্ডার', 'Total Orders')} 
            icon={ShoppingBag} 
            className="border-l-4 border-l-blue-500 shadow-sm" 
         />
         <Card 
            title={products.length} 
            subtitle={t('সক্রিয় পণ্য', 'Active Inventory')} 
            icon={Package} 
            className="border-l-4 border-l-purple-500 shadow-sm" 
         />
         <Card 
            title={pendingOrdersCount} 
            subtitle={t('অপেক্ষমান অর্ডার', 'Pending Orders')} 
            icon={Clock} 
            className="border-l-4 border-l-amber-500 shadow-sm" 
         />
         <Card 
            title={completedOrdersCount} 
            subtitle={t('সম্পন্ন অর্ডার', 'Completed Orders')} 
            icon={CheckCircle} 
            className="border-l-4 border-l-emerald-500 shadow-sm" 
         />
      </div>



      {/* Analytics Charts */}
      {orders.length > 0 && <AnalyticsCharts orders={orders} />}

      {/* AI Insights */}
      <AiInsightsPanel orders={orders} products={products} shopName={shop?.shopName} activeShopId={activeShopId} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sales Feed */}
        <div className="lg:col-span-8">
           <Card title="Latest Transactions" subtitle="Most recent sales activity" icon={TrendingUp}>
              {orders.length === 0 ? (
                <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <ShoppingBag size={40} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-400 font-medium text-xs">No orders received yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-4 group first:pt-0 last:pb-0">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs uppercase shadow-sm">
                             {order.customerName?.[0] || 'C'}
                          </div>
                          <div>
                             <p className="font-bold text-sm text-slate-900">{order.customerName}</p>
                             <p className="text-xs text-slate-400 font-medium">{order.status || 'Processing'}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="font-extrabold text-slate-900">৳{order.total}</p>
                          <p className="text-xs text-green-600 font-bold">Success</p>
                       </div>
                    </div>
                  ))}
                  <div className="pt-6">
                    <Link href="/dashboard/orders" className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-purple-600 transition-all">
                       View Complete Order History <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </div>
              )}
           </Card>
        </div>

        {/* Quick Actions & Health */}
        <div className="lg:col-span-4 space-y-6">
           <Card title="Connectivity" subtitle="Shop Live Status" icon={ShieldCheck} className="bg-gradient-to-br from-green-50/50 to-white shadow-sm">
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-6">
                Your storefront is verified and active on the high-speed Daripallah cloud network.
              </p>
              <div className="space-y-3">
                 <Link href="/dashboard/products/new" className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-all group">
                    <span className="text-xs font-bold text-slate-600">Post New Product</span>
                    <ArrowUpRight size={16} className="text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                 </Link>
                 <Link href="/dashboard/settings" className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-all group">
                    <span className="text-xs font-bold text-slate-600">Branding Setup</span>
                    <ArrowUpRight size={16} className="text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                 </Link>
              </div>
           </Card>


        </div>
      </div>

      {/* 🔔 Broadcast Notifications */}
      <NotificationBox senderRole="retailer" shopId={activeShopId} />
      </div>

      {/* 💳 Donation Accounts Modal */}
      {isDonateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative animate-scale-in">
            {/* Header Gradient Accent */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600"></div>
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 flex justify-between items-start border-b border-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Heart size={20} className="text-rose-500 fill-rose-500 animate-pulse" />
                  Donation Accounts (অনুদান অ্যাকাউন্টস)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Select an account to copy details and send donation</p>
              </div>
              <button 
                onClick={() => setIsDonateModalOpen(false)} 
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-4 max-h-[60vh] overflow-y-auto">
              {!globalConfig?.bkashNumber && !globalConfig?.nagadNumber && !globalConfig?.rocketNumber && !globalConfig?.bankDetails ? (
                <div className="text-center py-8">
                  <Heart size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-400">No accounts configured by Admin yet.</p>
                </div>
              ) : (
                <>
                  {/* bKash */}
                  {globalConfig?.bkashNumber && (
                    <div className="flex items-center justify-between p-4 bg-pink-50/50 border border-pink-100/50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center font-black text-xs">
                          BK
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-950">bKash (বিকাশ)</p>
                          <p className="text-xs font-bold text-slate-600 mt-0.5">{globalConfig.bkashNumber}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(globalConfig.bkashNumber);
                          toast.success('bKash Number copied to clipboard! 📋');
                        }}
                        className="bg-white border border-pink-200 text-pink-600 hover:bg-pink-50 text-xs font-bold h-8 px-4 rounded-xl"
                      >
                        Copy
                      </Button>
                    </div>
                  )}

                  {/* Nagad */}
                  {globalConfig?.nagadNumber && (
                    <div className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100/50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xs">
                          NG
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-950">Nagad (নগদ)</p>
                          <p className="text-xs font-bold text-slate-600 mt-0.5">{globalConfig.nagadNumber}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(globalConfig.nagadNumber);
                          toast.success('Nagad Number copied to clipboard! 📋');
                        }}
                        className="bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 text-xs font-bold h-8 px-4 rounded-xl"
                      >
                        Copy
                      </Button>
                    </div>
                  )}

                  {/* Rocket */}
                  {globalConfig?.rocketNumber && (
                    <div className="flex items-center justify-between p-4 bg-purple-50/50 border border-purple-100/50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                          RK
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-950">Rocket (রকেট)</p>
                          <p className="text-xs font-bold text-slate-600 mt-0.5">{globalConfig.rocketNumber}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(globalConfig.rocketNumber);
                          toast.success('Rocket Number copied to clipboard! 📋');
                        }}
                        className="bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 text-xs font-bold h-8 px-4 rounded-xl"
                      >
                        Copy
                      </Button>
                    </div>
                  )}

                  {/* Bank Details */}
                  {globalConfig?.bankDetails && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3">
                      <div>
                        <p className="text-xs font-black text-slate-950">Bank Account Details (ব্যাংক অ্যাকাউন্ট বিবরণ)</p>
                        <p className="text-xs font-bold text-slate-600 whitespace-pre-line mt-1.5 leading-relaxed">{globalConfig.bankDetails}</p>
                      </div>
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(globalConfig.bankDetails);
                          toast.success('Bank details copied to clipboard! 📋');
                        }}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold h-8 px-4 rounded-xl w-full"
                      >
                        Copy Details
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button 
                onClick={() => setIsDonateModalOpen(false)}
                className="bg-purple-600 hover:bg-purple-700 text-slate-50 font-bold h-11 px-6 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer border-0"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
