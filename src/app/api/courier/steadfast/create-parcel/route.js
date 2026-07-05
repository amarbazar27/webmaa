import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/verifyAuth';
import { createSteadfastParcel } from '@/lib/steadfast';
import admin from 'firebase-admin';

async function isAuthorizedShopAdmin(req, shopId) {
  try {
    const { uid, email } = await verifyAuth(req);
    if (uid === shopId) return true;

    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (userSnap.exists) {
      const userData = userSnap.data();
      if (userData.role === 'superadmin') return true;
      if (userData.role === 'staff' && userData.accessShopId === shopId) return true;
    }

    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (shopSnap.exists) {
      const shopData = shopSnap.data();
      if (shopData.staffEmails?.includes(email)) return true;
    }

    return false;
  } catch (err) {
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

    // 🔐 Auth Check
    const authorized = await isAuthorizedShopAdmin(req, shopId);
    if (!authorized) {
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

    if (!steadfastEnabled || !steadfastApiKey || !steadfastSecretKey) {
      return NextResponse.json({ error: 'Steadfast Courier API is not configured or enabled for this shop.' }, { status: 400 });
    }

    // Fetch order to get visual orderId
    const orderRef = shopRef.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderSnap.data();

    // Call Steadfast API
    const response = await createSteadfastParcel(
      { apiKey: steadfastApiKey, secretKey: steadfastSecretKey },
      {
        invoice: orderData.orderIdVisual || orderId,
        recipientName,
        recipientPhone,
        recipientAddress,
        codAmount: Number(codAmount) || 0,
        note
      }
    );

    if (response.status === 200) {
      const consignment = response.consignment || {};
      
      const updateData = {
        courierName: 'steadfast',
        consignmentId: consignment.consignment_id || '',
        trackingCode: consignment.tracking_code || '',
        courierStatus: consignment.status || 'pending',
        courierCharge: consignment.delivery_charge || 0,
        courierCOD: consignment.cod_amount || 0,
        courierUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await orderRef.update(updateData);

      // Log courier action
      const logRef = orderRef.collection('courier_logs').doc();
      await logRef.set({
        action: 'parcel_created',
        consignmentId: consignment.consignment_id || '',
        trackingCode: consignment.tracking_code || '',
        status: consignment.status || 'pending',
        rawResponse: response,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return NextResponse.json({
        success: true,
        consignmentId: consignment.consignment_id,
        trackingCode: consignment.tracking_code,
        status: consignment.status
      });
    } else {
      console.error('[Steadfast API Error]', response);
      return NextResponse.json({
        error: response.message || response.errors || 'Failed to create parcel on Steadfast Courier.'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[Steadfast Booking Error]', error);
    return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}
