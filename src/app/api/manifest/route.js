import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shopSlug = searchParams.get('shop');

  // Default Webmaa Dashboard Manifest
  const defaultManifest = {
    name: "Webmaa Dashboard",
    short_name: "Webmaa",
    description: "Premium Retail Management Platform",
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

  if (!shopSlug) {
    return NextResponse.json(defaultManifest);
  }

  try {
    const q = query(collection(db, 'shops'), where('subdomainSlug', '==', shopSlug));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      return NextResponse.json(defaultManifest);
    }
    
    const shop = snap.docs[0].data();
    
    // Custom Retailer Shop Manifest
    return NextResponse.json({
      name: shop.shopName || "Webmaa Store",
      short_name: shop.shopName ? shop.shopName.substring(0, 12) : "Store",
      description: shop.slogan || "Online Store",
      start_url: `/shop/${shopSlug}`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#9333ea", // Can also pull from shop settings if available
      orientation: "portrait-primary",
      icons: [
        {
          src: shop.shopLogo || "/logo.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: shop.shopLogo || "/logo.png",
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
