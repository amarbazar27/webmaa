'use client';

import { useState, useEffect } from 'react';
import { 
  Palette, Plus, Edit2, Trash2, Eye, ExternalLink, 
  Sparkles, RotateCcw, Check, Save, X, Search, 
  CheckCircle2, AlertCircle, Globe, Star, ShoppingBag, Layers
} from 'lucide-react';
import { 
  DEFAULT_WEBSITE_TEMPLATES, 
  TEMPLATE_CATEGORIES, 
  getMergedTemplates, 
  getDemoUrl 
} from '@/lib/templatesData';
import { THEME_PRESETS } from '@/components/dashboard/HomepageBuilder/ThemeEditor';
import { updateGlobalConfig } from '@/lib/firestore';
import toast from 'react-hot-toast';

export default function SuperadminTemplatesManager({ globalConfig = {} }) {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    titleBn: '',
    category: 'grocery',
    categoryBn: 'গ্রোসারি',
    demoSubdomain: '',
    customDemoUrl: '',
    themePresetId: 'fresh_grocery',
    primaryColor: '#059669',
    secondaryColor: '#064E3B',
    accentColor: '#34D399',
    bgColor: '#F0FDF4',
    textColor: '#064E3B',
    font: 'Hind Siliguri',
    buttonRadius: '12px',
    cardRadius: '16px',
    badge: 'নতুন',
    description: '',
    featuresText: '',
    rating: 4.9,
    storesCount: 100,
    isActive: true,
    featuredOnHome: true,
    thumbnail: ''
  });

  useEffect(() => {
    setTemplates(getMergedTemplates(globalConfig?.websiteTemplates));
  }, [globalConfig]);

  const filtered = templates.filter(t => {
    const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
    const matchSearch = 
      (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.titleBn || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.demoSubdomain || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setFormData({
      id: 'template_' + Date.now().toString().slice(-5),
      title: '',
      titleBn: '',
      category: 'grocery',
      categoryBn: 'গ্রোসারি',
      demoSubdomain: '',
      customDemoUrl: '',
      themePresetId: 'clean_commerce',
      primaryColor: '#4F46E5',
      secondaryColor: '#1E1B4B',
      accentColor: '#818CF8',
      bgColor: '#FFFFFF',
      textColor: '#0F172A',
      font: 'Inter',
      buttonRadius: '12px',
      cardRadius: '16px',
      badge: 'নতুন',
      description: '',
      featuresText: 'বিকাশ ও নগদ পেমেন্ট, Steadfast কুরিয়ার ট্র্যাকিং, মোবাইল অপ্টিমাইজড',
      rating: 4.9,
      storesCount: 50,
      isActive: true,
      featuredOnHome: true,
      thumbnail: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTemplate(t);
    setFormData({
      ...t,
      featuresText: Array.isArray(t.features) ? t.features.join(', ') : (t.features || '')
    });
    setModalOpen(true);
  };

  const handlePresetSelect = (presetId) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setFormData(prev => ({
        ...prev,
        themePresetId: preset.id,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        accentColor: preset.accentColor,
        bgColor: preset.bgColor,
        textColor: preset.textColor,
        font: preset.font,
        buttonRadius: preset.buttonRadius,
        cardRadius: preset.cardRadius
      }));
    }
  };

  const handleSaveModal = async (e) => {
    e?.preventDefault();
    if (!formData.titleBn || !formData.demoSubdomain) {
      toast.error('বাংলা নাম এবং ডেমো সাবডোমেন অবশ্যই প্রদান করতে হবে');
      return;
    }

    const featuresArray = formData.featuresText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const templatePayload = {
      ...formData,
      features: featuresArray
    };
    delete templatePayload.featuresText;

    let updatedTemplates;
    if (editingTemplate) {
      updatedTemplates = templates.map(t => t.id === editingTemplate.id ? templatePayload : t);
    } else {
      updatedTemplates = [templatePayload, ...templates];
    }

    setTemplates(updatedTemplates);
    setModalOpen(false);

    setSaving(true);
    const toastId = toast.loading('টেমপ্লেট ডেটাবেজে সংরক্ষণ হচ্ছে...');
    try {
      await updateGlobalConfig({ websiteTemplates: updatedTemplates });
      toast.success('টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে! 🎉', { id: toastId });
    } catch (err) {
      toast.error('সংরক্ষণ ব্যর্থ হয়েছে: ' + err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ওয়েবসাইট টেমপ্লেটটি ডিলিট করতে চান?')) return;

    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    
    setSaving(true);
    const toastId = toast.loading('টেমপ্লেট ডিলিট হচ্ছে...');
    try {
      await updateGlobalConfig({ websiteTemplates: updated });
      toast.success('টেমপ্লেট ডিলিট করা হয়েছে', { id: toastId });
    } catch (err) {
      toast.error('ব্যর্থ হয়েছে: ' + err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id, field) => {
    const updated = templates.map(t => {
      if (t.id === id) {
        return { ...t, [field]: !t[field] };
      }
      return t;
    });
    setTemplates(updated);
    try {
      await updateGlobalConfig({ websiteTemplates: updated });
      toast.success('স্ট্যাটাস আপডেট হয়েছে');
    } catch (err) {
      toast.error('আপডেট ব্যর্থ হয়েছে');
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('আপনি কি পূর্বনির্ধারিত সব ডিফল্ট ওয়েবসাইট টেমপ্লেট রিস্টোর করতে চান? এটি বর্তমান কাস্টমাইজেশন রিসেট করবে।')) return;

    setTemplates(DEFAULT_WEBSITE_TEMPLATES);
    setSaving(true);
    const toastId = toast.loading('ডিফল্ট টেমপ্লেট রিস্টোর হচ্ছে...');
    try {
      await updateGlobalConfig({ websiteTemplates: DEFAULT_WEBSITE_TEMPLATES });
      toast.success('সব ডিফল্ট ডিজাইন সফলভাবে রিস্টোর হয়েছে!', { id: toastId });
    } catch (err) {
      toast.error('রিস্টোর ব্যর্থ হয়েছে: ' + err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-purple-300 text-xs font-black uppercase tracking-wider">
              <Palette size={13} />
              <span>ওয়েবসাইট ডিজাইন ও লাইভ ডেমো ম্যানেজার</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              রেডিমেড ওয়েবসাইট টেমপ্লেট কন্ট্রোল
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              মার্চেন্টদের জন্য বিভিন্ন ক্যাটাগরির ওয়েবসাইট ডিজাইন, *.bdretailers.com লাইভ ডেমো সাবডোমেন এবং থিম সেটিংস কনফিগার করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer"
              title="ডিফল্ট টেমপ্লেট রিস্টোর করুন"
            >
              <RotateCcw size={14} />
              <span>ডিফল্ট রিস্টোর</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>নতুন ডিজাইন যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase">মোট ডিজাইন</p>
            <p className="text-2xl font-black text-white">{templates.length} টি</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase">সক্রিয় (Active)</p>
            <p className="text-2xl font-black text-emerald-400">
              {templates.filter(t => t.isActive !== false).length} টি
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase">হোমপেজে ফিচার্ড</p>
            <p className="text-2xl font-black text-purple-300">
              {templates.filter(t => t.featuredOnHome !== false).length} টি
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase">ক্যাটাগরি কভার্ড</p>
            <p className="text-2xl font-black text-amber-400">
              {new Set(templates.map(t => t.category)).size} টি
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="নাম বা সাবডোমেন দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none focus:border-purple-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {TEMPLATE_CATEGORIES.slice(0, 6).map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat.id
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(t => {
          const liveDemoUrl = getDemoUrl(t);

          return (
            <div 
              key={t.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img src={t.thumbnail} alt={t.title} className="w-full h-full object-cover" />
                  
                  {t.badge && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white bg-black/60 backdrop-blur shadow">
                      {t.badge}
                    </span>
                  )}

                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-emerald-400 bg-black/70 backdrop-blur border border-emerald-500/30">
                    {t.demoSubdomain}.bdretailers.com
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      {t.categoryBn} ({t.category})
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <Star size={13} className="fill-amber-500" />
                      <span>{t.rating || '4.9'}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t.titleBn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>

                  {/* Colors & Preset */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-mono text-[10px]">Preset: {t.themePresetId}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: t.primaryColor }} title="Primary Color" />
                      <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: t.secondaryColor }} title="Secondary Color" />
                      <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: t.accentColor }} title="Accent Color" />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center justify-between pt-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t.isActive !== false}
                        onChange={() => handleToggleStatus(t.id, 'isActive')}
                        className="rounded text-purple-600 focus:ring-0"
                      />
                      <span className="font-bold text-slate-700 dark:text-slate-300">সক্রিয় (Active)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t.featuredOnHome !== false}
                        onChange={() => handleToggleStatus(t.id, 'featuredOnHome')}
                        className="rounded text-purple-600 focus:ring-0"
                      />
                      <span className="font-bold text-slate-700 dark:text-slate-300">হোমে দেখান</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-5 pt-0 grid grid-cols-3 gap-2">
                <a
                  href={`/templates/preview/${t.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Eye size={13} />
                  <span>ডেমো</span>
                </a>
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="py-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>এডিট</span>
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>মুছুন</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-slate-900 dark:text-white shadow-2xl relative space-y-6 my-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black">
                {editingTemplate ? 'ওয়েবসাইট টেমপ্লেট সম্পাদনা করুন' : 'নতুন ওয়েবসাইট টেমপ্লেট যোগ করুন'}
              </h3>
              <p className="text-xs text-slate-500">
                এই তথ্যগুলো মেইন সাইটের রেডিমেড ওয়েবসাইট গ্যালারি ও *.bdretailers.com এ প্রদর্শিত হবে।
              </p>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">বাংলা টাইটেল *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ফ্রেশ গ্রোসারি ও অর্গানিক বাজার"
                    value={formData.titleBn}
                    onChange={e => setFormData({ ...formData, titleBn: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">ইংরেজি টাইটেল</label>
                  <input
                    type="text"
                    placeholder="যেমন: Fresh Grocery & Supermarket"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">ক্যাটাগরি</label>
                  <select
                    value={formData.category}
                    onChange={e => {
                      const cat = TEMPLATE_CATEGORIES.find(c => c.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        category: e.target.value,
                        categoryBn: cat ? cat.label.split(' ')[0] : e.target.value 
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-600"
                  >
                    {TEMPLATE_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">ডেমো সাবডোমেন স্ল্যাগ *</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      required
                      placeholder="যেমন: grocery বা messerbazar"
                      value={formData.demoSubdomain}
                      onChange={e => setFormData({ ...formData, demoSubdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="w-full px-3.5 py-2.5 rounded-l-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-600 font-mono"
                    />
                    <span className="px-3 py-2.5 rounded-r-xl bg-slate-100 dark:bg-slate-700 text-slate-500 font-mono text-[10px] border border-l-0 border-slate-200 dark:border-slate-700">
                      .bdretailers.com
                    </span>
                  </div>
                </div>
              </div>

              {/* Theme Preset Connect */}
              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">থিম প্রিসেট নির্বাচন করুন</label>
                <select
                  value={formData.themePresetId}
                  onChange={e => handlePresetSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-600"
                >
                  {THEME_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.namebn} ({p.name})</option>
                  ))}
                </select>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">থাম্বনেইল ইমেজ URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.thumbnail}
                  onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-600 font-mono text-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">সংক্ষিপ্ত বিবরণ</label>
                <textarea
                  rows={2}
                  placeholder="ডিজাইনের বিশেষত্ব বর্ণনা করুন..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-600"
                />
              </div>

              {/* Features (comma separated) */}
              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">ফিচারসমূহ (কমা দিয়ে আলাদা করুন)</label>
                <input
                  type="text"
                  placeholder="১-ক্লিক অর্ডার, বিকাশ পেমেন্ট, অটো কুরিয়ার, ফাস্ট স্পিড"
                  value={formData.featuresText}
                  onChange={e => setFormData({ ...formData, featuresText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">ব্যাজ টেক্সট</label>
                  <input
                    type="text"
                    placeholder="যেমন: বেস্টসেলার"
                    value={formData.badge}
                    onChange={e => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-700 dark:text-slate-300">রেটিং</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) || 4.9 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>সক্রিয় (Active)</span>
                  </label>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featuredOnHome}
                      onChange={e => setFormData({ ...formData, featuredOnHome: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>হোমে দেখান</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-lg shadow-purple-600/25 flex items-center gap-1.5"
                >
                  <Save size={15} />
                  <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'টেমপ্লেট সেভ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
