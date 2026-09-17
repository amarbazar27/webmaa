export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const slug = searchParams.get('slug');

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Lookup by slug (for public landing page /lp/[slug])
    if (slug) {
      const cleanSlug = slug.toLowerCase().trim();
      let docSnap = null;

      try {
        const snap = await adminDb.collectionGroup('landingPages').where('slug', '==', cleanSlug).limit(1).get();
        if (!snap.empty) {
          docSnap = snap.docs[0];
        }
      } catch (cgErr) {
        console.warn('CollectionGroup query fallback:', cgErr.message);
      }

      // Fallback: If not found or collection group query failed, scan shops
      if (!docSnap) {
        const shopsSnap = await adminDb.collection('shops').get();
        for (const sDoc of shopsSnap.docs) {
          const lpSnap = await sDoc.ref.collection('landingPages').where('slug', '==', cleanSlug).limit(1).get();
          if (!lpSnap.empty) {
            docSnap = lpSnap.docs[0];
            break;
          }
        }
      }

      if (!docSnap) {
        return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
      }

      const data = { id: docSnap.id, ...docSnap.data() };
      
      // Increment view counter safely in background
      docSnap.ref.update({ views: admin.firestore.FieldValue.increment(1) }).catch(() => {});
      
      return NextResponse.json({ landingPage: data });
    }

    // Lookup all landing pages for a specific shop (for merchant dashboard)
    if (shopId) {
      const snap = await adminDb.collection('shops').doc(shopId).collection('landingPages').orderBy('createdAt', 'desc').get();
      const list = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return NextResponse.json({ landingPages: list });
    }

    return NextResponse.json({ error: 'Missing shopId or slug parameter' }, { status: 400 });
  } catch (err) {
    console.error('Landing pages GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const body = await req.json();
    const { 
      shopId, title, slug, headline, subheadline, productId, productName, 
      productImage, offerPrice, regularPrice, features, countdownMinutes, 
      deliveryFeeInside, deliveryFeeOutside, status 
    } = body;

    if (!shopId || !title || !slug || !productId) {
      return NextResponse.json({ error: 'প্রয়োজনীয় তথ্য অসম্পূর্ণ (Shop ID, Title, Slug, Product আবশ্যক)' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');

    // Check if slug already exists in this shop
    const existingSnap = await adminDb.collection('shops').doc(shopId).collection('landingPages').where('slug', '==', cleanSlug).limit(1).get();
    if (!existingSnap.empty) {
      return NextResponse.json({ error: `এই লিংক স্লাগ '${cleanSlug}' ইতিমধ্যে ব্যবহৃত হয়েছে। অন্য একটি স্লাগ দিন।` }, { status: 400 });
    }

    const payload = {
      title: title.trim(),
      slug: cleanSlug,
      headline: headline ? headline.trim() : '',
      subheadline: subheadline ? subheadline.trim() : '',
      productId,
      productName: productName || '',
      productImage: productImage || '',
      offerPrice: parseFloat(offerPrice) || 0,
      regularPrice: parseFloat(regularPrice) || 0,
      features: Array.isArray(features) ? features.filter(f => f && f.trim().length > 0) : [],
      countdownMinutes: parseInt(countdownMinutes) || 20,
      deliveryFeeInside: parseFloat(deliveryFeeInside) || 60,
      deliveryFeeOutside: parseFloat(deliveryFeeOutside) || 120,
      status: status || 'active',
      views: 0,
      ordersCount: 0,
      shopId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('shops').doc(shopId).collection('landingPages').add(payload);

    return NextResponse.json({ 
      success: true, 
      id: docRef.id, 
      landingPage: { id: docRef.id, ...payload } 
    });
  } catch (err) {
    console.error('Landing page POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const body = await req.json();
    const { id, shopId, ...updates } = body;

    if (!id || !shopId) {
      return NextResponse.json({ error: 'Landing page ID and Shop ID required' }, { status: 400 });
    }

    if (updates.slug) {
      updates.slug = updates.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');
    }
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await adminDb.collection('shops').doc(shopId).collection('landingPages').doc(id).update(updates);

    return NextResponse.json({ success: true, message: 'Landing page updated successfully' });
  } catch (err) {
    console.error('Landing page PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const shopId = searchParams.get('shopId');

    if (!id || !shopId) {
      return NextResponse.json({ error: 'Missing id or shopId' }, { status: 400 });
    }

    await adminDb.collection('shops').doc(shopId).collection('landingPages').doc(id).delete();

    return NextResponse.json({ success: true, message: 'Landing page deleted successfully' });
  } catch (err) {
    console.error('Landing page DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
