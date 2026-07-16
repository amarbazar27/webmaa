export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const { orderId, shopId } = await req.json();

    if (!orderId || !shopId) {
      return NextResponse.json({ error: 'Missing orderId or shopId' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // 1. Fetch the Order
    const orderRef = adminDb.collection('shops').doc(shopId).collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const orderData = orderSnap.data();

    // If order is already paid, return success
    if (orderData.paymentStatus === 'paid') {
      return NextResponse.json({ success: true, message: 'Order is already marked as paid' });
    }

    const invoiceId = orderData.piprapayPpId; // This is where we stored UddoktaPay's invoice_id
    if (!invoiceId) {
      return NextResponse.json({ error: 'No automated payment session found for this order' }, { status: 400 });
    }

    // 2. Fetch Configs
    const globalSnap = await adminDb.collection('config').doc('global').get();
    const globalData = globalSnap.exists ? globalSnap.data() : {};

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

    // 4. Verify payment with UddoktaPay API
    console.log(`[Verify Order API] Verifying invoice ${invoiceId} against ${utUrl}/api/verify-payment`);
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
      return NextResponse.json({ error: `Verification request failed with status ${verifyRes.status}` }, { status: 400 });
    }

    const verifyData = await verifyRes.json();
    console.log('[Verify Order API] Response:', verifyData);
    const isPaid = verifyData.status === 'COMPLETED' || verifyData.status === 'completed';

    if (!isPaid) {
      return NextResponse.json({ success: false, status: verifyData.status, message: 'Payment is not completed yet.' });
    }

    // 5. Update Order status to paid
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
      console.error("Failed to update shop stats from verify-order api:", err);
    }

    return NextResponse.json({ success: true, message: 'Payment verified and order confirmed successfully!' });
  } catch (err) {
    console.error('Verify Order failure:', err);
    return NextResponse.json({ error: 'Internal server error during verification' }, { status: 500 });
  }
}
