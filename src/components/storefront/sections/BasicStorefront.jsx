'use client';
import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Plus, Minus, Sparkles, Package, ShoppingCart } from 'lucide-react';
import Image from 'next/image';

const FALLBACK_COLORS = [
  'bg-gradient-to-br from-purple-500 to-indigo-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-blue-500 to-cyan-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-rose-500 to-pink-600',
];

function getFallbackColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export default function BasicStorefront({
  data = {},
  themeVars = {},
  products = [],
  isPreview = false,
  onAddToCart,
  onProductClick,
  onCategoryClick,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('newest');
  const [quantities, setQuantities] = useState({});

  const primary = themeVars?.primaryColor || '#6D28D9';
  const showDesc = data.showDesc !== false;
  const showSearch = data.showSearch !== false;
  const showCategories = data.showCategories !== false;
  const showProducts = data.showProducts !== false;

  // Extract unique categories from products
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.category && typeof p.category === 'string') {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [products]);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter(p => (p.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(p => 
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    if (sortOption === 'price_asc') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortOption === 'price_desc') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortOption === 'name_asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortOption === 'name_desc') {
      list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }

    return list;
  }, [products, selectedCategory, searchTerm, sortOption]);

  const handleQtyChange = (productId, delta, product) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next > current && onAddToCart) {
        onAddToCart(product);
      }
      return { ...prev, [productId]: next };
    });
  };

  return (
    <div className="w-full space-y-4 py-2">
      {/* ── 1. Store Description Banner Box ── */}
      {showDesc && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs"
              style={{ background: primary }}
            >
              {data.shopInitial || '🏪'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none">
                  {data.shopName || 'আমাদের স্টোরে আপনাকে স্বাগতম'}
                </h2>
                {data.slogan && (
                  <span className="text-[10px] sm:text-xs text-slate-500 font-bold border-l pl-2 border-slate-200 leading-none">
                    {data.slogan}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {data.description || 'সেরা কোয়ালিটির আসল পণ্য উপভোগ করুন ক্যাশ অন ডেলিভারি সহ। দ্রুত ও নিরাপদ শপিং অভিজ্ঞতা।'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Search & Sort Bar ── */}
      {showSearch && (
        <div className="rounded-xl shadow-xs border border-slate-200 bg-white p-1.5 flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={15} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="পণ্য খুঁজুন..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl font-bold outline-none text-sm bg-slate-50 border border-slate-200/80 text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:border-purple-300 transition-all"
            />
          </div>
          <div className="relative shrink-0">
            <ArrowUpDown size={13} className="absolute left-3 top-3.5 text-slate-400" strokeWidth={2.5} />
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="pl-8 pr-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold outline-none appearance-none cursor-pointer bg-slate-50 border border-slate-200/80 text-slate-800"
            >
              <option value="newest">সবচেয়ে নতুন</option>
              <option value="price_asc">কম মূল্য প্রথমে</option>
              <option value="price_desc">বেশি মূল্য প্রথমে</option>
              <option value="name_asc">নাম (A-Z)</option>
              <option value="name_desc">নাম (Z-A)</option>
            </select>
          </div>
        </div>
      )}

      {/* ── 3. Category Pills Strip ── */}
      {showCategories && (categories.length > 0 || isPreview) && (
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => {
              setSelectedCategory('All');
              onCategoryClick?.('All');
            }}
            className="shrink-0 whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-black transition-all border shadow-2xs cursor-pointer"
            style={selectedCategory === 'All'
              ? { background: primary, color: '#ffffff', borderColor: primary, transform: 'scale(1.03)' }
              : { background: '#ffffff', color: '#334155', borderColor: '#e2e8f0' }
            }
          >
            🏪 All
          </button>
          {(categories.length > 0 ? categories : ['আমিষ', 'কাঁচাবাজার', 'ফলমূল', 'মুদি দোকান']).map((catName, idx) => {
            const isSelected = selectedCategory === catName;
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedCategory(catName);
                  onCategoryClick?.(catName);
                }}
                className="shrink-0 whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-black transition-all border shadow-2xs cursor-pointer"
                style={isSelected
                  ? { background: primary, color: '#ffffff', borderColor: primary, transform: 'scale(1.03)' }
                  : { background: '#ffffff', color: '#334155', borderColor: '#e2e8f0' }
                }
              >
                {catName}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 4. Responsive Product Showcase Grid ── */}
      {showProducts && (
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <Package size={40} className="mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm font-black text-slate-700">কোনো পণ্য পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400 font-medium mt-1">অন্য কোনো ক্যাটাগরি বা নামে খুঁজুন</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredProducts.map((prod, idx) => {
                const img = prod.images?.[0] || prod.imageUrl;
                const qty = quantities[prod.id] || 0;

                return (
                  <div
                    key={prod.id || idx}
                    className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 group border border-slate-200 flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div
                      className="relative h-36 sm:h-44 overflow-hidden bg-slate-50 border-b border-slate-100 cursor-pointer"
                      onClick={() => onProductClick?.(prod)}
                    >
                      {img ? (
                        <Image
                          src={img}
                          alt={prod.name || 'Product'}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center p-3 text-center ${getFallbackColor(prod.name)}`}>
                          <h4 className="text-xl font-black text-white drop-shadow-md leading-tight">
                            {prod.name?.[0] || 'P'}
                          </h4>
                        </div>
                      )}
                      {prod.allowCustomize && (
                        <div className="absolute top-2 left-2 bg-purple-600/90 text-white px-2 py-0.5 rounded-lg text-[9px] font-black backdrop-blur-xs flex items-center gap-1">
                          <Sparkles size={9} /> কাস্টম
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-3 sm:p-3.5 flex flex-col flex-1">
                      <h3
                        onClick={() => onProductClick?.(prod)}
                        className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-purple-600 leading-tight transition-colors line-clamp-2 mb-2 cursor-pointer"
                      >
                        {prod.name}
                      </h3>

                      <div className="mb-3 flex items-baseline gap-1">
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          ৳{Number(prod.price || 0).toLocaleString()}
                        </span>
                        {prod.unit && (
                          <span className="text-[10px] font-bold text-slate-400">/ {prod.unit}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-auto">
                        {qty > 0 ? (
                          <div className="flex items-center justify-between gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
                            <button
                              onClick={() => handleQtyChange(prod.id, -1, prod)}
                              className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-900 hover:text-red-600 hover:bg-red-50 transition-colors shadow-2xs font-black border border-slate-200 shrink-0 cursor-pointer"
                            >
                              <Minus size={12} strokeWidth={2.5} />
                            </button>
                            <span className="font-black text-purple-700 text-xs w-full text-center select-none">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleQtyChange(prod.id, 1, prod)}
                              className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-2xs font-black shrink-0 cursor-pointer"
                            >
                              <Plus size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleQtyChange(prod.id, 1, prod)}
                            className="w-full py-2 px-2.5 rounded-xl font-black text-xs text-white transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                            style={{ background: primary }}
                          >
                            <Plus size={13} strokeWidth={2.5} />
                            <span>কার্টে যোগ করুন</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
