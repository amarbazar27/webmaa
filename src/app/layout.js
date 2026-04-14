import './globals.css';
import { Outfit } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Webmaa - Premium Storefront',
  description: 'Buy products easily and securely',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <main className="relative z-10 min-h-screen">
              {children}
            </main>
            <Toaster 
              position="bottom-right" 
              toastOptions={{ 
                style: { marginBottom: '20px', marginRight: '20px' } 
              }} 
            />
            {/* Service Worker Registration for PWA */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').then(function(registration) {
                        console.log('SW registered: ', registration.scope);
                      }).catch(function(err) {
                        console.log('SW registration failed: ', err);
                      });
                    });
                  }
                `,
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
