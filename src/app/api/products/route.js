export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
// ═══════════════════════════════════════════════════════════════
// 🛍️ PRODUCTS API — Public product listing
// GET ?shopId=xxx                → All products for a shop
// GET ?shopId=xxx&category=xxx   → Filtered by category
// ═══════════════════════════════════════════════════════════════

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

    return NextResponse.json({
      products,
      page,
      limit: limit || products.length,
      count: products.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    });
  } catch (err) {
    console.error('[Products API]', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
