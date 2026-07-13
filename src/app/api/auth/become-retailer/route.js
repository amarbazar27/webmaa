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

    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'মোবাইল নম্বর প্রদান করুন।' }, { status: 400 });
    }

    // Check if user is already approved as a retailer
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    if (userData.role === 'retailer') {
      return NextResponse.json({ 
        error: 'আপনি ইতিমধ্যে একজন ভেরিফাইড রিটেইলার। সরাসরি ড্যাশবোর্ডে লগইন করুন।' 
      }, { status: 400 });
    }

    // Check if phone number is already registered under another approved/pending request
    const phoneCheck = await adminDb.collection('retailer_requests')
      .where('phone', '==', phone.trim())
      .get();
    if (!phoneCheck.empty && phoneCheck.docs.some(doc => doc.id !== uid)) {
      const docOwner = phoneCheck.docs.find(doc => doc.id !== uid)?.data();
      const rawEmail = docOwner?.email || '';
      let maskedEmail = '';
      if (rawEmail) {
        const [localPart, domain] = rawEmail.split('@');
        if (localPart.length <= 4) {
          maskedEmail = localPart.slice(0, 1) + '***' + localPart.slice(-1) + '@' + domain;
        } else {
          maskedEmail = localPart.slice(0, 2) + '***' + localPart.slice(-2) + '@' + domain;
        }
      }
      return NextResponse.json({ 
        error: `এই মোবাইল নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে (This number is already used)। অনুগ্রহ করে আপনার রেজিস্টার্ড ইমেইল (${maskedEmail}) দিয়ে লগইন করুন।` 
      }, { status: 400 });
    }

    // Check if email is already registered under another request
    const emailCheck = await adminDb.collection('retailer_requests')
      .where('email', '==', email)
      .get();
    if (!emailCheck.empty && emailCheck.docs.some(doc => doc.id !== uid)) {
      return NextResponse.json({ error: 'এই ইমেইলটি দিয়ে ইতিমধ্যে আবেদন করা হয়েছে (This email is already used)। অনুগ্রহ করে এই অ্যাকাউন্ট দিয়ে লগইন করুন।' }, { status: 400 });
    }

    // ── Limit: Maximum 10 registrations per day globally ──
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const dayStart = admin.firestore.Timestamp.fromDate(todayDate);
    
    const dailyRegistrationsCount = await adminDb.collection('retailer_requests')
      .where('requestedAt', '>=', dayStart)
      .get();
    
    // Filter out edits of existing request by same user
    const dailyUniqueUsers = new Set(dailyRegistrationsCount.docs.map(doc => doc.id));
    if (dailyUniqueUsers.size >= 10 && !dailyUniqueUsers.has(uid)) {
      return NextResponse.json({ 
        error: 'দুঃখিত, দৈনিক রিটেইলার আবেদনের সর্বোচ্চ সীমা অতিক্রম হয়েছে। অনুগ্রহ করে আগামীকাল চেষ্টা করুন।' 
      }, { status: 429 });
    }

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
      phone: phone.trim(),
      status,
      requestedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({ success: true, autoApproved: autoApprove });
  } catch (err) {
    console.error('[Become Retailer API Error]', err);
    return NextResponse.json({ error: 'সার্ভার ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' }, { status: 500 });
  }
}
