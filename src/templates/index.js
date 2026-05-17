/**
 * Webmaa Template Engine - Central Registry
 * SSR-safe: No browser APIs, pure config objects
 */

export const TEMPLATES = {
  'modern-commerce': {
    id: 'modern-commerce',
    name: 'Modern Commerce',
    namebn: 'মডার্ন কমার্স',
    tagline: 'Amazon-style power store',
    category: 'general',
    tags: ['amazon', 'general', 'marketplace', 'popular'],
    preview: '/templates/modern-commerce/preview.png',
    mobilePreview: '/templates/modern-commerce/mobile-preview.png',
    accentColor: '#FF6B00',
    darkMode: false,
    complexity: 'standard',
    recommended: ['general', 'electronics', 'grocery'],
    sections: [
      { id: 'hero-banner', label: 'হিরো ব্যানার', visible: true, order: 0 },
      { id: 'category-strip', label: 'ক্যাটাগরি স্ট্রিপ', visible: true, order: 1 },
      { id: 'featured-products', label: 'ফিচার পণ্য', visible: true, order: 2 },
      { id: 'promo-banner', label: 'প্রমো ব্যানার', visible: true, order: 3 },
      { id: 'all-products', label: 'সকল পণ্য', visible: true, order: 4 },
      { id: 'reviews', label: 'রিভিউ', visible: true, order: 5 },
      { id: 'faq', label: 'FAQ', visible: false, order: 6 },
    ],
    defaultTheme: {
      primaryColor: '#FF6B00',
      secondaryColor: '#232F3E',
      accentColor: '#FEBD69',
      bgColor: '#FFFFFF',
      textColor: '#0F1111',
      headerBg: '#232F3E',
      headerText: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardBorder: '#DDD',
      buttonRadius: '4px',
      cardRadius: '8px',
      fontFamily: 'Inter, sans-serif',
      fontSize: 'base',
      shadow: 'md',
      headerStyle: 'fixed',
      footerStyle: 'full',
    }
  },
  'luxury-fashion': {
    id: 'luxury-fashion',
    name: 'Luxury Fashion',
    namebn: 'লাক্সারি ফ্যাশন',
    tagline: 'Premium Apple-inspired minimal store',
    category: 'fashion',
    tags: ['apple', 'luxury', 'fashion', 'premium', 'minimal'],
    preview: '/templates/luxury-fashion/preview.png',
    mobilePreview: '/templates/luxury-fashion/mobile-preview.png',
    accentColor: '#8B0000',
    darkMode: false,
    complexity: 'premium',
    recommended: ['fashion', 'luxury', 'lifestyle'],
    sections: [
      { id: 'fullscreen-hero', label: 'ফুলস্ক্রিন হিরো', visible: true, order: 0 },
      { id: 'brand-story', label: 'ব্র্যান্ড স্টোরি', visible: true, order: 1 },
      { id: 'featured-collection', label: 'ফিচার কালেকশন', visible: true, order: 2 },
      { id: 'lookbook', label: 'লুকবুক', visible: true, order: 3 },
      { id: 'all-products', label: 'সকল পণ্য', visible: true, order: 4 },
      { id: 'testimonials', label: 'টেস্টিমোনিয়াল', visible: true, order: 5 },
    ],
    defaultTheme: {
      primaryColor: '#1A1A1A',
      secondaryColor: '#8B0000',
      accentColor: '#C9A84C',
      bgColor: '#FAFAF8',
      textColor: '#1A1A1A',
      headerBg: '#1A1A1A',
      headerText: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardBorder: '#E8E8E8',
      buttonRadius: '0px',
      cardRadius: '2px',
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: 'lg',
      shadow: 'none',
      headerStyle: 'transparent',
      footerStyle: 'minimal',
    }
  },
  'grocery-pro': {
    id: 'grocery-pro',
    name: 'Grocery Pro',
    namebn: 'গ্রোসারি প্রো',
    tagline: 'Fresh market, fast checkout',
    category: 'grocery',
    tags: ['grocery', 'food', 'market', 'fresh'],
    preview: '/templates/grocery-pro/preview.png',
    mobilePreview: '/templates/grocery-pro/mobile-preview.png',
    accentColor: '#2E7D32',
    darkMode: false,
    complexity: 'standard',
    recommended: ['grocery', 'food', 'market'],
    sections: [
      { id: 'offer-banner', label: 'অফার ব্যানার', visible: true, order: 0 },
      { id: 'quick-categories', label: 'দ্রুত ক্যাটাগরি', visible: true, order: 1 },
      { id: 'daily-deals', label: 'ডেইলি ডিলস', visible: true, order: 2 },
      { id: 'all-products', label: 'সকল পণ্য', visible: true, order: 3 },
      { id: 'delivery-info', label: 'ডেলিভারি তথ্য', visible: true, order: 4 },
      { id: 'faq', label: 'FAQ', visible: true, order: 5 },
    ],
    defaultTheme: {
      primaryColor: '#2E7D32',
      secondaryColor: '#1B5E20',
      accentColor: '#FF6F00',
      bgColor: '#F1F8E9',
      textColor: '#1A1A1A',
      headerBg: '#2E7D32',
      headerText: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardBorder: '#C8E6C9',
      buttonRadius: '50px',
      cardRadius: '16px',
      fontFamily: 'Inter, sans-serif',
      fontSize: 'base',
      shadow: 'lg',
      headerStyle: 'sticky',
      footerStyle: 'compact',
    }
  },
  'electronics-hub': {
    id: 'electronics-hub',
    name: 'Electronics Hub',
    namebn: 'ইলেকট্রনিক্স হাব',
    tagline: 'Tech store with specs comparison',
    category: 'electronics',
    tags: ['electronics', 'tech', 'gadgets', 'specs'],
    preview: '/templates/electronics-hub/preview.png',
    mobilePreview: '/templates/electronics-hub/mobile-preview.png',
    accentColor: '#0066CC',
    darkMode: true,
    complexity: 'advanced',
    recommended: ['electronics', 'tech', 'gadgets'],
    sections: [
      { id: 'tech-hero', label: 'টেক হিরো', visible: true, order: 0 },
      { id: 'brand-logos', label: 'ব্র্যান্ড লোগো', visible: true, order: 1 },
      { id: 'featured-products', label: 'ফিচার পণ্য', visible: true, order: 2 },
      { id: 'category-grid', label: 'ক্যাটাগরি গ্রিড', visible: true, order: 3 },
      { id: 'all-products', label: 'সকল পণ্য', visible: true, order: 4 },
      { id: 'specs-table', label: 'স্পেসিফিকেশন', visible: false, order: 5 },
    ],
    defaultTheme: {
      primaryColor: '#0066CC',
      secondaryColor: '#1A1A2E',
      accentColor: '#00D4FF',
      bgColor: '#0D1117',
      textColor: '#E6EDF3',
      headerBg: '#161B22',
      headerText: '#E6EDF3',
      cardBg: '#21262D',
      cardBorder: '#30363D',
      buttonRadius: '6px',
      cardRadius: '12px',
      fontFamily: '"Roboto Mono", monospace',
      fontSize: 'base',
      shadow: 'xl',
      headerStyle: 'fixed',
      footerStyle: 'full',
    }
  },
  'minimal-store': {
    id: 'minimal-store',
    name: 'Minimal Store',
    namebn: 'মিনিমাল স্টোর',
    tagline: 'Clean, distraction-free shopping',
    category: 'general',
    tags: ['minimal', 'clean', 'simple', 'boutique'],
    preview: '/templates/minimal-store/preview.png',
    mobilePreview: '/templates/minimal-store/mobile-preview.png',
    accentColor: '#333333',
    darkMode: false,
    complexity: 'simple',
    recommended: ['boutique', 'art', 'handcraft'],
    sections: [
      { id: 'minimal-hero', label: 'মিনিমাল হিরো', visible: true, order: 0 },
      { id: 'all-products', label: 'সকল পণ্য', visible: true, order: 1 },
      { id: 'about-section', label: 'সম্পর্কে', visible: true, order: 2 },
    ],
    defaultTheme: {
      primaryColor: '#333333',
      secondaryColor: '#666666',
      accentColor: '#333333',
      bgColor: '#FFFFFF',
      textColor: '#111111',
      headerBg: '#FFFFFF',
      headerText: '#111111',
      cardBg: '#FFFFFF',
      cardBorder: '#EEEEEE',
      buttonRadius: '2px',
      cardRadius: '4px',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: 'base',
      shadow: 'none',
      headerStyle: 'static',
      footerStyle: 'minimal',
    }
  },
  'fashion-boutique': {
    id: 'fashion-boutique',
    name: 'Fashion Boutique',
    namebn: 'ফ্যাশন বুটিক',
    tagline: 'Trendy clothing & accessories',
    category: 'fashion',
    tags: ['fashion', 'clothing', 'boutique', 'trendy'],
    preview: '/templates/fashion-boutique/preview.png',
    mobilePreview: '/templates/fashion-boutique/mobile-preview.png',
    accentColor: '#E91E8C',
    darkMode: false,
    complexity: 'standard',
    recommended: ['fashion', 'clothing', 'beauty'],
    sections: [
      { id: 'fashion-hero', label: 'ফ্যাশন হিরো', visible: true, order: 0 },
      { id: 'new-arrivals', label: 'নতুন আরাইভাল', visible: true, order: 1 },
      { id: 'featured-products', label: 'ফিচার পণ্য', visible: true, order: 2 },
      { id: 'category-strip', label: 'ক্যাটাগরি স্ট্রিপ', visible: true, order: 3 },
      { id: 'all-products', label: 'সকল পণ্য', visible: true, order: 4 },
      { id: 'reviews', label: 'রিভিউ', visible: true, order: 5 },
    ],
    defaultTheme: {
      primaryColor: '#E91E8C',
      secondaryColor: '#880E4F',
      accentColor: '#F48FB1',
      bgColor: '#FFF9FB',
      textColor: '#1A0010',
      headerBg: '#FFFFFF',
      headerText: '#1A0010',
      cardBg: '#FFFFFF',
      cardBorder: '#FCE4EC',
      buttonRadius: '50px',
      cardRadius: '20px',
      fontFamily: '"Nunito", sans-serif',
      fontSize: 'base',
      shadow: 'md',
      headerStyle: 'sticky',
      footerStyle: 'compact',
    }
  },
  'dark-luxury': {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    namebn: 'ডার্ক লাক্সারি',
    tagline: 'Premium dark-theme experience',
    category: 'luxury',
    tags: ['dark', 'luxury', 'premium', 'night'],
    preview: '/templates/dark-luxury/preview.png',
    mobilePreview: '/templates/dark-luxury/mobile-preview.png',
    accentColor: '#C9A84C',
    darkMode: true,
    complexity: 'premium',
    recommended: ['luxury', 'jewelry', 'watches'],
    sections: [
      { id: 'dark-hero', label: 'ডার্ক হিরো', visible: true, order: 0 },
      { id: 'featured-products', label: 'ফিচার পণ্য', visible: true, order: 1 },
      { id: 'all-products', label: 'সকল পণ্য', visible: true, order: 2 },
      { id: 'testimonials', label: 'টেস্টিমোনিয়াল', visible: true, order: 3 },
    ],
    defaultTheme: {
      primaryColor: '#C9A84C',
      secondaryColor: '#8B6914',
      accentColor: '#FFD700',
      bgColor: '#0A0A0A',
      textColor: '#E8E8E8',
      headerBg: '#111111',
      headerText: '#C9A84C',
      cardBg: '#1A1A1A',
      cardBorder: '#2A2A2A',
      buttonRadius: '4px',
      cardRadius: '8px',
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: 'lg',
      shadow: 'xl',
      headerStyle: 'fixed',
      footerStyle: 'full',
    }
  },
};

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'সব টেমপ্লেট', labelEn: 'All Templates' },
  { id: 'general', label: 'সাধারণ', labelEn: 'General' },
  { id: 'fashion', label: 'ফ্যাশন', labelEn: 'Fashion' },
  { id: 'grocery', label: 'গ্রোসারি', labelEn: 'Grocery' },
  { id: 'electronics', label: 'ইলেকট্রনিক্স', labelEn: 'Electronics' },
  { id: 'luxury', label: 'লাক্সারি', labelEn: 'Luxury' },
];

