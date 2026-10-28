import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);

    const body = await request.json();
    const { shopId, conversationId, recipientId, message, platform = 'facebook' } = body;

    if (!shopId || !recipientId || !message?.trim()) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify retailer owns the shop (or superadmin for main)
    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      const shopData = shopDoc.data() || {};
      const isOwner = authResult.role === 'superadmin' ||
                      shopData.ownerId === authResult.uid ||
                      shopData.ownerUid === authResult.uid ||
                      shopData.createdBy === authResult.uid;
      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Lookup social connection pageAccessToken
    const connectionsSnap = await adminDb.collection('social_connections')
      .where('shopId', '==', shopId)
      .limit(5)
      .get();

    let pageAccessToken = null;
    if (!connectionsSnap.empty) {
      pageAccessToken = connectionsSnap.docs[0].data().pageAccessToken;
    }

    // If access token found, dispatch via Meta Graph API
    let metaSent = false;
    if (pageAccessToken && platform === 'facebook') {
      try {
        const metaRes = await fetch('https://graph.facebook.com/v26.0/me/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: message.trim() },
            messaging_type: 'RESPONSE',
            access_token: pageAccessToken,
          }),
        });
        const metaData = await metaRes.json();
        if (metaData.message_id) {
          metaSent = true;
        } else {
          console.warn('[Social Send] Meta Graph API warning:', metaData);
        }
      } catch (metaErr) {
        console.error('[Social Send] Meta dispatch failed:', metaErr.message);
      }
    } else if (platform === 'whatsapp') {
      try {
        const waSnap = await adminDb.collection('shops').doc(shopId).collection('socialConnections').doc('whatsapp').get();
        if (waSnap.exists) {
          const { phoneNumberId, accessToken } = waSnap.data();
          const cleanRecipient = recipientId.replace('wa_', '');
          const waRes = await fetch(`https://graph.facebook.com/v26.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: cleanRecipient,
              text: { body: message.trim() }
            })
          });
          const waData = await waRes.json();
          if (waData.messages?.[0]?.id) {
            metaSent = true;
          }
        }
      } catch (waErr) {
        console.error('[Social Send] WhatsApp Cloud API dispatch failed:', waErr.message);
      }
    }

    // Append to conversation document in Firestore
    const convRef = adminDb.collection('shops').doc(shopId).collection('conversations').doc(conversationId || recipientId);
    const newMessageObj = {
      role: 'retailer',
      senderName: authResult.name || 'Owner',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      sentViaApi: metaSent,
    };

    await convRef.set({
      lastMessage: message.trim(),
      lastMessageAt: FieldValue.serverTimestamp(),
      aiPaused: true, // Retailer took over, auto pause AI!
      updatedAt: FieldValue.serverTimestamp(),
      messages: FieldValue.arrayUnion(newMessageObj),
    }, { merge: true });

    return NextResponse.json({ success: true, metaSent, message: newMessageObj });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Social Send Message API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
