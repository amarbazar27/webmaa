import { getShopBySlug, getProducts } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

export async function generateMetadata({ params }) {
  const { shopSlug, productId } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return { title: 'পণ্য পাওয়া যায়নি' };
  const products = await getProducts(shop.id);
  const product = products.find(p => p.id === productId);
  return {
    title: product ? `${product.name} — ${shop.shopName}` : shop.shopName,
    description: product?.description || `${shop.shopName}-এ কেনাকাটা করুন`,
  };
}

export default async function ProductDetailPage({ params }) {
  const { shopSlug, productId } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const products = await getProducts(shop.id);
  const product = products.find(p => p.id === productId);
  if (!product) notFound();

  return <ProductDetailClient shop={shop} product={product} />;
}
