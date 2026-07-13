export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

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

    const { action, phone, otpCode } = await req.json();

    if (action === 'send_otp') {
      if (!phone) {
        return NextResponse.json({ error: 'মোবাইল নম্বর প্রদান করুন।' }, { status: 400 });
      }

      // Check if phone number is already registered under another request
      const phoneCheck = await adminDb.collection('retailer_requests')
        .where('phone', '==', phone.trim())
        .get();
      if (!phoneCheck.empty && phoneCheck.docs.some(doc => doc.id !== uid)) {
        return NextResponse.json({ error: 'এই মোবাইল নম্বরটি দিয়ে ইতিমধ্যে আবেদন করা হয়েছে (This number is already used)।' }, { status: 400 });
      }

      // Check if email is already registered under another request
      const emailCheck = await adminDb.collection('retailer_requests')
        .where('email', '==', email)
        .get();
      if (!emailCheck.empty && emailCheck.docs.some(doc => doc.id !== uid)) {
        return NextResponse.json({ error: 'এই ইমেইলটি দিয়ে ইতিমধ্যে আবেদন করা হয়েছে (This email is already used)।' }, { status: 400 });
      }

      // Generate 6 digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Fetch global config
      const configDoc = await adminDb.collection('config').doc('global').get();
      const config = configDoc.data() || {};
      const gateway = config.smsGateway || 'mock';
      const greenwebToken = config.greenwebToken || '';

      // Save to temporary OTP codes
      await adminDb.collection('otp_codes').doc(phone).set({
        otp,
        expiresAt,
        attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      if (gateway === 'greenweb' && greenwebToken) {
        const message = `BDRetailers রিটেইলার ভেরিফিকেশন কোড: ${otp}`;
        const smsUrl = `https://api.greenweb.com.bd/api.php?token=${encodeURIComponent(greenwebToken)}&to=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}`;
        
        try {
          const smsRes = await fetch(smsUrl);
          const smsText = await smsRes.text();
          console.log('[Greenweb SMS Response]', smsText);
          return NextResponse.json({ success: true, message: 'আপনার মোবাইলে কোড পাঠানো হয়েছে।' });
        } catch (err) {
          console.error('[SMS Send Error]', err);
          return NextResponse.json({ error: 'এসএমএস পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' }, { status: 500 });
        }
      }

      // Fallback or Mock Mode
      return NextResponse.json({ 
        success: true, 
        mock: true, 
        otp, 
        message: 'এসএমএস গেটওয়ে কনফিগার করা নেই। কোডটি স্ক্রিনে দেওয়া হল।' 
      });
    }

    if (action === 'verify_otp') {
      if (!phone || !otpCode) {
        return NextResponse.json({ error: 'মোবাইল নম্বর এবং ভেরিফিকেশন কোড প্রদান করুন।' }, { status: 400 });
      }

      // Check if phone number is already registered under another request
      const phoneCheck = await adminDb.collection('retailer_requests')
        .where('phone', '==', phone.trim())
        .get();
      if (!phoneCheck.empty && phoneCheck.docs.some(doc => doc.id !== uid)) {
        return NextResponse.json({ error: 'এই মোবাইল নম্বরটি দিয়ে ইতিমধ্যে আবেদন করা হয়েছে (This number is already used)।' }, { status: 400 });
      }

      // Check if email is already registered under another request
      const emailCheck = await adminDb.collection('retailer_requests')
        .where('email', '==', email)
        .get();
      if (!emailCheck.empty && emailCheck.docs.some(doc => doc.id !== uid)) {
        return NextResponse.json({ error: 'এই ইমেইলটি দিয়ে ইতিমধ্যে আবেদন করা হয়েছে (This email is already used)।' }, { status: 400 });
      }

      const otpDocRef = adminDb.collection('otp_codes').doc(phone);
      const otpDoc = await otpDocRef.get();
      if (!otpDoc.exists) {
        return NextResponse.json({ error: 'ভেরিফিকেশন কোড পাওয়া যায়নি বা মেয়াদ শেষ হয়েছে।' }, { status: 400 });
      }

      const data = otpDoc.data();
      if (Date.now() > data.expiresAt) {
        await otpDocRef.delete();
        return NextResponse.json({ error: 'কোডের মেয়াদ শেষ হয়েছে। আবার নতুন কোড পাঠান।' }, { status: 400 });
      }

      if (data.otp !== otpCode.trim()) {
        await otpDocRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
        return NextResponse.json({ error: 'ভেরিফিকেশন কোডটি সঠিক নয়।' }, { status: 400 });
      }

      // Code validated!
      await otpDocRef.delete();

      // Fetch config to check autoApprove
      const configDoc = await adminDb.collection('config').doc('global').get();
      const config = configDoc.data() || {};
      const autoApprove = config.autoApproveRetailers ?? false;
      const status = autoApprove ? 'approved' : 'pending';

      // Update user role if autoApprove is active
      if (autoApprove) {
        await adminDb.collection('users').doc(uid).update({ role: 'retailer' });
        
        // Initialize store
        const shopRef = adminDb.collection('shops').doc(uid);
        const shopDoc = await shopRef.get();
        if (!shopDoc.exists) {
          const shopSlug = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000);
          await shopRef.set({
            ownerId: uid,
            shopName: `${displayName || 'My'}'s Premium Store`,
            shopSlug,
            subdomainSlug: shopSlug,
            isActive: true,
            showOnMainSite: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            staffEmails: [],
            banners: [
              'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
              'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200'
            ]
          });
        }
      }

      // Add to retailer request list
      await adminDb.collection('retailer_requests').doc(uid).set({
        uid,
        email,
        name: displayName,
        photoURL: decodedToken.picture || '',
        phone,
        status,
        requestedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return NextResponse.json({ success: true, autoApproved: autoApprove });
    }

    return NextResponse.json({ error: 'অকার্যকর রিকোয়েস্ট।' }, { status: 400 });
  } catch (err) {
    console.error('[Become Retailer API Error]', err);
    return NextResponse.json({ error: 'সার্ভার ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' }, { status: 500 });
  }
}
