export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { sendOrderConfirmationEmail, sendRetailerNotificationEmail } from '@/lib/ruflo';

export async function POST(req) {
  try {
    const body = await req.json();
    const { pp_id, status, metadata } = body;

    if (!pp_id || !metadata || !metadata.shopId || !metadata.dbOrderId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { shopId, dbOrderId } = metadata;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Fetch the shop's private PipraPay configurations
    const privateSnap = await adminDb
      .collection('shops')
      .doc(shopId)
      .collection('private_configs')
      .doc('piprapay')
      .get();

    if (!privateSnap.exists) {
      return NextResponse.json({ error: 'Shop payment configuration not found' }, { status: 404 });
    }

    const privateData = privateSnap.data();
    if (!privateData.piprapayEnabled || !privateData.piprapayUrl || !privateData.piprapayApiKey) {
      return NextResponse.json({ error: 'PipraPay is disabled or misconfigured for this shop' }, { status: 400 });
    }

    const ppUrl = privateData.piprapayUrl.replace(/\/$/, '');
    const ppApiKey = privateData.piprapayApiKey;

    // Optional: Validate webhook header key if provided
    const reqApiKey = req.headers.get('mh-piprapay-api-key');
    if (reqApiKey && reqApiKey !== ppApiKey) {
      return NextResponse.json({ error: 'Unauthorized: Header key mismatch' }, { status: 401 });
    }

    // Verify payment status server-to-server with PipraPay
    const verifyRes = await fetch(`${ppUrl}/api/verify-payments`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'mh-piprapay-api-key': ppApiKey
      },
      body: JSON.stringify({ pp_id })
    });

    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Verification request failed' }, { status: 400 });
    }

    const verifyData = await verifyRes.json();
    const isPaid = verifyData.success && (
      verifyData.status === 'COMPLETED' || 
      verifyData.status === 'completed' || 
      verifyData.status === 'PAID' || 
      verifyData.status === 'paid'
    );

    if (!isPaid) {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Update the order in Firestore
    const orderRef = adminDb.collection('shops').doc(shopId).collection('orders').doc(dbOrderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderSnap.data();
    if (orderData.paymentStatus !== 'paid') {
      await orderRef.update({
        paymentStatus: 'paid',
        status: 'confirmed',
        transactionId: pp_id,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Send email alerts in the background
      const rufloPayload = { 
        shopId, 
        shopName: orderData.shopName, 
        orderId: orderData.orderIdVisual, 
        items: orderData.items, 
        total: orderData.total 
      };

      if (orderData.customerEmail) {
        void sendOrderConfirmationEmail({
          to: orderData.customerEmail,
          customerName: orderData.customerName,
          ...rufloPayload
        }).catch(e => console.warn('[Webhook Ruflo] Customer email error:', e.message));
      }

      // Fetch shop for contact email
      const shopSnap = await adminDb.collection('shops').doc(shopId).get();
      if (shopSnap.exists) {
        const shopData = shopSnap.data();
        if (shopData.deliveryConfig?.contactEmail) {
          void sendRetailerNotificationEmail({
            to: shopData.deliveryConfig.contactEmail,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            ...rufloPayload
          }).catch(e => console.warn('[Webhook Ruflo] Retailer email error:', e.message));
        }
      }
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    console.error('Webhook endpoint failure:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
