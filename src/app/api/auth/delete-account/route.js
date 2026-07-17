export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { sendOTPEmail } from '@/lib/ruflo';

const MAX_OTP_ATTEMPTS = 5;

export async function POST(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'লগইন সেশন পাওয়া যায়নি।' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'অনুমোদনহীন সেশন। অনুগ্রহ করে আবার লগইন করুন।' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email?.toLowerCase().trim() || '';
    const displayName = decodedToken.name || 'ব্যবহারকারী';

    if (!email) {
      return NextResponse.json({ error: 'অনুমোদিত ইমেইল পাওয়া যায়নি।' }, { status: 400 });
    }

    const { action, code } = await req.json();

    if (action === 'send_code') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins expiry

      await adminDb.collection('deletion_codes').doc(email).set({
        otp,
        expiresAt,
        attempts: 0
      });

      await sendOTPEmail({
        to: email,
        name: displayName,
        otp,
        purpose: 'অ্যাকাউন্ট মুছে ফেলার'
      });

      return NextResponse.json({ success: true, message: 'আপনার ইমেইলে ভেরিফিকেশন কোড পাঠানো হয়েছে।' });
    }

    if (action === 'confirm_delete') {
      if (!code) {
        return NextResponse.json({ error: 'ভেরিফিকেশন কোড প্রদান করুন।' }, { status: 400 });
      }

      const otpDocRef = adminDb.collection('deletion_codes').doc(email);
      const otpDoc = await otpDocRef.get();

      if (!otpDoc.exists) {
        return NextResponse.json({ error: 'কোনো ওটিপি অনুরোধ পাওয়া যায়নি বা মেয়াদ শেষ হয়েছে।' }, { status: 400 });
      }

      const data = otpDoc.data();

      if (Date.now() > data.expiresAt) {
        await otpDocRef.delete();
        return NextResponse.json({ error: 'কোডের মেয়াদ শেষ হয়ে গেছে। পুনরায় চেষ্টা করুন।' }, { status: 400 });
      }

      const attempts = data.attempts || 0;
      if (attempts >= MAX_OTP_ATTEMPTS) {
        await otpDocRef.delete();
        return NextResponse.json({ error: 'অনেক বেশি ভুল চেষ্টা। নতুন কোড নিন।' }, { status: 429 });
      }

      if (data.otp !== code.trim()) {
        await otpDocRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
        const remaining = MAX_OTP_ATTEMPTS - attempts - 1;
        return NextResponse.json({ 
          error: `ভুল ভেরিফিকেশন কোড। আরও ${remaining} বার চেষ্টা করা যাবে।` 
        }, { status: 400 });
      }

      // OTP matches! Clean up codes
      await otpDocRef.delete();

      // Delete user's Firestore profile
      await adminDb.collection('users').doc(uid).delete();

      // Delete any shop that the user owns (if any)
      const shopsQuery = await adminDb.collection('shops').where('ownerEmail', '==', email).get();
      const batch = adminDb.batch();
      shopsQuery.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Delete user from Firebase Auth
      await adminAuth.deleteUser(uid);

      return NextResponse.json({ success: true, message: 'আপনার অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
    }

    return NextResponse.json({ error: 'কার্যকর অ্যাকশন পাওয়া যায়নি।' }, { status: 400 });

  } catch (err) {
    console.error('[DeleteAccount API Error]:', err);
    return NextResponse.json({ error: err.message || 'সার্ভার ত্রুটি।' }, { status: 500 });
  }
}
