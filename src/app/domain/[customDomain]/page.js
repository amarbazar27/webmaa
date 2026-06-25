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

    if (!shop) return { title: 'Daripallah Store' };

    const rawLogo = shop?.logoUrl || '/logo.png';
    const logoUrl = rawLogo.startsWith('http') ? rawLogo : `https://${decodedDomain}${rawLogo}`;
    const canonicalUrl = `https://${decodedDomain}`;

    const shopName = shop?.shopName || 'Daripallah Store';
    const slogan = shop?.slogan || '';

    const metaTitle = slogan ? `${shopName} – ${slogan}` : shopName;
    const metaDesc = shop?.seoDescription ||
      (slogan
        ? `${shopName}: ${slogan}. ${shop?.welcomeMessage || ''} অনলাইনে অর্ডার করুন।`
        : `${shopName} — অনলাইনে সহজে অর্ডার করুন। ${shop?.welcomeMessage || 'দ্রুত ডেলিভারি, সেরা পণ্য।'}`);

    const keywords = [
      shopName,
      slogan,
      shop?.welcomeMessage,
      'অনলাইন বাজার',
      'অনলাইন শপিং',
      'ডেলিভারি',
      shop.subdomainSlug,
    ].filter(Boolean).join(', ');

    const faviconUrl = `/favicon.ico?v=${shop?.updatedAt || '1'}`;

    return {
      title: { absolute: metaTitle },
      description: metaDesc,
      keywords,
      manifest: shop?.subdomainSlug ? `/api/manifest?shop=${shop.subdomainSlug}` : null,
      alternates: { canonical: canonicalUrl },
      icons: {
        icon: faviconUrl,
        shortcut: faviconUrl,
        apple: rawLogo,
      },
      robots: { index: true, follow: true },
      openGraph: {
        title: metaTitle,
        description: metaDesc,
        url: canonicalUrl,
        images: [{ url: logoUrl, width: 512, height: 512, alt: shopName }],
        type: 'website',
        siteName: shopName,
        locale: 'bn_BD',
      },
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDesc,
        images: [logoUrl],
      }
    };
  } catch (err) {
    return { title: 'Daripallah Store' };
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
