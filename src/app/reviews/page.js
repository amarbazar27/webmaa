'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { loginWithGoogle } from '@/lib/auth';
import { uploadImage } from '@/lib/storage';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Star, Camera, Loader2, User, CheckCircle2, MessageSquare, ShoppingBag, Edit2, Trash2, Check, X } from 'lucide-react';
import Link from 'next/link';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';

export default function ReviewsPage() {
  const { user, userData, forceUpdateAuth } = useAuth();
  const router = useRouter();
  
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [myOrderCount, setMyOrderCount] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Edit states
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const isSuperAdmin = userData?.role === 'superadmin';
  
  // Load reviews on mount
  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/platform-review');
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Fetch logged in user's delivered order count across all shops
  useEffect(() => {
    if (user) {
      setLoadingOrders(true);
      // Query order counts dynamically (we can get it when submitting or call a helper)
      // Wait, we can fetch all reviews to find if the user has a review, or we can submit to get it.
      // Let's call a small fetch or check completed orders from local orders if needed.
      // To get the user's order count, we can load all shops and fetch their orders, just like we did in profile!
      // Since we want this to be fast, we can call the profile orders query here too!
      const loadOrdersCount = async () => {
        try {
          const shopsRes = await fetch('/api/domain-lookup?host=all'); // fallback or just query all shops
          // Wait, let's call a simpler endpoint or query Firestore collections directly.
          // Since we can fetch all shops from the firestore, let's query all shops and search for completed orders.
          const { getAllShops, getUserOrders } = await import('@/lib/firestore');
          const shops = await getAllShops();
          const promises = shops.map(shop => 
            getUserOrders(shop.id, user.email).then(orders => 
              orders.filter(o => o.status === 'completed')
            )
          );
          const results = await Promise.all(promises);
          const total = results.flat().length;
          setMyOrderCount(total);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingOrders(false);
        }
      };
      loadOrdersCount();
    } else {
      setMyOrderCount(0);
    }
  }, [user]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);
    const toastId = toast.loading('ছবি আপলোড হচ্ছে...');
    try {
      const url = await uploadImage(file);
      setScreenshotUrl(url);
      toast.success('ছবি আপলোড সফল হয়েছে! 📸', { id: toastId });
    } catch (err) {
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে।', { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSmartLogin = () => {
    router.push('/login');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('রিভিউ দিতে প্রথমে লগইন সম্পন্ন করুন।');
      return;
    }

    if (!text.trim()) {
      toast.error('দয়া করে আপনার মতামত বা অভিজ্ঞতাটি লিখুন।');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('রিভিউ জমা হচ্ছে...');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/platform-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          rating,
          text: text.trim(),
          screenshotUrl
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'রিভিউ জমা দিতে সমস্যা হয়েছে।');
      }

      toast.success('রিভিউ সফলভাবে জমা হয়েছে! ধন্যবাদ। 💖', { id: toastId });
      setText('');
      setScreenshotUrl('');
      fetchReviews(); // reload list
    } catch (err) {
      toast.error(err.message || 'রিভিউ জমা দিতে ব্যর্থ হয়েছে।', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditText(review.text || '');
  };

  const handleSaveEdit = async (reviewId) => {
    setEditSubmitting(true);
    const toastId = toast.loading('আপডেট করা হচ্ছে...');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/platform-review', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          reviewId,
          rating: editRating,
          text: editText.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('রিভিউ আপডেট সফল হয়েছে! 🎉', { id: toastId });
      setEditingReviewId(null);
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'আপডেট ব্যর্থ হয়েছে।', { id: toastId });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('রিভিউটি ডিলিট করতে চান?')) return;
    const toastId = toast.loading('মুছে ফেলা হচ্ছে...');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/platform-review?reviewId=${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('রিভিউটি সফলভাবে মুছে ফেলা হয়েছে!', { id: toastId });
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'মুছে ফেলতে সমস্যা হয়েছে।', { id: toastId });
    }
  };

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-purple-600 selection:text-white font-sans overflow-x-hidden pb-12 flex flex-col justify-between transition-colors duration-300">
      
      {/* Navigation Header */}
      <header className="relative z-10 w-full px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 group text-slate-700 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-400 transition-all text-xs font-black uppercase tracking-wider"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>হোমপেজে ফিরুন</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggleButton size="sm" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm">
                BD
              </div>
              <span className="font-extrabold text-xs text-slate-900 dark:text-white hidden xs:inline-block">
                BDRetailers
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Review Section */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* Left Column: Form (Become Reviewer Card) */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden space-y-6">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600"></div>
            
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-2">
                Customer Feedback
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                রিভিউ লিখুন
              </h2>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
                প্ল্যাটফর্মে আপনার কেনাকাটার অভিজ্ঞতা ও মতামত শেয়ার করুন।
              </p>
            </div>

            {!user ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-4">
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
                  পণ্য কেনাকাটা ও ডেলিভারি সংক্রান্ত মতামত দিতে প্রথমে লগইন সম্পন্ন করুন।
                </p>
                <button
                  onClick={handleSmartLogin}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-4 h-4 bg-white rounded-full p-0.5" />
                  <span>গুগল দিয়ে লগইন করুন</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                {/* User Info & Order Count Badge */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-purple-200 dark:border-purple-800 overflow-hidden bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-700 dark:text-purple-300 font-black">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {user.displayName || 'সম্মানিত ক্রেতা'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {loadingOrders ? (
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin ml-auto" />
                    ) : (
                      <span className="inline-block px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[10px] font-black text-purple-700 dark:text-purple-300 rounded-full">
                        📦 {myOrderCount}টি ডেলিভারি
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    রেটিং নির্বাচন করুন (Rating) *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star 
                          size={28} 
                          className={`transition-colors ${
                            star <= rating 
                              ? 'fill-amber-400 text-amber-400' 
                              : 'text-slate-300 dark:text-slate-700'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Area */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    আপনার অভিজ্ঞতা লিখুন (Description) *
                  </label>
                  <textarea
                    rows={4}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    maxLength={1000}
                    placeholder="পণ্য বা প্ল্যাটফর্মের সেবা নিয়ে আপনার মতামত এখানে লিখুন..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-purple-600 outline-none focus:ring-2 focus:ring-purple-500/20 resize-none transition-all shadow-inner"
                    required
                  />
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    প্রমাণ বা স্ক্রিনশট যুক্ত করুন (ঐচ্ছিক)
                  </label>
                  <div className="flex items-center gap-4">
                    {screenshotUrl ? (
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 group">
                        <img src={screenshotUrl} alt="Review attachment" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setScreenshotUrl('')}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black text-rose-300 cursor-pointer"
                        >
                          মুছুন
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-50/50 dark:hover:bg-slate-800 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-purple-600 cursor-pointer transition-all">
                        {uploadingImage ? (
                          <Loader2 className="animate-spin text-purple-600" size={20} />
                        ) : (
                          <>
                            <Camera size={20} />
                            <span className="text-[9px] font-black uppercase mt-1">Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    )}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-tight">
                      <p>অর্ডারের রিসিট, ডেলিভারি রিসিভ করার ছবি বা প্রমাণের স্ক্রিনশট যুক্ত করতে পারেন।</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 active:scale-98 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>জমা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>রিভিউ সাবমিট করুন (Submit Feedback)</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Reviews List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="text-purple-600 dark:text-purple-400" size={22} />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                গ্রাহকদের মন্তব্যসমূহ
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-black border border-purple-200 dark:border-purple-800">
              {reviews.length}টি রিভিউ
            </span>
          </div>

          <div className="space-y-4">
            {loadingReviews ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="animate-spin text-purple-600" size={32} />
                <p className="text-xs font-bold">মন্তব্যগুলো লোড হচ্ছে...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 space-y-3 shadow-sm">
                <ShoppingBag size={44} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-black text-base text-slate-800 dark:text-slate-200">
                  এখনও কোনো রিভিউ জমা পড়েনি
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto">
                  আমাদের প্রথম ভেরিফাইড রিভিউটি দিতে বাম পাশের ফর্মটি পূরণ করে সাবমিট করুন।
                </p>
              </div>
            ) : (
              reviews.map(review => {
                let dateText = 'সম্প্রতি';
                if (review.createdAt?.toDate) {
                  dateText = review.createdAt.toDate().toLocaleDateString('bn-BD');
                } else if (review.createdAt?.seconds) {
                  dateText = new Date(review.createdAt.seconds * 1000).toLocaleDateString('bn-BD');
                }

                return (
                  <div 
                    key={review.id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl border border-purple-200 dark:border-purple-800 overflow-hidden bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center font-black text-purple-700 dark:text-purple-300 text-sm shrink-0">
                          {review.photoURL ? (
                            <img src={review.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            review.name?.[0] || 'U'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                              {review.name}
                            </h4>
                            {review.orderCount > 0 && (
                              <span className="inline-block px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black text-emerald-700 dark:text-emerald-300 rounded-full">
                                ✓ Verified Buyer ({review.orderCount} Order{review.orderCount > 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            {dateText}
                          </p>
                        </div>
                      </div>
                      
                      {/* Stars & Admin Controls */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              className={`${
                                i < review.rating 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-slate-200 dark:text-slate-700'
                              }`} 
                            />
                          ))}
                        </div>
                        {isSuperAdmin && (
                          <div className="flex gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                            <button
                              onClick={() => startEditing(review)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                              title="Edit Review"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Review"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingReviewId === review.id ? (
                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-purple-400/50 rounded-2xl p-4 mt-2 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">নতুন রেটিং:</span>
                          {[1, 2, 3, 4, 5].map(i => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setEditRating(i)}
                              className="p-1 transition-transform hover:scale-110 cursor-pointer"
                            >
                              <Star 
                                size={18} 
                                className={i <= editRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'} 
                              />
                            </button>
                          ))}
                        </div>
                        <textarea
                          rows={2}
                          maxLength={1000}
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="w-full text-xs font-bold text-slate-900 dark:text-white p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-purple-600 outline-none resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingReviewId(null)}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            বাতিল
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(review.id)}
                            disabled={editSubmitting || editRating === 0}
                            className="px-4 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            {editSubmitting ? <Loader2 size={12} className="animate-spin" /> : 'সংরক্ষণ'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                          {review.text}
                        </p>
                        {review.screenshotUrl && (
                          <div className="relative max-w-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] bg-slate-100 dark:bg-slate-800/50">
                            <a href={review.screenshotUrl} target="_blank" rel="noreferrer" className="block w-full h-full">
                              <img 
                                src={review.screenshotUrl} 
                                alt="Review attachment" 
                                className="w-full h-full object-cover hover:scale-102 transition-transform duration-300" 
                              />
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
          BDRetailers &bull; Customer Reviews &bull; 2026
        </p>
      </footer>
    </div>
  );
}
