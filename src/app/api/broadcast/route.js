export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// POST — Send a broadcast notification
export async function POST(request) {
  try {
    const body = await request.json();
    const { message, type = 'info', target = 'all', senderRole, shopId, senderName } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'বার্তা লিখুন' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'সিস্টেম রিফ্রেশ করুন (Database Error)' }, { status: 500 });
    }

    await adminDb.collection('broadcasts').add({
      message: message.trim(),
      type,
      target,
      senderRole: senderRole || 'system',
      shopId: shopId || null,
      senderName: senderName || 'System',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Broadcast send error:', error);
    return NextResponse.json({ error: 'ব্রডকাস্ট পাঠাতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

// GET — Fetch recent broadcasts
export async function GET() {
  try {
    const snap = await adminDb
      .collection('broadcasts')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const broadcasts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ broadcasts });
  } catch (error) {
    console.error('Broadcast fetch error:', error);
    return NextResponse.json({ broadcasts: [] });
  }
}
