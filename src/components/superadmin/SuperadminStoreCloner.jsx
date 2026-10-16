'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Globe, Link2, ExternalLink, Copy, Check, Store, 
  Send, RefreshCw, Eye, MessageCircle, ArrowUpRight, Zap
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { auth } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function SuperadminStoreCloner() {
  const [pageName, setPageName] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [category, setCategory] = useState('fashion');
  const [customSlug, setCustomSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [leadStores, setLeadStores] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const fetchLeadStores = async () => {
    setLoadingList(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch('/api/superadmin/create-instant-store', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.stores) setLeadStores(data.stores);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchLeadStores();
  }, []);

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!pageName.trim()) {
      toast.error('পেজ বা ব্র্যান্ডের নাম দিন');
      return;
    }

    setCreating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/superadmin/create-instant-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pageName: pageName.trim(),
          pageUrl: pageUrl.trim() || undefined,
          category,
          customSlug: customSlug.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'স্টোর তৈরি করতে সমস্যা হয়েছে');

      toast.success(data.message || 'ইনস্ট্যান্ট লাইভ ওয়েবসাইট সফলভাবে তৈরি হয়েছে! 🎉');
      setLastCreated(data);
      setPageName('');
      setPageUrl('');
      setCustomSlug('');
      fetchLeadStores();
    } catch (err) {
      toast.error(err.message || 'সমস্যা হয়েছে');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success('ওয়েবসাইট লিংক কপি হয়েছে!');
    } else {
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2000);
      toast.success('পিচ মেসেজ কপি হয়েছে!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-purple-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/30 border border-purple-400/30 rounded-full text-xs font-black text-purple-200">
            <Zap size={13} className="text-yellow-400" /> REA Instant E-Commerce Store Generator
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            ফেসবুক পেজ / ব্র্যান্ড থেকে ১ ক্লিকে রিয়াল ওয়েবসাইট বিল্ডার
          </h2>
          <p className="text-xs text-purple-200/80 leading-relaxed">
            কোনো ফেসবুক কমার্স মার্চেন্টের পেজের নাম ও ক্যাটাগরি দিলেই স্বয়ংক্রিয়ভাবে ব্যানার, ক্যাটাগরি, প্রোডাক্ট এবং হোমপেজ বিল্ডার সেকশন দিয়ে সম্পূর্ণ লাইভ ওয়েবসাইট তৈরি হয়ে যাবে। রিটেইলারকে লাইভ ডেমো দেখিয়ে ইনস্ট্যান্ট ক্লোজ করুন!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Create Store */}
        <div className="lg:col-span-6 space-y-6">
          <Card title="নতুন ইনস্ট্যান্ট স্টোর তৈরি করুন" icon={Sparkles}>
            <form onSubmit={handleCreateStore} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 block">
                  ফেসবুক পেজ বা ব্র্যান্ডের নাম *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মায়াবী ক্লথিং / Style Touch BD / খাঁটি বাজার"
                  value={pageName}
                  onChange={e => setPageName(e.target.value)}
                  className="w-full text-xs font-bold p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 block">
                  ফেসবুক পেজ / প্রোফাইল লিংক (ঐচ্ছিক)
                </label>
                <input
                  type="url"
                  placeholder="https://facebook.com/brandpage"
                  value={pageUrl}
                  onChange={e => setPageUrl(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 block">
                    ব্যবসার ধরণ / ক্যাটাগরি
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full text-xs font-bold p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="fashion">👗 ফ্যাশন ও পোশাক (শাড়ি, পাঞ্জাবি, কুর্তি)</option>
                    <option value="electronics">📱 গ্যাজেট ও ইলেকট্রনিক্স (স্মার্টওয়াচ, ইয়ারবাডস)</option>
                    <option value="grocery">🍯 খাঁটি অর্গানিক ফুড (মধু, ঘি, বাদাম, তেল)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 block">
                    কাস্টম সাবডোমেইন স্ল্যাগ (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: mayabi"
                    value={customSlug}
                    onChange={e => setCustomSlug(e.target.value)}
                    className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={creating}
                className="w-full !bg-purple-600 hover:!bg-purple-700 text-white font-black text-xs h-12 shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                <Sparkles size={16} className="mr-2" /> ১ ক্লিকে লাইভ ই-কমার্স ওয়েবসাইট তৈরি করুন
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Output: Last Created Result */}
        <div className="lg:col-span-6 space-y-6">
          {lastCreated ? (
            <Card title="ওয়েবসাইট তৈরি সম্পন্ন! 🎉" icon={Globe} className="border-2 border-emerald-500/40">
              <div className="space-y-4 pt-1 text-xs">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                  <p className="font-black text-emerald-900 text-sm">
                    🌐 লাইভ ওয়েবসাইট ইউআরএল:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={lastCreated.liveUrl}
                      className="w-full text-xs font-mono bg-white border border-emerald-200 p-2.5 rounded-xl font-bold select-all text-emerald-800"
                    />
                    <button
                      onClick={() => copyToClipboard(lastCreated.liveUrl, 'link')}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shrink-0"
                      title="কপি করুন"
                    >
                      {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <a
                      href={lastCreated.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer shrink-0 flex items-center justify-center"
                      title="নতুন ট্যাবে দেখুন"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-purple-950 flex items-center gap-1.5">
                      <MessageCircle size={15} className="text-purple-600" /> ক্লায়েন্টকে পাঠানোর রেডিমেড পিচ মেসেজ:
                    </p>
                    <button
                      onClick={() => copyToClipboard(lastCreated.pitchMessage, 'pitch')}
                      className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPitch ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />} {copiedPitch ? 'কপি হয়েছে' : 'মেসেজ কপি'}
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-100 text-slate-700 leading-relaxed font-sans text-[11px] whitespace-pre-wrap select-all">
                    {lastCreated.pitchMessage}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card title="কিভাবে কাজ করে?" icon={Zap} className="h-full">
              <div className="space-y-3 pt-1 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800">
                  মার্চেন্টদের কনভার্ট করার সবচেয়ে সহজ ও পরীক্ষিত মেথড:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-slate-700 font-medium">
                  <li>যেকোনো সক্রিয় ফেসবুক পেজের নাম ও ক্যাটাগরি ফর্মে দিন।</li>
                  <li>আমাদের সিস্টেম সাথে সাথে ওই ব্র্যান্ডের জন্য <strong>৮টি ডেমো পণ্য, ব্যানার ও হোমপেজ সেকশনসহ সম্পূর্ণ ওয়েবসাইট</strong> রেডি করবে।</li>
                  <li>তৈরি হওয়া <strong>লাইভ লিংক ও পিচ মেসেজটি</strong> মার্চেন্টের হোয়াটসঅ্যাপ বা ফেসবুক মেসেঞ্জারে পাঠিয়ে দিন।</li>
                  <li>মার্চেন্ট যখন দেখবে তাদের পেজের নামে ইতিমধ্যেই একটি নিখুঁত ওয়েবসাইট চালু আছে, তারা সরাসরি ক্লেইম করবে এবং ডোমেইন কিনে পেইড ক্লায়েন্ট হবে!</li>
                </ol>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Previously Created Lead Stores Table */}
      <Card 
        title={`তৈরি করা ইনস্ট্যান্ট স্টোরসমূহ (${leadStores.length})`} 
        icon={Store}
        action={
          <button 
            onClick={fetchLeadStores}
            className="p-1.5 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            title="রিফ্রেশ"
          >
            <RefreshCw size={14} className={loadingList ? 'animate-spin' : ''} />
          </button>
        }
      >
        <div className="overflow-x-auto">
          {leadStores.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              এখনও কোনো ইনস্ট্যান্ট স্টোর তৈরি করা হয়নি। উপরের ফর্ম পূরণ করে তৈরি করুন!
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">স্টোর ও ব্র্যান্ডের নাম</th>
                  <th className="pb-3">ক্যাটাগরি</th>
                  <th className="pb-3">সাবডোমেইন স্ল্যাগ</th>
                  <th className="pb-3">তৈরির তারিখ</th>
                  <th className="pb-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {leadStores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-black text-slate-900">
                      {store.pageName}
                    </td>
                    <td className="py-3 text-slate-600 capitalize">
                      {store.category}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-purple-600">
                      /shop/{store.shopSlug}
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {store.createdAt ? new Date(store.createdAt).toLocaleDateString('bn-BD') : 'N/A'}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            const pitch = `আসসালামু আলাইকুম ${store.pageName} টিম! 🎉\nআমরা আপনাদের পেজের পণ্যের উপর ভিত্তি করে ১ মিনিটে একটি প্রিমিয়াম লাইভ ই-কমার্স ওয়েবসাইট তৈরি করেছি:\n👉 ${store.liveUrl}\n\nওয়েবসাইটটি ভিজিট করে দেখুন এবং ভালো লাগলে আপনার নিজস্ব ডোমেইনে চালু করুন!`;
                            copyToClipboard(pitch, 'pitch');
                          }}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-[11px] font-black cursor-pointer flex items-center gap-1"
                          title="পিচ মেসেজ কপি"
                        >
                          <Copy size={11} /> পিচ কপি
                        </button>
                        <a
                          href={store.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-[11px] font-black cursor-pointer flex items-center gap-1"
                        >
                          <Eye size={11} /> দেখুন <ArrowUpRight size={11} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
