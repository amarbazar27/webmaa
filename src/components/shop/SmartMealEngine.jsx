'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Calculator, ShoppingCart, Check, Loader2, AlertCircle, RefreshCw, ChevronRight, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════════════════
// MesserBazar Smart Meal Engine — Rule & Resolver Based UI
// ═══════════════════════════════════════════════════════════════════════

export default function SmartMealEngine({ shop, products, onAddToCart, onClose, userOrders = [] }) {
  // Input states
  const [members, setMembers] = useState(25);
  const [budget, setBudget] = useState(1300);
  
  // Rice States
  const [selectedRiceId, setSelectedRiceId] = useState('');
  const [riceMorning, setRiceMorning] = useState(150);
  const [riceLunch, setRiceLunch] = useState(250);
  const [riceDinner, setRiceDinner] = useState(200);

  // Engine status states
  const [step, setStep] = useState(1); // 1: Inputs, 2: Suggestion
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [resolvedPlan, setResolvedPlan] = useState(null);
  const [aiNarrative, setAiNarrative] = useState('');

  // 1. Identify Available Rice variants in database
  const availableRiceVariants = useMemo(() => {
    if (!products) return [];
    
    // Keywords for specific rice types requested
    const riceConfig = [
      { key: 'miniket', names: ['miniket', 'মিনিকেট'], label: 'Miniket Rice' },
      { key: 'nazirshail', names: ['nazirshail', 'nazir', 'নাজিরশাইল', 'নাজির'], label: 'Nazirshail Rice' },
      { key: 'br28', names: ['br-28', 'br28', 'বিআর-২৮', 'বিআর ২৮'], label: 'BR-28 Rice' },
      { key: 'chinigura', names: ['chinigura', 'চিনিগুড়া', 'চিনিগুরা', 'চিনি গুড়া'], label: 'Chinigura Rice' },
    ];

    const inStock = products.filter(p => p.stock !== 0);
    const resolved = [];

    riceConfig.forEach(cfg => {
      // Find matching products
      const matchedProd = inStock.find(p => {
        const nameLower = (p.name || '').toLowerCase();
        return cfg.names.some(n => nameLower.includes(n));
      });
      if (matchedProd) {
        resolved.push({
          ...matchedProd,
          variantKey: cfg.key,
          labelName: cfg.label
        });
      }
    });

    // Fallback: If no specific matched, find anything containing "চাল" or "rice"
    if (resolved.length === 0) {
      const generalRice = inStock.filter(p => {
        const nameLower = (p.name || '').toLowerCase();
        return nameLower.includes('চাল') || nameLower.includes('rice');
      });
      generalRice.forEach((p, idx) => {
        resolved.push({
          ...p,
          variantKey: `general_${idx}`,
          labelName: p.name
        });
      });
    }

    return resolved;
  }, [products]);

  // Set default selected rice once available
  useEffect(() => {
    if (availableRiceVariants.length > 0 && !selectedRiceId) {
      setSelectedRiceId(availableRiceVariants[0].id);
    }
  }, [availableRiceVariants, selectedRiceId]);

  // 2. Helper function to find best product matching keywords
  const findProductByKeywords = (keywords, allProducts) => {
    const inStock = allProducts.filter(p => p.stock !== 0);
    // Exact/Prefix match
    let match = inStock.find(p => {
      const name = (p.name || '').toLowerCase();
      return keywords.some(k => name.includes(k.toLowerCase()));
    });
    return match || null;
  };

  // 3. Historical learning: count order frequency in last 7 orders
  const pastOrderFrequencies = useMemo(() => {
    const counts = {
      boiler: 0,
      rui: 0,
      silver: 0,
      mirka: 0,
      egg: 0,
      vegetables: {}
    };

    if (!userOrders || userOrders.length === 0) return counts;

    const recentOrders = userOrders.slice(0, 7);
    recentOrders.forEach(order => {
      const items = order.items || [];
      items.forEach(item => {
        const name = (item.name || '').toLowerCase();
        if (name.includes('বয়লার') || name.includes('boiler')) counts.boiler++;
        else if (name.includes('রুই') || name.includes('rui')) counts.rui++;
        else if (name.includes('সিলভার') || name.includes('silver')) counts.silver++;
        else if (name.includes('মিরকা') || name.includes('মৃগেল') || name.includes('mirka')) counts.mirka++;
        else if (name.includes('ডিম') || name.includes('egg')) counts.egg++;
      });
    });

    return counts;
  }, [userOrders]);

  // 4. MAIN MEAL RESOLVER ENGINE & OPTIMIZER
  const generateMealPlan = async () => {
    setError('');
    setIsGenerating(true);
    setResolvedPlan(null);
    setAiNarrative('');

    try {
      // Step A: Calculate Rice Cost
      const selectedRice = products.find(p => p.id === selectedRiceId);
      if (!selectedRice) {
        throw new Error('দয়া করে একটি চাল ভ্যারিয়েন্ট সিলেক্ট করুন।');
      }

      const totalRiceGramsPerPerson = Number(riceMorning) + Number(riceLunch) + Number(riceDinner);
      const totalRiceKg = Math.max(0.5, Math.round(((totalRiceGramsPerPerson * members) / 1000) * 2) / 2); // rounded to nearest 0.5kg
      const riceCost = Math.round(totalRiceKg * selectedRice.price);

      if (riceCost >= budget) {
        throw new Error(`চালের খরচ (৳${riceCost}) আপনার মোট বাজেটকে (৳${budget}) ছাড়িয়ে গেছে! বাজেট বাড়িয়ে দিন।`);
      }

      const remainingBudget = budget - riceCost;

      // Step B: Define Priorities & Fallbacks
      // Protein priorities with historical adjustments
      let proteinList = [
        { key: 'boiler', name: 'Boiler Chicken', keywords: ['বয়লার', 'boiler', 'মুরগি', 'মুরগী'], baseQty: 0.15, unit: 'kg' },
        { key: 'rui', name: 'Rui Fish', keywords: ['রুই', 'rui'], baseQty: 0.15, unit: 'kg' },
        { key: 'silver', name: 'Silver Carp', keywords: ['সিলভার', 'silver'], baseQty: 0.15, unit: 'kg' },
        { key: 'mirka', name: 'Mirka Fish', keywords: ['মিরকা', 'মৃগেল', 'mirka', 'mrigal'], baseQty: 0.15, unit: 'kg' },
        { key: 'egg', name: 'Egg', keywords: ['ডিম', 'egg'], baseQty: 1, unit: 'piece' }
      ];

      // Sort proteins based on frequency - less frequent first to avoid repetition!
      proteinList.sort((a, b) => {
        const freqA = pastOrderFrequencies[a.key] || 0;
        const freqB = pastOrderFrequencies[b.key] || 0;
        return freqA - freqB; // ascending frequency
      });

      // Anti-Repetition constraint checks (strictly forbid if >3 consecutive)
      const consecutiveBoiler = pastOrderFrequencies.boiler >= 3;
      if (consecutiveBoiler) {
        // move boiler chicken to the very end
        proteinList = proteinList.filter(p => p.key !== 'boiler').concat(proteinList.find(p => p.key === 'boiler'));
      }

      // Vegetable / Dal priorities
      const vegetableList = [
        { key: 'lau', name: 'Lau', keywords: ['লাউ', 'gourd'], baseQty: 0.1, unit: 'kg' },
        { key: 'dherosh', name: 'Dherosh', keywords: ['ঢেঁড়স', 'ঢেঁড়স', 'ladyfinger', 'okra'], baseQty: 0.1, unit: 'kg' },
        { key: 'kumra', name: 'Kumra', keywords: ['মিষ্টি কুমড়া', 'মিষ্টি কুমড়া', 'কুমড়া', 'কুমরা', 'pumpkin'], baseQty: 0.1, unit: 'kg' },
        { key: 'borboti', name: 'Borboti', keywords: ['বরবটি', 'yardlong', 'long bean'], baseQty: 0.1, unit: 'kg' },
        { key: 'shak_pui', name: 'Pui Shak', keywords: ['পui শাক', 'পুঁইশাক', 'পুইশাক'], baseQty: 0.1, unit: 'kg' },
        { key: 'shak_lal', name: 'Lal Shak', keywords: ['লাল শাক', 'লালশাক'], baseQty: 0.1, unit: 'kg' }
      ];

      const dalList = [
        { key: 'musur', name: 'Musur Dal', keywords: ['মুসুর ডাল', 'মসুর ডাল', 'মুসুর', 'মসুর', 'musur', 'lentil'], baseQty: 0.03, unit: 'kg' },
        { key: 'buter', name: 'Buter Dal', keywords: ['বুটের ডাল', 'বুট ডাল', 'buter', 'chana dal'], baseQty: 0.04, unit: 'kg' }
      ];

      const bhortaList = [
        { key: 'alu', name: 'Alu Bhorta', keywords: ['আলু', 'potato'], baseQty: 0.08, unit: 'kg' },
        { key: 'begun', name: 'Begun Bhorta', keywords: ['বেগুন', 'brinjal', 'eggplant'], baseQty: 0.1, unit: 'kg' },
        { key: 'kola', name: 'Kola Bhorta', keywords: ['কাঁচকলা', 'কাচকলা', 'কলা', 'banana'], baseQty: 0.1, unit: 'kg' }
      ];

      // Step C: Run matching resolver to find in-stock products
      const resolveProduct = (item) => {
        const prod = findProductByKeywords(item.keywords, products);
        if (!prod) return null;
        
        // Compute quantity
        let qty = 0;
        if (item.unit === 'piece') {
          qty = Math.max(1, Math.round(members * item.baseQty));
        } else {
          // in kg, round to nearest 0.25 kg
          qty = Math.max(0.25, Math.round(members * item.baseQty * 4) / 4);
        }

        return {
          product: prod,
          qty,
          cost: Math.round(qty * prod.price),
          meta: item
        };
      };

      // Helper to match first available
      const getFirstAvailable = (list) => {
        for (const item of list) {
          const res = resolveProduct(item);
          if (res) return res;
        }
        return null;
      };

      // Step D: Plan Meal Categories (Initial Plan)
      // Morning: Pick 1 from Bhorta / Dal / Shak
      let morningItem = getFirstAvailable([...bhortaList, ...dalList, ...vegetableList.slice(-2)]);
      
      // Lunch: 1 Protein + 1 Vegetable/Dal
      let lunchProtein = getFirstAvailable(proteinList);
      // Filter out morning item if vegetable
      const lunchVegOptions = vegetableList.filter(v => !morningItem || v.key !== morningItem.meta.key);
      let lunchVeg = getFirstAvailable([...lunchVegOptions, ...dalList]);

      // Dinner: 1 Protein/Vegetable + 1 Dal/Bhorta
      // Prefer different protein for dinner than lunch
      const dinnerProteinOptions = proteinList.filter(p => !lunchProtein || p.key !== lunchProtein.meta.key);
      let dinnerProtein = getFirstAvailable(dinnerProteinOptions) || lunchProtein; // fallback to lunch protein if only one available
      
      const dinnerExtraOptions = [...bhortaList, ...dalList, ...vegetableList].filter(
        v => (!morningItem || v.key !== morningItem.meta.key) && (!lunchVeg || v.key !== lunchVeg.meta.key)
      );
      let dinnerExtra = getFirstAvailable(dinnerExtraOptions) || getFirstAvailable(dalList);

      if (!morningItem || !lunchProtein || !lunchVeg || !dinnerProtein || !dinnerExtra) {
        throw new Error('স্টোরে পর্যাপ্ত গ্রোসারি বা আমিষ পণ্য উপলব্ধ নেই। দয়া করে স্টক চেক করুন।');
      }

      // Step E: Budget Optimization Loop
      let optimizationPass = 0;
      const maxPasses = 10;
      
      const calculateTotalCost = (m, lp, lv, dp, de) => {
        return riceCost + m.cost + lp.cost + lv.cost + dp.cost + de.cost;
      };

      while (calculateTotalCost(morningItem, lunchProtein, lunchVeg, dinnerProtein, dinnerExtra) > budget && optimizationPass < maxPasses) {
        optimizationPass++;

        // Pass 1: Try swapping dinner protein to egg if it was expensive meat/fish
        if (dinnerProtein.meta.key !== 'egg') {
          const eggItem = resolveProduct(proteinList.find(p => p.key === 'egg'));
          if (eggItem) {
            dinnerProtein = eggItem;
            continue;
          }
        }

        // Pass 2: Try swapping lunch protein to egg if it was meat/fish
        if (lunchProtein.meta.key !== 'egg') {
          const eggItem = resolveProduct(proteinList.find(p => p.key === 'egg'));
          if (eggItem) {
            lunchProtein = eggItem;
            continue;
          }
        }

        // Pass 3: Replace dinner protein with simple vegetable or dal entirely
        const vegItem = getFirstAvailable(vegetableList.filter(v => v.key !== lunchVeg.meta.key));
        if (vegItem && dinnerProtein.meta.unit === 'kg') {
          dinnerProtein = vegItem;
          continue;
        }

        // Pass 4: Reduce protein and vegetable quantities by 20% (cost optimization)
        lunchProtein.qty = Math.max(0.25, Math.round((lunchProtein.qty * 0.8) * 4) / 4);
        lunchProtein.cost = Math.round(lunchProtein.qty * lunchProtein.product.price);
        
        if (dinnerProtein) {
          dinnerProtein.qty = Math.max(0.25, Math.round((dinnerProtein.qty * 0.8) * 4) / 4);
          dinnerProtein.cost = Math.round(dinnerProtein.qty * dinnerProtein.product.price);
        }

        lunchVeg.qty = Math.max(0.25, Math.round((lunchVeg.qty * 0.8) * 4) / 4);
        lunchVeg.cost = Math.round(lunchVeg.qty * lunchVeg.product.price);

        dinnerExtra.qty = Math.max(0.25, Math.round((dinnerExtra.qty * 0.8) * 4) / 4);
        dinnerExtra.cost = Math.round(dinnerExtra.qty * dinnerExtra.product.price);
      }

      const totalCost = calculateTotalCost(morningItem, lunchProtein, lunchVeg, dinnerProtein, dinnerExtra);
      if (totalCost > budget) {
        // absolute minimal fallback
        const eggItem = resolveProduct(proteinList.find(p => p.key === 'egg'));
        const dalItem = resolveProduct(dalList.find(d => d.key === 'musur'));
        const aluItem = resolveProduct(bhortaList.find(b => b.key === 'alu'));

        if (eggItem && dalItem && aluItem) {
          morningItem = aluItem;
          lunchProtein = eggItem;
          lunchVeg = dalItem;
          dinnerProtein = eggItem;
          dinnerExtra = aluItem;
        }
      }

      const finalTotalCost = calculateTotalCost(morningItem, lunchProtein, lunchVeg, dinnerProtein, dinnerExtra);
      const finalRemaining = budget - finalTotalCost;

      if (finalTotalCost > budget) {
        throw new Error(`বাজেট অনেক কম (৳${budget})। এত কম বাজেটে ২৫ জনের ১ দিনের বাজার সম্ভব নয়। দয়া করে বাজেট অন্তত ৳${finalTotalCost + 100} করুন।`);
      }

      // Format payload for Cart
      const cartItemsPayload = [
        { product: selectedRice, qty: totalRiceKg, note: 'মেসের চাল' },
        { product: morningItem.product, qty: morningItem.qty, note: 'সকালের বাজার' },
        { product: lunchProtein.product, qty: lunchProtein.qty, note: 'দুপুরের আমিষ' },
        { product: lunchVeg.product, qty: lunchVeg.qty, note: 'দুপুরের সবজি/ডাল' },
        { product: dinnerProtein.product, qty: dinnerProtein.qty, note: 'রাতের আমিষ/সবজি' },
        { product: dinnerExtra.product, qty: dinnerExtra.qty, note: 'রাতের ডাল/ভর্তা' }
      ];

      // Merge duplicates in case same item resolved multiple times (e.g. Alu in morning and night, or eggs)
      const mergedCartItems = [];
      cartItemsPayload.forEach(item => {
        const existing = mergedCartItems.find(ex => ex.product.id === item.product.id);
        if (existing) {
          existing.qty += item.qty;
          existing.note = `${existing.note} + ${item.note}`;
        } else {
          mergedCartItems.push({ ...item });
        }
      });

      const planSummary = {
        rice: {
          product: selectedRice,
          qty: totalRiceKg,
          cost: riceCost
        },
        morning: {
          items: [morningItem]
        },
        lunch: {
          items: [lunchProtein, lunchVeg]
        },
        dinner: {
          items: [dinnerProtein, dinnerExtra]
        },
        cartItems: mergedCartItems,
        totalCost: finalTotalCost,
        remainingBudget: finalRemaining
      };

      setResolvedPlan(planSummary);
      setStep(2);

      // Now call AI in the background to render a premium greeting narrative in Bengali
      try {
        const aiPromptText = `আমাদের মেসের সদস্য সংখ্যা ${members} জন। বাজারের মোট বাজেট ${budget} টাকা।
নিয়মমাফিক আমরা একটি ১ দিনের অপ্টিমাইজড বাজার তালিকা তৈরি করেছি:
১. চাল: ${selectedRice.name} - ${totalRiceKg} কেজি (খরচ: ৳${riceCost})
২. সকালের খাবার: ${morningItem.product.name} (পরিমাণ: ${morningItem.qty} ${morningItem.product.unit || 'কেজি'}, খরচ: ৳${morningItem.cost})
৩. দুপুরের খাবার: ${lunchProtein.product.name} (${lunchProtein.qty} ${lunchProtein.product.unit || 'কেজি'}) ও ${lunchVeg.product.name} (${lunchVeg.qty} ${lunchVeg.product.unit || 'কেজি'}) (মোট খরচ: ৳${lunchProtein.cost + lunchVeg.cost})
৪. রাতের খাবার: ${dinnerProtein.product.name} (${dinnerProtein.qty} ${dinnerProtein.product.unit || 'কেজি'}) ও ${dinnerExtra.product.name} (${dinnerExtra.qty} ${dinnerExtra.product.unit || 'কেজি'}) (মোট খরচ: ৳${dinnerProtein.cost + dinnerExtra.cost})

মোট খরচ হয়েছে: ৳${finalTotalCost} টাকা।
বাকি বাজেট: ৳${finalRemaining} টাকা।

এই মেনুটি কেন সেরা এবং কিভাবে আমরা পুষ্টি ও বাজেটের সামঞ্জস্য রেখেছি তা নিয়ে অত্যন্ত চমৎকার ও সংক্ষিপ্ত ৩-৪ লাইনের একটি বাংলা উপস্থাপন তৈরি করো। কোনো গাণিতিক সংখ্যা পরিবর্তন করবে না।`;

        const resp = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopId: shop.id,
            botTone: 'friendly',
            messages: [
              { role: 'user', content: aiPromptText }
            ]
          })
        });

        const data = await resp.json();
        if (data.choices?.[0]?.message?.content) {
          setAiNarrative(data.choices[0].message.content);
        } else {
          setAiNarrative('মেসের পুষ্টি ও বাজেটের সঠিক ব্যালেন্স রেখে আজকের দিনের সেরা বাজার মেনুটি তৈরি করা হয়েছে। সবগুলো আইটেম এখন এক ক্লিকেই কার্টে যোগ করতে পারেন!');
        }
      } catch (aiErr) {
        setAiNarrative('মেসের পুষ্টি ও বাজেটের সঠিক ব্যালেন্স রেখে আজকের দিনের সেরা বাজার মেনুটি তৈরি করা হয়েছে। সবগুলো আইটেম এখন এক ক্লিকেই কার্টে যোগ করতে পারেন!');
      }

    } catch (err) {
      setError(err.message || 'বাজার পরিকল্পনা তৈরি করতে সমস্যা হয়েছে।');
      toast.error(err.message || 'পরিকল্পনা ব্যর্থ হয়েছে');
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. Add resolved items to cart
  const handleAddAllToCart = () => {
    if (!resolvedPlan || !resolvedPlan.cartItems) return;

    resolvedPlan.cartItems.forEach(item => {
      onAddToCart(item.product, item.qty, '', item.note);
    });

    toast.success('পরিকল্পনার সব পণ্য সফলভাবে কার্টে যোগ হয়েছে! 🎉');
    if (onClose) onClose();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Wizard Input Screen */}
      {step === 1 && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <h4 className="font-black text-sm uppercase tracking-wider text-purple-200">MesserBazar Meal Engine</h4>
            <h3 className="font-black text-base mt-1">স্মার্ট মেস বাজার প্ল্যানার</h3>
            <p className="text-xs mt-1 text-purple-100 font-medium">রিয়েল-টাইম প্রোডাক্টের দাম ও স্টক দেখে মেসের বাজেট মেইনটেইন করার জন্য এটি তৈরি করা হয়েছে।</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs font-bold flex items-start gap-2 animate-pulse">
              <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Members and Budget inputs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">সদস্য সংখ্যা</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    className="w-full pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all"
                    value={members}
                    onChange={e => setMembers(Math.max(1, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">মোট বাজেট (৳)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all"
                  value={budget}
                  onChange={e => setBudget(Math.max(1, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>

            {/* Rice Selector from Shop Database */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">চাল নির্বাচন করুন (শুধু Available)</label>
              {availableRiceVariants.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableRiceVariants.map(rice => (
                    <button
                      key={rice.id}
                      type="button"
                      onClick={() => setSelectedRiceId(rice.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        selectedRiceId === rice.id
                          ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-800 truncate w-full">{rice.name}</span>
                      <span className="text-[10px] font-black text-purple-600 mt-1">৳{rice.price}/কেজি</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-bold text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  ⚠️ স্টোরে কোনো চাল পাওয়া যায়নি! ড্যাশবোর্ড থেকে চাল ক্যাটাগরির প্রোডাক্ট ইন-স্টক করুন।
                </div>
              )}
            </div>
          </div>

          {/* Rice gram per meal inputs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="font-black text-xs text-slate-800">প্রতি ব্যক্তি চালের পরিমাণ (গ্রামে)</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">সকাল</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-center text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all"
                    value={riceMorning}
                    onChange={e => setRiceMorning(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <span className="absolute right-1.5 bottom-1 text-[8px] font-bold text-slate-400">g</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">দুপুর</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-center text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all"
                    value={riceLunch}
                    onChange={e => setRiceLunch(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <span className="absolute right-1.5 bottom-1 text-[8px] font-bold text-slate-400">g</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">রাত</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-center text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all"
                    value={riceDinner}
                    onChange={e => setRiceDinner(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <span className="absolute right-1.5 bottom-1 text-[8px] font-bold text-slate-400">g</span>
                </div>
              </div>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-500 text-center bg-slate-50 py-1.5 rounded-lg border border-slate-100">
              মোট দৈনন্দিন চাল: <span className="text-purple-600 font-black">{(Number(riceMorning) + Number(riceLunch) + Number(riceDinner))} গ্রাম</span> প্রতি ব্যক্তি।
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={generateMealPlan}
            disabled={isGenerating || availableRiceVariants.length === 0}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-base rounded-2xl shadow-lg shadow-purple-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:transform-none cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                মিল এনালাইজ হচ্ছে...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                বাজার সাজেস্ট করুন
              </>
            )}
          </button>
        </div>
      )}

      {/* Suggestion & Output Screen */}
      {step === 2 && resolvedPlan && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header Dashboard card */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg border-b-4 border-emerald-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                  <Sparkles className="text-emerald-400 animate-spin" size={18} style={{animationDuration:'3s'}} />
                  আজকের বাজার ({members} জন)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">MesserBazar smart output</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="বাজেট পরিবর্তন করুন"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400">মোট বাজেট</span>
                <span className="text-sm font-black text-white">৳{budget}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400">মোট খরচ</span>
                <span className="text-sm font-black text-emerald-400">৳{resolvedPlan.totalCost}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400">বাকি বাজেট</span>
                <span className="text-sm font-black text-purple-300">৳{resolvedPlan.remainingBudget}</span>
              </div>
            </div>
          </div>

          {/* AI Narrative Section */}
          {aiNarrative ? (
            <div className="bg-purple-50/70 border border-purple-100 p-4 rounded-2xl shadow-sm text-xs font-bold leading-relaxed text-slate-700 flex gap-2.5 items-start">
              <MessageSquare size={16} className="text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[9px] text-purple-600 font-black uppercase tracking-wider mb-1">AI Assistant:</span>
                <p className="font-bold">{aiNarrative}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 animate-pulse flex gap-2.5 items-center">
              <Loader2 className="animate-spin text-purple-600 shrink-0" size={16} />
              <div className="space-y-1.5 flex-1">
                <div className="h-2 bg-slate-300 rounded w-1/4" />
                <div className="h-2 bg-slate-300 rounded w-full" />
              </div>
            </div>
          )}

          {/* Structured Output Menu */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            
            {/* Rice row */}
            <div className="border-b border-slate-100 pb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">🍚 চাল নির্বাচন</span>
                <span className="text-xs font-black text-amber-600">৳{resolvedPlan.rice.cost}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>{resolvedPlan.rice.product.name}</span>
                <span>{resolvedPlan.rice.qty} কেজি</span>
              </div>
            </div>

            {/* Breakfast row */}
            <div className="border-b border-slate-100 pb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">☀️ সকাল</span>
                <span className="text-xs font-black text-blue-600">৳{resolvedPlan.morning.items.reduce((s,i) => s + i.cost, 0)}</span>
              </div>
              {resolvedPlan.morning.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{item.product.name}</span>
                  <span>{item.qty} {item.product.unit || 'কেজি'}</span>
                </div>
              ))}
            </div>

            {/* Lunch row */}
            <div className="border-b border-slate-100 pb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">🍱 দুপুর</span>
                <span className="text-xs font-black text-emerald-600">৳{resolvedPlan.lunch.items.reduce((s,i) => s + i.cost, 0)}</span>
              </div>
              {resolvedPlan.lunch.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold text-slate-800 mb-1 last:mb-0">
                  <span>{item.product.name}</span>
                  <span>{item.qty} {item.product.unit || 'কেজি'}</span>
                </div>
              ))}
            </div>

            {/* Dinner row */}
            <div className="pb-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">🌙 রাত</span>
                <span className="text-xs font-black text-indigo-600">৳{resolvedPlan.dinner.items.reduce((s,i) => s + i.cost, 0)}</span>
              </div>
              {resolvedPlan.dinner.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold text-slate-800 mb-1 last:mb-0">
                  <span>{item.product.name}</span>
                  <span>{item.qty} {item.product.unit || 'কেজি'}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              পিছনে যান
            </button>
            <button
              onClick={handleAddAllToCart}
              className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingCart size={18} /> সব কার্টে যোগ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
