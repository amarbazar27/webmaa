import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

function isShopOwner(shopData, uid) {
  return (
    shopData.ownerId === uid ||
    shopData.ownerUid === uid ||
    shopData.createdBy === uid ||
    shopData.userId === uid
  );
}

// GET: Retrieve social & comment automation settings for a shop
export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
    }

    // Allow superadmin access or shop owner access
    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      const shopData = shopDoc.data() || {};
      if (!isShopOwner(shopData, authResult.uid) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const settingsDoc = await adminDb.collection('shops').doc(shopId).collection('settings').doc('socialAutomation').get();
    const data = settingsDoc.exists ? settingsDoc.data() : {};

    return NextResponse.json({ success: true, settings: data });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Social Settings API] GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Save social, comment automation, and saved replies
export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    const body = await request.json();
    const { shopId, commentAutomation, aiSettings, savedReplies, knowledgeBase } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
    }

    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      const shopData = shopDoc.data() || {};
      if (!isShopOwner(shopData, authResult.uid) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const updatePayload = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: authResult.uid,
    };

    if (commentAutomation !== undefined) updatePayload.commentAutomation = commentAutomation;
    if (aiSettings !== undefined) updatePayload.aiSettings = aiSettings;
    if (savedReplies !== undefined) updatePayload.savedReplies = savedReplies;
    if (knowledgeBase !== undefined) updatePayload.knowledgeBase = knowledgeBase;

    // 1. Save in subcollection settings/socialAutomation using Admin SDK
    await adminDb.collection('shops').doc(shopId).collection('settings').doc('socialAutomation').set(updatePayload, { merge: true });

    // 2. Also mirror on the root shop document for instant access
    await adminDb.collection('shops').doc(shopId).set(updatePayload, { merge: true });

    return NextResponse.json({ success: true, message: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে! 🎉' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Social Settings API] POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
