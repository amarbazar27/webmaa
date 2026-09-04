import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { companyName, contactName, email, phone, websiteUrl, logoUrl, note } = body;

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'কোম্পানি বা ব্র্যান্ডের নাম প্রয়োজন' }, { status: 400 });
    }
    if (!email?.trim() && !phone?.trim()) {
      return NextResponse.json({ error: 'যোগাযোগের জন্য ইমেইল বা ফোন নম্বর দিন' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'ডাটাবেজ সংযোগে সমস্যা।' }, { status: 500 });
    }

    const sponsorRequest = {
      companyName: companyName.trim(),
      contactName: contactName?.trim() || '',
      email: email?.trim() || '',
      phone: phone?.trim() || '',
      websiteUrl: websiteUrl?.trim() || '',
      logoUrl: logoUrl?.trim() || '',
      note: note?.trim() || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('sponsor_requests').add(sponsorRequest);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'আপনার স্পনসর ও পার্টনারশিপ আবেদন সফলভাবে জমা হয়েছে! আমাদের টিম শীঘ্রই যোগাযোগ করবে।'
    });
  } catch (error) {
    console.error('[Sponsor Request Error]:', error);
    return NextResponse.json({ error: 'আবেদন জমা দিতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
