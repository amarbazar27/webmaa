export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

// ── Email Transporter ────────────────────────────────────────────────────
function createTransporter() {
  // Support multiple SMTP env var names
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS;

  if (!user || !pass) return null;

  // Use Gmail service helper if host is Gmail
  if (host === 'smtp.gmail.com' || host.includes('gmail')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// POST — Send a broadcast
export async function POST(request) {
  try {
    // 🔒 Verify Firebase ID token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    let decoded;
    try {
      const idToken = authHeader.split('Bearer ')[1];
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (authErr) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      message, subject, type = 'info', target = 'all', senderRole, shopId, 
      senderName, shopSlug, segment, emails, broadcastId 
    } = body;

    // 🛡️ Verify retailer actually owns the shop they claim to broadcast for
    if (senderRole === 'retailer' && shopId) {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists || shopDoc.data().ownerId !== decoded.uid) {
        const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
        const isStaff = (shopDoc.exists && (shopDoc.data().staffEmails || []).includes(decoded.email?.toLowerCase()));
        const isSuperAdmin = userDoc.exists && userDoc.data()?.role === 'superadmin';
        if (!isStaff && !isSuperAdmin) {
          return NextResponse.json({ error: 'Forbidden: You do not own this shop' }, { status: 403 });
        }
      }
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'সিস্টেম রিফ্রেশ করুন (Database Error)' }, { status: 500 });
    }

    // ── Case 1: Retailer email broadcast ─────────────────────────────────
    // Retailer sends email to specific customer emails
    if (senderRole === 'retailer' && emails && Array.isArray(emails) && emails.length > 0 && subject) {
      if (!message?.trim()) {
        return NextResponse.json({ error: 'মেসেজ লিখুন' }, { status: 400 });
      }

      let activeSenderName = senderName || 'Shop';
      if (shopId && adminDb) {
        try {
          const shopDoc = await adminDb.collection('shops').doc(shopId).get();
          if (shopDoc.exists) {
            activeSenderName = shopDoc.data().shopName || activeSenderName;
          }
        } catch (err) {
          console.warn(`[Broadcast] Failed to fetch shopName for ${shopId}:`, err.message);
        }
      }

      let sent = 0;
      let failed = 0;

      const transporter = createTransporter();
      if (transporter) {
        // Send emails in batches
        const emailPromises = emails.map(async (email) => {
          try {
            await transporter.sendMail({
              from: `"${activeSenderName}" <${process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER}>`,
              to: email,
              subject: subject,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                  <div style="background:linear-gradient(135deg,#1e40af,#0891b2);padding:30px;border-radius:12px 12px 0 0;text-align:center">
                    <h1 style="color:white;margin:0;font-size:24px">${activeSenderName}</h1>
                  </div>
                  <div style="background:#fff;padding:30px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
                    <h2 style="color:#1e293b;font-size:18px;margin-bottom:16px">${subject}</h2>
                    <div style="color:#475569;font-size:15px;line-height:1.7;white-space:pre-wrap">${message}</div>
                    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0" />
                    <p style="color:#94a3b8;font-size:12px;text-align:center">Powered by Daripallah</p>
                  </div>
                </div>
              `,
            });
            sent++;
          } catch (err) {
            console.error(`[Email] Failed to send to ${email}:`, err.message);
            failed++;
          }
        });
        await Promise.all(emailPromises);
      } else {
        // No SMTP — log warning but don't fail, just record
        console.warn('[Broadcast] No SMTP configured. Email not sent.');
        failed = emails.length;
      }

      // Save to history
      await adminDb.collection('broadcast_history').add({
        shopId: shopId || null,
        subject,
        message: message.trim(),
        segment: segment || 'all',
        total: emails.length,
        sent,
        failed,
        sentByName: activeSenderName,
        senderRole: 'retailer',
        broadcastId: broadcastId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, sent, failed, total: emails.length });
    }

    // ── Case 2: Notification broadcast (superadmin or retailer push notification) ──
    const notifMessage = message || subject;
    if (!notifMessage?.trim()) {
      return NextResponse.json({ error: 'বার্তা লিখুন' }, { status: 400 });
    }

    // Save notification to Firestore (for in-app banner)
    // For retailer notifications: always scope to shopId so only that shop's users see it
    // For superadmin: can target all, retailers only, or customers only
    const broadcastDoc = {
      message: notifMessage.trim(),
      type,
      target: senderRole === 'retailer' ? 'specific_shop' : (target || 'all'),
      senderRole: senderRole || 'system',
      shopId: shopId || null,
      senderName: senderName || 'System',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await adminDb.collection('broadcasts').add(broadcastDoc);

    // Send FCM push notifications
    if (shopId) {
      // Scoped to a specific shop
      try {
        const shopDoc = await adminDb.collection('shops').doc(shopId).get();
        const actualShopSlug = shopDoc.exists ? (shopDoc.data().subdomainSlug || shopDoc.data().shopSlug || shopSlug || '') : (shopSlug || '');
        
        const tokensSnap = await adminDb.collection('shops').doc(shopId).collection('fcmTokens').get();
        const tokens = tokensSnap.docs.map(d => d.id);

        if (tokens.length > 0) {
          const payload = {
            notification: {
              title: senderName || 'Daripallah',
              body: notifMessage.trim(),
              icon: '/logo.png',
            },
            data: {
              shopId,
              shopSlug: actualShopSlug,
              url: actualShopSlug ? `/shop/${actualShopSlug}` : '/',
            },
            webpush: {
              notification: {
                title: senderName || 'Daripallah',
                body: notifMessage.trim(),
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'daripallah-msg',
                requireInteraction: true,
                vibrate: [200, 100, 200]
              },
              headers: {
                Urgency: 'high'
              }
            },
            tokens,
          };

          const response = await admin.messaging().sendEachForMulticast(payload);
          
          if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const errCode = resp.error?.code;
                if (errCode === 'messaging/invalid-registration-token' || errCode === 'messaging/registration-token-not-registered') {
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
            }
          }
          console.log(`[FCM] Sent to ${response.successCount} devices for shop ${shopId}`);
        }
      } catch (fcmErr) {
        console.error('[FCM] Error sending push notifications:', fcmErr.message);
      }
    } else if (senderRole === 'superadmin' && target === 'all') {
      // Superadmin global broadcast — send to all shops' FCM tokens
      try {
        const shopsSnap = await adminDb.collection('shops').get();
        const allTokens = [];
        for (const shopDoc of shopsSnap.docs) {
          const tokensSnap = await adminDb.collection('shops').doc(shopDoc.id).collection('fcmTokens').get();
          tokensSnap.docs.forEach(d => allTokens.push(d.id));
        }
        if (allTokens.length > 0) {
          // Send in batches of 500 (FCM limit)
          const batchSize = 500;
          for (let i = 0; i < allTokens.length; i += batchSize) {
            const batch = allTokens.slice(i, i + batchSize);
            await admin.messaging().sendEachForMulticast({
              notification: { title: 'Daripallah', body: notifMessage.trim(), icon: '/logo.png' },
              webpush: {
                notification: {
                  title: 'Daripallah',
                  body: notifMessage.trim(),
                  icon: '/logo.png',
                  badge: '/logo.png',
                  tag: 'daripallah-msg',
                  requireInteraction: true,
                },
                headers: { Urgency: 'high' }
              },
              tokens: batch,
            });
          }
        }
      } catch (fcmErr) {
        console.error('[FCM] Global broadcast error:', fcmErr.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Broadcast send error:', error);
    return NextResponse.json({ error: 'ব্রডকাস্ট পাঠাতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

// GET — Fetch recent broadcasts/history for a shop
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (shopId) {
      // Return email broadcast history for this shop
      const histSnap = await adminDb
        .collection('broadcast_history')
        .where('shopId', '==', shopId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      const history = histSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ history });
    }

    // Return general broadcasts
    const snap = await adminDb
      .collection('broadcasts')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    const broadcasts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ broadcasts });
  } catch (error) {
    console.error('Broadcast fetch error:', error);
    return NextResponse.json({ broadcasts: [], history: [] });
  }
}

// DELETE — Delete a broadcast
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const broadcastId = searchParams.get('id');

    if (!broadcastId) {
      return NextResponse.json({ error: 'আইডি প্রয়োজন' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    // Verify token
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    if (!token) {
      return NextResponse.json({ error: 'লগইন করুন' }, { status: 401 });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const callerUid = decodedToken.uid;

    // Fetch broadcast first to check owner
    const broadcastDocRef = adminDb.collection('broadcasts').doc(broadcastId);
    const docSnap = await broadcastDocRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'নোটিফিকেশনটি পাওয়া যায়নি' }, { status: 404 });
    }

    const broadcastData = docSnap.data();

    // Check permissions: either superadmin or the shop owner who owns this broadcast
    let userRole = decodedToken.role || 'user';
    try {
      const userDoc = await adminDb.collection('users').doc(callerUid).get();
      if (userDoc.exists) {
        userRole = userDoc.data().role || userRole;
      }
    } catch (e) {}

    const isSystemAdmin = userRole === 'superadmin';
    const isOwner = broadcastData.shopId === callerUid;

    if (!isSystemAdmin && !isOwner) {
      return NextResponse.json({ error: 'এই নোটিফিকেশনটি ডিলিট করার অনুমতি আপনার নেই' }, { status: 403 });
    }

    // Delete from Firestore
    await broadcastDocRef.delete();
    console.log(`[Broadcast] Deleted doc ${broadcastId} by ${callerUid} (${userRole})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Broadcast delete error:', error);
    return NextResponse.json({ error: 'মুছে ফেলতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
