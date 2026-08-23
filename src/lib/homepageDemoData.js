/**
 * Realistic Bangladeshi Ecommerce Demo Data & Fallbacks
 * Ensures all homepage sections render beautifully in preview and storefront
 * even when the retailer hasn't populated custom products or content yet.
 */

export const DEMO_PRODUCTS = [
  {
    id: 'demo-prod-1',
    name: 'প্রিমিয়াম কাশ্মীরি এমব্রয়ডারি পাঞ্জাবি (Royal Black Edition)',
    category: 'Men Fashion',
    price: 2450,
    originalPrice: 3200,
    rating: 4.9,
    numReviews: 184,
    stock: 24,
    initialStock: 100,
    brand: 'Aarong Style',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=700&auto=format&fit=crop&q=80',
    ],
    description: 'প্রিমিয়াম কাশ্মীরি ফেব্রিক ও নিখুঁত সুতার কাজ। ঈদ ও বিশেষ অনুষ্ঠানের জন্য আভিজাত্যের প্রতীক।',
    variants: [
      { name: 'M (38)', price: 2450 },
      { name: 'L (40)', price: 2450 },
      { name: 'XL (42)', price: 2450 },
      { name: 'XXL (44)', price: 2550 },
    ],
  },
  {
    id: 'demo-prod-2',
    name: 'অর্গানিক ১০০% খাঁটি ঘানিভাঙা সরিষার তেল (১ লিটার)',
    category: 'Organic Grocery',
    price: 380,
    originalPrice: 450,
    rating: 4.8,
    numReviews: 312,
    stock: 45,
    initialStock: 120,
    brand: 'Khati Organics',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&auto=format&fit=crop&q=80',
    description: 'গ্রামের দেশি সরিষা থেকে কাঠের ঘানিতে ভাঙা ১০০% ভেজালমুক্ত ও ঝাঁঝালো সরিষার তেল।',
  },
  {
    id: 'demo-prod-3',
    name: 'ওয়্যারলেস নয়েজ ক্যানসেলিং হেডফোন (ANC Pro Edition)',
    category: 'Electronics',
    price: 1850,
    originalPrice: 2490,
    rating: 4.9,
    numReviews: 246,
    stock: 18,
    initialStock: 80,
    brand: 'Acoustic Labs',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
    description: 'হাই-ফাই বেস, ৪০ ঘণ্টা ব্যাটারি লাইফ ও অ্যাক্টিভ নয়েজ ক্যানসেলেশন প্রযুক্তি।',
    variants: [
      { name: 'Midnight Black', price: 1850 },
      { name: 'Silver White', price: 1850 },
    ],
  },
  {
    id: 'demo-prod-4',
    name: 'ভিটামিন সি গ্লো ফেস সিরাম (Radiant Skin 30ml)',
    category: 'Beauty & Skincare',
    price: 850,
    originalPrice: 1200,
    rating: 4.7,
    numReviews: 165,
    stock: 32,
    initialStock: 100,
    brand: 'Pure Bloom',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=700&auto=format&fit=crop&q=80',
    description: 'ত্বকের উজ্জ্বলতা বাড়াতে এবং ডার্ক স্পট দূর করতে প্রাকৃতিক অ্যান্টিঅক্সিডেন্ট ফর্মুলা।',
  },
  {
    id: 'demo-prod-5',
    name: 'স্মার্ট ফিটনেস ট্র্যাকার ওয়াচ (AMOLED HD Display)',
    category: 'Gadgets',
    price: 1990,
    originalPrice: 2750,
    rating: 4.8,
    numReviews: 98,
    stock: 12,
    initialStock: 60,
    brand: 'FitNova',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80',
    description: 'হার্ট রেট, SpO2 মনিটরিং, ১০০+ স্পোর্টস মোড এবং ওয়াটারপ্রুফ বডি।',
  },
  {
    id: 'demo-prod-6',
    name: 'হ্যান্ডক্র্যাফটেড পিওর লেদার ওয়ালেট (Classic Brown)',
    category: 'Accessories',
    price: 950,
    originalPrice: 1350,
    rating: 4.9,
    numReviews: 210,
    stock: 40,
    initialStock: 150,
    brand: 'Bengal Leather',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=700&auto=format&fit=crop&q=80',
    description: 'জেনুইন কাউহাইড লেদার ও আরএফআইডি প্রটেকশন। দীর্ঘস্থায়ী এবং প্রিমিয়াম ফিনিশ।',
  },
  {
    id: 'demo-prod-7',
    name: 'সুন্দরবনের খাঁটি প্রাকৃতিক মধু (৫০০ গ্রাম)',
    category: 'Natural Foods',
    price: 650,
    originalPrice: 780,
    rating: 5.0,
    numReviews: 420,
    stock: 50,
    initialStock: 200,
    brand: 'Sundarban Raw',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=700&auto=format&fit=crop&q=80',
    description: 'সুন্দরবনের গভীর জঙ্গল থেকে সংগৃহীত সরাসরি আনপ্রসেসড ও পুষ্টিকর কাঁচা মধু।',
  },
  {
    id: 'demo-prod-8',
    name: 'প্রিমিয়াম কটন কিং সাইজ বেডশিট সেট (Luxury Flora)',
    category: 'Home & Living',
    price: 1450,
    originalPrice: 1890,
    rating: 4.8,
    numReviews: 134,
    stock: 15,
    initialStock: 70,
    brand: 'Comfort Home',
    imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=700&auto=format&fit=crop&q=80',
    description: '১০০% সুতি আরামদায়ক কাপড় ও আকর্ষণীয় কালার ফাস্ট প্রিন্ট। সাথে ২টি বালিশের কভার।',
  },
];

