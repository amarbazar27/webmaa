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

    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    let q = adminDb.collection('shops').doc(shopId).collection('products');

    if (category) {
      q = q.where('category', '==', category);
    }

    const snap = await q.orderBy('createdAt', 'desc').get();
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
      total: products.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      }
    });
  } catch (err) {
    console.error('[Products API]', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
