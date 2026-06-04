'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, updateProduct } from '@/lib/firestore';
import { Loader2, Calculator, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SmartInventoryPage() {
  const { user, activeShopId } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (activeShopId) {
      loadProducts();
    }
  }, [activeShopId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(activeShopId);
      // Initialize smartCalc object if missing
      const initData = data.map(p => ({
        ...p,
        smartCalc: p.smartCalc || {
          enabled: false,
          type: 'piece', // 'piece' or 'weight'
          baseQuantity: 1,
          baseUnit: 'পিস',
          basePrice: p.price || 0
        }
      }));
      setProducts(initData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartCalcChange = (idx, field, value) => {
    const newProducts = [...products];
    newProducts[idx].smartCalc[field] = value;
    setProducts(newProducts);
  };

  const saveProduct = async (idx) => {
    const product = products[idx];
    setSavingId(product.id);
    try {
      await updateProduct(activeShopId, product.id, {
        smartCalc: product.smartCalc
      });
      toast.success('Saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Calculator className="text-purple-600" /> স্মার্ট ইনভেন্টরি
        </h1>
        <p className="text-slate-500 font-bold mt-1">কাস্টমারদের জন্য অটোমেটিক প্রাইস ক্যালকুলেটর সেটআপ করুন</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm font-bold">
        <AlertCircle size={20} className="shrink-0" />
        <p>এই ফিচারটি কাজ করার জন্য সেটিংস থেকে "Enable Smart Inventory" অন করতে হবে। এখানে আপনি প্রতিটা প্রোডাক্টের জন্য স্কেল (যেমন: ১ কেজি = ৫০০৳ বা ১ হালি = ৪০৳) সেট করতে পারবেন।</p>
      </div>

      <div className="space-y-4">
        {products.map((product, idx) => (
          <div key={product.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {product.imageUrl ? (
                  <img src={product.imageUrl} className="w-12 h-12 rounded-xl object-cover" alt="" />
                ) : (
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">📦</div>
                )}
                <div>
                  <h3 className="font-black text-slate-900 text-lg">{product.name}</h3>
                  <p className="text-xs text-slate-500 font-bold">Base Price: ৳{product.price}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={product.smartCalc.enabled} onChange={e => handleSmartCalcChange(idx, 'enabled', e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                <span className="ml-3 text-sm font-black text-slate-700">Enable</span>
              </label>
            </div>

            {product.smartCalc.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-slate-100 items-end">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">হিসাবের ধরন</label>
                  <select 
                    value={product.smartCalc.type} 
                    onChange={e => handleSmartCalcChange(idx, 'type', e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-500"
                  >
                    <option value="piece">পিস/সংখ্যা (Piece)</option>
                    <option value="weight">ওজন/পরিমাণ (Weight)</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">একক (Quantity)</label>
                  <input 
                    type="number" 
                    value={product.smartCalc.baseQuantity} 
                    onChange={e => handleSmartCalcChange(idx, 'baseQuantity', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">এককের নাম (Unit)</label>
                  {(() => {
                    const standardUnits = ['কেজি', 'লিটার', 'গ্রাম', 'সাইজ', 'পিস', 'হালি', 'ডজন'];
                    const currentUnit = product.smartCalc.baseUnit || '';
                    const isStandard = standardUnits.includes(currentUnit);
                    const selectValue = currentUnit === '' ? 'পিস' : (isStandard ? currentUnit : 'অন্যান্য');
                    return (
                      <div className="space-y-1.5">
                        <select
                          value={selectValue}
                          onChange={e => {
                            const val = e.target.value;
                            handleSmartCalcChange(idx, 'baseUnit', val === 'অন্যান্য' ? '' : val);
                          }}
                          className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-500"
                        >
                          <option value="কেজি">কেজি (kg)</option>
                          <option value="লিটার">লিটার (liter)</option>
                          <option value="গ্রাম">গ্রাম (gram)</option>
                          <option value="সাইজ">সাইজ (size)</option>
                          <option value="পিস">পিস (piece)</option>
                          <option value="হালি">হালি (hali)</option>
                          <option value="ডজন">ডজন (dozen)</option>
                          <option value="অন্যান্য">অন্যান্য (Custom)</option>
                        </select>
                        {selectValue === 'অন্যান্য' && (
                          <input 
                            type="text" 
                            placeholder="যেমন: গজ, প্যাকেট, বক্স"
                            value={currentUnit} 
                            onChange={e => handleSmartCalcChange(idx, 'baseUnit', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-500"
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">মূল্য (Price)</label>
                  <input 
                    type="number" 
                    value={product.smartCalc.basePrice} 
                    onChange={e => handleSmartCalcChange(idx, 'basePrice', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-500"
                  />
                </div>

                <button 
                  onClick={() => saveProduct(idx)}
                  disabled={savingId === product.id}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  {savingId === product.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save
                </button>
              </div>
            )}
          </div>
        ))}

        {products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 font-bold">কোনো প্রোডাক্ট পাওয়া যায়নি।</p>
          </div>
        )}
      </div>
    </div>
  );
}
