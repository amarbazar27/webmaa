export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// ═══════════════════════════════════════════════════════════════
// 🔐 AUTH API — Token verification & user profile
// GET  (with Authorization header) → Verify token, return user data
// POST { action: 'check-role' }    → Check user role
// ═══════════════════════════════════════════════════════════════

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch {
      return NextResponse.json({ authenticated: false, error: 'Invalid token' }, { status: 401 });
    }

    // Fetch user document
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    return NextResponse.json({
      authenticated: true,
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      role: userData?.role || 'user',
      activeShopId: userData?.accessShopId || (userData?.role === 'retailer' ? decoded.uid : null),
    });
  } catch (err) {
    console.error('[Auth API]', err);
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
  }
}

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
    const { action } = body;

    if (action === 'check-role') {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      return NextResponse.json({
        uid: decoded.uid,
        role: userDoc.exists ? (userDoc.data().role || 'user') : 'user',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[Auth POST]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
