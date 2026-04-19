import { getShopBySlug, getProducts, getCategories } from '@/lib/firestore';
import ShopClient from './ShopClient';
import { notFound } from 'next/navigation';

// Helper: recursively convert Firestore Timestamps to plain ISO strings
function serializeData(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number') {
    return new Date(obj.seconds * 1000).toISOString();
  }
  if (Array.isArray(obj)) return obj.map(serializeData);
  const plain = {};
  for (const key of Object.keys(obj)) plain[key] = serializeData(obj[key]);
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

// ── Paused Store Page (Server Component — no client JS needed) ────────────
function ShopPausedPage({ shopName }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b, #312e81, #1e1b4b)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#fff', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🏪</div>
      <h1 style={{
        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: '900',
        marginBottom: '1rem', color: '#a5b4fc',
      }}>{shopName}</h1>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 1.25rem', borderRadius: '50px',
        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
        marginBottom: '1.5rem',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          সাময়িকভাবে বন্ধ
        </span>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '380px', lineHeight: 1.8, fontSize: '1rem' }}>
        এই দোকানটি সাময়িকভাবে বন্ধ রাখা হয়েছে।<br />
        শীঘ্রই আবার চালু হবে। ধন্যবাদ আপনার ধৈর্যের জন্য। 🙏
      </p>
    </div>
  );
}

export default async function ShopPage({ params }) {
  const { shopSlug } = await params;

  let shop = await getShopBySlug(shopSlug);

  // Demo store fallback
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

  if (!shop) return notFound();

  // ── SSR-level pause check ──────────────────────────────────────────────
  if (shop.isActive === false) {
    return <ShopPausedPage shopName={shop.shopName} />;
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
    />
  );
}
