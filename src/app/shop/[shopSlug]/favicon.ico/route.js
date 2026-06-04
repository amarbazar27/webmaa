import { NextResponse } from 'next/server';
import { getShopBySlug } from '@/lib/firestore';

export async function GET(request, { params }) {
  const { shopSlug } = await params;
  
  try {
    const shop = await getShopBySlug(shopSlug);
    
    if (shop?.logoUrl) {
      // Fetch the logo image
      const imageResponse = await fetch(shop.logoUrl);
      if (imageResponse.ok) {
        const imageBlob = await imageResponse.blob();
        return new NextResponse(imageBlob, {
          headers: {
            'Content-Type': imageResponse.headers.get('content-type') || 'image/png',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=31536000',
          },
        });
      }
    }

    // Dynamic SVG Favicon Fallback if no custom logo uploaded
    const firstLetter = shop?.shopName ? shop.shopName.charAt(0).toUpperCase() : 'S';
    let hash = 0;
    const name = shop?.shopName || 'Shop';
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    const color = `hsl(${hue}, 70%, 50%)`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="100%" height="100%" fill="${color}" rx="8"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="18" font-family="system-ui, sans-serif" font-weight="900">${firstLetter}</text>
    </svg>`;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=31536000',
      },
    });
  } catch (error) {
    console.error(`[favicon.ico] Error generating dynamic favicon for ${shopSlug}:`, error);
    // Return a basic SVG as fallback on error to avoid 500
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="100%" height="100%" fill="#7c3aed" rx="8"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="18" font-family="system-ui, sans-serif" font-weight="900">S</text></svg>`;
    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
