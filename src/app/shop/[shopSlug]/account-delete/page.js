import { getShopServer } from '@/lib/server-fetch';
import { notFound } from 'next/navigation';
import ShopAccountDeleteClient from './ShopAccountDeleteClient';

export default async function ShopAccountDeletePage({ params }) {
  const { shopSlug } = await params;
  const shop = await getShopServer(shopSlug);

  if (!shop) {
    notFound();
  }

  return <ShopAccountDeleteClient shop={shop} shopSlug={shopSlug} />;
}
