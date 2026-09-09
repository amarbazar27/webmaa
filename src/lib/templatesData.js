// src/lib/templatesData.js
// Comprehensive Website Templates & Category-Smart Storefront Data for bdretailers.com

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'সব ডিজাইন (All 15)', labelEn: 'All Designs (15)', icon: 'Sparkles', count: 15 },
  { id: 'grocery', label: 'গ্রোসারি ও সুপারমার্কেট', labelEn: 'Grocery & Supermarket', icon: 'ShoppingBag', count: 2 },
  { id: 'fashion', label: 'পোশাক ও ফ্যাশন', labelEn: 'Fashion & Boutique', icon: 'Shirt', count: 2 },
  { id: 'tech', label: 'গ্যাজেট ও টেক', labelEn: 'Gadgets & Tech', icon: 'Laptop', count: 2 },
  { id: 'beauty', label: 'বিউটি ও স্কিনকেয়ার', labelEn: 'Beauty & Skincare', icon: 'Sparkle', count: 1 },
  { id: 'food', label: 'খাবার ও রেস্টুরেন্ট', labelEn: 'Food & Restaurant', icon: 'Utensils', count: 1 },
  { id: 'luxury', label: 'জুয়েলারি ও লাক্সারি', labelEn: 'Luxury & Jewelry', icon: 'Crown', count: 1 },
  { id: 'pharmacy', label: 'ফার্মেসি ও হেলথ', labelEn: 'Health & Pharmacy', icon: 'HeartPulse', count: 1 },
  { id: 'kids', label: 'কিডস ও বেবি আইটেম', labelEn: 'Baby & Kids', icon: 'Baby', count: 1 },
  { id: 'home', label: 'হোম ও ফার্নিচার', labelEn: 'Home & Living', icon: 'Home', count: 1 },
  { id: 'sports', label: 'স্পোর্টস ও ফিটনেস', labelEn: 'Sports & Fitness', icon: 'Activity', count: 1 },
  { id: 'books', label: 'বই ও স্টেশনারি', labelEn: 'Books & Stationery', icon: 'BookOpen', count: 1 },
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
  },

  // ── 9. SUPERMARKET & DAILY DEALS ──
  {
    id: 'supermarket_deals',
    title: 'Mega Mart Superstore & Daily Savings',
    titleBn: 'মেগামার্ট সুপারস্টোর ও সুপার সেভিংস বাজার',
    category: 'grocery',
    categoryBn: 'মুদি ও কাঁচাবাজার',
    demoSubdomain: 'supermarket',
    themePresetId: 'fresh_grocery',
    headerStyle: 'search_first',
    footerStyle: 'classic_4col',
    primaryColor: '#16A34A',
    secondaryColor: '#14532D',
    accentColor: '#4ADE80',
    bgColor: '#F0FDF4',
    textColor: '#14532D',
    font: 'Inter',
    buttonRadius: '24px',
    cardRadius: '16px',
    badge: 'মেগা ভলিউম সেভিংস',
    badgeTheme: 'emerald',
    description: 'হাজারো পণ্যের ইনস্ট্যান্ট সার্চ, ডিল অফ দ্য ডে, ভলিউম সেভিংস ও দ্রুততম হোম ডেলিভারি।',
    bannerImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80',
    specialType: 'grocery',
    features: [
      'ডিল অফ দ্য ডে লাইভ স্টক কাউন্টার',
      'মাল্টি-ক্যাটাগরি সুপারস্টোর নেভিগেশন',
      'সুপার-ফাস্ট হোম ডেলিভারি ও স্লট বুকিং',
      'ডিজিটাল ক্যাশ অন ডেলিভারি ও বিকাশ পেমেন্ট'
    ],
    rating: 4.9,
    storesCount: 142,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'মেগা সেভিংস সুপারস্টোর',
      title: 'বাজারের সেরা দামে কিনুন প্রাত্যহিক গৃহস্থালি ও সুপারমার্কেট পণ্য',
      subtitle: 'এক ক্লিকেই প্রয়োজনীয় সব মুদি, প্রসাধন ও স্ন্যাকস অর্ডার করুন ঘরে বসেই।',
      ctaPrimary: 'অফারগুলো দেখুন',
      ctaSecondary: 'ডিল অফ দ্য ডে',
      imageUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=600&q=80'
    },
    tickerText: '🔥 মেগা ডিল: বাসমতি চাল ৫ কেজি ৳৫২০ | সূর্যমুখী তেল ৫ লিটার ৳৮৯০ | গুড়ো দুধ ১ কেজি ৳৭৫০',
    sampleCategories: [
      { id: 'sm1', name: 'রাইস ও ফ্লাওয়ার', icon: 'Package', count: '৫০+ আইটেম' },
      { id: 'sm2', name: 'কুকিং অয়েল ও ঘি', icon: 'Flame', count: '৩০+ ব্র্যান্ড' },
      { id: 'sm3', name: 'বেভারেজ ও জুস', icon: 'Coffee', count: '৪০+ ফ্লেভার' },
      { id: 'sm4', name: 'স্ন্যাকস ও বিস্কুট', icon: 'Sparkles', count: '৬০+ প্রকার' }
    ],
    sampleProducts: [
      { id: 'sm_p1', name: 'ফরচুন প্রিমিয়াম বাসমতি চাল (৫ কেজি প্যাক)', price: 540, oldPrice: 620, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', unit: '৫ কেজি', badge: 'মেগা সেভার' },
      { id: 'sm_p2', name: 'রূপচাঁদা ফর্টিফাইড সয়াবিন তেল (৫ লিটার জার)', price: 890, oldPrice: 960, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', unit: '৫ লিটার', badge: '১০% ছাড়' },
      { id: 'sm_p3', name: 'ডানো ডেইলি পুষ্টি ফুল ক্রিম মিল্ক পাউডার (১ কেজি)', price: 780, oldPrice: 850, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', unit: '১ কেজি', badge: 'জনপ্রিয়' },
      { id: 'sm_p4', name: 'নেসক্যাফে ক্লাসিক কফি জার (২০০ গ্রাম)', price: 620, oldPrice: 700, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', unit: '২০০ গ্রাম', badge: 'ইনস্ট্যান্ট' }
    ]
  },

  // ── 10. MODERN STREETWEAR & GEN-Z APPAREL ──
  {
    id: 'modern_streetwear',
    title: 'Urban Streetwear & Gen-Z Drops',
    titleBn: 'আরবান স্ট্রিটওয়্যার ও ট্রেন্ডি ড্রপস',
    category: 'fashion',
    categoryBn: 'পোশাক ও ফ্যাশন',
    demoSubdomain: 'streetwear',
    themePresetId: 'modern_minimal',
    headerStyle: 'classic',
    footerStyle: 'fashion_lifestyle',
    primaryColor: '#E11D48',
    secondaryColor: '#4C0519',
    accentColor: '#FB7185',
    bgColor: '#FFF1F2',
    textColor: '#1E293B',
    font: 'Montserrat',
    buttonRadius: '16px',
    cardRadius: '20px',
    badge: 'লিমিটেড ড্রপ',
    badgeTheme: 'rose',
    description: 'তারুণ্যের ট্রেন্ডি স্ট্রিট ফ্যাশন, ওভারসাইজড গ্রাফিক টিজ, কার্গো প্যান্টস ও স্নিকার্স কালেকশন।',
    bannerImage: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80',
    specialType: 'fashion',
    features: [
      'এক্সক্লুসিভ লিমিটেড এডিশন ড্রপস',
      'ইনস্টাগ্রাম লুকবুক ও শর্ট ভিডিও ফিড',
      'সাইজ চার্ট ও পারফেক্ট ফিট গাইড',
      'সারাদেশে ২-৩ দিনে ফাস্ট ক্যাশ অন ডেলিভারি'
    ],
    rating: 4.9,
    storesCount: 178,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'NEW DROP 2026',
      title: 'তারুণ্যের স্টাইলিশ স্ট্রিটওয়্যার ও ওভারসাইজড ড্রপস',
      subtitle: 'প্রিমিয়াম ২২০+ জিএসএম কম্বড কটন, নিখুঁত স্ক্রিন প্রিন্ট ও আর্বান কাট। নিজের ফ্যাশনে থাকুন সবার চেয়ে আলাদা।',
      ctaPrimary: 'নতুন ড্রপ দেখুন',
      ctaSecondary: 'লুকবুক ব্রাউজ করুন',
      imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80'
    },
    sampleCategories: [
      { id: 'st1', name: 'ওভারসাইজড টি-শার্ট', icon: 'Shirt', count: '৬০+ ডিজাইন' },
      { id: 'st2', name: 'ট্যাকটিক্যাল কার্গো', icon: 'Package', count: '২০+ কালার' },
      { id: 'st3', name: 'হুডি ও জ্যাকেট', icon: 'Zap', count: '৩০+ মডেল' },
      { id: 'st4', name: 'ক্যাপ ও স্নিকার্স', icon: 'Sparkles', count: '২৫+ স্টাইল' }
    ],
    sampleProducts: [
      { id: 'st_p1', name: 'সাইবারপাঙ্ক হেভিওয়েট ওভারসাইজড টি-শার্ট (২২০ জিএসএম)', price: 790, oldPrice: 990, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80', unit: '১ পিস', badge: 'হট ড্রপ' },
      { id: 'st_p2', name: 'আরবান মাল্টি-পকেট ট্যাকটিক্যাল কার্গো প্যান্ট', price: 1450, oldPrice: 1750, image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=400&q=80', unit: '১ পিস', badge: 'ট্রেন্ডিং' },
      { id: 'st_p3', name: 'মিনিমালিস্ট এম্ব্রয়ডারি হুডি উইথ ক্যাঙ্গারু পকেট', price: 1650, oldPrice: 1950, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&q=80', unit: '১ পিস', badge: 'বেস্টসেলার' },
      { id: 'st_p4', name: 'ক্লাসিক রেট্রো হাই-টপ স্ট্রিটওয়্যার স্নিকার্স', price: 2850, oldPrice: 3400, image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&q=80', unit: '১ জোড়া', badge: 'প্রিমিয়াম' }
    ]
  },

  // ── 11. SMART GADGETS & AUDIO GEAR ──
  {
    id: 'gadgets_audio',
    title: 'SoundWave Smart Gadgets & Audio',
    titleBn: 'সাউন্ডওয়েভ স্মার্ট গ্যাজেটস ও হাই-ফাই অডিও',
    category: 'tech',
    categoryBn: 'গ্যাজেট ও টেক',
    demoSubdomain: 'gadgets',
    themePresetId: 'midnight_dark',
    headerStyle: 'electronics',
    footerStyle: 'electronics_tech',
    primaryColor: '#06B6D4',
    secondaryColor: '#0F172A',
    accentColor: '#22D3EE',
    bgColor: '#0B1120',
    textColor: '#F8FAFC',
    font: 'Inter',
    buttonRadius: '14px',
    cardRadius: '18px',
    badge: 'অফিসিয়াল ওয়্যারেন্টি',
    badgeTheme: 'cyan',
    description: 'এএনসি ওয়্যারলেস ইয়ারবাডস, ব্লুটুথ স্পিকার, স্মার্টওয়াচ ও গেমিং এক্সেসরিজ সরাসরি অফিসিয়াল ওয়্যারেন্টি সহ।',
    bannerImage: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
    specialType: 'tech',
    features: [
      'অ্যাক্টিভ নয়েজ ক্যান্সেলেশন (ANC) অডিও শোকেস',
      '১০০% অথেনটিক গ্যাজেটস ও অফিসিয়াল ওয়ারেন্টি',
      'রিয়েলটাইম আনবক্সিং ভিডিও রিলস ফিড',
      'ফাস্ট ডেলিভারি ও ইনস্ট্যান্ট রিপ্লেসমেন্ট গ্যারান্টি'
    ],
    rating: 4.9,
    storesCount: 165,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'HI-RES AUDIO & TECH',
      title: 'স্মার্ট লাইফস্টাইলের সেরা প্রিমিয়াম সাউন্ড ও গ্যাজেটস',
      subtitle: 'ডিপ বাস, অ্যাক্টিভ নয়েজ ক্যান্সেলেশন ও লং ব্যাটারি লাইফ। প্রতিটি মিউজিক নোট শুনুন স্টুডিও কোয়ালিটিতে।',
      ctaPrimary: 'গ্যাজেটস এক্সপ্লোর করুন',
      ctaSecondary: 'অডিও কালেকশন',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'
    },
    sampleCategories: [
      { id: 'gd1', name: 'TWS ইয়ারবাডস', icon: 'Zap', count: '৪০+ মডেল' },
      { id: 'gd2', name: 'হেডফোন ও হেডসেট', icon: 'Sparkles', count: '২৫+ মডেল' },
      { id: 'gd3', name: 'স্মার্ট ওয়াচ', icon: 'Activity', count: '৩৫+ মডেল' },
      { id: 'gd4', name: 'পাওয়ার ব্যাংক ও চার্জার', icon: 'Battery', count: '৩০+ আইটেম' }
    ],
    sampleProducts: [
      { id: 'gd_p1', name: 'SoundWave প্রো অ্যাক্টিভ নয়েজ ক্যান্সেলেশন TWS বাডস', price: 2950, oldPrice: 3500, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80', unit: '১ কিট', badge: 'ANC 35dB' },
      { id: 'gd_p2', name: 'হাই-ফাই স্টুডিও ব্লুটুথ ওভার-ইয়ার হেডফোন (৫০ ঘণ্টা ব্যাটারি)', price: 4200, oldPrice: 4800, image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80', unit: '১ পিস', badge: 'Hi-Res অডিও' },
      { id: 'gd_p3', name: 'আল্ট্রা-স্লিম AMOLED ডিসপ্লে ব্লুটুথ কলিং স্মার্টওয়াচ', price: 3400, oldPrice: 3950, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', unit: '১ পিস', badge: 'AMOLED' },
      { id: 'gd_p4', name: '৬৫ ওয়াট GaN সুপার-ফাস্ট ট্রিপল পোর্ট চার্জার', price: 1850, oldPrice: 2200, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80', unit: '১ পিস', badge: 'GaN ফাস্ট' }
    ]
  },

  // ── 12. HOME LIVING & DECOR ──
  {
    id: 'home_living',
    title: 'Nordic Living & Home Aesthetics',
    titleBn: 'নর্ডিক লিভিং ও আধুনিক হোম ডেকর',
    category: 'home',
    categoryBn: 'হোম ও ফার্নিচার',
    demoSubdomain: 'homeliving',
    themePresetId: 'modern_minimal',
    headerStyle: 'classic',
    footerStyle: 'modern_split',
    primaryColor: '#CC5500',
    secondaryColor: '#7C2D12',
    accentColor: '#F97316',
    bgColor: '#FFFBEB',
    textColor: '#1E293B',
    font: 'Montserrat',
    buttonRadius: '12px',
    cardRadius: '18px',
    badge: 'হস্তশিল্প ও নান্দনিক',
    badgeTheme: 'amber',
    description: 'IKEA অনুপ্রাণিত নর্ডিক মিনিমালিজম, হোম ডেকর, কিচেনওয়্যার, কিউরেটেড হ্যান্ডমেড আর্ট ও প্রিমিয়াম ফার্নিচার।',
    bannerImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80',
    specialType: 'home',
    features: [
      '৫০/৫০ স্প্লিট স্ক্রিন ইন্টেরিয়র শোকেস',
      'হস্তশিল্প কাঠের পণ্য ও সিরামিক ভেস',
      '১০০% কটন বেডিং ও অর্থোপেডিক পিলো',
      'নিরাপদ ও সুরক্ষিত হোম ডেলিভারি প্যাকেজিং'
    ],
    rating: 4.8,
    storesCount: 88,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'AESTHETIC LIVING',
      title: 'আপনার ঘরকে সাজিয়ে তুলুন স্নিগ্ধ ও নান্দনিক শৈলীতে',
      subtitle: 'প্রাকৃতিক কাঠ, নরম টেক্সটাইল ও আধুনিক ডিজাইনের মেলবন্ধনে তৈরি হোম ডেকর কালেকশন।',
      ctaPrimary: 'হোম কালেকশন দেখুন',
      ctaSecondary: 'মুড বোর্ড এক্সপ্লোর করুন',
      imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80'
    },
    sampleCategories: [
      { id: 'hl1', name: 'লিভিং রুম ডেকর', icon: 'Home', count: '৪৫+ আইটেম' },
      { id: 'hl2', name: 'বেডশিট ও কুশন', icon: 'Package', count: '৩০+ ডিজাইন' },
      { id: 'hl3', name: 'কিচেন ও ডাইনিং', icon: 'Utensils', count: '৩৫+ পণ্য' },
      { id: 'hl4', name: 'ল্যাম্প ও লাইটিং', icon: 'Zap', count: '২০+ স্টাইল' }
    ],
    sampleProducts: [
      { id: 'hl_p1', name: 'মিনিমালিস্ট নর্ডিক হ্যান্ডমেড সিরামিক ফ্লাওয়ার ভেস', price: 850, oldPrice: 1100, image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=400&q=80', unit: '১ পিস', badge: 'হ্যান্ডমেড' },
      { id: 'hl_p2', name: '১০০% পিওর কটন কিং সাইজ ডিজাইনার বেডশিট সেট (৪ পার্ট)', price: 1850, oldPrice: 2250, image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80', unit: '১ সেট', badge: '১০০% কটন' },
      { id: 'hl_p3', name: 'ন্যাচারাল ব্যাম্বু উডেন ল্যাম্প উইথ ওয়ার্ম লাইটিং', price: 1450, oldPrice: 1800, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80', unit: '১ পিস', badge: 'ওয়ার্ম লাইট' },
      { id: 'hl_p4', name: 'বোোহো স্টাইল হ্যান্ড-ওভেন ম্যাক্রাম কুশন কভার (সেট অব ২)', price: 950, oldPrice: 1200, image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&q=80', unit: '২ পিস সেট', badge: 'নান্দনিক' }
    ]
  },

  // ── 13. SPORTS & FITNESS ATHLETICS ──
  {
    id: 'sports_fitness',
    title: 'IronCore Fitness & Activewear Gear',
    titleBn: 'আয়রনকোর ফিটনেস গিয়ার ও স্পোর্টস নিউট্রিশন',
    category: 'sports',
    categoryBn: 'স্পোর্টস ও ফিটনেস',
    demoSubdomain: 'fitness',
    themePresetId: 'modern_minimal',
    headerStyle: 'classic',
    footerStyle: 'classic_4col',
    primaryColor: '#EA580C',
    secondaryColor: '#18181B',
    accentColor: '#F97316',
    bgColor: '#FFF7ED',
    textColor: '#18181B',
    font: 'Outfit',
    buttonRadius: '24px',
    cardRadius: '16px',
    badge: '১০০% অথেনটিক নিউট্রিশন',
    badgeTheme: 'orange',
    description: 'জিম ও হোম ওয়ার্কআউট ইকুইপমেন্ট, ড্রাই-ফিট অ্যাক্টিভওয়্যার ও বিশ্বমানের প্রোটিন সাপ্লিমেন্ট।',
    bannerImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
    specialType: 'sports',
    features: [
      '১০০% জেনুইন আন্তর্জাতিক সাপ্লিমেন্ট ভেরিফিকেশন',
      'ড্রাই-ফিট ব্রিদেবল অ্যাথলেটিক টি-শার্ট ও জগার্স',
      'প্রফেশনাল ডাম্বেল, রেজিস্ট্যান্স ব্যান্ড ও ইকুইপমেন্ট',
      'ফিটনেস ট্রেইনার রিকমেন্ডেড বান্ডেল প্যাক'
    ],
    rating: 4.9,
    storesCount: 75,
    isActive: true,
    featuredOnHome: false,
    hero: {
      tag: 'FUEL YOUR PASSION',
      title: 'সেরা ফিটনেস গিয়ার ও সাপ্লিমেন্টে গড়ুন আপনার পারফেক্ট বডি',
      subtitle: 'আন্তর্জাতিক সার্টিফাইড নিউট্রিশন ও টেকসই ওয়ার্কআউট গিয়ার। নিজের ফিটনেস লক্ষ্যে পৌঁছান দ্রুত।',
      ctaPrimary: 'গিয়ার ব্রাউজ করুন',
      ctaSecondary: 'সাপ্লিমেন্ট দেখুন',
      imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80'
    },
    sampleCategories: [
      { id: 'sp1', name: 'হুই প্রোটিন ও ক্রিয়েটিন', icon: 'Flame', count: '৩০+ ব্র্যান্ড' },
      { id: 'sp2', name: 'ড্রাই-ফিট স্পোর্টসওয়্যার', icon: 'Shirt', count: '৫০+ আইটেম' },
      { id: 'sp3', name: 'ডাম্বেল ও কেটলবেল', icon: 'Activity', count: '২০+ ওজন' },
      { id: 'sp4', name: 'জিম এক্সেসরিজ ও গ্লাভস', icon: 'Sparkles', count: '২৫+ পণ্য' }
    ],
    sampleProducts: [
      { id: 'sp_p1', name: 'গোল্ড স্ট্যান্ডার্ড ১০০% হুই প্রোটিন আইসোলেট (৫ পাউন্ড)', price: 8200, oldPrice: 9200, image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=400&q=80', unit: '৫ পাউন্ড', badge: 'অথেনটিক' },
      { id: 'sp_p2', name: 'প্রো ড্রাই-ফিট অ্যান্টি-সয়েট জিম টি-শার্ট ও শর্টস কম্বো', price: 850, oldPrice: 1100, image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80', unit: '১ সেট', badge: 'ড্রাই-ফিট' },
      { id: 'sp_p3', name: 'এডজাস্টেবল রাবার-কোটেড ডাম্বেল সেট (২০ কেজি)', price: 3400, oldPrice: 4000, image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400&q=80', unit: '২০ কেজি সেট', badge: 'হেভি ডিউটি' },
      { id: 'sp_p4', name: 'মাইক্রোনাইজড ক্রিয়েটিন পাউডার (৩০০ গ্রাম)', price: 2100, oldPrice: 2450, image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80', unit: '৩০০ গ্রাম', badge: 'পিউর পাওয়ার' }
    ]
  },

  // ── 14. BOOKS & STATIONERY ──
  {
    id: 'books_stationery',
    title: 'Boipoka Bookhouse & Creative Stationery',
    titleBn: 'বইপোকা বুকহাউস ও ক্রিয়েটিভ স্টেশনারি',
    category: 'books',
    categoryBn: 'বই ও স্টেশনারি',
    demoSubdomain: 'books',
    themePresetId: 'clean_commerce',
    headerStyle: 'mega_nav',
    footerStyle: 'classic_4col',
    primaryColor: '#4338CA',
    secondaryColor: '#1E1B4B',
    accentColor: '#6366F1',
    bgColor: '#EEF2FF',
    textColor: '#1E1B4B',
    font: 'Hind Siliguri',
    buttonRadius: '8px',
    cardRadius: '14px',
    badge: 'রকমারি বই ও স্টেশনারি',
    badgeTheme: 'indigo',
    description: 'বেস্টসেলার সাহিত্য, অনুবাদ, আত্মউন্নয়ন, ইসলামিক বই ও প্রিমিয়াম আর্ট স্টেশনারি কালেকশন।',
    bannerImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
    specialType: 'books',
    features: [
      'লেখক ও ক্যাটাগরি অনুযায়ী স্মার্ট বুক ফিল্টার',
      'প্রিমিয়াম পেপারব্যাক ও হার্ডকভার এডিশন',
      'আর্ট জার্নাল, ফাউন্টেন পেন ও ক্যালিগ্রাফি কিট',
      'বইপ্রেমীদের জন্য বিশেষ বুকমার্ক ও গিফট প্যাকেজিং'
    ],
    rating: 4.9,
    storesCount: 110,
    isActive: true,
    featuredOnHome: false,
    hero: {
      tag: 'জ্ঞান ও সাহিত্যের ভুবন',
      title: 'প্রিয় লেখকের পছন্দের বই ও নান্দনিক স্টেশনারি অর্ডার করুন',
      subtitle: 'উপন্যাস, মোটিভেশনাল, ধর্মীয় ও ক্যারিয়ারের বইয়ের বিশাল সমাহার সরাসরি আপনার ঠিকানায়।',
      ctaPrimary: 'বইয়ের তালিকা দেখুন',
      ctaSecondary: 'বেস্টসেলার বই',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'
    },
    sampleCategories: [
      { id: 'bk1', name: 'উপন্যাস ও সাহিত্য', icon: 'BookOpen', count: '২০০+ বই' },
      { id: 'bk2', name: 'আত্মউন্নয়ন ও ক্যারিয়ার', icon: 'Sparkles', count: '৮০+ বই' },
      { id: 'bk3', name: 'ইসলামিক ও দ্বীনি বই', icon: 'Heart', count: '১২০+ বই' },
      { id: 'bk4', name: 'আর্ট ডায়েরি ও পেন', icon: 'Edit3', count: '৫০+ আইটেম' }
    ],
    sampleProducts: [
      { id: 'bk_p1', name: 'প্যারাডক্সিক্যাল সাজিদ ১ ও ২ কম্বো সেট (আরিফ আজাদ)', price: 580, oldPrice: 700, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80', unit: '২ বই সেট', badge: 'বেস্টসেলার' },
      { id: 'bk_p2', name: 'পারমাণবিক অভ্যাস (Atomic Habits বাংলা অনুবাদ)', price: 320, oldPrice: 400, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', unit: '১ বই', badge: 'অনুবাদ' },
      { id: 'bk_p3', name: 'ভিন্টেজ লেদার কাভারড হার্ডবাউন্ড ব্ল্যাঙ্ক আর্ট জার্নাল', price: 480, oldPrice: 600, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80', unit: '১ পিস', badge: 'ভিন্টেজ' },
      { id: 'bk_p4', name: 'লাক্সারি মেটালিক ফাউন্টেন পেন উইথ ব্ল্যাক ইঙ্ক পট', price: 850, oldPrice: 1100, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80', unit: '১ সেট', badge: 'লাক্সারি' }
    ]
  },

  // ── 15. BABY & KIDS TOYS WONDERLAND ──
  {
    id: 'baby_kids',
    title: 'LittleAngels Baby Care & Kids Toys',
    titleBn: 'লিটলঅ্যাঞ্জেলস বেবি কেয়ার ও কিডস টয়স',
    category: 'kids',
    categoryBn: 'কিডস ও বেবি আইটেম',
    demoSubdomain: 'babykids',
    themePresetId: 'clean_commerce',
    headerStyle: 'grocery_quick',
    footerStyle: 'classic_4col',
    primaryColor: '#F43F5E',
    secondaryColor: '#881337',
    accentColor: '#FB7185',
    bgColor: '#FFF1F2',
    textColor: '#881337',
    font: 'Hind Siliguri',
    buttonRadius: '20px',
    cardRadius: '20px',
    badge: '১০০% শিশুর জন্য নিরাপদ',
    badgeTheme: 'rose',
    description: 'বিপিএ-মুক্ত ফিডিং বোতল, ডায়াপার বান্ডেল, স্কিনকেয়ার লোশন, শিক্ষণীয় খেলনা ও বেবি ক্লোথিং।',
    bannerImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80',
    specialType: 'kids',
    features: [
      '১০০% বিপিএ-মুক্ত ও শিশু বান্ধব উপাদান গ্যারান্টি',
      'মাসিক ডায়াপার ও বেবি ওয়াইপস মেগা সেভিংস প্যাক',
      'শিক্ষণীয় ও বুদ্ধি বিকাশের মন্টেসরি টয়স কালেকশন',
      'সংবেদনশীল ত্বকের জন্য চর্মরোগ বিশেষজ্ঞ অনুমোদিত লোশন'
    ],
    rating: 4.9,
    storesCount: 118,
    isActive: true,
    featuredOnHome: true,
    hero: {
      tag: 'আপনার সোনামণির সেরা যত্ন',
      title: 'শিশুর আরাম ও সুরক্ষায় প্রিমিয়াম বেবি কেয়ার ও খেলনা',
      subtitle: 'নবজাতক থেকে শুরু করে বাড়ন্ত শিশুদের জন্য সেরা ব্র্যান্ডের জামাকাপড়, নিরাপদ খাবার সামগ্রী ও খেলনা।',
      ctaPrimary: 'বেবি আইটেম দেখুন',
      ctaSecondary: 'ডায়াপার বান্ডেল',
      imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80'
    },
    sampleCategories: [
      { id: 'kd1', name: 'ডায়াপার ও ওয়াইপস', icon: 'Package', count: '৩০+ ব্র্যান্ড' },
      { id: 'kd2', name: 'ফিডিং ও বোতল', icon: 'Sparkles', count: '৪০+ আইটেম' },
      { id: 'kd3', name: 'বেবি লোশন ও তেল', icon: 'Heart', count: '২৫+ প্রোডাক্ট' },
      { id: 'kd4', name: 'শিক্ষণীয় খেলনা', icon: 'Zap', count: '৫০+ খেলনা' }
    ],
    sampleProducts: [
      { id: 'kd_p1', name: 'প্যাম্পার্স অ্যাক্টিভ বেবি ডায়াপার লার্জ সাইজ (৫৬ পিস প্যাক)', price: 1750, oldPrice: 1950, image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80', unit: '৫৬ পিস প্যাক', badge: 'মেগা সেভার' },
      { id: 'kd_p2', name: 'ফিলিপস এভেন্ট বিপিএ-ফ্রি অ্যান্টি-কোলিক ফিডিং বোতল (২৬০ মিলি)', price: 950, oldPrice: 1150, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', unit: '১ পিস', badge: 'বিপিএ মুক্ত' },
      { id: 'kd_p3', name: 'মন্টেসরি কাঠের শিক্ষণীয় জিগস পাজল ও সেভ ট্র্যাকার', price: 650, oldPrice: 800, image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&q=80', unit: '১ সেট', badge: 'লার্নিং' },
      { id: 'kd_p4', name: 'সেবাফার্ম বেবি ক্লেনজিং বার ও শ্যাম্পু কম্বো প্যাক', price: 820, oldPrice: 950, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80', unit: '১ কম্বো', badge: 'ডাক্তার পছন্দ' }
    ]
  }
];

export function getMergedTemplates(templatesOrConfig, maybeDeletedIds = []) {
  let globalConfigTemplates = templatesOrConfig;
  let deletedTemplateIds = maybeDeletedIds;

  // If caller passed full globalConfig object instead of just websiteTemplates array
  if (templatesOrConfig && typeof templatesOrConfig === 'object' && !Array.isArray(templatesOrConfig)) {
    if ('websiteTemplates' in templatesOrConfig || 'deletedTemplateIds' in templatesOrConfig) {
      globalConfigTemplates = templatesOrConfig.websiteTemplates;
      deletedTemplateIds = templatesOrConfig.deletedTemplateIds || [];
    }
  }

  const deletedSet = new Set(Array.isArray(deletedTemplateIds) ? deletedTemplateIds : []);

  const customList = Array.isArray(globalConfigTemplates) ? globalConfigTemplates : [];
  customList.forEach(t => {
    if (t && (t.isDeleted || t.deleted)) {
      deletedSet.add(t.id);
    }
  });

  const customMap = new Map();
  customList.forEach(t => {
    if (t && t.id) customMap.set(t.id, t);
  });

  // 1. Process default templates excluding deleted ones
  const mergedDefaults = DEFAULT_WEBSITE_TEMPLATES
    .filter(def => !deletedSet.has(def.id))
    .map(def => {
      const custom = customMap.get(def.id) || customMap.get(def.demoSubdomain);
      if (!custom) return def;
      // Deep merge so rich features (specialType, sampleCategories, sampleProducts, concerns, reels, bundle, etc.) are never lost
      return {
        ...def,
        ...custom,
        sampleCategories: (custom.sampleCategories && custom.sampleCategories.length > 0) ? custom.sampleCategories : def.sampleCategories,
        sampleProducts: (custom.sampleProducts && custom.sampleProducts.length > 0) ? custom.sampleProducts : def.sampleProducts,
        concerns: (custom.concerns && custom.concerns.length > 0) ? custom.concerns : def.concerns,
        reels: (custom.reels && custom.reels.length > 0) ? custom.reels : def.reels,
        bundle: custom.bundle || def.bundle,
        specialType: custom.specialType || def.specialType,
        hero: { ...def.hero, ...(custom.hero || {}) },
        features: (custom.features && custom.features.length > 0) ? custom.features : def.features,
        thumbnail: custom.thumbnail || def.thumbnail,
        bannerImage: custom.bannerImage || def.bannerImage,
      };
    });

  // 2. Add brand-new custom templates created in Superadmin that aren't in DEFAULT_WEBSITE_TEMPLATES
  const defaultIds = new Set(DEFAULT_WEBSITE_TEMPLATES.map(d => d.id));
  const brandNewCustoms = customList.filter(t => t && t.id && !defaultIds.has(t.id) && !deletedSet.has(t.id));

  return [...mergedDefaults, ...brandNewCustoms];
}

export function findTemplateByIdOrSlug(idOrSlug, customTemplates) {
  const templates = getMergedTemplates(customTemplates);
  return (
    templates.find(t => t.id === idOrSlug || t.demoSubdomain === idOrSlug) ||
    templates[0]
  );
}

export function getDemoUrl(template, origin = '') {
  if (!template) return '/templates';
  if (template.customDemoUrl && template.customDemoUrl.startsWith('http')) {
    return template.customDemoUrl;
  }
  // Return the live interactive preview URL directly so it NEVER 404s
  return `/templates/preview/${template.id}`;
}
