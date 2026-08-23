'use client';
import { useState } from 'react';
import { ShoppingCart, Check, Tag } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function PriceLadder({ data, themeVars, onAddToCart }) {
  const d = resolveSectionData('price_ladder', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const tiers = d.tiers || [];
  const [selectedTier, setSelectedTier] = useState(tiers[1] || tiers[0]);

  const basePrice = d.basePrice || 380;
  const currentQty = selectedTier?.qty || 1;
  const unitPrice = selectedTier?.pricePerUnit || basePrice;
  const totalPrice = unitPrice * currentQty;
  const regularTotal = basePrice * currentQty;
  const savings = regularTotal - totalPrice;

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart({
        id: 'bulk-tier-item',
        name: `${d.productName} (${selectedTier.label})`,
        price: totalPrice,
        quantity: currentQty,
        imageUrl: d.imageUrl,
      });
    }
  };

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-100 shadow-md">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 mb-2">
            <Tag size={13} />
            পাইকারি ও বাল্ক সেভিংস
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {d.title || 'Bulk Deal Savings'}
          </h2>
          {d.subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium">{d.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-4xl mx-auto">
          {/* Product image */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
              {d.imageUrl && (
                <img
                  src={d.imageUrl}
                  alt={d.productName || 'Bulk Product'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
          </div>

          {/* Tier Cards Selector */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {d.productName}
            </h3>

            <div className="space-y-2.5">
              {tiers.map((tier, idx) => {
                const isSelected = selectedTier?.qty === tier.qty;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedTier(tier)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/60 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    style={{ borderColor: isSelected ? primary : undefined }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isSelected ? 'text-white' : 'border-slate-300'
                        }`}
                        style={isSelected ? { background: primary, borderColor: primary } : {}}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{tier.label}</span>
                          {tier.badge && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-700">
                              {tier.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-bold">
                          ৳{tier.pricePerUnit} প্রতি বোতল / পিস
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-black" style={{ color: primary }}>
                        ৳{Number(tier.pricePerUnit * tier.qty).toLocaleString()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Total summary & Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-400">মোট মূল্য:</span>
                  <span className="text-xl font-black text-slate-900">৳{totalPrice.toLocaleString()}</span>
                </div>
                {savings > 0 && (
                  <p className="text-xs font-black text-emerald-600">
                    🎉 আপনি সাশ্রয় করছেন ৳{savings.toLocaleString()}!
                  </p>
                )}
              </div>

              <button
                onClick={handleAdd}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{ background: primary }}
              >
                <ShoppingCart size={15} />
                অর্ডার করুন ({currentQty} টি)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
