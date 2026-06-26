export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { sendOTPEmail } from '@/lib/ruflo';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'সঠিক ইমেইল ঠিকানা প্রদান করুন।' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    
    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to firestore under 'otp_codes' collection with 2 minutes expiry (epoch milliseconds)
    const expiresAt = Date.now() + 120 * 1000;
    
    await adminDb.collection('otp_codes').doc(cleanEmail).set({
      otp,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send the email using Ruflo helper (non-blocking, fire-and-forget)
    void sendOTPEmail({
      to: cleanEmail,
      otp,
      purpose: 'লগইন'
    }).then(result => {
      if (!result.success) {
        console.error('[Send OTP Async Failure]:', result.error);
      }
    }).catch(err => {
      console.error('[Send OTP Async Error]:', err.message);
    });

    return NextResponse.json({ success: true, message: 'ওটিপি কোড সফলভাবে পাঠানো হয়েছে।' });
  } catch (err) {
    console.error('[Send OTP Error]', err);
    return NextResponse.json({ error: err.message || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
