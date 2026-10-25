import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

function isShopOwner(shopData, uid, shopId) {
  return (
    shopId === uid ||
    shopData?.id === uid ||
    shopData?.ownerId === uid ||
    shopData?.ownerUid === uid ||
    shopData?.createdBy === uid ||
    shopData?.userId === uid ||
    shopData?.ownerEmail === uid ||
    (Array.isArray(shopData?.staffEmails) && shopData.staffEmails.length > 0)
  );
}

async function resolveShop(shopId) {
  if (!shopId) return null;
  const docRef = adminDb.collection('shops').doc(shopId);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() };
  }

  const qOwner = await adminDb.collection('shops').where('ownerId', '==', shopId).limit(1).get();
  if (!qOwner.empty) return { id: qOwner.docs[0].id, ...qOwner.docs[0].data() };

  const qCreated = await adminDb.collection('shops').where('createdBy', '==', shopId).limit(1).get();
  if (!qCreated.empty) return { id: qCreated.docs[0].id, ...qCreated.docs[0].data() };

  const qSlug = await adminDb.collection('shops').where('shopSlug', '==', shopId).limit(1).get();
  if (!qSlug.empty) return { id: qSlug.docs[0].id, ...qSlug.docs[0].data() };

  return null;
}

// GET: Fetch conversations for a shop via Admin SDK (Reliable fallback against client SDK issues)
export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'shopId প্রয়োজন' }, { status: 400 });
    }

    // BOLA/IDOR Protection
    if (shopId !== 'main') {
      const foundShop = await resolveShop(shopId);
      if (!foundShop) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      if (!isShopOwner(foundShop, authResult.uid, shopId) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb
      .collection('shops')
      .doc(shopId)
      .collection('conversations')
      .limit(100)
      .get();

    const conversations = [];
    snapshot.forEach(doc => {
      const d = doc.data();
      conversations.push({
        id: doc.id,
        ...d,
        lastMessageAt: d.lastMessageAt?.toDate ? d.lastMessageAt.toDate().toISOString() : d.lastMessageAt,
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
      });
    });

    // Sort client-side safely
    conversations.sort((a, b) => {
      const tA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
      const tB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
      return tB - tA;
    });

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Conversations API Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
