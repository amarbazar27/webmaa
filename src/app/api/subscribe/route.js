import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb } from '@/lib/firebase-admin';
import { createRateLimiter } from '@/lib/rate-limit';

const subscribeLimiter = createRateLimiter({ maxRequests: 5, windowMs: 3600000, prefix: 'newsletter_sub' });

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // 🔒 1. Rate Limiting Check
    const { limited } = await subscribeLimiter.check(ip);
    if (limited) {
      return NextResponse.json(
        { error: 'অনেক বেশি অনুরোধ করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, honeypot } = body;

    // 🔒 2. Anti-Bot Honeypot Defense
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ error: 'Bot detected' }, { status: 403 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: 'অনুগ্রহ করে সঠিক ইমেইল অ্যাড্রেস দিন' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!adminDb) {
      return NextResponse.json(
        { error: 'ডাটাবেজ সংযোগে সমস্যা, অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।' },
        { status: 500 }
      );
    }

    const subscribersRef = adminDb.collection('newsletter_subscribers');
    const existingSnap = await subscribersRef.where('email', '==', cleanEmail).limit(1).get();

    if (!existingSnap.empty) {
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: 'আপনি ইতোমধ্যেই আমাদের নিউজলেটার সাবস্ক্রাইব করেছেন! ধন্যবাদ।'
      });
    }

    const newSub = {
      email: cleanEmail,
      createdAt: new Date().toISOString(),
      source: 'bdretailers_homepage',
      status: 'active'
    };

    const docRef = await subscribersRef.add(newSub);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'অভিনন্দন! আপনার ইমেইল সফলভাবে সাবস্ক্রাইব হয়েছে।'
    });
  } catch (error) {
    console.error('[Newsletter Subscribe Error]:', error);
    return NextResponse.json(
      { error: 'সাবস্ক্রিপশন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
