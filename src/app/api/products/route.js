export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// ⚡ High-speed in-memory cache to prevent Firestore read burning
const productsApiCache = new Map();

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

    const cacheKey = `${shopId}_${category || 'all'}_${pageParam || '1'}_${limitParam || 'all'}`;
    const cachedEntry = productsApiCache.get(cacheKey);
    // 30-day (1-month) in-memory cache to eliminate read burn
    if (cachedEntry && Date.now() - cachedEntry.timestamp < 1000 * 60 * 60 * 24 * 30) {
      return NextResponse.json(cachedEntry.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=604800',
          'X-Cache-Status': 'HIT'
        }
      });
    }

    let q = adminDb.collection('shops').doc(shopId).collection('products');

    if (category) {
      q = q.where('category', '==', category);
    }

    q = q.orderBy('createdAt', 'desc');

    let page = 1;
    let limit = 0; // 0 means all (unless specified)

    if (limitParam) {
      limit = Math.min(Math.max(1, parseInt(limitParam, 10) || 20), 100);
      page = Math.max(1, parseInt(pageParam, 10) || 1);
      q = q.offset((page - 1) * limit).limit(limit);
    }

    const snap = await q.get();
    const products = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        price: data.price,
        imageUrl: data.imageUrl || '',
        category: data.category || '',
        stock: data.stock ?? null,
        inStock: data.stock === undefined || data.stock === null || data.stock > 0,
        variants: data.variants || [],
        sizes: data.sizes || [],
        allowCustomize: data.allowCustomize || false,
      };
    });

    const responsePayload = {
      products,
      page,
      limit: limit || products.length,
      count: products.length,
    };

    productsApiCache.set(cacheKey, {
      data: responsePayload,
      timestamp: Date.now()
    });

    if (productsApiCache.size > 200) {
      const oldestKey = productsApiCache.keys().next().value;
      productsApiCache.delete(oldestKey);
    }

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    });
  } catch (err) {
    console.error('[Products API]', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
