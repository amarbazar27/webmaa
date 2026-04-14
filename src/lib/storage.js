// Complete switch to Cloudinary for 100% Free Image Hosting (No Credit Card Required)

/**
 * Generic image upload to Cloudinary directly from Client side
 * @param {File} file 
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadImage = async (file) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dcsecgwzc';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';
  
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
      return data.secure_url;
    } else {
      console.error('Cloudinary upload err object:', data);
      throw new Error(data?.error?.message || 'Failed to upload image to Cloudinary');
    }
  } catch (error) {
    console.error('Cloudinary upload exception:', error);
    throw new Error('Image upload failed. Check internet or try without image.');
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
