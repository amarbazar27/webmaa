import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { retailerUid, retailerEmail, shopId, shopName, ip } = body;

    const logRef = await adminDb.collection('impersonation_logs').add({
      superadminUid: authResult.uid,
      superadminEmail: authResult.email,
      retailerUid: retailerUid || null,
      retailerEmail: retailerEmail || 'unknown',
      shopId: shopId || null,
      shopName: shopName || 'Unknown Shop',
      action: 'start',
      ip: ip || 'unknown',
      loginAt: FieldValue.serverTimestamp(),
      isActive: true
    });

    return NextResponse.json({ success: true, logId: logRef.id });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Impersonate API Error]:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
