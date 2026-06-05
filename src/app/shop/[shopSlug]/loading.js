'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Next.js route-level loading UI — shown during SSR/ISR data fetching
export default function Loading() {
  const params = useParams();
  const shopSlug = params?.shopSlug;
  const [cachedShop, setCachedShop] = useState(null);

  useEffect(() => {
    if (shopSlug && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`cached_shop_logo_${shopSlug}`);
        if (cached) {
          setCachedShop(JSON.parse(cached));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [shopSlug]);

  return <LoadingScreen shop={cachedShop} />;
}
