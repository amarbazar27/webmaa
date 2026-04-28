import { NextResponse } from 'next/server';
import { getShopBySlug } from '@/lib/firestore';

export async function GET(request, { params }) {
  const { shopSlug } = await params;
  
  try {
    const shop = await getShopBySlug(shopSlug);
    // If shop has no logo, fallback to Webmaa default
    const logoUrl = shop?.logoUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://webmaa.vercel.app'}/logo.png`;
    
    // Fetch the logo image
    // Note: We use fetch to get the actual image data because /favicon.ico must return an image response, not a redirect
    // Some bots like Googlebot strictly require a 200 OK image response
    const imageResponse = await fetch(logoUrl);
    
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch shop logo');
    }
    
    const imageBlob = await imageResponse.blob();
    
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': imageResponse.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=31536000',
      },
    });
  } catch (error) {
    console.error(`[favicon.ico] Error generating dynamic favicon for ${shopSlug}:`, error);
    // Return a transparent 1x1 pixel or default on error to avoid 500
    const fallbackPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
    return new NextResponse(fallbackPixel, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
