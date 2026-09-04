'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, Trash2, Edit2, Check, X, 
  ArrowUp, ArrowDown, Save, RotateCcw, Sparkles, 
  CheckCircle2, ShieldCheck, Zap, Crown 
} from 'lucide-react';
import { updateGlobalConfig } from '@/lib/firestore';
import toast from 'react-hot-toast';

const DEFAULT_PLANS_DATA = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    bengaliTitle: 'স্টার্টার প্যাকেজ',
    subtitle: '০৳ মাসিক ফি • রেভিনিউ শেয়ার',
    price: 0,
    period: '/ মাসিক চার্জ নেই',
    badge: 'নতুনদের জন্য স্পেশাল',
    badgeTheme: 'amber',
    commissionText: '⚡ বিক্রয়ের মাত্র ৫% শেয়ার',
    features: [
      '০৳ অগ্রিম খরচ (Zero Upfront Risk)',
      'সম্পূর্ণ অনলাইন ওয়েবসাইট ও স্টোরফ্রন্ট',
      'নো সেল = নো ফি (১০০% নিরাপদ ব্যবসা)',
      'Steadfast ও অটো পেমেন্ট গেটওয়ে',
      'যেকোনো সময় ফিক্সড প্ল্যানে আপগ্রেড'
    ]
  },
  monthly: {
    id: 'monthly',
    name: 'Standard Monthly',
    bengaliTitle: 'মাসিক প্যাকেজ',
    subtitle: 'নিয়মিত ব্যবসার জন্য সেরা',
    price: 500,
    period: '/ প্রতি মাস',
    badge: '🎁 ১ম মাস ফ্রি ট্রায়াল',
    badgeTheme: 'purple',
    commissionText: '🛡️ ০% সেলস কমিশন (১০০% প্রফিট)',
    features: [
      '১০০% বিক্রয় লাভ আপনার (০% কমিশন)',
      '🌐 নিজস্ব কাস্টম ডোমেন কানেকশন',
      '📱 প্রফেশনাল মোবাইল অ্যাপ ও PWA',
      '📦 আনলিমিটেড প্রোডাক্ট ও ক্যাটালগ',
      '🤖 AI প্রোডাক্ট ডেসক্রিপশন রাইটার'
    ]
  },
  quarterly: {
    id: 'quarterly',
    name: 'Growth Quarterly',
    bengaliTitle: 'ত্রৈমাসিক প্যাকেজ',
    subtitle: '৩ মাসের জন্য ১০% অতিরিক্ত ছাড়',
    price: 1350,
    period: '/ ৩ মাস',
    badge: '🔥 জনপ্রিয় ও সাশ্রয়ী',
    badgeTheme: 'teal',
    commissionText: '🛡️ ০% সেলস কমিশন (১০০% প্রফিট)',
    features: [
      '১০০% বিক্রয় লাভ আপনার (০% কমিশন)',
      '🌐 নিজস্ব কাস্টম ডোমেন কানেকশন',
      '📱 প্রফেশনাল মোবাইল অ্যাপ ও PWA',
      '📦 আনলিমিটেড প্রোডাক্ট ও অর্ডার',
      '⚡ ভিআইপি প্রায়োরিটি সাপোর্ট'
    ]
  },
  yearly: {
    id: 'yearly',
    name: 'Pro Yearly',
    bengaliTitle: 'বার্ষিক প্যাকেজ',
    subtitle: 'সারা বছরের নিশ্চিন্ত সুপার সেভার',
    price: 5000,
    period: '/ ১ বছর',
    badge: '👑 সর্বোচ্চ লাভজনক (২ মাস ফ্রি)',
    badgeTheme: 'indigo',
    commissionText: '🛡️ ০% সেলস কমিশন (১০০% প্রফিট)',
    features: [
      '১০০% বিক্রয় লাভ আপনার (০% কমিশন)',
      '🌐 নিজস্ব কাস্টম ডোমেন কানেকশন',
      '📱 প্রফেশনাল মোবাইল অ্যাপ ও PWA',
      '🤖 ফুল AI অটোমেশন ও অ্যাসিস্ট্যান্ট',
      '👑 ডেডিকেটেড ভিআইপি সাপোর্ট ও সেটআপ'
    ]
  }
};

