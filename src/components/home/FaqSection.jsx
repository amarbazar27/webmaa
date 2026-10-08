'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const DEFAULT_FAQS = [
  {
    id: 'faq-1',
    questionBn: 'BDRetailers এ কীভাবে অনলাইন স্টোর খুলব?',
    questionEn: 'How do I open an online store on BDRetailers?',
    answerBn: 'মার্চেন্ট হতে "Become Retailer" বাটনে ক্লিক করে আপনার নাম, দোকানের নাম, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে মাত্র ১ মিনিটেই ফ্রি রেজিস্ট্রেশন সম্পন্ন করতে পারেন। এরপর সাথে সাথেই আপনার স্টোর লাইভ হয়ে যাবে।',
    answerEn: 'Click the "Become Retailer" button and complete the free registration in just 1 minute with your name, store name, mobile number, and password. Your store will go live instantly.'
  },
  {
    id: 'faq-2',
    questionBn: 'স্টার্টার প্ল্যানে কি আসলেই কোনো অগ্রিম ফি নেই?',
    questionEn: 'Is there really no upfront fee in the Starter plan?',
    answerBn: 'হ্যাঁ, আমাদের স্টার্টার প্ল্যানে কোনো মাসিক ফি বা অগ্রিম খরচ নেই (০৳ আপফ্রন্ট ফি)। শুধুমাত্র আপনার পণ্য সফলভাবে বিক্রয় হলে একটি ক্ষুদ্র রেভিনিউ শেয়ার প্রযোজ্য হবে। অর্থাৎ নো সেল = নো ফি!',
    answerEn: 'Yes, our Starter plan has no monthly fees or upfront costs (৳0 upfront fee). Only when your products sell successfully, a small revenue share applies. No sale = no fee!'
  },
  {
    id: 'faq-3',
    questionBn: 'Steadfast কুরিয়ার ও পেমেন্ট গেটওয়ে কীভাবে কাজ করে?',
    questionEn: 'How do Steadfast Courier and payment gateways work?',
    answerBn: 'আমাদের সিস্টেমে Steadfast কুরিয়ার অটোমেটেড API সম্পূর্ণ ফ্রি ইন্টিগ্রেটেড রয়েছে। বিকাশ, নগদ, রকেট ও অনলাইন কার্ড পেমেন্ট সরাসরি আপনার অ্যাকাউন্টে জমা হবে।',
    answerEn: 'Our system has Steadfast Courier automated API integrated for free. bKash, Nagad, Rocket, and card payments deposit directly into your account.'
  },
  {
    id: 'faq-4',
    questionBn: 'আমি কি আমার নিজস্ব কাস্টম ডোমেইন (.com বা .shop) ব্যবহার করতে পারব?',
    questionEn: 'Can I use my own custom domain (.com or .shop)?',
    answerBn: 'অবশ্যই! আমাদের মান্থলি, কোয়ার্টারলি ও ইয়ারলি প্যাকেজে সম্পূর্ণ ফ্রি কাস্টম ডোমেইন কানেক্টিভিটি ও আজীবন ফ্রি SSL সার্টিফিকেটের সুবিধা অন্তর্ভুক্ত রয়েছে।',
    answerEn: 'Absolutely! Our Monthly, Quarterly, and Yearly packages include free custom domain connectivity and lifetime free SSL certificates.'
  },
  {
    id: 'faq-5',
    questionBn: 'আমার ব্র্যান্ডের নামে কি নিজস্ব অ্যান্ড্রয়েড মোবাইল অ্যাপ তৈরি হবে?',
    questionEn: 'Will an Android app be created under my own brand name?',
    answerBn: 'হ্যাঁ! BDRetailers এর আধুনিক হোয়াইট-লেবেল টেকনোলজির মাধ্যমে আপনার নিজস্ব ব্র্যান্ডের নামে ডেডিকেটেড Android অ্যাপ (.aab / .apk) তৈরি ও Google Play Store এ পাবলিশ করার ব্যবস্থা রয়েছে।',
    answerEn: 'Yes! Through BDRetailers’ modern white-label technology, a dedicated Android app (.aab / .apk) can be built in your brand name and published to Google Play Store.'
  },
  {
    id: 'faq-6',
    questionBn: 'আমার কোনো প্রযুক্তিগত বা কোডিং জ্ঞান না থাকলে কি আমি চালাতে পারব?',
    questionEn: 'Can I run it without any technical or coding knowledge?',
    answerBn: 'একদমই কোনো কোডিং বা টেকনিক্যাল জ্ঞানের প্রয়োজন নেই। সম্পূর্ণ ইউজার-ফ্রেন্ডলি বাংলা ও ইংরেজি ইন্টারফেসে পণ্য যোগ করা, অর্ডার প্রসেসিং ও স্টক ম্যানেজমেন্ট খুব সহজেই মোবাইল দিয়ে পরিচালনা করতে পারবেন।',
    answerEn: 'No coding or technical skills are required at all. You can easily manage product additions, order processing, and inventory via mobile in a user-friendly bilingual interface.'
  }
];

