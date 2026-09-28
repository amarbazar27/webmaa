'use client';

import { useState } from 'react';
import { 
  Sparkles, Target, BarChart3, Globe, MessageCircle, 
  Megaphone, Bell, Save, CheckCircle2, ShieldCheck, 
  Zap, Copy, ExternalLink, HelpCircle
} from 'lucide-react';
import { updateGlobalConfig } from '@/lib/firestore';
import toast from 'react-hot-toast';

export default function SuperadminMarketingHub({ globalConfig = {} }) {
  const initialTracking = globalConfig?.trackingConfig || {};
  const initialMarketing = globalConfig?.marketingTools || {};

  const [saving, setSaving] = useState(false);

  // Tracking Pixels
  const [metaPixelId, setMetaPixelId] = useState(initialTracking.metaPixelId || '');
  const [metaCapiToken, setMetaCapiToken] = useState(initialTracking.metaCapiToken || '');
  const [metaCapiTestCode, setMetaCapiTestCode] = useState(initialTracking.metaCapiTestCode || '');
  const [metaPixelEnabled, setMetaPixelEnabled] = useState(initialTracking.metaPixelEnabled !== false);

  const [ga4Id, setGa4Id] = useState(initialTracking.ga4Id || '');
  const [ga4Enabled, setGa4Enabled] = useState(initialTracking.ga4Enabled !== false);

  const [gtmId, setGtmId] = useState(initialTracking.gtmId || '');
  const [gtmEnabled, setGtmEnabled] = useState(initialTracking.gtmEnabled !== false);

  const [tiktokPixelId, setTiktokPixelId] = useState(initialTracking.tiktokPixelId || '');
  const [tiktokPixelEnabled, setTiktokPixelEnabled] = useState(initialTracking.tiktokPixelEnabled !== false);

  const [clarityId, setClarityId] = useState(initialTracking.clarityId || '');
  const [clarityEnabled, setClarityEnabled] = useState(initialTracking.clarityEnabled !== false);

  // Growth & Conversion Marketing Tools
  const [whatsappEnabled, setWhatsappEnabled] = useState(initialMarketing.whatsappEnabled !== false);
  const [whatsappNumber, setWhatsappNumber] = useState(initialMarketing.whatsappNumber || '01886141381');
  const [whatsappText, setWhatsappText] = useState(initialMarketing.whatsappText || 'আসসালামু আলাইকুম, BD Retailers সম্পর্কে জানতে চাই।');

  const [announcementEnabled, setAnnouncementEnabled] = useState(initialMarketing.announcementEnabled || false);
  const [announcementText, setAnnouncementText] = useState(initialMarketing.announcementText || '🚀 সীমিত সময়ের অফার: আজই ১ মিনিটে অনলাইন স্টোর খুলুন সম্পূর্ণ ফ্রি!');
  const [announcementLink, setAnnouncementLink] = useState(initialMarketing.announcementLink || '/become-retailer');

  const [socialProofEnabled, setSocialProofEnabled] = useState(initialMarketing.socialProofEnabled !== false);

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading('মার্কেটিং ও পিক্সেল কনফিগারেশন সেভ হচ্ছে...');
    try {
      await updateGlobalConfig({
        trackingConfig: {
          metaPixelId,
          metaCapiToken,
          metaCapiTestCode,
          metaPixelEnabled,
          ga4Id,
          ga4Enabled,
          gtmId,
          gtmEnabled,
          tiktokPixelId,
          tiktokPixelEnabled,
          clarityId,
          clarityEnabled
        },
        marketingTools: {
          whatsappEnabled,
          whatsappNumber,
          whatsappText,
          announcementEnabled,
          announcementText,
          announcementLink,
          socialProofEnabled
        }
      });
      toast.success('মার্কেটিং ও পিক্সেল কনফিগারেশন সফলভাবে লাইভ সেভ হয়েছে! 🎉', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('সেভ করতে সমস্যা হয়েছে: ' + err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── Top Header Banner ── */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider mb-2 border border-emerald-400/20">
              <Target size={13} />
              <span>মার্কেটিং ও ডিজিটাল গ্রোথ হাব</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              মেইন প্ল্যাটফর্ম ও অ্যাপ পিক্সেল / ট্র্যাকিং সেটআপ
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Meta Pixel, Facebook Conversions API (CAPI), Google Analytics 4, TikTok Pixel এবং মাইক্রোসফট ক্ল্যারিটি সেটআপ করে ট্রাফিক, অ্যাডস আরও বেশি কনভার্ট করুন।
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Save size={15} />
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সেভ করুন'}</span>
          </button>
        </div>
      </div>

      {/* ── Section 1: Tracking Pixels & Analytics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta / Facebook Pixel & CAPI */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                f
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Meta (Facebook) Pixel & CAPI</h3>
                <p className="text-[11px] text-slate-500">ফেসবুক অ্যাডস ট্র্যাকিং ও সার্ভার-সাইড কনভার্সন এপিআই</p>
              </div>
            </div>
            <button
              onClick={() => setMetaPixelEnabled(!metaPixelEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 cursor-pointer ${
                metaPixelEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${metaPixelEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Meta Pixel ID
              </label>
              <input
                type="text"
                placeholder="যেমন: 123456789012345"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Meta Conversions API (CAPI) System Access Token
              </label>
              <input
                type="password"
                placeholder="EAAG..."
                value={metaCapiToken}
                onChange={(e) => setMetaCapiToken(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Meta Test Event Code (Optional)
              </label>
              <input
                type="text"
                placeholder="TEST12345"
                value={metaCapiTestCode}
                onChange={(e) => setMetaCapiTestCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Google Analytics 4 & Tag Manager */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Google Analytics 4 & GTM</h3>
                <p className="text-[11px] text-slate-500">গুগল এনালিটিক্স ও ট্যাগ ম্যানেজার ইন্টিগ্রেশন</p>
              </div>
            </div>
            <button
              onClick={() => setGa4Enabled(!ga4Enabled)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 cursor-pointer ${
                ga4Enabled ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${ga4Enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Google Analytics 4 Measurement ID
              </label>
              <input
                type="text"
                placeholder="G-XXXXXXXXXX"
                value={ga4Id}
                onChange={(e) => setGa4Id(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Google Tag Manager (GTM) Container ID
              </label>
              <input
                type="text"
                placeholder="GTM-XXXXXXX"
                value={gtmId}
                onChange={(e) => setGtmId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* TikTok Pixel */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-black shadow-sm">
                TT
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">TikTok Pixel</h3>
                <p className="text-[11px] text-slate-500">টিকটক ভিডিও বিজ্ঞাপন ও কনভার্সন ট্র্যাকিং</p>
              </div>
            </div>
            <button
              onClick={() => setTiktokPixelEnabled(!tiktokPixelEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 cursor-pointer ${
                tiktokPixelEnabled ? 'bg-pink-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${tiktokPixelEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              TikTok Pixel ID
            </label>
            <input
              type="text"
              placeholder="যেমন: C1234567890ABCDEFG"
              value={tiktokPixelId}
              onChange={(e) => setTiktokPixelId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
        </div>

        {/* Microsoft Clarity */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black shadow-sm">
                MC
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Microsoft Clarity (হিটম্যাপ ও সেশন রেকর্ডিং)</h3>
                <p className="text-[11px] text-slate-500">ইউজারদের ক্লিক, স্ক্রল ও ড্রপ-অফ এনালাইসিস</p>
              </div>
            </div>
            <button
              onClick={() => setClarityEnabled(!clarityEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 cursor-pointer ${
                clarityEnabled ? 'bg-cyan-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${clarityEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Clarity Project ID
            </label>
            <input
              type="text"
              placeholder="যেমন: abcdefgh12"
              value={clarityId}
              onChange={(e) => setClarityId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Conversion & Growth Tools ── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Zap size={18} className="text-emerald-500" />
            <span>গ্রোথ ও কনভার্সন অপটিমাইজেশন টুলস (Growth & Marketing Tools)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ভিজিটরদের ক্রেতা ও মার্চেন্টে রূপান্তর করার আকর্ষণীয় অটোমেশন ফিচারসমূহ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Floating WhatsApp Support */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-emerald-600" />
                <span className="text-xs font-black text-slate-900 dark:text-white">ফ্লোটিং হোয়াটসঅ্যাপ হেল্পলাইন</span>
              </div>
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                হোয়াটসঅ্যাপ নম্বর (বাংলাদেশি ফরম্যাট)
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="01886141381"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                ডিফল্ট মেসেজ
              </label>
              <input
                type="text"
                value={whatsappText}
                onChange={(e) => setWhatsappText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none"
              />
            </div>
          </div>

          {/* Top Promotional Announcement Bar */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-purple-600" />
                <span className="text-xs font-black text-slate-900 dark:text-white">টপ অ্যানাউন্সমেন্ট বার</span>
              </div>
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                ঘোষণার টেক্সট
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="নতুন অফার..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                বাটন / অ্যাকশন লিংক
              </label>
              <input
                type="text"
                value={announcementLink}
                onChange={(e) => setAnnouncementLink(e.target.value)}
                placeholder="/become-retailer"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
