import { NextResponse } from 'next/server';

/**
 * POST /api/upload?shopId=xxx
 * Uploads an image to Cloudinary using shop-specific or platform credentials.
 * Uses unsigned upload (no API secret needed — upload preset must be "unsigned" in Cloudinary).
 */
export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    // ── Resolve Cloudinary credentials ──────────────────────────────────────
    let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    let uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // If shopId provided, try to get shop-specific credentials from Firestore
    if (shopId) {
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const shopSnap = await getDoc(doc(db, 'shops', shopId));
        if (shopSnap.exists()) {
          const shopData = shopSnap.data();
          // Try multi-account array first (load-balanced accounts)
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
        // Firestore lookup failed — fall back to platform credentials silently
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
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type?.startsWith('image/') && !file.type?.startsWith('video/')) {
      return NextResponse.json({ error: 'Only image and video files are allowed' }, { status: 400 });
    }

    // ── Upload to Cloudinary via unsigned upload ───────────────────────────
    const folder = formData.get('folder') || 'homepage-builder';
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', uploadPreset);
    uploadFormData.append('folder', folder);

    const resourceType = file.type?.startsWith('video/') ? 'video' : 'image';
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[/api/upload] Cloudinary error:', errorText);
      return NextResponse.json(
        { error: 'Cloudinary upload failed. Check your cloud name and upload preset (must be unsigned).', details: errorText },
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
