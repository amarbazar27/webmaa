import React from 'react';
import Link from 'next/link';
import { FileText, ShieldCheck, Scale, AlertCircle, ArrowLeft, Mail } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | BDRetailers',
  description: 'Terms and Conditions of service for BDRetailers platform and retail mobile applications.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white relative">
          <Link 
            href="/" 
            className="absolute top-6 left-6 text-white/80 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-colors"
          >
            <ArrowLeft size={14} /> হোম পেজে ফিরুন
          </Link>
          <div className="pt-6 flex flex-col items-center text-center">
            <Scale size={48} className="mb-3 text-purple-200" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Terms of Service</h1>
            <p className="text-xs sm:text-sm text-purple-100 font-medium mt-1">সেবার শর্তাবলী ও ব্যবহার নীতিমালা</p>
            <div className="mt-4 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-wider uppercase text-purple-200">
              সর্বশেষ আপডেট: আগস্ট ২০২৬
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-slate-600 font-medium">
          
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-xs font-bold text-purple-900 leading-relaxed">
            বিডি রিটেইলার্স (bdretailers.com) এবং আমাদের সংশ্লিষ্ট মোবাইল অ্যাপ্লিকেশন ও সার্ভিস ব্যবহারের জন্য নিচের শর্তাবলী প্রযোজ্য। প্ল্যাটফর্ম ব্যবহার করার মাধ্যমে আপনি এই শর্তাবলীর সাথে সম্মত হন।
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 border-b pb-2 border-slate-100">
              <FileText size={16} className="text-purple-600" /> ১. অ্যাকাউন্ট ও ব্যবহারবিধি (Account & Usage)
            </h2>
            <p>আমাদের ওয়েবসাইট ও মোবাইল অ্যাপ ব্যবহারের ক্ষেত্রে নিম্নোক্ত নিয়মাবলী প্রযোজ্য:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>নিবন্ধন:</strong> গুগল সাইন-ইন বা ইমেইলের মাধ্যমে রেজিস্টার করার সময় সঠিক তথ্য প্রদান করতে হবে।</li>
              <li><strong>নিরাপত্তা:</strong> আপনার অ্যাকাউন্টের গোপনীয়তা রক্ষার দায়িত্ব আপনার নিজের। কোনো অস্বাভাবিক অ্যাক্টিভিটি দেখলে দ্রুত আমাদের সাথে যোগাযোগ করুন।</li>
              <li><strong>আইনগত বাধ্যবাধকতা:</strong> প্ল্যাটফর্ম ব্যবহার করে কোনো বেআইনি, প্রতারণামূলক বা অনৈতিক কার্যক্রম পরিচালনা করা সম্পূর্ণ নিষিদ্ধ।</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 border-b pb-2 border-slate-100">
              <ShieldCheck size={16} className="text-purple-600" /> ২. অর্ডার ও পেমেন্ট নীতিমালা (Orders & Payments)
            </h2>
            <p>মার্চেন্ট স্টোর থেকে পণ্য ক্রয় ও পেমেন্টের নিয়মাবলী:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>মূল্য ও স্টক:</strong> মার্চেন্ট প্রদর্শিত পণ্যের দাম এবং স্টক রিয়েল-টাইম অনুযায়ী পরিবর্তিত হতে পারে।</li>
              <li><strong>পেমেন্ট মাধ্যম:</strong> ক্যাশ অন ডেলিভারি এবং অনুমোদিত ডিজিটাল পেমেন্ট গেটওয়ের মাধ্যমে নিরাপদে পেমেন্ট সম্পন্ন করা যায়।</li>
              <li><strong>অর্ডার নিশ্চিতকরণ:</strong> অর্ডার প্লেস করার পর এসএমএস বা অ্যাপ নোটিফিকেশনের মাধ্যমে স্ট্যাটাস ট্র্যাক করা যাবে।</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 border-b pb-2 border-slate-100">
              <AlertCircle size={16} className="text-purple-600" /> ৩. রিটার্ন ও রিফান্ড নীতি (Return & Refund)
            </h2>
            <p>ডেলিভারিকৃত পণ্যে কোনো ত্রুটি বা অসামঞ্জস্যতা পরিলক্ষিত হলে:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>ডেলিভারি পাওয়ার ২৪ থেকে ৪৮ ঘণ্টার মধ্যে সংশ্লিষ্ট মার্চেন্ট বা আমাদের সাপোর্ট সেন্টারে অবহিত করতে হবে।</li>
              <li>সংশ্লিষ্ট মার্চেন্টের রিটার্ন পলিসি অনুযায়ী পণ্য রিপ্লেসমেন্ট বা রিফান্ড প্রদান করা হবে।</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 border-b pb-2 border-slate-100">
              <Scale size={16} className="text-purple-600" /> ৪. সেবার পরিবর্তন ও পরিমার্জন (Modifications)
            </h2>
            <p>বিডি রিটেইলার্স যেকোনো সময় পূর্ব নোটিশ ছাড়াই সেবার উন্নয়ন বা আইনি পরিবর্তনের স্বার্থে শর্তাবলীতে পরিবর্তন আনার অধিকার সংরক্ষণ করে। পরিবর্তিত শর্তাবলী ওয়েবসাইটে প্রকাশের সাথে সাথে কার্যকর হবে।</p>
          </section>

          {/* Section 5: Contact */}
          <section className="space-y-3 bg-slate-50 border border-slate-100 rounded-2xl p-6">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 pb-1">
              <Mail size={16} className="text-purple-600" /> যোগাযোগ (Contact Us)
            </h2>
            <p className="text-xs text-slate-500 font-bold mb-3">শর্তাবলী সংক্রান্ত যেকোনো প্রশ্ন বা সহায়তার জন্য যোগাযোগ করুন:</p>
            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-700">ইমেইল: <a href="mailto:bdretailers26@gmail.com" className="text-purple-600 hover:underline">bdretailers26@gmail.com</a></p>
              <p className="font-bold text-slate-700">ওয়েবসাইট: <a href="https://bdretailers.com" className="text-purple-600 hover:underline">https://bdretailers.com</a></p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
