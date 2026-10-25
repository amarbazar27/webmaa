import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

function isShopOwner(shopData, uid, shopId) {
  return (
    shopId === uid ||
    shopData?.id === uid ||
    shopData?.ownerId === uid ||
    shopData?.ownerUid === uid ||
    shopData?.createdBy === uid ||
    shopData?.userId === uid ||
    shopData?.ownerEmail === uid
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

// GET: Fetch team members for a shop
export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'shopId প্রয়োজন' }, { status: 400 });
    }

    // BOLA/IDOR Protection: Verify caller owns shop or is superadmin
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

    const teamSnapshot = await adminDb
      .collection('shops')
      .doc(shopId)
      .collection('team')
      .orderBy('createdAt', 'desc')
      .get();

    const team = [];
    teamSnapshot.forEach(doc => {
      const d = doc.data();
      team.push({
        id: doc.id,
        name: d.name || '',
        email: d.email || '',
        phone: d.phone || '',
        role: d.role || 'agent',
        permissions: d.permissions || ['chat_reply'],
        status: d.status || 'active',
        createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate().toISOString() : d.createdAt) : null,
      });
    });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Team API GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a new team member
export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    const body = await request.json();
    const { shopId, name, email, phone, role = 'agent', permissions = ['chat_reply'] } = body;

    if (!shopId || !name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'নাম এবং ইমেইল আবশ্যক' }, { status: 400 });
    }

    // Sanitize & Validate Email
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'সঠিক ইমেইল অ্যাড্রেস লিখুন' }, { status: 400 });
    }

    // BOLA/IDOR Protection: Verify caller owns shop or is superadmin
    if (shopId !== 'main') {
      const foundShop = await resolveShop(shopId);
      if (!foundShop) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      if (!isShopOwner(foundShop, authResult.uid, shopId) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
      }
    } else if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    // Check if team member email already exists
    const existingSnap = await adminDb
      .collection('shops')
      .doc(shopId)
      .collection('team')
      .where('email', '==', cleanEmail)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json({ error: 'এই ইমেইলের সদস্য ইতিমধ্যে যুক্ত আছেন' }, { status: 409 });
    }

    const newMember = {
      name: name.trim().slice(0, 100),
      email: cleanEmail,
      phone: (phone || '').trim().slice(0, 20),
      role: ['manager', 'agent'].includes(role) ? role : 'agent',
      permissions: Array.isArray(permissions) ? permissions : ['chat_reply'],
      status: 'active',
      addedBy: authResult.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb
      .collection('shops')
      .doc(shopId)
      .collection('team')
      .add(newMember);

    // Also mirror email in shop document staffEmails array for firestore.rules compatibility
    await adminDb.collection('shops').doc(shopId).set({
      staffEmails: FieldValue.arrayUnion(cleanEmail),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'টিম মেম্বার সফলভাবে যুক্ত হয়েছেন! 🎉',
      member: { id: docRef.id, ...newMember, createdAt: new Date().toISOString() },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Team API POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update status or permissions
export async function PUT(request) {
  try {
    const authResult = await verifyAuth(request);
    const body = await request.json();
    const { shopId, memberId, status, role, permissions } = body;

    if (!shopId || !memberId) {
      return NextResponse.json({ error: 'shopId এবং memberId প্রয়োজন' }, { status: 400 });
    }

    // BOLA/IDOR Protection
    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      const shopData = shopDoc.data() || {};
      if (!isShopOwner(shopData, authResult.uid) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatePayload = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (status !== undefined) updatePayload.status = status;
    if (role !== undefined) updatePayload.role = role;
    if (permissions !== undefined) updatePayload.permissions = permissions;

    await adminDb
      .collection('shops')
      .doc(shopId)
      .collection('team')
      .doc(memberId)
      .update(updatePayload);

    return NextResponse.json({ success: true, message: 'টিম মেম্বার তথ্য আপডেট হয়েছে' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Team API PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove team member
export async function DELETE(request) {
  try {
    const authResult = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const memberId = searchParams.get('memberId');

    if (!shopId || !memberId) {
      return NextResponse.json({ error: 'shopId এবং memberId প্রয়োজন' }, { status: 400 });
    }

    // BOLA/IDOR Protection
    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      const shopData = shopDoc.data() || {};
      if (!isShopOwner(shopData, authResult.uid) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const memberDoc = await adminDb.collection('shops').doc(shopId).collection('team').doc(memberId).get();
    if (memberDoc.exists) {
      const memberEmail = memberDoc.data()?.email;
      if (memberEmail) {
        await adminDb.collection('shops').doc(shopId).set({
          staffEmails: FieldValue.arrayRemove(memberEmail),
        }, { merge: true }).catch(() => {});
      }
      await adminDb.collection('shops').doc(shopId).collection('team').doc(memberId).delete();
    }

    return NextResponse.json({ success: true, message: 'টিম মেম্বার অপসারিত হয়েছে' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Team API DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
