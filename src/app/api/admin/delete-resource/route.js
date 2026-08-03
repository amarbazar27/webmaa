export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

/**
 * Helper to delete main site Cloudinary images associated with a deleted shop.
 */
async function cleanupMainSiteCloudinaryImages(urls, mainCloudName) {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!mainCloudName || !urls || urls.length === 0) return 0;

  const publicIds = [];
  for (const url of urls) {
    if (typeof url !== 'string') continue;
    if (!url.includes(`res.cloudinary.com/${mainCloudName}/`)) continue;

    const parts = url.split('/image/upload/');
    if (parts.length >= 2) {
      let pathAfterUpload = parts[1].replace(/^v\d+\//, '');
      const lastDotIndex = pathAfterUpload.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
      }
      if (pathAfterUpload && !publicIds.includes(pathAfterUpload)) {
        publicIds.push(pathAfterUpload);
      }
    }
  }

  if (publicIds.length === 0) return 0;
  let deletedCount = 0;

  for (const publicId of publicIds) {
    try {
      if (apiKey && apiSecret) {
        const timestamp = Math.floor(Date.now() / 1000);
        const strToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

        const formData = new URLSearchParams();
        formData.append('public_id', publicId);
        formData.append('timestamp', timestamp.toString());
        formData.append('api_key', apiKey);
        formData.append('signature', signature);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${mainCloudName}/image/destroy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });
        const data = await res.json();
        if (data.result === 'ok') {
          deletedCount++;
          console.log(`[Cloudinary Cleanup] Successfully deleted main site image: ${publicId}`);
        } else {
          console.warn(`[Cloudinary Cleanup] Response for ${publicId}:`, data);
        }
      } else {
        console.warn(`[Cloudinary Cleanup] Missing CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET in env for public_id: ${publicId}`);
      }
    } catch (err) {
      console.error(`[Cloudinary Cleanup Error] Failed to delete ${publicId}:`, err);
    }
  }
  return deletedCount;
}

/**
 * HIGH-10: Server-side authenticated delete endpoint for superadmin operations.
 * Replaces direct client-side Firestore deleteDoc calls.
 * 
 * Supports:
 *   - type: 'shop' → deletes shops/{id} (and cleans up main site Cloudinary images)
 *   - type: 'retailer_request' → deletes retailer_requests/{id}
 */
export async function POST(request) {
  try {
    // 🔒 Authentication: Require valid Firebase token
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 🔒 Authorization: Only superadmin can delete
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: superadmin only' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id } = body;

    if (!type || !id || typeof id !== 'string' || id.length < 1) {
      return NextResponse.json({ error: 'Invalid request: type and id required' }, { status: 400 });
    }

    // Whitelist of allowed delete targets
    const allowedTypes = {
      'shop': 'shops',
      'retailer_request': 'retailer_requests',
    };

    const collection = allowedTypes[type];
    if (!collection) {
      return NextResponse.json({ error: `Invalid resource type: ${type}` }, { status: 400 });
    }

    // Verify the document exists before deleting
    const docRef = adminDb.collection(collection).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // If deleting a shop, collect all main site Cloudinary image URLs and clean them up
    let cleanedCloudinaryCount = 0;
    if (type === 'shop') {
      const mainCloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '').trim();
      const shopData = docSnap.data() || {};
      const urlsToClean = [];

      if (shopData.logoUrl) urlsToClean.push(shopData.logoUrl);
      if (shopData.bannerUrl) urlsToClean.push(shopData.bannerUrl);
      if (shopData.metaImage) urlsToClean.push(shopData.metaImage);
      if (Array.isArray(shopData.banners)) {
        shopData.banners.forEach(b => {
          if (typeof b === 'string') urlsToClean.push(b);
          else if (b?.url) urlsToClean.push(b.url);
        });
      }
      if (Array.isArray(shopData.sliderImages)) {
        shopData.sliderImages.forEach(img => {
          if (typeof img === 'string') urlsToClean.push(img);
        });
      }

      // Collect product images
      const productsSnap = await docRef.collection('products').get();
      productsSnap.forEach(pDoc => {
        const pData = pDoc.data();
        if (pData.imageUrl) urlsToClean.push(pData.imageUrl);
        if (Array.isArray(pData.images)) {
          pData.images.forEach(img => {
            if (typeof img === 'string') urlsToClean.push(img);
          });
        }
      });

      // Collect category images
      const categoriesSnap = await docRef.collection('categories').get();
      categoriesSnap.forEach(cDoc => {
        const cData = cDoc.data();
        if (cData.imageUrl) urlsToClean.push(cData.imageUrl);
        if (cData.iconUrl) urlsToClean.push(cData.iconUrl);
      });

      if (urlsToClean.length > 0 && mainCloudName) {
        cleanedCloudinaryCount = await cleanupMainSiteCloudinaryImages(urlsToClean, mainCloudName);
      }
    }

    // Perform the delete using Admin SDK
    await docRef.delete();

    // Audit log
    console.log(`[Admin Delete] superadmin=${decoded.email} deleted ${collection}/${id} (cleaned ${cleanedCloudinaryCount} Cloudinary images)`);

    return NextResponse.json({ 
      success: true, 
      deleted: `${collection}/${id}`, 
      cleanedCloudinaryCount 
    });
  } catch (error) {
    console.error('[Admin Delete Error]', error);
    return NextResponse.json({ error: 'Delete operation failed' }, { status: 500 });
  }
}
