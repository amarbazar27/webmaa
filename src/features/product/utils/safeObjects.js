export const SAFE_PRODUCT = {
  id: '',
  name: 'Unknown Product',
  price: 0,
  stock: 0,
  description: '',
  imageUrl: '',
  images: [],
  variants: [],
  sizes: [],
  allowCustomize: false,
  allowNote: false,
  category: '',
  shopSlug: ''
};

export const SAFE_SHOP = {
  id: '',
  shopName: 'Unknown Shop',
  deliveryConfig: {},
  aiConfig: {}
};

export const sanitizeProductData = (rawProduct, rawShop) => {
  const product = typeof rawProduct === 'object' && rawProduct !== null ? rawProduct : {};
  const shop = typeof rawShop === 'object' && rawShop !== null ? rawShop : {};

  const sanitizedProduct = { ...SAFE_PRODUCT, ...product };
  sanitizedProduct.id = String(sanitizedProduct.id || '');
  sanitizedProduct.name = String(sanitizedProduct.name || 'Unknown Product');
  sanitizedProduct.imageUrl = String(sanitizedProduct.imageUrl || '');
  sanitizedProduct.category = String(sanitizedProduct.category || '');
  sanitizedProduct.shopSlug = String(product.shopSlug || shop.subdomainSlug || shop.shopSlug || '');
  sanitizedProduct.images = Array.isArray(sanitizedProduct.images) ? sanitizedProduct.images : [];
  sanitizedProduct.variants = Array.isArray(sanitizedProduct.variants) ? sanitizedProduct.variants.filter(v => v && typeof v === 'object' && v.name && Array.isArray(v.options)) : [];
  sanitizedProduct.sizes = Array.isArray(sanitizedProduct.sizes) ? sanitizedProduct.sizes : [];
  sanitizedProduct.price = Number(sanitizedProduct.price) || 0;
  sanitizedProduct.stock = Number(sanitizedProduct.stock) || 0;

  const sanitizedShop = { ...SAFE_SHOP, ...shop };
  sanitizedShop.id = String(sanitizedShop.id || '');
  sanitizedShop.shopName = String(sanitizedShop.shopName || 'Unknown Shop');
  sanitizedShop.deliveryConfig = sanitizedShop.deliveryConfig && typeof sanitizedShop.deliveryConfig === 'object' ? sanitizedShop.deliveryConfig : {};
  sanitizedShop.aiConfig = sanitizedShop.aiConfig && typeof sanitizedShop.aiConfig === 'object' ? sanitizedShop.aiConfig : {};

  return { product: sanitizedProduct, shop: sanitizedShop };
};
