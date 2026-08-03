export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Superadmin endpoint: 1-Click Copy all store media from main site Cloudinary to retailer's dedicated Cloudinary account.
 * Replaces main site URLs in Firestore with retailer's Cloudinary URLs, while keeping original files intact on main site.
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

    // 🔒 Authorization: Only superadmin
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: superadmin only' }, { status: 403 });
    }

    const { shopId } = await request.json();
    if (!shopId || typeof shopId !== 'string') {
      return NextResponse.json({ error: 'Invalid request: shopId required' }, { status: 400 });
    }

    const shopRef = adminDb.collection('shops').doc(shopId);
    const shopSnap = await shopRef.get();
    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shopData = shopSnap.data();

    // Determine target dedicated Cloudinary credentials
    let targetCloudName = '';
    let targetUploadPreset = '';

    if (shopData.cloudinaryAccounts && Array.isArray(shopData.cloudinaryAccounts) && shopData.cloudinaryAccounts.length > 0) {
      const valid = shopData.cloudinaryAccounts.find(acc => acc && acc.cloudName && acc.uploadPreset);
      if (valid) {
        targetCloudName = valid.cloudName.trim();
        targetUploadPreset = valid.uploadPreset.trim();
      }
    }

    if (!targetCloudName && shopData.cloudinaryCloudName && shopData.cloudinaryUploadPreset) {
      targetCloudName = shopData.cloudinaryCloudName.trim();
      targetUploadPreset = shopData.cloudinaryUploadPreset.trim();
    }

    if (!targetCloudName || !targetUploadPreset) {
      return NextResponse.json({ 
        error: 'এই শপের কোনো ডেডিকেটেড Cloudinary অ্যাকাউন্ট (Cloud Name ও Upload Preset) সেটআপ করা নেই।' 
      }, { status: 400 });
    }

    const mainSiteCloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '').trim();

    // Cache of copied URLs: { [originalUrl]: newUrl }
    const urlMap = new Map();
    let copiedCount = 0;

    async function copyMediaUrl(originalUrl) {
      if (!originalUrl || typeof originalUrl !== 'string') return originalUrl;
      // Skip if already points to retailer's target Cloudinary account
      if (originalUrl.includes(`res.cloudinary.com/${targetCloudName}/`)) {
        return originalUrl;
      }
      // If cached from earlier in this run
      if (urlMap.has(originalUrl)) {
        return urlMap.get(originalUrl);
      }

      try {
        const formData = new URLSearchParams();
        formData.append('file', originalUrl);
        formData.append('upload_preset', targetUploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${targetCloudName}/image/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });

        const data = await res.json();
        if (data.secure_url) {
          urlMap.set(originalUrl, data.secure_url);
          copiedCount++;
          console.log(`[Cloudinary Copy] Success: ${originalUrl} -> ${data.secure_url}`);
          return data.secure_url;
        } else {
          console.warn(`[Cloudinary Copy Warning] Upload failed for ${originalUrl}:`, data?.error?.message);
          return originalUrl;
        }
      } catch (err) {
        console.error(`[Cloudinary Copy Error] Failed to copy ${originalUrl}:`, err);
        return originalUrl;
      }
    }

    // 1. Process Shop Document
    const updatedShopFields = {};
    if (shopData.logoUrl) {
      const newLogo = await copyMediaUrl(shopData.logoUrl);
      if (newLogo !== shopData.logoUrl) updatedShopFields.logoUrl = newLogo;
    }
    if (shopData.bannerUrl) {
      const newBanner = await copyMediaUrl(shopData.bannerUrl);
      if (newBanner !== shopData.bannerUrl) updatedShopFields.bannerUrl = newBanner;
    }
    if (shopData.metaImage) {
      const newMeta = await copyMediaUrl(shopData.metaImage);
      if (newMeta !== shopData.metaImage) updatedShopFields.metaImage = newMeta;
    }

    if (Array.isArray(shopData.banners) && shopData.banners.length > 0) {
      const newBanners = [];
      let bannersChanged = false;
      for (const item of shopData.banners) {
        if (typeof item === 'string') {
          const newUrl = await copyMediaUrl(item);
          if (newUrl !== item) bannersChanged = true;
          newBanners.push(newUrl);
        } else if (item && typeof item === 'object') {
          const newUrl = await copyMediaUrl(item.url);
          if (newUrl !== item.url) bannersChanged = true;
          newBanners.push({ ...item, url: newUrl });
        } else {
          newBanners.push(item);
        }
      }
      if (bannersChanged) updatedShopFields.banners = newBanners;
    }

    if (Array.isArray(shopData.sliderImages) && shopData.sliderImages.length > 0) {
      const newSliders = [];
      let slidersChanged = false;
      for (const imgUrl of shopData.sliderImages) {
        const newUrl = await copyMediaUrl(imgUrl);
        if (newUrl !== imgUrl) slidersChanged = true;
        newSliders.push(newUrl);
      }
      if (slidersChanged) updatedShopFields.sliderImages = newSliders;
    }

    if (Object.keys(updatedShopFields).length > 0) {
      updatedShopFields.cloudinaryMigratedAt = new Date();
      await shopRef.update(updatedShopFields);
    }

    // 2. Process Products Collection
    const productsSnap = await shopRef.collection('products').get();
    for (const prodDoc of productsSnap.docs) {
      const prodData = prodDoc.data();
      const updatedProdFields = {};

      if (prodData.imageUrl) {
        const newImg = await copyMediaUrl(prodData.imageUrl);
        if (newImg !== prodData.imageUrl) updatedProdFields.imageUrl = newImg;
      }

      if (Array.isArray(prodData.images) && prodData.images.length > 0) {
        const newImages = [];
        let imagesChanged = false;
        for (const imgUrl of prodData.images) {
          const newUrl = await copyMediaUrl(imgUrl);
          if (newUrl !== imgUrl) imagesChanged = true;
          newImages.push(newUrl);
        }
        if (imagesChanged) updatedProdFields.images = newImages;
      }

      if (Object.keys(updatedProdFields).length > 0) {
        await prodDoc.ref.update(updatedProdFields);
      }
    }

    // 3. Process Categories Collection
    const categoriesSnap = await shopRef.collection('categories').get();
    for (const catDoc of categoriesSnap.docs) {
      const catData = catDoc.data();
      const updatedCatFields = {};

      if (catData.imageUrl) {
        const newImg = await copyMediaUrl(catData.imageUrl);
        if (newImg !== catData.imageUrl) updatedCatFields.imageUrl = newImg;
      }
      if (catData.iconUrl) {
        const newIcon = await copyMediaUrl(catData.iconUrl);
        if (newIcon !== catData.iconUrl) updatedCatFields.iconUrl = newIcon;
      }

      if (Object.keys(updatedCatFields).length > 0) {
        await catDoc.ref.update(updatedCatFields);
      }
    }

    return NextResponse.json({
      success: true,
      copiedCount,
      targetCloudName,
      message: `${copiedCount} টি ছবি সফলভাবে মেইন সাইট থেকে মার্চেন্টের Cloudinary একাউন্টে (${targetCloudName}) কপি করা হয়েছে!`
    });

  } catch (error) {
    console.error('[Cloudinary Copy Media API Error]', error);
    return NextResponse.json({ error: error.message || 'Media copy operation failed' }, { status: 500 });
  }
}
