export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { sendOrderConfirmationEmail, sendRetailerNotificationEmail } from '@/lib/ruflo';

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('[UddoktaPay Webhook] Incoming payload:', body);

    let metadata = body.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error('[UddoktaPay Webhook] Failed to parse stringified metadata:', e.message);
      }
    }

    const invoiceId = body.invoice_id || metadata?.invoice_id || body.uuid;
    const shopId = metadata?.shopId;
    const dbOrderId = metadata?.dbOrderId;

    if (!invoiceId || !shopId || !dbOrderId) {
      return NextResponse.json({ error: 'Invalid payload: missing invoiceId, shopId, or dbOrderId' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // 1. Fetch Global Config
    const globalSnap = await adminDb.collection('config').doc('global').get();
    const globalData = globalSnap.exists ? globalSnap.data() : {};

    // 2. Fetch Shop Config
    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopData = shopSnap.data();

    // 3. Resolve API URL and Key
    let utUrl = shopData?.uddoktapayUrl?.trim() || globalData?.uddoktapayUrl?.trim() || globalData?.piprapayUrl?.trim() || '';
    let utApiKey = shopData?.uddoktapayApiKey?.trim() || globalData?.uddoktapayApiKey?.trim() || globalData?.piprapayApiKey?.trim() || '';

    if (utUrl) {
      utUrl = utUrl.replace(/\/$/, '');
      if (utUrl.endsWith('/api')) {
        utUrl = utUrl.substring(0, utUrl.length - 4);
      }
      if (!utUrl.startsWith('http://') && !utUrl.startsWith('https://')) {
        utUrl = 'https://' + utUrl;
      }
    }

    if (!utUrl || !utApiKey) {
      return NextResponse.json({ error: 'UddoktaPay configuration is missing' }, { status: 400 });
    }

    // 🔒 Server-to-server Verification
    console.log(`[UddoktaPay Webhook] Verifying invoice ${invoiceId} against ${utUrl}/api/verify-payment`);
    const verifyRes = await fetch(`${utUrl}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': utApiKey
      },
      body: JSON.stringify({ invoice_id: invoiceId })
    });

    if (!verifyRes.ok) {
      console.error(`[UddoktaPay Webhook] Verification endpoint returned status ${verifyRes.status}`);
      return NextResponse.json({ error: 'Verification request failed' }, { status: 400 });
    }

    const verifyData = await verifyRes.json();
    console.log('[UddoktaPay Webhook] Verification response:', verifyData);

    const isPaid = verifyData.status === 'COMPLETED' || verifyData.status === 'completed';
    if (!isPaid) {
      return NextResponse.json({ error: `Payment not completed. Status: ${verifyData.status}` }, { status: 400 });
    }

    // Update the order in Firestore
    const orderRef = adminDb.collection('shops').doc(shopId).collection('orders').doc(dbOrderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderSnap.data();
    if (orderData.paymentStatus !== 'paid') {
      // Use UddoktaPay commission or fallback to PipraPay commission field
      const commissionPercent = Number(globalData.uddoktapayCommissionPercent) || Number(globalData.piprapayCommissionPercent) || 0;
      const orderTotal = Number(orderData.total) || 0;
      const commissionAmount = parseFloat((orderTotal * (commissionPercent / 100)).toFixed(2));
      const netEarning = parseFloat((orderTotal - commissionAmount).toFixed(2));

      await orderRef.update({
        paymentStatus: 'paid',
        status: 'confirmed',
        transactionId: verifyData.transaction_id || invoiceId,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentCommission: commissionAmount,
        paymentNetEarning: netEarning,
        paymentCommissionPercent: commissionPercent,
        paymentMethodUsed: verifyData.payment_method || 'automated_uddoktapay'
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

    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    console.error('Webhook endpoint failure:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
