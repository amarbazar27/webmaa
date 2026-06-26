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
    
    // Save to firestore under 'otp_codes' collection with 10 minutes expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await adminDb.collection('otp_codes').doc(cleanEmail).set({
      otp,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send the email using Ruflo helper
    const mailResult = await sendOTPEmail({
      to: cleanEmail,
      otp,
      purpose: 'লগইন'
    });

    if (!mailResult.success) {
      console.error('[Send OTP] Email failed:', mailResult.error);
      return NextResponse.json({ 
        error: 'ইমেইল ওটিপি পাঠানো ব্যর্থ হয়েছে। অনুগ্রহ করে রিটেইল ড্যাশবোর্ডে Ruflo ইমেইল কনফিগারেশন চেক করুন।' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'ওটিপি কোড সফলভাবে পাঠানো হয়েছে।' });
  } catch (err) {
    console.error('[Send OTP Error]', err);
    return NextResponse.json({ error: err.message || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
