// src/lib/templatesData.js
// Comprehensive Website Templates & Category-Smart Storefront Data for bdretailers.com

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'সব ডিজাইন (All)', labelEn: 'All Designs', icon: 'Sparkles', count: 12 },
  { id: 'grocery', label: 'গ্রোসারি ও কাঁচাবাজার', labelEn: 'Grocery & Organic', icon: 'ShoppingBag', count: 2 },
  { id: 'fashion', label: 'পোশাক ও ফ্যাশন', labelEn: 'Fashion & Boutique', icon: 'Shirt', count: 2 },
  { id: 'tech', label: 'গ্যাজেট ও টেক', labelEn: 'Gadgets & Tech', icon: 'Laptop', count: 2 },
  { id: 'beauty', label: 'বিউটি ও স্কিনকেয়ার', labelEn: 'Beauty & Skincare', icon: 'Sparkle', count: 1 },
  { id: 'food', label: 'খাবার ও রেস্টুরেন্ট', labelEn: 'Food & Restaurant', icon: 'Utensils', count: 1 },
  { id: 'luxury', label: 'জুয়েলারি ও লাক্সারি', labelEn: 'Luxury & Jewelry', icon: 'Crown', count: 1 },
  { id: 'pharmacy', label: 'ফার্মেসি ও হেলথ', labelEn: 'Health & Pharmacy', icon: 'HeartPulse', count: 1 },
  { id: 'kids', label: 'কিডস ও বেবি আইটেম', labelEn: 'Baby & Kids', icon: 'Baby', count: 1 },
  { id: 'b2b', label: 'পাইকারি ও বিটুবি', labelEn: 'B2B & Wholesale', icon: 'Building2', count: 1 },
];

