export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// Helper to sum completed orders across all shops
async function getUserCompletedOrderCount(uid, email) {
  if (!adminDb) return 0;
  const orderIds = new Set();
  try {
    const shopsSnap = await adminDb.collection('shops').get();
    for (const shopDoc of shopsSnap.docs) {
      const ordersRef = shopDoc.ref.collection('orders');
      
      if (email) {
        const snap = await ordersRef
          .where('customerEmail', '==', email.toLowerCase().trim())
          .where('status', '==', 'completed')
          .get();
        snap.docs.forEach(d => orderIds.add(d.id));
      }
      
      const snap2 = await ordersRef
        .where('customerId', '==', uid)
        .where('status', '==', 'completed')
        .get();
      snap2.docs.forEach(d => orderIds.add(d.id));
    }
  } catch (e) {
    console.error("Order Count Error:", e);
  }
  return orderIds.size;
}

// GET: Fetch all platform reviews
export async function GET(req) {
  try {
    if (!adminDb) {
      return NextResponse.json({ reviews: [] });
    }
    const snap = await adminDb
      .collection('platform_reviews')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('[Platform Review GET]', err);
    return NextResponse.json({ error: 'Failed to fetch platform reviews' }, { status: 500 });
  }
}

// POST: Add platform review
export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { rating, text, screenshotUrl } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating (1-5) is required' }, { status: 400 });
    }

    const userEmail = decoded.email?.toLowerCase().trim();
    const uid = decoded.uid;

    // Get order count
    const orderCount = await getUserCompletedOrderCount(uid, userEmail);

    // Duplicate check
    const existing = await adminDb
      .collection('platform_reviews')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({
        error: 'আপনি ইতোমধ্যে প্ল্যাটফর্মে রিভিউ দিয়েছেন।'
      }, { status: 409 });
    }

    const reviewRef = adminDb.collection('platform_reviews').doc();
    await reviewRef.set({
      uid,
      email: userEmail || '',
      name: decoded.name || 'Anonymous User',
      photoURL: decoded.picture || '',
      rating: Math.round(rating),
      text: (text || '').trim().slice(0, 1000),
      screenshotUrl: screenshotUrl || '',
      orderCount,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, reviewId: reviewRef.id });
  } catch (err) {
    console.error('[Platform Review POST]', err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
