'use client';
import { useState } from 'react';
import Image from 'next/image';

const FALLBACK_COLORS = ['bg-indigo-600','bg-emerald-600','bg-rose-600','bg-amber-600','bg-cyan-600','bg-fuchsia-600'];
function getFallbackColor(name = '') {
  let hash = 0;
  const safeName = String(name || '');
  for (let i = 0; i < safeName.length; i++) hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export default function ProductImage({ product, currentPrice }) {
  const [imgError, setImgError] = useState(false);
  const safeName = String(product?.name || 'Unknown');

  return (
    <div className="relative w-full aspect-[9/16] max-h-[600px] rounded-[2rem] overflow-hidden shadow-2xl bg-white border border-slate-200 group">
      {product?.imageUrl && !imgError ? (
        product.imageUrl.startsWith('http') ? (
          <img 
            src={product.imageUrl} 
            alt={safeName} 
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Image 
            src={product.imageUrl} 
            alt={safeName} 
            fill
            priority
            className="object-cover"
            onError={() => setImgError(true)}
          />
        )
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${getFallbackColor(safeName)}`}>
          <h2 className="text-4xl font-black text-white drop-shadow-xl text-center px-4">{safeName}</h2>
        </div>
      )}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-slate-900 px-4 py-2 rounded-2xl text-lg font-black shadow-xl border border-slate-200/50">
        ৳{currentPrice}
      </div>
      {product?.category && (
        <div className="absolute top-4 left-4 bg-purple-600/90 text-white px-3 py-1.5 rounded-xl text-xs font-black backdrop-blur-sm">
          {String(product.category)}
        </div>
      )}
    </div>
  );
}
