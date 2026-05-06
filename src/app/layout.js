import './globals.css';
import { Outfit } from 'next/font/google';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://messerbazar.com';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'MesserBazar — মেস বাজার | অনলাইনে মেসের বাজার করুন',
    template: '%s | MesserBazar',
  },
  description: 'MesserBazar — বাংলাদেশের প্রথম মেস বাজার প্ল্যাটফর্ম। ঘরে বসে মেসের বাজার অর্ডার করুন। টাটকা মাছ, মাংস, সবজি, মশলা — সব এক জায়গায়।',
  keywords: ['মেস বাজার', 'mess bazar', 'messer bazar', 'messerbazar', 'বাজার', 'bajar', 'bazar', 'অনলাইন বাজার', 'মেসের বাজার', 'mess bajar', 'grocery delivery bangladesh'],
  authors: [{ name: 'MesserBazar', url: BASE_URL }],
  creator: 'MesserBazar',
  publisher: 'Webmaa',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    url: BASE_URL,
    siteName: 'MesserBazar',
    title: 'MesserBazar — মেস বাজার | অনলাইনে মেসের বাজার করুন',
    description: 'বাংলাদেশের প্রথম মেস বাজার প্ল্যাটফর্ম। টাটকা মাছ, মাংস, সবজি — সব এক জায়গায়।',
    images: [{ url: `${BASE_URL}/logo.png`, width: 512, height: 512, alt: 'MesserBazar Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MesserBazar — মেস বাজার',
    description: 'বাংলাদেশের প্রথম মেস বাজার প্ল্যাটফর্ম। ঘরে বসে মেসের বাজার অর্ডার করুন।',
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

// JSON-LD Structured Data for Google Search Branding
function JsonLd() {
  const structuredData = [
    // Organization — Google search logo + brand
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "MesserBazar",
      "alternateName": ["মেস বাজার", "Messer Bazar", "Mess Bazar", "Mess Bajar"],
      "url": BASE_URL,
      "logo": `${BASE_URL}/logo.png`,
      "image": `${BASE_URL}/logo.png`,
      "description": "বাংলাদেশের প্রথম মেস বাজার প্ল্যাটফর্ম",
      "sameAs": [],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["Bengali", "English"]
      }
    },
    // WebSite — Google search box
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "MesserBazar",
      "alternateName": "মেস বাজার",
      "url": BASE_URL
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
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <JsonLd />
      </head>
      <body className={`${outfit.variable} font-sans antialiased`}>
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
