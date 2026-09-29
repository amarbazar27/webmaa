export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, shopId = null, platform = 'android', deviceModel = '' } = body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json({ error: 'Valid FCM token is required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const cleanToken = token.trim();
    const tokenData = {
      token: cleanToken,
      platform: platform || 'android',
      deviceModel: deviceModel || 'Unknown Device',
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (shopId && typeof shopId === 'string' && shopId.trim().length > 0) {
      const cleanShopId = shopId.trim();
      tokenData.shopId = cleanShopId;
      await adminDb
        .collection('shops')
        .doc(cleanShopId)
        .collection('fcmTokens')
        .doc(cleanToken)
        .set(tokenData, { merge: true });
    }

    // Always register in global_fcm_tokens for platform-wide broadcasts
    await adminDb
      .collection('global_fcm_tokens')
      .doc(cleanToken)
      .set(tokenData, { merge: true });

    return NextResponse.json({ success: true, message: 'FCM token registered successfully' });
  } catch (error) {
    console.error('[FCM Token API] Error saving token:', error);
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const shopId = searchParams.get('shopId');

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token query parameter required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const cleanToken = token.trim();

    if (shopId && typeof shopId === 'string' && shopId.trim().length > 0) {
      await adminDb
        .collection('shops')
        .doc(shopId.trim())
        .collection('fcmTokens')
        .doc(cleanToken)
        .delete();
    }

    await adminDb.collection('global_fcm_tokens').doc(cleanToken).delete();

    return NextResponse.json({ success: true, message: 'FCM token deleted successfully' });
  } catch (error) {
    console.error('[FCM Token API] Error deleting token:', error);
    return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
  }
}
