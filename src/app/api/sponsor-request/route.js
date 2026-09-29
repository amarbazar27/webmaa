import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb } from '@/lib/firebase-admin';
import { createRateLimiter } from '@/lib/rate-limit';

const sponsorLimiter = createRateLimiter({ maxRequests: 5, windowMs: 3600000, prefix: 'sponsor_sub' });

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // 🔒 1. Rate Limiting Check
    const { limited } = await sponsorLimiter.check(ip);
    if (limited) {
      return NextResponse.json(
        { error: 'অনেক বেশি আবেদন জমা দেওয়া হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { companyName, contactName, email, phone, websiteUrl, logoUrl, note, honeypot } = body;

    // 🔒 2. Anti-Bot Honeypot Defense
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ error: 'Bot detected' }, { status: 403 });
    }

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
      companyName: companyName.trim().slice(0, 100),
      contactName: (contactName?.trim() || '').slice(0, 100),
      email: (email?.trim() || '').slice(0, 100),
      phone: (phone?.trim() || '').slice(0, 20),
      websiteUrl: (websiteUrl?.trim() || '').slice(0, 200),
      logoUrl: (logoUrl?.trim() || '').slice(0, 500),
      note: (note?.trim() || '').slice(0, 1000),
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
