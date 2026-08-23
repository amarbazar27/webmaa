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

// New Premium Sections
import SplitShowcase from './SplitShowcase';
import EditorialStory from './EditorialStory';
import ShopTheLook from './ShopTheLook';
import BentoMosaic from './BentoMosaic';
import ProductSpotlight from './ProductSpotlight';
import MoodBoard from './MoodBoard';
import TabbedCollection from './TabbedCollection';
import Lookbook from './Lookbook';
import ScrollStory from './ScrollStory';
import ShoppableVideo from './ShoppableVideo';
import BeforeAfter from './BeforeAfter';
import TrustStrip from './TrustStrip';
import CustomerUgc from './CustomerUgc';
import DealOfTheDay from './DealOfTheDay';
import PriceLadder from './PriceLadder';

import BasicStorefront from './BasicStorefront';

export default function SectionRenderer({ section, products, themeVars, callbacks, isPreview = false }) {
  if (!section?.enabled) return null;
  const props = { data: section.data, themeVars, products, isPreview, ...callbacks };

  switch (section.type) {
    // Core & Existing
    case 'basic_storefront':  return <BasicStorefront {...props} />;
    case 'hero_carousel':     return <HeroCarousel {...props} />;
    case 'category_scroller':  return <CategoryScroller {...props} />;
    case 'flash_sale':        return <FlashSale {...props} />;
    case 'product_grid':      return <ProductGrid {...props} />;
    case 'video_reels':       return <VideoReels {...props} />;
    case 'banner_row':        return <BannerRow {...props} />;
    case 'concern_grid':      return <ConcernGrid {...props} />;
    case 'brand_marquee':     return <BrandMarquee {...props} />;
    case 'bundle_section':    return <BundleSection {...props} />;
    case 'photo_reviews':     return <PhotoReviews {...props} />;
    case 'price_tier_store':  return <PriceTierStore {...props} />;
    case 'instagram_feed':    return <InstagramFeed {...props} />;
    case 'popup_banner':      return <PopupBanner {...props} />;

    // New High-Converting Sections
    case 'split_showcase':    return <SplitShowcase {...props} />;
    case 'editorial_story':   return <EditorialStory {...props} />;
    case 'shop_the_look':     return <ShopTheLook {...props} />;
    case 'bento_mosaic':      return <BentoMosaic {...props} />;
    case 'product_spotlight': return <ProductSpotlight {...props} />;
    case 'mood_board':        return <MoodBoard {...props} />;
    case 'tabbed_collection': return <TabbedCollection {...props} />;
    case 'lookbook':          return <Lookbook {...props} />;
    case 'scroll_story':      return <ScrollStory {...props} />;
    case 'shoppable_video':   return <ShoppableVideo {...props} />;
    case 'before_after':      return <BeforeAfter {...props} />;
    case 'trust_strip':       return <TrustStrip {...props} />;
    case 'customer_ugc':      return <CustomerUgc {...props} />;
    case 'deal_of_the_day':   return <DealOfTheDay {...props} />;
    case 'price_ladder':      return <PriceLadder {...props} />;

    default: return null;
  }
}
