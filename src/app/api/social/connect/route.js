import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);

    const { pageId, pageAccessToken, pageName, shopId } = await request.json();
    if (!pageId || !pageAccessToken || !pageName || !shopId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify retailer owns the shop
    const shopDoc = await adminDb.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopData = shopDoc.data() || {};
    const isOwner = shopData.ownerId === authResult.uid ||
                    shopData.ownerUid === authResult.uid ||
                    shopData.createdBy === authResult.uid;
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Subscribe the page to webhooks
    const subscribeRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=messages,feed&access_token=${pageAccessToken}`, {
      method: 'POST'
    });

    const subscribeData = await subscribeRes.json();
    if (!subscribeData.success) {
      return NextResponse.json({ error: 'Failed to subscribe webhook', details: subscribeData }, { status: 400 });
    }

    // Save to Firestore
    await adminDb.collection('social_connections').doc(pageId).set({
      shopId,
      pageAccessToken,
      pageName,
      platform: 'facebook',
      connectedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Social connect error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
    }

    // Verify retailer owns the shop
    const shopDoc = await adminDb.collection('shops').doc(shopId).get();
    if (!shopDoc.exists || shopDoc.data().userId !== authResult.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb.collection('social_connections').where('shopId', '==', shopId).get();
    const connections = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      connections.push({
        id: doc.id,
        pageName: data.pageName,
        platform: data.platform,
        connectedAt: data.connectedAt
      });
    });

    return NextResponse.json({ connections });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Social fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authResult = await verifyAuth(request);

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const pageId = searchParams.get('pageId');

    if (!shopId || !pageId) {
      return NextResponse.json({ error: 'Missing shopId or pageId' }, { status: 400 });
    }

    // Verify retailer owns the shop
    const shopDoc = await adminDb.collection('shops').doc(shopId).get();
    if (!shopDoc.exists || shopDoc.data().userId !== authResult.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const connectionDoc = await adminDb.collection('social_connections').doc(pageId).get();
    if (!connectionDoc.exists || connectionDoc.data().shopId !== shopId) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const pageAccessToken = connectionDoc.data().pageAccessToken;

    // Unsubscribe webhook
    await fetch(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?access_token=${pageAccessToken}`, {
      method: 'DELETE'
    });

    // Remove from Firestore
    await adminDb.collection('social_connections').doc(pageId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Social disconnect error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
