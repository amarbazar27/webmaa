'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, updateProduct } from '@/lib/firestore';
import { Loader2, Calculator, Save, AlertCircle, Search, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';

// Common Phonetic Transliteration Dictionary for English-to-Bengali searches
const COMMON_PHONETIC_DICT = {
  'alu': 'আলু',
  'potol': 'পটল',
  'peyaj': 'পেঁয়াজ',
  'peyaz': 'পেঁয়াজ',
  'piyaj': 'পেঁয়াজ',
  'piyaz': 'পেঁয়াজ',
  'ada': 'আদা',
  'roshun': 'রসুন',
  'rosun': 'রসুন',
  'gajor': 'গাজর',
  'gajur': 'গাজর',
  'chal': 'চাল',
  'dal': 'ডাল',
  'tel': 'তেল',
  'dim': 'ডিম',
  'dudh': 'দুধ',
  'murgi': 'মুরগি',
  'goru': 'গরু',
  'khashi': 'খাসি',
  'khasi': 'খাসি',
  'mach': 'মাছ',
  'lobon': 'লবণ',
  'nobon': 'লবণ',
  'masala': 'মসলা',
  'moshla': 'মসলা',
  'morich': 'মরিচ',
  'mors': 'মরিচ',
  'holud': 'হলুদ',
  'jira': 'জিরা',
  'lebu': 'লেবু',
  'kola': 'কলা',
  'am': 'আম',
  'kathal': 'কাঁঠাল',
  'pepe': 'পেঁপে',
  'tomato': 'টমেটো',
  'ghee': 'ঘি',
  'modhu': 'মধু',
  'chini': 'চিনি',
  'sobji': 'সবজি',
  'shobji': 'সবজি',
  'torkari': 'তরকারি',
  'gos': 'মাংস',
  'mangsho': 'মাংস',
  'pani': 'পানি',
  'jol': 'জল',
  'cha': 'চা',
  'coffee': 'কফি',
  'kopi': 'কপি',
  'cabbage': 'বাঁধাকপি',
  'bandhakopi': 'বাঁধাকপি',
  'fulkopi': 'ফুলকপি',
  'cauliflower': 'ফুলকপি',
  'lau': 'লাউ',
  'kumra': 'কুমড়া',
  'kumro': 'কুমড়া',
  'begun': 'বেগুন',
  'khero': 'ক্ষীরা',
  'shosa': 'শসা',
  'sosa': 'শসা',
  'krola': 'করলা',
  'korola': 'করলা',
  'bhendi': 'ঢেঁড়স',
  'dherosh': 'ঢেঁড়স',
  'dheros': 'ঢেঁড়স'
};

function normalizePhonetic(text) {
  if (!text) return '';
  let t = text.toLowerCase().trim();
  
  const banglaToEnglishMap = {
    'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'r',
    'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'g',
    'চ': 'ch', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'r', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
    'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'r', 'ে': 'e',
    'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', '্য': 'y', '্র': 'r', 'র্': 'r', '্ব': 'b'
  };
  
  let mappedStr = '';
  for (let i = 0; i < t.length; i++) {
    const char = t[i];
    mappedStr += banglaToEnglishMap[char] || char;
  }
  
  mappedStr = mappedStr
    .replace(/sh/g, 's')
    .replace(/ph/g, 'f')
    .replace(/kh/g, 'k')
    .replace(/bh/g, 'b')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/ch/g, 'c')
    .replace(/gh/g, 'g')
    .replace(/z/g, 'j')
    .replace(/c/g, 'k');
    
  let vowelLess = '';
  for (let i = 0; i < mappedStr.length; i++) {
    const char = mappedStr[i];
    if (!['a', 'e', 'i', 'o', 'u', 'y', 'w', 'h'].includes(char)) {
      vowelLess += char;
    }
  }
  return vowelLess;
}

