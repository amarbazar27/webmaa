'use client';
import Image from 'next/image';

const FALLBACK_COLORS = ['bg-indigo-600','bg-emerald-600','bg-rose-600','bg-amber-600','bg-cyan-600','bg-fuchsia-600'];
function getFallbackColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export default function ProductImage({ product, currentPrice }) {
  return (
    <div className="relative w-full h-72 rounded-3xl overflow-hidden shadow-xl bg-white border border-slate-200">
      {product.imageUrl ? (
        <Image 
          src={product.imageUrl} 
          alt={product.name} 
          fill
          priority
          className="object-cover" 
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${getFallbackColor(product.name)}`}>
          <h2 className="text-4xl font-black text-white drop-shadow-xl text-center px-4">{product.name}</h2>
        </div>
      )}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-slate-900 px-4 py-2 rounded-2xl text-lg font-black shadow-xl border border-slate-200/50">
        ৳{currentPrice}
      </div>
      {product.category && (
        <div className="absolute top-4 left-4 bg-purple-600/90 text-white px-3 py-1.5 rounded-xl text-xs font-black backdrop-blur-sm">
          {product.category}
        </div>
      )}
    </div>
  );
}
