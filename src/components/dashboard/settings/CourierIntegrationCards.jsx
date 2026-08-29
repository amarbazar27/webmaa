'use client';
import { useState } from 'react';
import { Truck } from 'lucide-react';

export default function CourierIntegrationCards({ courierConfig = {}, setCourierConfig = () => {}, activeShopId = '' }) {
  const [showSteadfastHelp, setShowSteadfastHelp] = useState(false);
  const [showPathaoHelp, setShowPathaoHelp] = useState(false);
  const [showRedxHelp, setShowRedxHelp] = useState(false);
  const [showPaperflyHelp, setShowPaperflyHelp] = useState(false);

  const cfg = courierConfig || {};
  const updateField = (key, value) => {
    setCourierConfig(prev => ({
      ...(prev || {}),
      [key]: value
    }));
  };

  return (
    <div className="space-y-8 animate-slide-in">
      {/* 1. Steadfast Courier Settings */}
      <div className="border-2 border-slate-100 shadow-xl bg-white rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">Steadfast Courier API Integration</h3>
            <p className="text-xs text-slate-500 font-medium">One-tap parcel delivery and tracking number generation</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">ইন্টিগ্রেশন সেটিংস</span>
            <button 
              type="button" 
              onClick={() => setShowSteadfastHelp(!showSteadfastHelp)} 
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[10px] sm:text-xs font-black transition-all border border-purple-200 cursor-pointer shadow-sm select-none"
            >
              ❓ Setup Guide (সহায়িকা)
            </button>
          </div>

          {showSteadfastHelp && (
            <div className="p-5 bg-gradient-to-br from-purple-50/70 to-indigo-50/30 rounded-2xl border border-purple-100 text-[11px] font-bold text-slate-700 space-y-3 animate-slide-in">
              <p className="text-xs sm:text-sm font-black text-purple-900 flex items-center gap-1.5 mb-2">🚚 স্টেডফাস্ট কুরিয়ার ইন্টিগ্রেশন গাইড</p>
              <ul className="list-decimal pl-5 space-y-2.5 leading-relaxed">
                <li>
                  <strong className="text-slate-950">মার্চেন্ট পোর্টাল লিংক:</strong> সরাসরি অফিসিয়াল <a href="https://steadfast.com.bd/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline font-black">Steadfast Courier Portal (steadfast.com.bd)</a> এ গিয়ে আপনার মার্চেন্ট অ্যাকাউন্টে লগইন করুন।
                </li>
                <li>
                  <strong className="text-slate-950">এপিআই কী সংগ্রহ:</strong> ড্যাশবোর্ড থেকে <strong className="text-slate-950">Settings &gt; API Information</strong> মেনুতে যান। সেখানে জেনারেট করা <strong className="text-slate-950">API Key</strong> এবং <strong className="text-slate-950">Secret Key</strong> কপি করে এনে নিচের ফিল্ডগুলোতে পেস্ট করুন।
                </li>
                <li>
                  <strong className="text-slate-950">অটোমেটিক স্ট্যাটাস আপডেট (Webhook):</strong> স্টেডফাস্ট পোর্টালে Webhook URL হিসেবে নিচে দেখানো Callback URL-টি সেভ করুন। এতে পার্সেল ডেলিভারি বা রিটার্ন হলে আপনার স্টোরের অর্ডার স্ট্যাটাস নিজে নিজেই আপডেট হবে।
                </li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-black text-slate-900">ইন্টিগ্রেশন সক্রিয় করুন (Enable Steadfast Courier)</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">অর্ডার অ্যাকশন থেকে ওয়ান-ক্লিক পার্সেল বুকিং করতে এটি অন করুন</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={cfg.steadfastEnabled || false} onChange={e => updateField('steadfastEnabled', e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {cfg.steadfastEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Steadfast API Key</label>
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="API Key" value={cfg.steadfastApiKey || ''} onChange={e => updateField('steadfastApiKey', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Steadfast Secret Key</label>
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Secret Key" value={cfg.steadfastSecretKey || ''} onChange={e => updateField('steadfastSecretKey', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Steadfast Webhook Token</label>
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Optional token" value={cfg.steadfastWebhookToken || ''} onChange={e => updateField('steadfastWebhookToken', e.target.value)} />
                <p className="text-[8px] text-slate-400 mt-1 font-bold">
                  Steadfast-এ এই Callback URL ব্যবহার করুন: <br />
                  <span className="font-mono text-purple-600 break-all">https://yourdomain.com/api/courier/steadfast/webhook?shopId={activeShopId}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Pathao Courier API Integration */}
      <div className="border-2 border-slate-100 shadow-xl bg-white rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">Pathao Courier API Integration</h3>
            <p className="text-xs text-slate-500 font-medium">Official Pathao Merchant API for automated parcel dispatch</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">পাঠাও মার্চেন্ট এপিআই</span>
            <button 
              type="button" 
              onClick={() => setShowPathaoHelp(!showPathaoHelp)} 
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-[10px] sm:text-xs font-black transition-all border border-red-200 cursor-pointer shadow-sm select-none"
            >
              ❓ Setup Guide (সহায়িকা)
            </button>
          </div>

          {showPathaoHelp && (
            <div className="p-5 bg-gradient-to-br from-red-50/70 to-orange-50/30 rounded-2xl border border-red-100 text-[11px] font-bold text-slate-700 space-y-3 animate-slide-in">
              <p className="text-xs sm:text-sm font-black text-red-900 flex items-center gap-1.5 mb-2">🚚 পাঠাও কুরিয়ার মার্চেন্ট এপিআই সেটআপ গাইড</p>
              <ul className="list-decimal pl-5 space-y-2.5 leading-relaxed">
                <li>
                  <strong className="text-slate-950">পাঠাও মার্চেন্ট পোর্টাল:</strong> সরাসরি <a href="https://merchant.pathao.com/" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700 underline font-black">Pathao Merchant Portal (merchant.pathao.com)</a> এ লগইন করুন।
                </li>
                <li>
                  <strong className="text-slate-950">Developer API Keys:</strong> সেটিংস থেকে <strong className="text-slate-950">Developer API</strong> সেকশনে গিয়ে <strong className="text-slate-950">Client ID</strong> ও <strong className="text-slate-950">Client Secret</strong> তৈরি করুন।
                </li>
                <li>
                  <strong className="text-slate-950">Store ID সংগ্রহ:</strong> আপনার পিকআপ লোকেশন / হাবের <strong className="text-slate-950">Store ID</strong> সংগ্রহ করে নিচের ফিল্ডে বসান।
                </li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-black text-slate-900">ইন্টিগ্রেশন সক্রিয় করুন (Enable Pathao Courier)</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">পাঠাও মার্চেন্ট অ্যাকাউন্টে ওয়ান-ক্লিক পার্সেল বুকিং চালু করুন</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={cfg.pathaoEnabled || false} onChange={e => updateField('pathaoEnabled', e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {cfg.pathaoEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-in">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pathao Client ID</label>
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Client ID" value={cfg.pathaoClientId || ''} onChange={e => updateField('pathaoClientId', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pathao Client Secret</label>
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Client Secret" value={cfg.pathaoClientSecret || ''} onChange={e => updateField('pathaoClientSecret', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pathao Store ID</label>
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Store ID (e.g. 12345)" value={cfg.pathaoStoreId || ''} onChange={e => updateField('pathaoStoreId', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pathao Username / Email</label>
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Registered Email" value={cfg.pathaoUsername || ''} onChange={e => updateField('pathaoUsername', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pathao API Password</label>
                <input type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Password" value={cfg.pathaoPassword || ''} onChange={e => updateField('pathaoPassword', e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. RedX Courier API Integration */}
      <div className="border-2 border-slate-100 shadow-xl bg-white rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">RedX Courier API Integration</h3>
            <p className="text-xs text-slate-500 font-medium">Official RedX Door-to-Door Logistics Gateway</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">রেডএক্স মার্চেন্ট এপিআই</span>
            <button 
              type="button" 
              onClick={() => setShowRedxHelp(!showRedxHelp)} 
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[10px] sm:text-xs font-black transition-all border border-rose-200 cursor-pointer shadow-sm select-none"
            >
              ❓ Setup Guide (সহায়িকা)
            </button>
          </div>

          {showRedxHelp && (
            <div className="p-5 bg-gradient-to-br from-rose-50/70 to-red-50/30 rounded-2xl border border-rose-100 text-[11px] font-bold text-slate-700 space-y-3 animate-slide-in">
              <p className="text-xs sm:text-sm font-black text-rose-900 flex items-center gap-1.5 mb-2">🚚 রেডএক্স কুরিয়ার ইন্টিগ্রেশন গাইড</p>
              <ul className="list-decimal pl-5 space-y-2.5 leading-relaxed">
                <li>
                  <strong className="text-slate-950">রেডএক্স মার্চেন্ট পোর্টাল:</strong> <a href="https://redx.com.bd/" target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-700 underline font-black">RedX Merchant Dashboard (redx.com.bd)</a> এ লগইন করুন।
                </li>
                <li>
                  <strong className="text-slate-950">API Access Token:</strong> ড্যাশবোর্ডের API Settings থেকে আপনার সিকিউর <strong className="text-slate-950">API Token</strong> সংগ্রহ করে নিচের বক্সে দিন।
                </li>
                <li>
                  <strong className="text-slate-950">Pickup Store ID:</strong> আপনার নিবন্ধিত পিকআপ লোকেশনের Store ID বসান।
                </li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-black text-slate-900">ইন্টিগ্রেশন সক্রিয় করুন (Enable RedX Courier)</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">রেডএক্স এপিআই দিয়ে পার্সেল ক্রিয়েশন চালু করুন</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={cfg.redxEnabled || false} onChange={e => updateField('redxEnabled', e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {cfg.redxEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-in">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">RedX API Access Token</label>
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Bearer Token..." value={cfg.redxApiKey || ''} onChange={e => updateField('redxApiKey', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">RedX Pickup Store ID</label>
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Store / Hub ID" value={cfg.redxPickupStoreId || ''} onChange={e => updateField('redxPickupStoreId', e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Paperfly Courier API Integration */}
      <div className="border-2 border-slate-100 shadow-xl bg-white rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">Paperfly Courier API Integration</h3>
            <p className="text-xs text-slate-500 font-medium">Paperfly Wing door-to-door countrywide delivery</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">পেপারফ্লাই মার্চেন্ট এপিআই</span>
            <button 
              type="button" 
              onClick={() => setShowPaperflyHelp(!showPaperflyHelp)} 
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[10px] sm:text-xs font-black transition-all border border-blue-200 cursor-pointer shadow-sm select-none"
            >
              ❓ Setup Guide (সহায়িকা)
            </button>
          </div>

          {showPaperflyHelp && (
            <div className="p-5 bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-2xl border border-blue-100 text-[11px] font-bold text-slate-700 space-y-3 animate-slide-in">
              <p className="text-xs sm:text-sm font-black text-blue-900 flex items-center gap-1.5 mb-2">🚚 পেপারফ্লাই কুরিয়ার ইন্টিগ্রেশন গাইড</p>
              <ul className="list-decimal pl-5 space-y-2.5 leading-relaxed">
                <li>
                  <strong className="text-slate-950">পেপারফ্লাই উইং পোর্টাল:</strong> <a href="https://paperfly.com.bd/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline font-black">Paperfly Wing Portal (paperfly.com.bd)</a> এ লগইন করুন।
                </li>
                <li>
                  <strong className="text-slate-950">মার্চেন্ট ক্রেডেনশিয়ালস:</strong> আপনার মার্চেন্ট ইউজারনেম, পাসওয়ার্ড ও পেপারফ্লাই এপিআই কী নিচের ফিল্ডগুলোতে প্রদান করুন।
                </li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-black text-slate-900">ইন্টিগ্রেশন সক্রিয় করুন (Enable Paperfly Courier)</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">পেপারফ্লাই কুরিয়ার পার্সেল বুকিং চালু করুন</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={cfg.paperflyEnabled || false} onChange={e => updateField('paperflyEnabled', e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {cfg.paperflyEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-in">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paperfly Username</label>
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Username / Merchant Code" value={cfg.paperflyUsername || ''} onChange={e => updateField('paperflyUsername', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paperfly Password</label>
                <input type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Password" value={cfg.paperflyPassword || ''} onChange={e => updateField('paperflyPassword', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paperfly Key</label>
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Paperfly API Key" value={cfg.paperflyKey || ''} onChange={e => updateField('paperflyKey', e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
