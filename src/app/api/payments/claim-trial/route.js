export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/verifyAuth';


export async function POST(req) {
  try {
    // 🔒 Auth: Must be a logged-in retailer who owns this shop
    let authUser;
    try {
      authUser = await verifyAuth(req);
    } catch {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { shopId, packageType } = await req.json();

    if (!shopId || !packageType) {
      return NextResponse.json({ error: 'Missing shopId or packageType' }, { status: 400 });
    }

    // Verify caller owns this shop (unless superadmin)
    if (authUser.uid !== shopId) {
      const userDoc = await adminDb.collection('users').doc(authUser.uid).get();
      const isSuperAdmin = userDoc.exists && userDoc.data()?.role === 'superadmin';
      if (!isSuperAdmin) {
        return NextResponse.json({ error: 'Not authorized for this shop.' }, { status: 403 });
      }
    }

    if (!['monthly', 'quarterly', 'yearly'].includes(packageType)) {
      return NextResponse.json({ error: 'Invalid package type' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // 1. Fetch global config
    const globalSnap = await adminDb.collection('config').doc('global').get();
    const globalData = globalSnap.exists ? globalSnap.data() : {};

    const trialsEnabled = globalData.trialsEnabled ?? true;
    if (!trialsEnabled) {
      return NextResponse.json({ error: 'Free trials are currently disabled by the platform administrator.' }, { status: 400 });
    }

    // Determine trial days based on package type (1 month = 30 days)
    const trialDaysMap = {
      monthly: Number(globalData.subTrialMonthly) || 30,
      quarterly: Number(globalData.subTrialQuarterly) || 30,
      yearly: Number(globalData.subTrialYearly) || 30
    };
    const trialDays = trialDaysMap[packageType];

    // 2. Fetch Shop Details
    const shopRef = adminDb.collection('shops').doc(shopId);
    const shopSnap = await shopRef.get();
    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopData = shopSnap.data();

    if (shopData.trialClaimed === true) {
      return NextResponse.json({ error: 'Your store has already claimed a free trial. Please purchase a package to continue.' }, { status: 400 });
    }

    // 3. Activate subscription with trial days
    const durationMs = trialDays * 24 * 60 * 60 * 1000;
    const newExpiry = Date.now() + durationMs;

    await shopRef.update({
      subscriptionStatus: 'active',
      subscriptionPackage: packageType,
      subscriptionExpiresAt: new Date(newExpiry),
      trialClaimed: true,
      subscriptionPendingTxn: admin.firestore.FieldValue.delete(),
      subscriptionPendingPackage: admin.firestore.FieldValue.delete()
    });

    console.log(`[Trial API] Shop ${shopId} claimed free trial for ${packageType} (${trialDays} days)`);

    return NextResponse.json({ 
      success: true, 
      message: `Your ${trialDays}-day free trial has been successfully activated!` 
    });

  } catch (err) {
    console.error('Claim Trial API failure:', err);
    return NextResponse.json({ error: 'Internal server error during trial activation' }, { status: 500 });
  }
}
