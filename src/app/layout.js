import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bdretailers.com';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'BDRetailers — বাংলাদেশের সেরা ই-কমার্স SaaS প্ল্যাটফর্ম',
    template: '%s | BDRetailers',
  },
  description: 'BDRetailers — বাংলাদেশের সবচেয়ে আধুনিক AI-পাওয়ার্ড ই-কমার্স SaaS প্ল্যাটফর্ম। মাত্র ১ মিনিটে নিজের অনলাইন স্টোর খুলুন। Steadfast কুরিয়ার, বিকাশ, নগদ, UddoktaPay পেমেন্ট সমর্থিত। ৩০ দিনের ফ্রি ট্রায়াল।',
  keywords: [
    'bdretailers', 'ecommerce bangladesh', 'online store bangladesh', 'saas ecommerce',
    'shopify alternative bangladesh', 'online shop create bangladesh', 'বাংলাদেশ ই-কমার্স',
    'অনলাইন স্টোর', 'ডিজিটাল শপ', 'বিডি রিটেইলার্স', 'steadfast courier integration',
    'uddoktapay', 'bkash payment', 'nagad payment', 'retailer platform bd',
    'white label ecommerce', 'multi vendor marketplace bangladesh', 'free online store bangladesh',
  ],
  authors: [{ name: 'BDRetailers', url: BASE_URL }],
  creator: 'BDRetailers',
  publisher: 'BDRetailers',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ]
  },
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    url: BASE_URL,
    siteName: 'BDRetailers',
    title: 'BDRetailers — বাংলাদেশের সেরা AI ই-কমার্স প্ল্যাটফর্ম',
    description: 'বাংলাদেশের প্রথম AI-পাওয়ার্ড ই-কমার্স SaaS। ৩০ দিনের ফ্রি ট্রায়াল। Steadfast কুরিয়ার, বিকাশ, নগদ সাপোর্ট।',
    images: [{ url: `${BASE_URL}/logo.png`, width: 512, height: 512, alt: 'BDRetailers — বাংলাদেশের সেরা ই-কমার্স প্ল্যাটফর্ম' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BDRetailers — AI ই-কমার্স প্ল্যাটফর্ম বাংলাদেশ',
    description: 'বাংলাদেশের সবচেয়ে আধুনিক AI-پাওয়ার্ড ই-কমার্স SaaS। ৩০ দিনের ফ্রি ট্রায়াল। মাত্র ১ মিনিটে স্টোর খুলুন।',
    images: [`${BASE_URL}/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  minimumScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
 };
 
 // JSON-LD Structured Data for Google Search Branding
 function JsonLd() {
   const structuredData = [
     // Organization — Google search logo + brand
     {
       "@context": "https://schema.org",
       "@type": "Organization",
       "name": "BDRetailers",
       "alternateName": ["BDRetailers SaaS", "bdretailers.com", "বিডি রিটেইলার্স"],
       "url": BASE_URL,
       "logo": `${BASE_URL}/logo.png`,
       "image": `${BASE_URL}/logo.png`,
       "description": "বাংলাদেশের সবচেয়ে আধুনিক এআই-পাওয়ার্ড মাল্টি-ভেন্ডর মার্কেটপ্লেস ও ই-কমার্স সলিউশন।",
       "sameAs": [],
       "contactPoint": {
         "@type": "ContactPoint",
         "contactType": "customer service",
         "availableLanguage": ["Bengali", "English"]
       }
     },
     // WebSite — Google search box & SearchAction
     {
       "@context": "https://schema.org",
       "@type": "WebSite",
       "name": "BDRetailers",
       "alternateName": "BDRetailers eCommerce",
       "url": BASE_URL,
       "potentialAction": {
         "@type": "SearchAction",
         "target": {
           "@type": "EntryPoint",
           "urlTemplate": `${BASE_URL}/?q={search_term_string}`
         },
         "query-input": "required name=search_term_string"
       }
     },
     // WebPage — Entity signals for search optimization
     {
       "@context": "https://schema.org",
       "@type": "WebPage",
       "@id": `${BASE_URL}/#webpage`,
       "url": BASE_URL,
       "name": "BDRetailers — বিডি রিটেইলার্স",
       "description": "বাংলাদেশের প্রথম ও সবচেয়ে প্রিমিয়াম এআই-পাওয়ার্ড অনলাইন মার্কেটপ্লেস।"
     },
     // SoftwareApplication — AI & Search Engine SaaS Product Entity
     {
       "@context": "https://schema.org",
       "@type": "SoftwareApplication",
       "name": "BDRetailers Webmaa",
       "alternateName": "BDRetailers E-commerce SaaS",
       "operatingSystem": "Web, Android, iOS",
       "applicationCategory": "BusinessApplication",
       "offers": {
         "@type": "Offer",
         "price": "0",
         "priceCurrency": "BDT",
         "description": "1-Month Free Trial Available"
       },
       "description": "Premium Bangladeshi E-commerce SaaS Platform to create online stores with Steadfast Courier and UddoktaPay integration in 60 seconds."
     }
  ];

  return (
    <>
      {structuredData.map((data, i) => (
        <script
          key={`ld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="bn" translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <JsonLd />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <main className="relative z-10 min-h-screen">
              {children}
            </main>
            <Toaster 
              position="bottom-left" 
              toastOptions={{ 
                style: { marginBottom: '20px', marginLeft: '20px' } 
              }} 
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
