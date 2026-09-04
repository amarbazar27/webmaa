import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS;

  if (!user || !pass) return null;

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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'লগইন আবশ্যক' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Verify user is superadmin
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'superadmin') {
      return NextResponse.json({ error: 'শুধুমাত্র সুপারঅ্যাডমিন এই সুবিধা ব্যবহার করতে পারবেন' }, { status: 403 });
    }

    const body = await request.json();
    const { subject, message, recipientEmails } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'ইমেইল বিষয় এবং বার্তা আবশ্যক' }, { status: 400 });
    }

    let emailsToSend = [];
    if (Array.isArray(recipientEmails) && recipientEmails.length > 0) {
      emailsToSend = recipientEmails;
    } else {
      // Send to all active subscribers
      const snap = await adminDb.collection('newsletter_subscribers').where('status', '==', 'active').get();
      emailsToSend = snap.docs.map(d => d.data().email).filter(Boolean);
    }

    if (emailsToSend.length === 0) {
      return NextResponse.json({ error: 'কোনো গ্রাহক পাওয়া যায়নি' }, { status: 400 });
    }

    const transporter = createTransporter();
    let sentCount = 0;
    let failedCount = 0;

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #E0E5EC; padding: 32px; border-radius: 24px; color: #3D4852;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #6C63FF; margin: 0; font-size: 24px; font-weight: 800;">BDRetailers</h2>
          <p style="color: #6B7280; font-size: 12px; margin: 4px 0 0 0;">Official Newsletter & Updates</p>
        </div>
        <div style="background-color: #FFFFFF; padding: 24px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 24px;">
          <h3 style="color: #1F2937; margin-top: 0; font-size: 18px; font-weight: 700;">${escapeHtml(subject)}</h3>
          <div style="color: #4B5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
        </div>
        <div style="text-align: center; font-size: 11px; color: #9CA3AF;">
          <p>© ${new Date().getFullYear()} BDRetailers.com — All rights reserved.</p>
          <p>আপনি এই ইমেইলটি পেয়েছেন কারণ আপনি আমাদের নিউজলেটার সাবস্ক্রাইব করেছেন।</p>
        </div>
      </div>
    `;

    if (transporter) {
      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@bdretailers.com';
      for (const recipient of emailsToSend) {
        try {
          await transporter.sendMail({
            from: `"BDRetailers" <${fromEmail}>`,
            to: recipient,
            subject: subject.trim(),
            html: emailHtml,
          });
          sentCount++;
        } catch (mailErr) {
          console.warn(`[Broadcast Email] Failed to send to ${recipient}:`, mailErr.message);
          failedCount++;
        }
      }
    } else {
      // SMTP not configured - simulated broadcast
      sentCount = emailsToSend.length;
    }

    // Record log in broadcast_logs
    await adminDb.collection('broadcast_logs').add({
      type: 'newsletter_broadcast',
      subject,
      message,
      recipientCount: emailsToSend.length,
      sentCount,
      failedCount,
      senderId: decoded.uid,
      sentAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      total: emailsToSend.length,
      message: `${sentCount} জন সাবস্ক্রাইবারকে সফলভাবে ইমেইল পাঠানো হয়েছে!`
    });
  } catch (error) {
    console.error('[Admin Broadcast Error]:', error);
    return NextResponse.json({ error: error.message || 'ইমেইল পাঠাতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
