'use client';

import { X, Store, Sparkles, ShieldCheck, Truck, CreditCard, Bot, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-white text-base">
              BD
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">বিডি রিটেইলার্স সম্পর্কে</h2>
              <p className="text-xs text-purple-200 font-medium">bdretailers.com • আধুনিক ই-কমার্স প্ল্যাটফর্ম</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* Main Statement Box */}
          <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/40">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🇧🇩</span>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-purple-950 dark:text-purple-200">
                  দেশি ব্যবসা, দেশের উন্নতি
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-purple-700 dark:text-purple-300">BD Retailers</strong> হলো বাংলাদেশের আধুনিক ই-কমার্স প্ল্যাটফর্ম ও স্টোর মেকার, যেখানে মাত্র ৫ মিনিটেই একটি পূর্ণাঙ্গ অনলাইন স্টোর তৈরি করে ব্যবসা পরিচালনা করা যায়।
                </p>
              </div>
            </div>
          </div>

          {/* Key Pillars for Retailers */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1.5">
              <Store size={15} /> উদ্যোক্তা ও রিটেইলারদের জন্য বিশেষ সুবিধা
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-white">
                  <Sparkles size={14} className="text-purple-600 shrink-0" />
                  <span>৫ মিনিটে অনলাইন স্টোর</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  কোনো কোডিং ছাড়াই নিজস্ব ব্র্যান্ডে পূর্ণাঙ্গ ইকমার্স স্টোর চালু করার সহজ ব্যবস্থা।
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-white">
                  <Globe size={14} className="text-indigo-600 shrink-0" />
                  <span>কাস্টম ডোমেইন সাপোর্ট</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  ফ্রি সাবডোমেইন অথবা নিজস্ব ডোমেইন (.com, .com.bd) এক ক্লিকে কানেক্ট করার সুবিধা।
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-white">
                  <Truck size={14} className="text-emerald-600 shrink-0" />
                  <span>স্টেডফাস্ট কুরিয়ার অটোমেশন</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  অর্ডার পাওয়ার সাথে সাথে এক ক্লিকে Steadfast কুরিয়ার পার্সেল এন্ট্রি ও ট্র্যাকিং।
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-white">
                  <CreditCard size={14} className="text-pink-600 shrink-0" />
                  <span>বিকাশ, নগদ ও সিওডি</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  ক্যাশ অন ডেলিভারি, বিকাশ ও নগদ অনলাইন পেমেন্ট ইন্টিগ্রেশন সুবিধা।
                </p>
              </div>
            </div>
          </div>

          {/* Key Pillars for Customers */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck size={15} /> ক্রেতাদের জন্য নিরাপদ মার্কেটপ্লেস
            </h4>
            <div className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>যাচাইকৃত রিটেইলার্স:</strong> প্রতিটি স্টোর ও মার্চেন্ট প্ল্যাটফর্ম দ্বারা অনুমোদিত ও ভেরিফাইড।</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>নিরাপদ কেনাকাটা:</strong> পণ্যের সঠিক বিবরণ, নিরাপদ লেনদেন এবং বিশ্বস্ত ডেলিভারি সেবা।</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>এআই শপিং অ্যাসিস্ট্যান্ট:</strong> ভয়েস সার্চ ও ফর্দ আপলোড করে এক ক্লিকে অর্ডার করার আধুনিক প্রযুক্তি।</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            বন্ধ করুন
          </button>
          <Link
            href="/become-retailer"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>আপনার স্টোর তৈরি করুন</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
