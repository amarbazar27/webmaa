import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

// Category Presets for High-Converting Visuals
const CATEGORY_PRESETS = {
  fashion: {
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
    logo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=80',
    cats: ['নতুন কালেকশন', 'প্রিমিয়াম আউটফিট', 'ট্রেণ্ডিং ফ্যাশন', 'অফিস ওয়্যার'],
    products: [
      { name: 'এক্সক্লুসিভ প্রিমিয়াম থ্রি-পিস কালেকশন', price: 1850, costPrice: 1200, category: 'নতুন কালেকশন', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80' },
      { name: 'ডিজাইনার জর্জেট কুর্তি ও পালাজো সেট', price: 1450, costPrice: 950, category: 'ট্রেণ্ডিং ফ্যাশন', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80' },
      { name: 'ক্লাসিক সুতি পাঞ্জাবি (হাতের কাজ করা)', price: 1290, costPrice: 800, category: 'প্রিমিয়াম আউটফিট', image: 'https://images.unsplash.com/photo-1629853381665-27a3c75f284e?w=600&auto=format&fit=crop&q=80' },
      { name: 'স্টাইলিশ ক্যাজুয়াল ডেনিম জ্যাকেট', price: 1650, costPrice: 1100, category: 'ট্রেণ্ডিং ফ্যাশন', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80' },
      { name: 'সিল্ক জামদানি শাড়ি (সেলিব্রেশন এডিশন)', price: 3200, costPrice: 2200, category: 'নতুন কালেকশন', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80' },
      { name: 'ফ্লোরাল প্রিন্ট লিনেন কুর্তি', price: 950, costPrice: 600, category: 'অফিস ওয়্যার', image: 'https://images.unsplash.com/photo-1589810635657-232959604134?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  electronics: {
    banner: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=80',
    logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
    cats: ['স্মার্টওয়াচ', 'ওয়্যারলেস ইয়ারবাডস', 'মোবাইল এক্সেসরিজ', 'পাওয়ার ব্যাংক'],
    products: [
      { name: 'আল্ট্রা এইচডি অ্যামোলেড স্মার্টওয়াচ (ওয়াটারপ্রুফ)', price: 2450, costPrice: 1600, category: 'স্মার্টওয়াচ', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80' },
      { name: 'অ্যাক্টিভ নয়েজ ক্যানসেলিং ট্রু ওয়্যারলেস ইয়ারবাডস', price: 1850, costPrice: 1150, category: 'ওয়্যারলেস ইয়ারবাডস', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80' },
      { name: '২০,০০০ mAh ফাস্ট চার্জিং মেটাল পাওয়ার ব্যাংক', price: 1550, costPrice: 1000, category: 'পাওয়ার ব্যাংক', image: 'https://images.unsplash.com/photo-1609592424368-e4b789e9d6d8?w=600&auto=format&fit=crop&q=80' },
      { name: 'RGB গেমিং মেকানিক্যাল কীবোর্ড', price: 2850, costPrice: 1900, category: 'মোবাইল এক্সেসরিজ', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80' },
      { name: 'ম্যাগনেটিক ফাস্ট ওয়্যারলেস কার চার্জার', price: 1150, costPrice: 700, category: 'মোবাইল এক্সেসরিজ', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80' },
      { name: 'পোর্টেবল হাই-বেস ব্লুটুথ স্পিকার (IPX7)', price: 1950, costPrice: 1250, category: 'ওয়্যারলেস ইয়ারবাডস', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80' }
    ]
  },
  grocery: {
    banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&auto=format&fit=crop&q=80',
    logo: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&auto=format&fit=crop&q=80',
    cats: ['খাঁটি মধু ও ঘি', 'অর্গানিক মশলা', 'ড্রাই ফ্রুটস ও বাদাম', 'প্রাকৃতিক তেল'],
    products: [
      { name: 'সুন্দরবনের ১০০% প্রাকৃতিক চাকের খলিসা ফুলের মধু (১ কেজি)', price: 950, costPrice: 650, category: 'খাঁটি মধু ও ঘি', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80' },
      { name: 'সিরাজগঞ্জের প্রিমিয়াম খাঁটি গাওয়া ঘি (৫০০ গ্রাম)', price: 850, costPrice: 580, category: 'খাঁটি মধু ও ঘি', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80' },
      { name: 'প্রিমিয়াম কোয়ালিটি কাজু বাদাম ও পেস্তা মিক্স (৫০০ গ্রাম)', price: 780, costPrice: 520, category: 'ড্রাই ফ্রুটস ও বাদাম', image: 'https://images.unsplash.com/photo-1509912760195-455b89a8c279?w=600&auto=format&fit=crop&q=80' },
      { name: 'ঘানি ভাঙা ১০০% খাঁটি সরিষার তেল (১ লিটার)', price: 320, costPrice: 240, category: 'প্রাকৃতিক তেল', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80' },
      { name: 'প্রিমিয়াম মরিয়ম খেজুর (১ কেজি)', price: 1100, costPrice: 800, category: 'ড্রাই ফ্রুটস ও বাদাম', image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=600&auto=format&fit=crop&q=80' },
      { name: 'হোমমেড স্পেশাল গরম মশলা পাউডার (২০০ গ্রাম)', price: 380, costPrice: 220, category: 'অর্গানিক মশলা', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80' }
    ]
  }
};

// Generate a clean slug
function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30) || `store-${Date.now().toString().slice(-6)}`;
}

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'শুধুমাত্র সুপারঅ্যাডমিন অ্যাক্সেস অনুমোদিত' }, { status: 403 });
    }

    const body = await request.json();
    const { pageName, pageUrl, category = 'fashion', customSlug } = body;

    if (!pageName || !pageName.trim()) {
      return NextResponse.json({ error: 'পেজ বা ব্র্যান্ডের নাম দিন' }, { status: 400 });
    }

    const cleanName = pageName.trim();
    let slug = (customSlug || generateSlug(cleanName)).toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    // Ensure slug is unique
    const existingShop = await adminDb.collection('shops').where('shopSlug', '==', slug).limit(1).get();
    if (!existingShop.empty) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Determine category theme
    let themeKey = 'fashion';
    const catLower = (category || '').toLowerCase();
    if (catLower.includes('gadget') || catLower.includes('elect') || catLower.includes('phone') || catLower.includes('watch')) {
      themeKey = 'electronics';
    } else if (catLower.includes('groc') || catLower.includes('food') || catLower.includes('honey') || catLower.includes('organic')) {
      themeKey = 'grocery';
    }
    const preset = CATEGORY_PRESETS[themeKey] || CATEGORY_PRESETS.fashion;

    // 1. Create Shop Document
    const shopRef = adminDb.collection('shops').doc();
    const shopId = shopRef.id;

    const shopData = {
      shopId,
      shopSlug: slug,
      shopName: cleanName,
      name: cleanName,
      category: category || 'General Commerce',
      description: `${cleanName}-এ আপনাকে স্বাগতম। সারাদেশে দ্রুততম ক্যাশ অন ডেলিভারিতে সেরা পণ্য অর্ডার করুন সরাসরি আমাদের ওয়েবসাইট থেকে।`,
      logoUrl: preset.logo,
      banner: preset.banner,
      contactNumber: '01700000000',
      email: `${slug}@bdretailers.com`,
      status: 'active',
      isLeadStore: true,
      isInstantStore: true,
      claimed: false,
      originalPageUrl: pageUrl || '',
      createdBy: authResult.uid,
      ownerId: authResult.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await shopRef.set(shopData);

    // 2. Setup Homepage Config
    const homepageConfig = {
      sections: [
        {
          id: 'basic_storefront',
          type: 'basic_storefront',
          enabled: true,
          order: 0,
          isPinned: true,
          data: { showDesc: true, showSearch: true, showCategories: true, showProducts: true }
        },
        {
          id: 'hero',
          type: 'hero_carousel',
          enabled: true,
          order: 1,
          data: {
            slides: [
              {
                title: `${cleanName}-এর আকর্ষণীয় অফার!`,
                subtitle: 'প্রিমিয়াম কালেকশনে সীমিত সময়ের বিশেষ ছাড় — অর্ডার করুন এখনই।',
                imageUrl: preset.banner,
                buttonText: 'অর্ডার করুন',
                linkUrl: `/shop/${slug}`
              }
            ]
          }
        },
        {
          id: 'trust_strip',
          type: 'trust_strip',
          enabled: true,
          order: 2,
          data: {}
        },
        {
          id: 'categories',
          type: 'category_scroller',
          enabled: true,
          order: 3,
          data: { items: preset.cats }
        },
        {
          id: 'product_grid',
          type: 'product_grid',
          enabled: true,
          order: 4,
          data: { title: 'আমাদের জনপ্রিয় পণ্যসমূহ', tabs: ['all', 'trending'], maxProducts: 12 }
        },
        {
          id: 'photo_reviews',
          type: 'photo_reviews',
          enabled: true,
          order: 5,
          data: { reviews: [] }
        }
      ],
      updatedAt: new Date().toISOString()
    };

    await adminDb.collection('shops').doc(shopId).collection('settings').doc('homepageConfig').set(homepageConfig);

    // 3. Batch seed products and categories
    const batch = adminDb.batch();

    // Categories
    for (const catName of preset.cats) {
      const cRef = adminDb.collection('shops').doc(shopId).collection('categories').doc();
      batch.set(cRef, {
        name: catName,
        slug: catName.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString()
      });
    }

    // Products
    for (let i = 0; i < preset.products.length; i++) {
      const p = preset.products[i];
      const pRef = adminDb.collection('shops').doc(shopId).collection('products').doc();
      batch.set(pRef, {
        name: p.name,
        price: p.price,
        costPrice: p.costPrice,
        stock: 50,
        category: p.category,
        description: `${cleanName} স্পেশাল ${p.name}। ১০০% অথেনটিক এবং প্রিমিয়াম কোয়ালিটি নিশ্চয়তা। সারাদেশে ক্যাশ অন ডেলিভারি প্রযোজ্য।`,
        imageUrl: p.image,
        images: [p.image],
        sku: `${slug.toUpperCase().slice(0, 4)}-${100 + i}`,
        featured: i < 3,
        createdAt: new Date().toISOString()
      });
    }

    // 4. Save to lead_stores tracking collection
    const leadStoreDoc = {
      shopId,
      shopSlug: slug,
      pageName: cleanName,
      pageUrl: pageUrl || '',
      category: category || 'General',
      liveUrl: `https://bdretailers.com/shop/${slug}`,
      createdAt: new Date().toISOString(),
      status: 'ready'
    };
    batch.set(adminDb.collection('lead_stores').doc(shopId), leadStoreDoc);

    await batch.commit();

    const liveUrl = `https://bdretailers.com/shop/${slug}`;
    const pitchMessage = `আসসালামু আলাইকুম ${cleanName} টিম! 🎉\nআমরা লক্ষ্য করেছি আপনারা ফেসবুকে দারুণ কাজ করছেন। আপনাদের পেজের পণ্যের উপর ভিত্তি করে ১ মিনিটে সম্পূর্ণ ফ্রি একটি প্রিমিয়াম লাইভ ই-কমার্স ওয়েবসাইট বানিয়ে ফেলেছি:\n👉 ${liveUrl}\n\nআপনার কাস্টমাররা এখান থেকে সরাসরি ছবি দেখে ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারবে এবং স্বয়ংক্রিয় এসএমএস/ইনভয়েস পাবে। ওয়েবসাইটটি দেখে ভালো লাগলে আপনার নিজস্ব ডোমেইন কানেক্ট করে আজ থেকেই অফিসিয়ালি চালু করতে পারেন!`;

    return NextResponse.json({
      success: true,
      shopId,
      shopSlug: slug,
      liveUrl,
      pitchMessage,
      message: `"${cleanName}"-এর জন্য লাইভ ই-কমার্স ওয়েবসাইট সফলভাবে তৈরি হয়েছে! 🚀`
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Create instant store error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'অননুমোদিত' }, { status: 403 });
    }

    const snap = await adminDb.collection('lead_stores').orderBy('createdAt', 'desc').limit(50).get();
    const stores = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ stores });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
