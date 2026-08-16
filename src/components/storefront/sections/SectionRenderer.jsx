'use client';
import HeroCarousel from './HeroCarousel';
import CategoryScroller from './CategoryScroller';
import FlashSale from './FlashSale';
import ProductGrid from './ProductGrid';
import VideoReels from './VideoReels';
import BannerRow from './BannerRow';
import ConcernGrid from './ConcernGrid';
import BrandMarquee from './BrandMarquee';
import BundleSection from './BundleSection';
import PhotoReviews from './PhotoReviews';
import PriceTierStore from './PriceTierStore';
import InstagramFeed from './InstagramFeed';
import PopupBanner from './PopupBanner';

export default function SectionRenderer({ section, products, themeVars, callbacks }) {
  if (!section?.enabled) return null;
  const props = { data: section.data, themeVars, products, ...callbacks };

  switch (section.type) {
    case 'hero_carousel':    return <HeroCarousel {...props} />;
    case 'category_scroller': return <CategoryScroller {...props} />;
    case 'flash_sale':       return <FlashSale {...props} />;
    case 'product_grid':     return <ProductGrid {...props} />;
    case 'video_reels':      return <VideoReels {...props} />;
    case 'banner_row':       return <BannerRow {...props} />;
    case 'concern_grid':     return <ConcernGrid {...props} />;
    case 'brand_marquee':    return <BrandMarquee {...props} />;
    case 'bundle_section':   return <BundleSection {...props} />;
    case 'photo_reviews':    return <PhotoReviews {...props} />;
    case 'price_tier_store': return <PriceTierStore {...props} />;
    case 'instagram_feed':   return <InstagramFeed {...props} />;
    case 'popup_banner':      return <PopupBanner {...props} />;
    default: return null;
  }
}
