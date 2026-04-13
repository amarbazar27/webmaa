"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Search, Star, ArrowRight, Phone, Store,
  Shield, Truck, Headphones, X, Loader2, CheckCircle,
  Sparkles, Package, ChevronRight, Zap, Users
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { loginWithGoogle } from '@/lib/auth';
import { addRetailerRequest } from '@/lib/firestore';
import toast from 'react-hot-toast';

const DEMO_CATEGORIES = ['All', 'Apple', 'Samsung', 'Xiaomi', 'Laptops', 'Accessories'];

const DEMO_PRODUCTS = [
  { id: 1, name: 'iPhone 15 Pro Max', price: 189999, category: 'Apple', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80', badge: 'Flagship' },
  { id: 2, name: 'MacBook Air M3', price: 174999, category: 'Apple', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80', badge: 'Best Seller' },
  { id: 3, name: 'AirPods Pro 2nd Gen', price: 34999, category: 'Apple', image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&q=80', badge: null },
  { id: 4, name: 'Samsung Galaxy S24 Ultra', price: 159999, category: 'Samsung', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80', badge: 'New' },
  { id: 5, name: 'Samsung Galaxy Tab S9', price: 89999, category: 'Samsung', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80', badge: null },
  { id: 6, name: 'Samsung Galaxy Buds3 Pro', price: 24999, category: 'Samsung', image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&q=80', badge: 'Popular' },
  { id: 7, name: 'Xiaomi 14 Ultra', price: 119999, category: 'Xiaomi', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80', badge: 'Value King' },
  { id: 8, name: 'Redmi Note 13 Pro+', price: 39999, category: 'Xiaomi', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80', badge: 'Budget' },
  { id: 9, name: 'ASUS ROG Zephyrus G14', price: 229999, category: 'Laptops', image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80', badge: 'Gaming' },
  { id: 10, name: 'Lenovo ThinkPad X1 Carbon', price: 195999, category: 'Laptops', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80', badge: 'Business' },
  { id: 11, name: 'Anker 65W GaN Charger', price: 4999, category: 'Accessories', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80', badge: null },
  { id: 12, name: 'Sony WH-1000XM5', price: 44999, category: 'Accessories', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80', badge: 'Premium' },
];

export default function DemoPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filtered = DEMO_PRODUCTS.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRequestClick = async () => {
    if (!user) {
      try {
        await loginWithGoogle();
        toast.success('Logged in! Now click the button again to request access.');
      } catch (err) {
        toast.error('Login failed. Please try again.');
      }
      return;
    }
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!phoneNumber || phoneNumber.length < 11) {
      toast.error('Please enter a valid 11-digit mobile number.');
      return;
    }
    setSubmitting(true);
    try {
      await addRetailerRequest(user, phoneNumber);
      setSubmitted(true);
      toast.success('Request submitted! Admin will review shortly.');
    } catch (err) {
      toast.error(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-500/30 border border-white/10">W</div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">TechVault Store</h1>
              <p className="text-[9px] font-bold text-purple-400 uppercase tracking-[0.2em]">Powered by Webmaa</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRequestClick}
              className="group hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-xs font-black hover:scale-105 transition-all shadow-lg shadow-purple-500/25"
            >
              <Store size={16} /> Become a Seller
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <Link href="/" className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">
              Back to Webmaa
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/20" />
        <div className="absolute top-0 left-[20%] w-[400px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-6">
              <Sparkles size={12} /> Live Demo Store
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
              Premium Electronics
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">at Your Fingertips.</span>
            </h2>
            <p className="text-white/40 text-lg font-medium max-w-xl mb-8">
              This is a fully functional demo store showcasing Webmaa&apos;s capabilities.
              Create your own store like this in under 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRequestClick}
                className="group px-8 py-4 bg-white text-slate-900 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl"
              >
                <Store size={20} /> Request Retailer Access
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-3.5 text-white/30" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-white/20 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {DEMO_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 border ${
                  activeCategory === cat
                    ? 'bg-white text-slate-900 border-white shadow-lg shadow-white/10 scale-105'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.08] hover:text-white/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map(product => (
            <div
              key={product.id}
              className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:bg-white/[0.08] hover:border-white/[0.15] hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                {product.badge && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-purple-600/90 backdrop-blur text-[10px] font-black text-white rounded-lg shadow-lg">
                    {product.badge}
                  </span>
                )}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-sm font-black shadow-lg border border-white/10">
                  BDT {product.price.toLocaleString()}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 sm:p-5">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">{product.category}</p>
                <h3 className="font-black text-white text-sm leading-tight group-hover:text-purple-300 transition-colors line-clamp-2">{product.name}</h3>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-[10px] text-white/30 font-bold ml-1">(4.{(product.id % 5) + 5})</span>
                </div>
                <button className="w-full mt-4 py-2.5 rounded-xl font-black text-xs bg-white/5 border border-white/10 text-white/60 hover:bg-purple-600 hover:text-white hover:border-purple-500 transition-all duration-300">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Webmaa Section */}
      <div className="border-t border-white/[0.06] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-purple-400 uppercase tracking-[0.3em] mb-3">For Retailers</p>
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Want a Store Like This?
            </h3>
            <p className="text-white/40 mt-3 max-w-lg mx-auto font-medium">
              Get your own branded storefront with all these features for absolutely free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            {[
              { icon: Zap, title: "Instant Setup", desc: "Your store goes live in under 2 minutes. No technical knowledge needed." },
              { icon: Users, title: "Team Management", desc: "Add staff members with isolated access to manage orders and inventory." },
              { icon: Package, title: "Full E-Commerce", desc: "Products, orders, invoices, AI chat, PWA app download — everything included." }
            ].map((item, i) => (
              <div key={i} className="text-center p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:-translate-y-2 hover:shadow-xl transition-all duration-500">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-purple-500/25">
                  <item.icon size={24} />
                </div>
                <h4 className="font-black text-white mb-2">{item.title}</h4>
                <p className="text-sm text-white/40 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleRequestClick}
              className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl text-lg font-black hover:scale-105 transition-all shadow-2xl shadow-purple-500/30"
            >
              <Store size={22} /> Request Retailer Access
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[10px] text-white/20 font-bold mt-4 uppercase tracking-widest">
              * Login required. Admin approval within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">W</div>
            <span className="text-sm font-bold text-white/40">TechVault Demo by Webmaa</span>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold text-white/20 uppercase tracking-widest">
            <span className="flex items-center gap-1"><Shield size={12} /> Secure</span>
            <span className="flex items-center gap-1"><Truck size={12} /> Fast Delivery</span>
            <span className="flex items-center gap-1"><Headphones size={12} /> 24/7 Support</span>
          </div>
          <p className="text-[10px] font-bold text-white/15 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Webmaa Platform
          </p>
        </div>
      </footer>

      {/* Retailer Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRequestModal(false)} />
          <div className="relative w-full max-w-md bg-[#12121a] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <button onClick={() => setShowRequestModal(false)} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors">
              <X size={20} />
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Request Submitted!</h3>
                <p className="text-white/40 font-medium mb-6">
                  Our admin team will review your request and get back to you shortly. After approval, you can log in and start managing your store.
                </p>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-8 py-3 bg-white/10 border border-white/10 rounded-xl font-bold text-white/60 hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/25">
                    <Store size={28} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Request Retailer Access</h3>
                  <p className="text-white/40 text-sm font-medium">
                    Enter your active mobile number. Admin will review and approve your request.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Show logged in user info */}
                  <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                    {user?.photoURL ? (
                      <img src={user.photoURL} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-black">
                        {user?.displayName?.[0] || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white">{user?.displayName || 'User'}</p>
                      <p className="text-[10px] text-white/30 font-bold">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block pl-1">Active Mobile Number *</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-4 text-white/20" />
                      <input
                        type="tel"
                        maxLength={11}
                        placeholder="01XXXXXXXXX"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-white/15 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitRequest}
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-black text-white flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {submitting ? (
                      <><Loader2 className="animate-spin" size={18} /> Submitting...</>
                    ) : (
                      <><CheckCircle size={18} /> Submit Request</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      ` }} />
    </div>
  );
}
