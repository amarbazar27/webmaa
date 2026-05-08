/**
 * Calculate the base price of a product based on selected variants or legacy sizes.
 */
export function calculateBasePrice(product, isLegacySizes, selectedSize, selectedVariants) {
  try {
    const safeProduct = product || {};
    let price = Number(safeProduct.price) || 0;
    
    if (isLegacySizes && selectedSize) {
      price = Number(selectedSize?.price) || 0;
    } else if (!isLegacySizes && Array.isArray(safeProduct.variants) && safeProduct.variants.length > 0) {
      let hasVariantPrice = false;
      let maxVariantPrice = 0;
      
      Object.values(selectedVariants || {}).forEach(opt => {
        if (!opt) return;
        const p = Number(opt.price) || 0;
        if (p > 0) {
          hasVariantPrice = true;
          if (p > maxVariantPrice) maxVariantPrice = p;
        }
      });
      
      if (hasVariantPrice) {
        price = maxVariantPrice;
      }
    }
    
    return Number.isNaN(price) ? 0 : price;
  } catch (error) {
    console.error('[PriceCalculation] Error calculating price', error);
    return 0;
  }
}

/**
 * Format BDT price
 */
export const formatPrice = (amount) => `৳${parseFloat(amount || 0).toFixed(0)}`;
