import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/verifyAuth';

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    const email = (authResult.email || '').toLowerCase().trim();
    const isSuper = 
      authResult.role === 'superadmin' ||
      email === 'rafiqunnabi07@gmail.com' ||
      email === 'rafiqunnabi29@gmail.com' ||
      email === 'amarbazar27@gmail.com' ||
      email === 'contact@bdretailers.com';

    if (!isSuper) {
      return NextResponse.json({ error: 'শুধুমাত্র সুপারএডমিন অ্যাক্সেস অনুমোদিত' }, { status: 403 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'অবৈধ কনফিগারেশন ডেটা' }, { status: 400 });
    }

    // Sanitize any invalid fields
    const cleanData = JSON.parse(JSON.stringify(body, (key, val) => {
      if (val && typeof val === 'object' && val.seconds !== undefined && val.nanoseconds !== undefined) {
        return new Date(val.seconds * 1000).toISOString();
      }
      return val;
    }));

    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    await adminDb.collection('config').doc('global').set(cleanData, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'গ্লোবাল কনফিগারেশন সফলভাবে আপডেট হয়েছে! 🎉'
    });
  } catch (error) {
    console.error('[Superadmin Config API Error]:', error);
    return NextResponse.json({ error: error.message || 'সার্ভার ত্রুটি' }, { status: error.statusCode || 500 });
  }
}
