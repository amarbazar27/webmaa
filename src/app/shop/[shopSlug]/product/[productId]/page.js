import { getShopServer, getProductsServer } from '@/lib/server-fetch';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://webmaa.vercel.app';

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
      
    const images = absoluteImage ? [{ url: absoluteImage }] : [];
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
        type: 'product',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: absoluteImage ? [absoluteImage] : [],
      }
    };
  } catch (err) {
    console.error('[PRODUCT PAGE] Metadata Error:', err);
    return { title: 'পণ্য' };
  }
}

export default async function ProductDetailPage({ params }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams) return <ProductDetailClient shop={null} product={null} />;

    const { shopSlug, productId } = resolvedParams;
    if (!shopSlug || !productId) return <ProductDetailClient shop={null} product={null} />;
    
    const shop = await getShopServer(shopSlug);
    if (!shop) return <ProductDetailClient shop={null} product={null} />;

    const products = await getProductsServer(shop.id) || [];
    const product = products.find(p => p?.id === productId);
    
    if (!product) return <ProductDetailClient shop={null} product={null} />;

    const deepClone = (obj) => {
      try {
        if (!obj) return null;
        return JSON.parse(JSON.stringify(obj));
      } catch (e) {
        return null;
      }
    };

    const safeShop = deepClone(shop);
    const safeProduct = deepClone(product);

    return (
      <ProductDetailClient 
        shop={safeShop || null} 
        product={safeProduct || null} 
      />
    );
  } catch (err) {
    console.error(`[PRODUCT PAGE] CRITICAL RENDER ERROR:`, err);
    return <ProductDetailClient shop={null} product={null} />;
  }
}

