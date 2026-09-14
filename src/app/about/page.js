import Link from 'next/link';
import { Store, Sparkles, ShieldCheck, Truck, CreditCard, Bot, Globe, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'আমাদের সম্পর্কে (About Us) | BD Retailers',
  description: 'BD Retailers বাংলাদেশের আধুনিক ই-কমার্স প্ল্যাটফর্ম ও স্টোর মেকার, যেখানে মাত্র ৫ মিনিটে পূর্ণাঙ্গ অনলাইন স্টোর তৈরি করা যায়।',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-black text-purple-600 dark:text-purple-400 hover:underline"
          >
            <ArrowLeft size={14} /> হোম পেজে ফিরে যান
          </Link>
        </div>

        {/* Header Hero */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white p-8 sm:p-12 rounded-3xl shadow-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-black uppercase tracking-wider">
            <span>🇧🇩</span>
            <span>দেশি ব্যবসা, দেশের উন্নতি</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            বিডি রিটেইলার্স সম্পর্কে
          </h1>
          <p className="text-sm sm:text-base text-purple-100 font-medium max-w-2xl leading-relaxed">
            BD Retailers (bdretailers.com) হলো বাংলাদেশের আধুনিক ই-কমার্স প্ল্যাটফর্ম ও স্টোর মেকার, যেখানে উদ্যোক্তারা মাত্র ৫ মিনিটেই একটি পূর্ণাঙ্গ অনলাইন স্টোর তৈরি করে ব্যবসা শুরু করতে পারেন।
          </p>
        </div>

        {/* For Retailers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
              <Store size={15} /> উদ্যোক্তাদের জন্য বিশেষ স্টোর মেকার
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              মাত্র ৫ মিনিটে অনলাইন ব্যবসার শুরু
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Sparkles size={18} />
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">রেডিমেড ডিজাইন ও টেমপ্লেট</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                ১৫+ প্রফেশনাল ক্যাটাগরি ভিত্তিক ওয়েবসাইট ডিজাইন (গ্রোসারি, ফ্যাশন, গ্যাজেট, ফার্মেসি ইত্যাদি) থেকে পছন্দের থিম বেছে নিন।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Globe size={18} />
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">কাস্টম ডোমেইন সুবিধা</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                ফ্রি সাবডোমেইন (yourname.bdretailers.com) ছাড়াও যেকোনো কাস্টম ডোমেইন (.com, .xyz, ইত্যাদি) সহজে কানেক্ট করুন।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Truck size={18} />
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">কুরিয়ার ও ডেলিভারি অটোমেশন</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Steadfast কুরিয়ার API ইন্টিগ্রেশন থাকায় অর্ডার এক ক্লিকে পার্সেল এন্ট্রি করা যায় এবং লাইভ ট্র্যাকিং করা সম্ভব।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
                <CreditCard size={18} />
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">বিকাশ ও অনলাইন পেমেন্ট</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                বিকাশ, নগদ, রকেট, কার্ড এবং ক্যাশ অন ডেলিভারি (COD) পেমেন্ট সমর্থন।
              </p>
            </div>
          </div>
        </div>

        {/* For Shoppers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-4">
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck size={15} /> ক্রেতাদের জন্য নিরাপদ মার্কেটপ্লেস
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            যাচাইকৃত রিটেইলার, নিরাপদ কেনাকাটা
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            বিডি রিটেইলার্স প্ল্যাটফর্মে রয়েছে সারা দেশের যাচাইকৃত মার্চেন্ট নেটওয়ার্ক। সরাসরি বিশ্বস্ত রিটেইলারদের কাছ থেকে অরিজিনাল পণ্য অর্ডার করুন ক্যাশ অন ডেলিভারিতে। কোনো মধ্যস্বত্বভোগী নেই, তাই দাম সাশ্রয়ী ও মান নিশ্চিত।
          </p>

          <div className="pt-4">
            <Link
              href="/become-retailer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <span>আজই আপনার ফ্রি স্টোর তৈরি করুন</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
