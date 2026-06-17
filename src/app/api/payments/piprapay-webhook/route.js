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

    // Fetch global configuration
    const globalSnap = await adminDb.collection('config').doc('global').get();
    if (!globalSnap.exists) {
      return NextResponse.json({ error: 'Global configuration not found' }, { status: 500 });
    }
    const globalData = globalSnap.data();
    let ppUrl = globalData.piprapayUrl?.trim() || '';
    if (ppUrl) {
      if (!ppUrl.endsWith('/')) ppUrl += '/';
      if (!ppUrl.endsWith('/api/')) {
        ppUrl = ppUrl.replace(/\/$/, '') + '/api/';
      }
    }
    const ppApiKey = globalData.piprapayApiKey?.trim();

    if (!ppUrl || !ppApiKey) {
      return NextResponse.json({ error: 'Global PipraPay configuration is missing' }, { status: 400 });
    }

    // Fetch the shop document to check if PipraPay is enabled
    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopData = shopSnap.data();
    if (!shopData.piprapayEnabled) {
      return NextResponse.json({ error: 'PipraPay is disabled for this shop' }, { status: 400 });
    }

    // Optional: Validate webhook header key if provided
    const reqApiKey = req.headers.get('mh-piprapay-api-key');
    if (reqApiKey && reqApiKey !== ppApiKey) {
      return NextResponse.json({ error: 'Unauthorized: Header key mismatch' }, { status: 401 });
    }

    // Verify payment status server-to-server with PipraPay
    const verifyRes = await fetch(`${ppUrl}verify-payments`, {
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
      const commissionPercent = Number(globalData.piprapayCommissionPercent) || 0;
      const orderTotal = Number(orderData.total) || 0;
      const commissionAmount = parseFloat((orderTotal * (commissionPercent / 100)).toFixed(2));
      const netEarning = parseFloat((orderTotal - commissionAmount).toFixed(2));

      await orderRef.update({
        paymentStatus: 'paid',
        status: 'confirmed',
        transactionId: pp_id,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentCommission: commissionAmount,
        paymentNetEarning: netEarning,
        paymentCommissionPercent: commissionPercent
      });

      // Update shop stats: increment orderCount and totalRevenue
      try {
        await adminDb.collection('shops').doc(shopId).update({
          orderCount: admin.firestore.FieldValue.increment(1),
          totalRevenue: admin.firestore.FieldValue.increment(orderTotal)
        });
      } catch (err) {
        console.error("Failed to update shop stats from webhook:", err);
      }

      // Send email alerts in the background
      const rufloPayload = { 
        shopId, 
        shopName: orderData.shopName, 
        orderId: orderData.orderIdVisual, 
        items: orderData.items, 
        total: orderData.total,
        customerAddress: orderData.customerAddress || '',
        coordinates: orderData.coordinates || null
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
          const emails = shopData.deliveryConfig.contactEmail.split(',').map(email => email.trim()).filter(email => email);
          for (const email of emails) {
            void sendRetailerNotificationEmail({
              to: email,
              customerName: orderData.customerName,
              customerPhone: orderData.customerPhone,
              ...rufloPayload
            }).catch(e => console.warn('[Webhook Ruflo] Retailer email error:', e.message));
          }
        }
      }
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    console.error('Webhook endpoint failure:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
