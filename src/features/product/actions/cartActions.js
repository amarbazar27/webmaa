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
    if (!product || !product.id) return toast.error('প্রোডাক্ট তথ্য সঠিক নয়');
    if (Number(product.stock) === 0) return toast.error('স্টক নেই');

    const safeShopId = shop?.id || 'unknown';
    const CART_KEY = `cart_${safeShopId}`;
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    
    const safeQty = Number(qty) || 1;
    const safeBasePrice = Number(basePrice) || 0;
    const safeAiPrice = aiPrice !== null ? Number(aiPrice) : null;
    
    const finalPrice = safeAiPrice !== null ? safeAiPrice : safeBasePrice * safeQty;

    if (finalPrice <= 0 || isNaN(finalPrice)) return toast.error('মূল্য সঠিক নয়');

    let variantString = isLegacySizes ? (selectedSize?.label || '') : 
      Object.entries(selectedVariants || {}).filter(([n, o]) => n && o).map(([n, o]) => `${n}: ${o.label}`).join(', ');

    const item = {
      id: `${product.id}_${Date.now()}`,
      productId: product.id,
      name: product.name + (variantString ? ` (${variantString})` : ''),
      price: safeAiPrice !== null ? safeAiPrice / safeQty : safeBasePrice,
      clientPrice: safeAiPrice !== null ? safeAiPrice / safeQty : safeBasePrice,
      quantity: safeQty,
      imageUrl: product.imageUrl || '',
      note: customerNote || '',
      isCustomized: safeAiPrice !== null,
      customizedText: customInput || '',
      variantsText: variantString || ''
    };

    cart.push(item);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    trackStoreEvent('add_to_cart', { id: product.id, name: product.name, price: item.price });
    
    toast.success('কার্টে যোগ হয়েছে! 🛒');
    setTimeout(() => router?.back?.(), 300);
  } catch (err) {
    console.error('[AddToCart] Error:', err);
    toast.error('কার্টে যোগ করতে সমস্যা হয়েছে');
  }
};
