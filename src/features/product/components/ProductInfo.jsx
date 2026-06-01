'use client';
import { Tag, CheckCircle, Package, Share2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductInfo({ product, currentPrice }) {
  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    if (product.shopSlug && product.id) {
      const origin = window.location.origin;
      return `${origin}/shop/${product.shopSlug}/product/${product.id}`;
    }
    return window.location.href;
  };

  const handleShareProduct = async () => {
    const shareUrl = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `দারিপাল্লা মার্কেটপ্লেসে '${product.name}' দেখুন! 🛒`,
          url: shareUrl
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    const shareUrl = getShareUrl();
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("শেয়ারিং লিংক কপি হয়েছে! 🔗");
    }).catch(err => {
      console.error(err);
      toast.error("লিংক কপি করা যায়নি");
    });
  };

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

      {/* Premium Share Section */}
      <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
        <span className="text-xs text-slate-400 font-bold">পণ্যটি শেয়ার করুন:</span>
        <div className="flex gap-2">
          <button
            onClick={handleShareProduct}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-xl text-xs font-black text-purple-700 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Share2 size={14} /> সোশ্যাল মিডিয়া (Share)
          </button>
          <button
            onClick={handleCopyLink}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="লিংক কপি করুন"
          >
            <Copy size={14} />
          </button>
        </div>
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
