'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewsletterSection({ globalConfig = null }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন');
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
        throw new Error(data.error || 'সাবস্ক্রিপশন ব্যর্থ হয়েছে');
      }

      setSubscribed(true);
      toast.success(data.message || 'সাবস্ক্রিপশন সফল হয়েছে! 🎉');
      setEmail('');
    } catch (err) {
      toast.error(err.message || 'ত্রুটি হয়েছে, পরে চেষ্টা করুন');
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
            
            {/* Top Icon Well */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl neo-inset-deep text-[#6C63FF] mx-auto flex items-center justify-center">
              <Mail size={32} className="stroke-[2.2]" />
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neo-extruded-sm text-[#6C63FF] font-black text-xs uppercase tracking-widest">
                <Sparkles size={13} />
                <span>ভিআইপি আপডেট ও অফার</span>
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#3D4852] dark:text-slate-100 tracking-tight leading-tight">
                Stay Ahead with <span className="text-[#6C63FF]">BDRetailers</span>
              </h2>
              <p className="text-sm sm:text-base text-[#6B7280] dark:text-slate-400 font-medium leading-relaxed">
                নতুন পণ্য লঞ্চ, স্পেশাল ডিসকাউন্ট কুপন ও ই-কমার্স গ্রোথ গাইড সরাসরি আপনার ইনবক্সে পেতে সাবস্ক্রাইব করুন। কোনো স্প্যাম নেই!
              </p>
            </div>

            {subscribed ? (
              <div className="neo-inset p-6 rounded-3xl flex items-center justify-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold text-sm animate-fade-in">
                <CheckCircle2 size={24} className="shrink-0" />
                <span>ধন্যবাদ! আপনি সফলভাবে আমাদের নিউজলেটারে সাবস্ক্রাইব করেছেন।</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* Deep Inset Input Well */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6B7280]">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="আপনার ইমেইল অ্যাড্রেস লিখুন (e.g. name@mail.com)"
                    required
                    className="w-full pl-11 pr-4 py-4 rounded-2xl neo-inset-deep text-sm font-medium text-[#3D4852] dark:text-slate-200 placeholder-[#6B7280]/60 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] transition-all bg-transparent"
                  />
                </div>

                {/* Tactile Extruded CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="h-13 sm:h-auto px-8 py-4 rounded-2xl bg-[#6C63FF] hover:bg-[#5a52ea] text-white font-extrabold text-sm flex items-center justify-center gap-2 neo-extruded hover:-translate-y-0.5 active:translate-y-0.5 active:neo-inset-sm transition-all duration-300 cursor-pointer shrink-0 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>যুক্ত হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>সাবস্ক্রাইব করুন</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="flex items-center justify-center gap-6 pt-2 text-[11px] font-bold text-[#6B7280] dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ১০০% নিরাপদ ও ফ্রি
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" /> যেকোনো সময় আনসাবস্ক্রাইব
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
