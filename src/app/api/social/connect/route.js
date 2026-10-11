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
    let { pageId, pageAccessToken, pageName, shopId } = body;

    if (!pageAccessToken || !shopId) {
      return NextResponse.json({ error: 'Page Access Token এবং Shop ID প্রয়োজন' }, { status: 400 });
    }

    // Verify retailer owns the shop
    const shopDoc = await adminDb.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopData = shopDoc.data() || {};
    if (!isShopOwner(shopData, authResult.uid)) {
      return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    // Auto-fetch Page Name and Page ID from Meta Graph API if missing
    try {
      const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${pageAccessToken.trim()}`);
      const meData = await meRes.json();
      if (meData.id) {
        pageId = pageId || meData.id;
        pageName = pageName || meData.name || 'Facebook Page';
      }
    } catch (graphErr) {
      console.warn('[Social Connect] Meta /me lookup warning:', graphErr.message);
    }

    if (!pageId) {
      pageId = `page_${Date.now()}`;
    }
    if (!pageName) {
      pageName = shopData.shopName || 'Facebook Page';
    }

    // Attempt to subscribe page to webhooks
    let webhookSubscribed = false;
    try {
      const subscribeRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${pageAccessToken.trim()}`,
        { method: 'POST' }
      );
      const subscribeData = await subscribeRes.json();
      webhookSubscribed = Boolean(subscribeData.success);
    } catch (subErr) {
      console.warn('[Social Connect] Webhook subscription warning:', subErr.message);
    }

    // Save connection to Firestore
    const connectionPayload = {
      shopId,
      pageId,
      pageAccessToken: pageAccessToken.trim(),
      pageName,
      platform: 'facebook',
      webhookSubscribed,
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('social_connections').doc(pageId).set(connectionPayload, { merge: true });

    // Also mirror connection under shop document
    await adminDb.collection('shops').doc(shopId).collection('socialConnections').doc('facebook').set(connectionPayload, { merge: true });

    return NextResponse.json({
      success: true,
      pageId,
      pageName,
      webhookSubscribed,
      message: 'Facebook পেজ সফলভাবে যুক্ত হয়েছে! 🎉',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Social connect error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
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
    if (!shopDoc.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopData = shopDoc.data() || {};
    if (!isShopOwner(shopData, authResult.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb.collection('social_connections').where('shopId', '==', shopId).get();
    const connections = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      connections.push({
        id: doc.id,
        pageId: data.pageId || doc.id,
        pageName: data.pageName,
        platform: data.platform || 'facebook',
        webhookSubscribed: data.webhookSubscribed || false,
        connectedAt: data.connectedAt,
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
    if (!shopDoc.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopData = shopDoc.data() || {};
    if (!isShopOwner(shopData, authResult.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await adminDb.collection('social_connections').doc(pageId).delete();
    await adminDb.collection('shops').doc(shopId).collection('socialConnections').doc('facebook').delete().catch(() => {});

    return NextResponse.json({ success: true, message: 'ডিসকানেক্ট সম্পন্ন হয়েছে' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Social disconnect error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
