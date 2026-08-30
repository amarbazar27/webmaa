'use client';

import { useState } from 'react';
import { Truck, MapPin, Scale, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui';

export default function DeliveryFeePricingCard({ deliveryConfig = {}, setDeliveryConfig = () => {} }) {
  const cfg = deliveryConfig || {};

  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDistricts, setNewZoneDistricts] = useState('');
  const [newZoneFee, setNewZoneFee] = useState('');

  const [newTierMaxKg, setNewTierMaxKg] = useState('');
  const [newTierFee, setNewTierFee] = useState('');

  const updateField = (key, value) => {
    setDeliveryConfig(prev => ({
      ...(prev || {}),
      [key]: value
    }));
  };

  const handleAddZone = () => {
    if (!newZoneName.trim() || !newZoneFee) return;
    const currentZones = Array.isArray(cfg.customZones) ? cfg.customZones : [];
    const newZone = {
      id: `zone_${Date.now()}`,
      name: newZoneName.trim(),
      districts: newZoneDistricts.split(',').map(d => d.trim()).filter(Boolean),
      fee: Number(newZoneFee) || 0
    };
    updateField('customZones', [...currentZones, newZone]);
    setNewZoneName('');
    setNewZoneDistricts('');
    setNewZoneFee('');
  };

  const handleRemoveZone = (id) => {
    const currentZones = Array.isArray(cfg.customZones) ? cfg.customZones : [];
    updateField('customZones', currentZones.filter(z => z.id !== id));
  };

  const handleAddWeightTier = () => {
    if (!newTierMaxKg || !newTierFee) return;
    const currentTiers = Array.isArray(cfg.weightTiers) ? cfg.weightTiers : [];
    const newTier = {
      id: `tier_${Date.now()}`,
      maxKg: Number(newTierMaxKg),
      fee: Number(newTierFee)
    };
    const updated = [...currentTiers, newTier].sort((a, b) => a.maxKg - b.maxKg);
    updateField('weightTiers', updated);
    setNewTierMaxKg('');
    setNewTierFee('');
  };

  const handleRemoveWeightTier = (id) => {
    const currentTiers = Array.isArray(cfg.weightTiers) ? cfg.weightTiers : [];
    updateField('weightTiers', currentTiers.filter(t => t.id !== id));
  };

  return (
    <Card 
      title="ডেলিভারি ও কুরিয়ার চার্জ কনফিগারেশন (Delivery & Weight Fees)" 
      subtitle="লোকেশন এবং পণ্যের ওজন অনুযায়ী স্বয়ংক্রিয় ডেলিভারি চার্জ নির্ধারণ করুন" 
      icon={Truck}
      className="border-2 border-slate-100 shadow-xl bg-white space-y-8"
    >
      {/* ── 1. Basic & COD Configuration ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <p className="text-xs font-black text-slate-900">ক্যাশ অন ডেলিভারি (Cash on Delivery / COD)</p>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">চালু থাকলে কাস্টমার পণ্য হাতে পেয়ে মূল্য পরিশোধ করতে পারবে</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={cfg.isCOD ?? true} 
              onChange={e => updateField('isCOD', e.target.checked)} 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* ── Main Default Delivery Fee ── */}
        <div className="p-4 bg-purple-50/70 border-2 border-purple-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-950">⭐ প্রধান ডিফল্ট ডেলিভারি চার্জ (Main Default Delivery Fee)</span>
            <span className="text-[10px] bg-purple-200/70 text-purple-800 font-black px-2 py-0.5 rounded-lg uppercase">Base Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-purple-700">৳</span>
            <input 
              type="number"
              placeholder="e.g. 60"
              value={cfg.advanceFee ?? ''}
              onChange={e => {
                updateField('advanceFee', e.target.value);
                if (!cfg.insideDhakaFee) updateField('insideDhakaFee', e.target.value);
              }}
              className="w-full text-base font-black text-slate-900 p-3 rounded-xl bg-white border border-purple-200 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <p className="text-[10px] text-purple-700 font-bold">এটি আপনার স্টোরের সাধারণ মূল ডেলিভারি চার্জ। নিচে এলাকা বা ওজন অনুযায়ী চাইলে আলাদা স্পেসিফিক রেটও দিতে পারেন।</p>
        </div>

        {/* Standard Location-Based Delivery Charges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-purple-700">
              <MapPin size={16} />
              <span className="text-xs font-black">ঢাকার ভেতরে (Inside Dhaka)</span>
            </div>
            <input 
              type="number"
              placeholder="e.g. 60"
              value={cfg.insideDhakaFee ?? cfg.advanceFee ?? ''}
              onChange={e => {
                updateField('insideDhakaFee', e.target.value);
                if (!cfg.advanceFee) updateField('advanceFee', e.target.value);
              }}
              className="w-full text-sm font-black text-slate-900 p-3 rounded-xl bg-white border border-purple-200 outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-[10px] text-slate-400 font-bold">ডিফল্ট রেট: ৳৬০</p>
          </div>

          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-700">
              <MapPin size={16} />
              <span className="text-xs font-black">ঢাকার বাইরে (Outside Dhaka)</span>
            </div>
            <input 
              type="number"
              placeholder="e.g. 120"
              value={cfg.outsideDhakaFee ?? '120'}
              onChange={e => updateField('outsideDhakaFee', e.target.value)}
              className="w-full text-sm font-black text-slate-900 p-3 rounded-xl bg-white border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400 font-bold">ডিফল্ট রেট: ৳১২০</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin size={16} />
              <span className="text-xs font-black">ঢাকা উপশহর (Sub-Dhaka / Gazipur)</span>
            </div>
            <input 
              type="number"
              placeholder="e.g. 100"
              value={cfg.subDhakaFee ?? '100'}
              onChange={e => updateField('subDhakaFee', e.target.value)}
              className="w-full text-sm font-black text-slate-900 p-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-slate-500"
            />
            <p className="text-[10px] text-slate-400 font-bold">ডিফল্ট রেট: ৳১০০</p>
          </div>
        </div>
      </div>

      {/* ── 2. Weight-Based Surcharges (ওজন অনুযায়ী চার্জ) ── */}
      <div className="border-t border-slate-100 pt-6 space-y-5">
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center text-purple-700">
              <Scale size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">ওজন অনুযায়ী ডেলিভারি চার্জ বৃদ্ধি করুন (Weight-Based Pricing)</p>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">ভারী পণ্যের ক্ষেত্রে কেজি অনুযায়ী স্বয়ংক্রিয় অতিরিক্ত চার্জ যুক্ত হবে</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={cfg.enableWeightPricing ?? false} 
              onChange={e => updateField('enableWeightPricing', e.target.checked)} 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {cfg.enableWeightPricing && (
          <div className="p-5 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/20 border border-purple-100 rounded-3xl space-y-5 animate-slide-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">বেস ওজন সীমা (Base Weight Included in Base Fee)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="1.0"
                    value={cfg.baseWeightKg ?? '1.0'} 
                    onChange={e => updateField('baseWeightKg', e.target.value)}
                    className="w-full text-sm font-bold text-slate-900 p-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500"
                  />
                  <span className="text-xs font-black text-slate-600 shrink-0">KG</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">যেমন: ১ম ১ কেজির জন্য কোনো অতিরিক্ত চার্জ নেই</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">প্রতি অতিরিক্ত ১ কেজির চার্জ (Extra Fee per KG)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-600 shrink-0">৳</span>
                  <input 
                    type="number" 
                    placeholder="20"
                    value={cfg.extraFeePerKg ?? '20'} 
                    onChange={e => updateField('extraFeePerKg', e.target.value)}
                    className="w-full text-sm font-bold text-slate-900 p-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500"
                  />
                  <span className="text-xs font-black text-slate-600 shrink-0">/ KG</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">যেমন: প্রতি বাড়তি ১ কেজির জন্য অতিরিক্ত ২০৳ যোগ হবে</p>
              </div>
            </div>

            {/* Custom Weight Tiers */}
            <div className="border-t border-purple-100/60 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-950">কাস্টম ওয়েট স্ল্যাব / টিয়ার (Custom Weight Tiers)</span>
                <span className="text-[10px] text-slate-400 font-bold">নির্দিষ্ট ওজনে নির্দিষ্ট চার্জ</span>
              </div>

              {/* Tiers List */}
              {Array.isArray(cfg.weightTiers) && cfg.weightTiers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {cfg.weightTiers.map((tier) => (
                    <div key={tier.id} className="p-3 bg-white border border-purple-200 rounded-xl flex items-center justify-between shadow-xs">
                      <div>
                        <p className="text-xs font-black text-slate-900">সর্বোচ্চ {tier.maxKg} KG পর্যন্ত</p>
                        <p className="text-xs font-extrabold text-purple-600 mt-0.5">৳ {tier.fee} টাকা</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveWeightTier(tier.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="টিয়ার মুছুন"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Tier */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input 
                  type="number"
                  placeholder="সর্বোচ্চ কেজি (e.g. 5)"
                  value={newTierMaxKg}
                  onChange={e => setNewTierMaxKg(e.target.value)}
                  className="w-36 text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500"
                />
                <input 
                  type="number"
                  placeholder="চার্জ ৳ (e.g. 150)"
                  value={newTierFee}
                  onChange={e => setNewTierFee(e.target.value)}
                  className="w-32 text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddWeightTier}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={14} /> টিয়ার যোগ করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Custom Location Zones (কাস্টম জেলা / সিটি জোন) ── */}
      <div className="border-t border-slate-100 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-900">কাস্টম ডেলিভারি জোন (Custom Regional Delivery Zones)</p>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">নির্দিষ্ট কোনো জেলার জন্য আলাদা ডেলিভারি রেট সেট করুন (যেমন: রংপুর = ৪০৳, চট্টগ্রাম = ১০০৳)</p>
          </div>
        </div>

        {/* Existing Custom Zones */}
        {Array.isArray(cfg.customZones) && cfg.customZones.length > 0 && (
          <div className="space-y-2">
            {cfg.customZones.map((zone) => (
              <div key={zone.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{zone.name}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-black rounded-lg">৳ {zone.fee}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold">
                    জেলাসমূহ: {Array.isArray(zone.districts) && zone.districts.length > 0 ? zone.districts.join(', ') : 'সকল জেলা'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveZone(zone.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="জোন মুছুন"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Zone Form */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <p className="text-[11px] font-black text-slate-700">নতুন ডেলিভারি জোন যুক্ত করুন:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input 
              type="text"
              placeholder="জোনের নাম (যেমন: রংপুর সিটি)"
              value={newZoneName}
              onChange={e => setNewZoneName(e.target.value)}
              className="text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500"
            />
            <input 
              type="text"
              placeholder="জেলাসমূহ (কমা দিয়ে, যেমন: রংপুর, দিনাজপুর)"
              value={newZoneDistricts}
              onChange={e => setNewZoneDistricts(e.target.value)}
              className="text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500"
            />
            <div className="flex items-center gap-2">
              <input 
                type="number"
                placeholder="চার্জ ৳ (e.g. 50)"
                value={newZoneFee}
                onChange={e => setNewZoneFee(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddZone}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
              >
                <Plus size={14} /> যোগ করুন
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
