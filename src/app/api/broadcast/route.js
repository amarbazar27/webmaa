export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// POST — Send a broadcast notification
export async function POST(request) {
  try {
    const body = await request.json();
    const { message, type = 'info', target = 'all', senderRole, shopId, senderName, shopSlug } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'বার্তা লিখুন' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'সিস্টেম রিফ্রেশ করুন (Database Error)' }, { status: 500 });
    }

    // 1. Save to Firestore (for in-app banner)
    await adminDb.collection('broadcasts').add({
      message: message.trim(),
      type,
      target,
      senderRole: senderRole || 'system',
      shopId: shopId || null,
      senderName: senderName || 'System',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Send actual Push Notifications via FCM (if shopId is provided)
    if (shopId) {
      try {
        const tokensSnap = await adminDb.collection('shops').doc(shopId).collection('fcmTokens').get();
        const tokens = tokensSnap.docs.map(doc => doc.id);

        if (tokens.length > 0) {
          const payload = {
            notification: {
              title: senderName || 'Webmaa',
              body: message.trim(),
            },
            data: {
              shopId,
              shopSlug: shopSlug || '',
              url: shopSlug ? `/shop/${shopSlug}` : '/',
            },
            tokens: tokens,
          };

          // Send to all devices
          const response = await admin.messaging().sendEachForMulticast(payload);
          
          // Cleanup invalid tokens (unregistered, revoked, etc.)
          if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const errCode = resp.error?.code;
                if (errCode === 'messaging/invalid-registration-token' || 
                    errCode === 'messaging/registration-token-not-registered') {
                  failedTokens.push(tokens[idx]);
                }
              }
            });
            if (failedTokens.length > 0) {
              const batch = adminDb.batch();
              failedTokens.forEach(token => {
                batch.delete(adminDb.collection('shops').doc(shopId).collection('fcmTokens').doc(token));
              });
              await batch.commit();
              console.log(`[FCM] Cleaned up ${failedTokens.length} invalid tokens for shop ${shopId}`);
            }
          }
          console.log(`[FCM] Successfully sent push to ${response.successCount} devices for shop ${shopId}`);
        }
      } catch (fcmErr) {
        console.error('[FCM] Error sending push notifications:', fcmErr);
        // We don't throw here to ensure the in-app broadcast still saves
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Broadcast send error:', error);
    return NextResponse.json({ error: 'ব্রডকাস্ট পাঠাতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

// GET — Fetch recent broadcasts
export async function GET() {
  try {
    const snap = await adminDb
      .collection('broadcasts')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const broadcasts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ broadcasts });
  } catch (error) {
    console.error('Broadcast fetch error:', error);
    return NextResponse.json({ broadcasts: [] });
  }
}
