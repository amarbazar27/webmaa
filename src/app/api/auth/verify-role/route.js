export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').toLowerCase().trim();
    const uid = searchParams.get('uid') || null;

    if (!email) {
      return NextResponse.json({ role: 'user' });
    }

    const setClaims = async (targetUid, claims) => {
      if (adminAuth && targetUid) {
        try {
          await adminAuth.setCustomUserClaims(targetUid, claims);
        } catch (e) {
          console.warn('[verify-role] setCustomUserClaims failed:', e.message);
        }
      }
    };

    // 1. Root Superadmin check
    const envAdmin = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
    const isRoot = 
      (envAdmin && email === envAdmin) ||
      email === 'amarbazar27@gmail.com' ||
      email === 'rafiqunnabi07@gmail.com' ||
      email === 'rafiqunnabi29@gmail.com' ||
      email === 'bdretailers26@gmail.com' ||
      email === 'missionedu306@gmail.com' ||
      email === 'contact@bdretailers.com';

    if (isRoot) {
      if (uid) await setClaims(uid, { role: 'superadmin' });
      return NextResponse.json({ role: 'superadmin', claimsSet: true });
    }

    if (!adminDb) {
      return NextResponse.json({ role: 'user' });
    }

    // 1.5 Database Superadmin check (preserve superadmin assigned in users collection)
    if (uid) {
      try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (userDoc.exists && userDoc.data()?.role === 'superadmin') {
          await setClaims(uid, { role: 'superadmin' });
          return NextResponse.json({ role: 'superadmin', claimsSet: true });
        }
      } catch (_) {}
    }

    // 2. Sub-Superadmin check (runs with Admin SDK — 100% bypasses client firestore rules)
    try {
      const subAdminSnap = await adminDb.collection('sub_superadmins').doc(email).get();
      if (subAdminSnap.exists) {
        const subData = subAdminSnap.data();
        if (subData.isActive !== false) {
          const perms = Array.isArray(subData.permissions) ? subData.permissions : [];
          if (uid) await setClaims(uid, { role: 'sub_superadmin', permissions: perms });
          return NextResponse.json({
            role: 'sub_superadmin',
            permissions: perms,
            claimsSet: true
          });
        }
      }
    } catch (e) {
      console.warn('[verify-role] sub_superadmins check error:', e.message);
    }

    // 3. Retailer / Shop Owner check (if user owns a shop directly)
    if (uid) {
      try {
        const shopSnap = await adminDb.collection('shops').doc(uid).get();
        if (shopSnap.exists) {
          await setClaims(uid, { role: 'retailer', shopId: uid });
          return NextResponse.json({ role: 'retailer', shopId: uid, claimsSet: true });
        }
      } catch (_) {}
    }

    // 4. Retailer Invites / Staff / Admin check
    try {
      const [inviteSnap, staffSnap, adminSnap] = await Promise.all([
        adminDb.collection('retailer_invites').where('email', '==', email).limit(1).get(),
        adminDb.collection('shops').where('staffEmails', 'array-contains', email).limit(1).get(),
        adminDb.collection('shops').where('adminEmails', 'array-contains', email).limit(1).get()
      ]);

      if (!inviteSnap.empty) {
        if (uid) await setClaims(uid, { role: 'retailer', shopId: uid });
        return NextResponse.json({ role: 'retailer', shopId: uid, claimsSet: true });
      }

      if (!adminSnap.empty) {
        const shopDoc = adminSnap.docs[0];
        if (uid) await setClaims(uid, { role: 'admin', accessShopId: shopDoc.id, shopId: shopDoc.id });
        return NextResponse.json({
          role: 'admin',
          accessShopId: shopDoc.id,
          shopSlug: shopDoc.data().shopSlug,
          claimsSet: true
        });
      }

      if (!staffSnap.empty) {
        const shopDoc = staffSnap.docs[0];
        if (uid) await setClaims(uid, { role: 'staff', accessShopId: shopDoc.id, shopId: shopDoc.id });
        return NextResponse.json({
          role: 'staff',
          accessShopId: shopDoc.id,
          shopSlug: shopDoc.data().shopSlug,
          claimsSet: true
        });
      }
    } catch (e) {
      console.warn('[verify-role] shop check error:', e.message);
    }

    if (uid) await setClaims(uid, { role: 'user' });
    return NextResponse.json({ role: 'user', claimsSet: true });
  } catch (err) {
    console.error('[verify-role] General error:', err);
    return NextResponse.json({ role: 'user' }, { status: 200 });
  }
}
