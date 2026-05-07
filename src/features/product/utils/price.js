/**
 * Calculate the base price of a product based on selected variants or legacy sizes.
 */
export function calculateBasePrice(product, isLegacySizes, selectedSize, selectedVariants) {
  let price = parseFloat(product.price) || 0;
  
  if (isLegacySizes && selectedSize) {
    price = parseFloat(selectedSize.price) || 0;
  } else if (!isLegacySizes && Array.isArray(product.variants) && product.variants.length > 0) {
    let hasVariantPrice = false;
    let maxVariantPrice = 0;
    
    Object.values(selectedVariants || {}).forEach(opt => {
      let p = parseFloat(opt.price);
      if (p > 0) {
        hasVariantPrice = true;
        if (p > maxVariantPrice) maxVariantPrice = p;
      }
    });
    
    if (hasVariantPrice) {
      price = maxVariantPrice;
    }
  }
  
  return price;
}

/**
 * Format BDT price
 */
export const formatPrice = (amount) => `৳${parseFloat(amount || 0).toFixed(0)}`;
