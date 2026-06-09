const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.log("Could not load env file manually:", e);
}

const admin = require('firebase-admin');
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}
const db = admin.firestore();

const DEV_SERVER_URL = 'http://localhost:3001';
const SHOP_ID = '3aGja677wnVJv5KRXE5HKLWOvdw2'; // Daripallah
const MOCK_COUPON_CODE = 'MOCKTEST10';
const MOCK_ORDER_ID = 'mock-integration-test-order';

async function runTests() {
  console.log('=== STARTING INTEGRATION TESTS ===');
  let testWalletSnapshotBefore = null;

  try {
    // 1. Setup Mock Coupon in Firestore
    console.log('\n[1/7] Setting up mock coupon in Firestore...');
    const couponRef = db.collection('shops').doc(SHOP_ID).collection('coupons').doc(MOCK_COUPON_CODE);
    await couponRef.set({
      type: 'percentage',
      value: 10,
      minOrderAmount: 100,
      maxDiscountAmount: 50,
      usageLimit: 5,
      usageCount: 0,
      isActive: true,
      expiryDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 86400000)), // tomorrow
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✓ Mock coupon ${MOCK_COUPON_CODE} created.`);

    // 2. Setup Mock Order in Firestore
    console.log('\n[2/7] Setting up mock order in Firestore...');
    const orderRef = db.collection('shops').doc(SHOP_ID).collection('orders').doc(MOCK_ORDER_ID);
    await orderRef.set({
      total: 200,
      subtotal: 200,
      retailerAmount: 198, // 1% commission deducted (200 - 2)
      commissionAmount: 2,
      commissionRate: 1,
      status: 'pending_payment',
      paymentStatus: 'unpaid',
      customerName: 'Test Customer',
      customerPhone: '01712345678',
      customerAddress: 'Dhaka, Bangladesh',
      shopSlug: 'webmaa-store',
      shopName: 'Daripallah',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✓ Mock order ${MOCK_ORDER_ID} created.`);

    // Read current wallet balance for comparison later
    const walletRef = db.collection('shops').doc(SHOP_ID).collection('wallets').doc('main');
    const walletSnap = await walletRef.get();
    testWalletSnapshotBefore = walletSnap.exists ? walletSnap.data() : { pendingBalance: 0, withdrawableBalance: 0, walletBalance: 0 };
    console.log(`ℹ Initial Wallet Pending Balance: ৳${testWalletSnapshotBefore.pendingBalance || 0}`);

    // 3. Test Coupon Validation Endpoint
    console.log('\n[3/7] Testing coupon validation API...');
    
    // Case A: Minimum order not met
    const valResA = await fetch(`${DEV_SERVER_URL}/api/coupon/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: MOCK_COUPON_CODE,
        shopId: SHOP_ID,
        orderSubtotal: 50
      })
    });
    const valDataA = await valResA.json();
    if (valResA.status === 400 && valDataA.error.includes('নূন্যতম')) {
      console.log('✓ Case A (Min Order restriction) PASSED.');
    } else {
      console.error('✗ Case A FAILED:', valResA.status, valDataA);
    }

    // Case B: Valid coupon use
    const valResB = await fetch(`${DEV_SERVER_URL}/api/coupon/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: MOCK_COUPON_CODE,
        shopId: SHOP_ID,
        orderSubtotal: 150
      })
    });
    const valDataB = await valResB.json();
    if (valResB.ok && valDataB.success && valDataB.discountAmount === 15) {
      console.log('✓ Case B (Valid validation) PASSED.');
    } else {
      console.error('✗ Case B FAILED:', valResB.status, valDataB);
    }

    // 4. Test Charge Creation Endpoint
    console.log('\n[4/7] Testing create-charge API...');
    const chargeRes = await fetch(`${DEV_SERVER_URL}/api/payment/create-charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: MOCK_ORDER_ID,
        shopId: SHOP_ID
      })
    });
    const chargeData = await chargeRes.json();
    if (chargeRes.ok && chargeData.success && chargeData.paymentUrl) {
      console.log(`✓ Create Charge PASSED. Redirect URL: ${chargeData.paymentUrl}`);
    } else {
      console.error('✗ Create Charge FAILED:', chargeRes.status, chargeData);
    }

    // 5. Test Sandbox Webhook Simulation
    console.log('\n[5/7] Sending simulated payment webhook request...');
    const webhookRes = await fetch(`${DEV_SERVER_URL}/api/payment/sandbox-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: MOCK_ORDER_ID,
        shopId: SHOP_ID,
        amount: 200,
        senderNumber: '01712345678',
        gateway: 'bkash'
      })
    });
    const webhookData = await webhookRes.json();
    if (webhookRes.ok && webhookData.success) {
      console.log(`✓ Webhook dispatcher returned success. TxnID: ${webhookData.txnId}`);
    } else {
      console.error('✗ Webhook simulation FAILED:', webhookRes.status, webhookData);
    }

    // 6. Verify database side effects (Wallet credits, order paid status, ledger entry)
    console.log('\n[6/7] Verifying database updates...');
    
    // Check order status
    const updatedOrderSnap = await orderRef.get();
    const orderData = updatedOrderSnap.data();
    if (orderData.status === 'pending' && orderData.paymentStatus === 'paid' && orderData.transactionId) {
      console.log(`✓ Order status updated to 'pending' and paymentStatus to 'paid'. (TxnID: ${orderData.transactionId})`);
    } else {
      console.error('✗ Database Order update verification FAILED:', orderData);
    }

    // Check wallet balances
    const updatedWalletSnap = await walletRef.get();
    const walletData = updatedWalletSnap.data();
    const diff = (walletData.pendingBalance || 0) - (testWalletSnapshotBefore.pendingBalance || 0);
    if (diff === 198) {
      console.log(`✓ Wallet pending balance successfully credited with ৳198.`);
    } else {
      console.error(`✗ Wallet pending balance verification FAILED. Difference: ৳${diff}`);
    }

    // Check transaction log
    const txLogs = await db.collection('shops').doc(SHOP_ID).collection('wallet_transactions')
      .where('orderId', '==', MOCK_ORDER_ID)
      .limit(1)
      .get();
    if (!txLogs.empty) {
      const txLogData = txLogs.docs[0].data();
      if (txLogData.type === 'credit' && txLogData.amount === 198 && txLogData.status === 'pending') {
        console.log(`✓ Ledger transaction logged correctly.`);
      } else {
        console.error('✗ Ledger transaction verification FAILED:', txLogData);
      }
      // Delete the ledger log doc
      await txLogs.docs[0].ref.delete();
    } else {
      console.error('✗ Ledger transaction not found in Firestore.');
    }

  } catch (error) {
    console.error('✗ Integration testing encountered an error:', error);
  } finally {
    // 7. Cleanup test data
    console.log('\n[7/7] Cleaning up database mock entries...');
    try {
      await db.collection('shops').doc(SHOP_ID).collection('coupons').doc(MOCK_COUPON_CODE).delete();
      await db.collection('shops').doc(SHOP_ID).collection('orders').doc(MOCK_ORDER_ID).delete();
      
      // Reset wallet balance
      if (testWalletSnapshotBefore) {
        const walletRef = db.collection('shops').doc(SHOP_ID).collection('wallets').doc('main');
        await walletRef.update({
          pendingBalance: testWalletSnapshotBefore.pendingBalance || 0
        });
      }
      console.log('✓ Cleanup completed.');
    } catch (cleanErr) {
      console.error('✗ Cleanup failed:', cleanErr);
    }
    console.log('\n=== INTEGRATION TESTS FINISHED ===');
  }
}

runTests();