export const DEMO_SECTION_DATA = {
  hero_carousel: {
    slides: [
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=80',
        title: 'উৎসবের সেরা কেনাকাটা',
        description: 'নতুন কালেকশনে পাচ্ছেন ৩০% পর্যন্ত ক্যাশব্যাক ও ফ্রি ডেলিভারি অফার!',
        buttonText: 'কালেকশন দেখুন',
        linkUrl: '#',
      },
      {
        url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1400&auto=format&fit=crop&q=80',
        title: 'প্রিমিয়াম লাইফস্টাইল কালেকশন',
        description: 'আপনার ঘর ও ফ্যাশনকে সাজিয়ে নিন অভিজাত ও রুচিশীল পণ্যে।',
        buttonText: 'অর্ডার করুন',
        linkUrl: '#',
      },
    ],
  },
  category_scroller: {
    items: [
      { label: 'ফ্যাশন', emoji: '👗', imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&auto=format&fit=crop&q=80' },
      { label: 'ইলেকট্রনিক্স', emoji: '💻', imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&auto=format&fit=crop&q=80' },
      { label: 'গ্রোসারি', emoji: '🛒', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80' },
      { label: 'বিউটি', emoji: '💄', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80' },
      { label: 'হোম ডেকর', emoji: '🛋️', imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&auto=format&fit=crop&q=80' },
      { label: 'অফার জোন', emoji: '🔥', imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=200&auto=format&fit=crop&q=80' },
    ],
  },
  banner_row: {
    banners: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
        title: 'ফ্যাশন মেগা ডিল',
        linkUrl: '#',
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
        title: 'টেক গ্যাজেট উৎসব',
        linkUrl: '#',
      },
    ],
  },
  flash_sale: {
    title: '🔥 মেগা ফ্ল্যাশ সেল (সীমিত সময়)',
    endTime: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
    productIds: ['demo-prod-1', 'demo-prod-2', 'demo-prod-3', 'demo-prod-4'],
  },
  product_grid: {
    title: '✨ আমাদের জনপ্রিয় পণ্যসমূহ',
    tabs: ['all', 'trending', 'bestseller', 'new'],
    maxProducts: 8,
  },
  concern_grid: {
    title: '🎯 আপনার প্রয়োজন অনুযায়ী শপ করুন',
    items: [
      { label: 'ঈদ স্পেশাল', emoji: '🌙', imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&auto=format&fit=crop&q=80', tag: 'eid' },
      { label: 'ডেইলি কেয়ার', emoji: '🌿', imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80', tag: 'daily' },
      { label: 'অফিস ওয়ার্কসেট', emoji: '💼', imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&auto=format&fit=crop&q=80', tag: 'office' },
      { label: 'বাজেট ফ্রেন্ডলি', emoji: '💰', imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&auto=format&fit=crop&q=80', tag: 'budget' },
    ],
  },
  video_reels: {
    title: '🎬 ট্রেন্ডিং ভিডিও ও রিলস',
    urls: [
      {
        url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
        title: 'নতুন কাশ্মীরি পাঞ্জাবি আনবক্সিং ও রিভিউ',
        thumbnail: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=80',
      },
      {
        url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
        title: 'অরিজিনাল সরিষার তেল চেনার ৩টি সহজ উপায়',
        thumbnail: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
      },
      {
        url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
        title: 'ওয়্যারলেস এএনসি হেডফোন সাউন্ড টেস্ট',
        thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
      },
    ],
  },
  brand_marquee: {
    title: '⭐ আমাদের বিশ্বস্ত ব্র্যান্ড পার্টনারস',
    brands: [
      { name: 'Aarong' },
      { name: 'Apex' },
      { name: 'Bata' },
      { name: 'Square' },
      { name: 'Pran' },
      { name: 'Walton' },
      { name: 'Samsung' },
      { name: 'Nestle' },
    ],
  },
  bundle_section: {
    title: '🎁 সুপার সেভার কম্বো অফার',
    bundles: [
      {
        title: 'ঈদ ফেস্টিভ্যাল মেগা কম্বো প্যাক',
        price: 3150,
        originalPrice: 4200,
        imageUrl: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600&auto=format&fit=crop&q=80',
        description: '১টি কাশ্মীরি পাঞ্জাবি + ১টি লেদার ওয়ালেট + আতর কালেকশন।',
        items: 'পাঞ্জাবি, ওয়ালেট, সুগন্ধি',
      },
      {
        title: 'অর্গানিক কিচেন এসেনশিয়াল কম্বো',
        price: 990,
        originalPrice: 1230,
        imageUrl: 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?w=600&auto=format&fit=crop&q=80',
        description: '১ লিটার ঘানিভাঙা সরিষার তেল + ৫০০ গ্রাম সুন্দরবনের খাঁটি মধু।',
        items: 'সরিষার তেল ১L, খাঁটি মধু ৫০০g',
      },
    ],
  },
  photo_reviews: {
    title: '💬 সন্তুষ্ট গ্রাহকদের মতামত',
    reviews: [
      {
        name: 'তানভীর আহমেদ, উত্তরা',
        text: 'পাঞ্জাবির কাপড় আর ফিনিশিং অসাধারণ! ঠিক ছবিতে যেমন দেখেছি বাস্তবে আরও সুন্দর। ডেলিভারিও পেয়েছি মাত্র ২৪ ঘণ্টায়।',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        rating: 5,
      },
      {
        name: 'সাদিয়া আফরিন, ধানমন্ডি',
        text: 'সরিষার তেলের ঝাঁঝ এবং ঘ্রাণ একদম খাঁটি গ্রামের তেলের মতো। প্যাকেজিংও অনেক প্রটেক্টিভ ছিল।',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        rating: 5,
      },
      {
        name: 'রাশেদ খান, চট্টগ্রাম',
        text: 'হেডফোনের বেস ও নয়েজ ক্যানসেলেশন কোয়ালিটি এই বাজেটে বেস্ট। ১০০% অরিজিনাল প্রোডাক্ট।',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        rating: 5,
      },
    ],
  },
  price_tier_store: {
    title: '🏷️ বাজেট কর্নার — সাধ্যের মধ্যে সেরা শপিং',
    tiers: [299, 599, 999],
  },
  instagram_feed: {
    title: '📸 আমাদের ইনস্টাগ্রাম গ্যালারি',
    embedUrl: 'https://www.instagram.com',
  },
  popup_banner: {
    title: '🎉 ঈদ ধামাকা স্পেশাল অফার!',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&auto=format&fit=crop&q=80',
    linkUrl: '#',
    buttonText: 'অফারটি লুফে নিন',
    delay: 2,
  },

  // ── New Premium Sections ──
  split_showcase: {
    eyebrow: 'IKEA Inspired Editorial',
    title: 'অভিজাত লাইফস্টাইল ও মিনিমাল ডিজাইনের নিখুঁত সংমিশ্রণ',
    description: 'আধুনিক ঘরের প্রতিটি কোণকে দৃষ্টিনন্দন ও প্রশান্তিময় করে তুলতে আমাদের এক্সক্লুসিভ কালেকশন। প্রিমিয়াম ফিনিশিং এবং দীর্ঘস্থায়ী কোয়ালিটি।',
    price: 3490,
    originalPrice: 4500,
    badgeText: 'বেস্টসেলার চয়েস',
    buttonText: 'এখনই অর্ডার করুন',
    secondaryButtonText: 'বিস্তারিত জানুন',
    linkUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
    imagePosition: 'left', // 'left' | 'right'
    layoutRatio: '50/50', // '50/50' | '40/60' | '60/40'
    bgColor: '#f8fafc',
    bulletPoints: [
      '১০০% প্রাকৃতিক সলিড উড স্ট্রাকচার',
      'জলরোধী ও স্ক্র্যাচ-প্রতিরোধী ফিনিশ',
      'সারাদেশে হোম ডেলিভারি ও ৫ বছরের ওয়ারেন্টি',
    ],
  },
  editorial_story: {
    eyebrow: 'Seasonal Campaign',
    title: 'নতুন ঋতু, নতুন সাজ — আপনার স্বপ্নের কালেকশন',
    description: 'ঐতিহ্য ও আধুনিকতার মেলবন্ধনে তৈরি বিশেষ কালেকশন। প্রতিটি পোশাকে প্রকাশ পাবে আপনার অনন্য রুচি।',
    buttonText: 'এক্সপ্লোর করুন',
    linkUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&auto=format&fit=crop&q=80',
    themeMode: 'dark', // 'dark' | 'light'
    textAlign: 'left', // 'left' | 'center' | 'bottom'
  },
  shop_the_look: {
    title: '📍 Shop The Look — স্টাইলিশ লিভিং রুম সেটআপ',
    subtitle: 'ছবিতে ক্লিক করে আপনার পছন্দের পণ্য সরাসরি কার্টে যোগ করুন',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80',
    hotspots: [
      {
        id: 'hs-1',
        x: 35,
        y: 45,
        title: 'মডার্ন ভেলভেট সোফা সেট',
        price: 18500,
        originalPrice: 22000,
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80',
      },
      {
        id: 'hs-2',
        x: 75,
        y: 35,
        title: 'নর্ডিক ফ্লোর ল্যাম্প',
        price: 2450,
        originalPrice: 3100,
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&auto=format&fit=crop&q=80',
      },
      {
        id: 'hs-3',
        x: 60,
        y: 75,
        title: 'হ্যান্ডমেড জুট কার্পেট',
        price: 1850,
        originalPrice: 2400,
        imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=300&auto=format&fit=crop&q=80',
      },
    ],
  },
  bento_mosaic: {
    title: '🍱 ট্রেন্ডিং মোজাইক — সেরা ফিচার ও ডিলস',
    subtitle: 'এক নজরে শীর্ষ ট্রেন্ডিং আইটেমগুলো',
    tiles: [
      {
        title: 'এক্সক্লুসিভ কালেকশন',
        subtitle: 'প্রিমিয়াম ফ্যাশন ও স্টাইল',
        tag: 'HOT',
        price: '৳১,৯৫০ থেকে',
        imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
        size: 'large', // spans 2 cols or 2 rows
        linkUrl: '#',
      },
      {
        title: 'অর্গানিক ফুড',
        tag: '100% PURE',
        price: '৳৩৮০',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
        size: 'small',
        linkUrl: '#',
      },
      {
        title: 'স্মার্ট অডিও',
        tag: 'NEW',
        price: '৳১,৮৫০',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
        size: 'small',
        linkUrl: '#',
      },
      {
        title: 'হোম ডেকোরেশন',
        tag: 'POPULAR',
        price: '৳৯৫০',
        imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&auto=format&fit=crop&q=80',
        size: 'small',
        linkUrl: '#',
      },
    ],
  },
  product_spotlight: {
    eyebrow: 'স্পটলাইট প্রোডাক্ট',
    title: 'প্রিমিয়াম ওয়্যারলেস অ্যাক্টিভ নয়েজ ক্যানসেলিং হেডফোন (Pro ANC)',
    description: 'বিশ্বমানের অডিও ইঞ্জিনিয়ারিং, হাই-রেজুলিউশন অডিও এবং ক্রিস্টাল ক্লিয়ার কল কোয়ালিটি। প্রতিটি মিউজিক নোট শুনুন প্রাণবন্তভাবে।',
    price: 1850,
    originalPrice: 2490,
    rating: 4.9,
    reviewCount: 246,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    variants: ['Midnight Black', 'Cloud White', 'Navy Blue'],
    bulletPoints: [
      '⚡ ৪০ ঘণ্টা একটানা মিউজিক প্লেব্যাক ব্যাকআপ',
      '🌿 আল্ট্রা-সফট মেমোরি ফোম ইয়ারকুশন',
      '🛡️ ১ বছরের অফিসিয়াল রিপ্লেসমেন্ট গ্যারান্টি',
    ],
    buttonText: 'কার্টে যোগ করুন',
  },
  mood_board: {
    title: '✨ Shop by Mood & Occasion',
    subtitle: 'আপনার উৎসব ও মুড অনুযায়ী সঠিক শপিং',
    moods: [
      { title: 'ঈদ শপিং', subtitle: 'টপ ট্রেন্ডস', emoji: '🌙', imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=80', tag: 'eid' },
      { title: 'হোম অফিস', subtitle: 'প্রোডাক্টিভ সেটআপ', emoji: '💻', imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=500&auto=format&fit=crop&q=80', tag: 'office' },
      { title: 'ওয়েডিং গিফট', subtitle: 'উপহার কালেকশন', emoji: '💍', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80', tag: 'wedding' },
      { title: 'বাজেট ৳৫০০-এর নিচে', subtitle: 'সেরা ডিলস', emoji: '⚡', imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&auto=format&fit=crop&q=80', tag: 'under-500' },
    ],
  },
  tabbed_collection: {
    title: '🛍️ এক্সক্লুসিভ কালেকশনসমূহ',
    tabs: [
      { id: 'men', label: 'ছেলেদের কালেকশন' },
      { id: 'women', label: 'মেয়েদের কালেকশন' },
      { id: 'living', label: 'হোম লিভিং' },
      { id: 'organic', label: 'অর্গানিক ফুড' },
    ],
  },
  lookbook: {
    title: '📖 সিজনাল ফ্যাশন লুকবুক',
    subtitle: 'আমাদের এক্সক্লুসিভ লুক দেখে অনুপ্রেরণা নিন',
    looks: [
      {
        title: 'রয়্যাল উৎসব লুক',
        itemCount: 4,
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
        tag: 'Eid Special',
      },
      {
        title: 'ক্যাজুয়াল আর্বান স্টাইল',
        itemCount: 3,
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
        tag: 'Summer Vibe',
      },
      {
        title: 'মিনিমালিস্ট লিভিং স্পেস',
        itemCount: 5,
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
        tag: 'Home & Decor',
      },
    ],
  },
  scroll_story: {
    title: '🌿 কীভাবে তৈরি হয় আমাদের খাঁটি পণ্য',
    subtitle: 'ফার্ম থেকে আপনার ঘর পর্যন্ত ৩টি সহজ ধাপে বিশুদ্ধতা',
    steps: [
      {
        stepNumber: '01',
        title: 'প্রাকৃতিক সংগ্রহ',
        desc: 'স্থানীয় কৃষকদের থেকে শতভাগ রাসায়নিকমুক্ত সেরা কাঁচামাল সরাসরি সংগ্রহ করা হয়।',
        imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&auto=format&fit=crop&q=80',
      },
      {
        stepNumber: '02',
        title: 'ঐতিহ্যবাহী প্রক্রিয়াজাতকরণ',
        desc: 'কাঠের ঘানিতে কোল্ড-প্রেসড প্রক্রিয়ায় পুষ্টিগুণ অক্ষুণ্ণ রেখে তেল ও খাদ্য প্রস্তুত হয়।',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
      },
      {
        stepNumber: '03',
        title: 'নিরাপদ প্যাকেজিং ও ডেলিভারি',
        desc: 'হাইজিন গ্রেড কাঁচের বোতলে সিল করে নিরাপদে আপনার দোরগোড়ায় পৌঁছে দেওয়া হয়।',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
      },
    ],
  },
  shoppable_video: {
    title: '🎥 Shoppable Reels — ভিডিও দেখে সরাসরি কিনুন',
    subtitle: 'পণ্য পছন্দ হলে ভিডিও থেকেই সরাসরি কার্টে যোগ করুন',
    videoUrl: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
    taggedProduct: {
      id: 'demo-prod-1',
      name: 'প্রিমিয়াম কাশ্মীরি পাঞ্জাবি',
      price: 2450,
      originalPrice: 3200,
      imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&auto=format&fit=crop&q=80',
    },
  },
  before_after: {
    title: '✨ অবিশ্বাস্য পরিবর্তন (Before & After)',
    subtitle: 'ট্যাব বা হ্যান্ডেল স্লাইড করে ফলাফল দেখুন',
    beforeImage: 'https://images.unsplash.com/photo-1512290900672-1f02e1b12b50?w=800&auto=format&fit=crop&q=80',
    afterImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
    beforeLabel: 'ব্যবহারের পূর্বে',
    afterLabel: '৭ দিন ব্যবহারের পর',
    productName: 'ভিটামিন সি গ্লো ফেস সিরাম',
    price: 850,
  },
  trust_strip: {
    items: [
      { icon: 'truck', title: 'সারাদেশে দ্রুত ডেলিভারি', subtitle: '২৪-৪৮ ঘণ্টার মধ্যে হোম ডেলিভারি' },
      { icon: 'shield', title: '১০০% জেনুইন পণ্য', subtitle: 'সরাসরি অথেনটিক সোর্স থেকে সংগৃহীত' },
      { icon: 'refresh', title: '৭ দিনের সহজ রিটার্ন', subtitle: 'পছন্দ না হলে কোনো ঝামেলা ছাড়া পরিবর্তন' },
      { icon: 'phone', title: '২৪/৭ কাস্টমার সাপোর্ট', subtitle: 'যেকোনো প্রয়োজনে কল করুন বা চ্যাট করুন' },
    ],
  },
  customer_ugc: {
    title: '📸 গ্রাহকদের ক্যামেরায় আমাদের পণ্য',
    subtitle: 'আমাদের সন্তুষ্ট ক্রেতাদের পাঠানো বাস্তব ছবি ও অভিজ্ঞতা',
    stories: [
      {
        userName: 'ফারহানা ইসলাম',
        city: 'ঢাকা',
        rating: 5,
        text: 'পাঞ্জাবিটা আমার ভাইয়ের জন্য নিয়েছিলাম, সাইজ ও কালার একদম পারফেক্ট!',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        productName: 'প্রিমিয়াম কাশ্মীরি পাঞ্জাবি',
        productPrice: 2450,
      },
      {
        userName: 'মাহমুদুল হাসান',
        city: 'সিলেট',
        rating: 5,
        text: 'খাঁটি সরিষার তেলের ঝাঁঝ এবং ঘ্রাণে রান্নার স্বাদ একদম বদলে গেছে।',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
        productName: 'ঘানিভাঙা সরিষার তেল ১L',
        productPrice: 380,
      },
      {
        userName: 'নাজমুন নাহার',
        city: 'রাজশাহী',
        rating: 5,
        text: 'বেডশিটের কাপড় অনেক নরম এবং ওয়াশ করার পরও রং একটুও ওঠেনি।',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
        productName: 'কটন কিং সাইজ বেডশিট',
        productPrice: 1450,
      },
    ],
  },
  deal_of_the_day: {
    title: '⚡ Deal of the Day — আজকের মেগা অফার',
    subtitle: 'স্টক সীমিত! অফার শেষ হতে আর মাত্র কয়েক ঘণ্টা বাকি',
    productName: 'ওয়্যারলেস নয়েজ ক্যানসেলিং হেডফোন (ANC Pro)',
    description: '৪০ ঘণ্টা ব্যাটারি ব্যাকআপ ও আল্ট্রা-বেস সাউন্ড। আজকের স্পেশাল ডিল অফারে পাচ্ছেন ২৫% অতিরিক্ত ছাড়!',
    price: 1850,
    originalPrice: 2490,
    discountPercent: 26,
    soldCount: 42,
    totalStock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    endTime: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    buttonText: 'অর্ডার নিশ্চিত করুন',
  },
  price_ladder: {
    title: '🪜 বেশি কিনলে বেশি ছাড় (Bulk Savings)',
    subtitle: 'পরিমাণের সাথে সাথে পণ্যের মূল্য স্বয়ংক্রিয়ভাবে কমে যাবে',
    productName: 'অর্গানিক ১০০% খাঁটি সরিষার তেল (১ লিটার)',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    basePrice: 380,
    tiers: [
      { qty: 1, pricePerUnit: 380, label: '১ বোতল', badge: 'নরমাল প্রাইস' },
      { qty: 3, pricePerUnit: 350, label: '৩ বোতল', badge: 'Save ৳৯০' },
      { qty: 5, pricePerUnit: 320, label: '৫ বোতল', badge: 'Save ৳৩০০ (Best Value)' },
    ],
  },
};

/**
 * Resolves section data by merging retailer data with high-quality fallback demo data
 */
export function resolveSectionData(sectionType, customData = {}) {
  const fallback = DEMO_SECTION_DATA[sectionType] || {};
  if (!customData || Object.keys(customData).length === 0) {
    return fallback;
  }

  // Deep check arrays and critical fields
  const merged = { ...fallback, ...customData };
  
  if (Array.isArray(fallback.slides) && (!customData.slides || customData.slides.length === 0)) {
    merged.slides = fallback.slides;
  }
  if (Array.isArray(fallback.items) && (!customData.items || customData.items.length === 0)) {
    merged.items = fallback.items;
  }
  if (Array.isArray(fallback.banners) && (!customData.banners || customData.banners.length === 0)) {
    merged.banners = fallback.banners;
  }
  if (Array.isArray(fallback.bundles) && (!customData.bundles || customData.bundles.length === 0)) {
    merged.bundles = fallback.bundles;
  }
  if (Array.isArray(fallback.reviews) && (!customData.reviews || customData.reviews.length === 0)) {
    merged.reviews = fallback.reviews;
  }
  if (Array.isArray(fallback.brands) && (!customData.brands || customData.brands.length === 0)) {
    merged.brands = fallback.brands;
  }
  if (Array.isArray(fallback.urls) && (!customData.urls || customData.urls.length === 0)) {
    merged.urls = fallback.urls;
  }
  if (Array.isArray(fallback.hotspots) && (!customData.hotspots || customData.hotspots.length === 0)) {
    merged.hotspots = fallback.hotspots;
  }
  if (Array.isArray(fallback.tiles) && (!customData.tiles || customData.tiles.length === 0)) {
    merged.tiles = fallback.tiles;
  }
  if (Array.isArray(fallback.moods) && (!customData.moods || customData.moods.length === 0)) {
    merged.moods = fallback.moods;
  }
  if (Array.isArray(fallback.looks) && (!customData.looks || customData.looks.length === 0)) {
    merged.looks = fallback.looks;
  }
  if (Array.isArray(fallback.steps) && (!customData.steps || customData.steps.length === 0)) {
    merged.steps = fallback.steps;
  }
  if (Array.isArray(fallback.stories) && (!customData.stories || customData.stories.length === 0)) {
    merged.stories = fallback.stories;
  }
  if (Array.isArray(fallback.tiers) && (!customData.tiers || customData.tiers.length === 0)) {
    merged.tiers = fallback.tiers;
  }

  // Specific single fields
  if (sectionType === 'popup_banner' && !merged.imageUrl) {
    merged.imageUrl = fallback.imageUrl;
  }
  if (sectionType === 'split_showcase' && !merged.imageUrl) {
    merged.imageUrl = fallback.imageUrl;
  }
  if (sectionType === 'product_spotlight' && !merged.imageUrl) {
    merged.imageUrl = fallback.imageUrl;
  }
  if (sectionType === 'before_after' && (!merged.beforeImage || !merged.afterImage)) {
    merged.beforeImage = fallback.beforeImage;
    merged.afterImage = fallback.afterImage;
  }

  return merged;
}
