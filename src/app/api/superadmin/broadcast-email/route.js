export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

// ── Auth Guard: Verifies Firebase ID token + superadmin role ──
async function verifySuperAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized: Missing token', status: 401 };
  }
  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    // Check Firestore for superadmin role
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'superadmin') {
      return { error: 'Forbidden: Superadmin access required', status: 403 };
    }
    return { uid: decoded.uid };
  } catch (err) {
    return { error: 'Unauthorized: Invalid token', status: 401 };
  }
}

function createTransporter() {
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

// GET — Fetch compiled recipients for a target/shop
export async function GET(request) {
  // 🔒 Auth required — only superadmin
  const auth = await verifySuperAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target') || 'all_customers';
    const shopId = searchParams.get('shopId');

    if (!adminDb) {
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    const emailMap = new Map(); // email -> { email, name, role, shopName }

    if (target === 'all_retailers') {
      const shopsSnap = await adminDb.collection('shops').get();
      for (const shopDoc of shopsSnap.docs) {
        const sData = shopDoc.data();
        const email = sData.ownerEmail;
        if (email && email.includes('@')) {
          emailMap.set(email, {
            email,
            name: sData.shopName || 'Retailer',
            role: 'retailer',
            shopName: sData.shopName || 'N/A'
          });
        }
      }
    } else if (target === 'shop_retailer' && shopId) {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (shopDoc.exists) {
        const sData = shopDoc.data();
        const email = sData.ownerEmail;
        if (email && email.includes('@')) {
          emailMap.set(email, {
            email,
            name: sData.shopName || 'Retailer',
            role: 'retailer',
            shopName: sData.shopName || 'N/A'
          });
        }
      }
    } else if (target === 'shop_customers' && shopId) {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      const shopName = shopDoc.exists ? shopDoc.data().shopName : 'Shop';
      const ordersSnap = await adminDb
        .collection('shops').doc(shopId)
        .collection('orders').get();
      ordersSnap.docs.forEach(doc => {
        const email = doc.data().customerEmail;
        if (email && email.includes('@')) {
          emailMap.set(email, {
            email,
            name: doc.data().customerName || email.split('@')[0],
            role: 'customer',
            shopName
          });
        }
      });
    } else if (target === 'all_customers') {
      const shopsSnap = await adminDb.collection('shops').get();
      for (const shopDoc of shopsSnap.docs) {
        const shopName = shopDoc.data().shopName || 'Shop';
        const ordersSnap = await adminDb
          .collection('shops').doc(shopDoc.id)
          .collection('orders').get();
        ordersSnap.docs.forEach(doc => {
          const email = doc.data().customerEmail;
          if (email && email.includes('@')) {
            emailMap.set(email, {
              email,
              name: doc.data().customerName || doc.data().customerPhone || email.split('@')[0],
              role: 'customer',
              shopName
            });
          }
        });
      }
    } else if (target === 'shop_everyone' && shopId) {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (shopDoc.exists) {
        const sData = shopDoc.data();
        const shopName = sData.shopName || 'Shop';
        const rEmail = sData.ownerEmail;
        if (rEmail && rEmail.includes('@')) {
          emailMap.set(rEmail, {
            email: rEmail,
            name: `${shopName} (Retailer)`,
            role: 'retailer',
            shopName
          });
        }
        const ordersSnap = await adminDb
          .collection('shops').doc(shopId)
          .collection('orders').get();
        ordersSnap.docs.forEach(doc => {
          const email = doc.data().customerEmail;
          if (email && email.includes('@')) {
            emailMap.set(email, {
              email,
              name: doc.data().customerName || doc.data().customerPhone || email.split('@')[0],
              role: 'customer',
              shopName
            });
          }
        });
      }
    } else if (target === 'everyone') {
      const shopsSnap = await adminDb.collection('shops').get();
      for (const shopDoc of shopsSnap.docs) {
        const sData = shopDoc.data();
        const shopName = sData.shopName || 'Shop';
        const rEmail = sData.ownerEmail;
        if (rEmail && rEmail.includes('@')) {
          emailMap.set(rEmail, {
            email: rEmail,
            name: `${shopName} (Retailer)`,
            role: 'retailer',
            shopName
          });
        }
        const ordersSnap = await adminDb
          .collection('shops').doc(shopDoc.id)
          .collection('orders').get();
        ordersSnap.docs.forEach(doc => {
          const email = doc.data().customerEmail;
          if (email && email.includes('@')) {
            emailMap.set(email, {
              email,
              name: doc.data().customerName || doc.data().customerPhone || email.split('@')[0],
              role: 'customer',
              shopName
            });
          }
        });
      }
    }

    const emails = Array.from(emailMap.values());
    return NextResponse.json({ emails });
  } catch (error) {
    console.error('[SuperAdmin Recipient Fetch] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 });
  }
}

// POST — Send emails to target or direct list
export async function POST(request) {
  // 🔒 Auth required — only superadmin
  const auth = await verifySuperAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { subject, message, target, shopId, emails: passedEmails } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'বিষয় ও মেসেজ লিখুন' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    let emails = [];
    if (passedEmails && Array.isArray(passedEmails) && passedEmails.length > 0) {
      emails = passedEmails;
    } else {
      // Fallback compilation (backward compatibility)
      const emailSet = new Set();
      if (target === 'shop_customers' && shopId) {
        const ordersSnap = await adminDb
          .collection('shops').doc(shopId)
          .collection('orders').get();
        ordersSnap.docs.forEach(doc => {
          const email = doc.data().customerEmail;
          if (email && email.includes('@')) emailSet.add(email);
        });
      } else {
        const shopsSnap = await adminDb.collection('shops').get();
        for (const shopDoc of shopsSnap.docs) {
          const ordersSnap = await adminDb
            .collection('shops').doc(shopDoc.id)
            .collection('orders').get();
          ordersSnap.docs.forEach(doc => {
            const email = doc.data().customerEmail;
            if (email && email.includes('@')) emailSet.add(email);
          });
        }
      }
      emails = Array.from(emailSet);
    }

    if (emails.length === 0) {
      return NextResponse.json({ success: true, sent: 0, total: 0, message: 'কোনো ইমেইল পাওয়া যায়নি' });
    }

    const transporter = createTransporter();
    let sent = 0;
    let failed = 0;

    if (transporter) {
      const escHtml = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

      const emailPromises = emails.map(async (email) => {
        try {
          await transporter.sendMail({
            from: `"Daripallah" <${process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER}>`,
            to: email,
            subject: subject,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:30px;border-radius:12px 12px 0 0;text-align:center">
                  <h1 style="color:white;margin:0;font-size:24px">Daripallah</h1>
                  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Platform Announcement</p>
                </div>
                <div style="background:#fff;padding:30px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
                  <h2 style="color:#1e293b;font-size:18px;margin-bottom:16px">${escHtml(subject)}</h2>
                  <div style="color:#475569;font-size:15px;line-height:1.7;white-space:pre-wrap">${escHtml(message)}</div>
                  <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0" />
                  <p style="color:#94a3b8;font-size:12px;text-align:center">Powered by Daripallah Platform</p>
                </div>
              </div>
            `,
          });
          sent++;
        } catch (err) {
          console.error(`[SuperAdmin Email] Failed to ${email}:`, err.message);
          failed++;
        }
      });
      await Promise.all(emailPromises);
    } else {
      console.warn('[SuperAdmin Email] No SMTP configured.');
      failed = emails.length;
    }

    return NextResponse.json({ success: true, sent, failed, total: emails.length });
  } catch (error) {
    console.error('[SuperAdmin Email] Error:', error);
    return NextResponse.json({ error: 'ইমেইল পাঠাতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
