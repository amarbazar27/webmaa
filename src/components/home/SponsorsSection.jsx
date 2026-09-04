'use client';

import { useState } from 'react';
import { ShieldCheck, ExternalLink, Sparkles, Building2, Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_SPONSORS = [
  {
    id: 'sp-1',
    companyName: 'Steadfast Courier',
    tier: 'অফিসিয়াল লজিস্টিক পার্টনার',
    logoUrl: 'https://steadfast.com.bd/images/logo.png',
    websiteUrl: 'https://steadfast.com.bd'
  },
  {
    id: 'sp-2',
    companyName: 'UddoktaPay',
    tier: 'পেমেন্ট গেটওয়ে পার্টনার',
    logoUrl: 'https://uddoktapay.com/assets/images/logo.png',
    websiteUrl: 'https://uddoktapay.com'
  },
  {
    id: 'sp-3',
    companyName: 'Bkash Merchant',
    tier: 'ডিজিটাল পেমেন্ট নেটওয়ার্ক',
    logoUrl: 'https://www.bkash.com/images/bkash_logo.png',
    websiteUrl: 'https://www.bkash.com'
  }
];

export default function SponsorsSection({ globalConfig = null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    websiteUrl: '',
    logoUrl: '',
    note: ''
  });

  const sponsorsList = (globalConfig?.sponsors && globalConfig.sponsors.length > 0)
    ? globalConfig.sponsors
    : DEFAULT_SPONSORS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error('কোম্পানির নাম লিখুন');
      return;
    }
    if (!formData.email && !formData.phone) {
      toast.error('ইমেইল অথবা ফোন নম্বর দিন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/sponsor-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'আবেদন জমা দিতে সমস্যা হয়েছে');

      toast.success(data.message || 'আবেদন সফলভাবে গ্রহণ করা হয়েছে! 🎉');
      setIsModalOpen(false);
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        websiteUrl: '',
        logoUrl: '',
        note: ''
      });
    } catch (err) {
      toast.error(err.message || 'ব্যর্থ হয়েছে, পুনরায় চেষ্টা করুন');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="sponsors" className="relative z-20 py-16 md:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neo-extruded-sm text-[#6C63FF] font-black text-xs uppercase tracking-widest">
              <ShieldCheck size={14} />
              <span>বিশ্বস্ত পার্টনার ও স্পনসর</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#3D4852] dark:text-slate-100 tracking-tight">
              Our Trusted <span className="text-[#6C63FF]">Partners</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-slate-400 font-medium max-w-lg">
              আমাদের সাথে যুক্ত আছেন শীর্ষস্থানীয় কুরিয়ার, পেমেন্ট গেটওয়ে ও টেকনোলজি প্রতিষ্ঠানসমূহ।
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="neo-btn px-6 py-3.5 rounded-2xl text-xs font-black text-[#6C63FF] hover:text-[#5248e5] flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-300"
          >
            <Plus size={16} /> পার্টনার হতে আবেদন করুন
          </button>
        </div>

        {/* Sponsors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsorsList.map((sponsor, idx) => (
            <div
              key={sponsor.id || idx}
              className="neo-card p-7 flex flex-col justify-between group transition-all duration-300 relative"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                {/* Logo Well */}
                <div className="w-16 h-16 rounded-2xl neo-inset flex items-center justify-center p-2.5 overflow-hidden shrink-0 bg-transparent">
                  {sponsor.logoUrl ? (
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.companyName}
                      className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<span class="text-xs font-black text-[#6C63FF]">PARTNER</span>';
                      }}
                    />
                  ) : (
                    <Building2 size={24} className="text-[#6C63FF]" />
                  )}
                </div>

                {sponsor.tier && (
                  <span className="neo-inset-sm px-3 py-1 rounded-full text-[10px] font-black text-[#6B7280] dark:text-slate-300">
                    {sponsor.tier}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-lg font-black text-[#3D4852] dark:text-slate-100 tracking-tight">
                  {sponsor.companyName}
                </h3>
                {sponsor.websiteUrl && (
                  <a
                    href={sponsor.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6C63FF] hover:text-[#5248e5] mt-3 group-hover:translate-x-1 transition-transform"
                  >
                    <span>ওয়েবসাইট ভিজিট করুন</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Sponsor Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg neo-card p-6 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-300/40 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl neo-inset text-[#6C63FF] flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#3D4852] dark:text-slate-100">
                    স্পনসর / পার্টনারশিপ আবেদন
                  </h3>
                  <p className="text-[11px] font-bold text-[#6B7280] dark:text-slate-400">
                    BDRetailers ইকোসিস্টেমে আপনার ব্র্যান্ড প্রচার করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl neo-extruded-sm flex items-center justify-center text-[#6B7280] hover:text-[#3D4852] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-[#3D4852] dark:text-slate-200 block mb-1.5">
                  কোম্পানি বা ব্র্যান্ডের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ABC Logistics / XYZ Pay"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl neo-inset text-xs font-bold text-[#3D4852] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] bg-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-[#3D4852] dark:text-slate-200 block mb-1.5">
                    যোগাযোগকারীর নাম
                  </label>
                  <input
                    type="text"
                    placeholder="আপনার নাম"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl neo-inset text-xs font-bold text-[#3D4852] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] bg-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-[#3D4852] dark:text-slate-200 block mb-1.5">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl neo-inset text-xs font-bold text-[#3D4852] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-[#3D4852] dark:text-slate-200 block mb-1.5">
                  ইমেইল অ্যাড্রেস
                </label>
                <input
                  type="email"
                  placeholder="contact@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl neo-inset text-xs font-bold text-[#3D4852] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] bg-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#3D4852] dark:text-slate-200 block mb-1.5">
                  কোম্পানির ওয়েবসাইট লিংক
                </label>
                <input
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl neo-inset text-xs font-bold text-[#3D4852] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] bg-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#3D4852] dark:text-slate-200 block mb-1.5">
                  লোগো ছবির লিংক (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://.../logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl neo-inset text-xs font-bold text-[#3D4852] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] bg-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#3D4852] dark:text-slate-200 block mb-1.5">
                  মন্তব্য বা পার্টনারশিপের ধরণ
                </label>
                <textarea
                  rows={3}
                  placeholder="কীভাবে একসাথে কাজ করতে চান লিখুন..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl neo-inset text-xs font-bold text-[#3D4852] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] bg-transparent"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-2xl neo-extruded-sm text-xs font-black text-[#6B7280] hover:text-[#3D4852] cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-2xl bg-[#6C63FF] hover:bg-[#5a52ea] text-white font-extrabold text-xs neo-extruded hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>জমা হচ্ছে...</span>
                    </>
                  ) : (
                    <span>আবেদন জমা দিন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
