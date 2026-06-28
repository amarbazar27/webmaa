import toast from 'react-hot-toast';
import { trackStoreEvent } from '@/components/shop/StoreAnalytics';

export const addToCart = ({
  shop,
  product,
  qty,
  basePrice,
  aiPrice,
  selectedSize,
  selectedVariants,
  isLegacySizes,
  customerNote,
  customInput,
  router
}) => {
  try {
    if (!product || !product.id) return toast.error('প্রোডাক্ট তথ্য সঠিক নয়');
    
    const isStockOut = Number(product.stock) === 0;
    if (isStockOut && !product.allowRequest) return toast.error('স্টক নেই');

    const safeShopId = shop?.id || 'unknown';
    const CART_KEY = `cart_${safeShopId}`;
    
    // Safe localStorage read with try/catch to handle Private/Incognito mode SecurityError
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch (storageErr) {
      console.warn('[AddToCart] localStorage read failed (Private mode?):', storageErr.message);
      cart = [];
    }
    
    const safeQty = Number(qty) || 1;
    const safeBasePrice = Number(basePrice) || 0;
    const safeAiPrice = aiPrice !== null ? Number(aiPrice) : null;
    
    const finalPrice = safeAiPrice !== null ? safeAiPrice : safeBasePrice * safeQty;

    if (finalPrice <= 0 || isNaN(finalPrice)) return toast.error('মূল্য সঠিক নয়');

    let variantString = isLegacySizes ? (selectedSize?.label || '') : 
      Object.entries(selectedVariants || {}).filter(([n, o]) => n && o).map(([n, o]) => `${n}: ${o.label}`).join(', ');

    let finalCustomizedText = customInput || '';
    if (isStockOut && product.allowRequest) {
      finalCustomizedText = finalCustomizedText ? `${finalCustomizedText} [অনুরোধকৃত]` : '[অনুরোধকৃত]';
    }

    const item = {
      id: `${product.id}_${Date.now()}`,
      productId: product.id,
      name: product.name + (variantString ? ` (${variantString})` : ''),
      price: safeAiPrice !== null ? safeAiPrice / safeQty : safeBasePrice,
      clientPrice: safeAiPrice !== null ? safeAiPrice / safeQty : safeBasePrice,
      quantity: safeQty,
      imageUrl: product.images?.[0] || product.imageUrl || '',
      note: customerNote || '',
      isCustomized: safeAiPrice !== null || !!customerNote || !!customInput || (isStockOut && product.allowRequest),
      customizedText: finalCustomizedText,
      variantsText: variantString || ''
    };

    // Check existing cart item (same product + same customizedText)
    const existingIndex = cart.findIndex(c =>
      c.productId === product.id &&
      (c.customizedText || '') === (item.customizedText || '')
    );
    if (existingIndex > -1) {
      cart[existingIndex].quantity += safeQty;
    } else {
      cart.push(item);
    }
    
    // Safe localStorage write with try/catch
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (storageErr) {
      console.warn('[AddToCart] localStorage write failed (Private mode?):', storageErr.message);
      // Still proceed - show success toast even if storage fails
    }
    
    try {
      trackStoreEvent('add_to_cart', { id: product.id, name: product.name, price: item.price });
    } catch (analyticsErr) {
      // Non-critical - ignore analytics errors
    }
    
    toast.success('কার্টে যোগ হয়েছে! 🛒');
    setTimeout(() => router?.back?.(), 300);
  } catch (err) {
    console.error('[AddToCart] Error:', err);
    toast.error('কার্টে যোগ করতে সমস্যা হয়েছে');
  }
};
