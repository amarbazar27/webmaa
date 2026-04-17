import { getShopByDomain, getProducts, getCategories } from '@/lib/firestore';
import ShopClient from '@/app/shop/[shopSlug]/ShopClient';
import { notFound } from 'next/navigation';

// Helper: recursively convert Firestore Timestamps to plain ISO strings
function serializeData(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
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
  const { customDomain } = await params;
  const decodedDomain = decodeURIComponent(customDomain);
  const shop = await getShopByDomain(decodedDomain);

  return {
    title: shop?.shopName || 'Retailer Store',
    description: shop?.slogan || 'Welcome to our premium store',
    manifest: shop?.subdomainSlug ? `/api/manifest?shop=${shop.subdomainSlug}` : null
  };
}

export default async function CustomDomainShopPage({ params }) {
  const { customDomain } = await params;
  const decodedDomain = decodeURIComponent(customDomain);
  
  const shop = await getShopByDomain(decodedDomain);

  if (!shop) {
    return notFound();
  }

  const [products, categories] = await Promise.all([
    getProducts(shop.id),
    getCategories(shop.id),
  ]);

  return (
    <ShopClient 
      initialShop={serializeData(shop)} 
      initialProducts={serializeData(products)} 
      initialCategories={serializeData(categories)} 
      isCustomDomain={true}
    />
  );
}
