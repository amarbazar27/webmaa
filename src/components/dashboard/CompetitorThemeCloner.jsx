'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { Sparkles, Globe, ArrowRight, ExternalLink, CheckCircle2, Loader2, Palette, Image as ImageIcon, Layers, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '@/lib/auth';

export default function CompetitorThemeCloner({ shopId, shopSlug, onCloned }) {
  const [targetUrl, setTargetUrl] = useState('');
  const [cloning, setCloning] = useState(false);
  const [clonedData, setClonedData] = useState(null);

  const handleClone = async (e) => {
    e.preventDefault();
    if (!targetUrl.trim()) {
      toast.error('ওয়েবসাইটের লিংক দিন');
      return;
    }

    setCloning(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('লগইন করুন');

      const res = await fetch('/api/design/clone-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId,
          targetUrl: targetUrl.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'UI ক্লোন ব্যর্থ হয়েছে');

      setClonedData(data);
      toast.success(data.message || 'প্রতিদ্বন্দ্বীর ওয়েবসাইটের UI সফলভাবে ক্লোন হয়েছে! 🎉');
      if (onCloned) onCloned(data);
    } catch (err) {
      toast.error(err.message || 'ডিজাইন ক্লোন করতে সমস্যা হয়েছে');
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl text-white shadow-xl shadow-purple-950/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold backdrop-blur-sm">
            <Sparkles size={14} className="text-amber-300" />
            <span>AI Reverse-Engineered UI & Theme Cloner</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            যেকোনো ওয়েবসাইটের লিংক দিয়ে মুহূর্তেই UI ক্লোন করুন
          </h2>
          <p className="text-xs md:text-sm text-purple-200 font-medium leading-relaxed max-w-xl">
            প্রতিদ্বন্দ্বীর ওয়েবসাইটের কালার থিম, ব্যানার, লোগো এবং স্টাইল স্বয়ংক্রিয়ভাবে এক্সট্রাক্ট করে আপনার শপে যুক্ত করুন — কোনো কোডিং ছাড়াই!
          </p>
        </div>
      </div>

      <Card className="border border-slate-200/80 shadow-sm rounded-3xl p-6">
        <form onSubmit={handleClone} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 flex items-center gap-2">
              <Globe size={15} className="text-purple-600" />
              টার্গেট ওয়েবসাইটের লিংক (Target Website URL)
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="যেমন: https://someshop.com বা chaldal.com বা suglow.com"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                disabled={cloning}
                className="flex-1 text-xs md:text-sm p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 outline-none transition-all font-mono"
              />
              <Button
                type="submit"
                disabled={cloning}
                loading={cloning}
                className="!bg-purple-600 hover:!bg-purple-700 text-white font-black text-xs md:text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-purple-600/20 shrink-0 cursor-pointer"
              >
                {cloning ? 'ক্লোন হচ্ছে...' : 'UI ক্লোন করুন'}
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 কোনো Shopify, WooCommerce, Daraz বা যেকোনো কাস্টম ই-কমার্স সাইটের লিংক পেস্ট করতে পারেন।
            </p>
          </div>
        </form>

        {/* Live Extracted Results Card */}
        {clonedData && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <h3 className="text-sm font-black text-slate-900">
                  ক্লোন সম্পন্ন: {clonedData.brandName || 'টার্গেট ব্র্যান্ড'}
                </h3>
              </div>
              {shopSlug && (
                <a
                  href={`/shop/${shopSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-black transition-colors"
                >
                  <span>লাইভ শপ দেখুন</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Extracted Color Palette */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <p className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Palette size={14} className="text-purple-600" />
                শনাক্তকৃত কালার প্যালেট (Color Tokens)
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {clonedData.theme?.primaryColor && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold">
                    <span className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: clonedData.theme.primaryColor }} />
                    <span className="font-mono text-[11px]">{clonedData.theme.primaryColor}</span>
                    <span className="text-[10px] text-slate-400 font-sans">(Primary)</span>
                  </div>
                )}
                {clonedData.theme?.secondaryColor && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold">
                    <span className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: clonedData.theme.secondaryColor }} />
                    <span className="font-mono text-[11px]">{clonedData.theme.secondaryColor}</span>
                    <span className="text-[10px] text-slate-400 font-sans">(Secondary)</span>
                  </div>
                )}
                {clonedData.theme?.accentColor && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold">
                    <span className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: clonedData.theme.accentColor }} />
                    <span className="font-mono text-[11px]">{clonedData.theme.accentColor}</span>
                    <span className="text-[10px] text-slate-400 font-sans">(Accent)</span>
                  </div>
                )}
                {clonedData.designPreset && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold">
                    <Layers size={13} />
                    <span>Preset: {clonedData.designPreset}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Extracted Banners */}
            {clonedData.bannerImages && clonedData.bannerImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-purple-600" />
                  এক্সট্রাক্টকৃত ব্যানার ({clonedData.bannerImages.length}টি)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {clonedData.bannerImages.map((bUrl, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bUrl} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