const FAQ_TRANSLATIONS_DICT = {
  // Questions
  'BDRetailers এ কীভাবে অনলাইন স্টোর খুলব?': 'How do I open an online store on BDRetailers?',
  'স্টার্টার প্ল্যানে কি আসলেই কোনো অগ্রিম ফি নেই?': 'Is there really no upfront fee in the Starter plan?',
  'Steadfast কুরিয়ার ও পেমেন্ট গেটওয়ে কীভাবে কাজ করে?': 'How do Steadfast Courier and payment gateways work?',
  'আমি কি আমার নিজস্ব কাস্টম ডোমেইন (.com বা .shop) ব্যবহার করতে পারব?': 'Can I use my own custom domain (.com or .shop)?',
  'আমার ব্র্যান্ডের নামে কি নিজস্ব অ্যান্ড্রয়েড মোবাইল অ্যাপ তৈরি হবে?': 'Will an Android app be created under my own brand name?',
  'আমার কোনো প্রযুক্তিগত বা কোডিং জ্ঞান না থাকলে কি আমি চালাতে পারব?': 'Can I run it without any technical or coding knowledge?',

  // Answers
  'মার্চেন্ট হতে "Become Retailer" বাটনে ক্লিক করে আপনার নাম, দোকানের নাম, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে মাত্র ১ মিনিটেই ফ্রি রেজিস্ট্রেশন সম্পন্ন করতে পারেন। এরপর সাথে সাথেই আপনার স্টোর লাইভ হয়ে যাবে।':
    'Click the "Become Retailer" button and complete the free registration in just 1 minute with your name, store name, mobile number, and password. Your store will go live instantly.',
  'হ্যাঁ, আমাদের স্টার্টার প্ল্যানে কোনো মাসিক ফি বা অগ্রিম খরচ নেই (০৳ আপফ্রন্ট ফি)। শুধুমাত্র আপনার পণ্য সফলভাবে বিক্রয় হলে একটি ক্ষুদ্র রেভিনিউ শেয়ার প্রযোজ্য হবে। অর্থাৎ নো সেল = নো ফি!':
    'Yes, our Starter plan has no monthly fees or upfront costs (৳0 upfront fee). Only when your products sell successfully, a small revenue share applies. No sale = no fee!',
  'আমাদের সিস্টেমে Steadfast কুরিয়ার অটোমেটেড API সম্পূর্ণ ফ্রি ইন্টিগ্রেটেড রয়েছে। বিকাশ, নগদ, রকেট ও অনলাইন কার্ড পেমেন্ট সরাসরি আপনার অ্যাকাউন্টে জমা হবে।':
    'Our system has Steadfast Courier automated API integrated for free. bKash, Nagad, Rocket, and card payments deposit directly into your account.',
  'অবশ্যই! আমাদের মান্থলি, কোয়ার্টারলি ও ইয়ারলি প্যাকেজে সম্পূর্ণ ফ্রি কাস্টম ডোমেইন কানেক্টিভিটি ও আজীবন ফ্রি SSL সার্টিফিকেটের সুবিধা অন্তর্ভুক্ত রয়েছে।':
    'Absolutely! Our Monthly, Quarterly, and Yearly packages include free custom domain connectivity and lifetime free SSL certificates.',
  'হ্যাঁ! BDRetailers এর আধুনিক হোয়াইট-লেবেল টেকনোলজির মাধ্যমে আপনার নিজস্ব ব্র্যান্ডের নামে ডেডিকেটেড Android অ্যাপ (.aab / .apk) তৈরি ও Google Play Store এ পাবলিশ করার ব্যবস্থা রয়েছে।':
    'Yes! Through BDRetailers’ modern white-label technology, a dedicated Android app (.aab / .apk) can be built in your brand name and published to Google Play Store.',
  'একদমই কোনো কোডিং বা টেকনিক্যাল জ্ঞানের প্রয়োজন নেই। সম্পূর্ণ ইউজার-ফ্রেন্ডলি বাংলা ও ইংরেজি ইন্টারফেসে পণ্য যোগ করা, অর্ডার প্রসেসিং ও স্টক ম্যানেজমেন্ট খুব সহজেই মোবাইল দিয়ে পরিচালনা করতে পারবেন।':
    'No coding or technical skills are required at all. You can easily manage product additions, order processing, and inventory via mobile in a user-friendly bilingual interface.'
};

