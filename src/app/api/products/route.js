import { NextResponse } from 'next/server';
import { getProductsServer } from '@/lib/server-fetch';

export const revalidate = 2592000; // 30 days edge cache

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const category = searchParams.get('category');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    // ⚡ Reuses the global deduplicated, Redis & memory-cached products list (0 extra Firestore reads)
    const allProducts = await getProductsServer(shopId);

    let filtered = allProducts;
    if (category && category !== 'all') {
      const lowerCat = category.trim().toLowerCase();
      filtered = filtered.filter(p => (p.category || '').trim().toLowerCase() === lowerCat);
    }

    const totalCount = filtered.length;
    let page = 1;
    let limit = totalCount;

    if (limitParam) {
      limit = Math.min(Math.max(1, parseInt(limitParam, 10) || 20), 100);
      page = Math.max(1, parseInt(pageParam, 10) || 1);
      const start = (page - 1) * limit;
      filtered = filtered.slice(start, start + limit);
    }

    const products = filtered.map(data => ({
      id: data.id,
      name: data.name || '',
      price: data.price || 0,
      imageUrl: data.imageUrl || '',
      image: data.image || '',
      images: Array.isArray(data.images) ? data.images : (data.images ? [data.images] : []),
      category: data.category || '',
      stock: data.stock ?? null,
      inStock: data.stock === undefined || data.stock === null || data.stock > 0,
      variants: data.variants || [],
      sizes: data.sizes || [],
      allowCustomize: data.allowCustomize || false,
    }));

    const responsePayload = {
      products,
      page,
      limit,
      count: totalCount,
    };

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=2592000',
        'CDN-Cache-Control': 'public, max-age=2592000',
        'X-Cache-Source': 'bdretailers-unified-cache'
      }
    });
  } catch (err) {
    console.error('[Products API]', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
