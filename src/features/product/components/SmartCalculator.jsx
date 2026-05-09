'use client';
import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

export default function SmartCalculator({ product, setCustomInput, setAiPrice }) {
  if (!product?.smartCalc?.enabled) return null;

  const { type, baseQuantity, baseUnit, basePrice } = product.smartCalc;
  
  // States for user input
  const [pieceInput, setPieceInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [tkInput, setTkInput] = useState('');

  // The base scale value. E.g. if 1000gm = 500Tk, scale = 500/1000 = 0.5 Tk per unit
  const pricePerUnit = basePrice / baseQuantity;

  const handlePieceChange = (val) => {
    setPieceInput(val);
    if (!val) {
      setTkInput('');
      setCustomInput('');
      setAiPrice(null);
      return;
    }
    const total = (Number(val) * pricePerUnit).toFixed(2);
    setTkInput(total);
    setCustomInput(`${val} ${baseUnit} (${total}৳)`);
    setAiPrice(Number(total));
  };

  const handleWeightChange = (val) => {
    setWeightInput(val);
    if (!val) {
      setTkInput('');
      setCustomInput('');
      setAiPrice(null);
      return;
    }
    const total = (Number(val) * pricePerUnit).toFixed(2);
    setTkInput(total);
    setCustomInput(`${val} ${baseUnit} (${total}৳)`);
    setAiPrice(Number(total));
  };

  const handleTkChange = (val) => {
    setTkInput(val);
    if (!val) {
      setPieceInput('');
      setWeightInput('');
      setCustomInput('');
      setAiPrice(null);
      return;
    }
    const amount = (Number(val) / pricePerUnit).toFixed(2);
    setAiPrice(Number(val));
    if (type === 'piece') {
      setPieceInput(Math.floor(amount)); // Pieces usually integer
      setCustomInput(`${Math.floor(amount)} ${baseUnit} (${val}৳)`);
    } else {
      setWeightInput(amount);
      setCustomInput(`${amount} ${baseUnit} (${val}৳)`);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
          <Calculator size={16} />
        </div>
        <div>
          <h3 className="font-black text-slate-900 leading-tight">ডাইনামিক ক্যালকুলেটর</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{baseQuantity} {baseUnit} = ৳{basePrice}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {type === 'piece' ? (
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">{baseUnit} পরিমাণ</label>
            <input 
              type="number" 
              placeholder={`যেমন: ${baseQuantity}`}
              value={pieceInput}
              onChange={e => handlePieceChange(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-black text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all text-center"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">ওজন ({baseUnit})</label>
            <input 
              type="number" 
              placeholder={`যেমন: ${baseQuantity}`}
              value={weightInput}
              onChange={e => handleWeightChange(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-black text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all text-center"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">মোট মূল্য (৳)</label>
          <input 
            type="number" 
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
            {type === 'piece' ? pieceInput : weightInput} {baseUnit} এর দাম ৳{Number(tkInput).toFixed(0)}
          </p>
        </div>
      )}
    </div>
  );
}