const getFaqQuestion = (faq, isEn) => {
  if (!isEn) {
    return faq.questionBn || faq.question || '';
  }
  if (faq.questionEn) return faq.questionEn;

  // Match by id in DEFAULT_FAQS
  const matchById = DEFAULT_FAQS.find(d => d.id === faq.id);
  if (matchById?.questionEn) return matchById.questionEn;

  // Match by raw question in dictionary
  const rawQ = String(faq.question || faq.questionBn || '').trim();
  if (FAQ_TRANSLATIONS_DICT[rawQ]) return FAQ_TRANSLATIONS_DICT[rawQ];

  // Match by normalized text in DEFAULT_FAQS
  const matchByText = DEFAULT_FAQS.find(d => d.questionBn.trim() === rawQ);
  if (matchByText?.questionEn) return matchByText.questionEn;

  return faq.question || faq.questionBn || '';
};

const getFaqAnswer = (faq, isEn) => {
  if (!isEn) {
    return faq.answerBn || faq.answer || '';
  }
  if (faq.answerEn) return faq.answerEn;

  // Match by id in DEFAULT_FAQS
  const matchById = DEFAULT_FAQS.find(d => d.id === faq.id);
  if (matchById?.answerEn) return matchById.answerEn;

  // Match by raw answer in dictionary
  const rawA = String(faq.answer || faq.answerBn || '').trim();
  if (FAQ_TRANSLATIONS_DICT[rawA]) return FAQ_TRANSLATIONS_DICT[rawA];

  // Match by normalized text in DEFAULT_FAQS
  const matchByText = DEFAULT_FAQS.find(d => d.answerBn.trim() === rawA);
  if (matchByText?.answerEn) return matchByText.answerEn;

  return faq.answer || faq.answerBn || '';
};

export default function FaqSection({ globalConfig = null }) {
  const [openIndex, setOpenIndex] = useState(0);
  const { language, t } = useLanguage();

  const rawFaqs = (globalConfig?.faqs && globalConfig.faqs.length > 0)
    ? globalConfig.faqs
    : DEFAULT_FAQS;

  const isEn = language === 'en';

  return (
    <section id="faq" className="relative z-20 py-16 md:py-24 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
            <HelpCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>{t('সচরাচর জিজ্ঞাসিত প্রশ্নাবলী', 'Frequently Asked Questions')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {language === 'en' ? (
              <>Frequently Asked <span className="text-emerald-600 dark:text-emerald-400">Questions</span></>
            ) : (
              <>সাধারণ কিছু <span className="text-emerald-600 dark:text-emerald-400">প্রশ্ন ও উত্তর</span></>
            )}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal max-w-xl mx-auto">
            {t('BDRetailers প্ল্যাটফর্ম, সাবস্ক্রিপশন প্ল্যান ও সার্ভিস সম্পর্কে সাধারণ প্রশ্নগুলোর উত্তর জেনে নিন।', 'Find answers to common questions about BDRetailers platform, subscription plans, and merchant services.')}
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {rawFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const questionText = getFaqQuestion(faq, isEn);
            const answerText = getFaqAnswer(faq, isEn);

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
                      {questionText}
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
                    {answerText}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Need more help CTA */}
        <div className="mt-10 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>{t('আরও কোনো প্রশ্ন আছে? আমাদের সাপোর্ট টিম সবসময় প্রস্তুত।', 'Have more questions? Our support team is always ready to help.')}</span>
            <a
              href={`https://wa.me/88${(globalConfig?.whatsapp || '01734763306').replace(/[^0-9]/g, '').replace(/^88/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <MessageCircleQuestion size={14} /> {t('সরাসরি হোয়াটসঅ্যাপে কথা বলুন', 'Chat on WhatsApp Directly')}
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
