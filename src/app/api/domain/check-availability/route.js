import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const RESERVED_SLUGS = new Set([
  'store', 'main', 'admin', 'superadmin', 'dashboard', 'api', 'templates',
  'login', 'register', 'showcase', 'checkout', 'cart', 'reviews', 'become-retailer',
  'privacy-policy', 'privacy', 'account-delete', 'terms', 'terms-of-service',
  'terms-and-conditions', 'demo', 'icons', 'shop', 'domain', 'support',
  'help', 'billing', 'orders', 'products', 'settings', 'broadcast'
]);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get('slug') || '';
  const currentShopId = searchParams.get('currentShopId') || '';
  
  // Normalize slug: lowercase, letters, numbers, hyphens only
  const slug = rawSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  if (!slug || slug.length < 3) {
    return NextResponse.json({
      available: false,
      reason: 'too_short',
      message: 'শপের নাম বা লিংক কমপক্ষে ৩ অক্ষরের হতে হবে।'
    }, { status: 400 });
  }

  if (slug.length > 30) {
    return NextResponse.json({
      available: false,
      reason: 'too_long',
      message: 'শপের নাম বা লিংক সর্বোচ্চ ৩০ অক্ষরের হতে পারে।'
    }, { status: 400 });
  }

  // 1. Check Reserved keywords
  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({
      available: false,
      reason: 'reserved',
      slug,
      message: `"${slug}" নামটি প্ল্যাটফর্মের মূল সিস্টেমের জন্য সংরক্ষিত (Reserved)। অনুগ্রহ করে অন্য একটি নাম বেছে নিন।`
    });
  }

  // 2. Check Firestore shops collection
  try {
    const shopsRef = collection(db, 'shops');
    
    // Check shopSlug
    const q1 = query(shopsRef, where('shopSlug', '==', slug));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const matchedDoc = snap1.docs[0];
      if (currentShopId && matchedDoc.id === currentShopId) {
        return NextResponse.json({
          available: true,
          isCurrent: true,
          slug,
          subdomain: `${slug}.bdretailers.com`,
          message: `✓ এটি আপনার বর্তমান সক্রিয় সাবডোমেন লিংক।`
        });
      }
      return NextResponse.json({
        available: false,
        reason: 'taken',
        slug,
        message: `"${slug}.bdretailers.com" ইতিমধ্যে অন্য একজন রিটেইলার ব্যবহার করছেন। অনুগ্রহ করে অন্য নাম বেছে নিন।`
      });
    }

    // Check subdomainSlug
    const q2 = query(shopsRef, where('subdomainSlug', '==', slug));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const matchedDoc = snap2.docs[0];
      if (currentShopId && matchedDoc.id === currentShopId) {
        return NextResponse.json({
          available: true,
          isCurrent: true,
          slug,
          subdomain: `${slug}.bdretailers.com`,
          message: `✓ এটি আপনার বর্তমান সক্রিয় সাবডোমেন লিংক।`
        });
      }
      return NextResponse.json({
        available: false,
        reason: 'taken',
        slug,
        message: `"${slug}.bdretailers.com" ইতিমধ্যে অন্য একজন রিটেইলার ব্যবহার করছেন। অনুগ্রহ করে অন্য নাম বেছে নিন।`
      });
    }

    // Fallback: Admin SDK check if available
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        const adminSnap = await adminDb.collection('shops').where('shopSlug', '==', slug).limit(1).get();
        if (!adminSnap.empty) {
          return NextResponse.json({
            available: false,
            reason: 'taken',
            slug,
            message: `"${slug}.bdretailers.com" ইতিমধ্যে একজন রিটেইলার ব্যবহার করছেন।`
          });
        }
      }
    } catch (_) {}

    return NextResponse.json({
      available: true,
      slug,
      subdomain: `${slug}.bdretailers.com`,
      message: `✓ চমৎকার! "${slug}.bdretailers.com" লিংকটি সম্পূর্ণ খালি ও ব্যবহারের জন্য উন্মুক্ত!`
    });
  } catch (err) {
    console.error('Availability check error:', err);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
