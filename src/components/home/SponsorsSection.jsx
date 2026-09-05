'use client';

import { useState } from 'react';
import { ShieldCheck, ExternalLink, Building2, Plus, X, Loader2, Upload, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const DEFAULT_SPONSORS = [
  {
    id: 'sp-1',
    companyName: 'Steadfast Courier',
    tier: 'অফিসিয়াল লজিস্টিক পার্টনার',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><rect width="400" height="120" rx="16" fill="%23004b93"/><g fill="%23ffffff"><path d="M40 35 L65 20 L90 35 L90 65 L65 80 L40 65 Z" fill="none" stroke="%23ffffff" stroke-width="6"/><circle cx="65" cy="50" r="10" fill="%23ffc20e"/><text x="110" y="60" font-family="sans-serif" font-size="28" font-weight="900" fill="%23ffffff">STEADFAST</text><text x="110" y="85" font-family="sans-serif" font-size="15" font-weight="700" fill="%23ffc20e" letter-spacing="4">COURIER BD</text></g></svg>',
    websiteUrl: 'https://steadfast.com.bd'
  },
  {
    id: 'sp-2',
    companyName: 'UddoktaPay',
    tier: 'পেমেন্ট গেটওয়ে পার্টনার',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><rect width="400" height="120" rx="16" fill="%235a31f4"/><circle cx="65" cy="60" r="30" fill="%23ffffff"/><path d="M52 45 L68 60 L52 75 M64 45 L80 60 L64 75" fill="none" stroke="%235a31f4" stroke-width="5" stroke-linecap="round"/><text x="115" y="64" font-family="sans-serif" font-size="28" font-weight="900" fill="%23ffffff">UddoktaPay</text><text x="115" y="86" font-family="sans-serif" font-size="13" font-weight="700" fill="%23c4b5fd" letter-spacing="2">PAYMENT GATEWAY</text></svg>',
    websiteUrl: 'https://uddoktapay.com'
  },
  {
    id: 'sp-3',
    companyName: 'Bkash Merchant',
    tier: 'ডিজিটাল পেমেন্ট নেটওয়ার্ক',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><rect width="400" height="120" rx="16" fill="%23e2136e"/><polygon points="40,35 75,35 60,65" fill="%23ffffff"/><polygon points="60,65 95,50 80,85" fill="%23ffffff"/><polygon points="40,35 60,65 35,80" fill="%23ffffff"/><text x="115" y="62" font-family="sans-serif" font-size="28" font-weight="900" fill="%23ffffff">bKash</text><text x="115" y="86" font-family="sans-serif" font-size="13" font-weight="700" fill="%23ffffff" letter-spacing="2">MERCHANT NETWORK</text></svg>',
    websiteUrl: 'https://www.bkash.com'
  }
];

export default function SponsorsSection({ globalConfig = null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    websiteUrl: '',
    logoUrl: '',
    note: ''
  });

  // Respect user-configured sponsors (even if empty array [])
  const sponsorsList = Array.isArray(globalConfig?.sponsors)
    ? globalConfig.sponsors
    : DEFAULT_SPONSORS;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('শুধুমাত্র ছবি ফাইল (PNG, JPG, WebP, SVG) আপলোড করা যাবে');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ফাইলের সাইজ ৫ মেগাবাইটের কম হতে হবে');
      return;
    }

    setUploadingLogo(true);
    const toastId = toast.loading('ছবি প্রস্তুত হচ্ছে...');
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('folder', 'partner-sponsors');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadForm
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setFormData(prev => ({ ...prev, logoUrl: data.url }));
          toast.success('ছবি আপলোড সফল হয়েছে! 📸', { id: toastId });
          setUploadingLogo(false);
          return;
        }
      }

      // Fallback: Use client-side Data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result }));
        toast.success('ছবি সফলভাবে যুক্ত হয়েছে! 📸', { id: toastId });
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result }));
        toast.success('ছবি যুক্ত হয়েছে!', { id: toastId });
      };
      reader.readAsDataURL(file);
      setUploadingLogo(false);
    }
  };

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

  if (sponsorsList.length === 0) {
    return null;
  }

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
            className="neo-btn px-6 py-3.5 rounded-2xl text-xs font-black text-[#6C63FF] hover:text-[#5248e5] flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-300 shadow-sm"
          >
            <Plus size={16} /> পার্টনার হতে আবেদন করুন
          </button>
        </div>

        {/* Sponsors Grid — Prominent Full-Picture Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sponsorsList.map((sponsor, idx) => {
            const hasLink = Boolean(sponsor.websiteUrl);

            return (
              <div
                key={sponsor.id || idx}
                className="neo-card p-6 flex flex-col justify-between group transition-all duration-300 relative rounded-3xl overflow-hidden hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Full-width Image Showcase Area with Direct Browse Link */}
                <div className="relative w-full h-44 sm:h-48 rounded-2xl neo-inset overflow-hidden flex items-center justify-center p-3.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/10 group-hover:border-purple-300 transition-colors">
                  {sponsor.logoUrl ? (
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.companyName}
                      className="w-full h-full object-contain p-2 filter group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="flex flex-col items-center justify-center text-center p-4"><span class="text-base font-black text-[#6C63FF] tracking-tight">${sponsor.companyName}</span><span class="text-[11px] font-bold text-slate-400 mt-1">অফিসিয়াল পার্টনার</span></div>`;
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <Building2 size={36} className="text-[#6C63FF] mb-2 opacity-80" />
                      <span className="text-sm font-black text-[#3D4852] dark:text-slate-100">{sponsor.companyName}</span>
                    </div>
                  )}

                  {/* Tier Badge Float */}
                  {sponsor.tier && (
                    <span className="absolute top-3 right-3 neo-card px-3 py-1 rounded-full text-[10px] font-black text-[#6C63FF] shadow-sm tracking-wide z-10 border border-purple-200/50">
                      {sponsor.tier}
                    </span>
                  )}

                  {/* Interactive Browse Overlay on Image */}
                  {hasLink && (
                    <a
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1.5 text-white z-20 cursor-pointer"
                      title={`${sponsor.companyName} এর ওয়েবসাইট ব্রাউজ করুন`}
                    >
                      <div className="px-4 py-2 rounded-xl bg-[#6C63FF] text-white text-xs font-black flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <span>ব্রাউজ করুন</span>
                        <ExternalLink size={13} />
                      </div>
                      <span className="text-[10px] text-slate-200 font-bold max-w-[80%] truncate">
                        {sponsor.websiteUrl.replace(/^https?:\/\//i, '')}
                      </span>
                    </a>
                  )}
                </div>

                {/* Bottom Details & Action Button */}
                <div className="pt-5 flex items-center justify-between gap-4 border-t border-slate-200/50 dark:border-white/5 mt-4">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-[#3D4852] dark:text-slate-100 tracking-tight truncate">
                      {sponsor.companyName}
                    </h3>
                    <p className="text-[11px] font-bold text-[#6B7280] dark:text-slate-400 truncate mt-0.5">
                      {sponsor.tier || 'অফিসিয়াল পার্টনার'}
                    </p>
                  </div>

                  {hasLink ? (
                    <a
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="neo-btn px-4 py-2.5 rounded-xl text-xs font-black text-[#6C63FF] hover:text-white hover:bg-[#6C63FF] flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95 shadow-sm"
                    >
                      <span>ভিজিট</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">ভেরিফাইড পার্টনার</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Sponsor Application Modal with Direct Image Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg neo-card p-6 sm:p-8 max-h-[92vh] overflow-y-auto custom-scrollbar rounded-3xl border border-white/20 shadow-2xl">
            
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
                  placeholder="যেমন: Steadfast Courier / UddoktaPay"
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

              {/* Direct Picture Upload OR Link */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#3D4852] dark:text-slate-200 block">
                  কোম্পানির লোগো বা ব্যানার ছবি (সরাসরি আপলোড বা লিংক)
                </label>

                {/* File Upload Box */}
                <div className="flex items-center gap-3">
                  <label className="flex-1 px-4 py-3 rounded-2xl border-2 border-dashed border-[#6C63FF]/40 hover:border-[#6C63FF] bg-[#6C63FF]/5 hover:bg-[#6C63FF]/10 flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-black text-[#6C63FF]">
                    {uploadingLogo ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>আপলোড হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>সরাসরি ছবি আপলোড করুন</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Or input direct link */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">অথবা লিংক:</span>
                  <input
                    type="url"
                    placeholder="https://.../logo.png"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl neo-inset text-xs font-bold text-[#3D4852] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#6C63FF] bg-transparent"
                  />
                </div>

                {/* Preview */}
                {formData.logoUrl && (
                  <div className="mt-2 p-3 rounded-2xl neo-inset flex items-center justify-between gap-3 bg-white/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className="h-10 max-w-[120px] object-contain rounded-lg"
                      />
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={13} /> ছবি সিলেক্টেড
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: '' })}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 p-1"
                    >
                      রিমুভ
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-black text-[#3D4852] dark:text-slate-200 block mb-1.5">
                  মন্তব্য বা পার্টনারশিপের ধরণ
                </label>
                <textarea
                  rows={2}
                  placeholder="কীভাবে একসাথে কাজ করতে চান লিখুন..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl neo-inset text-xs font-bold text-[#3D4852] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] bg-transparent resize-none"
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
                  disabled={submitting || uploadingLogo}
                  className="px-6 py-3 rounded-2xl bg-[#6C63FF] hover:bg-[#5a52ea] text-white font-extrabold text-xs neo-extruded hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-md"
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
