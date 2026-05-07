import { getShopServer, getProductsServer, getCategoriesServer } from '@/lib/server-fetch';
import ShopClient from './ShopClient';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Cache the page for 60 seconds (ISR)

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://webmaa.vercel.app';

export async function generateMetadata({ params }) {
  const { shopSlug } = await params;
  const shop = await getShopServer(shopSlug);
  if (!shop) return { title: 'Webmaa Store' };

  const rawLogo = shop?.logoUrl || '/logo.png';
  const logoUrl = rawLogo.startsWith('http') ? rawLogo : `${BASE_URL}${rawLogo}`;
  const canonicalUrl = `${BASE_URL}/shop/${shopSlug}`;

  return {
    title: shop?.shopName || 'Webmaa Store',
    description: shop?.slogan || 'Welcome to our store',
    manifest: `/api/manifest?shop=${shopSlug}`,
    alternates: { canonical: canonicalUrl },
    icons: { icon: rawLogo, shortcut: rawLogo, apple: rawLogo },
    openGraph: {
      title: shop?.shopName || 'Webmaa Store',
      description: shop?.slogan || 'Welcome to our store',
      url: canonicalUrl,
      images: [{ url: logoUrl, width: 512, height: 512, alt: shop?.shopName || 'Logo' }],
      type: 'website',
      siteName: 'Webmaa',
    },
    twitter: {
      card: 'summary_large_image',
      title: shop?.shopName || 'Webmaa Store',
      description: shop?.slogan || 'Welcome to our store',
      images: [logoUrl],
    }
  };
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
  console.log(`[ShopPage] Server Render: ${shopSlug}`);

  const shop = await getShopServer(shopSlug);
  if (!shop) notFound();

  if (shop.isActive === false) {
    return <ShopPausedPage shopName={shop.shopName} />;
  }

  const [products, categories] = await Promise.all([
    getProductsServer(shop.id),
    getCategoriesServer(shop.id),
  ]);

  return (
    <ShopClient
      initialShop={shop}
      initialProducts={products}
      initialCategories={categories}
    />
  );
}
