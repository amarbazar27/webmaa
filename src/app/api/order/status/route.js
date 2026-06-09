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

    const { shopId, orderId, status, deliveryConfig, updaterInfo } = await req.json();

    if (!shopId || !orderId || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // ── Authorization Check ────────────────────────────
    let isAuthorized = decodedToken.uid === shopId;
    if (!isAuthorized) {
      // Check if user is superadmin
      const userSnap = await adminDb.collection('users').doc(decodedToken.uid).get();
      if (userSnap.exists && userSnap.data().role === 'superadmin') {
        isAuthorized = true;
      } else {
        // Check if user is staff of this shop
        const shopSnap = await adminDb.collection('shops').doc(shopId).get();
        if (shopSnap.exists) {
          const shopData = shopSnap.data();
          if (shopData.staffEmails && Array.isArray(shopData.staffEmails) && decodedToken.email) {
            isAuthorized = shopData.staffEmails.includes(decodedToken.email);
          }
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // ── Execute Database Transaction ────────────────────
    const orderRef = adminDb.collection('shops').doc(shopId).collection('orders').doc(orderId);

    const result = await adminDb.runTransaction(async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists) throw new Error('Order not found');

      const orderData = orderSnap.data();
      const oldStatus = orderData.status;

      if (oldStatus === status) {
        return { success: true, alreadyDone: true };
      }

      const updates = { status };

      if (status === 'confirmed' && deliveryConfig) {
        if (typeof deliveryConfig === 'string') {
          updates.deliveryTime = deliveryConfig;
        } else {
          const d = parseInt(deliveryConfig.deliveryDays) || 0;
          const h = parseInt(deliveryConfig.deliveryHours) || 0;
          const m = parseInt(deliveryConfig.deliveryMinutes) || 0;

          if (d > 0 || h > 0 || m > 0) {
            const now = Date.now();
            const etaMillis = now + (d * 86400000) + (h * 3600000) + (m * 60000);
            updates.deliveryETA = new Date(etaMillis);

            let fmt = '';
            if (d) fmt += `${d} দিন `;
            if (h) fmt += `${h} ঘণ্টা `;
            if (m) fmt += `${m} মিনিট`;
            updates.deliveryCountdownFormatted = fmt.trim();
          }
        }
        updates.confirmedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      if (updaterInfo) {
        updates.updatedBy = updaterInfo;
        if (status === 'confirmed') {
          updates.confirmedBy = updaterInfo;
        } else if (status === 'completed') {
          updates.deliveredBy = updaterInfo;
          updates.deliveredAt = admin.firestore.FieldValue.serverTimestamp();
        } else if (status === 'cancelled') {
          updates.rejectedBy = updaterInfo;
          updates.rejectedAt = admin.firestore.FieldValue.serverTimestamp();
        }
      }

      // ── Wallet Balance Settlements ──────────────────────
      const retailerAmount = parseFloat(orderData.retailerAmount ?? orderData.total ?? 0) || 0;
      const isCOD = orderData.isCOD !== false;

      if (!isCOD && retailerAmount > 0) {
        const walletRef = adminDb.collection('shops').doc(shopId).collection('wallets').doc('main');
        const walletSnap = await tx.get(walletRef);
        const currentWallet = walletSnap.exists ? walletSnap.data() : { walletBalance: 0, pendingBalance: 0, withdrawableBalance: 0, totalEarned: 0 };

        if (status === 'completed' && oldStatus !== 'completed') {
          // Transition pending funds to withdrawable available balance
          tx.set(walletRef, {
            pendingBalance: Math.max(0, (currentWallet.pendingBalance || 0) - retailerAmount),
            withdrawableBalance: (currentWallet.withdrawableBalance || 0) + retailerAmount,
            walletBalance: (currentWallet.walletBalance || 0) + retailerAmount,
            totalEarned: (currentWallet.totalEarned || 0) + retailerAmount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          // Settle the transaction log
          const txQuery = await adminDb.collection('shops')
            .doc(shopId)
            .collection('wallet_transactions')
            .where('transactionId', '==', orderId)
            .limit(1)
            .get();

          if (!txQuery.empty) {
            tx.update(txQuery.docs[0].ref, {
              status: 'completed',
              description: `Online payment settled: ${orderData.orderIdVisual || orderId}`,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        } else if (status === 'cancelled' && oldStatus === 'pending') {
          // Cancel/deduct pending funds
          tx.set(walletRef, {
            pendingBalance: Math.max(0, (currentWallet.pendingBalance || 0) - retailerAmount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          // Cancel the transaction log
          const txQuery = await adminDb.collection('shops')
            .doc(shopId)
            .collection('wallet_transactions')
            .where('transactionId', '==', orderId)
            .limit(1)
            .get();

          if (!txQuery.empty) {
            tx.update(txQuery.docs[0].ref, {
              status: 'cancelled',
              description: `Online payment cancelled: ${orderData.orderIdVisual || orderId}`,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }

      // Write status update to order doc
      tx.update(orderRef, updates);

      return { success: true, customerId: orderData.customerId, oldStatus };
    });

    // ── Loyalty Point logic (Post-transaction non-blocking) ──
    if (status === 'completed' && result.oldStatus !== 'completed' && result.customerId) {
      try {
        const userRef = adminDb.collection('users').doc(result.customerId);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          const userData = userSnap.data();
          const todayStr = new Date().toISOString().split('T')[0];

          if (userData.lastLoyaltyDate !== todayStr) {
            await userRef.update({
              loyaltyPoints: admin.firestore.FieldValue.increment(1),
              lastLoyaltyDate: todayStr
            });
          }
        }
      } catch (e) {
        console.warn('[Loyalty] Error incrementing points:', e.message);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Order status API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
