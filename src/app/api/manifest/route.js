import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shopSlug = searchParams.get('shop');

  const defaultManifest = {
    name: "BDRetailers — আপনার ব্যবসার ডিজিটাল পার্টনার",
    short_name: "BDRetailers",
    description: "বাংলাদেশের সবচেয়ে আধুনিক ও প্রিমিয়াম এআই-পাওয়ার্ড অনলাইন মার্কেটপ্লেস ও ই-কমার্স সলিউশন।",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#9333ea",
    orientation: "portrait-primary",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  };

  if (!shopSlug || !adminDb) {
    return NextResponse.json(defaultManifest);
  }

  try {
    const shopsRef = adminDb.collection('shops');
    let snap = await shopsRef.where('subdomainSlug', '==', shopSlug).limit(1).get();
    if (snap.empty) {
      snap = await shopsRef.where('shopSlug', '==', shopSlug).limit(1).get();
    }
    
    if (snap.empty) {
      return NextResponse.json(defaultManifest);
    }
    
    const shop = snap.docs[0].data();
    
    return NextResponse.json({
      name: shop.shopName || "BDRetailers Store",
      short_name: shop.shopName ? shop.shopName.substring(0, 12) : "Store",
      description: shop.slogan || "Online Store",
      start_url: `/shop/${shopSlug}`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#9333ea",
      orientation: "portrait-primary",
      icons: [
        {
          src: shop.logoUrl || "/logo.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: shop.logoUrl || "/logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    });
  } catch (error) {
    console.error("Manifest Generation Error:", error);
    return NextResponse.json(defaultManifest);
  }
}
