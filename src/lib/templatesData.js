// src/lib/templatesData.js
// Universal Website Templates & Readymade Storefront Showcase for bdretailers.com

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'সব ডিজাইন (All)', labelEn: 'All Designs', icon: 'Sparkles', count: 12 },
  { id: 'grocery', label: 'গ্রোসারি ও কাঁচাবাজার', labelEn: 'Grocery & Organic', icon: 'ShoppingBag', count: 3 },
  { id: 'fashion', label: 'পোশাক ও ফ্যাশন', labelEn: 'Fashion & Boutique', icon: 'Shirt', count: 3 },
  { id: 'tech', label: 'গ্যাজেট ও টেক', labelEn: 'Gadgets & Tech', icon: 'Laptop', count: 2 },
  { id: 'beauty', label: 'বিউটি ও স্কিনকেয়ার', labelEn: 'Beauty & Skincare', icon: 'Sparkle', count: 1 },
  { id: 'food', label: 'খাবার ও রেস্টুরেন্ট', labelEn: 'Food & Restaurant', icon: 'Utensils', count: 1 },
  { id: 'luxury', label: 'জুয়েলারি ও লাক্সারি', labelEn: 'Luxury & Jewelry', icon: 'Crown', count: 1 },
  { id: 'pharmacy', label: 'ফার্মেসি ও হেলথ', labelEn: 'Health & Pharmacy', icon: 'HeartPulse', count: 1 },
  { id: 'kids', label: 'কিডস ও বেবি আইটেম', labelEn: 'Baby & Kids', icon: 'Baby', count: 1 },
  { id: 'b2b', label: 'পাইকারি ও বিটুবি', labelEn: 'B2B & Wholesale', icon: 'Building2', count: 1 },
  { id: 'home', label: 'হোম ও ফার্নিচার', labelEn: 'Home & Decor', icon: 'Armchair', count: 1 },
];

