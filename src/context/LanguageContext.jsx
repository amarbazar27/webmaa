'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({
  language: 'bn',
  toggleLanguage: () => {},
  setLanguage: () => {},
  t: (bn, en) => bn,
});

export const DICTIONARY = {
  // Navigation & Core Actions
  login: { bn: 'লগইন', en: 'Login' },
  dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  openStore: { bn: 'স্টোর খুলুন', en: 'Open Store' },
  createStore: { bn: 'স্টোর তৈরি করুন', en: 'Create Store' },
  tryItYourself: { bn: 'আপনিও ট্রাই করুন', en: 'Try It Yourself' },
  marketplaceStore: { bn: 'মূল মার্কেটপ্লেস স্টোর', en: 'Main Marketplace Store' },
  goToMarketplace: { bn: 'মার্কেটপ্লেস স্টোরে যান (store.bdretailers.com)', en: 'Go to Marketplace Store (store.bdretailers.com)' },
  cart: { bn: 'শপিং কার্ট', en: 'Shopping Cart' },
  notifications: { bn: 'নোটিফিকেশন', en: 'Notifications' },
  search: { bn: 'সার্চ করুন', en: 'Search' },
  
  // Hero & Showcase
  heroBadge: { 
    bn: 'BD Retailers • আধুনিক ই-কমার্স তৈরির প্ল্যাটফর্ম', 
    en: 'BD Retailers • Modern E-Commerce Creation Platform' 
  },
  heroSubtitlePart1: {
    bn: 'BD Retailers বাংলাদেশের আধুনিক ই-কমার্স প্ল্যাটফর্ম, যেখানে মাত্র ১ মিনিটেই একটি পূর্ণাঙ্গ অনলাইন স্টোর তৈরি করা যায়।',
    en: 'BD Retailers is Bangladesh’s modern e-commerce platform where a complete online store can be built in just 1 minute.'
  },
  heroSubtitlePart2: {
    bn: '-এর মতো ওয়েবসাইট ইতোমধ্যেই আমাদের প্ল্যাটফর্মে পরিচালিত হচ্ছে। আজই আপনার ব্যবসাকে ডিজিটাল রূপ দিন এবং আত্মবিশ্বাসের সঙ্গে অনলাইনে বিক্রি শুরু করুন।',
    en: 'are already running on our platform. Digitize your business today and start selling online with confidence.'
  },
  storeHeroTitle: {
    bn: 'সকল ভেরিফাইড শপের পণ্য এক জায়গায় ব্রাউজ ও কেনাকাটা করুন',
    en: 'Browse & Shop Products from All Verified Stores in One Place'
  },
  storeHeroSubtitle: {
    bn: 'আমাদের প্ল্যাটফর্মের সব বিশ্বস্ত রিটেইলারদের সেরা পণ্য সরাসরি দেখুন ও অর্ডার করুন আমাদের মূল মার্কেটপ্লেস স্টোর থেকে।',
    en: 'Browse and order the best products directly from all trusted retailers across our main marketplace store.'
  },
  
  // Store / Cart / Checkout
  checkout: { bn: 'চেকআউট সম্পন্ন করুন', en: 'Proceed to Checkout' },
  emptyCart: { bn: 'শপিং ব্যাগ খালি করুন', en: 'Empty Cart' },
  totalPrice: { bn: 'সর্বমোট মূল্য', en: 'Total Price' },
  allCategories: { bn: 'সকল ক্যাটাগরি', en: 'All Categories' },
  allStores: { bn: 'সকল স্টোর (All Stores)', en: 'All Stores' },
  addToCart: { bn: 'কার্টে নিন', en: 'Add to Cart' },
  outOfStock: { bn: 'স্টক শেষ', en: 'Out of Stock' },
  noProductsFound: { bn: 'কোনো পণ্য পাওয়া যায়নি', en: 'No products found' },
  verifiedMerchant: { bn: 'ভেরিফাইড মার্চেন্ট', en: 'Verified Merchant' },
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('bn');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bd_preferred_language');
      if (saved === 'en' || saved === 'bn') {
        setLanguageState(saved);
      }
    } catch {}
    setMounted(true);
  }, []);

  const setLanguage = (lang) => {
    const valid = lang === 'en' ? 'en' : 'bn';
    setLanguageState(valid);
    try {
      localStorage.setItem('bd_preferred_language', valid);
      document.documentElement.lang = valid;
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const t = (bnTextOrKey, enText) => {
    // If key exists in dictionary
    if (DICTIONARY[bnTextOrKey]) {
      return DICTIONARY[bnTextOrKey][language] || DICTIONARY[bnTextOrKey].bn;
    }
    // If passed directly as (bn, en)
    if (enText !== undefined) {
      return language === 'en' ? enText : bnTextOrKey;
    }
    return bnTextOrKey;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'bn',
      toggleLanguage: () => {},
      setLanguage: () => {},
      t: (bn, en) => bn,
      mounted: true,
    };
  }
  return context;
}
