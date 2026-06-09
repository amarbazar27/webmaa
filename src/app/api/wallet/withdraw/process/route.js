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

    // Verify user is superadmin
    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userSnap = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userSnap.exists || userSnap.data().role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { requestId, action, rejectionReason } = await req.json();

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    const withdrawalRef = adminDb.collection('withdrawal_requests').doc(requestId);

    await adminDb.runTransaction(async (tx) => {
      const withdrawalSnap = await tx.get(withdrawalRef);
      if (!withdrawalSnap.exists) {
        throw new Error('Withdrawal request not found');
      }

      const withdrawalData = withdrawalSnap.data();
      if (withdrawalData.status !== 'pending') {
        throw new Error('Withdrawal request is already processed');
      }

      const shopId = withdrawalData.shopId;
      const amount = parseFloat(withdrawalData.amount || 0);
      const walletRef = adminDb.collection('shops').doc(shopId).collection('wallets').doc('main');
      const walletSnap = await tx.get(walletRef);

      if (action === 'approve') {
        // Approve request: mark status as completed
        tx.update(withdrawalRef, {
          status: 'completed',
          resolvedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Find the pending debit transaction log and set to completed
        const txQuery = await adminDb.collection('shops')
          .doc(shopId)
          .collection('wallet_transactions')
          .where('transactionId', '==', requestId)
          .limit(1)
          .get();

        if (!txQuery.empty) {
          tx.update(txQuery.docs[0].ref, {
            status: 'completed',
            description: `উত্তোলনের আবেদন (সফল): ${withdrawalData.paymentMethod} (${withdrawalData.paymentDetails})`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } else if (action === 'reject') {
        // Reject request: mark status as rejected/cancelled and refund balance
        tx.update(withdrawalRef, {
          status: 'rejected',
          rejectionReason: rejectionReason || 'Rejected by administrator',
          resolvedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Refund balances to wallet
        if (walletSnap.exists) {
          const walletData = walletSnap.data();
          tx.set(walletRef, {
            withdrawableBalance: (walletData.withdrawableBalance || 0) + amount,
            walletBalance: (walletData.walletBalance || 0) + amount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }

        // Update transaction log to cancelled
        const txQuery = await adminDb.collection('shops')
          .doc(shopId)
          .collection('wallet_transactions')
          .where('transactionId', '==', requestId)
          .limit(1)
          .get();

        if (!txQuery.empty) {
          tx.update(txQuery.docs[0].ref, {
            status: 'cancelled',
            description: `উত্তোলনের আবেদন (প্রত্যাখ্যাত): ${rejectionReason || 'Rejected by administrator'}`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Process withdrawal request API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
