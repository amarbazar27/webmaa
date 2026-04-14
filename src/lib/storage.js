// Complete switch to Cloudinary for 100% Free Image Hosting (No Credit Card Required)

/**
 * Generic image upload to Cloudinary directly from Client side
 * @param {File} file 
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadImage = async (file) => {
  if (file.size > 1024 * 1024) throw new Error('ফাইল সাইজ ১ মেগাবাইটের বেশি! অনুগ্রহ করে ছোট ছবি ব্যবহার করুন।');
  
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dcsecgwzc';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';
  
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
      throw new Error(data?.error?.message || 'Failed to upload image. (Tip: Ensure you have an "Unsigned" preset named "unsigned_preset" in Cloudinary settings)');
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
  return uploadImage(file);
};

/**
 * Shop logo upload helper
 */
export const uploadShopLogo = async (shopId, file) => {
  return uploadImage(file);
};
