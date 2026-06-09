export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  let shopId = 'unknown';
  let orderId = 'unknown';
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-piprapay-signature') || req.headers.get('x-signature');
    const secret = process.env.PIPRAPAY_WEBHOOK_SECRET;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // ── Signature Verification ──────────────────────────
    if (secret) {
      if (!signature) {
        return NextResponse.json({ error: 'Unauthorized: Missing signature header' }, { status: 401 });
      }
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (computedSignature !== signature) {
        // Log security warning
        await adminDb.collection('system_logs').add({
          type: 'webhook_security_failure',
          description: 'Invalid signature received on PipraPay webhook',
          signature: signature,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return NextResponse.json({ error: 'Unauthorized: Invalid signature' }, { status: 401 });
      }
    }

    // ── Parse Payload ──────────────────────────────────
    const payload = JSON.parse(rawBody);
    const rawOrderId = payload.order_id; // Format: `${shopId}_${orderId}`

    if (!rawOrderId || !rawOrderId.includes('_')) {
      return NextResponse.json({ error: 'Invalid order_id format in payload' }, { status: 400 });
    }

    const parts = rawOrderId.split('_');
    shopId = parts[0];
    orderId = parts[1];

    const txnId = payload.transaction_id || '';
    const paymentNumber = payload.sender_number || '';
    const amountPaid = parseFloat(payload.amount) || 0;
    const status = payload.status; // 'success' or 'completed'

    if (status !== 'success' && status !== 'completed') {
      return NextResponse.json({ message: 'Ignored: Payment status is not success' }, { status: 200 });
    }

    // ── Execute Wallet & Order updates atomically ──────
    const orderRef = adminDb.collection('shops').doc(shopId).collection('orders').doc(orderId);
    const walletRef = adminDb.collection('shops').doc(shopId).collection('wallets').doc('main');

    const result = await adminDb.runTransaction(async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists) {
        throw new Error('Order not found');
      }

      const orderData = orderSnap.data();

      // Idempotency: if order already paid, ignore
      if (orderData.paymentStatus === 'paid' || orderData.status !== 'pending_payment') {
        return { alreadyProcessed: true };
      }

      const walletSnap = await tx.get(walletRef);
      const currentWallet = walletSnap.exists ? walletSnap.data() : { walletBalance: 0, pendingBalance: 0, withdrawableBalance: 0, totalEarned: 0 };

      const retailerAmount = parseFloat(orderData.retailerAmount ?? orderData.total ?? 0) || 0;
      const commissionAmount = parseFloat(orderData.commissionAmount ?? 0) || 0;
      const commissionRate = parseFloat(orderData.commissionRate ?? 1) || 0;

      // 1. Update Order Document
      tx.update(orderRef, {
        status: 'pending', // Set to pending for retailer confirmation/delivery
        paymentStatus: 'paid',
        paymentMethod: 'PipraPay',
        transactionId: txnId,
        paymentNumber: paymentNumber,
        paidAmount: amountPaid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Credit Retailer Wallet Pending Balance
      tx.set(walletRef, {
        pendingBalance: (currentWallet.pendingBalance || 0) + retailerAmount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 3. Log transaction ledger entry
      const txRef = adminDb.collection('shops').doc(shopId).collection('wallet_transactions').doc();
      tx.set(txRef, {
        transactionId: orderId,
        type: 'credit',
        amount: retailerAmount,
        orderId: orderData.orderIdVisual || orderId,
        status: 'pending',
        description: `PipraPay Online payment received: ${orderData.orderIdVisual || orderId}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. Log Daripallah global commission earnings (if not written during checkout)
      if (commissionAmount > 0) {
        const systemEarningRef = adminDb.collection('system_earnings').doc();
        tx.set(systemEarningRef, {
          orderId: orderData.orderIdVisual || orderId,
          shopId,
          shopName: orderData.shopName || '',
          orderTotal: orderData.total,
          commissionRate,
          commissionAmount,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return { success: true };
    });

    // Write success audit logs
    await adminDb.collection('system_logs').add({
      type: 'webhook_success',
      shopId,
      orderId,
      transactionId: txnId,
      amount: amountPaid,
      description: `Payment confirmed successfully via PipraPay Webhook`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, message: result.alreadyProcessed ? 'Already processed' : 'Processed' });

  } catch (error) {
    console.error('PipraPay webhook error:', error);

    // Write error audit logs
    try {
      if (adminDb) {
        await adminDb.collection('system_logs').add({
          type: 'webhook_error',
          shopId,
          orderId,
          error: error.message,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (e) {
      console.error('Failed to log webhook error in Firestore:', e);
    }

    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
