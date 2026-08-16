'use client';
import { Star } from 'lucide-react';
import { useRef } from 'react';

export default function PhotoReviews({ data }) {
  const scrollRef = useRef(null);
  const reviews = data?.reviews || [];
  if (!reviews.length) return null;

  return (
    <div className="px-4 py-5">
      <h2 className="text-base font-black text-slate-900 mb-1">{data?.title || '⭐ Customer Reviews'}</h2>
      <p className="text-xs text-slate-500 font-medium mb-4">আমাদের গ্রাহকরা কী বলছেন</p>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {reviews.map((review, i) => (
          <div key={i} className="flex-shrink-0 w-52 md:w-64 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {review.imageUrl && <img src={review.imageUrl} alt="Review" className="w-full h-36 object-cover" />}
            <div className="p-3">
              <div className="flex gap-0.5 mb-2">
                {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= (review.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />)}
              </div>
              <p className="text-xs font-bold text-slate-700 line-clamp-3 leading-relaxed">{review.text}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-2">{review.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
