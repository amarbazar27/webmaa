// Complete switch to Cloudinary for 100% Free Image Hosting (No Credit Card Required)

/**
 * Generic image upload to Cloudinary directly from Client side
 * @param {File} file 
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadImage = async (file, shopId = null) => {
  if (!file) throw new Error('কোনো ফাইল নির্বাচন করা হয়নি।');
  if (!file.type.startsWith('image/')) {
    throw new Error('অবৈধ ফাইল টাইপ! শুধুমাত্র ছবি (Image) আপলোড করা যাবে।');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('ফাইল সাইজ ৫ মেগাবাইটের বেশি! অনুগ্রহ করে ছোট ছবি ব্যবহার করুন।');
  }
  
  let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dcsecgwzc';
  let uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';
  
  if (shopId) {
    try {
      const { db } = await import('./firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const shopSnap = await getDoc(doc(db, 'shops', shopId));
      if (shopSnap.exists()) {
        const shopData = shopSnap.data();
        if (shopData.cloudinaryCloudName && shopData.cloudinaryUploadPreset) {
            cloudName = shopData.cloudinaryCloudName.trim();
            uploadPreset = shopData.cloudinaryUploadPreset.trim();
            console.log(`[Cloudinary] Using shop-specific config for ${shopId}: ${cloudName}/${uploadPreset}`);
          }
      }
    } catch (err) {
      console.warn(`[Cloudinary] Failed to load shop config for ${shopId}, using platform default.`, err.message);
    }
  }
  
  console.log(`[Cloudinary Config Debug] Cloud Name: ${cloudName}, Preset: ${uploadPreset}`);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.secure_url) {
      console.log('✅ Cloudinary Upload Success:', data.secure_url);
      return data.secure_url;
    } else {
      console.error('❌ Cloudinary Error Response:', data);
      throw new Error(data?.error?.message || 'Failed to upload image. (Tip: Ensure you have an "Unsigned" preset in your Cloudinary settings)');
    }
  } catch (error) {
    console.error('❌ Cloudinary Upload Exception:', error);
    throw new Error(error.message || 'Image upload failed. Verify internet or Cloudinary settings.');
  }
};

/**
 * Product image upload helper (Same implementation as we don't need specific paths in Cloudinary unstructured approach)
 */
export const uploadProductImage = async (shopId, file) => {
  if (file && file.size > 3 * 1024 * 1024) {
    throw new Error('পণ্যের ইমেজের সাইজ ৩ মেগাবাইটের বেশি হওয়া যাবে না।');
  }
  return uploadImage(file, shopId);
};

/**
 * Shop logo upload helper
 */
export const uploadShopLogo = async (shopId, file) => {
  return uploadImage(file, shopId);
};
