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
  if (product.stock === 0) return toast.error('স্টক নেই');

  const CART_KEY = `cart_${shop.id}`;
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  const finalPrice = aiPrice !== null ? aiPrice : basePrice * qty;

  if (finalPrice <= 0 || isNaN(finalPrice)) return toast.error('মূল্য সঠিক নয়');

  let variantString = isLegacySizes ? (selectedSize?.label || '') : 
    Object.entries(selectedVariants || {}).map(([n, o]) => `${n}: ${o.label}`).join(', ');

  const item = {
    id: `${product.id}_${Date.now()}`,
    productId: product.id,
    name: product.name + (variantString ? ` (${variantString})` : ''),
    price: aiPrice !== null ? aiPrice / qty : basePrice,
    quantity: qty,
    imageUrl: product.imageUrl || '',
    note: customerNote,
    isCustomized: aiPrice !== null,
    customizedText: customInput,
    variantsText: variantString
  };

  cart.push(item);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  trackStoreEvent('add_to_cart', { id: product.id, name: product.name, price: item.price });
  
  toast.success('কার্টে যোগ হয়েছে! 🛒');
  setTimeout(() => router.back(), 300);
};
