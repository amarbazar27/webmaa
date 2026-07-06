'use client';

import { useEffect, useState, Fragment } from 'react';
import {
  getRetailerInvites, addRetailerInvite, removeRetailerInvite, getAllShops,
  getRetailerRequests, approveRetailerRequest, denyRetailerRequest,
  subscribeGlobalConfig, updateGlobalConfig, getOrders,
  pauseShop, resumeShop, deleteRetailerRequest, deleteShop,
  getImpersonationLogs, toggleShopMainSiteVisibility, createSuperadminShop, getShop, getShopBySlug,
  getAllMarketplaceProducts, updateProduct, updateShop
} from '@/lib/firestore';
import SuperadminBroadcastPanel from '@/components/superadmin/SuperadminBroadcastPanel';
import dynamic from 'next/dynamic';
const SuperadminAppBuilder = dynamic(() => import('@/components/superadmin/SuperadminAppBuilder'), { ssr: false });
import {
  UserPlus, Mail, Trash2, Crown, Store, Activity, ShieldCheck,
  Phone, CheckCircle, XCircle, Clock, ArrowUpRight, Users, Loader2, Sparkles, Key, Eye, EyeOff,
  Globe, Link2, Pause, Play, ExternalLink, LogIn, ShieldAlert, History, Search, Filter, ChevronRight,
  Cloud, Plus, Edit2, ImagePlus
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { logoutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function SuperAdminPage() {
  const [invites, setInvites] = useState([]);
  const [shops, setShops] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [processingShopId, setProcessingShopId] = useState(null);
  const [impersonationLogs, setImpersonationLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState(null);
  const [togglingShopId, setTogglingShopId] = useState(null);
  const [superadminShop, setSuperadminShop] = useState(null);
  const [banners, setBanners] = useState([]);
  const [savingBanners, setSavingBanners] = useState(false);
  const [expandedCloudinaryShopId, setExpandedCloudinaryShopId] = useState(null);
  const [expandedDescShopId, setExpandedDescShopId] = useState(null);

  // ── Smart Curation & Product Overrides ──
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const [globalConfig, setGlobalConfig] = useState({
    geminiApiKey: '',
    googleMapsApiKey: '',
    contactLinks: [],
    promotedLinks: [],
    defaultLayout: 'modern',
    piprapayUrl: '',
    piprapayApiKey: '',
    piprapayCommissionPercent: 0,
    brandName: '',
    logoUrl: '',
    platformDescription: '',
    whatsapp: ''
  });
  const [savingConfig, setSavingConfig] = useState(false);
  
  const router = useRouter();
  const [showKey, setShowKey] = useState(false);
  const [showPpKey, setShowPpKey] = useState(false);
  const [showMapsKey, setShowMapsKey] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, shop: null, password: '', loading: false, otpSent: false, otp: '' });
  const { theme, setSystemDefault, systemDefault } = useTheme();
  const { loginAsRetailer, user } = useAuth();

  // Helper to mask key
  const maskKey = (key) => {
    if (!key) return '';
    if (key.length < 15) return '*'.repeat(key.length);
    return `${key.substring(0, 5)}**********${key.substring(key.length - 5)}`;
  };

  // ── Impersonation: Retailer হিসেবে Login ────────────────────────
  const handleLoginAsRetailer = async (shop) => {
    setImpersonatingId(shop.id);
    try {
      await loginAsRetailer({
        uid: shop.id,
        email: shop.ownerEmail || '',
        shopId: shop.id,
        shopName: shop.shopName || 'Unknown Shop',
      });
      toast.success(`✅ "${shop.shopName}"-এর ড্যাশবোর্ডে প্রবেশ করছেন...`);
      router.push('/dashboard');
    } catch (err) {
      toast.error('Login as retailer ব্যর্থ: ' + err.message);
    }
    setImpersonatingId(null);
  };

  // ── Load Impersonation Logs ──────────────────────────────────────
  const loadImpersonationLogs = async () => {
    try {
      const logs = await getImpersonationLogs(20);
      setImpersonationLogs(logs);
      setShowLogs(true);
    } catch (err) {
      toast.error('Log লোড করতে সমস্যা');
    }
  };



  const loadData = async () => {
    setLoading(true);
    try {
      const [invitesData, shopsData, requestsData] = await Promise.all([
        getRetailerInvites(),
        getAllShops(),
        getRetailerRequests()
      ]);
      
      // Fetch metrics for each shop in parallel
      const shopsWithMetrics = await Promise.all(shopsData.map(async (shop) => {
        try {
          const orders = await getOrders(shop.id);
          const completedOrders = orders.filter(o => o.status === 'completed');
          const totalSales = completedOrders.length;
          const totalRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
          
          // Match owner email from requests
          const owner = requestsData.find(r => r.id === shop.id);
          
          return {
            ...shop,
            totalSales,
            totalRevenue,
            ownerEmail: owner?.email || shop.ownerEmail || 'Unknown',
            orderCount: orders.length
          };
        } catch (e) {
          return { ...shop, totalSales: 0, totalRevenue: 0, ownerEmail: 'Error' };
        }
      }));

      setInvites(invitesData);
      setShops(shopsWithMetrics);
      setRequests(requestsData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Auto-create superadmin's own shop on first load
  useEffect(() => {
    if (!user) return;
    createSuperadminShop(user.uid, user.email, 'Daripallah Store').then(shop => {
      setSuperadminShop(shop);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (superadminShop) {
      setBanners(superadminShop.banners || []);
    }
  }, [superadminShop]);

  const handleSaveBanners = async () => {
    if (!superadminShop?.id) return;
    setSavingBanners(true);
    const toastId = toast.loading('ব্যানার সংরক্ষণ হচ্ছে...');
    try {
      await updateShop(superadminShop.id, { banners });
      setSuperadminShop(prev => ({ ...prev, banners }));
      toast.success('ব্যানারসমূহ সফলভাবে সংরক্ষিত হয়েছে! 🎉', { id: toastId });
    } catch (err) {
      toast.error('ব্যানার সংরক্ষণ ব্যর্থ হয়েছে: ' + err.message, { id: toastId });
    }
    setSavingBanners(false);
  };

  useEffect(() => { 
    loadData(); 
    const unsubscribe = subscribeGlobalConfig((configData) => {
      setGlobalConfig({
        geminiApiKey: configData?.geminiApiKey || '',
        googleMapsApiKey: configData?.googleMapsApiKey || '',
        contactLinks: configData?.contactLinks || [],
        promotedLinks: configData?.promotedLinks || [],
        defaultLayout: configData?.defaultLayout || 'modern',
        showcaseCuration: configData?.showcaseCuration || { enabled: false, allowedShops: [], allowedCategories: [], allowedSubcategories: [] },
        showAmazonBoxes: configData?.showAmazonBoxes ?? false,
        amazonBoxType: configData?.amazonBoxType || 'shop_recent',
        showAllProductsDirectly: configData?.showAllProductsDirectly ?? true,
        piprapayUrl: configData?.piprapayUrl || '',
        piprapayApiKey: configData?.piprapayApiKey || '',
        piprapayCommissionPercent: configData?.piprapayCommissionPercent || 0,
        brandName: configData?.brandName || '',
        logoUrl: configData?.logoUrl || '',
        platformDescription: configData?.platformDescription || '',
        whatsapp: configData?.whatsapp || ''
      });
    });
    return () => unsubscribe();
  }, []);

  // Load products in the ecosystem
  useEffect(() => {
    setProductsLoading(true);
    getAllMarketplaceProducts().then(prods => {
      // Overwrite superadmin shop name in curation view too
      const mapped = prods.map(p => {
        if (p.shopSlug === 'daripallah-store' || p.shopName?.toLowerCase() === 'webmaa store' || p.shopName?.toLowerCase() === 'daripallah store') {
          return { ...p, shopName: 'ADMIN' };
        }
        return p;
      });
      setAllProducts(mapped);
      setProductsLoading(false);
    }).catch(err => {
      console.error(err);
      setProductsLoading(false);
    });
  }, []);

  const showcaseCuration = globalConfig?.showcaseCuration || { enabled: false, allowedShops: [], allowedCategories: [], allowedSubcategories: [] };

  const handleToggleCuration = async () => {
    const updated = {
      ...globalConfig,
      showcaseCuration: {
        ...showcaseCuration,
        enabled: !showcaseCuration.enabled
      }
    };
    setGlobalConfig(updated);
    try {
      await updateGlobalConfig(updated);
      toast.success(updated.showcaseCuration.enabled ? 'Curation whitelisting active!' : 'Curation whitelisting disabled!');
    } catch (err) {
      toast.error('Failed to update curation settings');
    }
  };

  const handleToggleWhitelistItem = async (type, item) => {
    const currentList = showcaseCuration[type] || [];
    const newList = currentList.includes(item)
      ? currentList.filter(x => x !== item)
      : [...currentList, item];
      
    const updated = {
      ...globalConfig,
      showcaseCuration: {
        ...showcaseCuration,
        [type]: newList
      }
    };
    setGlobalConfig(updated);
    try {
      await updateGlobalConfig(updated);
      toast.success('Curation whitelist updated!');
    } catch (err) {
      toast.error('Failed to update whitelist');
    }
  };

  const getProductType = (product) => {
    if (product.superadminType) return product.superadminType;
    const name = (product.name || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();
    
    if (name.includes('মুরগি') || name.includes('murgi') || name.includes('chicken') || name.includes('মাংস') || name.includes('meat') || name.includes('গোরু') || name.includes('beef') || name.includes('ডিম') || name.includes('egg') || cat.includes('meat') || cat.includes('মাংস')) {
      return 'মাংস ও ডিম (Poultry & Eggs)';
    }
    if (name.includes('আলু') || name.includes('পটল') || name.includes('পেঁয়াজ') || name.includes('রসুন') || name.includes('আদা') || name.includes('গাজর') || name.includes('বেগুন') || name.includes('টমেটো') || name.includes('সবজি') || name.includes('শাক') || name.includes('লেবু') || name.includes('ফল') || name.includes('tomato') || name.includes('shosa') || name.includes('sosa') || name.includes('cabbage') || cat.includes('সবজি') || cat.includes('vegetable')) {
      return 'সবজি ও ফল (Vegetables & Fruits)';
    }
    if (name.includes('চাল') || name.includes('ডাল') || name.includes('তেল') || name.includes('লবণ') || name.includes('চিনি') || name.includes('আটা') || name.includes('ময়দা') || name.includes('মসলা') || name.includes('morich') || name.includes('holud') || name.includes('oil') || name.includes('dal') || name.includes('chal') || cat.includes('grocer') || cat.includes('মুদি')) {
      return 'মুদি ও নিত্যপ্রয়োজনীয় (Groceries)';
    }
    if (name.includes('দুধ') || name.includes('চা') || name.includes('কফি') || name.includes('পানি') || name.includes('juice') || name.includes('dudh') || name.includes('tea') || name.includes('coffee') || name.includes('water') || cat.includes('drink') || cat.includes('পানীয়')) {
      return 'পানীয় ও দুগ্ধজাত (Drinks & Dairy)';
    }
    return 'অন্যান্য পণ্য (Others)';
  };

  const filteredCurationProducts = allProducts.filter(product => {
    if (!productSearchQuery) return true;
    const q = productSearchQuery.toLowerCase();
    return (
      (product.name || '').toLowerCase().includes(q) ||
      (product.shopName || '').toLowerCase().includes(q) ||
      (product.category || '').toLowerCase().includes(q)
    );
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setInviting(true);
    try {
      await addRetailerInvite(newEmail);
      toast.success(`Access granted to ${newEmail}!`);
      setNewEmail('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Invitation failed');
    }
    setInviting(false);
  };

  const handleRemoveInvite = async (inviteId, email) => {
    if (!confirm(`Revoke access for ${email}?`)) return;
    try {
      await removeRetailerInvite(inviteId);
      toast.success(`Access revoked for ${email}`);
      loadData();
    } catch (err) {
      toast.error('Failed to revoke access');
    }
  };

  const handleApprove = async (req) => {
    setProcessingId(req.id);
    try {
      await approveRetailerRequest(req.id, req.email);
      toast.success(`Approved: ${req.email} is now a retailer!`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Approval failed');
    }
    setProcessingId(null);
  };

  const handleDeny = async (req) => {
    setProcessingId(req.id);
    try {
      await denyRetailerRequest(req.id);
      toast.success(`Request from ${req.email} denied.`);
      loadData();
    } catch (err) {
      toast.error('Denial failed');
    }
    setProcessingId(null);
  };

  const handlePauseShop = async (shop) => {
    const action = shop.isActive !== false ? 'পজ' : 'চালু';
    if (!confirm(`"${shop.shopName}" স্টোরটি ${action} করতে চান?`)) return;
    setProcessingShopId(shop.id);
    try {
      if (shop.isActive !== false) {
        await pauseShop(shop.id);
        toast.success(`"${shop.shopName}" পজ করা হয়েছে।`);
      } else {
        await resumeShop(shop.id);
        toast.success(`"${shop.shopName}" পুনরায় চালু হয়েছে!`);
      }
      loadData();
    } catch (err) {
      toast.error('স্টোর আপডেট করতে ব্যর্থ হয়েছে।');
    }
    setProcessingShopId(null);
  };

  const handleToggleMainSite = async (shop) => {
    const newVal = !shop.showOnMainSite;
    setTogglingShopId(shop.id);
    try {
      await toggleShopMainSiteVisibility(shop.id, newVal);
      setShops(prev => prev.map(s => s.id === shop.id ? { ...s, showOnMainSite: newVal } : s));
      toast.success(newVal ? `"${shop.shopName}" এখন মেইন সাইটে দেখাবে ✅` : `"${shop.shopName}" মেইন সাইট থেকে সরানো হয়েছে`);
    } catch (err) {
      toast.error('ভিজিবিলিটি আপডেট ব্যর্থ হয়েছে');
    }
    setTogglingShopId(null);
  };

  const handleUpdateShopCloudinary = async (shopId, updatedFields) => {
    setShops(prev => prev.map(s => s.id === shopId ? { ...s, ...updatedFields } : s));
    try {
      await updateShop(shopId, updatedFields);
    } catch (err) {
      toast.error('ক্লাউডিনারি সেটিংস আপডেট করতে ব্যর্থ হয়েছে: ' + err.message);
      loadData();
    }
  };

  const handleDeleteRequest = async (req) => {
    if (!confirm(`${req.email}-এর আবেদনটি সম্পূর্ণ মুছে ফেলবেন? এরপর তারা আবার আবেদন করতে পারবে।`)) return;
    setProcessingId(req.id);
    try {
      await deleteRetailerRequest(req.id);
      toast.success('আবেদন মুছে ফেলা হয়েছে। ব্যবহারকারী আবার আবেদন করতে পারবে।');
      loadData();
    } catch (err) {
      toast.error('মুছে ফেলতে সমস্যা হয়েছে।');
    }
    setProcessingId(null);
  };

  const initiateDeleteShop = (shop) => {
    setDeleteModal({ isOpen: true, shop, password: '', loading: false, otpSent: false, otp: '' });
  };

  const executeDeleteShop = async () => {
    const { shop, password, otpSent, otp } = deleteModal;
    if (!password) { toast.error('পাসওয়ার্ড দিন'); return; }

    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      // 1. Verify password via API
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', password })
      });
      const data = await res.json();
      
      if (!data.success) {
        if (data.error === 'NO_PASSWORD_SET') {
          // If no password set, we can allow them to set it.
          // For now, let's just use the set action
          const setRes = await fetch('/api/admin/verify-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'set', password })
          });
          const setData = await setRes.json();
          if (setData.success) {
            toast.success('প্রথমবার লগইনের জন্য পাসওয়ার্ড সেট করা হয়েছে। আবার চেষ্টা করুন।');
          } else {
            toast.error(setData.error);
          }
        } else {
          toast.error(data.error || 'Password verification failed');
        }
        setDeleteModal(prev => ({ ...prev, loading: false }));
        return;
      }

      // 2. Verified -> Delete Store
      await deleteShop(shop.id);
      toast.success(`"${shop.shopName}" সম্পূর্ণ মুছে ফেলা হয়েছে।`);
      loadData();
      setDeleteModal({ isOpen: false, shop: null, password: '', loading: false, otpSent: false, otp: '' });
    } catch (err) {
      toast.error('মুছে ফেলতে সমস্যা হয়েছে: ' + (err.message || 'Unknown error'));
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleForgotPassword = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin ইমেইলে OTP পাঠানো হয়েছে।');
        setDeleteModal(prev => ({ ...prev, otpSent: true, loading: false }));
      } else {
        toast.error(data.error);
        setDeleteModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      toast.error('Failed to send OTP');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleResetPassword = async () => {
    const { password, otp } = deleteModal;
    if (!password || !otp) { toast.error('OTP এবং নতুন পাসওয়ার্ড দিন'); return; }
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set', password, otp })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('পাসওয়ার্ড রিসেট হয়েছে। এখন ডিলিট করুন।');
        setDeleteModal(prev => ({ ...prev, otpSent: false, otp: '', loading: false }));
      } else {
        toast.error(data.error);
        setDeleteModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      toast.error('Failed to reset password');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await updateGlobalConfig(globalConfig);
      toast.success('Global Configuration updated!');
    } catch (err) {
      toast.error('Failed to update global config');
    }
    setSavingConfig(false);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-8 animate-slide-in pb-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Control</h1>
        <p className="text-sm text-slate-500 font-medium">Manage retailers, review requests, and monitor the platform.</p>
      </div>

      {/* Superadmin's Own Store Card */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Store size={22} className="text-white" />
          </div>
          <div>
            <p className="font-black text-slate-900 text-base">আপনার নিজের স্টোর: Daripallah Store</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">এই স্টোরে আপনার নিজের পণ্য যোগ করুন — গ্রাহকরা মেইন সাইট থেকে কিনতে পারবে</p>
          </div>
        </div>
        <div className="flex gap-3">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-black shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all"
          >
            <Store size={15} /> ড্যাশবোর্ড খুলুন
          </a>
          {superadminShop?.subdomainSlug && (
            <a
              href={`/shop/${superadminShop.subdomainSlug}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-purple-700 border border-purple-200 text-sm font-black hover:bg-purple-50 transition-all"
            >
              <ExternalLink size={15} /> লাইভ স্টোর
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title={invites.length} subtitle="Authorized Retailers" icon={Crown} className="border-l-4 border-l-purple-500" />
        <Card title={shops.length} subtitle="Live Stores" icon={Store} className="border-l-4 border-l-blue-500" />
        <Card title={pendingRequests.length} subtitle="Pending Requests" icon={Clock} className="border-l-4 border-l-amber-500" />
        <Card title="Healthy" subtitle="System Engine" icon={Activity} className="border-l-4 border-l-green-500" />
      </div>

      {/* 🎨 System Theme Control */}
      <Card title="Platform Appearance" subtitle="Set the system-wide default theme for all users" icon={Sparkles} className="border-2 border-indigo-100 bg-indigo-50/10">
        <div className="flex items-center justify-between p-5 rounded-2xl border" style={{borderColor:'var(--border-color)',background:'var(--surface-2)'}}>
          <div>
            <p className="text-sm font-black" style={{color:'var(--text-color)'}}>System Default Theme</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{color:'var(--text-3)'}}>Users inherit this if they haven't set their own preference</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSystemDefault('light'); toast.success('System default: Light Mode ☀️'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                systemDefault === 'light' || !systemDefault
                  ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-lg shadow-amber-400/30'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'
              }`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => { setSystemDefault('dark'); toast.success('System default: Dark Mode 🌙'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                systemDefault === 'dark'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-500/30'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
              }`}
            >
              🌙 Dark
            </button>
          </div>
        </div>
        
        {/* Retailer Store Layout Selection */}
        <div className="mt-4 flex items-center justify-between p-5 rounded-2xl border" style={{borderColor:'var(--border-color)',background:'var(--surface-2)'}}>
          <div>
            <p className="text-sm font-black" style={{color:'var(--text-color)'}}>Retailer Store Layout</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{color:'var(--text-3)'}}>Choose the default UI/UX design for all new stores</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={globalConfig.defaultLayout || 'modern'}
              onChange={e => setGlobalConfig({...globalConfig, defaultLayout: e.target.value})}
              className="px-4 py-2 rounded-xl text-sm font-black border outline-none cursor-pointer bg-white text-slate-900 border-slate-200 hover:border-purple-400 transition-all focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="modern">Modern Premium</option>
              <option value="classic">Classic E-Commerce</option>
              <option value="minimal">Minimal Showcase</option>
            </select>
          </div>
        </div>

        {/* Amazon-style Box View Toggle */}
        <div className="mt-4 flex flex-col gap-3 p-5 rounded-2xl border" style={{borderColor:'var(--border-color)',background:'var(--surface-2)'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black" style={{color:'var(--text-color)'}}>Show Amazon-style Box View</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{color:'var(--text-3)'}}>Group products into cards on the homepage</p>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={!!globalConfig.showAmazonBoxes} 
                onChange={e => {
                  const updated = {...globalConfig, showAmazonBoxes: e.target.checked};
                  setGlobalConfig(updated);
                  updateGlobalConfig(updated).catch(() => {});
                }}
                className="w-5 h-5 accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
          
          {globalConfig.showAmazonBoxes && (
            <div className="flex flex-col gap-1.5 border-t pt-3" style={{borderColor:'var(--border-color)'}}>
              <label className="text-xs font-black tracking-widest uppercase" style={{color:'var(--text-3)'}}>Amazon Box Grouping Type</label>
              <select
                value={globalConfig.amazonBoxType || 'shop_recent'}
                onChange={e => {
                  const updated = {...globalConfig, amazonBoxType: e.target.value};
                  setGlobalConfig(updated);
                  updateGlobalConfig(updated).catch(() => {});
                }}
                className="p-3.5 rounded-xl border text-xs font-bold outline-none cursor-pointer focus:border-purple-500 transition-all select-none"
                style={{borderColor:'var(--border-color)',background:'var(--input-bg)',color:'var(--text-color)'}}
              >
                <option value="shop_recent">Shop-wise (Recent Products)</option>
                <option value="shop_featured">Shop-wise (Highlighted/Featured Products)</option>
                <option value="product_type">Category-wise (Group by Product Category)</option>
              </select>
            </div>
          )}
        </div>

        {/* Show All Products Toggle */}
        <div className="mt-4 flex items-center justify-between p-5 rounded-2xl border" style={{borderColor:'var(--border-color)',background:'var(--surface-2)'}}>
          <div>
            <p className="text-sm font-black" style={{color:'var(--text-color)'}}>Show All Products Directly</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{color:'var(--text-3)'}}>Display the full product feed below banners on initial load</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={!!globalConfig.showAllProductsDirectly} 
              onChange={e => {
                const updated = {...globalConfig, showAllProductsDirectly: e.target.checked};
                setGlobalConfig(updated);
                updateGlobalConfig(updated).catch(() => {});
              }}
              className="w-5 h-5 accent-purple-600 cursor-pointer"
            />
          </div>
        </div>

        <p className="text-[10px] font-bold text-slate-400 mt-3 px-1">💡 Retailers can override this for their shop. Customers can further override for themselves.</p>
      </Card>

      {/* ── Landing Page Banners Carousel Manager ── */}
      <Card title="Landing Page Banners (ল্যান্ডিং পেজ ব্যানার ম্যানেজার)" subtitle="ওয়েবসাইটের মূল স্লাইডার বা ব্যানারগুলো পরিবর্তন ও ছবি আপলোড করুন" icon={ImagePlus} className="border-2 border-indigo-100 bg-indigo-50/10">
        <div className="space-y-6">
          {banners.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-400 font-bold">কোনো ব্যানার যুক্ত নেই। নতুন ব্যানার যোগ করতে নিচের বাটনে ক্লিক করুন।</p>
            </div>
          ) : (
            <div className="space-y-6">
              {banners.map((banner, idx) => (
                <div key={idx} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 relative group">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-xs font-black text-slate-800">ব্যানার #{idx + 1}</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        const newBanners = banners.filter((_, i) => i !== idx);
                        setBanners(newBanners);
                      }} 
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="ব্যানারটি মুছুন"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Image selector & upload */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500">ব্যানার ছবি (Image)</label>
                      <div className="flex items-center gap-3">
                        {banner.url && (
                          <img src={banner.url} className="w-16 h-12 object-cover rounded-lg border border-slate-200 bg-slate-900 shrink-0" alt="" />
                        )}
                        <div className="flex-1 relative">
                          <input 
                            type="text" 
                            placeholder="ব্যানার ইমেজ URL" 
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800 pr-16"
                            value={banner.url || ''} 
                            onChange={e => {
                              const newBanners = [...banners];
                              newBanners[idx].url = e.target.value;
                              setBanners(newBanners);
                            }}
                          />
                          <label className="absolute right-1 top-1.5 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[9px] font-black cursor-pointer select-none">
                            📁 Upload
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const toastId = toast.loading('ব্যানার ছবি আপলোড হচ্ছে...');
                                try {
                                  const { uploadImage } = await import('@/lib/storage');
                                  const url = await uploadImage(file);
                                  const newBanners = [...banners];
                                  newBanners[idx].url = url;
                                  setBanners(newBanners);
                                  toast.success('ছবি সফলভাবে আপলোড হয়েছে! 🎉', { id: toastId });
                                } catch (err) {
                                  toast.error(err.message || 'আপলোড ব্যর্থ হয়েছে।', { id: toastId });
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Right: Title */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500">শিরোনাম (Title)</label>
                      <input 
                        type="text" 
                        placeholder="ব্যানার টাইটেল" 
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
                        value={banner.title || ''} 
                        onChange={e => {
                          const newBanners = [...banners];
                          newBanners[idx].title = e.target.value;
                          setBanners(newBanners);
                        }}
                      />
                    </div>

                    {/* Bottom row: Description, Link, Button text */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-500">বিবরণ (Description)</label>
                        <input 
                          type="text" 
                          placeholder="ব্যানার ডেসক্রিপশন" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
                          value={banner.description || ''} 
                          onChange={e => {
                            const newBanners = [...banners];
                            newBanners[idx].description = e.target.value;
                            setBanners(newBanners);
                          }}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-500">লিংক URL (Link URL)</label>
                        <input 
                          type="text" 
                          placeholder="e.g., #marketplace" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
                          value={banner.linkUrl || ''} 
                          onChange={e => {
                            const newBanners = [...banners];
                            newBanners[idx].linkUrl = e.target.value;
                            setBanners(newBanners);
                          }}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-500">বাটন টেক্সট (Button Text)</label>
                        <input 
                          type="text" 
                          placeholder="e.g., কেনাকাটা করুন" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
                          value={banner.buttonText || ''} 
                          onChange={e => {
                            const newBanners = [...banners];
                            newBanners[idx].buttonText = e.target.value;
                            setBanners(newBanners);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button 
              type="button" 
              onClick={() => setBanners([...banners, { url: '', title: '', description: '', linkUrl: '', buttonText: '' }])} 
              className="text-xs font-black text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2.5 rounded-xl border border-purple-200 cursor-pointer transition-colors"
            >
              + Add New Banner
            </button>
            <Button 
              onClick={handleSaveBanners} 
              loading={savingBanners} 
              className="bg-slate-900 border-b-4 border-slate-950 hover:bg-black w-40 h-11 text-white text-xs font-black"
            >
              Save Banners
            </Button>
          </div>
        </div>
      </Card>

      {/* 🚀 Platform AI Intelligence (Global Settings) */}
      <Card title="Platform Intelligence" subtitle="Manage global AI nodes and API keys (Groq Engine)" icon={Sparkles} className="border-2 border-purple-100 bg-purple-50/20">
        <form onSubmit={handleUpdateConfig} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            {/* ── Platform Branding Settings ── */}
            <div className="md:col-span-12 grid grid-cols-1 gap-4 pb-6 border-b border-purple-100">
              <div>
                <p className="text-xs font-black text-slate-900 mb-1 flex items-center gap-2"><Crown size={14}/> Platform Branding & Identity (ব্র্যান্ডিং ও আইডেন্টিটি)</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">ওয়েবসাইটের নাম, লোগো এবং প্রধান ডেসক্রিপশন সেট করুন</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Platform Brand Name (ওয়েবসাইটের নাম)"
                  value={globalConfig.brandName || ''}
                  onChange={e => setGlobalConfig({...globalConfig, brandName: e.target.value})}
                  placeholder="e.g. BDRetailers"
                />
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-black tracking-widest uppercase text-slate-600">Platform Logo (লোগো আপলোড)</label>
                  <div className="flex items-center gap-3">
                    {globalConfig.logoUrl && (
                      <img src={globalConfig.logoUrl} className="w-12 h-12 object-contain rounded-xl border p-1 bg-white shrink-0 border-slate-200" alt="Logo preview" />
                    )}
                    <div className="flex-1 relative">
                      <Input
                        value={globalConfig.logoUrl || ''}
                        onChange={e => setGlobalConfig({...globalConfig, logoUrl: e.target.value})}
                        placeholder="e.g. /logo.png or custom URL"
                        className="pr-20"
                      />
                      <label className="absolute right-2 top-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors shadow-sm select-none">
                        📁 Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const toastId = toast.loading('লোগো আপলোড হচ্ছে...');
                            try {
                              const { uploadImage } = await import('@/lib/storage');
                              const url = await uploadImage(file);
                              setGlobalConfig(prev => ({...prev, logoUrl: url}));
                              toast.success('লোগো সফলভাবে আপলোড হয়েছে! 🎉', { id: toastId });
                            } catch (err) {
                              toast.error(err.message || 'আপলোড ব্যর্থ হয়েছে।', { id: toastId });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Platform WhatsApp Support Number (সাপোর্ট হোয়াটসঅ্যাপ নম্বর)"
                  value={globalConfig.whatsapp || ''}
                  onChange={e => setGlobalConfig({...globalConfig, whatsapp: e.target.value.replace(/\D/g, '')})}
                  placeholder="e.g. 01734763306"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black tracking-widest uppercase text-slate-600">Platform Description Box (ল্যান্ডিং পেজের ডেসক্রিপশন)</label>
                <textarea
                  rows={3}
                  value={globalConfig.platformDescription || ''}
                  onChange={e => setGlobalConfig({...globalConfig, platformDescription: e.target.value})}
                  placeholder="ওয়েবসাইটের প্রধান ডেসক্রিপশন লিখুন যা সবার উপরে দেখাবে..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                />
              </div>
            </div>

           <div className="md:col-span-10">
              <div className="relative">
                 <Input
                   label="Global Groq API Key"
                   placeholder="gsk_..."
                   type={showKey ? "text" : "password"}
                   value={globalConfig.geminiApiKey}
                   onChange={e => setGlobalConfig({...globalConfig, geminiApiKey: e.target.value})}
                   icon={Key}
                 />
                 <button 
                   type="button" 
                   className="absolute right-4 top-10 text-slate-400 hover:text-purple-600 transition-colors"
                   onClick={() => setShowKey(!showKey)}
                 >
                   {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                 </button>
              </div>
              {!showKey && globalConfig.geminiApiKey && (
                 <p className="text-xs font-mono text-purple-700 bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg mt-3 inline-block">Current Key: {maskKey(globalConfig.geminiApiKey)}</p>
              )}
              <p className="text-[10px] text-slate-400 font-bold mt-3 px-1 uppercase tracking-wider">
                This key is used as a fallback if a retailer does not provide their own Groq API key.
              </p>
           </div>

            {/* ── Global Google Maps API Settings ── */}
            <div className="md:col-span-12 grid grid-cols-1 gap-4 pt-6 border-t border-purple-100">
              <div>
                <p className="text-xs font-black text-slate-900 mb-1 flex items-center gap-2"><Globe size={14}/> Platform Global Google Maps Settings (গ্লোবাল গুগল ম্যাপস সেটিংস)</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">ডিফল্ট গুগল ম্যাপস এপিআই কী সেট করুন (রিটেইলার নিজের কী সেট না করলে এটি ব্যবহার হবে)</p>
              </div>
              <div className="md:col-span-10">
                <div className="relative">
                  <Input
                    label="Global Google Maps API Key"
                    placeholder="AIzaSy..."
                    type={showMapsKey ? "text" : "password"}
                    value={globalConfig.googleMapsApiKey || ''}
                    onChange={e => setGlobalConfig({...globalConfig, googleMapsApiKey: e.target.value})}
                    icon={Key}
                  />
                  <button 
                    type="button" 
                    className="absolute right-4 top-10 text-slate-400 hover:text-purple-600 transition-colors"
                    onClick={() => setShowMapsKey(!showMapsKey)}
                  >
                    {showMapsKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!showMapsKey && globalConfig.googleMapsApiKey && (
                  <p className="text-xs font-mono text-purple-700 bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg mt-3 inline-block">Current Key: {maskKey(globalConfig.googleMapsApiKey)}</p>
                )}
                <p className="text-[10px] text-slate-400 font-bold mt-3 px-1 uppercase tracking-wider">
                  এটি সেট থাকলে যেকোনো রিটেইলারের স্টোরে কাস্টমার ম্যাপ চিহ্নিত করে অর্ডার দিতে পারবেন (যদি রিটেইলার নিজস্ব কী ব্যবহার না করেন)। কী সেট না থাকলে অটোমেটিক ম্যাপ ছাড়াই সাধারণ চেকআউট চালু থাকবে।
                </p>
              </div>
            </div>

           {/* ⚡ PipraPay Centered Configuration */}
           <div className="md:col-span-12 grid grid-cols-1 gap-4 pt-6 border-t border-purple-100">
             <div>
               <p className="text-xs font-black text-slate-900 mb-1 flex items-center gap-2"><Globe size={14}/> PipraPay Automated Payment (পিপরাপেই অটোমেটেড পেমেন্ট সেটিংস)</p>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">গ্লোবাল পেমেন্ট গেটওয়ে সার্ভার ও কমিশন কনফিগারেশন</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="PipraPay Server Base URL (সার্ভার ইউআরএল)"
                  value={globalConfig.piprapayUrl || ''}
                  onChange={e => setGlobalConfig({...globalConfig, piprapayUrl: e.target.value})}
                  placeholder="e.g. https://piprapay-server.onrender.com"
                />
                <div className="relative">
                  <Input
                    label="PipraPay API Key (এপিআই কী)"
                    type={showPpKey ? "text" : "password"}
                    value={globalConfig.piprapayApiKey || ''}
                    onChange={e => setGlobalConfig({...globalConfig, piprapayApiKey: e.target.value})}
                    placeholder="mh-piprapay-api-key..."
                  />
                  <button 
                    type="button" 
                    className="absolute right-4 top-10 text-slate-400 hover:text-purple-600 transition-colors"
                    onClick={() => setShowPpKey(!showPpKey)}
                  >
                    {showPpKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Input
                  label="Platform Commission (কমিশন %)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={globalConfig.piprapayCommissionPercent || ''}
                  onChange={e => setGlobalConfig({...globalConfig, piprapayCommissionPercent: parseFloat(e.target.value) || 0})}
                  placeholder="e.g. 5.0"
                />
             </div>
             <p className="text-[10px] text-slate-400 font-bold px-1 uppercase tracking-wider">
               এখানে PipraPay প্যানেলের URL এবং API Key দিন। অর্ডারের পেমেন্ট সফল হলে স্বয়ংক্রিয়ভাবে কমিশন কেটে রিটেইলারের অর্ডারে সেট করা হবে।
             </p>
           </div>
           
           <div className="md:col-span-12 grid grid-cols-1 gap-4 pt-6 border-t border-purple-100">
             <div>
               <p className="text-xs font-black text-slate-900 mb-1 flex items-center gap-2"><Phone size={14}/> Platform Global Contact Links</p>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">Displayed on the Daripallah Landing Page for support</p>
             </div>
             
             {globalConfig.contactLinks?.map((link, idx) => (
               <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                 <input type="text" placeholder="Platform Name (e.g. WhatsApp, Facebook, Email)" className="w-1/3 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold bg-white" value={link.name} onChange={e => {
                   const newArr = [...globalConfig.contactLinks];
                   newArr[idx].name = e.target.value;
                   setGlobalConfig({...globalConfig, contactLinks: newArr});
                 }} />
                 <input type="text" placeholder="URL or Address (e.g., https://... or test@email.com)" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold bg-white" value={link.url} onChange={e => {
                   const newArr = [...globalConfig.contactLinks];
                   newArr[idx].url = e.target.value;
                   setGlobalConfig({...globalConfig, contactLinks: newArr});
                 }} />
                 <button type="button" onClick={() => {
                   const newArr = globalConfig.contactLinks.filter((_, i) => i !== idx);
                   setGlobalConfig({...globalConfig, contactLinks: newArr});
                 }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
               </div>
             ))}
             
             <button type="button" onClick={() => setGlobalConfig({...globalConfig, contactLinks: [...(globalConfig.contactLinks || []), { name: '', url: '' }]})} className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl w-max border border-purple-200">
               + Add New
             </button>
           </div>

           <div className="md:col-span-12 grid grid-cols-1 gap-4 pt-6 border-t border-purple-100">
             <div>
               <p className="text-xs font-black text-slate-900 mb-1 flex items-center gap-2"><ArrowUpRight size={14}/> Promoted Shops (Landing Page Portfolio)</p>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">Add shops built with Webmaa to showcase on the main landing page</p>
             </div>
             
             {globalConfig.promotedLinks.map((link, idx) => (
               <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                 <input type="text" placeholder="Shop Name" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold bg-white" value={link.title} onChange={e => {
                   const newArr = [...globalConfig.promotedLinks];
                   newArr[idx].title = e.target.value;
                   setGlobalConfig({...globalConfig, promotedLinks: newArr});
                 }} />
                 <input type="text" placeholder="URL (e.g., https://example.com)" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold bg-white" value={link.url} onChange={e => {
                   const newArr = [...globalConfig.promotedLinks];
                   newArr[idx].url = e.target.value;
                   setGlobalConfig({...globalConfig, promotedLinks: newArr});
                 }} />
                 <button type="button" onClick={() => {
                   const newArr = globalConfig.promotedLinks.filter((_, i) => i !== idx);
                   setGlobalConfig({...globalConfig, promotedLinks: newArr});
                 }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
               </div>
             ))}
             
             <button type="button" onClick={() => setGlobalConfig({...globalConfig, promotedLinks: [...globalConfig.promotedLinks, { title: '', url: '' }]})} className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl w-max border border-purple-200">
               + Add Promoted Shop
             </button>
           </div>

           <div className="md:col-span-12 flex justify-end">
               <Button type="submit" loading={savingConfig} className="bg-purple-600 border-b-4 border-purple-800 hover:bg-purple-700 w-48 h-12 text-white font-bold">
                Update All settings
              </Button>
           </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Pending Retailer Requests Section */}
        <div className="lg:col-span-12">
          <Card
            title="Pending Retailer Requests"
            subtitle="Users requesting seller access from the demo store"
            icon={Users}
            className="border-2 border-amber-100 bg-amber-50/20"
          >
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="animate-spin mx-auto mb-3 text-slate-400" size={24} />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading requests...</p>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <CheckCircle size={40} className="mx-auto mb-4 text-emerald-400" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-white border-2 border-amber-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-200 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                      {req.photoURL ? (
                        <img src={req.photoURL} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm" alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-lg">
                          {req.name?.[0] || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-slate-900">{req.name}</p>
                        <p className="text-xs text-slate-500 font-bold">{req.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone size={12} className="text-emerald-600" />
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{req.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={processingId === req.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {processingId === req.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />} Approve
                      </button>
                      <button
                        onClick={() => handleDeny(req)}
                        disabled={processingId === req.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-colors border border-red-100 disabled:opacity-50"
                      >
                        <XCircle size={14} /> Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Processed requests history */}
            {processedRequests.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Processed History</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {processedRequests.map((req) => (
                    <div key={req.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs shrink-0">
                          {req.name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-600 truncate">{req.email}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{req.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md ${
                          req.status === 'approved' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'
                        }`}>
                          {req.status === 'approved' ? 'Approved' : 'Denied'}
                        </span>
                        {req.status === 'denied' && (
                          <button
                            onClick={() => handleDeleteRequest(req)}
                            disabled={processingId === req.id}
                            title="মুছে ফেলুন (user আবার apply করতে পারবে)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            {processingId === req.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
        {/* Live Shops Oversight Section */}
        <div className="lg:col-span-12">
          <Card
            title="Platform Ecosystem Overview"
            subtitle="Monitor all active stores, their domains, and estimated storage footprints"
            icon={Store}
            className="border-2 border-emerald-100 bg-emerald-50/10"
          >
            {loading ? (
              <div className="py-10 text-center animate-pulse">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Scanning ecosystem...</p>
              </div>
            ) : shops.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Store size={40} className="mx-auto mb-4 text-emerald-300" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active stores found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="pb-2 px-4 border-b border-slate-100">Store Name</th>
                      <th className="pb-2 px-4 border-b border-slate-100">Retailer Gmail</th>
                      <th className="pb-2 px-4 border-b border-slate-100">Performance (Sales/Money)</th>
                      <th className="pb-2 px-4 border-b border-slate-100">Domain Map</th>
                      <th className="pb-2 px-4 border-b border-slate-100">Approx. Storage</th>
                      <th className="pb-2 px-4 border-b border-slate-100 text-center">Main Site</th>
                      <th className="pb-2 px-4 border-b border-slate-100 text-right">Status</th>
                      <th className="pb-2 px-4 border-b border-slate-100 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.map((shop) => {
                      // Estimate size: basic 2MB base + ~500kb per banner + assumed product footprint
                      const bannerFootprintMB = (shop.banners?.length || 0) * 0.5;
                      const productFootprintMB = (shop.orderCount || 0) * 0.1 + 5.2; 
                      const estimatedTotalMB = (2.0 + bannerFootprintMB + productFootprintMB).toFixed(1);
                      
                      return (
                        <Fragment key={shop.id}>
                          <tr className="bg-white group hover:bg-emerald-50/50 transition-colors border-b border-slate-50 last:border-0">
                            <td className="p-4 first:rounded-l-2xl">
                              <div className="flex items-center gap-3">
                                {shop.logoUrl ? (
                                  <img src={shop.logoUrl} className="w-8 h-8 rounded-lg object-cover border border-slate-200" alt="" />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center font-black text-emerald-600 text-xs text-center leading-none">
                                    {shop.shopName?.[0] || 'S'}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-900 text-sm leading-tight">{shop.shopName || 'Unnamed Store'}</p>
                                  <p className="text-[10px] text-slate-400 font-bold truncate max-w-[120px]">{shop.slogan || 'No slogan'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div>
                                 <p className="font-bold text-xs text-slate-600">{shop.ownerEmail}</p>
                                 <p className="font-mono text-[9px] text-slate-400">UID: {shop.id.substring(0,8)}...</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                 <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-slate-800">{shop.totalSales} Sales</span>
                                    <span className="text-[11px] font-black text-emerald-600">৳{shop.totalRevenue.toLocaleString()}</span>
                                 </div>
                                 <div className="mt-1 flex items-center gap-1">
                                    {shop.totalSales > 10 ? (
                                      <span className="text-[8px] font-black uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">High Growth</span>
                                    ) : shop.totalSales > 0 ? (
                                      <span className="text-[8px] font-black uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Active</span>
                                    ) : (
                                      <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">No Sales</span>
                                    )}
                                 </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                {shop.customDomain && (
                                  <a href={`https://${shop.customDomain}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] font-black text-purple-600 hover:text-purple-800 hover:underline">
                                    <Globe size={11} /> {shop.customDomain}
                                  </a>
                                )}
                                {shop.subdomainSlug && (
                                  <a href={`https://bdretailers.com/${shop.subdomainSlug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline">
                                    <Link2 size={11} /> /{shop.subdomainSlug}
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[60px]">
                                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (estimatedTotalMB / 20) * 100)}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black text-slate-500">{estimatedTotalMB} MB</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleToggleMainSite(shop)}
                                disabled={togglingShopId === shop.id}
                                title={shop.showOnMainSite ? 'মেইন সাইট থেকে সরান' : 'মেইন সাইটে দেখান'}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                                  shop.showOnMainSite ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                  shop.showOnMainSite ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                            </td>
                            <td className="p-4 text-right">
                               <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${shop.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                 <span className={`w-1.5 h-1.5 rounded-full ${shop.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                 {shop.isActive !== false ? 'Live' : 'Paused'}
                               </span>
                            </td>
                            <td className="p-4 text-right last:rounded-r-2xl">
                              <div className="flex items-center justify-end gap-2 flex-wrap max-w-md">
                                {/* 🔐 Login as Retailer Button */}
                                <button
                                  onClick={() => handleLoginAsRetailer(shop)}
                                  disabled={impersonatingId === shop.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50"
                                  title="এই রিটেইলারের ড্যাশবোর্ডে প্রবেশ করুন"
                                >
                                  {impersonatingId === shop.id ? (
                                    <Loader2 size={11} className="animate-spin" />
                                  ) : (
                                    <LogIn size={11} />
                                  )}
                                  Login as
                                </button>

                                {(shop.subdomainSlug || shop.shopSlug) && (
                                  <a
                                    href={`${typeof window !== 'undefined' ? window.location.origin : 'https://bdretailers.com'}/${shop.subdomainSlug || shop.shopSlug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all"
                                    title="Live shop খুলুন"
                                  >
                                    <ExternalLink size={11} /> Live
                                  </a>
                                )}
                                
                                <button
                                  onClick={() => {
                                    setExpandedCloudinaryShopId(expandedCloudinaryShopId === shop.id ? null : shop.id);
                                    setExpandedDescShopId(null);
                                  }}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                                    expandedCloudinaryShopId === shop.id 
                                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                      : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                                  }`}
                                  title="ক্লাউডিনারি সেটিংস"
                                >
                                  <Cloud size={11} /> Cloudinary
                                </button>

                                <button
                                  onClick={() => {
                                    setExpandedDescShopId(expandedDescShopId === shop.id ? null : shop.id);
                                    setExpandedCloudinaryShopId(null);
                                  }}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                                    expandedDescShopId === shop.id 
                                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                  }`}
                                  title="স্টোর ডেসক্রিপশন এডিট"
                                >
                                  <Edit2 size={11} /> Description
                                </button>

                                <button
                                  onClick={() => handlePauseShop(shop)}
                                  disabled={processingShopId === shop.id}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all disabled:opacity-50 ${
                                    shop.isActive !== false
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {processingShopId === shop.id ? (
                                    <Loader2 size={11} className="animate-spin" />
                                  ) : shop.isActive !== false ? (
                                    <><Pause size={11} /> Pause</>
                                  ) : (
                                    <><Play size={11} /> Resume</>
                                  )}
                                </button>
                                <button
                                  onClick={() => initiateDeleteShop(shop)}
                                  disabled={processingShopId === shop.id}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                                  title="স্টোর ডিলিট করুন"
                                >
                                  <Trash2 size={11} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedCloudinaryShopId === shop.id && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={8} className="p-4 border-t border-b border-slate-100">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-left">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
                                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                                      ☁️ Cloudinary Configuration for <span className="text-purple-600 font-black">{shop.shopName || 'this store'}</span>
                                    </h4>
                                    
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-slate-500 font-bold">Cloud Settings visibility to owner:</span>
                                      <button
                                        onClick={() => handleUpdateShopCloudinary(shop.id, { 
                                          cloudinaryConfigEnabled: shop.cloudinaryConfigEnabled === false ? true : false 
                                        })}
                                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                                          shop.cloudinaryConfigEnabled !== false ? 'bg-purple-600' : 'bg-slate-300'
                                        }`}
                                      >
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                          shop.cloudinaryConfigEnabled !== false ? 'translate-x-5' : 'translate-x-1'
                                        }`} />
                                      </button>
                                      <span className="text-xs font-black text-slate-700">
                                        {shop.cloudinaryConfigEnabled !== false ? 'Shown' : 'Hidden'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800 leading-relaxed font-bold">
                                      💡 একাধিক Cloudinary অ্যাকাউন্ট যোগ করলে আপলোডকৃত ফাইলগুলো ওই অ্যাকাউন্টগুলোর মাঝে ভাগ হয়ে যাবে, যা স্টোরটির মোট ফ্রি স্টোরেজ বৃদ্ধি করবে। একটি অ্যাকাউন্ট থাকলে সেটিই শুধুমাত্র ব্যবহৃত হবে।
                                    </div>

                                    <div className="space-y-3">
                                      <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Cloudinary Accounts List:</p>
                                      
                                      {(() => {
                                        const accounts = shop.cloudinaryAccounts || [];
                                        const displayAccounts = accounts.length > 0 
                                          ? accounts 
                                          : (shop.cloudinaryCloudName || shop.cloudinaryUploadPreset 
                                              ? [{ cloudName: shop.cloudinaryCloudName || '', uploadPreset: shop.cloudinaryUploadPreset || '' }] 
                                              : []);

                                        return (
                                          <div className="space-y-3">
                                            {displayAccounts.map((acc, idx) => (
                                              <div key={idx} className="flex flex-col md:flex-row gap-3 items-end bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
                                                <div className="flex-1 space-y-1">
                                                  <label className="text-[10px] font-black text-slate-400 uppercase">Cloud Name</label>
                                                  <input
                                                    type="text"
                                                    value={acc.cloudName || ''}
                                                    placeholder="e.g. dcsecgwzc"
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                                                    onChange={(e) => {
                                                      const newAccs = [...displayAccounts];
                                                      newAccs[idx] = { ...newAccs[idx], cloudName: e.target.value.trim() };
                                                      setShops(prev => prev.map(s => s.id === shop.id ? { ...s, cloudinaryAccounts: newAccs } : s));
                                                    }}
                                                    onBlur={() => {
                                                      handleUpdateShopCloudinary(shop.id, { cloudinaryAccounts: displayAccounts });
                                                    }}
                                                  />
                                                </div>
                                                
                                                <div className="flex-1 space-y-1">
                                                  <label className="text-[10px] font-black text-slate-400 uppercase">Upload Preset (Must be Unsigned)</label>
                                                  <input
                                                    type="text"
                                                    value={acc.uploadPreset || ''}
                                                    placeholder="e.g. unsigned_preset"
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                                                    onChange={(e) => {
                                                      const newAccs = [...displayAccounts];
                                                      newAccs[idx] = { ...newAccs[idx], uploadPreset: e.target.value.trim() };
                                                      setShops(prev => prev.map(s => s.id === shop.id ? { ...s, cloudinaryAccounts: newAccs } : s));
                                                    }}
                                                    onBlur={() => {
                                                      handleUpdateShopCloudinary(shop.id, { cloudinaryAccounts: displayAccounts });
                                                    }}
                                                  />
                                                </div>

                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const newAccs = displayAccounts.filter((_, i) => i !== idx);
                                                    handleUpdateShopCloudinary(shop.id, { 
                                                      cloudinaryAccounts: newAccs,
                                                      ...(newAccs.length === 0 ? { cloudinaryCloudName: '', cloudinaryUploadPreset: '' } : {})
                                                    });
                                                  }}
                                                  className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200 flex items-center justify-center h-[38px] w-[38px] shrink-0"
                                                  title="রিমুভ করুন"
                                                >
                                                  <Trash2 size={14} />
                                                </button>
                                              </div>
                                            ))}

                                            <div className="flex flex-wrap gap-3 pt-1">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newAccs = [...displayAccounts, { cloudName: '', uploadPreset: '' }];
                                                  handleUpdateShopCloudinary(shop.id, { cloudinaryAccounts: newAccs });
                                                }}
                                                className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-black flex items-center gap-1 border border-purple-200 transition-all cursor-pointer"
                                              >
                                                <Plus size={12} /> Add Cloudinary Account
                                              </button>

                                              {displayAccounts.length === 1 && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const singleAcc = displayAccounts[0];
                                                    handleUpdateShopCloudinary(shop.id, {
                                                      cloudinaryCloudName: singleAcc.cloudName || '',
                                                      cloudinaryUploadPreset: singleAcc.uploadPreset || ''
                                                    });
                                                    toast.success('Default configuration updated!');
                                                  }}
                                                  className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold border border-blue-200 transition-all cursor-pointer"
                                                >
                                                  Save as Default (Single Config)
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                          {expandedDescShopId === shop.id && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={8} className="p-4 border-t border-b border-slate-100">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-left">
                                  <div className="flex items-center justify-between border-b pb-3">
                                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                                      📝 Edit AI & SEO Description for <span className="text-blue-600 font-black">{shop.shopName || 'this store'}</span>
                                    </h4>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 leading-relaxed font-bold">
                                      💡 এই ডেসক্রিপশনটি কাস্টমারদের স্টোর পেজের উপরে এবং সার্চ ইঞ্জিনের (AEO/SEO) জন্য প্রদর্শিত হবে। এটি সুন্দর এবং তথ্যবহুল হওয়া বাঞ্ছনীয়।
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <label className="text-[11px] font-black text-slate-500 uppercase">Banner / SEO Description</label>
                                      <textarea
                                        rows={4}
                                        value={shop.bannerDescription || shop.description || ''}
                                        placeholder="আমাদের স্টোরে স্বাগতম! এখানে আপনি পাবেন..."
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setShops(prev => prev.map(s => s.id === shop.id ? { ...s, bannerDescription: val, description: val } : s));
                                        }}
                                      />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            const desc = shop.bannerDescription || '';
                                            await updateShop(shop.id, { 
                                              bannerDescription: desc,
                                              description: desc
                                            });
                                            toast.success('ডেসক্রিপশন সফলভাবে আপডেট হয়েছে!');
                                            setExpandedDescShopId(null);
                                          } catch (err) {
                                            toast.error('আপডেট করতে ব্যর্থ হয়েছে: ' + err.message);
                                          }
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer"
                                      >
                                        সংরক্ষণ করুন (Save)
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Showcase Curation & Whitelisting Card */}
        <div className="lg:col-span-12 animate-fade-in">
          <Card
            title="Smart Showcase Curation Whitelist"
            subtitle="সুপারঅ্যাডমিন বেছে নিতে পারবে কোন কোন শপ, ক্যাটাগরি এবং সাবক্যাটাগরি মেইন ওয়েবসাইটে দেখাবে"
            icon={ShieldCheck}
            className="border-2 border-purple-100 bg-purple-50/10"
          >
            <div className="flex items-center justify-between p-5 rounded-2xl border mb-6" style={{borderColor:'var(--border-color)',background:'var(--surface-2)'}}>
              <div>
                <p className="text-sm font-black text-slate-800">শোকেস কিউরেটেশন এনাবল করুন (Showcase Curation Whitelist)</p>
                <p className="text-xs text-slate-400 font-semibold mt-1">অ্যাক্টিভ থাকলে শুধুমাত্র অনুমোদিত আইটেমগুলোই bdretailers.com এ প্রদর্শিত হবে।</p>
              </div>
              <button
                onClick={handleToggleCuration}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                  showcaseCuration.enabled ? 'bg-purple-600' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  showcaseCuration.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {showcaseCuration.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                {/* 1. Shops Column */}
                <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 mb-3 uppercase tracking-wider flex items-center gap-1.5"><Store size={13}/> ১. অনুমোদিত শপ ({showcaseCuration.allowedShops?.length || 0})</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                    {shops.map(shop => {
                      const isAllowed = (showcaseCuration.allowedShops || []).includes(shop.id);
                      return (
                        <label key={shop.id} className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-all border border-slate-100">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => handleToggleWhitelistItem('allowedShops', shop.id)}
                            className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-700 truncate">{shop.shopName}</p>
                            <p className="text-[9px] text-slate-400 font-bold font-mono truncate">{shop.ownerEmail}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Categories Column */}
                <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 mb-3 uppercase tracking-wider flex items-center gap-1.5"><Filter size={13}/> ২. অনুমোদিত ক্যাটাগরি ({showcaseCuration.allowedCategories?.length || 0})</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                    {Array.from(new Set(allProducts.map(p => p.category).filter(Boolean))).map(cat => {
                      const isAllowed = (showcaseCuration.allowedCategories || []).includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-all border border-slate-100">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => handleToggleWhitelistItem('allowedCategories', cat)}
                            className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700">{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Subcategories Column */}
                <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 mb-3 uppercase tracking-wider flex items-center gap-1.5"><ChevronRight size={13}/> ৩. অনুমোদিত সাবক্যাটাগরি ({showcaseCuration.allowedSubcategories?.length || 0})</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                    {Array.from(new Set(allProducts.map(p => p.subcategory).filter(Boolean))).map(sub => {
                      const isAllowed = (showcaseCuration.allowedSubcategories || []).includes(sub);
                      return (
                        <label key={sub} className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-all border border-slate-100">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => handleToggleWhitelistItem('allowedSubcategories', sub)}
                            className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700">{sub}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Product Overrides & Categorization Panel */}
        <div className="lg:col-span-12 animate-fade-in">
          <Card
            title="Smart Inventory Product Category & AI Type Overrides"
            subtitle="সুপারঅ্যাডমিন যেকোনো মার্চেন্টের প্রোডাক্টের ক্যাটাগরি এবং এআই প্রোডাক্ট টাইপ ওভাররাইড করতে পারবে"
            icon={Sparkles}
            className="border-2 border-emerald-100 bg-emerald-50/10"
          >
            {/* Search filter for products */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="প্রোডাক্ট বা মার্চেন্টের নাম লিখে খুঁজুন..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all shadow-sm"
                value={productSearchQuery}
                onChange={e => setProductSearchQuery(e.target.value)}
              />
            </div>

            {productsLoading ? (
              <div className="py-10 text-center animate-pulse">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Scanning all marketplace products...</p>
              </div>
            ) : filteredCurationProducts.length === 0 ? (
              <div className="py-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin border border-slate-100 rounded-2xl bg-white p-4">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="pb-2 px-4 border-b border-slate-100">প্রোডাক্ট</th>
                      <th className="pb-2 px-4 border-b border-slate-100">মার্চেন্ট বা শপ</th>
                      <th className="pb-2 px-4 border-b border-slate-100">ক্যাটাগরি ওভাররাইড</th>
                      <th className="pb-2 px-4 border-b border-slate-100">এআই টাইপ ওভাররাইড</th>
                      <th className="pb-2 px-4 border-b border-slate-100 text-center">মেইন সাইটে দেখান</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCurationProducts.map(product => {
                      return (
                        <tr key={product.id} className="bg-white hover:bg-slate-50 transition-colors border-b border-slate-50">
                          <td className="p-3 first:rounded-l-2xl">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80'}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0"
                                alt=""
                              />
                              <div>
                                <p className="font-bold text-slate-900 text-xs">{product.name}</p>
                                <p className="text-[9px] text-slate-400 font-semibold font-mono">ID: {product.id.substring(0,8)} | ৳{product.price}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-black text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              {product.shopName}
                            </span>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={product.category || ''}
                              onChange={async (e) => {
                                const newCat = e.target.value;
                                // Update local state
                                setAllProducts(prev => prev.map(p => p.id === product.id ? { ...p, category: newCat } : p));
                                // Save to Firestore
                                try {
                                  await updateProduct(product.shopId, product.id, { category: newCat });
                                  toast.success('Category updated inline!');
                                } catch (err) {
                                  toast.error('Failed to update category');
                                }
                              }}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold w-40 bg-white text-slate-800"
                              placeholder="ক্যাটাগরি লিখুন"
                            />
                          </td>
                          <td className="p-3">
                            <select
                              value={product.superadminType || ''}
                              onChange={async (e) => {
                                const newType = e.target.value;
                                // Update local state
                                setAllProducts(prev => prev.map(p => p.id === product.id ? { ...p, superadminType: newType } : p));
                                // Save to Firestore
                                try {
                                  await updateProduct(product.shopId, product.id, { superadminType: newType });
                                  toast.success('AI Product Type overridden!');
                                } catch (err) {
                                  toast.error('Failed to override AI Type');
                                }
                              }}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-black bg-white text-slate-800 outline-none cursor-pointer"
                            >
                              <option value="">(এআই অটো ডিটেক্ট)</option>
                              <option value="মাংস ও ডিম (Poultry & Eggs)">মাংস ও ডিম (Poultry & Eggs)</option>
                              <option value="সবজি ও ফল (Vegetables & Fruits)">সবজি ও ফল (Vegetables & Fruits)</option>
                              <option value="মুদি ও নিত্যপ্রয়োজনীয় (Groceries)">মুদি ও নিত্যপ্রয়োজনীয় (Groceries)</option>
                              <option value="পানীয় ও দুগ্ধজাত (Drinks & Dairy)">পানীয় ও দুগ্ধজাত (Drinks & Dairy)</option>
                              <option value="অন্যান্য পণ্য (Others)">অন্যান্য পণ্য (Others)</option>
                            </select>
                          </td>
                          <td className="p-3 last:rounded-r-2xl text-center">
                            <label className="relative inline-flex items-center cursor-pointer justify-center">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={product.showOnMainSite !== false} 
                                onChange={async (e) => {
                                  const show = e.target.checked;
                                  setAllProducts(prev => prev.map(p => p.id === product.id ? { ...p, showOnMainSite: show } : p));
                                  try {
                                    await updateProduct(product.shopId, product.id, { showOnMainSite: show });
                                    toast.success(show ? 'পণ্যটি মেইন সাইটে দৃশ্যমান করা হয়েছে' : 'পণ্যটি মেইন সাইট থেকে হাইড করা হয়েছে');
                                  } catch (err) {
                                    toast.error('হাইড/শো আপডেট করতে সমস্যা হয়েছে');
                                  }
                                }} 
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* 🔍 Impersonation Audit Logs */}
        <div className="lg:col-span-12">
          <Card
            title="ইম্পার্সোনেশন অডিট লগ"
            subtitle="সুপারঅ্যাডমিন কখন কোন রিটেইলারের ড্যাশবোর্ডে প্রবেশ করেছেন"
            icon={ShieldAlert}
            className="border-2 border-purple-100 bg-purple-50/10"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500 font-bold">সর্বশেষ ২০টি session</p>
              <button
                onClick={loadImpersonationLogs}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition-all"
              >
                <History size={14} /> লগ লোড করুন
              </button>
            </div>

            {showLogs && (
              impersonationLogs.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ShieldAlert size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">কোনো ইম্পার্সোনেশন লগ নেই</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {impersonationLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 hover:border-purple-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${log.isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                        <div>
                          <p className="text-xs font-black text-slate-900">{log.shopName}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{log.retailerEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
                        <span>IP: {log.ip}</span>
                        <span className={`px-2 py-0.5 rounded-md font-black ${log.isActive ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                          {log.isActive ? '🔴 সক্রিয়' : '✅ শেষ'}
                        </span>
                        <span>{log.loginAt?.toDate?.()?.toLocaleString('bn-BD') || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>
        </div>

        {/* 🔔 Broadcast Center */}
        <div className="lg:col-span-12">
          <SuperadminBroadcastPanel shops={shops} />
        </div>

        {/* 📱 Mobile App Builder Center */}
        <div className="lg:col-span-12">
          <SuperadminAppBuilder />
        </div>

        {/* Invitation Area */}
        <div className="lg:col-span-12">
          <Card
            title="Retailer Management"
            subtitle="Manually invite partners via email"
            icon={UserPlus}
          >
            <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="retailer.email@gmail.com"
                icon={Mail}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                loading={inviting}
                icon={UserPlus}
                className="md:w-56 h-[52px]"
              >
                Invite Retailer
              </Button>
            </form>

            <div className="mt-12 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorized Access Pool ({invites.length})</p>
              </div>

              {loading ? (
                <div className="py-20 text-center animate-pulse">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching records...</p>
                </div>
              ) : invites.length === 0 ? (
                <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <UserPlus size={40} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active invitations found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {invites.map((invite) => (
                    <div key={invite.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between group hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 text-sm">
                          {invite.email?.[0]?.toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm text-slate-900 truncate max-w-[150px]">{invite.email}</p>
                          <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Authorized</p>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        icon={Trash2}
                        onClick={() => handleRemoveInvite(invite.id, invite.email)}
                        className="opacity-0 group-hover:opacity-100 px-3 py-2 shrink-0 scale-90"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative shadow-2xl animate-slide-in overflow-hidden">
            <button onClick={() => setDeleteModal({ isOpen: false, shop: null, password: '', loading: false, otpSent: false, otp: '' })} className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors z-10">
              <XCircle size={18} className="stroke-[3]" />
            </button>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/30">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Delete "{deleteModal.shop?.shopName}"?</h3>
            <p className="text-slate-500 text-sm font-bold mb-6">This action is irreversible. All data will be permanently lost.</p>
            
            <div className="space-y-4">
              <Input
                type="password"
                label="Superadmin Password"
                placeholder="Enter password to confirm"
                value={deleteModal.password}
                onChange={e => setDeleteModal(prev => ({ ...prev, password: e.target.value }))}
                icon={Key}
              />
              {deleteModal.otpSent && (
                <Input
                  type="text"
                  label="OTP (Check Admin Email)"
                  placeholder="Enter 6-digit OTP"
                  value={deleteModal.otp}
                  onChange={e => setDeleteModal(prev => ({ ...prev, otp: e.target.value }))}
                />
              )}
              <div className="flex flex-col gap-2 pt-2">
                {!deleteModal.otpSent ? (
                  <>
                    <Button onClick={executeDeleteShop} loading={deleteModal.loading} variant="danger" className="w-full">
                      Confirm Deletion
                    </Button>
                    <button type="button" onClick={handleForgotPassword} disabled={deleteModal.loading} className="text-xs font-bold text-slate-400 hover:text-purple-600 transition-colors py-2">
                      Forgot Password?
                    </button>
                  </>
                ) : (
                  <Button onClick={handleResetPassword} loading={deleteModal.loading} variant="primary" className="w-full">
                    Reset Password
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
