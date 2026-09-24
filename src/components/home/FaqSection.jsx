'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, MessageCircleQuestion } from 'lucide-react';

const DEFAULT_FAQS = [
  {
    id: 'faq-1',
    question: 'BDRetailers এ কীভাবে অনলাইন স্টোর খুলব?',
    answer: 'মার্চেন্ট হতে "Become Retailer" বাটনে ক্লিক করে আপনার নাম, দোকানের নাম, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে মাত্র ১ মিনিটেই ফ্রি রেজিস্ট্রেশন সম্পন্ন করতে পারেন। এরপর সাথে সাথেই আপনার স্টোর লাইভ হয়ে যাবে।'
  },
  {
    id: 'faq-2',
    question: 'স্টার্টার প্ল্যানে কি আসলেই কোনো অগ্রিম ফি নেই?',
    answer: 'হ্যাঁ, আমাদের স্টার্টার প্ল্যানে কোনো মাসিক ফি বা অগ্রিম খরচ নেই (০৳ আপফ্রন্ট ফি)। শুধুমাত্র আপনার পণ্য সফলভাবে বিক্রয় হলে একটি ক্ষুদ্র রেভিনিউ শেয়ার প্রযোজ্য হবে। অর্থাৎ নো সেল = নো ফি!'
  },
  {
    id: 'faq-3',
    question: 'Steadfast কুরিয়ার ও পেমেন্ট গেটওয়ে কীভাবে কাজ করে?',
    answer: 'আমাদের সিস্টেমে Steadfast কুরিয়ার অটোমেটেড API সম্পূর্ণ ফ্রি ইন্টিগ্রেটেড রয়েছে। বিকাশ, নগদ, রকেট ও অনলাইন কার্ড পেমেন্ট সরাসরি আপনার অ্যাকাউন্টে জমা হবে।'
  },
  {
    id: 'faq-4',
    question: 'আমি কি আমার নিজস্ব কাস্টম ডোমেইন (.com বা .shop) ব্যবহার করতে পারব?',
    answer: 'অবশ্যই! আমাদের মান্থলি, কোয়ার্টারলি ও ইয়ারলি প্যাকেজে সম্পূর্ণ ফ্রি কাস্টম ডোমেইন কানেক্টিভিটি ও আজীবন ফ্রি SSL সার্টিফিকেটের সুবিধা অন্তর্ভুক্ত রয়েছে।'
  },
  {
    id: 'faq-5',
    question: 'আমার ব্র্যান্ডের নামে কি নিজস্ব অ্যান্ড্রয়েড মোবাইল অ্যাপ তৈরি হবে?',
    answer: 'হ্যাঁ! BDRetailers এর আধুনিক হোয়াইট-লেবেল টেকনোলজির মাধ্যমে আপনার নিজস্ব ব্র্যান্ডের নামে ডেডিকেটেড Android অ্যাপ (.aab / .apk) তৈরি ও Google Play Store এ পাবলিশ করার ব্যবস্থা রয়েছে।'
  },
  {
    id: 'faq-6',
    question: 'আমার কোনো প্রযুক্তিগত বা কোডিং জ্ঞান না থাকলে কি আমি চালাতে পারব?',
    answer: 'একদমই কোনো কোডিং বা টেকনিক্যাল জ্ঞানের প্রয়োজন নেই। সম্পূর্ণ ইউজার-ফ্রেন্ডলি বাংলা ও ইংরেজি ইন্টারফেসে পণ্য যোগ করা, অর্ডার প্রসেসিং ও স্টক ম্যানেজমেন্ট খুব সহজেই মোবাইল দিয়ে পরিচালনা করতে পারবেন।'
  }
];

export default function FaqSection({ globalConfig = null }) {
  const [openIndex, setOpenIndex] = useState(0);

  const rawFaqs = (globalConfig?.faqs && globalConfig.faqs.length > 0)
    ? globalConfig.faqs
    : DEFAULT_FAQS;

  return (
    <section id="faq" className="relative z-20 py-16 md:py-24 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
            <HelpCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>সচরাচর জিজ্ঞাসিত প্রশ্নাবলী</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Frequently Asked <span className="text-emerald-600 dark:text-emerald-400">Questions</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal max-w-xl mx-auto">
            BDRetailers প্ল্যাটফর্ম, সাবস্ক্রিপশন প্ল্যান ও সার্ভিস সম্পর্কে সাধারণ প্রশ্নগুলোর উত্তর জেনে নিন।
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {rawFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.id || index}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="w-full flex items-center justify-between text-left gap-4 p-5 sm:p-6 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded-2xl"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        isOpen
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <HelpCircle size={18} />
                    </div>
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {faq.question}
                    </span>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'rotate-180 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <ChevronDown size={16} strokeWidth={2.5} />
                  </div>
                </button>

                {/* Flat, Non-nested Answer Box */}
                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Need more help CTA */}
        <div className="mt-10 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>আরও কোনো প্রশ্ন আছে? আমাদের সাপোর্ট টিম সবসময় প্রস্তুত।</span>
            <a
              href={`https://wa.me/88${(globalConfig?.whatsapp || '01734763306').replace(/[^0-9]/g, '').replace(/^88/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <MessageCircleQuestion size={14} /> সরাসরি হোয়াটসঅ্যাপে কথা বলুন
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
