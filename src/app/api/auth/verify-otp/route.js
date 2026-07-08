export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

const MAX_OTP_ATTEMPTS = 5; // Lock out after 5 failed attempts

export async function POST(req) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'ইমেইল এবং ওটিপি উভয়ই প্রয়োজন।' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    const otpDocRef = adminDb.collection('otp_codes').doc(cleanEmail);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: 'কোনো ওটিপি অনুরোধ পাওয়া যায়নি বা মেয়াদ শেষ হয়েছে।' }, { status: 400 });
    }

    const data = otpDoc.data();
    
    // Check expiry (epoch milliseconds comparison)
    if (Date.now() > data.expiresAt) {
      await otpDocRef.delete();
      return NextResponse.json({ error: 'ওটিপির মেয়াদ শেষ হয়ে গেছে। পুনরায় চেষ্টা করুন।' }, { status: 400 });
    }

    // 🔒 CRIT-7: Brute-force protection — lock out after MAX_OTP_ATTEMPTS failed tries
    const attempts = data.attempts || 0;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await otpDocRef.delete();
      return NextResponse.json({ error: 'অনেক বেশি ভুল চেষ্টা। নতুন ওটিপি নিন।' }, { status: 429 });
    }

    // Check match
    if (data.otp !== cleanOtp) {
      // Increment attempt counter
      await otpDocRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
      const remaining = MAX_OTP_ATTEMPTS - attempts - 1;
      return NextResponse.json({ 
        error: `ভুল ওটিপি কোড। আরও ${remaining} বার চেষ্টা করা যাবে।` 
      }, { status: 400 });
    }

    // OTP matched! Delete the document to prevent reuse
    await otpDocRef.delete();

    // Firebase Auth: Get or Create User
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(cleanEmail);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await adminAuth.createUser({
          email: cleanEmail,
          emailVerified: true,
          displayName: cleanEmail.split('@')[0],
        });
      } else {
        throw err;
      }
    }

    // Generate Firebase Custom Token
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return NextResponse.json({ 
      success: true, 
      customToken,
      message: 'লগইন সফল হয়েছে।' 
    });
  } catch (err) {
    console.error('[Verify OTP Error]', err);
    return NextResponse.json({ error: 'ওটিপি ভেরিফিকেশন ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
