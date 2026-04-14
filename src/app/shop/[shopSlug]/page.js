import { getShopBySlug, getProducts, getCategories } from '@/lib/firestore';
import ShopClient from './ShopClient';
import { notFound } from 'next/navigation';

// Helper: recursively convert Firestore Timestamps to plain ISO strings
function serializeData(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  // Firestore Timestamp detection (has seconds + nanoseconds)
  if (typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number') {
    return new Date(obj.seconds * 1000).toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeData);
  }
  
  const plain = {};
  for (const key of Object.keys(obj)) {
    plain[key] = serializeData(obj[key]);
  }
  return plain;
}

export async function generateMetadata({ params }) {
  const { shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);

  return {
    title: shop?.shopName || 'Webmaa Store',
    description: shop?.slogan || 'Welcome to our store',
    manifest: `/api/manifest?shop=${shopSlug}`
  };
}

export default async function ShopPage({ params }) {
  const { shopSlug } = await params;
  
  let shop = await getShopBySlug(shopSlug);
  
  // Graceful handling for the 'demo' slug if it doesn't exist in DB
  if (!shop && shopSlug === 'demo') {
    shop = {
      id: 'demo-id',
      shopName: 'Webmaa Demo Store',
      shopSlug: 'demo',
      description: 'This is a demo store showcasing Webmaa premium features.',
      coverImg: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200',
      isActive: true,
    };
  }

  if (!shop) {
    return notFound();
  }

  // Fetch initial data
  const [products, categories] = await Promise.all([
    getProducts(shop.id),
    getCategories(shop.id),
  ]);

  // Serialize everything to plain objects (strip Firestore Timestamps)
  return (
    <ShopClient 
      initialShop={serializeData(shop)} 
      initialProducts={serializeData(products)} 
      initialCategories={serializeData(categories)} 
    />
  );
}
