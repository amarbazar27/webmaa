'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { loginWithGoogle } from '@/lib/auth';
import { uploadImage } from '@/lib/storage';
import toast from 'react-hot-toast';
import { ArrowLeft, Star, Camera, Loader2, User, CheckCircle2, MessageSquare, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function ReviewsPage() {
  const { user, forceUpdateAuth } = useAuth();
  
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [myOrderCount, setMyOrderCount] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
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

  const handleSmartLogin = async () => {
    try {
      const result = await loginWithGoogle();
      if (result?.user && result?.userData) {
        forceUpdateAuth(result.user, result.userData);
        toast.success(`লগইন সফল হয়েছে! 🎉`);
      }
    } catch (err) {
      toast.error('লগইন ব্যর্থ হয়েছে: ' + (err.message || 'সার্ভার ত্রুটি'));
    }
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

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#070e24] via-[#091535] to-[#040a17] text-slate-100 selection:bg-purple-900 selection:text-white font-sans overflow-x-hidden pb-10 flex flex-col justify-between">
      
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none opacity-50" />

      {/* Navigation Header */}
      <header className="relative z-10 w-full px-6 py-5 border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-white/60 hover:text-white transition-all text-xs font-black uppercase tracking-wider">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>হোমপেজে ফিরুন</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center font-black text-xs text-white">D</div>
            <span className="font-extrabold text-xs text-white">Daripallah</span>
          </div>
        </div>
      </header>

      {/* Main Review Section */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 py-12 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Form (Become Reviewer Card) */}
        <div className="lg:col-span-5">
          <div className="bg-slate-950/40 border border-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
            
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-purple-400 mb-3">Feedback Node</span>
              <h2 className="text-2xl font-black text-white tracking-tight">রিভিউ লিখুন</h2>
              <p className="text-xs text-white/40 mt-1 font-bold">প্ল্যাটফর্মে আপনার অভিজ্ঞতা ও মতামত শেয়ার করুন।</p>
            </div>

            {!user ? (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-center space-y-4">
                <p className="text-xs text-white/60 font-bold leading-relaxed">
                  পণ্য কেনাকাটা ও ডেলিভারি সংক্রান্ত মতামত দিতে প্রথমে লগইন সম্পন্ন করুন।
                </p>
                <button
                  onClick={handleSmartLogin}
                  className="w-full py-4 bg-white text-slate-900 hover:bg-slate-100 active:scale-98 transition-all font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
                  গুগল দিয়ে লগইন
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-6">
                {/* User Info & Order Count Badge */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-white/5">
                      {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-white/40 m-2.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{user.displayName || 'সম্মানিত ক্রেতা'}</p>
                      <p className="text-[9px] font-bold text-white/30 truncate max-w-[150px]">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {loadingOrders ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin ml-auto" />
                    ) : (
                      <span className="inline-block px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-[9px] font-black text-purple-400 rounded-full">
                        📦 {myOrderCount}টি ডেলিভারি
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating Select */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-white/50 uppercase tracking-widest ml-1">রেটিং নির্বাচন করুন (Rating)</label>
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
                          className={`transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Area */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-white/50 uppercase tracking-widest ml-1">আপনার অভিজ্ঞতা লিখুন (Description)</label>
                  <textarea
                    rows={4}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    maxLength={1000}
                    placeholder="পণ্য বা প্ল্যাটফর্মের সেবা নিয়ে আপনার মতামত এখানে লিখুন..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder-white/20 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-500/20 resize-none transition-all"
                    required
                  />
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-white/50 uppercase tracking-widest ml-1">প্রমাণ বা স্ক্রিনশট যুক্ত করুন (Optional)</label>
                  <div className="flex items-center gap-4">
                    {screenshotUrl ? (
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 group">
                        <img src={screenshotUrl} alt="Review attachment" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setScreenshotUrl('')}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black text-red-400 cursor-pointer"
                        >
                          মুছুন
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/50 flex flex-col items-center justify-center text-white/30 hover:text-purple-400 cursor-pointer bg-white/[0.01] hover:bg-purple-600/5 transition-all">
                        {uploadingImage ? (
                          <Loader2 className="animate-spin text-purple-500" size={20} />
                        ) : (
                          <>
                            <Camera size={20} />
                            <span className="text-[8px] font-black uppercase mt-1">Upload</span>
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
                    <div className="text-[10px] text-white/30 font-bold leading-tight">
                      <p>অর্ডারের রিসিট, ডেলিভারি রিসিভ করার ছবি বা প্রমাণের স্ক্রিনশট যুক্ত করতে পারেন।</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> রিভিউ সাবমিট করুন (Submit Feedback)
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Reviews List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <MessageSquare className="text-purple-400" size={20} />
            <h2 className="text-xl font-black text-white tracking-tight">গ্রাহকদের মন্তব্যসমূহ</h2>
          </div>

          <div className="space-y-4">
            {loadingReviews ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/40">
                <Loader2 className="animate-spin text-purple-500" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest">মন্তব্যগুলো লোড হচ্ছে...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-20 bg-slate-950/20 border border-dashed border-white/5 rounded-[2rem] text-white/40">
                <ShoppingBag size={48} className="mx-auto opacity-10 mb-4" />
                <p className="font-extrabold text-sm text-white/60">কোনো রিভিউ বা মতামত পাওয়া যায়নি</p>
                <p className="text-[10px] font-bold mt-1 uppercase tracking-wider">আমাদের প্রথম ভেরিফাইড রিভিউটি দিতে বাম পাশের ফর্মটি ব্যবহার করুন</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="bg-slate-950/20 border border-white/5 rounded-[2rem] p-6 space-y-4 animate-fade-in">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center font-black">
                        {review.photoURL ? <img src={review.photoURL} alt="" className="w-full h-full object-cover" /> : review.name?.[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-white leading-none">{review.name}</p>
                          {review.orderCount > 0 && (
                            <span className="inline-block px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 rounded-full">
                              Verified Buyer ({review.orderCount} Order{review.orderCount > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-white/30 mt-1">
                          {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('en-GB') : review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000).toLocaleDateString('en-GB') : 'Just now'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Stars Display */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={`${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-white/10'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-white/80 leading-relaxed font-bold">{review.text}</p>

                  {review.screenshotUrl && (
                    <div className="relative max-w-sm rounded-2xl overflow-hidden border border-white/5 aspect-[4/3] bg-black/40">
                      <a href={review.screenshotUrl} target="_blank" rel="noreferrer" className="block w-full h-full">
                        <img src={review.screenshotUrl} alt="Review attachment" className="w-full h-full object-cover hover:scale-102 transition-transform duration-500" />
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-6 border-t border-white/5">
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">
          Daripallah Customer Reviews &bull; 2026
        </p>
      </footer>
    </div>
  );
}
