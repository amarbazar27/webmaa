import { NextResponse } from 'next/server';
import { getAllMarketplaceProductsServer, getAllShopsServer } from '@/lib/server-fetch';

// ⚡ Cache globally for 5 minutes (eliminates thousands of Firestore reads per day from repeat visits and search bots)
export const revalidate = 86400;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeShops = searchParams.get('includeShops') === 'true';

    const [products, shops] = await Promise.all([
      getAllMarketplaceProductsServer(),
      includeShops ? getAllShopsServer() : Promise.resolve(null)
    ]);

    const res = NextResponse.json({
      success: true,
      count: products.length,
      products,
      ...(shops ? { shops: shops.filter(s => s.isActive !== false && s.showOnMainSite !== false) } : {})
    });

    // ⚡ Edge and Browser Cache Headers (5 min edge cache, 10 min SWR)
    res.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
    return res;
  } catch (error) {
    console.error('[API Marketplace Products] Error:', error);
    return NextResponse.json({ 
      success: false, 
      products: [], 
      error: error.message 
    }, { status: 500 });
  }
}
