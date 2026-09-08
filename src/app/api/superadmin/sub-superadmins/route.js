export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// ── Auth Guard: Verifies Firebase ID token + superadmin privileges ──
async function verifySuperAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized: Missing token', status: 401 };
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const callerEmail = (decoded.email || '').toLowerCase().trim();

    const envAdmin = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
    const isEnvAdmin = envAdmin && callerEmail === envAdmin;
    const isHardcodedAdmin = callerEmail === 'amarbazar27@gmail.com';

    if (isEnvAdmin || isHardcodedAdmin) {
      // Auto-ensure superadmin role on caller's user doc in Firestore if needed
      if (adminDb && decoded.uid) {
        try {
          const userRef = adminDb.collection('users').doc(decoded.uid);
          const snap = await userRef.get();
          if (!snap.exists || snap.data()?.role !== 'superadmin') {
            await userRef.set({ role: 'superadmin', email: callerEmail }, { merge: true });
          }
        } catch (_) {}
      }
      return { uid: decoded.uid, email: callerEmail };
    }

    // Otherwise check Firestore user doc
    if (adminDb) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'superadmin') {
        return { uid: decoded.uid, email: callerEmail };
      }
    }

    return { error: 'Forbidden: Root superadmin access required', status: 403 };
  } catch (err) {
    console.error('[API sub-superadmins] Auth error:', err.message);
    return { error: 'Unauthorized: Invalid or expired token', status: 401 };
  }
}

// GET: Fetch all sub-superadmins
export async function GET(request) {
  const auth = await verifySuperAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database connection unavailable' }, { status: 500 });
  }

  try {
    const snapshot = await adminDb.collection('sub_superadmins').orderBy('createdAt', 'desc').get();
    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : null,
      updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate().toISOString() : null,
    }));

    return NextResponse.json({ subSuperAdmins: list });
  } catch (err) {
    console.error('[API sub-superadmins GET] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Add new sub-superadmin
export async function POST(request) {
  const auth = await verifySuperAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database connection unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const email = (body.email || '').toLowerCase().trim();
    const name = (body.name || '').trim();
    const permissions = Array.isArray(body.permissions) ? body.permissions : ['view_subscriptions', 'view_live_stores'];

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'সঠিক জিমেইল ঠিকানা দিন।' }, { status: 400 });
    }

    const docRef = adminDb.collection('sub_superadmins').doc(email);
    const existing = await docRef.get();
    if (existing.exists) {
      return NextResponse.json({ error: 'এই ইমেইলটি ইতিমধ্যে সাব-সুপারএডমিন হিসেবে তালিকাভুক্ত আছে।' }, { status: 409 });
    }

    const newSubAdmin = {
      email,
      name: name || email.split('@')[0],
      permissions,
      isActive: true,
      addedBy: auth.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(newSubAdmin);

    return NextResponse.json({ 
      success: true, 
      message: 'সাব-সুপারএডমিন সফলভাবে যুক্ত হয়েছে',
      subAdmin: { ...newSubAdmin, id: email }
    });
  } catch (err) {
    console.error('[API sub-superadmins POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update sub-superadmin (permissions or isActive)
export async function PUT(request) {
  const auth = await verifySuperAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database connection unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const email = (body.email || '').toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: 'ইমেইল আবশ্যক।' }, { status: 400 });
    }

    const updates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (body.permissions && Array.isArray(body.permissions)) {
      updates.permissions = body.permissions;
    }
    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }
    if (body.name) {
      updates.name = String(body.name).trim();
    }

    await adminDb.collection('sub_superadmins').doc(email).update(updates);

    return NextResponse.json({ success: true, message: 'সফলভাবে আপডেট করা হয়েছে' });
  } catch (err) {
    console.error('[API sub-superadmins PUT] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove sub-superadmin
export async function DELETE(request) {
  const auth = await verifySuperAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database connection unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: 'ইমেইল আবশ্যক।' }, { status: 400 });
    }

    await adminDb.collection('sub_superadmins').doc(email).delete();

    return NextResponse.json({ success: true, message: 'সাব-সুপারএডমিন মুছে ফেলা হয়েছে' });
  } catch (err) {
    console.error('[API sub-superadmins DELETE] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
