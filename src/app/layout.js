import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Decouple platform base URL from any tenant shop environment variables
const BASE_URL = 'https://bdretailers.com';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'BD Retailers (বিডি রিটেইলার) — সেরা অনলাইন শপিং ও বিশ্বস্ত ই-কমার্স প্ল্যাটফর্ম',
    template: '%s | BD Retailers',
  },
  description: 'বিডি রিটেইলার (BD Retailers) — বাংলাদেশের সেরা অনলাইন শপিং মার্কেটপ্লেস ও আধুনিক AI ই-কমার্স প্ল্যাটফর্ম। গ্রোসারি, ফ্যাশন ও গ্যাজেট কিনুন সুলভ মূল্যে ক্যাশ অন ডেলিভারিতে, অথবা মাত্র ১ মিনিটে নিজের ফ্রি অনলাইন স্টোর খুলুন।',
  keywords: [
    'বিডি রিটেইলার', 'বিডি রিটেইলার্স', 'bd retailers', 'bdretailers', 'retailer bd', 'bd retailer',
    'online shopping bangladesh', 'অনলাইন শপিং বাংলাদেশ', 'ecommerce bangladesh', 'online store bangladesh',
    'saas ecommerce', 'shopify alternative bangladesh', 'online shop create bangladesh', 'বাংলাদেশ ই-কমার্স',
    'অনলাইন স্টোর', 'ডিজিটাল শপ', 'steadfast courier integration', 'uddoktapay', 'bkash payment',
    'nagad payment', 'retailer platform bd', 'white label ecommerce', 'multi vendor marketplace bangladesh',
    'free online store bangladesh', 'পাইকারি ও খুচরা বাজার'
  ],
  authors: [{ name: 'BD Retailers', url: BASE_URL }],
  creator: 'BD Retailers',
  publisher: 'BD Retailers',
  manifest: '/api/manifest',
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
    siteName: 'BD Retailers (বিডি রিটেইলার)',
    title: 'BD Retailers (বিডি রিটেইলার) — সেরা অনলাইন শপিং ও বিশ্বস্ত ই-কমার্স প্ল্যাটফর্ম',
    description: 'বিডি রিটেইলার (BD Retailers) — বাংলাদেশের শীর্ষ অনলাইন শপিং মার্কেটপ্লেস ও এআই-পাওয়ার্ড ই-কমার্স সমাধান। সুলভ মূল্যে কেনাকাটা ও দ্রুত ফ্রি অনলাইন শপ তৈরি করুন।',
    images: [{ url: `${BASE_URL}/logo.png`, width: 512, height: 512, alt: 'BD Retailers (বিডি রিটেইলার) — সেরা অনলাইন শপিং ও ই-কমার্স প্ল্যাটফর্ম' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BD Retailers (বিডি রিটেইলার) — অনলাইন শপিং ও ই-কমার্স প্ল্যাটফর্ম',
    description: 'বিডি রিটেইলার (BD Retailers) — বাংলাদেশের শীর্ষ অনলাইন শপিং মার্কেটপ্লেস ও এআই-পাওয়ার্ড ই-কমার্স সমাধান। ৩০ দিনের ফ্রি ট্রায়াল। মাত্র ১ মিনিটে স্টোর খুলুন।',
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
 
 // JSON-LD Structured Data for Google Search Branding & Rich Snippets
 function JsonLd() {
   const structuredData = [
      // Organization — Google search logo + brand
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "BD Retailers",
        "alternateName": ["বিডি রিটেইলার", "বিডি রিটেইলার্স", "BDRetailers", "retailer bd", "bdretailers.com"],
        "url": BASE_URL,
        "logo": `${BASE_URL}/logo.png`,
        "image": `${BASE_URL}/logo.png`,
        "description": "বিডি রিটেইলার (BD Retailers) — বাংলাদেশের সবচেয়ে আধুনিক এআই-পাওয়ার্ড মাল্টি-ভেন্ডর মার্কেটপ্লেস ও ই-কমার্স সলিউশন।",
        "sameAs": [
          "https://www.facebook.com/bdretailers",
          "https://play.google.com/store/apps/details?id=com.bdretailers"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+8801350783000",
          "contactType": "customer service",
          "areaServed": "BD",
          "availableLanguage": ["Bengali", "English"]
        }
      },
      // Google Business Profile Local Entity matching verified GMB profile
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "BD Retailers (বিডি রিটেইলার)",
        "alternateName": ["BD Retailers", "বিডি রিটেইলার", "বিডি রিটেইলার্স", "bdretailers.com"],
        "url": BASE_URL,
        "telephone": "+8801350783000",
        "image": `${BASE_URL}/logo.png`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Rangpur City",
          "addressLocality": "Rangpur",
          "postalCode": "5400",
          "addressCountry": "BD"
        },
        "priceRange": "৳",
        "openingHours": "Mo-Su 00:00-24:00",
        "description": "বিডি রিটেইলার (BD Retailers) — বাংলাদেশের আধুনিক ই-কমার্স প্ল্যাটফর্ম ও ভেরিফায়েড রিটেইল হাব।"
      },
      // WebSite — Google search box & SearchAction
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "BD Retailers (বিডি রিটেইলার)",
        "alternateName": ["BD Retailers", "বিডি রিটেইলার", "bdretailers", "BDRetailers", "retailer bd"],
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
        "name": "BD Retailers (বিডি রিটেইলার) — সেরা অনলাইন শপিং মার্কেটপ্লেস",
        "description": "বাংলাদেশের প্রথম ও সবচেয়ে প্রিমিয়াম এআই-পাওয়ার্ড অনলাইন মার্কেটপ্লেস ও ই-কমার্স প্ল্যাটফর্ম — BD Retailers (বিডি রিটেইলার)।"
      },
      // FAQPage — Google Rich Snippets for BD Retailers
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "বিডি রিটেইলার (BD Retailers) কী?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "বিডি রিটেইলার (BD Retailers / bdretailers.com) হলো বাংলাদেশের শীর্ষস্থানীয় মাল্টি-ভেন্ডর অনলাইন শপিং মার্কেটপ্লেস এবং আধুনিক AI ই-কমার্স প্ল্যাটফর্ম। এখানে সুলভ মূল্যে গ্রোসারি, ফ্যাশন ও টেক গ্যাজেট কেনাকাটা করা যায় এবং যেকোনো ব্যবসায়ী মাত্র ১ মিনিটে ফ্রি অনলাইন স্টোর খুলতে পারেন।"
            }
          },
          {
            "@type": "Question",
            "name": "বিডি রিটেইলার এ কীভাবে কেনাকাটা বা অর্ডার করবেন?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "bdretailers.com এ প্রবেশ করে আপনার পছন্দের পণ্য কার্টে যোগ করে সরাসরি ক্যাশ অন ডেলিভারি (COD) অথবা বিকাশ/নগদ পেমেন্টে সহজ চেকআউট সম্পন্ন করতে পারবেন। সারাদেশে দ্রুত হোম ডেলিভারি পাওয়া যায়।"
            }
          },
          {
            "@type": "Question",
            "name": "BD Retailers এ কীভাবে অনলাইন স্টোর বা দোকান খুলবেন?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "মার্চেন্ট হতে Become Retailer বাটনে ক্লিক করে নাম, দোকানের নাম, মোবাইল নম্বর দিয়ে মাত্র ১ মিনিটেই ফ্রি রেজিস্ট্রেশন সম্পন্ন করুন। কোনো কোডিং জ্ঞান ছাড়াই স্বয়ংক্রিয়ভাবে আপনার অনলাইন শপ তৈরি হয়ে যাবে।"
            }
          },
          {
            "@type": "Question",
            "name": "বিডি রিটেইলার এ ডেলিভারি ও পেমেন্ট ব্যবস্থা কেমন?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "বিডি রিটেইলার এ স্টেডফাস্ট কুরিয়ার (Steadfast Courier) এর সাথে ফুল অটোমেশন রয়েছে, যার ফলে সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধা পাওয়া যায়। পাশাপাশি বিকাশ, নগদ ও কার্ড পেমেন্ট সম্পূর্ণ সুরক্ষিতভাবে সম্পন্ন হয়।"
            }
          }
        ]
      },
      // SoftwareApplication — AI & Search Engine SaaS Product Entity
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "BD Retailers Webmaa",
        "alternateName": ["BD Retailers App", "বিডি রিটেইলার্স অ্যাপ", "BDRetailers E-commerce SaaS"],
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
