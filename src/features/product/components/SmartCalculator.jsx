'use client';
import { useState } from 'react';
import { Calculator } from 'lucide-react';

export function detectProductUnit(product) {
  if (!product) return 'কেজি';
  if (product.unit && product.unit.trim()) {
    return product.unit.trim();
  }
  if (product.baseUnit && product.baseUnit.trim()) {
    return product.baseUnit.trim();
  }
  
  const text = `${product.name || ''} ${product.description || ''}`.toLowerCase();
  
  if (text.includes('কেজি') || text.includes('কে.জি') || text.includes('kg') || text.includes('kilogram') || text.includes('কিলোগ্রাম')) {
    return 'কেজি';
  }
  if (text.includes('লিটার') || text.includes('লিতার') || text.includes('liter') || text.includes('litre') || text.includes('ltr')) {
    return 'লিটার';
  }
  if (text.includes('গ্রাম') || text.includes('gram') || text.includes('gm') || /\b(g)\b/.test(text)) {
    return 'গ্রাম';
  }
  if (text.includes('পিস') || text.includes('piece') || text.includes('pc') || text.includes('pcs') || text.includes('টি ') || text.includes('টা ')) {
    return 'পিস';
  }
  if (text.includes('মিটার') || text.includes('meter') || text.includes('mtr') || text.includes('গজ') || text.includes('yard')) {
    return 'মিটার';
  }
  if (text.includes('প্যাকেট') || text.includes('packet') || text.includes('pkt') || text.includes('বক্স') || text.includes('box')) {
    return 'প্যাকেট';
  }
  
  return 'কেজি'; // Fallback
}

export default function SmartCalculator({ product, setCustomInput, setAiPrice }) {
  if (!product) return null;

  // Use product-level calculator configuration if enabled
  const isCustomCalc = product.smartCalc?.enabled === true;
  const basePrice = isCustomCalc && product.smartCalc?.basePrice !== undefined 
    ? Number(product.smartCalc.basePrice) 
    : (Number(product.price) || 0);

  const baseUnit = isCustomCalc && product.smartCalc?.baseUnit 
    ? product.smartCalc.baseUnit.trim() 
    : detectProductUnit(product);

  const rawBaseQuantity = isCustomCalc && product.smartCalc?.baseQuantity !== undefined 
    ? Number(product.smartCalc.baseQuantity) 
    : (product.baseQuantity || 1);
  const baseQuantity = Number.isNaN(rawBaseQuantity) || rawBaseQuantity <= 0 ? 1 : rawBaseQuantity;
  
  if (basePrice <= 0) return null;

  // States for user input
  const [quantityInput, setQuantityInput] = useState('');
  const [tkInput, setTkInput] = useState('');

  const pricePerUnit = basePrice / baseQuantity;

  const handleQuantityChange = (val) => {
    setQuantityInput(val);
    if (!val || Number(val) <= 0) {
      setTkInput('');
      setCustomInput('');
      setAiPrice(null);
      return;
    }
    const total = (Number(val) * pricePerUnit).toFixed(0);
    setTkInput(total);
    setCustomInput(`${val} ${baseUnit} (${total}৳)`);
    setAiPrice(Number(total));
  };

  const handleTkChange = (val) => {
    setTkInput(val);
    if (!val || Number(val) <= 0) {
      setQuantityInput('');
      setCustomInput('');
      setAiPrice(null);
      return;
    }
    const amount = (Number(val) / pricePerUnit);
    const displayAmount = amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
    setQuantityInput(displayAmount);
    setAiPrice(Number(val));
    setCustomInput(`${displayAmount} ${baseUnit} (${val}৳)`);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
          <Calculator size={16} />
        </div>
        <div>
          <h3 className="font-black text-slate-900 leading-tight">স্মার্ট ক্যালকুলেটর</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{baseQuantity} {baseUnit} = ৳{basePrice}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">যতটুকু ({baseUnit})</label>
          <input 
            type="number" 
            inputMode="decimal"
            placeholder={`যেমন: ${baseQuantity}`}
            value={quantityInput}
            onChange={e => handleQuantityChange(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-black text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all text-center"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">যত টাকার (৳)</label>
          <input 
            type="number" 
            inputMode="decimal"
            placeholder={`যেমন: ${basePrice}`}
            value={tkInput}
            onChange={e => handleTkChange(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-black text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all text-center"
          />
        </div>
      </div>

      {tkInput && Number(tkInput) > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center animate-fade-in">
          <p className="text-sm font-black text-emerald-800">
            {quantityInput} {baseUnit} = ৳{Number(tkInput).toFixed(0)}
          </p>
        </div>
      )}
    </div>
  );
}
