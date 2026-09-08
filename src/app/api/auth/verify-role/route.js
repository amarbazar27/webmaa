export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ role: 'user' });
    }

    // 1. Root Superadmin check
    const envAdmin = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
    if ((envAdmin && email === envAdmin) || email === 'amarbazar27@gmail.com') {
      return NextResponse.json({ role: 'superadmin' });
    }

    if (!adminDb) {
      return NextResponse.json({ role: 'user' });
    }

    // 2. Sub-Superadmin check (runs with Admin SDK — 100% bypasses client firestore rules)
    try {
      const subAdminSnap = await adminDb.collection('sub_superadmins').doc(email).get();
      if (subAdminSnap.exists) {
        const subData = subAdminSnap.data();
        if (subData.isActive !== false) {
          return NextResponse.json({
            role: 'sub_superadmin',
            permissions: Array.isArray(subData.permissions) ? subData.permissions : []
          });
        }
      }
    } catch (e) {
      console.warn('[verify-role] sub_superadmins check error:', e.message);
    }

    // 3. Retailer / Staff / Admin check
    try {
      const [inviteSnap, staffSnap, adminSnap] = await Promise.all([
        adminDb.collection('retailer_invites').where('email', '==', email).limit(1).get(),
        adminDb.collection('shops').where('staffEmails', 'array-contains', email).limit(1).get(),
        adminDb.collection('shops').where('adminEmails', 'array-contains', email).limit(1).get()
      ]);

      if (!inviteSnap.empty) return NextResponse.json({ role: 'retailer' });

      if (!adminSnap.empty) {
        const shopDoc = adminSnap.docs[0];
        return NextResponse.json({
          role: 'admin',
          accessShopId: shopDoc.id,
          shopSlug: shopDoc.data().shopSlug
        });
      }

      if (!staffSnap.empty) {
        const shopDoc = staffSnap.docs[0];
        return NextResponse.json({
          role: 'staff',
          accessShopId: shopDoc.id,
          shopSlug: shopDoc.data().shopSlug
        });
      }
    } catch (e) {
      console.warn('[verify-role] shop check error:', e.message);
    }

    return NextResponse.json({ role: 'user' });
  } catch (err) {
    console.error('[verify-role] General error:', err);
    return NextResponse.json({ role: 'user' }, { status: 200 });
  }
}
