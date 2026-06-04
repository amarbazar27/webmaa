import { getShopServer } from '@/lib/server-fetch';
import { notFound } from 'next/navigation';
import ReviewsClient from './ReviewsClient';

export default async function ShopReviewsPage({ params }) {
  const { shopSlug } = await params;
  const shop = await getShopServer(shopSlug);

  if (!shop) {
    notFound();
  }

  const safeShop = JSON.parse(JSON.stringify(shop));

  return <ReviewsClient shop={safeShop} />;
}
