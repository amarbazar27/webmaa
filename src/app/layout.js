import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://daripallah.com';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Daripallah — আপনার ব্যবসার ডিজিটাল পার্টনার',
    template: '%s | Daripallah',
  },
  description: 'Daripallah — বাংলাদেশের সবচেয়ে আধুনিক ই-কমার্স প্ল্যাটফর্ম। নিজের অনলাইন স্টোর খুলুন মাত্র ১ মিনিটে।',
  keywords: ['daripallah', 'ecommerce', 'saas', 'online store', 'bangladesh ecommerce', 'retailer platform'],
  authors: [{ name: 'Daripallah', url: BASE_URL }],
  creator: 'Daripallah',
  publisher: 'Daripallah',
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
    siteName: 'Daripallah',
    title: 'Daripallah — আপনার ব্যবসার ডিজিটাল পার্টনার',
    description: 'বাংলাদেশের সবচেয়ে আধুনিক ই-কমার্স প্ল্যাটফর্ম।',
    images: [{ url: `${BASE_URL}/logo.png`, width: 512, height: 512, alt: 'Daripallah Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daripallah — ই-কমার্স প্ল্যাটফর্ম',
    description: 'বাংলাদেশের সবচেয়ে আধুনিক ই-কমার্স প্ল্যাটফর্ম। নিজের অনলাইন স্টোর খুলুন মাত্র ১ মিনিটে।',
    images: [`${BASE_URL}/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
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
      "name": "Daripallah",
      "alternateName": ["Daripallah SaaS", "daripallah.com", "দাঁড়িপাল্লা"],
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
      "name": "Daripallah",
      "alternateName": "Daripallah eCommerce",
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
      "name": "Daripallah — দাঁড়িপাল্লা",
      "description": "বাংলাদেশের প্রথম ও সবচেয়ে প্রিমিয়াম এআই-পাওয়ার্ড অনলাইন মার্কেটপ্লেস।"
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
