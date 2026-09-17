'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { getProducts, getShop } from '@/lib/firestore';
import { 
  Rocket, Plus, ExternalLink, Copy, Check, Trash2, Edit3, Eye, 
  ShoppingBag, Sparkles, Clock, Truck, ShieldCheck, Tag, ArrowRight, X, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LandingPagesDashboard() {
  const { user, activeShopId } = useAuth();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [landingPages, setLandingPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLp, setEditingLp] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    headline: '',
    subheadline: '',
    productId: '',
    offerPrice: '',
    regularPrice: '',
    features: ['১০০% অরিজিনাল ও প্রিমিয়াম কোয়ালিটি', '৩-৫ দিনে সারা বাংলাদেশে ক্যাশ অন ডেলিভারি', 'পণ্য দেখে মূল্য পরিশোধের সুবিধা'],
    countdownMinutes: 20,
    deliveryFeeInside: 60,
    deliveryFeeOutside: 120,
    status: 'active'
  });

  // Load shop & products
  useEffect(() => {
    if (!activeShopId) return;

    getShop(activeShopId).then(data => setShop(data));
    getProducts(activeShopId).then(data => setProducts(data || []));

    // Listen to landing pages
    const lpRef = collection(db, 'shops', activeShopId, 'landingPages');
    const unsubscribe = onSnapshot(lpRef, (snap) => {
      const list = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setLandingPages(list);
      setLoading(false);
    }, (err) => {
      console.error('Failed to load landing pages:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeShopId]);

  const handleProductSelect = (productId) => {
    const p = products.find(prod => prod.id === productId);
    if (p) {
      const price = parseFloat(p.price) || 0;
      setFormData(prev => ({
        ...prev,
        productId,
        title: prev.title || p.name,
        slug: prev.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        headline: prev.headline || `স্পেশাল অফার — ${p.name}`,
        regularPrice: p.regularPrice || (price > 0 ? (price * 1.3).toFixed(0) : ''),
        offerPrice: price > 0 ? price.toString() : '',
      }));
    } else {
      setFormData(prev => ({ ...prev, productId }));
    }
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const handleFeatureChange = (index, value) => {
    const updated = [...formData.features];
    updated[index] = value;
    setFormData(prev => ({ ...prev, features: updated }));
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const openCreateModal = () => {
    setEditingLp(null);
    setFormData({
      title: '',
      slug: '',
      headline: 'সীমিত সময়ের জন্য বিশেষ ছাড়! আজই অর্ডার করুন',
      subheadline: 'অর্ডার করতে নিচের ফর্মে আপনার নাম, ঠিকানা ও মোবাইল নম্বর দিন।',
      productId: products[0]?.id || '',
      offerPrice: products[0]?.price || '',
      regularPrice: products[0]?.regularPrice || '',
      features: ['১০০% অরিজিনাল ও প্রিমিয়াম কোয়ালিটি', '৩-৫ দিনে সারা বাংলাদেশে ক্যাশ অন ডেলিভারি', 'পণ্য দেখে মূল্য পরিশোধের সুবিধা'],
      countdownMinutes: 20,
      deliveryFeeInside: shop?.deliveryFeeDhaka || 60,
      deliveryFeeOutside: shop?.deliveryFeeOutside || 120,
      status: 'active'
    });
    if (products[0]) {
      handleProductSelect(products[0].id);
    }
    setModalOpen(true);
  };

  const openEditModal = (lp) => {
    setEditingLp(lp);
    setFormData({
      title: lp.title || '',
      slug: lp.slug || '',
      headline: lp.headline || '',
      subheadline: lp.subheadline || '',
      productId: lp.productId || '',
      offerPrice: lp.offerPrice?.toString() || '',
      regularPrice: lp.regularPrice?.toString() || '',
      features: Array.isArray(lp.features) ? lp.features : [],
      countdownMinutes: lp.countdownMinutes || 20,
      deliveryFeeInside: lp.deliveryFeeInside ?? 60,
      deliveryFeeOutside: lp.deliveryFeeOutside ?? 120,
      status: lp.status || 'active'
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('অনুগ্রহ করে ল্যান্ডিং পেজের একটি শিরোনাম দিন');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('একটি ইউনিক লিংক স্লাগ দিন (যেমন: summer-offer)');
      return;
    }
    if (!formData.productId) {
      toast.error('একটি পণ্য নির্বাচন করুন');
      return;
    }

    setSaving(true);
    try {
      const cleanSlug = formData.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');
      const selectedProd = products.find(p => p.id === formData.productId);

      const payload = {
        title: formData.title.trim(),
        slug: cleanSlug,
        headline: formData.headline.trim(),
        subheadline: formData.subheadline.trim(),
        productId: formData.productId,
        productName: selectedProd?.name || '',
        productImage: selectedProd?.imageUrl || '',
        offerPrice: parseFloat(formData.offerPrice) || (parseFloat(selectedProd?.price) || 0),
        regularPrice: parseFloat(formData.regularPrice) || (parseFloat(selectedProd?.regularPrice) || 0),
        features: formData.features.filter(f => f.trim().length > 0),
        countdownMinutes: parseInt(formData.countdownMinutes) || 20,
        deliveryFeeInside: parseFloat(formData.deliveryFeeInside) || 60,
        deliveryFeeOutside: parseFloat(formData.deliveryFeeOutside) || 120,
        status: formData.status,
        shopId: activeShopId,
        updatedAt: serverTimestamp(),
      };

      if (editingLp) {
        await updateDoc(doc(db, 'shops', activeShopId, 'landingPages', editingLp.id), payload);
        toast.success('ল্যান্ডিং পেজ আপডেট হয়েছে ✓');
      } else {
        payload.createdAt = serverTimestamp();
        payload.views = 0;
        payload.ordersCount = 0;
        await addDoc(collection(db, 'shops', activeShopId, 'landingPages'), payload);
        toast.success('নতুন ল্যান্ডিং পেজ সফলভাবে তৈরি হয়েছে! 🎉');
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Save landing page error:', err);
      toast.error('সংরক্ষণ ব্যর্থ হয়েছে: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${title}" ল্যান্ডিং পেজটি মুছে ফেলতে চান?`)) return;
    try {
      await deleteDoc(doc(db, 'shops', activeShopId, 'landingPages', id));
      toast.success('ল্যান্ডিং পেজ মুছে ফেলা হয়েছে');
    } catch (err) {
      toast.error('মুছে ফেলা সম্ভব হয়নি: ' + err.message);
    }
  };

  const getLandingPageUrl = (slug) => {
    if (typeof window === 'undefined') return `/lp/${slug}`;
    const host = window.location.host;
    const protocol = window.location.protocol;
    return `${protocol}//${host}/lp/${slug}`;
  };

  const copyLink = (id, slug) => {
    const url = getLandingPageUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('ফেসবুক বিজ্ঞাপনের জন্য লিংক কপি হয়েছে! 📋');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const totalOrders = landingPages.reduce((sum, lp) => sum + (lp.ordersCount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Rocket size={22} />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ল্যান্ডিং পেজ ও সেলস ফানেল (Landing Pages)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            ফেসবুক বা সোশ্যাল মিডিয়া বিজ্ঞাপনের জন্য আকর্ষণীয় ১-ক্লিক অর্ডার ল্যান্ডিং পেজ তৈরি করুন।
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus size={18} />
          <span>নতুন ল্যান্ডিং পেজ তৈরি করুন</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
            <Rocket size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">মোট ল্যান্ডিং পেজ</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{landingPages.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">ল্যান্ডিং পেজ থেকে অর্ডার</p>
            <p className="text-2xl font-black text-emerald-600">{totalOrders}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">অর্ডার ট্র্যাকিং</p>
            <p className="text-sm font-black text-blue-600">অর্ডার হাবে সরাসরি উৎস চিহ্নিত</p>
          </div>
        </div>
      </div>

      {/* Landing Pages List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-white">আপনার ল্যান্ডিং পেজসমূহ</h2>
          <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800/60">
            {landingPages.length} টি সক্রিয় পেজ
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold text-sm">লোড হচ্ছে...</div>
        ) : landingPages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mx-auto">
              <Rocket size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">এখনও কোনো ল্যান্ডিং পেজ তৈরি করেননি</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              ফেসবুক ও সোশ্যাল মিডিয়ায় যেকোনো বিশেষ অফার বা কম্বো বিক্রির জন্য মাত্র ২ মিনিটে একটি হাই-কনভার্টিং ল্যান্ডিং পেজ তৈরি করুন।
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white font-black text-xs shadow-md hover:bg-purple-700 transition-all cursor-pointer"
            >
              প্রথম ল্যান্ডিং পেজ তৈরি করুন →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {landingPages.map(lp => (
              <div key={lp.id} className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-start gap-4 min-w-0">
                  {lp.productImage ? (
                    <img src={lp.productImage} alt="" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-black text-xs shrink-0">
                      LP
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                        {lp.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        🚀 {lp.ordersCount || 0} টি অর্ডার
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-lg">
                      {lp.headline}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                        অফার মূল্য: ৳{lp.offerPrice}
                      </span>
                      {lp.regularPrice > lp.offerPrice && (
                        <span className="text-[11px] font-bold text-slate-400 line-through">
                          ৳{lp.regularPrice}
                        </span>
                      )}
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[11px] font-mono text-slate-500 truncate max-w-xs">
                        /lp/{lp.slug}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyLink(lp.id, lp.slug)}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-black text-xs border border-purple-200 dark:border-purple-800/60 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="ফেসবুক বিজ্ঞাপনে ব্যবহারের জন্য লিংক কপি করুন"
                  >
                    {copiedId === lp.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copiedId === lp.id ? 'কপি হয়েছে!' : 'কপি লিংক'}</span>
                  </button>

                  <a
                    href={getLandingPageUrl(lp.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="লাইভ দেখুন"
                  >
                    <ExternalLink size={16} />
                  </a>

                  <button
                    onClick={() => openEditModal(lp)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="সম্পাদনা করুন"
                  >
                    <Edit3 size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(lp.id, lp.title)}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950/40">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Rocket size={18} className="text-purple-600" />
                <span>{editingLp ? 'ল্যান্ডিং পেজ সম্পাদনা' : 'নতুন ল্যান্ডিং পেজ তৈরি করুন'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  পণ্য নির্বাচন করুন *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">পণ্য বেছে নিন...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (৳{p.price})</option>
                  ))}
                </select>
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    ল্যান্ডিং পেজ নাম *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="যেমন: ধামাকা কম্বো অফার"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    ইউনিক লিংক স্লাগ * (URL)
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 focus-within:ring-2 focus-within:ring-purple-500">
                    <span className="text-[11px] font-mono text-slate-400">/lp/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                      placeholder="special-offer"
                      className="w-full py-2.5 px-1 bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Headline & Subheadline */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  প্রধান হেডলাইন (Headline)
                </label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder="যেমন: আজকের স্পেশাল ডিসকাউন্ট অফার! সাথে ফ্রি ডেলিভারি"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    অফার মূল্য (৳) *
                  </label>
                  <input
                    type="number"
                    value={formData.offerPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, offerPrice: e.target.value }))}
                    placeholder="850"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-black text-purple-600 dark:text-purple-400 outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    রেগুলার মূল্য (কাটা দাগের জন্য) (৳)
                  </label>
                  <input
                    type="number"
                    value={formData.regularPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, regularPrice: e.target.value }))}
                    placeholder="1200"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Features Bullets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                    পণ্যের বিশেষ সুবিধাসমূহ (Bullet Points)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="text-xs font-black text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                  >
                    + নতুন সুবিধা
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        placeholder="যেমন: ৩ দিনে ডেলিভারি"
                        className="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    কাউন্টডাউন মিনিট
                  </label>
                  <input
                    type="number"
                    value={formData.countdownMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, countdownMinutes: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    ডেলিভারি (ঢাকার ভেতরে)
                  </label>
                  <input
                    type="number"
                    value={formData.deliveryFeeInside}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryFeeInside: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    ডেলিভারি (ঢাকার বাইরে)
                  </label>
                  <input
                    type="number"
                    value={formData.deliveryFeeOutside}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryFeeOutside: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : (editingLp ? 'আপডেট করুন' : 'ল্যান্ডিং পেজ তৈরি করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
