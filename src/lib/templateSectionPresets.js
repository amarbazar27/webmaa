// src/lib/templateSectionPresets.js
// Category-smart default dynamic sections for all 15 demo website templates.
// Uses the rich dynamic components from Visual Store Designer to make template previews irresistible.

export function getSectionsForTemplate(templateId, category, templateData = {}) {
  const primaryColor = templateData.primaryColor || '#6D28D9';
  const secondaryColor = templateData.secondaryColor || '#1E1B4B';
  const sampleProducts = templateData.sampleProducts || [];
  const titleBn = templateData.titleBn || 'ডেমো স্টোর';

  // 1. MODERN STREETWEAR & BOUTIQUE (Fashion / Gen-Z)
  if (templateId === 'modern_streetwear') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '🚚', title: 'সারাদেশে ফাস্ট ডেলিভারি', desc: '২-৩ দিনে হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি' },
            { icon: '✨', title: '১০০% অরিজিনাল কটন', desc: '২২০+ জিএসএম কম্বড কটন ও নিখুঁত প্রিন্ট' },
            { icon: '🔄', title: '৭ দিনের সাইজ এক্সচেঞ্জ', desc: 'ফিটিংয়ে সমস্যা হলে ঝামেলাহীন পরিবর্তন' },
            { icon: '🔒', title: 'নিরাপদ পেমেন্ট', desc: 'বিকাশ, নগদ ও কার্ড সমর্থিত' },
          ]
        }
      },
      {
        id: 'category_scroller',
        type: 'category_scroller',
        enabled: true,
        order: 2,
        data: {
          title: '🔥 ট্রেন্ডিং ক্যাটাগরি কালেকশন',
          categories: [
            { id: 'cat1', name: 'ওভারসাইজড টি-শার্ট', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80', count: '৬০+ ড্রপ' },
            { id: 'cat2', name: 'ট্যাকটিক্যাল কার্গো', image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=300&q=80', count: '২০+ কালার' },
            { id: 'cat3', name: 'হুডি ও জ্যাকেট', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&q=80', count: '৩০+ মডেল' },
            { id: 'cat4', name: 'স্নিকার্স ও কিকস', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=300&q=80', count: '২৫+ স্টাইল' },
            { id: 'cat5', name: 'ক্যাপ ও ব্যাকপ্যাক', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&q=80', count: '১৫+ এক্সেসরিজ' },
          ]
        }
      },
      {
        id: 'bento_mosaic',
        type: 'bento_mosaic',
        enabled: true,
        order: 3,
        data: {
          title: '🍱 আরবান স্ট্রিটওয়্যার মোজাইক — ট্রেন্ডিং ড্রপস',
          subtitle: 'তারুণ্যের আর্বান লাইফস্টাইল ও লিমিটেড এডিশন সংগ্রহ',
          tiles: [
            {
              title: 'সাইবারপাঙ্ক হেভিওয়েট ড্রপ',
              subtitle: '২২০ জিএসএম প্রিমিয়াম কম্বড কটন',
              tag: 'হট ড্রপ',
              price: '৳৭৯০ থেকে',
              imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
              size: 'large',
              linkUrl: '#'
            },
            {
              title: 'ট্যাকটিক্যাল কার্গো প্যান্ট',
              tag: 'ট্রেন্ডিং',
              price: '৳১,৪৫০',
              imageUrl: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=500&q=80',
              size: 'small',
              linkUrl: '#'
            },
            {
              title: 'রেট্রো হাই-টপ স্নিকার্স',
              tag: 'লিমিটেড স্টক',
              price: '৳২,৮৫০',
              imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=500&q=80',
              size: 'small',
              linkUrl: '#'
            },
            {
              title: 'মিনিমালিস্ট হুডি জ্যাকেট',
              tag: 'উইন্টার ড্রপ',
              price: '৳১,৬৫০',
              imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80',
              size: 'small',
              linkUrl: '#'
            }
          ]
        }
      },
      {
        id: 'flash_sale',
        type: 'flash_sale',
        enabled: true,
        order: 4,
        data: {
          title: '⚡ লিমিটেড ড্রপ ফ্ল্যাশ সেল — ৫০% পর্যন্ত ছাড়',
          subtitle: 'স্টক দ্রুত শেষ হয়ে যাচ্ছে! এখনই লুফে নিন আপনার সাইজ',
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
          discountPercent: 30,
        }
      },
      {
        id: 'product_spotlight',
        type: 'product_spotlight',
        enabled: true,
        order: 5,
        data: {
          eyebrow: 'হিরো ড্রপ ২০২৬',
          title: 'সাইবারপাঙ্ক হেভিওয়েট ওভারসাইজড টি-শার্ট (২২০ জিএসএম)',
          description: '১০০% ডাবল-বায়োওয়াশ কম্বড কটন। স্ক্র্যাচ-প্রতিরোধী হাই-ডেনসিটি সিলিকন স্ক্রিন প্রিন্ট। নিখুঁত আর্বান ড্রপ শোল্ডার কাটিং।',
          price: 790,
          originalPrice: 990,
          rating: 4.9,
          reviewCount: 318,
          imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
          variants: ['Jet Black', 'Acid Wash Grey', 'Vintage Maroon'],
          bulletPoints: [
            '🔥 ২২০+ জিএসএম হেভিওয়েট প্রি-শ্রিঙ্ক ফেব্রিক',
            '⚡ রিবড নেকলাইন — একাধিক ওয়াশেও কলার লুজ হবে না',
            '🚚 সারাদেশে ক্যাশ অন ডেলিভারি ও ফ্রি এক্সচেঞ্জ'
          ],
          buttonText: 'এখনই অর্ডার করুন'
        }
      },
      {
        id: 'video_reels',
        type: 'video_reels',
        enabled: true,
        order: 6,
        data: {
          title: '🎬 শপেবল ফ্যাশন রিলস (Trending Reels)',
          subtitle: 'ভিডিও দেখে সরাসরি পোশাকের ফিটিং দেখুন ও অর্ডার করুন',
          reels: [
            {
              id: 'reel_st_1',
              title: 'ওভারসাইজড কার্গো ড্রপ আউটফিট স্টাইল',
              thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
              views: '১৪.২k',
              price: '৳১,৪৫০',
            },
            {
              id: 'reel_st_2',
              title: 'সাইবারপাঙ্ক প্রিন্টেড টিজ আনবক্সিং',
              thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
              views: '২৫.৬k',
              price: '৳৭৯০',
            },
            {
              id: 'reel_st_3',
              title: 'স্ট্রিটওয়্যার স্নিকার্স অন-ফিট রিভিউ',
              thumbnail: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&q=80',
              views: '১৮.১k',
              price: '৳২,৮৫০',
            }
          ]
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 7,
        data: {
          title: '🛍️ ট্রেন্ডিং ড্রপস ও জনপ্রিয় কালেকশন',
          subtitle: 'আমাদের বেস্টসেলার স্ট্রিটওয়্যার পোশাকসমূহ',
        }
      },
      {
        id: 'lookbook',
        type: 'lookbook',
        enabled: true,
        order: 8,
        data: {
          title: '📖 আরবান ড্রপ ফ্যাশন লুকবুক ২০২৬',
          subtitle: 'স্ট্রিট কালচার ও নতুন জেনারেশনের আউটফিট ইন্সপিরেশন',
          looks: [
            {
              title: 'নাইট আউট আরবান স্টাইল',
              itemCount: 3,
              imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&q=80',
              tag: 'Night Vibes'
            },
            {
              title: 'ক্যাজুয়াল কলেজ ডে ড্রপ',
              itemCount: 4,
              imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
              tag: 'Campus Look'
            },
            {
              title: 'মনোক্রোম সাইবারপাঙ্ক লুক',
              itemCount: 3,
              imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
              tag: 'Signature Drop'
            }
          ]
        }
      },
      {
        id: 'customer_ugc',
        type: 'customer_ugc',
        enabled: true,
        order: 9,
        data: {
          title: '📸 কাস্টমার ও ইনফ্লুয়েন্সার স্টাইল ফিড',
          subtitle: 'আমাদের সন্তুষ্ট গ্রাহকরা যেভাবে স্টাইল করছেন',
        }
      },
      {
        id: 'instagram_feed',
        type: 'instagram_feed',
        enabled: true,
        order: 10,
        data: {
          handle: '@urbanstreetwear.bd',
          title: '📸 ইনস্টাগ্রামে আমাদের ফলো করুন'
        }
      }
    ];
  }

  // 2. FASHION EDITORIAL & COUTURE
  if (templateId === 'fashion_editorial') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '✨', title: 'হাতে বোনা পিওর সিল্ক ও মসলিন', desc: 'ঐতিহ্য ও রাজকীয় আভিজাত্যের প্রতীক' },
            { icon: '👗', title: 'কাস্টম টেইলারিং ও পারফেক্ট ফিট', desc: 'আপনার মাপ অনুযায়ী নিখুঁত সেলাই' },
            { icon: '📦', title: 'লাক্সারি গিফট প্যাকেজিং', desc: 'উৎসব ও বিয়ের জন্য আকর্ষণীয় বক্স' },
            { icon: '🚚', title: 'সারাদেশে হোম ট্রায়াল ও ক্যাশ অন ডেলিভারি', desc: 'পণ্য হাতে পেয়ে পেমেন্ট করুন' },
          ]
        }
      },
      {
        id: 'split_showcase',
        type: 'split_showcase',
        enabled: true,
        order: 2,
        data: {
          eyebrow: 'EXCLUSIVE RUNWAY COLLECTION',
          title: 'রয়্যাল ব্রাইডাল ও কৌতূর কালেকশন ২০২৬',
          description: 'ঐতিহ্যবাহী বেনারসি ও মসলিনে সোনালি জরির নিখুঁত নকশা। প্রতিটি শাড়িতে জড়িয়ে আছে প্রজন্মের শিল্প ও আভিজাত্য।',
          buttonText: 'কালেকশন এক্সপ্লোর করুন',
          imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&q=80',
          imagePosition: 'right',
          bulletPoints: [
            '১০০% খাঁটি সিল্ক সুতা ও নিখুঁত জারি লেইস',
            'সীমিত সংস্করণের হাতে তৈরি ডিজাইনার পিস',
            'সারাদেশে হোম ডেলিভারি ও সিকিউর প্যাকেজিং'
          ]
        }
      },
      {
        id: 'category_scroller',
        type: 'category_scroller',
        enabled: true,
        order: 3,
        data: {
          title: '✨ কিউরেটেড ফ্যাশন ক্যাটাগরি',
        }
      },
      {
        id: 'shop_the_look',
        type: 'shop_the_look',
        enabled: true,
        order: 4,
        data: {
          title: '📍 Shop The Look — রাজকীয় উৎসব সাজ',
          subtitle: 'মডেলের আউটফিটে ক্লিক করে প্রতিটি পণ্য সরাসরি কার্টে নিন',
          imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&q=80',
          hotspots: [
            { id: 'hs-1', x: 45, y: 35, title: 'হাতে কারুকাজ করা ব্রাইডাল লেহেঙ্গা', price: 18500, originalPrice: 22000, imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300&q=80' },
            { id: 'hs-2', x: 50, y: 15, title: 'কুন্দন জুয়েলারি চোকার সেট', price: 4200, originalPrice: 5500, imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&q=80' },
            { id: 'hs-3', x: 65, y: 70, title: 'জারদৌসি এমব্রয়ডারি ক্লাচ ব্যাগ', price: 1850, originalPrice: 2400, imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80' },
          ]
        }
      },
      {
        id: 'bento_mosaic',
        type: 'bento_mosaic',
        enabled: true,
        order: 5,
        data: {
          title: '🍱 লাক্সারি রানওয়ে মোজাইক',
        }
      },
      {
        id: 'video_reels',
        type: 'video_reels',
        enabled: true,
        order: 6,
        data: {
          title: '🎬 রানওয়ে শর্টস ও এক্সক্লুসিভ ফ্যাশন রিলস',
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 7,
        data: {
          title: '👑 জনপ্রিয় কালেকশন ও নতুন আগমন',
        }
      },
      {
        id: 'lookbook',
        type: 'lookbook',
        enabled: true,
        order: 8,
        data: {
          title: '📖 সিগনেচার এডিটোরিয়াল লুকবুক',
        }
      },
      {
        id: 'photo_reviews',
        type: 'photo_reviews',
        enabled: true,
        order: 9,
        data: {
          title: '⭐ ক্লায়েন্ট রিভিউ ও সন্তুষ্টির চিত্র',
        }
      }
    ];
  }

  // 3. FRESH GROCERY & ORGANIC BAZAR
  if (templateId === 'fresh_grocery') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '🌿', title: '১০০% তাজা ও ফরমালিনমুক্ত', desc: 'সরাসরি কৃষক ও মিল থেকে সংগ্রহ' },
            { icon: '⚡', title: '১ ঘণ্টায় সুপারফাস্ট ডেলিভারি', desc: 'ঢাকা ও প্রধান শহরে এক্সপ্রেস রাইডার' },
            { icon: '💵', title: 'ক্যাশ অন ডেলিভারি', desc: 'পণ্য দেখে ও ওজন মেপে পেমেন্ট' },
            { icon: '🔄', title: 'তাত্ক্ষণিক রিটার্ন ও রিফান্ড', desc: 'পণ্য পছন্দ না হলে সাথে সাথে ফেরত' },
          ]
        }
      },
      {
        id: 'deal_of_the_day',
        type: 'deal_of_the_day',
        enabled: true,
        order: 2,
        data: {
          eyebrow: 'আজকের সেরা ধামাকা ডিল',
          title: 'অর্গানিক ১০০% খাঁটি ঘানিভাঙা সরিষার তেল (৫ লিটার মেগা জার)',
          description: 'গ্রামের দেশি সরিষা থেকে কাঠের ঘানিতে ভাঙা খাঁটি ঝাঁঝালো তেল। কোনো কেমিক্যাল বা প্রিজারভেটিভ নেই।',
          price: 1850,
          originalPrice: 2250,
          discountPercent: 18,
          stockTotal: 100,
          stockSold: 74,
          imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80',
          badge: 'মেগা সাশ্রয়',
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
        }
      },
      {
        id: 'category_scroller',
        type: 'category_scroller',
        enabled: true,
        order: 3,
        data: {
          title: '🥦 বাজারের প্রধান ক্যাটাগরি',
        }
      },
      {
        id: 'flash_sale',
        type: 'flash_sale',
        enabled: true,
        order: 4,
        data: {
          title: '⚡ সকালের তাজা বাজার ফ্ল্যাশ সেল',
          subtitle: 'আজকের তাজা শাক-সবজি, মাছ ও মাংসের স্পেশাল ডিসকাউন্ট',
        }
      },
      {
        id: 'bundle_section',
        type: 'bundle_section',
        enabled: true,
        order: 5,
        data: {
          title: '🎁 পারিবারিক মাসিক বাজার কম্বো প্যাক (বান্ডেল সেভিংস)',
          subtitle: 'একসাথে কিনলে সরাসরি ৳৪৫০ পর্যন্ত নিশ্চিত সাশ্রয়!',
          bundles: [
            {
              id: 'bdl-1',
              title: 'মাসিক মুদি বাজার কম্বো (মিনিকেট চাল + তেল + ডাল + মশলা)',
              price: 2950,
              originalPrice: 3400,
              saveAmount: 450,
              badge: 'পপুলার কম্বো',
              imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
              itemsList: ['মিনিকেট প্রিমিয়াম চাল (১০ কেজি)', 'রূপচাঁদা সয়াবিন তেল (৫ লিটার)', 'দেশি মসুর ডাল (২ কেজি)', 'রাধুনী গুঁড়া মশলা প্যাক (৪টি)']
            },
            {
              id: 'bdl-2',
              title: 'সাপ্তাহিক তাজা শাকসবজি ও ডিম বক্স (ফ্রেশ প্যাক)',
              price: 680,
              originalPrice: 850,
              saveAmount: 170,
              badge: 'সাপ্তাহিক ফ্রেশ',
              imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80',
              itemsList: ['ফার্মের তাজা লাল ডিম (১ ডজন)', 'গোল আলু (৩ কেজি)', 'দেশি পেঁয়াজ (২ কেজি)', 'তাজা কাঁচা মরিচ ও ধনেপাতা প্যাক']
            }
          ]
        }
      },
      {
        id: 'price_ladder',
        type: 'price_ladder',
        enabled: true,
        order: 6,
        data: {
          productName: 'প্রিমিয়াম নাজিরশাইল ও মিনিকেট চাল (প্রতি কেজি)',
          basePrice: 78,
          tiers: [
            { minQty: 5, pricePerUnit: 74, label: '৫ কেজি বা বেশি' },
            { minQty: 25, pricePerUnit: 70, label: '২৫ কেজি বস্তা (হোলসেল রেট)' },
            { minQty: 50, pricePerUnit: 67, label: '৫০ কেজি বস্তা (ডিলার রেট)' },
          ]
        }
      },
      {
        id: 'price_tier_store',
        type: 'price_tier_store',
        enabled: true,
        order: 7,
        data: {
          title: '🏷️ বাজেট কর্নার — সাশ্রয়ী বাজার',
          tiers: [
            { label: '৳৯৯-এর নিচে', count: '৩৫টি পণ্য' },
            { label: '৳১৯৯ বাজার ডিল', count: '৫০টি পণ্য' },
            { label: '৳৪৯৯ স্পেশাল প্যাক', count: '২৮টি পণ্য' },
          ]
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 8,
        data: {
          title: '🛒 নিত্যপ্রয়োজনীয় গ্রোসারি ও কাঁচাবাজার',
        }
      },
      {
        id: 'photo_reviews',
        type: 'photo_reviews',
        enabled: true,
        order: 9,
        data: {
          title: '⭐ সন্তুষ্ট গ্রাহকদের অভিজ্ঞতা ও রিভিউ',
        }
      }
    ];
  }

  // 4. TECH ELECTRONICS & GADGETS
  if (templateId === 'tech_electronics') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '🛡️', title: '১০০% অফিশিয়াল ওয়ারেন্টি', desc: 'ব্র্যান্ডের নিজস্ব সার্ভিস সেন্টার সাপোর্ট' },
            { icon: '⚡', title: 'সুপারফাস্ট ডেলিভারি', desc: '১ ক্লিকে অর্ডার ও সারাদেশে এক্সপ্রেস ডেলিভারি' },
            { icon: '🔄', title: '৭ দিনের রিপ্লেসমেন্ট পলিসি', desc: 'কোনো ত্রুটি থাকলে সরাসরি নতুন পণ্য' },
            { icon: '💳', title: 'ইএমআই ও ক্যাশ অন ডেলিভারি', desc: 'সুদমুক্ত কিস্তি ও অনলাইন পেমেন্ট' },
          ]
        }
      },
      {
        id: 'split_showcase',
        type: 'split_showcase',
        enabled: true,
        order: 2,
        data: {
          eyebrow: 'NEXT-GEN FLAGSHIP TECH',
          title: 'আল্ট্রা-সাইলেন্ট হাইব্রিড এএনসি ও স্টুডিও অডিও কোয়ালিটি',
          description: '৪০ মিলিমিটার টাইটানিয়াম ড্রাইভার, ৪০ ঘণ্টা ব্যাকআপ এবং ক্রিস্টাল ক্লিয়ার এআই এনভায়রনমেন্টাল নয়েজ ক্যানসেলেশন।',
          buttonText: 'স্পেসিফিকেশন দেখুন',
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=80',
          imagePosition: 'left',
          bulletPoints: [
            'অ্যাক্টিভ নয়েজ ক্যানসেলেশন (ANC) আপ টু -৩৫dB',
            'লো-ল্যাটেন্সি গেমিং মোড (৪০ms)',
            '১ বছরের রিপ্লেসমেন্ট ওয়ারেন্টি'
          ]
        }
      },
      {
        id: 'product_spotlight',
        type: 'product_spotlight',
        enabled: true,
        order: 3,
        data: {
          eyebrow: 'বেস্টসেলার গ্যাজেট',
          title: 'সাউন্ডওয়েভ প্রো ওয়্যারলেস ব্লুটুথ হেডফোন (ANC Edition)',
          price: 1850,
          originalPrice: 2490,
          rating: 4.9,
          reviewCount: 420,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
          bulletPoints: [
            '⚡ টাইপ-সি ফাস্ট চার্জিং (১০ মিনিটে ৫ ঘণ্টা ব্যাকআপ)',
            '🎧 মেমোরি ফোম প্রিমিয়াম লেদারেট ইয়ারপ্যাড',
            '📱 ডুয়াল ডিভাইস সিমালটেনিয়াস কানেক্টিভিটি'
          ]
        }
      },
      {
        id: 'deal_of_the_day',
        type: 'deal_of_the_day',
        enabled: true,
        order: 4,
        data: {
          title: '🔥 টেক ডিল অফ দ্য ডে — মেগা ডিসকাউন্ট',
        }
      },
      {
        id: 'category_scroller',
        type: 'category_scroller',
        enabled: true,
        order: 5,
        data: {
          title: '💻 গ্যাজেটস ও টেক ক্যাটাগরি',
        }
      },
      {
        id: 'video_reels',
        type: 'video_reels',
        enabled: true,
        order: 6,
        data: {
          title: '🎬 আনবক্সিং ও হ্যান্ডস-অন টেক রিভিউ শর্টস',
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 7,
        data: {
          title: '⚡ প্রিমিয়াম গ্যাজেট ও ইলেকট্রনিক্স কালেকশন',
        }
      },
      {
        id: 'brand_marquee',
        type: 'brand_marquee',
        enabled: true,
        order: 8,
        data: {
          brands: ['Apple', 'Samsung', 'Sony', 'Anker', 'Xiaomi', 'JBL', 'OnePlus', 'Baseus', 'Realme']
        }
      },
      {
        id: 'photo_reviews',
        type: 'photo_reviews',
        enabled: true,
        order: 9,
        data: {
          title: '⭐ টেক লাভারদের রেটিং ও রিভিউ',
        }
      }
    ];
  }

  // 5. LUXURY BEAUTY & SKINCARE
  if (templateId === 'luxury_beauty') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '🌸', title: '১০০% অরিজিনাল কোরিয়ান ও ইউএসএ পণ্য', desc: 'বারকোড ও ব্যাচ কোড ভেরিফাইড' },
            { icon: '🧪', title: 'ডার্মাটোলজিস্ট টেস্টেড ফর্মুলা', desc: 'ত্বকের জন্য সম্পূর্ণ নিরাপদ ও কার্যকর' },
            { icon: '🚚', title: 'সারাদেশে ক্যাশ অন ডেলিভারি', desc: 'দ্রুত হোম ডেলিভারি' },
            { icon: '💬', title: 'ফ্রি স্কিন কনসালটেশন', desc: 'ত্বকের ধরন অনুযায়ী সঠিক প্রোডাক্ট চয়েস' },
          ]
        }
      },
      {
        id: 'before_after',
        type: 'before_after',
        enabled: true,
        order: 2,
        data: {
          title: '✨ ১৪ দিনের ভিজিবল রেজাল্ট কম্প্যারিজম — গ্লো সিরাম',
          subtitle: 'ড্র্যাগ করে পরিবর্তন দেখুন: ব্রণের দাগ ও পিগমেন্টেশন হালকা করে উজ্জ্বল ত্বক',
          beforeImage: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&q=80',
          afterImage: 'https://images.unsplash.com/photo-1512290900672-1f5be6405786?w=800&q=80',
          beforeLabel: 'আগে (Day 1)',
          afterLabel: '১৪ দিন পর (Day 14)',
          note: 'আমাদের ৯৪% কাস্টমার ১৪ দিনের মধ্যে ত্বকে দৃশ্যমান উজ্জ্বলতা ও মসৃণতা লক্ষ্য করেছেন।'
        }
      },
      {
        id: 'split_showcase',
        type: 'split_showcase',
        enabled: true,
        order: 3,
        data: {
          eyebrow: 'K-BEAUTY GLASS SKIN SERUM',
          title: 'হায়ালুরোনিক অ্যাসিড ও ভিটামিন সি ডিপ হাইড্রেশন',
          description: 'ত্বকের ভেতর থেকে আর্দ্রতা ধরে রেখে এনে দেয় ন্যাচারাল কোরিয়ান গ্লাস স্কিন লুক। প্যারাবেন ও আর্টিফিশিয়াল সুগন্ধিমুক্ত।',
          buttonText: 'সিরাম অর্ডার করুন',
          imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1000&q=80',
          imagePosition: 'right'
        }
      },
      {
        id: 'category_scroller',
        type: 'category_scroller',
        enabled: true,
        order: 4,
        data: {
          title: '💄 স্কিনকেয়ার ও বিউটি ক্যাটাগরি',
        }
      },
      {
        id: 'flash_sale',
        type: 'flash_sale',
        enabled: true,
        order: 5,
        data: {
          title: '⚡ কোরিয়ান বিউটি ড্রপ ফ্ল্যাশ সেল',
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 6,
        data: {
          title: '🌸 বেস্টসেলার স্কিনকেয়ার ও মেকআপ পণ্য',
        }
      },
      {
        id: 'customer_ugc',
        type: 'customer_ugc',
        enabled: true,
        order: 7,
        data: {
          title: '📸 রিয়েল কাস্টমার ট্রান্সফর্মেশন ও রিভিউ',
        }
      },
      {
        id: 'photo_reviews',
        type: 'photo_reviews',
        enabled: true,
        order: 8,
        data: {
          title: '⭐ ৫-স্টার রেটিং ও ভেরিফাইড রিভিউ',
        }
      }
    ];
  }

  // 6. MODERN LIVING & HOME FURNITURE
  if (templateId === 'home_living') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '🪵', title: '১০০% সলিড মেহগনি ও ওক কাঠ', desc: 'ঘুণ ও আর্দ্রতারোধী ট্রিটমেন্ট' },
            { icon: '🛡️', title: '৫ বছরের ফুল ওয়ারেন্টি', desc: 'ফ্রি রিপেয়ার ও কাঠ প্রতিস্থাপন' },
            { icon: '🚚', title: 'সারাদেশে ফ্রি হোম ফিটিং ও ডেলিভারি', desc: 'দক্ষ কারিগর দ্বারা সেটআপ' },
            { icon: '🛋️', title: 'কাস্টম ডিজাইন ও সাইজ সুবিধা', desc: 'ঘরের মাপ অনুযায়ী তৈরি' },
          ]
        }
      },
      {
        id: 'split_showcase',
        type: 'split_showcase',
        enabled: true,
        order: 2,
        data: {
          eyebrow: 'SCANDINAVIAN LIVING 2026',
          title: 'মডার্ন মিনিমালিস্ট সোফা ও লিভিং রুম সেটআপ',
          description: 'আল্ট্রা-কমফোর্ট মেমোরি ফোম ও পানি-প্রতিরোধী ভেলভেট ফেব্রিক। আপনার ড্রয়িং রুমে আনুন আন্তর্জাতিক মানের আভিজাত্য।',
          buttonText: 'সেটআপ দেখুন',
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&q=80',
          imagePosition: 'left'
        }
      },
      {
        id: 'shop_the_look',
        type: 'shop_the_look',
        enabled: true,
        order: 3,
        data: {
          title: '📍 Shop The Look — স্টাইলিশ ড্রয়িং রুম',
          subtitle: 'ছবির পণ্যে ক্লিক করে সরাসরি ফার্নিচার কার্টে যোগ করুন',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
        }
      },
      {
        id: 'bento_mosaic',
        type: 'bento_mosaic',
        enabled: true,
        order: 4,
        data: {
          title: '🍱 লিভিং স্পেস মোজাইক কালেকশন',
        }
      },
      {
        id: 'mood_board',
        type: 'mood_board',
        enabled: true,
        order: 5,
        data: {
          title: '✨ ঘর সাজানোর মুড ও অকেশন বোর্ড',
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 6,
        data: {
          title: '🛋️ জনপ্রিয় ফার্নিচার ও হোম ডেকোর',
        }
      },
      {
        id: 'photo_reviews',
        type: 'photo_reviews',
        enabled: true,
        order: 7,
        data: {
          title: '⭐ সন্তুষ্ট গ্রাহকদের ঘরের অরিজিনাল ছবি',
        }
      }
    ];
  }

  // 7. RESTAURANT & FOOD EXPRESS
  if (templateId === 'restaurant_food') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '🛵', title: '৩০ মিনিটে গরম খাবার ডেলিভারি', desc: 'ইনসুলেটেড ব্যাগে ধোঁয়া ওঠা গরম' },
            { icon: '👨‍🍳', title: 'মাস্টার শেফ ও ১০০% হাইজিন কিচেন', desc: 'সম্পূর্ণ স্বাস্থ্যসম্মত পরিবেশে প্রস্তুত' },
            { icon: '💵', title: 'ক্যাশ অন ডেলিভারি', desc: 'খাবার হাতে পেয়ে মূল্য পরিশোধ' },
            { icon: '🎁', title: 'প্রতি অর্ডারে ফ্রি সাইড ও ড্রিংক', desc: 'স্পেশাল কুপন কোড' },
          ]
        }
      },
      {
        id: 'deal_of_the_day',
        type: 'deal_of_the_day',
        enabled: true,
        order: 2,
        data: {
          eyebrow: 'শেফ স্পেশাল প্লাটার ডিল',
          title: 'স্মোকি বার্গার + ক্রিস্পি ফ্রাইস + চকোলেট কোল্ড কফি কম্বো',
          price: 490,
          originalPrice: 650,
          discountPercent: 25,
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
          badge: 'আজকের হিট ডিল',
        }
      },
      {
        id: 'category_scroller',
        type: 'category_scroller',
        enabled: true,
        order: 3,
        data: {
          title: '🍔 ফুড ক্যাটাগরি মেনু',
        }
      },
      {
        id: 'bundle_section',
        type: 'bundle_section',
        enabled: true,
        order: 4,
        data: {
          title: '🎁 ফ্রেন্ডস অ্যান্ড ফ্যামিলি কম্বো অফার',
          subtitle: '৪ জনের স্পেশাল মিল বক্সে ১০০% সন্তুষ্টি!',
        }
      },
      {
        id: 'flash_sale',
        type: 'flash_sale',
        enabled: true,
        order: 5,
        data: {
          title: '⚡ লাঞ্চ আওয়ার ধামাকা অফার',
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 6,
        data: {
          title: '🍕 জনপ্রিয় মেনু আইটেমসমূহ',
        }
      },
      {
        id: 'photo_reviews',
        type: 'photo_reviews',
        enabled: true,
        order: 7,
        data: {
          title: '⭐ ফুডি ও কাস্টমারদের তৃপ্তিদায়ক রিভিউ',
        }
      }
    ];
  }

  // 8. LUXURY JEWELRY & GOLD
  if (templateId === 'jewelry_gold') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '💎', title: '১০০% হলমার্ক সার্টিফাইড গোল্ড ও ডায়মন্ড', desc: 'সরকারি স্বীকৃতি ও আন্তর্জাতিক সার্টিফিকেট' },
            { icon: '🔄', title: 'লাইফটাইম বাইব্যাক ও এক্সচেঞ্জ পলিসি', desc: 'যেকোনো সময় সেরা মূল্যে পরিবর্তন' },
            { icon: '📦', title: 'ইনসিওরড ও সিকিউর এক্সপ্রেস ডেলিভারি', desc: 'সুরক্ষিত হোম ডেলিভারি' },
            { icon: '👑', title: 'হাতে তৈরি ঐতিহ্যবাহী কারুকাজ', desc: 'মাস্টার কারিগরদের নিখুঁত ফিনিশ' },
          ]
        }
      },
      {
        id: 'product_spotlight',
        type: 'product_spotlight',
        enabled: true,
        order: 2,
        data: {
          eyebrow: 'ROYAL BRIDAL MASTERPIECE',
          title: 'অবসিডিয়ান ২৪কে ব্রাইডাল কুন্দন ও গোল্ড নেকলেস সেট',
          price: 48500,
          originalPrice: 56000,
          rating: 5.0,
          reviewCount: 95,
          imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
          bulletPoints: [
            '👑 পিওর হলমার্ক সার্টিফাইড সোনা ও কুন্দন পাথর',
            '📜 আজীবন রিপেয়ারিং ও পলিশিং সার্ভিস সম্পূর্ণ ফ্রি',
            '🎁 ভেলভেট লাক্সারি গিফট কেস ও সিকিউর লজিস্টিক'
          ]
        }
      },
      {
        id: 'lookbook',
        type: 'lookbook',
        enabled: true,
        order: 3,
        data: {
          title: '📖 ব্রাইডাল জুয়েলারি লুকবুক ২০২৬',
        }
      },
      {
        id: 'bento_mosaic',
        type: 'bento_mosaic',
        enabled: true,
        order: 4,
        data: {
          title: '🍱 লাক্সারি গোল্ড ও ডায়মন্ড মোজাইক',
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 5,
        data: {
          title: '💎 এক্সক্লুসিভ জুয়েলারি কালেকশন',
        }
      },
      {
        id: 'photo_reviews',
        type: 'photo_reviews',
        enabled: true,
        order: 6,
        data: {
          title: '⭐ ব্রাইডাল ক্লায়েন্টদের রিভিউ ও ছবি',
        }
      }
    ];
  }

  // 9. HEALTHCARE & PHARMACY
  if (templateId === 'health_pharmacy') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '💊', title: '১০০% ডিজিডিএ অনুমোদিত জেনুইন ঔষধ', desc: 'সরাসরি শীর্ষ ফার্মাসিউটিক্যাল কোম্পানি থেকে' },
            { icon: '❄️', title: 'তাপমাত্রা নিয়ন্ত্রিত কোল্ড-চেইন ডেলিভারি', desc: 'ইনসুলিন ও ভ্যাকসিনের সর্বোচ্চ সুরক্ষা' },
            { icon: '👨‍⚕️', title: 'রেজিস্টার্ড ফার্মাসিস্ট যাচাই', desc: 'প্রেসক্রিপশন মিলিয়ে সঠিক ডোজ ও ঔষধ সরবরাহ' },
            { icon: '🚑', title: 'জরুরি প্রেসক্রিপশন ডেলিভারি', desc: 'দ্রুত হোম ডেলিভারি ও সাপোর্ট' },
          ]
        }
      },
      {
        id: 'concern_grid',
        type: 'concern_grid',
        enabled: true,
        order: 2,
        data: {
          title: '🩺 স্বাস্থ্য সমস্যা অনুযায়ী প্রয়োজনীয় ঔষধ (Health Concerns)',
          concerns: [
            { id: 'c1', title: 'ডায়াবেটিস কেয়ার', desc: 'গ্লুকোজ মনিটর, স্ট্রিপ ও সুগার-ফ্রি ফুড' },
            { id: 'c2', title: 'সর্দি, জ্বর ও ঠান্ডা', desc: 'প্যারাসিটামল, সিরাপ ও নেবুলাইজার' },
            { id: 'c3', title: 'গ্যাস্ট্রিক ও এসিডিটি', desc: 'অ্যান্টাসিড ও প্রোটন পাম্প ড্রাগস' },
            { id: 'c4', title: 'রক্তচাপ ও কার্ডিয়াক', desc: 'ডিজিটাল প্রেসার মেশিন ও রেগুলার ড্রাগস' },
          ]
        }
      },
      {
        id: 'price_tier_store',
        type: 'price_tier_store',
        enabled: true,
        order: 3,
        data: {
          title: '🏷️ নিয়মিত হেলথ কেয়ার বাজেট প্যাক',
          tiers: [
            { label: 'জরুরি ফার্স্ট এইড', count: '২০টি পণ্য' },
            { label: 'মাসিক প্রেসক্রিপশন প্যাক', count: '৪০টি পণ্য' },
            { label: 'মা ও শিশু যত্ন', count: '২৫টি পণ্য' },
          ]
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 4,
        data: {
          title: '🏥 জেনুইন ঔষধ ও স্বাস্থ্যসেবা পণ্যসমূহ',
        }
      },
      {
        id: 'photo_reviews',
        type: 'photo_reviews',
        enabled: true,
        order: 5,
        data: {
          title: '⭐ সন্তুষ্ট রোগী ও পরিবারের অভিজ্ঞতা',
        }
      }
    ];
  }

  // 10. WHOLESALE & B2B
  if (templateId === 'wholesale_b2b') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '🏭', title: 'ফ্যাক্টরি ডিরেক্ট হোলসেল রেট', desc: 'মাঝের কোনো দালাল বা অতিরিক্ত খরচ ছাড়া' },
            { icon: '📦', title: 'বালক অর্ডার ও ট্রাকলোড লজিস্টিক', desc: 'সারাদেশের যেকোনো প্রান্তে বাল্ক পরিবহন' },
            { icon: '📜', title: 'জিএসটি / ভ্যাট চালান ও ইনভয়েস', desc: 'আইনি ও স্বচ্ছ লেনদেন সুবিধা' },
            { icon: '🤝', title: 'মার্চেন্ট ক্রেডিট ও ফ্লেক্সিবল পেমেন্ট', desc: 'বিশ্বস্ত রিটেইলারদের জন্য বাকি সুবিধা' },
          ]
        }
      },
      {
        id: 'price_ladder',
        type: 'price_ladder',
        enabled: true,
        order: 2,
        data: {
          productName: 'প্রিমিয়াম সুতি থান কাপড় ও তৈরি পোশাক লট',
          basePrice: 420,
          tiers: [
            { minQty: 20, pricePerUnit: 380, label: '২০ পিস বা বেশি' },
            { minQty: 100, pricePerUnit: 340, label: '১০০ পিসের হোলসেল লট' },
            { minQty: 500, pricePerUnit: 295, label: '৫০০ পিস ফ্যাক্টরি ডিরেক্ট লট' },
          ]
        }
      },
      {
        id: 'deal_of_the_day',
        type: 'deal_of_the_day',
        enabled: true,
        order: 3,
        data: {
          title: '🔥 আজকের হোলসেল লট ডিল — সীমিত স্টক',
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 4,
        data: {
          title: '🏢 বাল্ক হোলসেল পণ্য ক্যাটালগ',
        }
      },
      {
        id: 'brand_marquee',
        type: 'brand_marquee',
        enabled: true,
        order: 5,
        data: {
          brands: ['Apex', 'Bashundhara', 'Beximco', 'Square', 'Akij', 'PRAN', 'Meghna']
        }
      }
    ];
  }

  // 11. SPORTS FITNESS & NUTRITION
  if (templateId === 'sports_fitness') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '💪', title: '১০০% অথেনটিক ও ল্যাব টেস্টেড', desc: 'যুক্তরাষ্ট্র ও যুক্তরাজ্য থেকে আমদানিকৃত' },
            { icon: '⚡', title: '২৪ ঘণ্টায় এক্সপ্রেস ডেলিভারি', desc: 'নিরাপদ ইন্ট্যাক্ট সিলপ্যাক পৌঁছানোর নিশ্চয়তা' },
            { icon: '💵', title: 'ক্যাশ অন ডেলিভারি', desc: 'হাতে পেয়ে কিউআর কোড স্ক্যান করে পেমেন্ট' },
            { icon: '🥗', title: 'ফ্রি নিউট্রিশন ও ডায়েট গাইড', desc: 'প্রতি অর্ডারে সার্টিফাইড এক্সপার্ট পরামর্শ' },
          ]
        }
      },
      {
        id: 'product_spotlight',
        type: 'product_spotlight',
        enabled: true,
        order: 2,
        data: {
          eyebrow: 'FLASGSHIP NUTRITION SPOTLIGHT',
          title: 'গোল্ড স্ট্যান্ডার্ড ১০০% হুই প্রোটিন আইসোলেট',
          subtitle: 'বিশ্ববিখ্যাত সর্বোচ্চ বিশুদ্ধতার ম্যাসেল বিল্ডিং ফর্মুলা',
          description: 'প্রতি স্কুপে ২৪ গ্রাম আল্ট্রা-পিওর প্রোটিন, ৫.৫ গ্রাম প্রাকৃতিক বিসিএএ (BCAA) এবং মাত্র ১ গ্রাম কার্ব। পেশির দ্রুত রিকভারি ও ক্লিন ফ্যাট-ফ্রি মাসল গেইনের জন্য অতুলনীয়।',
          price: 8200,
          originalPrice: 9200,
          discountPercent: 11,
          imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800&q=80',
          features: [
            '২৪ গ্রাম প্রিমিয়াম মাইক্রো-ফিল্টার্ড প্রোটিন',
            '৫.৫ গ্রাম ব্রাঞ্চড চেইন অ্যামিনো অ্যাসিড (BCAAs)',
            'সহজে দ্রবণীয় ও সুস্বাদু ডাবল রিচ চকলেট ফ্লেভার',
            '১০০% ডোপিং ও ব্যানড সাবস্ট্যান্স মুক্ত সার্টিফাইড'
          ],
          badge: 'বেস্টসেলার'
        }
      },
      {
        id: 'category_scroller',
        type: 'category_scroller',
        enabled: true,
        order: 3,
        data: {
          title: '🏋️‍♂️ ফিটনেস ও নিউট্রিশন ক্যাটাগরি',
        }
      },
      {
        id: 'deal_of_the_day',
        type: 'deal_of_the_day',
        enabled: true,
        order: 4,
        data: {
          eyebrow: 'আজকের সেরা ফিটনেস অফার',
          title: 'এডজাস্টেবল রাবার-কোটেড ডাম্বেল সেট (২০ কেজি হোম জিম প্যাক)',
          description: 'মরিচারোধক সলিড কাস্ট আয়রন কোর ও অ্যান্টি-স্লিপ গ্রিপ। ঘরে বসেই প্রফেশনাল বডিবিল্ডিং ও স্ট্রেংথ ট্রেনিংয়ের জন্য আদর্শ।',
          price: 3400,
          originalPrice: 4000,
          discountPercent: 15,
          imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80',
          badge: 'হেভি ডিউটি'
        }
      },
      {
        id: 'bundle_section',
        type: 'bundle_section',
        enabled: true,
        order: 5,
        data: {
          title: '🎁 আল্টিমেট মাসল বিল্ডার কম্বো প্যাক',
          subtitle: 'প্রোটিন + ক্রিয়েটিন + শেকার একসাথে নিলে সরাসরি ৳৭৫০ ছাড়!',
          bundles: [
            {
              id: 'sp_bdl_1',
              title: 'ম্যাসেল গেইন পাওয়ার স্ট্যাক (হুই প্রোটিন + ক্রিয়েটিন + শেকার)',
              price: 10450,
              originalPrice: 11200,
              saveAmount: 750,
              badge: 'প্রো স্ট্যাক',
              imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&q=80',
              itemsList: ['গোল্ড স্ট্যান্ডার্ড হুই প্রোটিন (৫ পাউন্ড)', 'মাইক্রোনাইজড ক্রিয়েটিন পাউডার (৩০০ গ্রাম)', 'লিক-প্রুফ ব্লেন্ডার শেকার বোতল (৭০০ মিলি)']
            }
          ]
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 6,
        data: {
          title: '⚡ অ্যাথলেটদের পছন্দের জনপ্রিয় পণ্যসমূহ',
        }
      },
      {
        id: 'customer_ugc',
        type: 'customer_ugc',
        enabled: true,
        order: 7,
        data: {
          title: '🏆 অ্যাথলেট ও ট্রেইনারদের বাস্তব অভিজ্ঞতা ও ফিডব্যাক',
          subtitle: 'হাজারো ফিটনেস প্রেমীদের পছন্দের বিশ্বস্ত ডেস্টিনেশন'
        }
      }
    ];
  }

  // 12. BOOKS & STATIONERY
  if (templateId === 'books_stationery') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '📚', title: '১০০% অরিজিনাল পেপারব্যাক ও হার্ডবাউন্ড', desc: 'প্রকাশক থেকে সরাসরি সংগৃহীত ঝকঝকে ছাপা' },
            { icon: '🎁', title: 'প্রতি বইয়ে প্রিমিয়াম বুকমার্ক ফ্রি', desc: 'উপহার হিসেবে আকর্ষণীয় মোড়ক' },
            { icon: '🚚', title: 'সারাদেশে হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি', desc: 'Steadfast কুরিয়ারে দ্রুততম পৌঁছানো' },
            { icon: '🔄', title: 'ছেঁড়া বা মিসপ্রিন্টে তাৎক্ষণিক রিপ্লেসমেন্ট', desc: 'ঝামেলাহীন পরিবর্তনের সুবিধা' },
          ]
        }
      },
      {
        id: 'editorial_story',
        type: 'editorial_story',
        enabled: true,
        order: 2,
        data: {
          eyebrow: 'বইপোকার বিশেষ নিবেদন',
          title: 'শব্দ ও চিন্তার অমর মহোৎসব — সেরা বেস্টসেলার বইমেলা',
          subtitle: 'পাঠকের মননশীলতা ও আত্মউন্নয়নের অনন্য সঙ্গী',
          description: 'বই কেবল কাগজ ও কালির মেলবন্ধন নয়, এটি আত্মিক ভ্রমণের পাসপোর্ট। সমকালীন পাঠকপ্রিয় উপন্যাস, দর্শন ও ক্যারিয়ারের শ্রেষ্ঠ বইগুলো সাজানো হয়েছে এক ঠিকানায়।',
          buttonText: 'বইগুলো দেখুন',
          buttonLink: '#section-product_grid',
          imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&q=80',
          stats: [
            { value: '৫,০০০+', label: 'সংগ্রহে থাকা বই' },
            { value: '৯৯.৮%', label: 'পাঠক সন্তুষ্টি' },
            { value: '২৪/৭', label: 'বুক ফাইন্ডার সহায়তা' }
          ]
        }
      },
      {
        id: 'category_scroller',
        type: 'category_scroller',
        enabled: true,
        order: 3,
        data: {
          title: '📖 প্রিয় বিষয়ের বই খুঁজুন',
        }
      },
      {
        id: 'bundle_section',
        type: 'bundle_section',
        enabled: true,
        order: 4,
        data: {
          title: '🎁 বইপোকা বেস্টসেলার গিফট কম্বো',
          subtitle: 'একসাথে সেট কিনলে আকর্ষণীয় ছাড় ও স্পেশাল বক্স প্যাকিং',
          bundles: [
            {
              id: 'bk_bdl_1',
              title: 'প্যারাডক্সিক্যাল সাজিদ ১ ও ২ কম্বো সেট (আরিফ আজাদ)',
              price: 580,
              originalPrice: 700,
              saveAmount: 120,
              badge: 'মেগা বেস্টসেলার',
              imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80',
              itemsList: ['প্যারাডক্সিক্যাল সাজিদ ১ (হার্ডবাউন্ড)', 'প্যারাডক্সিক্যাল সাজিদ ২ (হার্ডবাউন্ড)', '২টি কাস্টম মেটালিক বুকমার্ক', 'লাক্সারি গিফট বক্স']
            },
            {
              id: 'bk_bdl_2',
              title: 'ভিন্টেজ লেখক কিট (লেদার জার্নাল + লাক্সারি ফাউন্টেন পেন)',
              price: 1250,
              originalPrice: 1700,
              saveAmount: 450,
              badge: 'কালেক্টরস এডিশন',
              imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&q=80',
              itemsList: ['ভিন্টেজ লেদার কাভারড হার্ডবাউন্ড জার্নাল', 'মেটালিক ফাউন্টেন পেন উইথ গোল্ড নিব', 'রয়েল ব্ল্যাক ইঙ্ক পট (৫০ মিলি)']
            }
          ]
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 5,
        data: {
          title: '📚 জনপ্রিয় ও আলোড়ন সৃষ্টিকারী বইসমূহ',
        }
      },
      {
        id: 'photo_reviews',
        type: 'photo_reviews',
        enabled: true,
        order: 6,
        data: {
          title: '⭐ বইপ্রেমীদের বুকশেলফ ও পাঠ প্রতিক্রিয়া',
        }
      }
    ];
  }

  // 13. BABY CARE & KIDS TOYS
  if (templateId === 'baby_kids') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '👶', title: '১০০% টক্সিক-ফ্রি ও বিপিএ-মুক্ত', desc: 'শিশুদের সুরক্ষায় সার্টিফাইড নিরাপদ ম্যাটেরিয়াল' },
            { icon: '🌿', title: 'ডার্মাটোলজিক্যালি টেস্টেড', desc: 'নবজাতকের সংবেদনশীল ত্বকে কোমল ও নিরাপদ' },
            { icon: '⚡', title: 'জরুরি ডায়াপার ও বেবি ফুড ডেলিভারি', desc: 'আপনার দরজায় দ্রুততম সময়ে পৌঁছানো' },
            { icon: '💵', title: 'ক্যাশ অন ডেলিভারি', desc: 'পণ্য দেখে নিশ্চিন্তে মূল্য পরিশোধ করুন' },
          ]
        }
      },
      {
        id: 'deal_of_the_day',
        type: 'deal_of_the_day',
        enabled: true,
        order: 2,
        data: {
          eyebrow: 'মা ও শিশুর সেরা সাশ্রয়ী অফার',
          title: 'প্যাম্পার্স অ্যাক্টিভ বেবি ডায়াপার লার্জ সাইজ (৫৬ পিস মেগা সেভার প্যাক)',
          description: '১২ ঘণ্টা পর্যন্ত সম্পূর্ণ লিকপ্রুফ সুরক্ষা ও নরম সুতির স্পর্শ। বাচ্চার কোমল ত্বক রাখবে শুকনা, সুরক্ষিত ও র‍্যাশমুক্ত।',
          price: 1750,
          originalPrice: 1950,
          discountPercent: 10,
          imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80',
          badge: 'মেগা সেভার'
        }
      },
      {
        id: 'category_scroller',
        type: 'category_scroller',
        enabled: true,
        order: 3,
        data: {
          title: '🧸 শিশু ও নবজাতকের প্রয়োজনীয় ক্যাটাগরি',
        }
      },
      {
        id: 'bundle_section',
        type: 'bundle_section',
        enabled: true,
        order: 4,
        data: {
          title: '🎁 নবজাতক ওয়েলকাম বেবি হ্যাম্পার',
          subtitle: 'বাচ্চার সুরক্ষায় প্রয়োজনীয় সব উপকরণ একসাথে নিলে সরাসরি ৳৪০০ ছাড়!',
          bundles: [
            {
              id: 'kd_bdl_1',
              title: 'নিউবর্ন এসেনশিয়াল কেয়ার বক্স (বোতল + লোশন + শ্যাম্পু + ওয়াইপস)',
              price: 2450,
              originalPrice: 2850,
              saveAmount: 400,
              badge: 'সেরা উপহার',
              imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80',
              itemsList: ['ফিলিপস এভেন্ট অ্যান্টি-কোলিক ফিডিং বোতল', 'সেবাফার্ম বেবি ক্লেনজিং বার ও শ্যাম্পু', 'অ্যালকোহলমুক্ত ওয়েট ওয়াইপস (৮০ পিস)', 'মন্টেসরি কাঠের সেভ পাজল খেলনা']
            }
          ]
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 5,
        data: {
          title: '🍼 শিশু ও বাচ্চাদের সর্বাধিক বিক্রিত সামগ্রী',
        }
      },
      {
        id: 'photo_reviews',
        type: 'photo_reviews',
        enabled: true,
        order: 6,
        data: {
          title: '⭐ মা-বাবাদের বিশ্বস্ত রিভিউ ও বাচ্চাদের হাসিমুখ',
        }
      }
    ];
  }

  // 14. SUPERMARKET DEALS (Dedicated Supermarket Preset)
  if (templateId === 'supermarket_deals') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '🏬', title: 'এক ছাদের নিচে সব নিত্যপণ্য', desc: 'গ্রোসারি, ক্লিনিং, পার্সোনাল কেয়ার ও স্ন্যাক্স' },
            { icon: '💰', title: 'পাইকারি দরে মেগা সেভিংস', desc: 'প্রতিদিন বিশেষ ছাড় ও পয়েন্ট বোনাস' },
            { icon: '⚡', title: 'সুপারফাস্ট হোম ডেলিভারি', desc: 'আপনার কাঙ্ক্ষিত সময়ে নিরাপদ পৌঁছানো' },
            { icon: '💵', title: 'ক্যাশ অন ডেলিভারি', desc: 'পণ্য বুঝে পেয়ে মূল্য পরিশোধ করুন' },
          ]
        }
      },
      {
        id: 'price_tier_store',
        type: 'price_tier_store',
        enabled: true,
        order: 2,
        data: {
          title: '🏷️ মেগামার্ট বাজেট সুপারস্টোর — ফিক্সড প্রাইস জোন',
          subtitle: 'আপনার বাজেট অনুযায়ী বেছে নিন সেরা নিত্যপ্রয়োজনীয় পণ্য',
          tiers: [
            { price: 99, label: '৯৯৳ কর্নার', desc: 'মশলা, বিস্কুট ও স্ন্যাক্স' },
            { price: 199, label: '১৯৯৳ কর্নার', desc: 'গৃহস্থালি ও ক্লিনিং প্যাক' },
            { price: 499, label: '৪৯৯৳ কর্নার', desc: 'তাজা তেল, ডাল ও চিনি কম্বো' },
            { price: 999, label: '৯৯৯৳ মেগা জোন', desc: 'ফ্যামিলি সাইজ গ্রোসারি বাস্কেট' },
          ]
        }
      },
      {
        id: 'flash_sale',
        type: 'flash_sale',
        enabled: true,
        order: 3,
        data: {
          title: '⚡ মেগামার্ট উইকএন্ড সুপার সেভার সেল',
          subtitle: 'স্টক দ্রুত ফুরিয়ে যাচ্ছে! এখনই সাশ্রয়ী মূল্যে অর্ডার করুন',
        }
      },
      {
        id: 'category_scroller',
        type: 'category_scroller',
        enabled: true,
        order: 4,
        data: {
          title: '🛒 সুপারস্টোরের ক্যাটাগরি কালেকশন',
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 5,
        data: {
          title: '🌟 আজকের সুপার ডিল ও জনপ্রিয় পণ্যসমূহ',
        }
      },
      {
        id: 'photo_reviews',
        type: 'photo_reviews',
        enabled: true,
        order: 6,
        data: {
          title: '⭐ সন্তুষ্ট গ্রাহকদের রিভিউ ও রেটিং',
        }
      }
    ];
  }

  // 15. GADGETS & HI-FI AUDIO (Dedicated Audio & Gadgets Preset)
  if (templateId === 'gadgets_audio') {
    return [
      {
        id: 'trust_strip',
        type: 'trust_strip',
        enabled: true,
        order: 1,
        data: {
          items: [
            { icon: '🎧', title: '১০০% অরিজিনাল সাউন্ড গিয়ার', desc: 'Sony, JBL, Marshall ও Anker অফিসিয়াল ওয়ারেন্টি' },
            { icon: '🛡️', title: '১ বছরের অফিসিয়াল রিপ্লেসমেন্ট', desc: 'যেকোনো ত্রুটিতে ঝামেলাহীন সেবা' },
            { icon: '⚡', title: 'সেম-ডে সুপারফাস্ট ডেলিভারি', desc: 'ইনট্যাক্ট সিলপ্যাক বক্সে নিরাপদ পৌঁছানো' },
            { icon: '💵', title: 'ক্যাশ অন ডেলিভারি', desc: 'চেক করে ও টেস্ট করে মূল্য পরিশোধ' },
          ]
        }
      },
      {
        id: 'product_spotlight',
        type: 'product_spotlight',
        enabled: true,
        order: 2,
        data: {
          eyebrow: 'AUDIOPHILE FLAGSHIP SPOTLIGHT',
          title: 'সাউন্ডওয়েভ আল্ট্রা-সাইলেন্স ANC ওয়্যারলেস হেডফোন',
          subtitle: 'স্টুডিও-গ্রেড হাই-রেস অডিও উইথ অ্যাক্টিভ নয়েজ ক্যানসেলেশন',
          description: '৪০ মিমি কাস্টম ডায়নামিক ড্রাইভার ও হাইব্রিড এএনসি প্রযুক্তি। চারপাশের ৯৮% অনাকাঙ্ক্ষিত শব্দ মুছে দেবে নিখুঁত নিস্তব্ধতায়। একবার চার্জে একটানা ৫০ ঘণ্টার নন-স্টপ মিউজিক প্লেব্যাক।',
          price: 5490,
          originalPrice: 6500,
          discountPercent: 15,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
          features: [
            'হাই-রেস ওয়্যারলেস অডিও ও LDAC কোডেক সাপোর্ট',
            '-৪০ ডেসিবল হাইব্রিড অ্যাক্টিভ নয়েজ ক্যানসেলেশন (ANC)',
            '৫০ ঘণ্টার মেগা ব্যাটারি লাইফ উইথ ফাস্ট টাইপ-সি চার্জিং',
            'মাল্টিপয়েন্ট ব্লুটুথ ৫.৩ সংযোগ — ফোন ও ল্যাপটপ একসাথে'
          ],
          badge: 'ফ্ল্যাগশিপ অডিও'
        }
      },
      {
        id: 'category_scroller',
        type: 'category_scroller',
        enabled: true,
        order: 3,
        data: {
          title: '🎵 প্রিমিয়াম অডিও ও গ্যাজেট ক্যাটাগরি',
        }
      },
      {
        id: 'deal_of_the_day',
        type: 'deal_of_the_day',
        enabled: true,
        order: 4,
        data: {
          eyebrow: 'আজকের ফ্ল্যাশ অডিও অফার',
          title: 'ট্রু ওয়্যারলেস ব্লুটুথ ৫.৪ গেমিং ইয়ারবাডস উইথ ৩০ms লো-লেটেন্সি',
          description: 'কোয়াড-মাইক এনভায়রনমেন্টাল নয়েজ ক্যানসেলেশন (ENC) ও ক্রিস্টাল ক্লিয়ার কলিং সুবিধা।',
          price: 1850,
          originalPrice: 2400,
          discountPercent: 23,
          imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
          badge: 'হট ডিল'
        }
      },
      {
        id: 'bento_mosaic',
        type: 'bento_mosaic',
        enabled: true,
        order: 5,
        data: {
          title: '🍱 স্মার্ট সাউন্ড ও গ্যাজেট মোজাইক',
        }
      },
      {
        id: 'product_grid',
        type: 'product_grid',
        enabled: true,
        order: 6,
        data: {
          title: '🔊 শীর্ষ রেটেড হাই-ফাই অডিও ও গ্যাজেটস',
        }
      },
      {
        id: 'brand_marquee',
        type: 'brand_marquee',
        enabled: true,
        order: 7,
        data: {
          brands: ['Sony', 'Bose', 'JBL', 'Marshall', 'Anker', 'Sennheiser', 'Edifier']
        }
      }
    ];
  }

  // DEFAULT FALLBACK (General Smart Commerce)
  return [
    {
      id: 'trust_strip',
      type: 'trust_strip',
      enabled: true,
      order: 1,
      data: {
        items: [
          { icon: '🚚', title: 'সারাদেশে দ্রুত হোম ডেলিভারি', desc: 'Steadfast কুরিয়ারে নিরাপদ পৌঁছানো' },
          { icon: '⭐', title: '১০০% অরিজিনাল ও প্রিমিয়াম কোয়ালিটি', desc: 'যাচাইকৃত সেরা মানের পণ্য' },
          { icon: '💵', title: 'ক্যাশ অন ডেলিভারি', desc: 'পণ্য হাতে পেয়ে নিশ্চিন্তে পেমেন্ট' },
          { icon: '🔄', title: '৭ দিনের সহজ এক্সচেঞ্জ', desc: 'পণ্য পরিবর্তন করার পূর্ণ সুবিধা' },
        ]
      }
    },
    {
      id: 'split_showcase',
      type: 'split_showcase',
      enabled: true,
      order: 2,
      data: {
        eyebrow: 'EXCLUSIVE SPOTLIGHT',
        title: `${titleBn}-এর স্পেশাল কালেকশন`,
        description: 'সর্বোচ্চ কোয়ালিটি, সাশ্রয়ী মূল্য ও নিখুঁত ফিনিশিং। আপনার পছন্দের সেরা পণ্য লুফে নিন এখনই।',
        buttonText: 'কালেকশন দেখুন',
        imageUrl: templateData.bannerImage || templateData.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000&q=80',
        imagePosition: 'right'
      }
    },
    {
      id: 'category_scroller',
      type: 'category_scroller',
      enabled: true,
      order: 3,
      data: {
        title: '✨ জনপ্রিয় ক্যাটাগরি কালেকশন',
      }
    },
    {
      id: 'flash_sale',
      type: 'flash_sale',
      enabled: true,
      order: 4,
      data: {
        title: '⚡ বিশেষ ফ্ল্যাশ সেল — মেগা ডিসকাউন্ট',
      }
    },
    {
      id: 'product_grid',
      type: 'product_grid',
      enabled: true,
      order: 5,
      data: {
        title: `🛍️ ${titleBn}-এর সকল পণ্য`,
      }
    },
    {
      id: 'photo_reviews',
      type: 'photo_reviews',
      enabled: true,
      order: 6,
      data: {
        title: '⭐ গ্রাহকদের সন্তুষ্ট রিভিউ ও রেটিং',
      }
    }
  ];
}