export const getTemplateById = (id) => {
  return TEMPLATES[id] || TEMPLATES['modern-commerce'];
};

export const getTemplateList = () => {
  return Object.values(TEMPLATES);
};

export const getTemplatesByCategory = (category) => {
  if (!category || category === 'all') return getTemplateList();
  return getTemplateList().filter(t => t.category === category || t.tags.includes(category));
};

/**
 * AI-based template suggestion
 * Given a store description, return best matching template
 */
export const suggestTemplateFromDescription = (description = '') => {
  const lowerDesc = description.toLowerCase();
  
  const keywords = {
    'luxury-fashion': ['luxury', 'premium', 'high-end', 'exclusive', 'লাক্সারি', 'প্রিমিয়াম', 'boutique', 'fashion store'],
    'grocery-pro': ['grocery', 'food', 'market', 'fresh', 'vegetable', 'গ্রোসারি', 'খাবার', 'বাজার', 'তরকারি'],
    'electronics-hub': ['electronics', 'tech', 'gadget', 'phone', 'laptop', 'ইলেকট্রনিক', 'মোবাইল', 'ল্যাপটপ'],
    'fashion-boutique': ['fashion', 'clothing', 'dress', 'wear', 'পোশাক', 'ফ্যাশন', 'কাপড়', 'boutique'],
    'dark-luxury': ['dark', 'jewelry', 'watch', 'gold', 'গহনা', 'ঘড়ি', 'সোনা'],
    'minimal-store': ['minimal', 'simple', 'clean', 'art', 'handcraft', 'মিনিমাল', 'সরল', 'হস্তশিল্প'],
  };
  
  let bestMatch = 'modern-commerce';
  let bestScore = 0;
  
  Object.entries(keywords).forEach(([templateId, words]) => {
    const score = words.reduce((acc, word) => acc + (lowerDesc.includes(word) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = templateId;
    }
  });
  
  return TEMPLATES[bestMatch] || TEMPLATES['modern-commerce'];
};

/**
 * AI color palette suggestions based on store type
 */
export const AI_COLOR_PALETTES = {
  luxury: {
    name: 'লাক্সারি গোল্ড',
    primaryColor: '#1A1A1A',
    accentColor: '#C9A84C',
    bgColor: '#FAFAF8',
  },
  fashion: {
    name: 'রোজ গোল্ড',
    primaryColor: '#E91E8C',
    accentColor: '#F48FB1',
    bgColor: '#FFF9FB',
  },
  grocery: {
    name: 'ফ্রেশ গ্রিন',
    primaryColor: '#2E7D32',
    accentColor: '#FF6F00',
    bgColor: '#F1F8E9',
  },
  electronics: {
    name: 'টেক ব্লু',
    primaryColor: '#0066CC',
    accentColor: '#00D4FF',
    bgColor: '#0D1117',
  },
  general: {
    name: 'ক্লাসিক অরেঞ্জ',
    primaryColor: '#FF6B00',
    accentColor: '#FEBD69',
    bgColor: '#FFFFFF',
  },
};

export default TEMPLATES;
