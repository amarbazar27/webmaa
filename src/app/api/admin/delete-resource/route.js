export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

/**
 * HIGH-10: Server-side authenticated delete endpoint for superadmin operations.
 * Replaces direct client-side Firestore deleteDoc calls.
 * 
 * Supports:
 *   - type: 'shop' → deletes shops/{id}
 *   - type: 'retailer_request' → deletes retailer_requests/{id}
 */
export async function POST(request) {
  try {
    // 🔒 Authentication: Require valid Firebase token
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 🔒 Authorization: Only superadmin can delete
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: superadmin only' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id } = body;

    if (!type || !id || typeof id !== 'string' || id.length < 1) {
      return NextResponse.json({ error: 'Invalid request: type and id required' }, { status: 400 });
    }

    // Whitelist of allowed delete targets
    const allowedTypes = {
      'shop': 'shops',
      'retailer_request': 'retailer_requests',
    };

    const collection = allowedTypes[type];
    if (!collection) {
      return NextResponse.json({ error: `Invalid resource type: ${type}` }, { status: 400 });
    }

    // Verify the document exists before deleting
    const docRef = adminDb.collection(collection).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Perform the delete using Admin SDK (bypasses client-side Firestore rules)
    await docRef.delete();

    // Audit log
    console.log(`[Admin Delete] superadmin=${decoded.email} deleted ${collection}/${id}`);

    return NextResponse.json({ success: true, deleted: `${collection}/${id}` });
  } catch (error) {
    console.error('[Admin Delete Error]', error);
    return NextResponse.json({ error: 'Delete operation failed' }, { status: 500 });
  }
}
