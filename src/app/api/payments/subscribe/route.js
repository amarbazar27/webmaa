export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { shopId, packageType, paymentMethod, senderNumber, transactionId } = body;

    if (!shopId || !packageType) {
      return NextResponse.json({ error: 'Missing shopId or packageType' }, { status: 400 });
    }

    if (!['monthly', 'quarterly', 'yearly'].includes(packageType)) {
      return NextResponse.json({ error: 'Invalid package type' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // 1. Fetch config and resolve package prices
    const globalSnap = await adminDb.collection('config').doc('global').get();
    const globalData = globalSnap.exists ? globalSnap.data() : {};

    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopData = shopSnap.data();

    // Price mappings
    const priceMap = {
      monthly: Number(globalData.subPriceMonthly) || 500,
      quarterly: Number(globalData.subPriceQuarterly) || 1350,
      yearly: Number(globalData.subPriceYearly) || 5000
    };
    const amountToCharge = priceMap[packageType];

    // Determine current domain
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const domainUrl = `${protocol}://${host}`;

    // 2. Handle manual subscription request
    if (paymentMethod === 'manual') {
      if (!senderNumber || !transactionId) {
        return NextResponse.json({ error: 'Sender number and Transaction ID are required for manual payment' }, { status: 400 });
      }

      await adminDb.collection('shops').doc(shopId).update({
        subscriptionStatus: 'pending',
        subscriptionPendingPackage: packageType,
        subscriptionPendingTxn: `Method: manual, Sender: ${senderNumber}, Txn: ${transactionId}`
      });

      return NextResponse.json({ success: true, message: 'Subscription request submitted for approval!' });
    }

    // 3. Handle automated payment via UddoktaPay
    let utUrl = globalData?.uddoktapayUrl?.trim() || globalData?.piprapayUrl?.trim() || '';
    let utApiKey = globalData?.uddoktapayApiKey?.trim() || globalData?.piprapayApiKey?.trim() || '';

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
      return NextResponse.json({ error: 'Superadmin has not configured automated subscription payment keys yet. Please contact support or use Manual Payment.' }, { status: 400 });
    }

    // Call checkout-v2 of UddoktaPay
    console.log(`[Subscription API] Initiating checkout-v2 at ${utUrl}/api/checkout-v2 for amount ${amountToCharge}`);
    const res = await fetch(`${utUrl}/api/checkout-v2`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': utApiKey
      },
      body: JSON.stringify({
        full_name: shopData.shopName || 'Retailer',
        email: shopData.deliveryConfig?.contactEmail?.split(',')[0] || 'retailer@webmaa.com',
        amount: amountToCharge.toString(),
        metadata: {
          type: 'subscription',
          shopId: shopId,
          packageType: packageType
        },
        redirect_url: `${domainUrl}/dashboard/billing?status=success`,
        webhook_url: `${domainUrl}/api/payments/uddoktapay-webhook`
      })
    });

    if (res.ok) {
      const utData = await res.json();
      const isSuccess = utData.status === true || utData.status === 'true';
      const payUrl = utData.payment_url;
      if (isSuccess && payUrl) {
        return NextResponse.json({ success: true, payment_url: payUrl });
      } else {
        console.error("Subscription payment initiation failed:", utData);
        return NextResponse.json({ error: `Gateway failed to initialize: ${utData.message || 'Unknown'}` }, { status: 400 });
      }
    } else {
      const errText = await res.text();
      console.error("Subscription payment status error:", res.status, errText);
      return NextResponse.json({ error: `Gateway returned status error: ${res.status}` }, { status: 400 });
    }

  } catch (err) {
    console.error('Subscription API failure:', err);
    return NextResponse.json({ error: 'Internal server error during subscription' }, { status: 500 });
  }
}
