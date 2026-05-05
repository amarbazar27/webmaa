export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// ═══════════════════════════════════════════════════════════════
// 📝 REVIEW API — Verified Buyer Reviews
//
// GET  ?shopId=xxx                → List all reviews (public)
// POST { shopId, rating, text }   → Create review (auth required, buyer verified)
// PATCH { shopId, reviewId, action } → Pin/unpin/delete (shop admin)
// ═══════════════════════════════════════════════════════════════

// ── GET: Public review listing ──────────────────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    const snap = await adminDb
      .collection('shops').doc(shopId)
      .collection('reviews')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Sort: pinned first, then by date
    reviews.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('[Review GET]', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// ── POST: Create review (verified buyer only) ───────────────
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
    const { shopId, rating, text } = body;

    if (!shopId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'shopId and rating (1-5) required' }, { status: 400 });
    }

    if (text && text.length > 500) {
      return NextResponse.json({ error: 'Review text too long (max 500)' }, { status: 400 });
    }

    const userEmail = decoded.email?.toLowerCase();
    const uid = decoded.uid;

    // ── Verified Buyer Check ────────────────────────────────
    // Search orders by email or customerId
    let orderCount = 0;
    let latestOrderId = null;

    const ordersRef = adminDb.collection('shops').doc(shopId).collection('orders');

    // Try email match first
    if (userEmail) {
      const byEmail = await ordersRef
        .where('customerEmail', '==', userEmail)
        .where('status', '==', 'completed')
        .get();
      orderCount = byEmail.size;
      if (!byEmail.empty) {
        latestOrderId = byEmail.docs[0].data().orderIdVisual || byEmail.docs[0].id;
      }
    }

    // Fallback: try customerId match
    if (orderCount === 0) {
      const byUid = await ordersRef
        .where('customerId', '==', uid)
        .where('status', '==', 'completed')
        .get();
      orderCount = byUid.size;
      if (!byUid.empty) {
        latestOrderId = byUid.docs[0].data().orderIdVisual || byUid.docs[0].id;
      }
    }

    if (orderCount === 0) {
      return NextResponse.json({
        error: 'শুধুমাত্র ভেরিফাইড ক্রেতারা রিভিউ দিতে পারবেন। অন্তত একটি সম্পন্ন অর্ডার থাকতে হবে।'
      }, { status: 403 });
    }

    // ── Duplicate Check ─────────────────────────────────────
    const existingReview = await adminDb
      .collection('shops').doc(shopId)
      .collection('reviews')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (!existingReview.empty) {
      return NextResponse.json({
        error: 'আপনি ইতোমধ্যে এই স্টোরে রিভিউ দিয়েছেন।'
      }, { status: 409 });
    }

    // ── Save Review ─────────────────────────────────────────
    const reviewRef = adminDb
      .collection('shops').doc(shopId)
      .collection('reviews').doc();

    await reviewRef.set({
      uid,
      email: userEmail || '',
      name: decoded.name || 'Customer',
      photoURL: decoded.picture || '',
      rating: Math.round(rating),
      text: (text || '').trim().slice(0, 500),
      orderCount,
      trackingId: latestOrderId || '',
      pinned: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, reviewId: reviewRef.id });
  } catch (err) {
    console.error('[Review POST]', err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

// ── PATCH: Pin/Unpin/Delete review (shop admin only) ────────
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

    const body = await req.json();
    const { shopId, reviewId, action } = body; // action: 'pin' | 'unpin' | 'delete'

    if (!shopId || !reviewId || !action) {
      return NextResponse.json({ error: 'shopId, reviewId, action required' }, { status: 400 });
    }

    // Verify caller is shop owner or superadmin
    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shopData = shopSnap.data();
    const isOwner = shopData.ownerId === decoded.uid;
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const isSuperAdmin = userDoc.exists && userDoc.data()?.role === 'superadmin';
    const isStaff = (shopData.staffEmails || []).includes(decoded.email?.toLowerCase());

    if (!isOwner && !isSuperAdmin && !isStaff) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const reviewRef = adminDb
      .collection('shops').doc(shopId)
      .collection('reviews').doc(reviewId);

    if (action === 'delete') {
      await reviewRef.delete();
      return NextResponse.json({ success: true, deleted: true });
    }

    if (action === 'pin') {
      await reviewRef.update({ pinned: true });
    } else if (action === 'unpin') {
      await reviewRef.update({ pinned: false });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Review PATCH]', err);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