export const DEFAULT_WEBSITE_TEMPLATES = [
  // ── 1. PHARMACY & HEALTHCARE ──
  {
    id: 'health_pharmacy',
    title: 'CarePlus Pharmacy & Digital Health',
    titleBn: 'কেয়ারপ্লাস ডিজিটাল ফার্মেসি ও হেলথকেয়ার',
    category: 'pharmacy',
    categoryBn: 'ফার্মেসি ও হেলথ',
    demoSubdomain: 'pharmacy',
    themePresetId: 'clean_commerce',
    headerStyle: 'search_first',
    footerStyle: 'trust_badge',
    primaryColor: '#0284C7',
    secondaryColor: '#082F49',
    accentColor: '#38BDF8',
    bgColor: '#F8FAFC',
    textColor: '#0F172A',
    font: 'Hind Siliguri',
    buttonRadius: '12px',
    cardRadius: '16px',
    badge: 'জরুরি প্রেসক্রিপশন সেবা',
    badgeTheme: 'teal',
    description: 'প্রেসক্রিপশন আপলোড সুবিধা, ডিজিডিএ অনুমোদিত জেনুইন ঔষধ, হেলথ কনসার্ন গ্রিড ও ২৪/৭ রেজিস্টার্ড ফার্মাসিস্ট সাপোর্ট।',
    bannerImage: 'https://images.unsplash.com/photo-1586015555751-63c2c544fa00?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1586015555751-63c2c544fa00?w=800&q=80',
    specialType: 'pharmacy',
    features: [
      'প্রেসক্রিপশন ছবি আপলোড করে দ্রুত ঔষধ অর্ডার',
      'স্বাস্থ্য সমস্যা (Health Concern) অনুযায়ী ব্রাউজিং',
      '১০০% জেনুইন ডিজিডিএ সার্টিফাইড ঔষধ গ্যারান্টি',
      'তাপমাত্রা নিয়ন্ত্রিত ও সুরক্ষিত কোল্ড-চেইন ডেলিভারি',
      '২৪/৭ রেজিস্টার্ড গ্র্যাজুয়েট ফার্মাসিস্ট চ্যাট সাপোর্ট'
    ],
    rating: 4.9,
    storesCount: 94,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'রেজিস্টার্ড ডিজিটাল ফার্মেসি',
      title: 'প্রেসক্রিপশন আপলোড করুন, ঔষধ পৌঁছে যাবে আপনার ঠিকানায়',
      subtitle: '১০০% জেনুইন ও ডিজিডিএ অনুমোদিত ঔষধ। ফার্মাসিস্ট কর্তৃক প্রেসক্রিপশন যাচাই সাপেক্ষে সুপার-ফাস্ট ডেলিভারি।',
      ctaPrimary: 'প্রেসক্রিপশন আপলোড করুন',
      ctaSecondary: 'জরুরি হেল্পলাইন: ০১৭০০-০০০০০০',
      imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80'
    },
    sampleCategories: [
      { id: 'c1', name: 'প্রেসক্রিপশন ড্রাগ', icon: 'Pill', count: '১৮০+ পণ্য' },
      { id: 'c2', name: 'ডায়াবেটিস কেয়ার', icon: 'Activity', count: '৪৫+ পণ্য' },
      { id: 'c3', name: 'হার্ট ও রক্তচাপ', icon: 'Heart', count: '৩০+ পণ্য' },
      { id: 'c4', name: 'গ্যাস ও অ্যাসিডিটি', icon: 'Shield', count: '২৫+ পণ্য' },
      { id: 'c5', name: 'ভিটামিন ও সাপ্লিমেন্ট', icon: 'Sparkles', count: '৬০+ পণ্য' },
      { id: 'c6', name: 'মা ও শিশু যত্ন', icon: 'Baby', count: '৪০+ পণ্য' }
    ],
    concerns: [
      { id: 'cn1', title: 'ডায়াবেটিস নিয়ন্ত্রণ', desc: 'গ্লুকোজ মনিটর, স্ট্রিপ ও সুগার-ফ্রি ফুড', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      { id: 'cn2', title: 'সর্দি, জ্বর ও ঠান্ডা', desc: 'প্যারাসিটামল, সিরাপ ও ভেপোরাইজার', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { id: 'cn3', title: 'গ্যাস্ট্রিক ও বদহজম', desc: 'অ্যান্টাসিড ও প্রোটন পাম্প ইনহিবিটর', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      { id: 'cn4', title: 'হাইপারটেনশন ও প্রেসার', desc: 'ডিজিটাল বিপি মনিটর ও নিয়মিত ড্রাগস', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    ],
    sampleProducts: [
      { id: 'ph1', name: 'ডিজিটাল ব্লাড প্রেশার মনিটর আর্ম টাইপ (Omron M2)', price: 2850, oldPrice: 3400, image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80', unit: '১ কিট', badge: 'মেডিকেল গ্রেড' },
      { id: 'ph2', name: 'ওমেগা-৩ ট্রিপল স্ট্রেন্থ ফিশ অয়েল সফটজেল (৬০ টি)', price: 1350, oldPrice: 1650, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', unit: '৬০ ক্যাপসুল', badge: 'বেস্টসেলার' },
      { id: 'ph3', name: 'অ্যাকু-চেক ইনস্ট্যান্ট ব্লাড গ্লুকোজ টেস্ট কিট', price: 1950, oldPrice: 2300, image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=80', unit: '১ সেট', badge: 'নির্ভুল' },
      { id: 'ph4', name: 'ভিটামিন সি + জিংক চিউয়েবল ট্যাবলেট (অরেঞ্জ ফ্লেভার)', price: 380, oldPrice: 450, image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80', unit: '৩০ ট্যাবলেট', badge: 'ইমিউনিটি বুস্টার' }
    ]
  },

  // ── 2. FRESH GROCERY & DAILY BAZAR ──
  {
    id: 'fresh_grocery',
    title: 'Fresh Grocery & Organic Daily Bazar',
    titleBn: 'ফ্রেশ গ্রোসারি ও অর্গানিক বাজার',
    category: 'grocery',
    categoryBn: 'মুদি ও কাঁচাবাজার',
    demoSubdomain: 'grocery',
    themePresetId: 'fresh_grocery',
    headerStyle: 'grocery_quick',
    footerStyle: 'grocery_fresh',
    primaryColor: '#059669',
    secondaryColor: '#064E3B',
    accentColor: '#34D399',
    bgColor: '#F0FDF4',
    textColor: '#064E3B',
    font: 'Hind Siliguri',
    buttonRadius: '12px',
    cardRadius: '18px',
    badge: 'সুপার ডিলস',
    badgeTheme: 'emerald',
    description: 'আজকের বাজার দর লাইভ স্ক্রলার, তাজা শাক-সবজি ও মাছ-মাংস, মাসিক গ্রোসারি বান্ডেল সেভিংস এবং কেজি ভিত্তিক দ্রুত অর্ডার।',
    bannerImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    specialType: 'grocery',
    features: [
      'লাইভ আজকের বাজার দর স্ক্রলার নোটিশ',
      'মাসিক মুদি বাজার কম্বো প্যাক (বান্ডেল সেভিংস)',
      'ওজন ও কেজি ভিত্তিক নিখুঁত প্রাইস ফিল্টারিং',
      'তাজা সবজি, খাঁটি সরিষার তেল ও চালের দ্রুত ক্যাশ অন ডেলিভারি',
      'Steadfast কুরিয়ার ও নিজস্ব লোকাল রাইডার সিঙ্ক'
    ],
    rating: 4.9,
    storesCount: 195,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'ফার্ম ফ্রেশ কাঁচাবাজার',
      title: 'প্রতিদিনের তাজা শাকসবজি, মাছ-মাংস ও সেরা মুদি বাজার',
      subtitle: 'খেত থেকে সরাসরি বাছাইকৃত ফরমালিনমুক্ত তাজা পণ্য। সকালের অর্ডারে দুপুরেই পৌঁছে যাবে আপনার রান্নাঘরে।',
      ctaPrimary: 'বাজার শুরু করুন',
      ctaSecondary: 'আজকের কম্বো প্যাক',
      imageUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&q=80'
    },
    tickerText: '📢 আজকের বিশেষ বাজার দর: প্রিমিয়াম নাজিরশাইল চাল ৳৭৪/কেজি | খাঁটি সরিষার তেল ৳২৯০/লিটার | ফার্মের ব্রাউন ডিম ৳১৬০/ডজন | তাজা পাঙ্গাশ মাছ ৳১৯০/কেজি',
    bundle: {
      title: 'মাসিক ফ্যামিলি মেগা গ্রোসারি বাজার কম্বো প্যাক',
      desc: '৫ কেজি মিনিকেট চাল + ২ লিটার সয়াবিন তেল + ১ কেজি মসুর ডাল + ১ কেজি লবণ + ৫০০ গ্রাম চিনি',
      price: 1190,
      oldPrice: 1380,
      saveAmount: 190,
      imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&q=80'
    },
    sampleCategories: [
      { id: 'gc1', name: 'চাল ও ডাল', icon: 'Package', count: '৩০+ প্রকার' },
      { id: 'gc2', name: 'তেল ও মসলা', icon: 'Flame', count: '৪৫+ আইটেম' },
      { id: 'gc3', name: 'তাজা মাছ ও মাংস', icon: 'Fish', count: 'প্রতিদিন তাজা' },
      { id: 'gc4', name: 'শাকসবজি ও আলু', icon: 'Carrot', count: 'ফার্ম ফ্রেশ' },
      { id: 'gc5', name: 'দুধ, ডিম ও ঘি', icon: 'Egg', count: '১০০% খাঁটি' },
      { id: 'gc6', name: 'চা ও বিস্কুট', icon: 'Coffee', count: 'স্ন্যাকস' }
    ],
    sampleProducts: [
      { id: 'gr1', name: 'চাষী চিনিগুঁড়া সুগন্ধি পোলাও চাল (১ কেজি)', price: 145, oldPrice: 160, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', unit: '১ কেজি', badge: 'সুগন্ধি' },
      { id: 'gr2', name: 'ঘানি ভাঙা খাঁটি সরিষার তেল (১ লিটার)', price: 290, oldPrice: 330, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', unit: '১ লিটার', badge: '১০০% খাঁটি' },
      { id: 'gr3', name: 'ফার্ম ফ্রেশ ব্রাউন লেয়ার ডিম (১ ডজন)', price: 165, oldPrice: 180, image: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=400&q=80', unit: '১২ টি', badge: 'তাজা' },
      { id: 'gr4', name: 'সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু (৫০০ গ্রাম)', price: 590, oldPrice: 680, image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80', unit: '৫০০ গ্রাম', badge: 'অর্গানিক' }
    ]
  },

  // ── 3. FASHION & BOUTIQUE COUTURE ──
  {
    id: 'fashion_editorial',
    title: 'Vogue Editorial Couture & Boutique',
    titleBn: 'লাক্সারি ফ্যাশন এডিটোরিয়াল ও বুটিক',
    category: 'fashion',
    categoryBn: 'ফ্যাশন ও বুটিক',
    demoSubdomain: 'fashion',
    themePresetId: 'premium_fashion',
    headerStyle: 'fashion_editorial',
    footerStyle: 'editorial_story',
    primaryColor: '#881337',
    secondaryColor: '#4C0519',
    accentColor: '#EAB308',
    bgColor: '#FFF1F2',
    textColor: '#4C0519',
    font: 'Playfair Display',
    buttonRadius: '6px',
    cardRadius: '10px',
    badge: 'রানওয়ে ট্রেন্ড',
    badgeTheme: 'rose',
    description: 'আভিজাত্যপূর্ণ লুকবুক, শপেবল ইনস্টাগ্রাম রিলস, কালার ও সাইজ লাইভ ভ্যারিয়েন্ট সুইচিং এবং প্রিমিয়াম ওয়াইন-গোল্ড রানওয়ে লুক।',
    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
    specialType: 'fashion',
    features: [
      'ইন্টারেক্টিভ শপেবল লুকবুক উইথ হটস্পটস',
      'ইনস্টাগ্রাম ও টিকটক স্টাইল ভার্টিক্যাল ভিডিও রিলস',
      'সাইজ (S, M, L, XL, XXL) ও কালার লাইভ সুইচিং',
      'ভেরিফাইড কাস্টমার ও ইনফ্লুয়েন্সার ফটো গ্যালারি',
      'হাই-কনভার্সন ১-ক্লিক বিকাশ/নগদ ফ্যাশন চেকআউট'
    ],
    rating: 5.0,
    storesCount: 220,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'ঈদ ও ওয়েডিং এক্সক্লুসিভ কালেকশন',
      title: 'অভিজাত নকশায় তৈরি সিগনেচার ফ্যাশন ওয়্যার',
      subtitle: 'হাতে বোনা বেনারসি সিল্ক, প্রিমিয়াম জ্যাকার্ড পাঞ্জাবি ও ডিজাইনার থ্রি-পিস। আপনার বিশেষ মুহূর্তকে করে তুলুন অনন্য।',
      ctaPrimary: 'কালেকশন এক্সপ্লোর করুন',
      ctaSecondary: 'লুকবুক দেখুন',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80'
    },
    reels: [
      { id: 'r1', title: 'রয়্যাল বেনারসি সিল্ক ড্রেপিং টিউটোরিয়াল', views: '১২.৫k', thumbnail: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80', price: '৳ ৬,৮০০' },
      { id: 'r2', title: 'হ্যান্ডক্রাফটেড এমব্রয়ডারি জর্জেট কুর্তি স্টাইলিং', views: '১৮.২k', thumbnail: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&q=80', price: '৳ ২,৪৫০' },
      { id: 'r3', title: 'প্রিমিয়াম ব্ল্যাক জ্যাকার্ড পাঞ্জাবি আনবক্সিং', views: '১৫.৯k', thumbnail: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80', price: '৳ ৩,৪০০' }
    ],
    sampleCategories: [
      { id: 'fc1', name: 'এক্সক্লুসিভ শাড়ি', icon: 'Sparkles', count: '৮০+ ডিজাইন' },
      { id: 'fc2', name: 'ডিজাইনার থ্রি-পিস', icon: 'Shirt', count: '১২০+ পিস' },
      { id: 'fc3', name: 'প্রিমিয়াম পাঞ্জাবি', icon: 'User', count: '৬০+ মডেল' },
      { id: 'fc4', name: 'হ্যান্ডব্যাগ ও ক্লাচ', icon: 'ShoppingBag', count: '৪০+ ব্যাগ' },
      { id: 'fc5', name: 'ফুটওয়্যার ও হিলস', icon: 'Zap', count: '৫০+ জুতো' }
    ],
    sampleProducts: [
      { id: 'fa1', name: 'রয়্যাল বেনারসি কাতান সিল্ক শাড়ি (গোল্ডেন জরির কাজ)', price: 6800, oldPrice: 8500, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80', unit: '১ পিস', badge: 'সিগনেচার' },
      { id: 'fa2', name: 'হ্যান্ডক্রাফটেড এমব্রয়ডারি কুর্তি ও ওড়না সেট', price: 2450, oldPrice: 3100, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&q=80', unit: '১ সেট', badge: 'বেস্টসেলার' },
      { id: 'fa3', name: 'ট্রেডিশনাল জ্যাকার্ড ফেব্রিক কাবলি পাঞ্জাবি', price: 3400, oldPrice: 4200, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80', unit: '১ পিস', badge: 'এক্সক্লুসিভ' },
      { id: 'fa4', name: 'লেদার ফিনিশ পার্টি ক্লাচ হ্যান্ডব্যাগ', price: 1850, oldPrice: 2300, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80', unit: '১ পিস', badge: 'নতুন' }
    ]
  },

  // ── 4. TECH, GADGETS & CYBER ELECTRONICS ──
  {
    id: 'tech_electronics',
    title: 'CyberTech & Next-Gen Gadgets',
    titleBn: 'নেক্সট-জেন টেক, মোবাইল ও গ্যাজেটস',
    category: 'tech',
    categoryBn: 'টেক ও গ্যাজেট',
    demoSubdomain: 'tech',
    themePresetId: 'tech_neon',
    headerStyle: 'electronics',
    footerStyle: 'electronics_tech',
    primaryColor: '#2563EB',
    secondaryColor: '#0F172A',
    accentColor: '#06B6D4',
    bgColor: '#F0F9FF',
    textColor: '#0C4A6E',
    font: 'Inter',
    buttonRadius: '8px',
    cardRadius: '16px',
    badge: 'অফিসিয়াল ওয়ারেন্টি',
    badgeTheme: 'blue',
    description: 'Star Tech স্টাইলের টেকনিক্যাল স্পেসিফিকেশন টেবিল, অফিসিয়াল ব্র্যান্ড অথরিটি, ইএমআই ক্যালকুলেটর ও ডার্ক নিয়ন সাইবার লুক।',
    bannerImage: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80',
    specialType: 'tech',
    features: [
      'নিখুঁত টেকনিক্যাল স্পেসিফিকেশন কম্প্যারিজম টেবিল',
      '১-২ বছর অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি ব্যাজ',
      'গ্লোবাল টপ ব্র্যান্ডস অথোরাইজড লোগো স্ট্রিপ',
      'শপেবল টেক রিভিউ ও আনবক্সিং ভিডিও ফিচার',
      'ইনস্ট্যান্ট বিকাশ/নগদ পেমেন্টে অতিরিক্ত ছাড়'
    ],
    rating: 4.9,
    storesCount: 160,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'ফ্ল্যাগশিপ গ্যাজেট ড্রপ',
      title: 'প্রফেশনাল সাউন্ড ও নেক্সট-লেভেল পারফরম্যান্স গিয়ার',
      subtitle: 'অফিসিয়াল ওয়্যারেন্টি সহ অরিজিনাল অডিও, স্মার্টওয়াচ, পাওয়ারব্যাংক ও কম্পিউটার অ্যাকসেসরিজ।',
      ctaPrimary: 'সব গ্যাজেট দেখুন',
      ctaSecondary: 'স্পেক্স কম্পেয়ার করুন',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'
    },
    brands: ['Apple', 'Samsung', 'Anker', 'Baseus', 'Logitech', 'Xiaomi', 'Sony'],
    specsComparison: {
      title: 'ফ্ল্যাগশিপ স্পেক্স কম্প্যারিজম (Compare Specs)',
      items: [
        { model: 'Anker Space One', battery: '৫৫ ঘণ্টা প্লেটাইম', anc: '৯৮% নয়েজ ক্যান্সেলেশন', warranty: '১৮ মাস অফিসিয়াল' },
        { model: 'Sony WH-1000XM5', battery: '৩০ ঘণ্টা প্লেটাইম', anc: 'অটো এআই এএনসি', warranty: '১ বছর গ্যারান্টি' },
      ]
    },
    sampleCategories: [
      { id: 'tc1', name: 'হেডফোন ও ইয়ারবাডস', icon: 'Headphones', count: '৬৫+ মডেল' },
      { id: 'tc2', name: 'স্মার্টওয়াচ ও ব্যান্ড', icon: 'Watch', count: '৪০+ মডেল' },
      { id: 'tc3', name: 'ফাস্ট পাওয়ারব্যাংক', icon: 'Zap', count: '৩০+ আইটেম' },
      { id: 'tc4', name: 'কিবোর্ড ও মাউস', icon: 'Laptop', count: '৫০+ গিয়ার' },
      { id: 'tc5', name: 'চার্জার ও ক্যাবলস', icon: 'Cpu', count: '৮০+ অপশন' }
    ],
    sampleProducts: [
      { id: 'te1', name: 'Anker Soundcore Space One Active Noise Cancelling', price: 9500, oldPrice: 11500, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', unit: '১ পিস', badge: '১৮ মাস ওয়ারেন্টি' },
      { id: 'te2', name: 'Xiaomi Smart Band 8 Pro AMOLED ডিসপ্লে ওয়াটারপ্রুফ', price: 5800, oldPrice: 6600, image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&q=80', unit: '১ পিস', badge: 'বেস্টসেলার' },
      { id: 'te3', name: 'Baseus Blade 100W আল্ট্রা-থিন ল্যাপটপ পাওয়ারব্যাংক', price: 4200, oldPrice: 4900, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80', unit: '১ পিস', badge: '১০০ ওয়াট' },
      { id: 'te4', name: 'Logitech MX Master 3S ওয়্যারলেস প্রফেশনাল মাউস', price: 11800, oldPrice: 13500, image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80', unit: '১ পিস', badge: 'ফ্ল্যাগশিপ' }
    ]
  },

  // ── 5. BEAUTY, SKINCARE & DEWY COSMETICS ──
  {
    id: 'luxury_beauty',
    title: 'Radiance Dewy Beauty & Skincare',
    titleBn: 'রেডিয়েন্স স্কিনকেয়ার ও বিউটি',
    category: 'beauty',
    categoryBn: 'বিউটি ও স্কিনকেয়ার',
    demoSubdomain: 'beauty',
    themePresetId: 'elegant_beauty',
    headerStyle: 'fashion_editorial',
    footerStyle: 'fashion_lifestyle',
    primaryColor: '#B76E79',
    secondaryColor: '#881337',
    accentColor: '#F472B6',
    bgColor: '#FDF2F8',
    textColor: '#500724',
    font: 'Montserrat',
    buttonRadius: '50px',
    cardRadius: '20px',
    badge: 'কোরিয়ান গ্লাস স্কিন',
    badgeTheme: 'pink',
    description: 'বিফোর-আফটার রেজাল্ট স্লাইডার, ৪-ধাপের স্কিনকেয়ার রুটিন গাইড, ভেরিফাইড কাস্টমার সেলফি রিভিউ ও সফট রোজ গোল্ড আভা।',
    bannerImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    specialType: 'beauty',
    features: [
      'ইন্টারেক্টিভ বিফোর ও আফটার স্কিন রেজাল্ট স্লাইডার',
      '৪-ধাপের দৈনন্দিন গ্লাস স্কিনকেয়ার রুটিন কিউরেশন',
      'স্কিন টাইপ (তৈলাক্ত, শুষ্ক, সংবেদনশীল) ভিত্তিক ফিল্টার',
      'ভেরিফাইড কাস্টমার ফটো সেলফি ও ভিডিও রিভিউ',
      '১০০% অরিজিনাল কোরিয়ান ও ইউকে ইমপোর্টেড অথেনটিক ব্যাজ'
    ],
    rating: 4.8,
    storesCount: 110,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'কোরিয়ান গ্লাস স্কিন কেয়ার',
      title: 'ত্বকের প্রাকৃতিক উজ্জ্বলতা ফিরিয়ে আনুন নিরাপদ উপায়ে',
      subtitle: 'শতভাগ প্যারাবেন ও ক্ষতিকর কেমিক্যাল মুক্ত সিরাম, ময়েশ্চারাইজার এবং সানস্ক্রিন। প্রথম সপ্তাহ থেকেই দৃশ্যমান পরিবর্তন।',
      ctaPrimary: 'রুটিন কিট বেছে নিন',
      ctaSecondary: 'বিফোর/আফটার ফলাফল',
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80'
    },
    beforeAfter: {
      title: '১৪ দিনে ডার্ক স্পট ও পিগমেন্টেশন দূরীকরণের ফলাফল',
      beforeImg: 'https://images.unsplash.com/photo-1512290900672-1f558a2c9763?w=500&q=80',
      afterImg: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80',
      note: 'ভেরিফাইড কাস্টমার রিভিউ (১৪ দিন নিয়মানুযায়ী ব্যবহারের পর প্রাপ্ত ফলাফল)'
    },
    sampleCategories: [
      { id: 'bc1', name: 'সিরাম ও ট্রিটমেন্ট', icon: 'Sparkles', count: '৪৫+ আইটেম' },
      { id: 'bc2', name: 'ফেস ক্লেনজার ও ওয়াশ', icon: 'Droplets', count: '৩০+ আইটেম' },
      { id: 'bc3', name: 'হাইড্রেটিং টোনার', icon: 'Feather', count: '২৫+ আইটেম' },
      { id: 'bc4', name: 'এসপিএফ ৫০+ সানস্ক্রিন', icon: 'Sun', count: '২০+ ব্র্যান্ড' },
      { id: 'bc5', name: 'ময়েশ্চারাইজিং জেল', icon: 'Heart', count: '৩৫+ আইটেম' }
    ],
    sampleProducts: [
      { id: 'be1', name: 'Hyaluronic Acid Hydrating Serum (30ml Glass Bottle)', price: 1250, oldPrice: 1600, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80', unit: '30ml', badge: 'হাইড্রেটিং' },
      { id: 'be2', name: 'Centella Calming Soothing Gel Cream (100ml)', price: 1450, oldPrice: 1850, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80', unit: '100ml', badge: 'সেনসিটিভ স্কিন' },
      { id: 'be3', name: 'SPF 50+ PA++++ Invisible Sunscreen Non-Greasy', price: 990, oldPrice: 1300, image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80', unit: '50ml', badge: 'ম্যাট ফিনিশ' },
      { id: 'be4', name: 'Organic Rose Water Glowing Skin Toner (150ml)', price: 650, oldPrice: 850, image: 'https://images.unsplash.com/photo-1608248597359-299318182743?w=400&q=80', unit: '150ml', badge: 'অর্গানিক' }
    ]
  },

  // ── 6. RESTAURANT & FOOD EXPRESS ──
  {
    id: 'restaurant_food',
    title: 'Sunset Food & Express Dine',
    titleBn: 'ফুড এক্সপ্রেস ও রেস্টুরেন্ট মেনু',
    category: 'food',
    categoryBn: 'খাবার ও রেস্টুরেন্ট',
    demoSubdomain: 'food',
    themePresetId: 'fresh_food',
    headerStyle: 'search_first',
    footerStyle: 'grocery_fresh',
    primaryColor: '#EA580C',
    secondaryColor: '#7C2D12',
    accentColor: '#FACC15',
    bgColor: '#FFF7ED',
    textColor: '#431407',
    font: 'Hind Siliguri',
    buttonRadius: '18px',
    cardRadius: '20px',
    badge: '৩০ মিনিট ডেলিভারি',
    badgeTheme: 'orange',
    description: 'লাইভ ফুড মেনু ট্যাব, স্পাইসি লেভেল ইন্ডিকেটর, ৩০ মিনিট হট এক্সপ্রেস ডেলিভারি কাউন্টার ও শেফ স্পেশাল কম্বো বাকেট।',
    bannerImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    specialType: 'food',
    features: [
      'লাইভ মেনু ট্যাব (বার্গার, পিৎজা, বিরিয়ানি, কফি ও ডেজার্ট)',
      '৩০ মিনিট হট ডেলিভারি গ্যারান্টি কাউন্টার',
      'ঝাল মাত্রা নির্বাচন (Mild, Medium, Extra Spicy)',
      'কিচেন অর্ডার প্রিন্টিং স্লিপ ও রাইডার অটো অ্যাসাইন',
      'স্পেশাল ফ্যামিলি কম্বো ও ফ্রেন্ডস বাকেট সেভিংস'
    ],
    rating: 4.9,
    storesCount: 118,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'গরম গরম ফ্রেশ খাবার',
      title: 'জিভে জল আনা স্বাদে স্পেশাল বার্গার, পিৎজা ও বিরিয়ানি',
      subtitle: 'অর্ডার করার সাথে সাথে ফ্রেশ উপকরণে প্রস্তুত। ৩০ মিনিটের মধ্যে গরম গরম খাবার পৌঁছাবে আপনার টেবিলে।',
      ctaPrimary: 'মেনু দেখে অর্ডার করুন',
      ctaSecondary: 'শেফ স্পেশাল অফার',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80'
    },
    sampleCategories: [
      { id: 'rc1', name: 'স্মোকি বার্গার', icon: 'Utensils', count: '১২ টি ভ্যারাইটি' },
      { id: 'rc2', name: 'ওভেন বেকড পিৎজা', icon: 'Flame', count: '৮ টি সাইজ' },
      { id: 'rc3', name: 'কাচ্চি ও বিরিয়ানি', icon: 'Package', count: 'খাঁটি ঘি' },
      { id: 'rc4', name: 'ফ্রাইড চিকেন ও উইংস', icon: 'Sparkles', count: 'ক্রিস্পি' },
      { id: 'rc5', name: 'লাভা কেক ও ডেজার্ট', icon: 'Coffee', count: 'মিষ্টি মুখ' }
    ],
    sampleProducts: [
      { id: 'fd1', name: 'স্মোকি বারবিকিউ বিফ চিজি বার্গার মিল (উইথ ফ্রেঞ্চ ফ্রাইজ)', price: 380, oldPrice: 450, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', unit: '১ মিল', badge: 'হট ফেভারিট' },
      { id: 'fd2', name: '১২ ইঞ্চি চারকোল গ্রিলড চিকেন পিৎজা (এক্সট্রা চিজ বাবল)', price: 790, oldPrice: 950, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', unit: '১২ ইঞ্চি', badge: 'চিজি গ্যারান্টি' },
      { id: 'fd3', name: 'হায়দ্রাবাদি স্পেশাল মাটন কাচ্চি বিরিয়ানি (সাথে বোরহানি)', price: 420, oldPrice: 490, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', unit: '১ প্লেট', badge: 'খাঁটি গাওয়া ঘি' },
      { id: 'fd4', name: 'চকলেট লাভা কেক সাথে বেলজিয়ান ভ্যানিলা স্কুপ', price: 220, oldPrice: 260, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80', unit: '১ পিস', badge: 'ডেজার্ট' }
    ]
  },

  // ── 7. LUXURY JEWELRY & 24K GOLD ──
  {
    id: 'jewelry_gold',
    title: 'Obsidian 24K Gold & Fine Jewelry',
    titleBn: 'অবসিডিয়ান গোল্ড ও লাক্সারি জুয়েলারি',
    category: 'luxury',
    categoryBn: 'জুয়েলারি ও লাক্সারি',
    demoSubdomain: 'luxury',
    themePresetId: 'luxury_black',
    headerStyle: 'fashion_editorial',
    footerStyle: 'editorial_story',
    primaryColor: '#D4AF37',
    secondaryColor: '#18181B',
    accentColor: '#F59E0B',
    bgColor: '#FAFAF8',
    textColor: '#18181B',
    font: 'Playfair Display',
    buttonRadius: '4px',
    cardRadius: '8px',
    badge: 'হলমার্ক ২২/২৪কে',
    badgeTheme: 'amber',
    description: 'ড্রামাটিক ব্ল্যাক ও ২৪কে গোল্ড ফিনিশ, জুম-ইন ডায়মন্ড ম্যাক্রো প্রিভিউ, হলমার্ক বিশুদ্ধতা সার্টিফিকেট ও ভিআইপি গিফট র‍্যাপিং।',
    bannerImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    specialType: 'luxury',
    features: [
      '২২ ও ২৪ ক্যারেট গোল্ড এবং ডায়মন্ডের অফিসিয়াল হলমার্ক সার্টিফিকেট',
      'হাই-রেজোলিউশন ম্যাক্রো ফটো জুমিং সুবিধা',
      'প্রিমিয়াম রয়্যাল ভেলভেট গিফট বক্স ও ইনস্যুরেন্স প্যাকেজিং',
      'সরাসরি শোরুম ভিজিট অথবা ভিআইপি হোম ডেলিভারি',
      'জীবনভর ১০০% গোল্ড বাইব্যাক ও পলিশিং পলিসি'
    ],
    rating: 5.0,
    storesCount: 68,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'সার্টিফাইড ফাইন জুয়েলারি',
      title: 'বিশুদ্ধ স্বর্ণের আলোয় আপনার আভিজাত্য উদ্ভাসিত হোক',
      subtitle: 'নিখুঁত কারুকাজে তৈরি ব্রাইডাল নেকলেস, ডায়মন্ড এনগেজমেন্ট রিং এবং ঐতিহ্যবাহী ঝুমকা কালেকশন।',
      ctaPrimary: 'জুয়েলারি কালেকশন',
      ctaSecondary: 'হলমার্ক সার্টিফিকেট দেখুন',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80'
    },
    sampleCategories: [
      { id: 'jc1', name: 'এনগেজমেন্ট রিং', icon: 'Sparkles', count: '৩০+ ডিজাইন' },
      { id: 'jc2', name: 'ব্রাইডাল নেকলেস সেট', icon: 'Crown', count: '২৫+ সেট' },
      { id: 'jc3', name: 'গোল্ড ইয়াররিংস ও ঝুমকা', icon: 'Feather', count: '৪০+ জোড়া' },
      { id: 'jc4', name: 'রোজ গোল্ড ব্রেসলেট', icon: 'Heart', count: '২০+ ডিজাইন' },
      { id: 'jc5', name: 'নূপুর ও পায়জোর', icon: 'Zap', count: '১৫+ মডেল' }
    ],
    sampleProducts: [
      { id: 'jw1', name: '২২ ক্যারেট ক্লাসিক সলিটায়ার ডায়মন্ড রিং (হলমার্ক সার্টিফাইড)', price: 42000, oldPrice: 48000, image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=80', unit: '১ পিস', badge: 'হলমার্ক ২২কে' },
      { id: 'jw2', name: 'রয়্যাল কুন্দন পার্ল ব্রাইডাল নেকলেস ও কানের দুল সেট', price: 18500, oldPrice: 22000, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80', unit: '১ সেট', badge: 'ব্রাইডাল স্পেশাল' },
      { id: 'jw3', name: '১৮কে রোজ গোল্ড চার্ম ব্রেসলেট উইথ জিরকন স্টোন', price: 14200, oldPrice: 16500, image: 'https://images.unsplash.com/photo-1611591475819-79b8b4a7098e?w=400&q=80', unit: '১ পিস', badge: '১৮কে রোজ গোল্ড' },
      { id: 'jw4', name: 'ট্রেডিশনাল ডিজাইনার গোল্ড প্লেটেড ঝুমকা ইয়াররিংস', price: 3600, oldPrice: 4500, image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400&q=80', unit: '১ জোড়া', badge: 'ক্লাসিক' }
    ]
  },

  // ── 8. B2B & BULK WHOLESALE ──
  {
    id: 'wholesale_b2b',
    title: 'Apex Wholesale & Bulk B2B Market',
    titleBn: 'অ্যাপেক্স পাইকারি ও বালক বিটুবি মার্কেট',
    category: 'b2b',
    categoryBn: 'পাইকারি ও বিটুবি',
    demoSubdomain: 'wholesale',
    themePresetId: 'corporate_b2b',
    headerStyle: 'marketplace',
    footerStyle: 'marketplace',
    primaryColor: '#1E3A8A',
    secondaryColor: '#0F172A',
    accentColor: '#60A5FA',
    bgColor: '#F8FAFC',
    textColor: '#0F172A',
    font: 'Inter',
    buttonRadius: '8px',
    cardRadius: '10px',
    badge: 'বালক ডিসকাউন্ট ল্যাডার',
    badgeTheme: 'indigo',
    description: 'পরিমাণভিত্তিক ডিসকাউন্ট ল্যাডার (Tiered Pricing), মিনিমাম অর্ডার কোয়ান্টিটি (MOQ) বাধ্যবাধকতা ও কর্পোরেট ইনভয়েস রিকোয়েস্ট।',
    bannerImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    specialType: 'b2b',
    features: [
      'পরিমাণ বাড়ালে দাম কমার স্পষ্ট প্রাইস ল্যাডার (Tiered Pricing)',
      'ন্যূনতম অর্ডার কোয়ান্টিটি (MOQ) কন্ট্রোল সিস্টেম',
      'জিএসটি / ভ্যাট ট্যাক্স কর্পোরেট ইনভয়েস ডাউনলোড',
      'অনলাইনে রিকোয়েস্ট ফর কোটেশন (RFQ) ফর্ম',
      'ট্রাক লোড ও বাল্ক লজিস্টিক কুরিয়ার পার্টনারশিপ'
    ],
    rating: 4.9,
    storesCount: 96,
    isActive: true,
    featuredOnHome: false,
    hero: {
      tag: 'সরাসরি ফ্যাক্টরি রেট',
      title: 'বালক অর্ডারে সর্বোচ্চ সাশ্রয়ী পাইকারি পাইপলাইন',
      subtitle: 'গার্মেন্টস, গ্যাজেট এক্সেসরিজ ও প্যাকেজিং ম্যাটেরিয়ালস সরাসরি উৎপাদনকারী থেকে হোলসেল মূল্যে কিনুন।',
      ctaPrimary: 'হোলসেল ক্যাটালগ',
      ctaSecondary: 'কোটেশন রিকোয়েস্ট (RFQ)',
      imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80'
    },
    sampleCategories: [
      { id: 'wc1', name: 'রেডিমেড গার্মেন্টস লট', icon: 'Shirt', count: '৫০+ লট' },
      { id: 'wc2', name: 'ইলেকট্রনিক্স বাল্ক প্যাক', icon: 'Zap', count: '৩০+ লট' },
      { id: 'wc3', name: 'প্যাকেজিং ও কার্টন বক্স', icon: 'Package', count: '১০০+ সাইজ' },
      { id: 'wc4', name: 'কসমেটিকস হোলসেল কার্টন', icon: 'Sparkles', count: '৪০+ আইটেম' }
    ],
    sampleProducts: [
      { id: 'ws1', name: 'এক্সপোর্ট কোয়ালিটি মেনস ডেনিম জিন্স (লট ৫০ পিস - MOQ ৫০)', price: 27500, oldPrice: 32500, image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80', unit: '৫০ পিস লট', badge: 'MOQ ৫০ পিস' },
      { id: 'ws2', name: '১০০% কটন ড্রপ শোল্ডার ওভারসাইজড টি-শার্ট (লট ১০০ পিস)', price: 18000, oldPrice: 22000, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80', unit: '১০০ পিস লট', badge: 'MOQ ১০০ পিস' },
      { id: 'ws3', name: 'ফাস্ট চার্জিং ব্রেডেড টাইপ-সি ক্যাবল (১০০ পিসের হোলসেল বক্স)', price: 7500, oldPrice: 9500, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80', unit: '১০০ পিস বক্স', badge: 'MOQ ১০০ পিস' },
      { id: 'ws4', name: 'কসমেটিক ভেলভেট ম্যাট লিপস্টিক সেট (২৪ পিসের মাস্টার কার্টন)', price: 4200, oldPrice: 5200, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&q=80', unit: '২৪ পিস কার্টন', badge: 'MOQ ২৪ পিস' }
    ]
  }
];

export function getMergedTemplates(globalConfigTemplates) {
  if (Array.isArray(globalConfigTemplates) && globalConfigTemplates.length > 0) {
    return globalConfigTemplates;
  }
  return DEFAULT_WEBSITE_TEMPLATES;
}

export function findTemplateByIdOrSlug(idOrSlug, customTemplates) {
  const templates = getMergedTemplates(customTemplates);
  return (
    templates.find(t => t.id === idOrSlug || t.demoSubdomain === idOrSlug) ||
    templates[0]
  );
}

export function getDemoUrl(template, origin = '') {
  if (!template) return 'https://bdretailers.com';
  if (template.customDemoUrl && template.customDemoUrl.startsWith('http')) {
    return template.customDemoUrl;
  }
  const slug = template.demoSubdomain || template.id;
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
      return `/shop/${slug}`;
    }
  }
  return `https://${slug}.bdretailers.com`;
}
