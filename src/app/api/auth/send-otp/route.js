export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { sendOTPEmail } from '@/lib/ruflo';

// CRIT-7 Fix: Rate limit OTP requests (Firestore-based, works on serverless)
const OTP_RATE_LIMIT = 5;       // max requests per window
const OTP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour window

async function isOtpRateLimited(email) {
  try {
    const rateLimitRef = adminDb.collection('otp_rate_limits').doc(email);
    const doc = await rateLimitRef.get();
    const now = Date.now();

    if (!doc.exists) {
      await rateLimitRef.set({ count: 1, windowStart: now });
      return false;
    }

    const data = doc.data();
    if (now - data.windowStart > OTP_RATE_WINDOW_MS) {
      // Window expired, reset
      await rateLimitRef.set({ count: 1, windowStart: now });
      return false;
    }

    if (data.count >= OTP_RATE_LIMIT) {
      return true; // Rate limited
    }

    await rateLimitRef.update({ count: admin.firestore.FieldValue.increment(1) });
    return false;
  } catch (err) {
    console.warn('[OTP Rate Limit] Check failed:', err.message);
    return false; // Fail open to not block legitimate users
  }
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'সঠিক ইমেইল ঠিকানা প্রদান করুন।' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 🔒 CRIT-7: Rate limit check
    if (await isOtpRateLimited(cleanEmail)) {
      return NextResponse.json({ 
        error: 'অনেক বেশি ওটিপি রিকোয়েস্ট করা হয়েছে। ১ ঘন্টা পর আবার চেষ্টা করুন।' 
      }, { status: 429 });
    }
    
    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to firestore under 'otp_codes' collection with 10 minutes expiry (epoch milliseconds)
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await adminDb.collection('otp_codes').doc(cleanEmail).set({
      otp,
      expiresAt,
      attempts: 0, // Track verification attempts for brute-force protection
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send OTP email - AWAITED (not fire-and-forget) so we can detect failures
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
        error: 'ইমেইল পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'ওটিপি কোড সফলভাবে পাঠানো হয়েছে।' });
  } catch (err) {
    console.error('[Send OTP Error]', err);
    return NextResponse.json({ error: 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