export const DEFAULT_WEBSITE_TEMPLATES = [
  {
    id: 'fresh_grocery',
    title: 'Fresh Grocery & Organic Mart',
    titleBn: 'ফ্রেশ গ্রোসারি ও অর্গানিক বাজার',
    category: 'grocery',
    categoryBn: 'গ্রোসারি',
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
    cardRadius: '16px',
    badge: 'বেস্টসেলার',
    badgeTheme: 'emerald',
    description: 'চমৎকার স্পিড, দ্রুত প্রোডাক্ট ফিল্টারিং, ক্যাটাগরি সাইডবার এবং সরাসরি বিকাশ/নগদ চেকআউট সমর্থিত অর্গানিক গ্রোসারি থিম।',
    features: [
      '১-ক্লিক ক্যাটাগরি ব্রাউজিং ও সার্চ',
      'ওজন ও কেজি ভিত্তিক ফ্লেক্সিবল প্রাইসিং',
      'সরাসরি বিকাশ, নগদ ও ক্যাশ অন ডেলিভারি',
      'Steadfast অটো পার্সেল বুকিং সিস্টেম',
      'অ্যান্ড্রয়েড মোবাইল অ্যাপ ও PWA প্রস্তুত'
    ],
    rating: 4.9,
    storesCount: 184,
    isActive: true,
    featuredOnHome: true,
    thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    sampleProducts: [
      { id: 'g1', name: 'প্রিমিয়াম বাসমতি চাল (৫ কেজি)', price: 650, oldPrice: 720, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', unit: '৫ কেজি' },
      { id: 'g2', name: 'খাটি সরিষার তেল (১ লিটার)', price: 290, oldPrice: 320, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', unit: '১ লিটার' },
      { id: 'g3', name: 'ফার্ম ফ্রেশ ব্রাউন ডিম (১ ডজন)', price: 165, oldPrice: 180, image: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=400&q=80', unit: '১২ টি' },
      { id: 'g4', name: 'সুন্দরবনের প্রাকৃতিক মধু (৫০০ গ্রাম)', price: 580, oldPrice: 650, image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80', unit: '৫০০ গ্রাম' }
    ]
  },
  {
    id: 'fashion_editorial',
    title: 'Vogue Editorial Couture & Boutique',
    titleBn: 'লাক্সারি ফ্যাশন এডিটোরিয়াল ও বুটিক',
    category: 'fashion',
    categoryBn: 'ফ্যাশন',
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
    badge: 'ট্রেন্ডিং',
    badgeTheme: 'rose',
    description: 'বড় লুকবুক ব্যানার, সাইজ ও কালার ভ্যারিয়েন্ট সিলেক্টর, ইন্সটাগ্রাম রিলস ফিড ও আভিজাত্যপূর্ণ ওয়াইন গোল্ড প্যালেট।',
    features: [
      'লুকবুক ও হাই-ফ্যাশন স্টোরি সেকশন',
      'সাইজ ও কালার লাইভ ফটো সুইচিং',
      'শপেবল ভিডিও রিলস ও মডেল ক্যাটালগ',
      'সরাসরি ইনস্টাগ্রাম পোস্ট ও ফটো রিভিউ',
      'হাই-কনভার্টিং দ্রুত চেকআউট ফর্ম'
    ],
    rating: 5.0,
    storesCount: 215,
    isActive: true,
    featuredOnHome: true,
    thumbnail: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
    sampleProducts: [
      { id: 'f1', name: 'রয়্যাল বেনারসি সিল্ক শাড়ি', price: 6800, oldPrice: 8500, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80', unit: '১ পিস' },
      { id: 'f2', name: 'ডিজাইনার হ্যান্ডক্রাফটেড কুর্তি', price: 2450, oldPrice: 3200, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&q=80', unit: '১ পিস' },
      { id: 'f3', name: 'প্রিমিয়াম জ্যাকার্ড পাঞ্জাবি', price: 3400, oldPrice: 4200, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80', unit: '১ পিস' },
      { id: 'f4', name: 'লেদার ক্ল্যাচ ব্যাগ ও পার্স', price: 1850, oldPrice: 2300, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80', unit: '১ পিস' }
    ]
  },
  {
    id: 'supermarket_deals',
    title: 'Messer Bazar Super Store',
    titleBn: 'মেসার্স বাজার মেগা স্টোর',
    category: 'grocery',
    categoryBn: 'গ্রোসারি',
    demoSubdomain: 'messerbazar',
    themePresetId: 'bold_marketplace',
    headerStyle: 'search_first',
    footerStyle: 'classic_4col',
    primaryColor: '#DC2626',
    secondaryColor: '#450A0A',
    accentColor: '#F59E0B',
    bgColor: '#FFFBEB',
    textColor: '#1C1917',
    font: 'Outfit',
    buttonRadius: '8px',
    cardRadius: '12px',
    badge: 'লাইভ স্টোর',
    badgeTheme: 'red',
    description: 'মেসার্স বাজার স্টাইলে লাইভ ডিলস, প্রতিদিনের সেরা ছাড়, ফ্ল্যাশ সেল কাউন্টার ও দ্রুত লোকাল ডেলিভারি।',
    features: [
      'সরাসরি messerbazar.bdretailers.com লাইভ ডেমো',
      'ঘণ্টার ফ্ল্যাশ সেল কাউন্টডাউন টাইমার',
      'ডিল অফ দ্য ডে হাইলাইট সেকশন',
      'ইনস্ট্যান্ট লোকাল এরিয়া দ্রুত ডেলিভারি',
      'গুগল প্লে স্টোর অ্যাপ বিল্ডার রেডি'
    ],
    rating: 5.0,
    storesCount: 240,
    isActive: true,
    featuredOnHome: true,
    thumbnail: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80',
    sampleProducts: [
      { id: 'mb1', name: 'রূপচাঁদা সয়াবিন তেল (৫ লিটার)', price: 840, oldPrice: 890, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', unit: '৫ লিটার' },
      { id: 'mb2', name: 'চাষী চিনিগুঁড়া চাল (১ কেজি)', price: 145, oldPrice: 160, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', unit: '১ কেজি' },
      { id: 'mb3', name: 'তাজা ব্রয়লার মুরগি (ড্রেসড)', price: 210, oldPrice: 230, image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80', unit: '১ কেজি' },
      { id: 'mb4', name: 'দেশি পেঁয়াজ (৫ কেজি বস্তা)', price: 380, oldPrice: 420, image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80', unit: '৫ কেজি' }
    ]
  },
  {
    id: 'tech_electronics',
    title: 'CyberTech & Next-Gen Gadgets',
    titleBn: 'নেক্সট-জেন টেক ও গ্যাজেটস',
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
    badge: 'পপুলার',
    badgeTheme: 'blue',
    description: 'Star Tech ও Apple স্টাইলের শার্প স্পেসিফিকেশন টেবিল, ডার্ক মিডনাইট অ্যাকসেন্ট এবং গ্যাজেট কম্প্যারিজম মোড।',
    features: [
      'নিখুঁত টেকনিক্যাল স্পেসিফিকেশন টেবিল',
      'ওয়ারেন্টি ও ইএমআই ইনফো ব্যাজ',
      'সিরিয়াল ও কালার ভ্যারিয়েন্ট স্টক ট্র্যাকিং',
      'লাইভ এআই প্রোডাক্ট রেকমেন্ডেশন',
      'মোবাইল ফ্রেন্ডলি রেসপন্সিভ ডিজাইন'
    ],
    rating: 4.9,
    storesCount: 156,
    isActive: true,
    featuredOnHome: true,
    thumbnail: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80',
    sampleProducts: [
      { id: 't1', name: 'Anker Soundcore Space One ANC', price: 9500, oldPrice: 11500, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', unit: '১ টি' },
      { id: 't2', name: 'Xiaomi Smart Band 8 Pro AMOLED', price: 5800, oldPrice: 6500, image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&q=80', unit: '১ টি' },
      { id: 't3', name: 'Baseus Blade 100W Power Bank', price: 4200, oldPrice: 4800, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80', unit: '১ টি' },
      { id: 't4', name: 'Logitech MX Master 3S Wireless', price: 11800, oldPrice: 13500, image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80', unit: '১ টি' }
    ]
  },
  {
    id: 'luxury_beauty',
    title: 'Radiance Dewy Beauty & Skincare',
    titleBn: 'রেডিয়েন্স স্কিনকেয়ার ও বিউটি',
    category: 'beauty',
    categoryBn: 'বিউটি',
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
    badge: 'নতুন',
    badgeTheme: 'pink',
    description: 'সফট রোজ গোল্ড আভা, বিফোর-আফটার স্লাইডার, স্কিনকেয়ার রুটিন গাইড এবং কাস্টমার ফটো রিভিউ গ্রিড।',
    features: [
      'বিফোর ও আফটার রেজাল্ট স্লাইডার',
      'স্কিন টাইপ ও কসমেটিক ফিল্টার',
      'ভেরিফাইড কাস্টমার ফটো রিভিউ',
      'কম্বো স্কিনকেয়ার বান্ডেল অফার',
      'ইনস্ট্যান্ট মেসেঞ্জার / হোয়াটসঅ্যাপ চ্যাট'
    ],
    rating: 4.8,
    storesCount: 98,
    isActive: true,
    featuredOnHome: true,
    thumbnail: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    sampleProducts: [
      { id: 'b1', name: 'Hyaluronic Acid Hydrating Serum (30ml)', price: 1250, oldPrice: 1600, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80', unit: '30ml' },
      { id: 'b2', name: 'Centella Calming Gel Moisturizer', price: 1450, oldPrice: 1850, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80', unit: '100ml' },
      { id: 'b3', name: 'SPF 50+ Invisible Sunscreen Matte', price: 990, oldPrice: 1300, image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80', unit: '50ml' },
      { id: 'b4', name: 'Rose Water Glowing Face Toner', price: 650, oldPrice: 850, image: 'https://images.unsplash.com/photo-1608248597359-299318182743?w=400&q=80', unit: '150ml' }
    ]
  },
  {
    id: 'restaurant_food',
    title: 'Sunset Food & Express Dine',
    titleBn: 'ফুড এক্সপ্রেস ও রেস্টুরেন্ট মেনু',
    category: 'food',
    categoryBn: 'ফুড ও ক্যাফে',
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
    cardRadius: '18px',
    badge: 'হট ডিল',
    badgeTheme: 'orange',
    description: 'ক্ষুধা উদ্দীপক স্পাইসি অরেঞ্জ থিম, লাইভ ফুড মেনু ট্যাব, শেফ স্পেশাল কম্বো অফার ও ৩০-মিনিট ডেলিভারি কাউন্টার।',
    features: [
      'লাইভ মেনু ট্যাব ও স্পাইসি লেভেল ব্যাজ',
      'অ্যাড-অনস ও এক্সট্রা চিজ কাস্টমাইজেশন',
      'টেবিল পিকআপ অথবা হোম ডেলিভারি অপশন',
      'অটো কিচেন স্লিপ প্রিন্টিং সিস্টেম',
      'রিয়েল-টাইম লাইভ রাইডার ট্র্যাকিং'
    ],
    rating: 4.9,
    storesCount: 112,
    isActive: true,
    featuredOnHome: true,
    thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    sampleProducts: [
      { id: 'fd1', name: 'স্মোকি বারবিকিউ বিফ বার্গার কম্বো', price: 380, oldPrice: 450, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', unit: '১ মিল' },
      { id: 'fd2', name: '১২ ইঞ্চি চারকোল গ্রিলড চিকেন পিৎজা', price: 790, oldPrice: 950, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', unit: '১২ ইঞ্চি' },
      { id: 'fd3', name: 'হায়দ্রাবাদি স্পেশাল মাটন কাচ্চি বিরিয়ানি', price: 420, oldPrice: 480, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', unit: '১ প্লেট' },
      { id: 'fd4', name: 'চকলেট লাভা কেক সাথে ভ্যানিলা স্কুপ', price: 220, oldPrice: 260, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80', unit: '১ পিস' }
    ]
  },
  {
    id: 'jewelry_gold',
    title: 'Obsidian 24K Gold & Fine Jewelry',
    titleBn: 'অবসিডিয়ান গোল্ড ও লাক্সারি জুয়েলারি',
    category: 'luxury',
    categoryBn: 'লাক্সারি জুয়েলারি',
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
    badge: 'এক্সক্লুসিভ',
    badgeTheme: 'amber',
    description: 'অভিজাত ড্রামাটিক ব্ল্যাক ও ২৪কে গোল্ড ফিনিশ, জুম-ইন ডায়মন্ড প্রিভিউ এবং সার্টিফিকেট ভেরিফিকেশন ব্যাজ।',
    features: [
      '২৪ ক্যারেট গোল্ড ও ডায়মন্ড হলমার্কিং',
      'ম্যাক্রো জুম ফটো গ্যালারি',
      'কাস্টম রিং সাইজ চার্ট হেল্পার',
      'প্রিমিয়াম গিফট বক্স অপশন',
      'ভিআইপি ইনস্যুরেন্স ও কুরিয়ার সিকিউরিটি'
    ],
    rating: 5.0,
    storesCount: 64,
    isActive: true,
    featuredOnHome: true,
    thumbnail: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    sampleProducts: [
      { id: 'j1', name: '২২ ক্যারেট ক্লাসিক সলিটায়ার ডায়মন্ড রিং', price: 42000, oldPrice: 48000, image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=80', unit: '১ পিস' },
      { id: 'j2', name: 'রয়্যাল কুন্দন পার্ল নেকলেস সেট', price: 18500, oldPrice: 22000, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80', unit: '১ সেট' },
      { id: 'j3', name: '১৮কে রোজ গোল্ড চার্ম ব্রেসলেট', price: 14200, oldPrice: 16500, image: 'https://images.unsplash.com/photo-1611591475819-79b8b4a7098e?w=400&q=80', unit: '১ পিস' },
      { id: 'j4', name: 'ট্রেডিশনাল ঝুমকা গোল্ড প্লেটেড ইয়াররিংস', price: 3600, oldPrice: 4500, image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400&q=80', unit: '১ জোড়া' }
    ]
  },
  {
    id: 'health_pharmacy',
    title: 'CarePlus Pharmacy & Wellness',
    titleBn: 'কেয়ারপ্লাস ফার্মেসি ও ওয়েলনেস',
    category: 'pharmacy',
    categoryBn: 'ফার্মেসি',
    demoSubdomain: 'pharmacy',
    themePresetId: 'clean_commerce',
    headerStyle: 'search_first',
    footerStyle: 'trust_badge',
    primaryColor: '#0284C7',
    secondaryColor: '#082F49',
    accentColor: '#38BDF8',
    bgColor: '#FFFFFF',
    textColor: '#0F172A',
    font: 'Inter',
    buttonRadius: '12px',
    cardRadius: '16px',
    badge: 'জরুরি সেবা',
    badgeTheme: 'teal',
    description: 'প্রেসক্রিপশন আপলোড সুবিধা, জেনেরিক সার্চ, জরুরি ওটিসি মেডিসিন অর্ডার ও বিশ্বস্ত মেডিকেল স্ট্রিপ।',
    features: [
      'প্রেসক্রিপশন ছবি আপলোড অর্ডার সুবিধা',
      'জেনেরিক ও ব্র্যান্ড ড্রাগ দ্রুত সার্চ',
      'তাপমাত্রা-নিয়ন্ত্রিত প্যাকেজিং সিস্টেম',
      'ডোজ ও ব্যবহারবিধি বিস্তারিত বিবরণী',
      '২৪/৭ রেজিস্টার্ড ফার্মাসিস্ট হেল্পলাইন'
    ],
    rating: 4.9,
    storesCount: 87,
    isActive: true,
    featuredOnHome: false,
    thumbnail: 'https://images.unsplash.com/photo-1586015555751-63c2c544fa00?w=800&q=80',
    sampleProducts: [
      { id: 'p1', name: 'ডিজিটাল ব্লাড প্রেশার মনিটর আর্ম টাইপ', price: 2450, oldPrice: 2900, image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80', unit: '১ সেট' },
      { id: 'p2', name: 'ওমেগা-৩ ফিশ অয়েল সফটজেল (৬০ টি)', price: 1200, oldPrice: 1450, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', unit: '৬০ টি' },
      { id: 'p3', name: 'ভিটামিন সি + জিংক চিউয়েবল ট্যাবলেট', price: 350, oldPrice: 420, image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80', unit: '৩০ টি' },
      { id: 'p4', name: 'অ্যাকু-চেক ব্লাড গ্লুকোজ টেস্ট কিট', price: 1850, oldPrice: 2200, image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=80', unit: '১ কিট' }
    ]
  },
  {
    id: 'playful_kids',
    title: 'Kids Wonderland & Toy Haven',
    titleBn: 'কিডস ওয়ান্ডারল্যান্ড ও টয় হেভেন',
    category: 'kids',
    categoryBn: 'কিডস ও বেবি',
    demoSubdomain: 'kids',
    themePresetId: 'playful_kids',
    headerStyle: 'classic',
    footerStyle: 'classic_4col',
    primaryColor: '#F59E0B',
    secondaryColor: '#78350F',
    accentColor: '#0284C7',
    bgColor: '#FEF3C7',
    textColor: '#451A03',
    font: 'Poppins',
    buttonRadius: '50px',
    cardRadius: '24px',
    badge: 'ফান & কালারফুল',
    badgeTheme: 'yellow',
    description: 'বাচ্চা ও অভিভাবকদের পছন্দের ভাইব্রেন্ট প্যাস্টেল কালার, বয়স অনুযায়ী ফিল্টার এবং নিরাপদ খেলনা সার্টিফাইড।',
    features: [
      'বয়স ভিত্তিক ফিল্টারিং (০-১২ মাস, ১-৩ বছর)',
      '১০০% নন-টক্সিক ও চাইল্ড-সেফটি ব্যাজ',
      'ভিডিও খেলনা ডেমো ও আনবক্সিং শোকেস',
      'বার্থডে গিফট র‍্যাপিং ও গ্রিটিংস কার্ড',
      'ফ্যামিলি কম্বো সেভিংস অফার'
    ],
    rating: 4.8,
    storesCount: 76,
    isActive: true,
    featuredOnHome: false,
    thumbnail: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80',
    sampleProducts: [
      { id: 'k1', name: 'এডুকেশনাল উডেন বিল্ডিং ব্লকস সেট', price: 950, oldPrice: 1250, image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80', unit: '১ বক্স' },
      { id: 'k2', name: 'রিমোট কন্ট্রোল ৪x৪ মনস্টার ট্রাক', price: 1850, oldPrice: 2400, image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400&q=80', unit: '১ পিস' },
      { id: 'k3', name: 'বেবি সফট কটন স্লিপিং স্যুট (৩ প্যাক)', price: 1100, oldPrice: 1400, image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&q=80', unit: '৩ পিস' },
      { id: 'k4', name: 'ম্যাগনেটিক আর্ট ড্রয়িং ট্যাবলেট বোর্ড', price: 650, oldPrice: 850, image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&q=80', unit: '১ পিস' }
    ]
  },
  {
    id: 'wholesale_b2b',
    title: 'Apex Wholesale & B2B Trading',
    titleBn: 'অ্যাপেক্স পাইকারি ও বালক বিটুবি মার্কেট',
    category: 'b2b',
    categoryBn: 'পাইকারি বিটুবি',
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
    badge: 'বালক ট্রেড',
    badgeTheme: 'indigo',
    description: 'পরিমাণভিত্তিক ডিসকাউন্ট ল্যাডার (Tiered Pricing), মিনিমাম অর্ডার কোয়ান্টিটি (MOQ) ও ইনভয়েস জেনারেশন।',
    features: [
      'পরিমাণ বাড়ালে দাম কমার প্রাইস ল্যাডার',
      'ন্যূনতম অর্ডার (MOQ) বাধ্যবাধকতা',
      'জিএসটি / ভ্যাট ট্যাক্স ইনভয়েস সুবিধা',
      'কর্পোরেট কোটেশন রিকোয়েস্ট ফর্ম',
      'বালক পেমেন্ট ও ব্যাংক ট্রান্সফার'
    ],
    rating: 4.9,
    storesCount: 93,
    isActive: true,
    featuredOnHome: false,
    thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    sampleProducts: [
      { id: 'w1', name: 'প্রিমিয়াম এক্সপোর্ট জিন্স প্যান্ট (লট ৫০ পিস)', price: 27500, oldPrice: 32000, image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80', unit: '৫০ পিস' },
      { id: 'w2', name: 'কটন ড্রপশোল্ডার টি-শার্ট (লট ১০০ পিস)', price: 18000, oldPrice: 22000, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80', unit: '১০০ পিস' },
      { id: 'w3', name: 'ফাস্ট চার্জিং টাইপ-সি ক্যাবল (১০০ পিস বক্স)', price: 7500, oldPrice: 9500, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80', unit: '১০০ পিস' },
      { id: 'w4', name: 'কসমেটিক লিপস্টিক ডিসপ্লে বক্স (২৪ পিস)', price: 4200, oldPrice: 5200, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&q=80', unit: '২৪ পিস' }
    ]
  },
  {
    id: 'home_living',
    title: 'Scandi Living & Modern Decor',
    titleBn: 'স্ক্যান্ডি লিভিং ও হোম ফার্নিচার',
    category: 'home',
    categoryBn: 'ফার্নিচার ও হোম',
    demoSubdomain: 'homedecor',
    themePresetId: 'warm_organic',
    headerStyle: 'classic',
    footerStyle: 'modern_split',
    primaryColor: '#CC5500',
    secondaryColor: '#7C2D12',
    accentColor: '#D97706',
    bgColor: '#FFFBEB',
    textColor: '#451A03',
    font: 'Montserrat',
    buttonRadius: '12px',
    cardRadius: '16px',
    badge: 'মডার্ন হোম',
    badgeTheme: 'orange',
    description: '৫০/৫০ স্প্লিট শোকেস, কজি লিভিং স্পেস মুডবোর্ড, রুম ডেকোর আইডিয়া ও হেভি আইটেম ডেলিভারি ম্যানেজমেন্ট।',
    features: [
      'রুম ও স্পেস ভিত্তিক ক্যাটাগরি ভিউ',
      'ডাইমেনশন ও মেজারমেন্ট গাইড',
      'হোম ইন্সটলেশন সার্ভিস অপশন',
      'হাই-রেজোলিউশন ইন্টেরিয়র গ্যালারি',
      'কাস্টম ফেব্রিক ও উড কালার সিলেকশন'
    ],
    rating: 4.9,
    storesCount: 82,
    isActive: true,
    featuredOnHome: false,
    thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80',
    sampleProducts: [
      { id: 'h1', name: 'নরডিক মিনিমালিস্ট অ্যাকসেন্ট আর্মচেয়ার', price: 14500, oldPrice: 17000, image: 'https://images.unsplash.com/photo-1580481077167-336352347447?w=400&q=80', unit: '১ পিস' },
      { id: 'h2', name: 'সলভ উড কফি টেবিল উইথ মেটাল লেগস', price: 8200, oldPrice: 9800, image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&q=80', unit: '১ পিস' },
      { id: 'h3', name: 'হ্যান্ডওভেন জুট ফ্লোর রাগ কার্পেট', price: 3400, oldPrice: 4200, image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400&q=80', unit: '৫x৭ ফিট' },
      { id: 'h4', name: 'সিরামিক টেবিল ল্যাম্প ওয়ার্ম অ্যাম্বিয়েন্স', price: 2100, oldPrice: 2600, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80', unit: '১ পিস' }
    ]
  },
  {
    id: 'minimal_editorial',
    title: 'Monochrome Minimalist Gallery',
    titleBn: 'মনোক্রোম মিনিমাল গ্যালারি',
    category: 'fashion',
    categoryBn: 'ফ্যাশন',
    demoSubdomain: 'minimal',
    themePresetId: 'minimal_editorial',
    headerStyle: 'fashion_editorial',
    footerStyle: 'editorial_story',
    primaryColor: '#09090B',
    secondaryColor: '#27272A',
    accentColor: '#71717A',
    bgColor: '#FFFFFF',
    textColor: '#09090B',
    font: 'Montserrat',
    buttonRadius: '0px',
    cardRadius: '2px',
    badge: 'মিনিমালিস্ট',
    badgeTheme: 'slate',
    description: 'হোয়াইট স্পেস আর্ট গ্যালারি স্টাইল, শার্প এডিটোরিয়াল টাইপোগ্রাফি ও শান্ত প্রিমিয়াম শপিং অভিজ্ঞতা।',
    features: [
      'শার্প বর্ডার ও মনোক্রোম প্যালেট',
      'ডিসট্র্যাকশন-ফ্রি মিনিমাল ইউআই',
      'হাই-এন্ড ফটোগ্রাফি ফোকাস',
      'লাইটওয়েট আল্ট্রা ফাস্ট লোডিং',
      'আন্তর্জাতিক ফ্যাশন রানওয়ে ভাইব'
    ],
    rating: 4.8,
    storesCount: 54,
    isActive: true,
    featuredOnHome: false,
    thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    sampleProducts: [
      { id: 'm1', name: 'মোনোক্রোম আর্কিটেকচারাল কোট', price: 8900, oldPrice: 11000, image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80', unit: '১ পিস' },
      { id: 'm2', name: 'মিনিমালিস্ট লেদার স্নিকার্স হোয়াইট', price: 4500, oldPrice: 5500, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80', unit: '১ জোড়া' },
      { id: 'm3', name: 'ম্যাট ব্ল্যাক টাইটানিয়াম রিস্টওয়াচ', price: 6200, oldPrice: 7800, image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&q=80', unit: '১ পিস' },
      { id: 'm4', name: 'ক্লিন ক্যানভাস টোট ব্যাগ', price: 1600, oldPrice: 2000, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80', unit: '১ পিস' }
    ]
  }
];

/**
 * Get merged templates (customized from global config or defaults)
 */
export function getMergedTemplates(globalConfigTemplates) {
  if (Array.isArray(globalConfigTemplates) && globalConfigTemplates.length > 0) {
    return globalConfigTemplates;
  }
  return DEFAULT_WEBSITE_TEMPLATES;
}

/**
 * Get a specific template by ID or subdomain slug
 */
export function findTemplateByIdOrSlug(idOrSlug, customTemplates) {
  const templates = getMergedTemplates(customTemplates);
  return (
    templates.find(t => t.id === idOrSlug || t.demoSubdomain === idOrSlug) ||
    templates[0]
  );
}

/**
 * Resolve demo URL for a template
 */
export function getDemoUrl(template, origin = '') {
  if (!template) return 'https://bdretailers.com';
  if (template.customDemoUrl && template.customDemoUrl.startsWith('http')) {
    return template.customDemoUrl;
  }
  const slug = template.demoSubdomain || template.id;
  // If running in development or custom domain
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
      return `/shop/${slug}`;
    }
  }
  return `https://${slug}.bdretailers.com`;
}
