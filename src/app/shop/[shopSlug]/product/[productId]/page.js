import { getShopServer, getProductsServer } from '@/lib/server-fetch';
import ProductDetailClient from './ProductDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://webmaa.vercel.app';

// 🚨 Fail-safe serialization utility moved outside component
const deepClone = (obj) => {
  if (!obj) return null;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return null;
  }
};

export async function generateMetadata({ params }) {
  try {
    const resolvedParams = await params;
    const shopSlug = resolvedParams?.shopSlug;
    const productId = resolvedParams?.productId;

    if (!shopSlug || !productId) return { title: 'পণ্য' };
    
    const shop = await getShopServer(shopSlug);
    if (!shop) return { title: 'শপ পাওয়া যায়নি' };
    
    const products = await getProductsServer(shop.id) || [];
    const product = products.find(p => p.id === productId);

    const title = product?.name ? `${product.name} — ${shop.shopName}` : (shop?.shopName || 'পণ্য');
    const description = String(product?.description || `${shop?.shopName || 'Shop'}-এ কেনাকাটা করুন`).slice(0, 160);
    
    const rawImage = product?.imageUrl || shop?.logoUrl || '';
    let absoluteImage = '';
    if (typeof rawImage === 'string' && rawImage) {
      absoluteImage = rawImage.startsWith('http') ? rawImage : `${BASE_URL}${rawImage}`;
    }
      
    // Next.js metadata images should ideally have width/height to avoid OG issues
    const images = absoluteImage ? [{ url: absoluteImage, width: 800, height: 600 }] : [];
    const canonicalUrl = `${BASE_URL}/shop/${shopSlug}/product/${productId}`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        images,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: absoluteImage ? [absoluteImage] : [],
      }
    };
  } catch (err) {
    return { title: 'পণ্য' };
  }
}

export default async function ProductDetailPage({ params }) {
  try {
    let shop = null;
    let product = null;

    try {
      const resolvedParams = await params;
      if (resolvedParams?.shopSlug && resolvedParams?.productId) {
        shop = await getShopServer(resolvedParams.shopSlug);
        if (shop?.id) {
          const products = await getProductsServer(shop.id) || [];
          product = products.find(p => p?.id === resolvedParams.productId);
        }
      }
    } catch (err) {
      console.error(`[PRODUCT PAGE] FETCH ERROR:`, err);
    }

    // Final serialization pass to ensure NO complex objects (Timestamps, etc) hit the client
    const safeShop = deepClone(shop);
    const safeProduct = deepClone(product);

    return (
      <ProductDetailClient 
        shop={safeShop || null} 
        product={safeProduct || null} 
      />
    );
  } catch (criticalError) {
    console.error(`[PRODUCT PAGE] CRITICAL SSR ERROR:`, criticalError);
    return (
      <ProductDetailClient 
        shop={null} 
        product={null} 
      />
    );
  }
}

