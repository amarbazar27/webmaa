import { getShopServer, getProductsServer, getCategoriesServer } from '@/lib/server-fetch';
import ShopClient from './ShopClient';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import TemplateRenderer from '@/templates/TemplateRenderer';

export const revalidate = 60; // Cache the page for 60 seconds (ISR)

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daripallah.com';

export async function generateMetadata({ params }) {
  try {
    const { shopSlug } = await params;
    const shop = await getShopServer(shopSlug);
    if (!shop) return { title: 'Daripallah Store' };

    const rawLogo = shop?.logoUrl || '/logo.png';
    const logoUrl = rawLogo.startsWith('http') ? rawLogo : `${BASE_URL}${rawLogo}`;
    const canonicalUrl = shop?.customDomain
      ? `https://${shop.customDomain}`
      : `${BASE_URL}/shop/${shopSlug}`;

    const shopName = shop?.shopName || 'Daripallah Store';
    const slogan = shop?.slogan || '';

    // Rich title: "ShopName | ShopName Bengali – slogan"
    const metaTitle = slogan
      ? `${shopName} – ${slogan}`
      : shopName;

    // Rich description combining shop info, welcome message and product context
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
      shopSlug,
    ].filter(Boolean).join(', ');

    return {
      title: { absolute: metaTitle },
      description: metaDesc,
      keywords,
      manifest: `/api/manifest?shop=${shopSlug}`,
      alternates: { canonical: canonicalUrl },
      icons: { icon: rawLogo, shortcut: rawLogo, apple: rawLogo },
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
    console.error('[ShopPage] Metadata Error:', err);
    return { title: 'Daripallah Store' };
  }
}

function ShopPausedPage({ shopName }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b, #312e81, #1e1b4b)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#fff', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🏪</div>
      <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: '900', marginBottom: '1rem', color: '#a5b4fc' }}>{shopName}</h1>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '50px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', marginBottom: '1.5rem' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>সাময়িকভাবে বন্ধ</span>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '380px', lineHeight: 1.8, fontSize: '1rem' }}>এই দোকানটি সাময়িকভাবে বন্ধ রাখা হয়েছে।<br />শীঘ্রই আবার চালু হবে। ধন্যবাদ আপনার ধৈর্যের জন্য। 🙏</p>
    </div>
  );
}

export default async function ShopPage({ params }) {
  const { shopSlug } = await params;
  console.log(`[ShopPage] Server Render Request: ${shopSlug}`);

  try {
    const shop = await getShopServer(shopSlug);
    if (!shop) {
      console.warn(`[ShopPage] Shop not found for slug: ${shopSlug}`);
      notFound();
    }

    if (shop.isActive === false) {
      return <ShopPausedPage shopName={shop.shopName} />;
    }

    const [products, categories] = await Promise.all([
      getProductsServer(shop.id),
      getCategoriesServer(shop.id),
    ]);

    console.log(`[ShopPage] Data fetched: products=${products.length} categories=${categories.length}`);

    // 🚨 FAIL-SAFE SERIALIZATION: Guarantee plain objects for Next.js SSR
    const safeShop = JSON.parse(JSON.stringify(shop));
    const safeProducts = JSON.parse(JSON.stringify(products));
    const safeCategories = JSON.parse(JSON.stringify(categories));

    // Build Organization schema (supports multi-language brand names)
    const canonicalUrl = shop?.customDomain
      ? `https://${shop.customDomain}`
      : `${BASE_URL}/shop/${shopSlug}`;

    const alternateNames = [
      ...(shop?.altNames || []),           // retailer-defined alt names
      shop?.shopName,
      shop?.slogan,
    ].filter(Boolean);

    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: shop.shopName,
      ...(alternateNames.length > 1 ? { alternateName: alternateNames } : {}),
      url: canonicalUrl,
      ...(shop.logoUrl ? { logo: shop.logoUrl } : {}),
      description: shop?.seoDescription || shop?.slogan || `${shop.shopName} — অনলাইনে অর্ডার করুন`,
      ...(shop?.socialLinks?.wa ? { telephone: shop.socialLinks.wa } : {}),
      ...(shop?.serviceAreas?.length ? {
        areaServed: shop.serviceAreas.map(a => ({ '@type': 'City', name: a }))
      } : {}),
    };

    return (
      <>
        <Script
          id={`org-schema-${shopSlug}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <TemplateRenderer
          shop={safeShop}
          products={safeProducts}
          categories={safeCategories}
          ShopClientComponent={ShopClient}
        />
      </>
    );
  } catch (err) {
    console.error(`[ShopPage] FATAL RENDER ERROR for ${shopSlug}:`, err);
    // Rethrow to let the top-level error.js handle it, but now we have logs
    throw err;
  }
}
