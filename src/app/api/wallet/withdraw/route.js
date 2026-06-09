export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { shopId, shopName, amount, paymentMethod, paymentDetails } = await req.json();
    const withdrawAmount = parseFloat(amount);

    if (!shopId || !shopName || isNaN(withdrawAmount) || withdrawAmount <= 0 || !paymentMethod || !paymentDetails) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    if (withdrawAmount < 50) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is ৳50' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Verify authorized user
    let isAuthorized = decodedToken.uid === shopId;
    if (!isAuthorized) {
      const userSnap = await adminDb.collection('users').doc(decodedToken.uid).get();
      if (userSnap.exists && userSnap.data().role === 'superadmin') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Run transaction
    const walletRef = adminDb.collection('shops').doc(shopId).collection('wallets').doc('main');
    const withdrawalRef = adminDb.collection('withdrawal_requests').doc();
    const txRef = adminDb.collection('shops').doc(shopId).collection('wallet_transactions').doc();

    await adminDb.runTransaction(async (tx) => {
      const walletSnap = await tx.get(walletRef);
      if (!walletSnap.exists) {
        throw new Error('Wallet not initialized');
      }

      const walletData = walletSnap.data();
      const withdrawable = parseFloat(walletData.withdrawableBalance || 0);

      if (withdrawable < withdrawAmount) {
        throw new Error('Insufficient withdrawable balance');
      }

      // Deduct immediately to prevent double spending
      tx.set(walletRef, {
        withdrawableBalance: Math.max(0, withdrawable - withdrawAmount),
        walletBalance: Math.max(0, parseFloat(walletData.walletBalance || 0) - withdrawAmount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Create withdrawal request
      tx.set(withdrawalRef, {
        requestId: withdrawalRef.id,
        shopId,
        shopName,
        amount: withdrawAmount,
        paymentMethod,
        paymentDetails,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Log transaction ledger hold
      tx.set(txRef, {
        transactionId: withdrawalRef.id,
        type: 'debit',
        amount: withdrawAmount,
        orderId: 'WITHDRAW',
        status: 'pending',
        description: `উত্তোলনের আবেদন (পেন্ডিং): ${paymentMethod} (${paymentDetails})`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ success: true, requestId: withdrawalRef.id });

  } catch (error) {
    console.error('Withdraw request API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
