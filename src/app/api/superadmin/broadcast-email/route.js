export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { subject, message, target, shopId } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'বিষয় ও মেসেজ লিখুন' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    // Collect unique customer emails
    const emailSet = new Set();

    if (target === 'shop_customers' && shopId) {
      // Get emails from a specific shop's orders
      const ordersSnap = await adminDb
        .collection('shops').doc(shopId)
        .collection('orders').get();
      ordersSnap.docs.forEach(doc => {
        const email = doc.data().customerEmail;
        if (email && email.includes('@')) emailSet.add(email);
      });
    } else {
      // Get all customer emails across all shops
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

    const emails = Array.from(emailSet);
    if (emails.length === 0) {
      return NextResponse.json({ success: true, sent: 0, total: 0, message: 'কোনো ইমেইল পাওয়া যায়নি' });
    }

    const transporter = createTransporter();
    let sent = 0;
    let failed = 0;

    if (transporter) {
      const emailPromises = emails.map(async (email) => {
        try {
          await transporter.sendMail({
            from: `"Webmaa" <${process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER}>`,
            to: email,
            subject: subject,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:30px;border-radius:12px 12px 0 0;text-align:center">
                  <h1 style="color:white;margin:0;font-size:24px">Webmaa</h1>
                  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Platform Announcement</p>
                </div>
                <div style="background:#fff;padding:30px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
                  <h2 style="color:#1e293b;font-size:18px;margin-bottom:16px">${subject}</h2>
                  <div style="color:#475569;font-size:15px;line-height:1.7;white-space:pre-wrap">${message}</div>
                  <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0" />
                  <p style="color:#94a3b8;font-size:12px;text-align:center">Powered by Webmaa Platform</p>
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
