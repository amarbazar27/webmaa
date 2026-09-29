export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { createRateLimiter } from '@/lib/rate-limit';

const uploadLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60000, prefix: 'api_upload' });

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * POST /api/upload?shopId=xxx
 * Uploads an image to Cloudinary using shop-specific or platform credentials.
 */
export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // 🔒 1. Rate Limit Check
    const { limited } = await uploadLimiter.check(ip);
    if (limited) {
      return NextResponse.json({ error: 'অনেক বেশি আপলোড রিকোয়েস্ট করা হয়েছে। ১ মিনিট পর চেষ্টা করুন।' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    // ── Resolve Cloudinary credentials ──────────────────────────────────────
    let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    let uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // If shopId provided, try to get shop-specific credentials from Firestore via adminDb
    if (shopId && adminDb) {
      try {
        const shopSnap = await adminDb.collection('shops').doc(shopId).get();
        if (shopSnap.exists) {
          const shopData = shopSnap.data();
          const accounts = shopData.cloudinaryAccounts;
          if (Array.isArray(accounts) && accounts.length > 0) {
            const idx = Math.floor(Math.random() * accounts.length);
            cloudName = accounts[idx].cloudName || cloudName;
            uploadPreset = accounts[idx].uploadPreset || uploadPreset;
          } else if (shopData.cloudinaryCloudName && shopData.cloudinaryUploadPreset) {
            cloudName = shopData.cloudinaryCloudName;
            uploadPreset = shopData.cloudinaryUploadPreset;
          }
        }
      } catch (e) {
        console.warn('[/api/upload] Firestore lookup failed, using platform Cloudinary:', e.message);
      }
    }

    if (!cloudName || !uploadPreset) {
      return NextResponse.json(
        { error: 'Cloudinary credentials not configured. Please set cloudinaryCloudName and cloudinaryUploadPreset in Preferences.' },
        { status: 500 }
      );
    }

    // ── Get file from request ─────────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 🔒 2. Validate MIME Type
    const mimeType = file.type?.toLowerCase() || '';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ error: 'অননুমোদিত ফাইল ফরম্যাট। শুধুমাত্র ছবি (JPG, PNG, WebP) অথবা ভিডিও (MP4) ফাইল আপলোড করুন।' }, { status: 400 });
    }

    // 🔒 3. Validate File Size
    const isVideo = mimeType.startsWith('video/');
    const maxAllowed = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxAllowed) {
      return NextResponse.json(
        { error: `ফাইল সাইজ সীমা অতিক্রম করেছে। সর্বোচ্চ ${isVideo ? '25MB' : '10MB'} ফাইল আপলোড করা যাবে।` },
        { status: 413 }
      );
    }

    // ── Upload to Cloudinary via unsigned upload ───────────────────────────
    const rawFolder = formData.get('folder');
    const folder = (typeof rawFolder === 'string' ? rawFolder.replace(/[^a-zA-Z0-9_\-\/]/g, '') : 'homepage-builder').slice(0, 50);

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', uploadPreset);
    uploadFormData.append('folder', folder);

    const resourceType = isVideo ? 'video' : 'image';
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadFormData,
      signal: AbortSignal.timeout(25000), // 25s timeout against slowloris
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[/api/upload] Cloudinary error:', errorText);
      return NextResponse.json(
        { error: 'Cloudinary upload failed. Check your cloud name and upload preset.', details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });

  } catch (err) {
    console.error('[/api/upload] Unexpected error:', err);
    return NextResponse.json({ error: 'Upload failed: ' + err.message }, { status: 500 });
  }
}
