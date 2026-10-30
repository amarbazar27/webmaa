import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';
import { revalidatePath } from 'next/cache';
import { invalidateShopCache } from '@/lib/server-fetch';

// Recursively sanitize payload to strip out undefined values so Firestore never throws
function sanitizePayload(obj) {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizePayload(item)).filter(item => item !== undefined);
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = sanitizePayload(value);
      }
    }
    return clean;
  }
  return obj;
}

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    const body = await request.json();
    const { shopId, settings } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings payload is required' }, { status: 400 });
    }

    // Permission Verification
    const isSuper = authResult.role === 'superadmin' || authResult.role === 'sub_superadmin';
    let isAuthorized = isSuper;

    if (!isAuthorized) {
      if (authResult.uid === shopId) {
        isAuthorized = true;
      } else {
        // Check shop document owner or staff
        const shopSnap = await adminDb.collection('shops').doc(shopId).get();
        if (shopSnap.exists) {
          const sData = shopSnap.data();
          if (sData.ownerId === authResult.uid || sData.userId === authResult.uid) {
            isAuthorized = true;
          } else {
            // Check user record
            const userSnap = await adminDb.collection('users').doc(authResult.uid).get();
            const uData = userSnap.data();
            if (uData?.shopId === shopId || uData?.accessShopId === shopId) {
              isAuthorized = true;
            }
          }
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to update this store' }, { status: 403 });
    }

    const cleanSettings = sanitizePayload(settings);
    cleanSettings.updatedAt = FieldValue.serverTimestamp();

    // Safe merge into Firestore
    await adminDb.collection('shops').doc(shopId).set(cleanSettings, { merge: true });

    // Invalidate server cache & Next.js ISR
    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    const shopData = shopSnap.data() || {};
    const slug = shopData.subdomainSlug || shopData.shopSlug || shopId;
    const domain = shopData.customDomain || '';

    try {
      await invalidateShopCache(shopId, slug);
    } catch (_) {}

    if (slug) {
      revalidatePath(`/shop/${slug}`);
      revalidatePath(`/shop/${slug}/order/[orderId]`, 'layout');
    }
    if (domain) {
      revalidatePath(`/domain/${domain}`);
      revalidatePath(`/domain/${domain}/order/[orderId]`, 'layout');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে! ✨' 
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[API Shop Settings Update Error]:', error);
    return NextResponse.json({ error: error.message || 'Settings update failed' }, { status: 500 });
  }
}
