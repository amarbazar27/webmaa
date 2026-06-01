import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shopSlug = searchParams.get('shop');

  const defaultManifest = {
    name: "Daripallah Dashboard",
    short_name: "Daripallah",
    description: "Premium AI-Powered Multi-Vendor Marketplace",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#9333ea",
    orientation: "portrait-primary",
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
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
      name: shop.shopName || "Daripallah Store",
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
