/**
 * Webmaa Template Engine — Central Registry v3
 *
 * Each template is a FULL STOREFRONT IDENTITY, not just a color scheme.
 * Differences include: layout, typography, spacing, hero, cards, buttons,
 * shadows, animations, category UI, navbar, and footer.
 *
 * SSR-safe: pure config objects, no browser APIs.
 */

// ── Template Definitions ───────────────────────────────────────────────────

export const TEMPLATES = {

  // ══════════════════════════════════════════════════════════════════
  // 1. MINIMAL CLEAN — Distraction-free boutique
  // ══════════════════════════════════════════════════════════════════
  'minimal-clean': {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    namebn: 'মিনিমাল ক্লিন',
    tagline: 'Distraction-free boutique shopping',
    taglinebn: 'পরিষ্কার, সরল ডিজাইন',
    category: 'general',
    styleType: 'minimal-clean',       // → [data-sf-style] CSS
    layoutClass: 'layout-minimal',    // → layout modifier
    tags: ['minimal', 'clean', 'boutique', 'art', 'handcraft', 'simple'],
    personality: 'Quiet elegance. Content-first. Nothing is extra.',
    accentColor: '#18181B',
    darkMode: false,
    complexity: 'simple',
    recommended: ['boutique', 'art', 'handcraft', 'skincare', 'jewelry'],
    industryFit: 'artisanal',

    sections: [
      { id: 'minimal-hero',    label: 'হিরো',         visible: true,  order: 0 },
      { id: 'all-products',   label: 'সকল পণ্য',     visible: true,  order: 1 },
      { id: 'about-section',  label: 'সম্পর্কে',      visible: true,  order: 2 },
      { id: 'faq',            label: 'FAQ',           visible: false, order: 3 },
    ],

    defaultTheme: {
      primaryColor:   '#18181B',
      secondaryColor: '#3F3F46',
      accentColor:    '#18181B',
      bgColor:        '#FFFFFF',
      textColor:      '#18181B',
      headerBg:       '#FFFFFF',
      headerText:     '#18181B',
      cardBg:         '#FFFFFF',
      cardBorder:     '#E4E4E7',
      buttonRadius:   '2px',
      cardRadius:     '4px',
      fontFamily:     '"DM Sans", "Inter", sans-serif',
      fontSize:       'base',
      shadow:         'none',
      headerStyle:    'static',
      footerStyle:    'minimal',
      heroStyle:      'text-only',
      categoryStyle:  'pills-outline',
      animationLevel: 'none',
      gridCols:       4,
      spacing:        'relaxed',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. MODERN GLASS — Glassmorphism premium store
  // ══════════════════════════════════════════════════════════════════
  'modern-glass': {
    id: 'modern-glass',
    name: 'Modern Glass',
    namebn: 'মডার্ন গ্লাস',
    tagline: 'Glassmorphism-powered premium storefront',
    taglinebn: 'গ্লাস ইফেক্ট প্রিমিয়াম ডিজাইন',
    category: 'general',
    styleType: 'modern-glass',
    layoutClass: 'layout-glass',
    tags: ['glass', 'modern', 'premium', 'gradient', 'blur'],
    personality: 'Contemporary. Layered depth. Beautiful blur panels.',
    accentColor: '#6C47FF',
    darkMode: false,
    complexity: 'standard',
    recommended: ['tech', 'fashion', 'lifestyle', 'beauty', 'general'],
    industryFit: 'modern',

    sections: [
      { id: 'glass-hero',      label: 'গ্লাস হিরো',    visible: true,  order: 0 },
      { id: 'category-strip',  label: 'ক্যাটাগরি',     visible: true,  order: 1 },
      { id: 'featured-products', label: 'ফিচার পণ্য',  visible: true,  order: 2 },
      { id: 'all-products',    label: 'সকল পণ্য',      visible: true,  order: 3 },
      { id: 'reviews',         label: 'রিভিউ',         visible: true,  order: 4 },
      { id: 'faq',             label: 'FAQ',            visible: false, order: 5 },
    ],

    defaultTheme: {
      primaryColor:   '#6C47FF',
      secondaryColor: '#8B5CF6',
      accentColor:    '#F59E0B',
      bgColor:        '#F5F3FF',
      textColor:      '#1E1B4B',
      headerBg:       'linear-gradient(135deg, #6C47FF, #8B5CF6)',
      headerText:     '#FFFFFF',
      cardBg:         'rgba(255,255,255,0.72)',
      cardBorder:     'rgba(108,71,255,0.15)',
      buttonRadius:   '50px',
      cardRadius:     '20px',
      fontFamily:     '"Outfit", "Inter", sans-serif',
      fontSize:       'base',
      shadow:         'xl',
      headerStyle:    'sticky',
      footerStyle:    'compact',
      heroStyle:      'gradient-overlay',
      categoryStyle:  'pills-filled',
      animationLevel: 'smooth',
      gridCols:       3,
      spacing:        'comfortable',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. BOLD COMMERCE — High-density marketplace
  // ══════════════════════════════════════════════════════════════════
  'bold-commerce': {
    id: 'bold-commerce',
    name: 'Bold Commerce',
    namebn: 'বোল্ড কমার্স',
    tagline: 'Amazon-style power store — high density',
    taglinebn: 'হাই-ডেনসিটি পাওয়ার মার্কেটপ্লেস',
    category: 'general',
    styleType: 'bold-commerce',
    layoutClass: 'layout-commerce',
    tags: ['amazon', 'marketplace', 'general', 'electronics', 'popular', 'dense'],
    personality: 'Conversion-focused. Dense. Everything is a CTA.',
    accentColor: '#FF6B00',
    darkMode: false,
    complexity: 'standard',
    recommended: ['general', 'electronics', 'grocery', 'marketplace'],
    industryFit: 'marketplace',

    sections: [
      { id: 'offer-bar',       label: 'অফার বার',      visible: true,  order: 0 },
      { id: 'hero-banner',     label: 'হিরো ব্যানার',  visible: true,  order: 1 },
      { id: 'category-strip',  label: 'ক্যাটাগরি',     visible: true,  order: 2 },
      { id: 'featured-products', label: 'ফিচার পণ্য',  visible: true,  order: 3 },
      { id: 'promo-banner',    label: 'প্রমো ব্যানার', visible: true,  order: 4 },
      { id: 'all-products',    label: 'সকল পণ্য',      visible: true,  order: 5 },
      { id: 'reviews',         label: 'রিভিউ',         visible: true,  order: 6 },
    ],

    defaultTheme: {
      primaryColor:   '#FF6B00',
      secondaryColor: '#232F3E',
      accentColor:    '#FEBD69',
      bgColor:        '#F5F5F5',
      textColor:      '#0F1111',
      headerBg:       '#232F3E',
      headerText:     '#FFFFFF',
      cardBg:         '#FFFFFF',
      cardBorder:     '#DDDDDD',
      buttonRadius:   '4px',
      cardRadius:     '8px',
      fontFamily:     '"Inter", sans-serif',
      fontSize:       'base',
      shadow:         'md',
      headerStyle:    'fixed',
      footerStyle:    'full',
      heroStyle:      'banner-slide',
      categoryStyle:  'horizontal-scroll',
      animationLevel: 'minimal',
      gridCols:       4,
      spacing:        'compact',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 4. LUXURY DARK — Premium dark editorial
  // ══════════════════════════════════════════════════════════════════
  'luxury-dark': {
    id: 'luxury-dark',
    name: 'Luxury Dark',
    namebn: 'লাক্সারি ডার্ক',
    tagline: 'Editorial dark — jewelry, watches, premium goods',
    taglinebn: 'সিনেমাটিক ডার্ক লাক্সারি অভিজ্ঞতা',
    category: 'luxury',
    styleType: 'luxury-dark',
    layoutClass: 'layout-luxury',
    tags: ['luxury', 'dark', 'premium', 'jewelry', 'watches', 'gold', 'editorial'],
    personality: 'Cinematic. Slow. Every pixel is intentional.',
    accentColor: '#C9A84C',
    darkMode: true,
    complexity: 'premium',
    recommended: ['luxury', 'jewelry', 'watches', 'perfume', 'premium-fashion'],
    industryFit: 'luxury',

    sections: [
      { id: 'luxury-hero',        label: 'সিনেমাটিক হিরো', visible: true,  order: 0 },
      { id: 'brand-story',        label: 'ব্র্যান্ড স্টোরি',  visible: true,  order: 1 },
      { id: 'featured-products',  label: 'কিউরেটেড পণ্য',    visible: true,  order: 2 },
      { id: 'all-products',       label: 'সকল পণ্য',          visible: true,  order: 3 },
      { id: 'testimonials',       label: 'ক্লায়েন্ট মতামত', visible: true,  order: 4 },
    ],

    defaultTheme: {
      primaryColor:   '#C9A84C',
      secondaryColor: '#8B6914',
      accentColor:    '#FFD700',
      bgColor:        '#0A0A0A',
      textColor:      '#E8E8E8',
      headerBg:       '#111111',
      headerText:     '#C9A84C',
      cardBg:         '#1A1A1A',
      cardBorder:     'rgba(201,168,76,0.25)',
      buttonRadius:   '0px',
      cardRadius:     '2px',
      fontFamily:     '"Cormorant Garamond", "Playfair Display", Georgia, serif',
      fontSize:       'lg',
      shadow:         'xl',
      headerStyle:    'fixed',
      footerStyle:    'full',
      heroStyle:      'cinematic-fullscreen',
      categoryStyle:  'elegant-list',
      animationLevel: 'cinematic',
      gridCols:       2,
      spacing:        'editorial',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 5. LOCAL BAZAAR — Grocery / daily market
  // ══════════════════════════════════════════════════════════════════
  'local-bazaar': {
    id: 'local-bazaar',
    name: 'Local Bazaar',
    namebn: 'লোকাল বাজার',
    tagline: 'Fresh market, fast checkout, dense value',
    taglinebn: 'দ্রুত ডেলিভারি, সাশ্রয়ী মূল্য, লোকাল বাজার',
    category: 'grocery',
    styleType: 'local-bazaar',
    layoutClass: 'layout-bazaar',
    tags: ['grocery', 'food', 'market', 'fresh', 'daily', 'vegetable', 'bazaar'],
    personality: 'Energetic. Price-forward. Feels like your local market.',
    accentColor: '#2E7D32',
    darkMode: false,
    complexity: 'standard',
    recommended: ['grocery', 'food', 'market', 'vegetables', 'fish', 'meat'],
    industryFit: 'grocery',

    sections: [
      { id: 'delivery-banner',  label: 'ডেলিভারি ব্যানার', visible: true,  order: 0 },
      { id: 'quick-categories', label: 'দ্রুত ক্যাটাগরি',  visible: true,  order: 1 },
      { id: 'daily-deals',      label: 'আজকের অফার',       visible: true,  order: 2 },
      { id: 'all-products',     label: 'সকল পণ্য',          visible: true,  order: 3 },
      { id: 'delivery-info',    label: 'ডেলিভারি তথ্য',    visible: true,  order: 4 },
      { id: 'faq',              label: 'FAQ',               visible: true,  order: 5 },
    ],

    defaultTheme: {
      primaryColor:   '#2E7D32',
      secondaryColor: '#1B5E20',
      accentColor:    '#FF6F00',
      bgColor:        '#F1F8E9',
      textColor:      '#1B2E1B',
      headerBg:       '#2E7D32',
      headerText:     '#FFFFFF',
      cardBg:         '#FFFFFF',
      cardBorder:     '#C8E6C9',
      buttonRadius:   '50px',
      cardRadius:     '12px',
      fontFamily:     '"Inter", sans-serif',
      fontSize:       'base',
      shadow:         'md',
      headerStyle:    'sticky',
      footerStyle:    'compact',
      heroStyle:      'colorful-offer',
      categoryStyle:  'circle-grid',
      animationLevel: 'energetic',
      gridCols:       3,
      spacing:        'tight',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 6. AI FUTURISTIC — Neon glassmorphism
  // ══════════════════════════════════════════════════════════════════
  'ai-futuristic': {
    id: 'ai-futuristic',
    name: 'AI Futuristic',
    namebn: 'এআই ফিউচারিস্টিক',
    tagline: 'Glassmorphism, glow, neon — the future of commerce',
    taglinebn: 'গ্লো ইফেক্ট, নিয়ন ডিজাইন, ভবিষ্যতের শপিং',
    category: 'general',
    styleType: 'ai-futuristic',
    layoutClass: 'layout-futuristic',
    tags: ['ai', 'futuristic', 'neon', 'glow', 'glassmorphism', 'dark', 'tech'],
    personality: 'Immersive. Glowing. Feels like 2035.',
    accentColor: '#6C47FF',
    darkMode: true,
    complexity: 'advanced',
    recommended: ['tech', 'electronics', 'gaming', 'ai-products', 'software'],
    industryFit: 'technology',

    sections: [
      { id: 'ai-hero',         label: 'অ্যানিমেটেড হিরো',  visible: true,  order: 0 },
      { id: 'ai-categories',   label: 'স্মার্ট ক্যাটাগরি', visible: true,  order: 1 },
      { id: 'featured-products', label: 'AI পিক্স',        visible: true,  order: 2 },
      { id: 'all-products',    label: 'সকল পণ্য',           visible: true,  order: 3 },
      { id: 'reviews',         label: 'রিভিউ',              visible: true,  order: 4 },
    ],

    defaultTheme: {
      primaryColor:   '#6C47FF',
      secondaryColor: '#8B5CF6',
      accentColor:    '#22D3EE',
      bgColor:        '#020617',
      textColor:      '#F0F9FF',
      headerBg:       'linear-gradient(135deg, #0E0E2C, #1A0A3D)',
      headerText:     '#E0E7FF',
      cardBg:         'rgba(255,255,255,0.05)',
      cardBorder:     'rgba(108,71,255,0.3)',
      buttonRadius:   '50px',
      cardRadius:     '24px',
      fontFamily:     '"Outfit", "Exo 2", sans-serif',
      fontSize:       'base',
      shadow:         'xl',
      headerStyle:    'fixed',
      footerStyle:    'full',
      heroStyle:      'animated-gradient',
      categoryStyle:  'glow-cards',
      animationLevel: 'immersive',
      gridCols:       3,
      spacing:        'futuristic',
    },
  },

  // Keep backward-compatible aliases
  'modern-commerce': {
    id: 'modern-commerce',
    name: 'Bold Commerce',
    namebn: 'বোল্ড কমার্স',
    tagline: 'Amazon-style power store',
    taglinebn: 'পাওয়ার মার্কেটপ্লেস',
    category: 'general',
    styleType: 'bold-commerce',
    layoutClass: 'layout-commerce',
    tags: ['amazon', 'general', 'marketplace', 'popular'],
    personality: 'Conversion-focused marketplace.',
    accentColor: '#FF6B00',
    darkMode: false,
    complexity: 'standard',
    recommended: ['general', 'electronics', 'grocery'],
    industryFit: 'marketplace',
    sections: [
      { id: 'hero-banner',      label: 'হিরো ব্যানার', visible: true,  order: 0 },
      { id: 'category-strip',   label: 'ক্যাটাগরি',    visible: true,  order: 1 },
      { id: 'featured-products', label: 'ফিচার পণ্য',  visible: true,  order: 2 },
      { id: 'all-products',     label: 'সকল পণ্য',     visible: true,  order: 3 },
    ],
    defaultTheme: {
      primaryColor: '#FF6B00', secondaryColor: '#232F3E', accentColor: '#FEBD69',
      bgColor: '#F5F5F5', textColor: '#0F1111', headerBg: '#232F3E', headerText: '#FFFFFF',
      cardBg: '#FFFFFF', cardBorder: '#DDDDDD', buttonRadius: '4px', cardRadius: '8px',
      fontFamily: '"Inter", sans-serif', fontSize: 'base', shadow: 'md',
      headerStyle: 'fixed', footerStyle: 'full', heroStyle: 'banner-slide',
      categoryStyle: 'horizontal-scroll', animationLevel: 'minimal', gridCols: 4, spacing: 'compact',
    },
  },

  'grocery-pro': {
    id: 'grocery-pro',
    name: 'Local Bazaar',
    namebn: 'লোকাল বাজার',
    tagline: 'Fresh market, fast checkout',
    taglinebn: 'দ্রুত ডেলিভারি',
    category: 'grocery',
    styleType: 'local-bazaar',
    layoutClass: 'layout-bazaar',
    tags: ['grocery', 'food', 'market', 'fresh'],
    personality: 'Local market energy.',
    accentColor: '#2E7D32',
    darkMode: false,
    complexity: 'standard',
    recommended: ['grocery', 'food', 'market'],
    industryFit: 'grocery',
    sections: [
      { id: 'offer-banner',    label: 'অফার ব্যানার',   visible: true, order: 0 },
      { id: 'quick-categories', label: 'ক্যাটাগরি',     visible: true, order: 1 },
      { id: 'all-products',    label: 'সকল পণ্য',       visible: true, order: 2 },
    ],
    defaultTheme: {
      primaryColor: '#2E7D32', secondaryColor: '#1B5E20', accentColor: '#FF6F00',
      bgColor: '#F1F8E9', textColor: '#1B2E1B', headerBg: '#2E7D32', headerText: '#FFFFFF',
      cardBg: '#FFFFFF', cardBorder: '#C8E6C9', buttonRadius: '50px', cardRadius: '12px',
      fontFamily: '"Inter", sans-serif', fontSize: 'base', shadow: 'md',
      headerStyle: 'sticky', footerStyle: 'compact', heroStyle: 'colorful-offer',
      categoryStyle: 'circle-grid', animationLevel: 'energetic', gridCols: 3, spacing: 'tight',
    },
  },

  'luxury-fashion': {
    id: 'luxury-fashion',
    name: 'Luxury Dark',
    namebn: 'লাক্সারি ডার্ক',
    tagline: 'Premium luxury experience',
    taglinebn: 'প্রিমিয়াম লাক্সারি',
    category: 'luxury',
    styleType: 'luxury-dark',
    layoutClass: 'layout-luxury',
    tags: ['luxury', 'fashion', 'premium'],
    personality: 'Editorial luxury.',
    accentColor: '#C9A84C',
    darkMode: true,
    complexity: 'premium',
    recommended: ['luxury', 'fashion', 'premium'],
    industryFit: 'luxury',
    sections: [
      { id: 'luxury-hero',    label: 'হিরো',      visible: true, order: 0 },
      { id: 'all-products',  label: 'সকল পণ্য', visible: true, order: 1 },
    ],
    defaultTheme: {
      primaryColor: '#C9A84C', secondaryColor: '#8B6914', accentColor: '#FFD700',
      bgColor: '#0A0A0A', textColor: '#E8E8E8', headerBg: '#111111', headerText: '#C9A84C',
      cardBg: '#1A1A1A', cardBorder: 'rgba(201,168,76,0.25)', buttonRadius: '0px', cardRadius: '2px',
      fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 'lg', shadow: 'xl',
      headerStyle: 'fixed', footerStyle: 'full', heroStyle: 'cinematic-fullscreen',
      categoryStyle: 'elegant-list', animationLevel: 'cinematic', gridCols: 2, spacing: 'editorial',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 7. NEON GAMING — Dark Electronics / Gaming Store
  // ══════════════════════════════════════════════════════════════════
  'neon-gaming': {
    id: 'neon-gaming',
    name: 'Neon Gaming',
    namebn: 'নিয়ন গেমিং',
    tagline: 'RGB neon — for tech & gaming stores',
    taglinebn: 'গেমিং / টেক স্টোরের জন্য নিয়ন ডিজাইন',
    category: 'electronics',
    styleType: 'neon-gaming',
    layoutClass: 'layout-gaming',
    tags: ['gaming', 'electronics', 'dark', 'neon', 'rgb', 'tech', 'gadget'],
    personality: 'High-energy. RGB. Every product feels like a boss drop.',
    accentColor: '#00FF88',
    darkMode: true,
    complexity: 'advanced',
    recommended: ['gaming', 'electronics', 'pc-parts', 'accessories', 'gadgets'],
    industryFit: 'technology',

    sections: [
      { id: 'rgb-hero',          label: 'RGB হিরো',         visible: true,  order: 0 },
      { id: 'flash-deals',       label: 'ফ্ল্যাশ ডিল',      visible: true,  order: 1 },
      { id: 'category-neon',     label: 'ক্যাটাগরি গ্রিড',  visible: true,  order: 2 },
      { id: 'featured-products', label: 'ফিচার পণ্য',       visible: true,  order: 3 },
      { id: 'all-products',      label: 'সকল পণ্য',          visible: true,  order: 4 },
      { id: 'reviews',           label: 'রিভিউ',             visible: true,  order: 5 },
    ],

    defaultTheme: {
      primaryColor:   '#00FF88',
      secondaryColor: '#00D4FF',
      accentColor:    '#FF0080',
      bgColor:        '#060B14',
      textColor:      '#E2F1FF',
      headerBg:       'linear-gradient(135deg, #060B14, #0D1B2A)',
      headerText:     '#00FF88',
      cardBg:         'rgba(0,255,136,0.05)',
      cardBorder:     'rgba(0,255,136,0.25)',
      buttonRadius:   '6px',
      cardRadius:     '12px',
      fontFamily:     '"Outfit", "Exo 2", monospace',
      fontSize:       'base',
      shadow:         'xl',
      headerStyle:    'fixed',
      footerStyle:    'full',
      heroStyle:      'rgb-animated',
      categoryStyle:  'neon-grid',
      animationLevel: 'immersive',
      gridCols:       4,
      spacing:        'compact',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 8. INSTAGRAM FASHION — Social-first Fashion Store
  // ══════════════════════════════════════════════════════════════════
  'instagram-fashion': {
    id: 'instagram-fashion',
    name: 'Instagram Fashion',
    namebn: 'ইনস্টাগ্রাম ফ্যাশন',
    tagline: 'Social-first fashion with editorial aesthetic',
    taglinebn: 'ইনস্টাগ্রাম স্টাইল ফ্যাশন শপ',
    category: 'fashion',
    styleType: 'instagram-fashion',
    layoutClass: 'layout-instagram',
    tags: ['fashion', 'instagram', 'social', 'beauty', 'lifestyle', 'trendy', 'boutique'],
    personality: 'Curated. Aesthetic. Looks like an IG feed.',
    accentColor: '#E91E8C',
    darkMode: false,
    complexity: 'standard',
    recommended: ['fashion', 'beauty', 'lifestyle', 'clothing', 'accessories'],
    industryFit: 'fashion',

    sections: [
      { id: 'ig-hero',            label: 'IG হিরো',           visible: true,  order: 0 },
      { id: 'ig-story-grid',      label: 'স্টোরি গ্রিড',      visible: true,  order: 1 },
      { id: 'featured-products',  label: 'কিউরেটেড পণ্য',    visible: true,  order: 2 },
      { id: 'all-products',       label: 'সকল পণ্য',          visible: true,  order: 3 },
      { id: 'reviews',            label: 'কাস্টমার রিভিউ',   visible: true,  order: 4 },
    ],

    defaultTheme: {
      primaryColor:   '#E91E8C',
      secondaryColor: '#FF6DB0',
      accentColor:    '#FF9A3C',
      bgColor:        '#FFFBFE',
      textColor:      '#1A0A14',
      headerBg:       '#FFFFFF',
      headerText:     '#1A0A14',
      cardBg:         '#FFFFFF',
      cardBorder:     '#F3E8F0',
      buttonRadius:   '50px',
      cardRadius:     '16px',
      fontFamily:     '"DM Sans", "Nunito", sans-serif',
      fontSize:       'base',
      shadow:         'md',
      headerStyle:    'sticky',
      footerStyle:    'minimal',
      heroStyle:      'full-bleed-image',
      categoryStyle:  'story-circles',
      animationLevel: 'smooth',
      gridCols:       2,
      spacing:        'relaxed',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 9. HALAL MARKETPLACE — Islamic / Arabic Inspired
  // ══════════════════════════════════════════════════════════════════
  'halal-marketplace': {
    id: 'halal-marketplace',
    name: 'Halal Marketplace',
    namebn: 'হালাল মার্কেটপ্লেস',
    tagline: 'Elegant Arabic-inspired halal store',
    taglinebn: 'ইসলামিক ডিজাইন, হালাল পণ্য',
    category: 'islamic',
    styleType: 'halal-marketplace',
    layoutClass: 'layout-halal',
    tags: ['halal', 'islamic', 'arabic', 'muslim', 'modest', 'organic', 'trust'],
    personality: 'Trustworthy. Elegant. Islamic geometric patterns.',
    accentColor: '#2E7D5E',
    darkMode: false,
    complexity: 'standard',
    recommended: ['halal-food', 'modest-fashion', 'islamic-products', 'organic', 'prayer'],
    industryFit: 'islamic',

    sections: [
      { id: 'halal-hero',         label: 'মেইন ব্যানার',      visible: true,  order: 0 },
      { id: 'trust-badges',       label: 'বিশ্বাসযোগ্যতা',    visible: true,  order: 1 },
      { id: 'category-islamic',   label: 'ক্যাটাগরি',          visible: true,  order: 2 },
      { id: 'featured-products',  label: 'বিশেষ পণ্য',        visible: true,  order: 3 },
      { id: 'all-products',       label: 'সকল পণ্য',           visible: true,  order: 4 },
      { id: 'reviews',            label: 'সন্তুষ্ট গ্রাহক',    visible: true,  order: 5 },
    ],

    defaultTheme: {
      primaryColor:   '#2E7D5E',
      secondaryColor: '#1B5E43',
      accentColor:    '#C9A84C',
      bgColor:        '#F8F5F0',
      textColor:      '#1A1208',
      headerBg:       '#2E7D5E',
      headerText:     '#FFFFFF',
      cardBg:         '#FFFFFF',
      cardBorder:     '#D4C9B0',
      buttonRadius:   '8px',
      cardRadius:     '12px',
      fontFamily:     '"Noto Sans Bengali", "Hind Siliguri", sans-serif',
      fontSize:       'base',
      shadow:         'md',
      headerStyle:    'sticky',
      footerStyle:    'full',
      heroStyle:      'pattern-overlay',
      categoryStyle:  'diamond-grid',
      animationLevel: 'minimal',
      gridCols:       3,
      spacing:        'comfortable',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 10. FOOD DELIVERY — Restaurant / Food Delivery
  // ══════════════════════════════════════════════════════════════════
  'food-delivery': {
    id: 'food-delivery',
    name: 'Food Delivery',
    namebn: 'ফুড ডেলিভারি',
    tagline: 'Hungry? Order in 30 minutes.',
    taglinebn: 'দ্রুত খাবার অর্ডার, ৩০ মিনিটে ডেলিভারি',
    category: 'restaurant',
    styleType: 'food-delivery',
    layoutClass: 'layout-food',
    tags: ['food', 'restaurant', 'delivery', 'fast-food', 'menu', 'cooking', 'cafe'],
    personality: 'Warm. Appetizing. Makes you hungry just looking at it.',
    accentColor: '#FF5722',
    darkMode: false,
    complexity: 'standard',
    recommended: ['restaurant', 'fast-food', 'cafe', 'bakery', 'home-kitchen'],
    industryFit: 'food',

    sections: [
      { id: 'food-hero',          label: 'হিরো ব্যানার',       visible: true,  order: 0 },
      { id: 'eta-banner',         label: 'ডেলিভারি সময়',       visible: true,  order: 1 },
      { id: 'menu-categories',    label: 'মেনু ক্যাটাগরি',     visible: true,  order: 2 },
      { id: 'popular-items',      label: 'জনপ্রিয় খাবার',     visible: true,  order: 3 },
      { id: 'all-products',       label: 'সম্পূর্ণ মেনু',       visible: true,  order: 4 },
      { id: 'delivery-info',      label: 'ডেলিভারি তথ্য',       visible: true,  order: 5 },
    ],

    defaultTheme: {
      primaryColor:   '#FF5722',
      secondaryColor: '#FF8A65',
      accentColor:    '#FFC107',
      bgColor:        '#FFF8F5',
      textColor:      '#1A0800',
      headerBg:       '#FF5722',
      headerText:     '#FFFFFF',
      cardBg:         '#FFFFFF',
      cardBorder:     '#FFE0D4',
      buttonRadius:   '50px',
      cardRadius:     '20px',
      fontFamily:     '"Nunito", "Inter", sans-serif',
      fontSize:       'base',
      shadow:         'lg',
      headerStyle:    'sticky',
      footerStyle:    'compact',
      heroStyle:      'food-banner',
      categoryStyle:  'emoji-pills',
      animationLevel: 'energetic',
      gridCols:       2,
      spacing:        'comfortable',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 11. DARAZ STYLE — Dense Marketplace like Daraz/Shopee
  // ══════════════════════════════════════════════════════════════════
  'daraz-style': {
    id: 'daraz-style',
    name: 'Daraz Inspired',
    namebn: 'দারাজ স্টাইল',
    tagline: 'Flash sales, vouchers, dense product discovery',
    taglinebn: 'ফ্ল্যাশ সেল, ভাউচার, ঘন পণ্য গ্রিড',
    category: 'general',
    styleType: 'daraz-style',
    layoutClass: 'layout-daraz',
    tags: ['daraz', 'shopee', 'marketplace', 'flash-sale', 'voucher', 'dense', 'general'],
    personality: 'Deal-hungry. Flash sales everywhere. Urgency-driven.',
    accentColor: '#F05A24',
    darkMode: false,
    complexity: 'standard',
    recommended: ['general', 'electronics', 'fashion', 'grocery', 'marketplace'],
    industryFit: 'marketplace',

    sections: [
      { id: 'flash-sale-bar',     label: 'ফ্ল্যাশ সেল বার',   visible: true,  order: 0 },
      { id: 'mega-banner',        label: 'মেগা ব্যানার',        visible: true,  order: 1 },
      { id: 'voucher-strip',      label: 'ভাউচার স্ট্রিপ',     visible: true,  order: 2 },
      { id: 'category-grid',      label: 'ক্যাটাগরি গ্রিড',    visible: true,  order: 3 },
      { id: 'featured-products',  label: 'বেস্ট ডিল',          visible: true,  order: 4 },
      { id: 'all-products',       label: 'সকল পণ্য',            visible: true,  order: 5 },
    ],

    defaultTheme: {
      primaryColor:   '#F05A24',
      secondaryColor: '#FF8C00',
      accentColor:    '#FFD200',
      bgColor:        '#F5F5F5',
      textColor:      '#333333',
      headerBg:       '#F05A24',
      headerText:     '#FFFFFF',
      cardBg:         '#FFFFFF',
      cardBorder:     '#EEEEEE',
      buttonRadius:   '4px',
      cardRadius:     '8px',
      fontFamily:     '"Inter", "Roboto", sans-serif',
      fontSize:       'sm',
      shadow:         'sm',
      headerStyle:    'fixed',
      footerStyle:    'full',
      heroStyle:      'slideshow',
      categoryStyle:  'icon-grid',
      animationLevel: 'minimal',
      gridCols:       5,
      spacing:        'tight',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 12. APPLE MINIMAL — Ultra-clean Apple-inspired Design
  // ══════════════════════════════════════════════════════════════════
  'apple-minimal': {
    id: 'apple-minimal',
    name: 'Apple Inspired',
    namebn: 'অ্যাপল মিনিমাল',
    tagline: 'Think different. Ultra-clean, product-first.',
    taglinebn: 'অ্যাপলের মতো পরিষ্কার, প্রিমিয়াম ডিজাইন',
    category: 'general',
    styleType: 'apple-minimal',
    layoutClass: 'layout-apple',
    tags: ['apple', 'minimal', 'premium', 'clean', 'white', 'tech', 'luxury'],
    personality: 'Effortless. Every product is art. White space is king.',
    accentColor: '#0071E3',
    darkMode: false,
    complexity: 'premium',
    recommended: ['tech', 'gadgets', 'premium', 'design', 'electronics'],
    industryFit: 'premium-tech',

    sections: [
      { id: 'hero-fullscreen',    label: 'ফুলস্ক্রিন হিরো',   visible: true,  order: 0 },
      { id: 'product-spotlight',  label: 'প্রোডাক্ট স্পটলাইট', visible: true, order: 1 },
      { id: 'feature-grid',       label: 'ফিচার গ্রিড',        visible: true,  order: 2 },
      { id: 'all-products',       label: 'সকল পণ্য',            visible: true,  order: 3 },
    ],

    defaultTheme: {
      primaryColor:   '#0071E3',
      secondaryColor: '#1D1D1F',
      accentColor:    '#0071E3',
      bgColor:        '#FFFFFF',
      textColor:      '#1D1D1F',
      headerBg:       'rgba(255,255,255,0.85)',
      headerText:     '#1D1D1F',
      cardBg:         '#FFFFFF',
      cardBorder:     'rgba(0,0,0,0.08)',
      buttonRadius:   '980px',
      cardRadius:     '18px',
      fontFamily:     '"Inter", "-apple-system", "BlinkMacSystemFont", sans-serif',
      fontSize:       'lg',
      shadow:         'sm',
      headerStyle:    'sticky-blur',
      footerStyle:    'minimal',
      heroStyle:      'fullscreen-video',
      categoryStyle:  'text-links',
      animationLevel: 'smooth',
      gridCols:       2,
      spacing:        'editorial',
    },
  },
};

// ── Category registry ──────────────────────────────────────────────────────
export const TEMPLATE_CATEGORIES = [
  { id: 'all',       label: 'সব টেমপ্লেট',  labelEn: 'All Templates' },
  { id: 'general',   label: 'সাধারণ',         labelEn: 'General' },
  { id: 'grocery',   label: 'গ্রোসারি',       labelEn: 'Grocery' },
  { id: 'luxury',    label: 'লাক্সারি',       labelEn: 'Luxury' },
  { id: 'fashion',   label: 'ফ্যাশন',         labelEn: 'Fashion' },
];

// ── Helper functions ───────────────────────────────────────────────────────
export const getTemplateById = (id) => TEMPLATES[id] || TEMPLATES['bold-commerce'] || TEMPLATES['modern-commerce'];

export const getTemplateList = () => Object.values(TEMPLATES);

export const getUniqueTemplates = () => {
  const seen = new Set();
  return Object.values(TEMPLATES).filter(t => {
    if (seen.has(t.styleType)) return false;
    seen.add(t.styleType);
    return true;
  });
};

export const getTemplatesByCategory = (category) => {
  const list = getUniqueTemplates();
  if (!category || category === 'all') return list;
  return list.filter(t => t.category === category || t.tags.includes(category));
};

export const suggestTemplateFromDescription = (description = '') => {
  const lowerDesc = description.toLowerCase();
  const keywords = {
    'luxury-dark':    ['luxury', 'premium', 'jewelry', 'watch', 'gold', 'লাক্সারি', 'গহনা', 'প্রিমিয়াম'],
    'local-bazaar':   ['grocery', 'food', 'market', 'fresh', 'vegetable', 'গ্রোসারি', 'বাজার', 'তরকারি', 'মাছ', 'মাংস'],
    'ai-futuristic':  ['tech', 'ai', 'software', 'digital', 'gaming', 'gadget', 'টেক', 'গেমিং', 'ডিজিটাল'],
    'minimal-clean':  ['minimal', 'boutique', 'handcraft', 'art', 'মিনিমাল', 'বুটিক', 'হস্তশিল্প'],
    'modern-glass':   ['fashion', 'beauty', 'lifestyle', 'ফ্যাশন', 'বিউটি', 'লাইফস্টাইল'],
    'bold-commerce':  ['shop', 'store', 'product', 'ecommerce', 'দোকান', 'পণ্য', 'সব'],
  };

  let bestMatch = 'bold-commerce';
  let bestScore = 0;

  Object.entries(keywords).forEach(([templateId, words]) => {
    const score = words.reduce((acc, word) => acc + (lowerDesc.includes(word) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestMatch = templateId; }
  });

  return TEMPLATES[bestMatch] || TEMPLATES['bold-commerce'];
};

// ── Color palette presets ──────────────────────────────────────────────────
export const AI_COLOR_PALETTES = {
  luxury:      { name: 'লাক্সারি গোল্ড',   primaryColor: '#C9A84C', accentColor: '#FFD700',  bgColor: '#0A0A0A' },
  fashion:     { name: 'মডার্ন ভায়োলেট',   primaryColor: '#6C47FF', accentColor: '#8B5CF6',  bgColor: '#F5F3FF' },
  grocery:     { name: 'ফ্রেশ গ্রিন',       primaryColor: '#2E7D32', accentColor: '#FF6F00',  bgColor: '#F1F8E9' },
  futuristic:  { name: 'নিয়ন গ্লো',        primaryColor: '#6C47FF', accentColor: '#22D3EE',  bgColor: '#020617' },
  general:     { name: 'ক্লাসিক অরেঞ্জ',   primaryColor: '#FF6B00', accentColor: '#FEBD69',  bgColor: '#F5F5F5' },
  minimal:     { name: 'মিনিমাল ব্ল্যাক',  primaryColor: '#18181B', accentColor: '#71717A',  bgColor: '#FFFFFF' },
};

export default TEMPLATES;
