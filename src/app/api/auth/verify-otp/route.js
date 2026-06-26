export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

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
    
    // Check expiry
    const now = new Date();
    const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
    if (now > expiresAt) {
      await otpDocRef.delete();
      return NextResponse.json({ error: 'ওটিপির মেয়াদ শেষ হয়ে গেছে। পুনরায় চেষ্টা করুন।' }, { status: 400 });
    }

    // Check match
    if (data.otp !== cleanOtp) {
      return NextResponse.json({ error: 'ভুল ওটিপি কোড। সঠিক কোডটি পুনরায় প্রবেশ করান।' }, { status: 400 });
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
    return NextResponse.json({ error: err.message || 'ওটিপি ভেরিফিকেশন ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
