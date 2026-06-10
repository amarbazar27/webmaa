import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { 
  Smartphone, Download, Cpu, RefreshCw, CheckCircle2, AlertCircle, Clock,
  ExternalLink, FileText, Clipboard, Copy, Check, Eye, HelpCircle, X, RotateCcw, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const reservedKeywords = new Set([
  'abstract', 'as', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue',
  'default', 'do', 'double', 'else', 'enum', 'extends', 'false', 'final', 'finally', 'float', 'for', 'fun', 'goto',
  'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'is', 'long', 'native', 'new', 'null',
  'object', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch',
  'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typealias', 'typeof', 'val', 'var',
  'void', 'volatile', 'when', 'while'
]);

export default function SuperadminAppBuilder() {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingId, setBuildingId] = useState(null);
  
  // Modal State for Play Console Assets
  const [selectedShop, setSelectedShop] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  // 1. Real-time Firestore Listener for Shops
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'shops'), (snapshot) => {
      const shopList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShops(shopList);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to shops:", error);
      toast.error("শপের ডাটা লাইভ আপডেট লোড করতে ব্যর্থ হয়েছে।");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Trigger API Build Request
  const handleGenerateApp = async (shopId, shopSlug) => {
    if (!user) {
      toast.error("লগইন করা প্রয়োজন।");
      return;
    }

    setBuildingId(shopId);
    const loadingToast = toast.loading(`${shopSlug}-এর জন্য অ্যান্ড্রয়েড বিল্ড প্রসেস শুরু হচ্ছে...`);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/build-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shopId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "বিল্ড প্রসেস শুরু করতে ব্যর্থ হয়েছে।");
      }

      toast.success(data.message || "বিল্ড রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!", { id: loadingToast });
    } catch (error) {
      console.error("Build trigger error:", error);
      toast.error(error.message, { id: loadingToast });
    } finally {
      setBuildingId(null);
    }
  };

  // 3. Reset a stuck 'building' status directly in Firestore
  const handleResetBuild = async (shopId, shopName) => {
    if (!confirm(`"${shopName}"-এর আটকে যাওয়া বিল্ড স্ট্যাটাস রিসেট করবেন?`)) return;
    try {
      await updateDoc(doc(db, 'shops', shopId), {
        appBuildStatus: 'not_generated',
        appBuildError: null,
      });
      toast.success(`"${shopName}"-এর বিল্ড স্ট্যাটাস রিসেট হয়েছে! এখন নতুন করে Generate App দিন।`);
    } catch (err) {
      toast.error('রিসেট করতে সমস্যা: ' + err.message);
    }
  };

  // Copy helper
  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    toast.success("কপি করা হয়েছে!");
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Filter shops
  const filteredShops = shops.filter(shop => {
    const name = (shop.shopName || '').toLowerCase();
    const slug = (shop.subdomainSlug || shop.shopSlug || '').toLowerCase();
    const email = (shop.ownerEmail || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || slug.includes(query) || email.includes(query);
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-100/50 p-6 md:p-8 animate-slide-in">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Smartphone className="text-white" size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">One-Click Android White-Label App Builder</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Daripallah ইকোসিস্টেমের সব রিটেইলারের জন্য অটোমেটেড APK এবং AAB (Google Play ready) ফাইল জেনারেশন সিস্টেম
            </p>
          </div>
        </div>
        
        {/* Search input */}
        <div className="w-full md:w-80">
          <input 
            type="text" 
            placeholder="স্টোরের নাম বা স্ল্যাগ লিখে খুঁজুন..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-purple-600" size={30} />
          <p className="text-xs text-slate-400 font-black uppercase tracking-wider">শপ তালিকা স্ক্যান করা হচ্ছে...</p>
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50">
          <Smartphone size={50} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">কোনো শপ পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2.5">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="pb-2 px-4">রিটেইলার স্টোর</th>
                <th className="pb-2 px-4">প্যাকেজ আইডি (Play Store ID)</th>
                <th className="pb-2 px-4">থিম ও ইউআরএল</th>
                <th className="pb-2 px-4">বিল্ড স্ট্যাটাস</th>
                <th className="pb-2 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((shop) => {
                const slug = shop.subdomainSlug || shop.shopSlug;
                const status = shop.appBuildStatus || 'not_generated'; // not_generated, building, completed, failed
                const rawSlug = (slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const packageSlug = reservedKeywords.has(rawSlug) ? `${rawSlug}app` : rawSlug;
                const packageId = shop.appBuildPackageName || `com.daripallah.${packageSlug}`;
                const primaryColor = shop.designOverrides?.primaryColor || '#9333ea';
                
                return (
                  <tr key={shop.id} className="bg-white hover:bg-purple-50/20 transition-all border border-slate-100 shadow-sm rounded-2xl group">
                    {/* Store Identity */}
                    <td className="p-4 rounded-l-2xl border-y border-l border-slate-100">
                      <div className="flex items-center gap-3">
                        {shop.logoUrl ? (
                          <img src={shop.logoUrl} className="w-10 h-10 rounded-xl object-cover border border-slate-200" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center font-black text-purple-600 text-sm">
                            {shop.shopName?.[0]?.toUpperCase() || 'S'}
                          </div>
                        )}
                        <div>
                          <p className="font-black text-slate-900 text-sm leading-none">{shop.shopName}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1.5 truncate max-w-[150px]">{shop.ownerEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Package ID */}
                    <td className="p-4 border-y border-slate-100 font-mono text-xs text-slate-600 font-semibold">
                      {packageId}
                    </td>

                    {/* Branding overrides */}
                    <td className="p-4 border-y border-slate-100">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-slate-800 leading-none">
                          /{slug}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: primaryColor }} />
                          <span className="text-[9px] font-black font-mono uppercase text-slate-500">{primaryColor}</span>
                        </div>
                      </div>
                    </td>

                    {/* Build status */}
                    <td className="p-4 border-y border-slate-100">
                      {status === 'not_generated' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200/50">
                          <Clock size={11} /> Not Generated
                        </span>
                      )}
                      {status === 'building' && (
                        <div className="flex flex-col gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
                            <RefreshCw className="animate-spin" size={11} /> Building...
                          </span>
                          <button
                            onClick={() => handleResetBuild(shop.id, shop.shopName)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-all w-max"
                            title="৩০+ মিনিট ধরে আটকে থাকলে রিসেট করুন"
                          >
                            <RotateCcw size={9} /> আটকে গেছে? রিসেট করুন
                          </button>
                        </div>
                      )}
                      {status === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} /> Compiled
                        </span>
                      )}
                      {status === 'failed' && (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-red-50 text-red-700 border border-red-200 w-max cursor-pointer" title={shop.appBuildError} onClick={() => toast.error(`Error: ${shop.appBuildError}`, { duration: 5000 })}>
                            <AlertCircle size={11} /> Failed
                          </span>
                          <span className="text-[8px] text-red-500 font-bold truncate max-w-[120px]" title={shop.appBuildError}>
                            {shop.appBuildError}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 rounded-r-2xl border-y border-r border-slate-100 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        
                        {/* Play Store submission assets package */}
                        {status === 'completed' && (
                          <button
                            onClick={() => setSelectedShop(shop)}
                            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                            title="Play Console Launch Assets"
                          >
                            <FileText size={15} />
                          </button>
                        )}

                        {/* Download APK */}
                        {status === 'completed' && shop.appBuildApkUrl && (
                          <a
                            href={shop.appBuildApkUrl}
                            download
                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                            title="Download APK (Direct Install)"
                          >
                            <Download size={15} />
                          </a>
                        )}

                        {/* Download AAB */}
                        {status === 'completed' && shop.appBuildAabUrl && (
                          <a
                            href={shop.appBuildAabUrl}
                            download
                            className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white rounded-xl transition-all"
                            title="Download AAB (Google Play Store Bundle)"
                          >
                            <Smartphone size={15} />
                          </a>
                        )}

                        {/* Generate Trigger Button */}
                        <button
                          onClick={() => handleGenerateApp(shop.id, slug)}
                          disabled={buildingId !== null || status === 'building'}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                            status === 'completed'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                              : 'bg-purple-600 text-white shadow-md shadow-purple-500/15 hover:bg-purple-700'
                          } disabled:opacity-50`}
                        >
                          {buildingId === shop.id ? (
                            <RefreshCw className="animate-spin" size={13} />
                          ) : (
                            <Cpu size={13} />
                          )}
                          {status === 'completed' ? 'Rebuild App' : status === 'failed' ? 'Retry Build' : 'Generate App'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== PLAY CONSOLE ASSETS MODAL ==================== */}
      {selectedShop && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-2xl p-6 md:p-8 max-w-2xl w-full relative animate-slide-in max-h-[85vh] overflow-y-auto scrollbar-thin">
            
            {/* Close button */}
            <button 
              onClick={() => setSelectedShop(null)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Title */}
            <div className="flex items-center gap-3 border-b pb-5 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Google Play Submission Kit</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">{selectedShop.shopName}</p>
              </div>
            </div>

            {/* Content body */}
            <div className="space-y-6 text-slate-800 text-xs font-medium">
              
              {/* 1. Keystore Command */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-xs font-black text-slate-900 mb-2 flex items-center justify-between">
                  <span>১. Keystore জেনারেট করার কমান্ড (Android App Signing)</span>
                  <button 
                    onClick={() => handleCopy(`keytool -genkey -v -keystore ${selectedShop.subdomainSlug || selectedShop.shopSlug}-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias ${selectedShop.subdomainSlug || selectedShop.shopSlug}-key`, 'key')}
                    className="flex items-center gap-1 text-[10px] text-purple-600 font-bold hover:underline"
                  >
                    {copiedText === 'key' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    কপি করুন
                  </button>
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                  গুগল প্লে স্টোরে আপলোড করার জন্য প্রথমে একটি কীস্টোর ফাইল তৈরি করতে হবে। আপনার টার্মিনালে নিচের কোডটি রান করুন:
                </p>
                <pre className="bg-slate-900 text-slate-100 font-mono text-[10px] p-3 rounded-xl overflow-x-auto whitespace-pre-wrap select-all leading-relaxed">
                  keytool -genkey -v -keystore {(selectedShop.subdomainSlug || selectedShop.shopSlug || 'shop').toLowerCase().replace(/[^a-z0-9]/g, '')}-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias {(selectedShop.subdomainSlug || selectedShop.shopSlug || 'shop').toLowerCase().replace(/[^a-z0-9]/g, '')}-key
                </pre>
              </div>

              {/* 2. Metadata details */}
              <div className="space-y-4">
                <p className="text-xs font-black text-slate-900">২. প্লে কনসোল স্টোর লিস্টিং মেটাডাটা (Listing Metadata)</p>
                
                {/* Short desc */}
                <div className="border border-slate-200 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Short Description (Max 80 chars)</span>
                    <button onClick={() => handleCopy(`Official Android App for ${selectedShop.shopName}. Shop online with fast delivery, reviews, and secure checkout.`, 'short')} className="text-purple-600 font-bold hover:underline">কপি</button>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Official Android App for {selectedShop.shopName}. Shop online with fast delivery, reviews, and secure checkout.
                  </p>
                </div>

                {/* Long desc */}
                <div className="border border-slate-200 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Long Description (Full Description)</span>
                    <button 
                      onClick={() => handleCopy(`Welcome to the official ${selectedShop.shopName} Android mobile application!\n\nBrowse through our extensive catalog of products, manage your cart, apply coupon discounts, track your orders in real-time, and check out securely.\n\nKey App Features:\n- Full access to the catalog and product variants\n- Real-time notifications and alerts\n- Seamless digital and cash-on-delivery payments\n- Dynamic support chats\n- Offline caching and performance optimization\n\nDownload the ${selectedShop.shopName} app today and enjoy a premium e-commerce experience!`, 'long')} 
                      className="text-purple-600 font-bold hover:underline"
                    >
                      কপি
                    </button>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg text-[10px] font-bold text-slate-700 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {`Welcome to the official ${selectedShop.shopName} Android mobile application!\n\nBrowse through our extensive catalog of products, manage your cart, apply coupon discounts, track your orders in real-time, and check out securely.\n\nKey App Features:\n- Full access to the catalog and product variants\n- Real-time notifications and alerts\n- Seamless digital and cash-on-delivery payments\n- Dynamic support chats\n- Offline caching and performance optimization\n\nDownload the ${selectedShop.shopName} app today and enjoy a premium e-commerce experience!`}
                  </div>
                </div>

                {/* Privacy Policy */}
                <div className="border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Privacy Policy URL</span>
                    <span className="text-xs font-bold text-slate-800">
                      https://{(selectedShop.subdomainSlug || selectedShop.shopSlug)}.daripallah.com/privacy-policy
                    </span>
                  </div>
                  <button onClick={() => handleCopy(`https://${(selectedShop.subdomainSlug || selectedShop.shopSlug)}.daripallah.com/privacy-policy`, 'privacy')} className="text-purple-600 font-bold hover:underline shrink-0">কপি</button>
                </div>
              </div>

              {/* 3. Data Safety Form replies */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-black text-amber-950 mb-2">৩. Data Safety ফর্ম ডিক্লেয়ারেশন (প্লে স্টোরের জন্য)</p>
                <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-amber-900 leading-relaxed font-bold">
                  <li><strong>Location (স্থান)</strong>: Collected (সংগৃহীত) - ডেলিভারি অ্যাড্রেসিং এর জন্য।</li>
                  <li><strong>Personal Info (ব্যক্তিগত তথ্য)</strong>: Name, Email, Phone, Address collected - অ্যাকাউন্ট রেজিস্ট্রেশন এবং অর্ডার হ্যান্ডলিং এর জন্য।</li>
                  <li><strong>Financial Info (অর্থনৈতিক তথ্য)</strong>: Payment gateway inputs are handled securely by payment providers (SSLCommerz/Bkash). No credit card information is saved inside the app.</li>
                  <li><strong>Security Practices (নিরাপত্তা)</strong>: Data is transferred over secure HTTPS connections. Users can request account/data deletion.</li>
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="mt-8 border-t pt-5 flex justify-end">
              <button 
                onClick={() => setSelectedShop(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
