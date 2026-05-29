import { getProductsServer, getCategoriesServer } from '@/lib/server-fetch';
import { getShopByDomain } from '@/lib/firestore-server';
import ShopClient from '@/app/shop/[shopSlug]/ShopClient';
import { notFound } from 'next/navigation';
import TemplateRenderer from '@/templates/TemplateRenderer';

export const revalidate = 60; // Cache the page for 60 seconds (ISR)

export async function generateMetadata({ params }) {
  try {
    const { customDomain } = await params;
    const decodedDomain = decodeURIComponent(customDomain);
    const shop = await getShopByDomain(decodedDomain);

    if (!shop) return { title: 'Webmaa Store' };

    const shopName = shop?.shopName || 'Webmaa Store';
    return {
      title: { absolute: shopName },
      description: shop?.slogan || 'Welcome to our premium store',
      manifest: shop?.subdomainSlug ? `/api/manifest?shop=${shop.subdomainSlug}` : null
    };
  } catch (err) {
    return { title: 'Webmaa Store' };
  }
}

export default async function CustomDomainShopPage({ params }) {
  const { customDomain } = await params;
  const decodedDomain = decodeURIComponent(customDomain);
  
  const shop = await getShopByDomain(decodedDomain);

  if (!shop) {
    return notFound();
  }

  const [products, categories] = await Promise.all([
    getProductsServer(shop.id),
    getCategoriesServer(shop.id),
  ]);

  // 🚨 FAIL-SAFE SERIALIZATION: Guarantee plain objects for Next.js SSR
  const safeShop = JSON.parse(JSON.stringify(shop));
  const safeProducts = JSON.parse(JSON.stringify(products));
  const safeCategories = JSON.parse(JSON.stringify(categories));

  return (
    <TemplateRenderer
      shop={safeShop}
      products={safeProducts}
      categories={safeCategories}
      ShopClientComponent={ShopClient}
      isCustomDomain={true}
    />
  );
}
