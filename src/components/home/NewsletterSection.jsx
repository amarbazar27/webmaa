'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import toast from 'react-hot-toast';

export default function NewsletterSection({ globalConfig = null }) {
  const { language, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error(t('অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন', 'Please enter a valid email address'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('সাবস্ক্রিপশন ব্যর্থ হয়েছে', 'Subscription failed'));
      }

      setSubscribed(true);
      toast.success(data.message || t('সাবস্ক্রিপশন সফল হয়েছে! 🎉', 'Subscription successful! 🎉'));
      setEmail('');
    } catch (err) {
      toast.error(err.message || t('ত্রুটি হয়েছে, পরে চেষ্টা করুন', 'An error occurred, please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="newsletter" className="relative z-20 py-16 md:py-24 scroll-mt-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Neumorphic Container Card */}
        <div className="neo-card p-8 sm:p-12 md:p-16 relative overflow-hidden text-center">
          
          {/* Decorative Tactile Concentric Circles (Neumorphic Signature Art) */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full neo-inset-deep pointer-events-none opacity-40 hidden sm:block" />
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full neo-extruded pointer-events-none opacity-60 hidden sm:block" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full neo-inset pointer-events-none opacity-30 hidden sm:block" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            
            {/* Top Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
              <Mail size={32} className="stroke-[2.2]" />
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <Mail size={13} />
                <span>{t('ভিআইপি আপডেট ও অফার', 'VIP Updates & Offers')}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {language === 'en' ? (
                  <>Stay Ahead with <span className="text-emerald-600 dark:text-emerald-400">BDRetailers</span></>
                ) : (
                  <>BDRetailers এর সাথে থাকুন <span className="text-emerald-600 dark:text-emerald-400">একধাপ এগিয়ে</span></>
                )}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {t('নতুন পণ্য লঞ্চ, স্পেশাল ডিসকাউন্ট কুপন ও ই-কমার্স গ্রোথ গাইড সরাসরি আপনার ইনবক্সে পেতে সাবস্ক্রাইব করুন। কোনো স্প্যাম নেই!', 'Subscribe to get new product launches, special discount coupons, and e-commerce growth guides directly in your inbox. No spam!')}
              </p>
            </div>

            {subscribed ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-3 text-emerald-700 dark:text-emerald-300 font-bold text-sm animate-fade-in">
                <CheckCircle2 size={24} className="shrink-0 text-emerald-600" />
                <span>{t('ধন্যবাদ! আপনি সফলভাবে আমাদের নিউজলেটারে সাবস্ক্রাইব করেছেন।', 'Thank you! You have successfully subscribed to our newsletter.')}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* Input */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('আপনার ইমেইল অ্যাড্রেস লিখুন (e.g. name@mail.com)', 'Enter your email address (e.g. name@mail.com)')}
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white dark:bg-slate-900"
                  />
                </div>

                {/* CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer shrink-0 disabled:opacity-60 active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t('যুক্ত হচ্ছে...', 'Subscribing...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('সাবস্ক্রাইব করুন', 'Subscribe')}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="flex items-center justify-center gap-6 pt-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t('১০০% নিরাপদ ও ফ্রি', '100% Safe & Free')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t('যেকোনো সময় আনসাবস্ক্রাইব', 'Unsubscribe Anytime')}
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
