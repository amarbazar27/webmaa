import './globals.css';
import { Outfit } from 'next/font/google';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Webmaa - Premium Storefront',
  description: 'Buy products easily and securely',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Microsoft Clarity for Heatmaps & Session Recording */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}
        
        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
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
            {/* PWA and DevTools Blocker removed per user request */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
