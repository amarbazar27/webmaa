'use client';
import { Star } from 'lucide-react';
import { useRef } from 'react';
import { resolveSectionData } from '@/lib/homepageDemoData';

export default function PhotoReviews({ data }) {
  const d = resolveSectionData('photo_reviews', data);
  const scrollRef = useRef(null);
  const reviews = d?.reviews || [];
  if (!reviews.length) return null;

  return (
    <div className="px-4 py-6 md:py-10 max-w-[1400px] mx-auto">
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 tracking-tight">
        {d?.title || '⭐ Customer Reviews'}
      </h2>
      <p className="text-xs text-slate-500 font-medium mb-5">আমাদের সম্মানিত গ্রাহকদের বাস্তব অভিজ্ঞতা</p>
      
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {reviews.map((review, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-60 sm:w-72 bg-white rounded-3xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col justify-between"
          >
            {review.imageUrl && (
              <div className="relative aspect-[16/10] bg-slate-50 overflow-hidden">
                <img 
                  src={review.imageUrl} 
                  alt={review.name} 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star 
                      key={s} 
                      size={13} 
                      className={s <= (review.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} 
                    />
                  ))}
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-700 line-clamp-3 leading-relaxed">
                  "{review.text}"
                </p>
              </div>
              <p className="text-xs font-black text-slate-900 pt-2 border-t border-slate-50">{review.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
