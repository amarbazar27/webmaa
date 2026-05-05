'use client';
import { useState, useEffect } from 'react';
import { Star, Send, Loader2, Pin, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/auth';
import toast from 'react-hot-toast';

/**
 * ReviewSection — Storefront review display + submission
 * Props: shopId (string), isRetailer (bool) — retailer sees pin/delete controls
 */
export default function ReviewSection({ shopId, isRetailer = false }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/review?shopId=${shopId}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { if (shopId) fetchReviews(); }, [shopId]);

  const handleSubmit = async () => {
    if (!user) { toast.error('রিভিউ দিতে লগইন করুন'); return; }
    if (rating === 0) { toast.error('রেটিং দিন (১-৫ স্টার)'); return; }
    setSubmitting(true);

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shopId, rating, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('রিভিউ সফলভাবে জমা হয়েছে! ✨');
      setRating(0); setText(''); setShowForm(false);
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'রিভিউ জমা দিতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (reviewId, action) => {
    if (!user) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shopId, reviewId, action }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(action === 'delete' ? 'রিভিউ মুছে ফেলা হয়েছে' : 'রিভিউ আপডেট হয়েছে');
      fetchReviews();
    } catch { toast.error('অ্যাকশন ব্যর্থ হয়েছে'); }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  if (loading) return <div className="py-8 text-center"><Loader2 size={20} className="animate-spin mx-auto text-slate-300" /></div>;

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Star size={20} className="text-amber-500 fill-amber-500" /> রিভিউ
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-3xl font-black text-slate-900">{avgRating}</span>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={14} className={i <= Math.round(avgRating) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'} />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-400">({reviews.length} রিভিউ)</span>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
          >
            রিভিউ লিখুন
          </button>
        )}
      </div>

      {/* Submit Form */}
      {showForm && (
        <div className="bg-white border-2 border-purple-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-1">
            <span className="text-xs font-black text-slate-500 mr-2">রেটিং:</span>
            {[1,2,3,4,5].map(i => (
              <button
                key={i}
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i)}
                className="p-0.5 transition-transform hover:scale-125"
              >
                <Star size={28} className={i <= (hoverRating || rating) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'} />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full text-sm font-bold text-slate-900 p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-purple-500 focus:bg-white transition-colors placeholder:text-slate-300 resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setRating(0); setText(''); }}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-colors"
            >
              বাতিল
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submitting ? 'জমা হচ্ছে...' : 'জমা দিন'}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Star size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 text-xs font-bold">এখনো কোনো রিভিউ নেই</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className={`bg-white border rounded-2xl p-5 shadow-sm ${review.pinned ? 'border-amber-200 bg-amber-50/30 ring-1 ring-amber-100' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-purple-600 border border-slate-200">
                    {review.name?.[0] || 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-900">{review.name}</p>
                      {review.pinned && <Pin size={12} className="text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={10} className={i <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'} />
                        ))}
                      </div>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle size={8} /> {review.orderCount} অর্ডার
                      </span>
                    </div>
                  </div>
                </div>

                {isRetailer && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAction(review.id, review.pinned ? 'unpin' : 'pin')}
                      className="p-2 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                      title={review.pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin size={14} />
                    </button>
                    <button
                      onClick={() => handleAction(review.id, 'delete')}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              {review.text && <p className="mt-3 text-sm font-medium text-slate-600 leading-relaxed">{review.text}</p>}
              {review.trackingId && <p className="mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Order #{review.trackingId}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
