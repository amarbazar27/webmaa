import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { createSteadfastParcel } from '@/lib/steadfast';
import admin from 'firebase-admin';

/**
 * 🔐 Robust auth check using Firebase Admin SDK directly.
 * Supports: direct retailer, superadmin (by role or email), staff, admin.
 * Works correctly in impersonation mode.
 */
async function isAuthorizedShopAdmin(req, shopId) {
  try {
    // Step 1: Extract Bearer token from Authorization header
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      console.warn('[STEADFAST AUTH] No Bearer token in request');
      return false;
    }

    // Step 2: Verify token using Firebase Admin SDK (more reliable than REST)
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (tokenErr) {
      console.error('[STEADFAST AUTH] Admin SDK token verification failed:', tokenErr.message);
      // If token is expired or malformed, deny
      return false;
    }

    const uid = decodedToken.uid;
    const email = (decodedToken.email || '').toLowerCase().trim();

    console.log('[STEADFAST AUTH] Decoded token → uid:', uid, 'email:', email, 'shopId:', shopId);

    // Check 1: uid directly matches shopId (retailer is the shop owner)
    if (uid === shopId) {
      console.log('[STEADFAST AUTH] ✅ Authorized: uid === shopId');
      return true;
    }

    // Check 2: Look up user in Firestore by uid
    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (userSnap.exists) {
      const userData = userSnap.data();
      console.log('[STEADFAST AUTH] User doc found → role:', userData.role);

      // Superadmin role in Firestore
      if (userData.role === 'superadmin') {
        console.log('[STEADFAST AUTH] ✅ Authorized: Firestore role = superadmin');
        return true;
      }

      // Staff/Admin with matching shopId
      if (
        (userData.role === 'staff' || userData.role === 'admin') &&
        userData.accessShopId === shopId
      ) {
        // RED-10: Removed debug log leaking auth flow
        return true;
      }
    }

    // RED-10: Removed NEXT_PUBLIC_SUPER_ADMIN_EMAIL check
    // NEXT_PUBLIC_ vars are client-exposed — using them as auth is insecure
    // Superadmin is already validated via Firestore role check above

    // Check 4: Firestore globalConfig superadmin email
    try {
      const globalSnap = await adminDb.collection('globalConfig').doc('main').get();
      if (globalSnap.exists) {
        const globalData = globalSnap.data();
        const configAdminEmail = (globalData.adminEmail || '').toLowerCase().trim();
        if (configAdminEmail && email === configAdminEmail) {
          return true;
        }
      }
    } catch (gcErr) {
      console.warn('[STEADFAST AUTH] globalConfig check failed (non-fatal):', gcErr.message);
    }

    // Check 5: Shop adminEmails / staffEmails
    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (shopSnap.exists) {
      const shopData = shopSnap.data();
      if (email && (shopData.adminEmails?.includes(email) || shopData.staffEmails?.includes(email))) {
        console.log('[STEADFAST AUTH] ✅ Authorized: email found in shop adminEmails/staffEmails');
        return true;
      }

      // Check 6: shop ownerId matches uid (alt check)
      if (shopData.ownerId && shopData.ownerId === uid) {
        console.log('[STEADFAST AUTH] ✅ Authorized: shop.ownerId matches uid');
        return true;
      }
    }

    console.warn('[STEADFAST AUTH] ❌ All checks failed for uid:', uid, 'email:', email);
    return false;
  } catch (err) {
    console.error('[STEADFAST AUTH ERROR] Unexpected error:', err.message);
    return false;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      shopId,
      orderId,
      recipientName,
      recipientPhone,
      recipientAddress,
      codAmount,
      note
    } = body;

    if (!shopId || !orderId || !recipientName || !recipientPhone || !recipientAddress) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Sanitize recipientPhone (Steadfast requires exactly 11 digits starting with 01)
    let cleanPhone = recipientPhone.trim().replace(/\D/g, '');
    if (cleanPhone.startsWith('880')) {
      cleanPhone = cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('88')) {
      cleanPhone = cleanPhone.substring(2);
    }
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('0')) {
      cleanPhone = '0' + cleanPhone;
    }
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      return NextResponse.json({
        error: 'Recipient phone number must be exactly 11 digits starting with 01.'
      }, { status: 400 });
    }

    // 🔐 Authorization Check
    const authorized = await isAuthorizedShopAdmin(req, shopId);
    if (!authorized) {
      console.error('[Steadfast] Authorization failed for shopId:', shopId);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch shop courier details
    const shopRef = adminDb.collection('shops').doc(shopId);
    const shopSnap = await shopRef.get();
    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shopData = shopSnap.data();
    const steadfastApiKey = shopData.courierConfig?.steadfastApiKey;
    const steadfastSecretKey = shopData.courierConfig?.steadfastSecretKey;
    const steadfastEnabled = shopData.courierConfig?.steadfastEnabled;

    if (!steadfastEnabled) {
      return NextResponse.json({ error: 'Steadfast Courier is not enabled for this shop. Please enable it in Settings → Courier & Map.' }, { status: 400 });
    }
    if (!steadfastApiKey || !steadfastSecretKey) {
      return NextResponse.json({ error: 'Steadfast API Key or Secret Key is not configured for this shop.' }, { status: 400 });
    }

    // Fetch order details
    const orderRef = shopRef.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderSnap.data();

    // Sanitize invoice: Steadfast only allows letters, numbers, dashes, and underscores
    const rawInvoice = orderData.orderIdVisual || orderId;
    const cleanInvoice = String(rawInvoice).trim().replace(/[^a-zA-Z0-9_-]/g, '-');

    // Call Steadfast Courier API (throws on any error)
    let sfResponse;
    try {
      sfResponse = await createSteadfastParcel(
        { apiKey: steadfastApiKey, secretKey: steadfastSecretKey },
        {
          invoice: cleanInvoice,
          recipientName,
          recipientPhone: cleanPhone,
          recipientAddress,
          codAmount: Number(codAmount) || 0,
          note
        }
      );
    } catch (sfErr) {
      console.error('[Steadfast API Error]', sfErr.message);
      return NextResponse.json({ error: sfErr.message }, { status: 400 });
    }

    // Steadfast returns { status: 200, consignment: {...} } on success
    const consignment = sfResponse.consignment || {};

    const updateData = {
      courierName: 'steadfast',
      consignmentId: String(consignment.consignment_id || ''),
      trackingCode: consignment.tracking_code || '',
      courierStatus: consignment.status || 'pending',
      courierCharge: consignment.delivery_charge || 0,
      courierCOD: consignment.cod_amount || 0,
      courierUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await orderRef.update(updateData);

    // Log courier action
    await orderRef.collection('courier_logs').doc().set({
      action: 'parcel_created',
      consignmentId: String(consignment.consignment_id || ''),
      trackingCode: consignment.tracking_code || '',
      status: consignment.status || 'pending',
      rawResponse: sfResponse,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      consignmentId: consignment.consignment_id,
      trackingCode: consignment.tracking_code,
      status: consignment.status
    });

  } catch (error) {
    console.error('[Steadfast Booking Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
