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
    
    // Save to firestore under 'otp_codes' collection with 10 minutes expiry (epoch milliseconds)
    // Previously was 2 minutes which was too short, especially with email delivery delays
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await adminDb.collection('otp_codes').doc(cleanEmail).set({
      otp,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send OTP email - AWAITED (not fire-and-forget) so we can detect failures
    // Previously this was fire-and-forget (void) which meant users got "success"
    // even when the email failed to send, so they never received the OTP code
    const emailResult = await sendOTPEmail({
      to: cleanEmail,
      otp,
      purpose: 'লগইন'
    });

    if (!emailResult?.success) {
      console.error('[Send OTP] Email delivery failed:', emailResult?.error || emailResult?.reason);
      // Clean up the OTP from Firestore since email didn't send
      try { await adminDb.collection('otp_codes').doc(cleanEmail).delete(); } catch (_) {}
      return NextResponse.json({ 
        error: 'ইমেইল পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'ওটিপি কোড সফলভাবে পাঠানো হয়েছে।' });
  } catch (err) {
    console.error('[Send OTP Error]', err);
    return NextResponse.json({ error: err.message || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
