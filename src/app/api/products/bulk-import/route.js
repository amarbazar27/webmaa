import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

function isShopOwner(shopData, uid) {
  return (
    shopData.ownerId === uid ||
    shopData.ownerUid === uid ||
    shopData.createdBy === uid ||
    shopData.userId === uid
  );
}

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    const body = await request.json();
    const { shopId, products } = body;

    if (!shopId || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Shop ID এবং প্রোডাক্ট তালিকা প্রয়োজন' }, { status: 400 });
    }

    // Verify shop ownership
    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      const shopData = shopDoc.data() || {};
      if (!isShopOwner(shopData, authResult.uid) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
      }
    } else if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    // Get existing categories to avoid duplicates
    const catSnap = await adminDb.collection('shops').doc(shopId).collection('categories').get();
    const existingCats = new Set(catSnap.docs.map(d => (d.data().name || '').trim().toLowerCase()));

    const newCategories = new Set();
    const batch = adminDb.batch();
    let count = 0;

    const defaultImages = [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80'
    ];

    for (const item of products.slice(0, 200)) { // limit 200 per batch for performance
      if (!item.name || !item.name.trim()) continue;

      const pRef = adminDb.collection('shops').doc(shopId).collection('products').doc();
      const catName = (item.category || 'সাধারণ').trim();
      
      if (catName && !existingCats.has(catName.toLowerCase()) && !newCategories.has(catName.toLowerCase())) {
        newCategories.add(catName.toLowerCase());
        const catRef = adminDb.collection('shops').doc(shopId).collection('categories').doc();
        batch.set(catRef, {
          name: catName,
          slug: catName.toLowerCase().replace(/\s+/g, '-'),
          createdAt: new Date().toISOString()
        });
      }

      const price = parseFloat(item.price) || 0;
      const costPrice = parseFloat(item.costPrice) || 0;
      const stock = parseInt(item.stock, 10) || 50;
      const imageUrl = item.imageUrl || item.image || defaultImages[count % defaultImages.length];

      batch.set(pRef, {
        name: item.name.trim(),
        price,
        costPrice,
        stock,
        category: catName,
        subCategory: item.subCategory || '',
        description: item.description || '',
        sku: item.sku || `SKU-${Date.now().toString().slice(-6)}-${count + 1}`,
        imageUrl,
        images: [imageUrl],
        hidden: Boolean(item.hidden),
        featured: Boolean(item.featured),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      count++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      importedCount: count,
      newCategoriesCount: newCategories.size,
      message: `${count} টি প্রোডাক্ট সফলভাবে ইমপোর্ট ও যুক্ত করা হয়েছে! 🎉`
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
