'use client';
import { Tag, CheckCircle, Package } from 'lucide-react';

export default function ProductInfo({ product, currentPrice }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-2xl font-black text-slate-900">{product.name}</h2>
        {product.description && (
          <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">{product.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100">
          <Tag size={16} className="text-purple-600" />
          <span className="font-black text-purple-700 text-lg">৳{currentPrice}</span>
          {product.unit && <span className="text-xs text-purple-500 font-bold">/{product.unit}</span>}
        </div>
        
        <StockIndicator stock={product.stock} />
      </div>
    </div>
  );
}

function StockIndicator({ stock }) {
  if (stock > 0) {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${stock <= 5 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-100'}`}>
        <CheckCircle size={16} className={stock <= 5 ? 'text-amber-600' : 'text-emerald-600'} />
        <span className={`font-black text-sm ${stock <= 5 ? 'text-amber-700' : 'text-emerald-700'}`}>
          {stock <= 5 ? `স্টক প্রায় শেষ (${stock} পিস)` : `স্টকে আছে (${stock} পিস)`}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
      <Package size={16} className="text-red-500" />
      <span className="text-red-600 font-black text-sm">স্টক শেষ</span>
    </div>
  );
}