export default function SuperadminPricingCustomizer({ globalConfig = {} }) {
  const [selectedPlanKey, setSelectedPlanKey] = useState('monthly');
  const [plans, setPlans] = useState(() => {
    const configured = globalConfig?.pricingPlans || {};
    const merged = {};
    for (const key of Object.keys(DEFAULT_PLANS_DATA)) {
      const def = DEFAULT_PLANS_DATA[key];
      const custom = configured[key] || {};
      merged[key] = {
        ...def,
        ...custom,
        features: (Array.isArray(custom.features) && custom.features.length > 0)
          ? [...custom.features]
          : [...def.features]
      };
    }
    return merged;
  });

  const [newLineText, setNewLineText] = useState('');
  const [editingLineIndex, setEditingLineIndex] = useState(null);
  const [editingLineText, setEditingLineText] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync if globalConfig updates from outside
  useEffect(() => {
    if (globalConfig?.pricingPlans) {
      setPlans(prev => {
        const next = { ...prev };
        for (const key of Object.keys(DEFAULT_PLANS_DATA)) {
          if (globalConfig.pricingPlans[key]) {
            next[key] = {
              ...next[key],
              ...globalConfig.pricingPlans[key],
              features: Array.isArray(globalConfig.pricingPlans[key].features)
                ? [...globalConfig.pricingPlans[key].features]
                : next[key].features
            };
          }
        }
        return next;
      });
    }
  }, [globalConfig?.pricingPlans]);

  const currentPlan = plans[selectedPlanKey] || DEFAULT_PLANS_DATA[selectedPlanKey];

  const handlePlanFieldChange = (field, value) => {
    setPlans(prev => ({
      ...prev,
      [selectedPlanKey]: {
        ...prev[selectedPlanKey],
        [field]: value
      }
    }));
  };

  const handleAddFeatureLine = () => {
    if (!newLineText.trim()) {
      toast.error('অনুগ্রহ করে ফিচারের বিবরণ লিখুন');
      return;
    }
    setPlans(prev => {
      const plan = prev[selectedPlanKey];
      return {
        ...prev,
        [selectedPlanKey]: {
          ...plan,
          features: [...(plan.features || []), newLineText.trim()]
        }
      };
    });
    setNewLineText('');
    toast.success('নতুন ফিচার লাইন যোগ করা হয়েছে!');
  };

  const handleDeleteFeatureLine = (index) => {
    setPlans(prev => {
      const plan = prev[selectedPlanKey];
      const updated = plan.features.filter((_, i) => i !== index);
      return {
        ...prev,
        [selectedPlanKey]: {
          ...plan,
          features: updated
        }
      };
    });
    toast.success('ফিচার লাইন মুছে ফেলা হয়েছে');
  };

  const handleStartEditLine = (index, text) => {
    setEditingLineIndex(index);
    setEditingLineText(text);
  };

  const handleSaveEditLine = () => {
    if (editingLineIndex === null) return;
    if (!editingLineText.trim()) {
      toast.error('ফিচার লাইন ফাঁকা রাখা যাবে না');
      return;
    }
    setPlans(prev => {
      const plan = prev[selectedPlanKey];
      const updated = [...plan.features];
      updated[editingLineIndex] = editingLineText.trim();
      return {
        ...prev,
        [selectedPlanKey]: {
          ...plan,
          features: updated
        }
      };
    });
    setEditingLineIndex(null);
    setEditingLineText('');
    toast.success('ফিচার লাইন আপডেট করা হয়েছে');
  };

  const handleMoveLine = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const plan = plans[selectedPlanKey];
    if (targetIndex < 0 || targetIndex >= plan.features.length) return;

    setPlans(prev => {
      const currentFeatures = [...prev[selectedPlanKey].features];
      const temp = currentFeatures[index];
      currentFeatures[index] = currentFeatures[targetIndex];
      currentFeatures[targetIndex] = temp;
      return {
        ...prev,
        [selectedPlanKey]: {
          ...prev[selectedPlanKey],
          features: currentFeatures
        }
      };
    });
  };

  const handleResetCurrentPlan = () => {
    if (!confirm(`আপনি কি ${currentPlan.bengaliTitle} এর ডিফল্ট ফিচার ও লাইনগুলো রিস্টোর করতে চান?`)) return;
    const def = DEFAULT_PLANS_DATA[selectedPlanKey];
    setPlans(prev => ({
      ...prev,
      [selectedPlanKey]: {
        ...def,
        features: [...def.features]
      }
    }));
    toast.success(`${currentPlan.bengaliTitle} ডিফল্ট অবস্থায় রিস্টোর করা হয়েছে!`);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const toastId = toast.loading('প্রাইসিং প্যাকেজগুলো সেভ হচ্ছে...');
    try {
      // Also update standard price fields for backward compatibility
      const payload = {
        pricingPlans: plans,
        subPriceMonthly: Number(plans.monthly?.price || 500),
        subPriceQuarterly: Number(plans.quarterly?.price || 1350),
        subPriceYearly: Number(plans.yearly?.price || 5000)
      };

      await updateGlobalConfig(payload);
      toast.success('সমস্ত প্রাইসিং প্ল্যান ও ফিচার লাইন সফলভাবে সংরক্ষিত হয়েছে! 🎉', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('সংরক্ষণে ত্রুটি হয়েছে। আবার চেষ্টা করুন।', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs uppercase tracking-wider mb-2 border border-purple-400/20">
              <DollarSign size={13} />
              <span>লাইন-বাই-লাইন প্রাইসিং কন্ট্রোল</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">প্রাইসিং প্ল্যান ও ফিচার লাইনস কাস্টমাইজার</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              প্রতিটি প্রাইসিং প্ল্যানের প্রতিটি সুবিধা ও ফিচার লাইন ইচ্ছেমতো যোগ করুন, এডিট করুন, উপরে-নিচে সাজান কিংবা মুছে দিন।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-500/30 disabled:opacity-50 active:scale-95"
            >
              <Save size={14} />
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সব প্ল্যান সেভ করুন'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'starter', title: 'স্টার্টার প্ল্যান', icon: Zap, color: 'text-amber-500', activeBg: 'border-amber-500 bg-amber-50/50' },
          { key: 'monthly', title: 'মাসিক প্যাকেজ', icon: Sparkles, color: 'text-purple-500', activeBg: 'border-purple-500 bg-purple-50/50' },
          { key: 'quarterly', title: 'ত্রৈমাসিক প্যাকেজ', icon: ShieldCheck, color: 'text-teal-500', activeBg: 'border-teal-500 bg-teal-50/50' },
          { key: 'yearly', title: 'বার্ষিক প্যাকেজ', icon: Crown, color: 'text-indigo-500', activeBg: 'border-indigo-500 bg-indigo-50/50' }
        ].map(item => {
          const Icon = item.icon;
          const isSelected = selectedPlanKey === item.key;
          const planData = plans[item.key] || DEFAULT_PLANS_DATA[item.key];

          return (
            <button
              key={item.key}
              onClick={() => setSelectedPlanKey(item.key)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? `border-2 shadow-md ${item.activeBg}`
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon size={18} className={item.color} />
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {planData.features?.length || 0} টি লাইন
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900 mt-2">{item.title}</h4>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                {planData.price === 0 ? '০৳ (ফ্রি)' : `৳ ${Number(planData.price).toLocaleString()}`}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Plan Detail & Feature Lines Management */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Plan Header Settings */}
        <div className="border-b border-slate-100 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>{currentPlan.bengaliTitle} সেটিংস</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                  {selectedPlanKey.toUpperCase()}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">এই প্যাকেজের শিরোনাম, মূল্য এবং বৈশিষ্ট্যসমূহ পরিবর্তন করুন।</p>
            </div>

            <button
              onClick={handleResetCurrentPlan}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw size={13} />
              <span>ডিফল্ট লাইনে ফেরত যান</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">প্যাকেজের নাম (বাংলা)</label>
              <input
                type="text"
                value={currentPlan.bengaliTitle || ''}
                onChange={(e) => handlePlanFieldChange('bengaliTitle', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">সাবটাইটেল / স্লোগান</label>
              <input
                type="text"
                value={currentPlan.subtitle || ''}
                onChange={(e) => handlePlanFieldChange('subtitle', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">মূল্য (৳)</label>
              <input
                type="number"
                value={currentPlan.price ?? 0}
                onChange={(e) => handlePlanFieldChange('price', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">বিলিং সাইকেল টেক্সট</label>
              <input
                type="text"
                value={currentPlan.period || ''}
                onChange={(e) => handlePlanFieldChange('period', e.target.value)}
                placeholder="/ প্রতি মাস"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">হাইলাইট ব্যাজ টেক্সট</label>
              <input
                type="text"
                value={currentPlan.badge || ''}
                onChange={(e) => handlePlanFieldChange('badge', e.target.value)}
                placeholder="যেমন: ১ম মাস ফ্রি ট্রায়াল"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">কমিশন / প্রফিট টেক্সট</label>
              <input
                type="text"
                value={currentPlan.commissionText || ''}
                onChange={(e) => handlePlanFieldChange('commissionText', e.target.value)}
                placeholder="যেমন: ০% সেলস কমিশন"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Feature Lines List & Customizer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              <span>প্যাকেজ ফিচার লাইনসমূহ ({currentPlan.features?.length || 0} টি লাইন)</span>
            </h4>
            <span className="text-xs text-slate-400">তীর বাটনে ক্লিক করে লাইনের ক্রম পরিবর্তন করুন</span>
          </div>

          {/* Add New Line Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newLineText}
              onChange={(e) => setNewLineText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFeatureLine()}
              placeholder="নতুন ফিচার লাইনের বিবরণ লিখুন (যেমন: '🌐 ফ্রি কাস্টম ডোমেন কানেকশন')..."
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600"
            />
            <button
              onClick={handleAddFeatureLine}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-purple-600/20"
            >
              <Plus size={15} />
              <span>লাইন যোগ করুন</span>
            </button>
          </div>

          {/* Feature Lines Rows */}
          <div className="space-y-2">
            {(!currentPlan.features || currentPlan.features.length === 0) ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl text-slate-400 text-xs">
                কোনো ফিচার লাইন নেই। উপরের ইনপুট থেকে নতুন লাইন যোগ করুন।
              </div>
            ) : (
              currentPlan.features.map((feature, idx) => {
                const isEditing = editingLineIndex === idx;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-200 transition-all group"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingLineText}
                          onChange={(e) => setEditingLineText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditLine()}
                          autoFocus
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-purple-500 focus:outline-none bg-white"
                        />
                        <button
                          onClick={handleSaveEditLine}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          title="সংরক্ষণ"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingLineIndex(null)}
                          className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                          title="বাতিল"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 truncate">{feature}</span>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => handleMoveLine(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                          title="উপরে নিন"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveLine(idx, 'down')}
                          disabled={idx === currentPlan.features.length - 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                          title="নিচে নিন"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => handleStartEditLine(idx, feature)}
                          className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          title="সম্পাদনা"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteFeatureLine(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            সম্পাদিত লাইনগুলো সেভ করার সাথে সাথে bdretailers.com হোমপেজ ও প্রাইসিং পেজে গ্রাহকদের জন্য প্রদর্শিত হবে।
          </p>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সব প্ল্যান সেভ করুন'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
