// Complete switch to Cloudinary for 100% Free Image Hosting (No Credit Card Required)

/**
 * Generic image upload to Cloudinary directly from Client side
 * @param {File} file 
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadImage = async (file) => {
  const url = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'webmaa_preset');

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (data.secure_url) {
    return data.secure_url;
  } else {
    throw new Error('Failed to upload image to Cloudinary');
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
