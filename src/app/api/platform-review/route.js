export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// PEN-C2 Fix: Use collectionGroup query instead of scanning ALL shops (O(n²) → O(1))
// Previously: loaded every shop doc then queried each shop's orders subcollection
async function getUserCompletedOrderCount(uid, email) {
  if (!adminDb) return 0;
  const orderIds = new Set();
  try {
    // CollectionGroup query across all 'orders' subcollections — single indexed query
    if (email) {
      const byEmail = await adminDb.collectionGroup('orders')
        .where('customerEmail', '==', email.toLowerCase().trim())
        .where('status', '==', 'completed')
        .limit(50)
        .get();
      byEmail.docs.forEach(d => orderIds.add(d.id));
    }

    const byUid = await adminDb.collectionGroup('orders')
      .where('customerId', '==', uid)
      .where('status', '==', 'completed')
      .limit(50)
      .get();
    byUid.docs.forEach(d => orderIds.add(d.id));
  } catch (e) {
    console.error('[Platform Review] Order count query failed');
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

// DELETE: Delete a platform review (superadmin only)
export async function DELETE(req) {
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

    // Verify caller is superadmin
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const isSuperAdmin = userDoc.exists && userDoc.data()?.role === 'superadmin';

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    await adminDb.collection('platform_reviews').doc(reviewId).delete();
    return NextResponse.json({ success: true, deleted: true });
  } catch (err) {
    console.error('[Platform Review DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}

// PATCH: Edit/Update a platform review (superadmin only)
export async function PATCH(req) {
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

    // Verify caller is superadmin
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const isSuperAdmin = userDoc.exists && userDoc.data()?.role === 'superadmin';

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await req.json();
    const { reviewId, rating, text } = body;

    if (!reviewId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'reviewId and rating (1-5) required' }, { status: 400 });
    }

    await adminDb.collection('platform_reviews').doc(reviewId).update({
      rating: Math.round(rating),
      text: (text || '').trim().slice(0, 1000)
    });

    return NextResponse.json({ success: true, edited: true });
  } catch (err) {
    console.error('[Platform Review PATCH]', err);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
