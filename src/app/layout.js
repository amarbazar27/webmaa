import './globals.css';
import { Outfit } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Messer Bazar',
  description: 'Online grocery & daily needs marketplace',
  openGraph: {
    title: 'Messer Bazar',
    description: 'Online grocery & daily needs marketplace',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Messer Bazar Logo' }]
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
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