const matchPhoneticSearch = (product, queryText) => {
  if (!queryText) return true;
  const q = queryText.toLowerCase().trim();
  
  const prodName = (product.name || '').toLowerCase().trim();
  const prodCategory = (product.category || '').toLowerCase().trim();
  
  if (prodName.includes(q) || prodCategory.includes(q)) {
    return true;
  }
  
  // Check phonetic dict matches
  for (const [eng, bng] of Object.entries(COMMON_PHONETIC_DICT)) {
    if (q.includes(eng) && prodName.includes(bng)) {
      return true;
    }
  }
  
  // Vowel-insensitive character transliteration
  const qNorm = normalizePhonetic(q);
  if (qNorm.length >= 2) {
    const nameNorm = normalizePhonetic(prodName);
    const catNorm = normalizePhonetic(prodCategory);
    if (nameNorm.includes(qNorm) || catNorm.includes(qNorm)) {
      return true;
    }
  }
  
  return false;
};

export default function SmartInventoryPage() {
  const { user, activeShopId } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (activeShopId) {
      loadProducts();
    }
  }, [activeShopId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(activeShopId);
      // Initialize smartCalc and showInCommonOrder if missing
      const initData = data.map(p => ({
        ...p,
        showInCommonOrder: p.showInCommonOrder || false,
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

  const handleSmartCalcChange = (productId, field, value) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          smartCalc: {
            ...p.smartCalc,
            [field]: value
          }
        };
      }
      return p;
    }));
  };

  const handleCommonOrderToggle = (productId, value) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          showInCommonOrder: value
        };
      }
      return p;
    }));
  };

  const saveProduct = async (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setSavingId(productId);
    try {
      await updateProduct(activeShopId, productId, {
        smartCalc: product.smartCalc,
        showInCommonOrder: product.showInCommonOrder || false
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

  // Extract unique categories
  const uniqueCategories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filter products
  let filteredProducts = products.filter(p => {
    const matchesSearch = !searchTerm || matchPhoneticSearch(p, searchTerm);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort products
  filteredProducts = filteredProducts.sort((a, b) => {
    if (sortOption === 'price_asc') return parseFloat(a.price || 0) - parseFloat(b.price || 0);
    if (sortOption === 'price_desc') return parseFloat(b.price || 0) - parseFloat(a.price || 0);
    if (sortOption === 'calc_enabled') return (b.smartCalc?.enabled ? 1 : 0) - (a.smartCalc?.enabled ? 1 : 0);
    if (sortOption === 'common_order') return (b.showInCommonOrder ? 1 : 0) - (a.showInCommonOrder ? 1 : 0);
    if (sortOption === 'name_desc') return b.name.localeCompare(a.name, 'bn');
    // Default: name_asc
    return a.name.localeCompare(b.name, 'bn');
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Calculator className="text-purple-600" /> স্মার্ট ইনভেন্টরি
        </h1>
        <p className="text-slate-500 font-bold mt-1">কাস্টমারদের জন্য অটোমেটিক প্রাইস ক্যালকুলেটর ও কমন অর্ডার সেটআপ করুন</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm font-bold">
        <AlertCircle size={20} className="shrink-0" />
        <p>এই ফিচারটি কাজ করার জন্য সেটিংস থেকে "Enable Smart Inventory" অন করতে হবে। এখানে আপনি প্রতিটা প্রোডাক্টের জন্য স্কেল (যেমন: ১ কেজি = ৫০০৳) সেট করতে পারবেন এবং কমন অর্ডারে দেখাবেন কিনা তা ঠিক করতে পারবেন।</p>
      </div>

      {/* Search and Sort Controls */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <span className="absolute left-3.5 top-3.5 text-slate-400">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="প্রোডাক্ট খুঁজুন (English letter/Bangla both work)..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-750 outline-none focus:border-purple-500 transition-colors"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-slate-400 text-xs font-black uppercase tracking-wider shrink-0">ক্যাটাগরি:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full md:w-40 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:border-purple-500 cursor-pointer"
            >
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'সব ক্যাটাগরি' : cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-slate-400 text-xs font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
            <ArrowUpDown size={14} /> সর্ট করুন:
          </span>
          <select 
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="w-full md:w-48 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:border-purple-500"
          >
            <option value="name_asc">নাম (A → Z)</option>
            <option value="name_desc">নাম (Z → A)</option>
            <option value="price_asc">মূল্য (নিম্ন → উচ্চ)</option>
            <option value="price_desc">মূল্য (উচ্চ → নিম্ন)</option>
            <option value="calc_enabled">ক্যালকুলেটর চালু</option>
            <option value="common_order">কমন অর্ডার শিট চালু</option>
          </select>
        </div>
      </div>
    </div>

      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {product.imageUrl ? (
                  <img src={product.imageUrl} className="w-12 h-12 rounded-xl object-cover border border-slate-150" alt="" />
                ) : (
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-lg">📦</div>
                )}
                <div>
                  <h3 className="font-black text-slate-900 text-base">{product.name}</h3>
                  <div className="flex gap-2 items-center mt-0.5">
                    <p className="text-xs text-slate-500 font-bold">Base Price: ৳{product.price}</p>
                    {product.category && (
                      <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        {product.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {/* Calculator Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={product.smartCalc.enabled} 
                    onChange={e => handleSmartCalcChange(product.id, 'enabled', e.target.checked)} 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  <span className="ml-2 text-xs font-black text-slate-700">Calculator</span>
                </label>

                {/* Common Order Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={product.showInCommonOrder || false} 
                    onChange={e => handleCommonOrderToggle(product.id, e.target.checked)} 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-2 text-xs font-black text-slate-700">Common Order</span>
                </label>

                {/* Save Button always in header */}
                <button 
                  onClick={() => saveProduct(product.id)}
                  disabled={savingId === product.id}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-black transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {savingId === product.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save
                </button>
              </div>
            </div>

            {product.smartCalc.enabled ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">হিসাবের ধরন (Type)</label>
                  <select 
                    value={product.smartCalc.type} 
                    onChange={e => handleSmartCalcChange(product.id, 'type', e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-500 text-sm"
                  >
                    <option value="piece">পিস/সংখ্যা (Piece)</option>
                    <option value="weight">ওজন/পরিমাণ (Weight)</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">একক (Quantity)</label>
                  <input 
                    type="number" 
                    value={product.smartCalc.baseQuantity} 
                    onChange={e => handleSmartCalcChange(product.id, 'baseQuantity', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">এককের নাম (Unit)</label>
                  {(() => {
                    const standardUnits = ['কেজি', 'লিটার', 'গ্রাম', 'সাইজ', 'পিস', 'হালি', 'ডজন'];
                    const currentUnit = product.smartCalc.baseUnit || '';
                    const isStandard = standardUnits.includes(currentUnit);
                    const selectValue = currentUnit === '' ? 'পিস' : (isStandard ? currentUnit : 'অন্যান্য');
                    return (
                      <div className="space-y-1.5 mt-1">
                        <select
                          value={selectValue}
                          onChange={e => {
                            const val = e.target.value;
                            handleSmartCalcChange(product.id, 'baseUnit', val === 'অন্যান্য' ? '' : val);
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-500 text-sm"
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
                            onChange={e => handleSmartCalcChange(product.id, 'baseUnit', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-500 text-sm"
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মূল্য (Price)</label>
                  <input 
                    type="number" 
                    value={product.smartCalc.basePrice} 
                    onChange={e => handleSmartCalcChange(product.id, 'basePrice', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-500 text-sm"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-bold italic">Automatic Calculator settings are disabled for this product.</p>
            )}
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 font-bold">কোনো প্রোডাক্ট পাওয়া যায়নি।</p>
          </div>
        )}
      </div>
    </div>
  );
}
