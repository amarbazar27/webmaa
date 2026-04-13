import { getShopBySlug } from '@/lib/firestore';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  }

  // Generate dynamic manifest
  const manifest = {
    name: shop.shopName || shop.subdomainSlug,
    short_name: shop.shopName || shop.subdomainSlug,
    description: shop.description || shop.slogan || "An awesome decentralized shop.",
    start_url: `/shop/${shopSlug}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#9333ea",
    icons: [
      {
        src: shop.logoUrl || "/retailer-fallback.png",
        sizes: "192x192 512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };

  return NextResponse.json(manifest);
}
