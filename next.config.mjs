/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚡ TASK 1: Performance - Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'www.gstatic.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },

  // ⚡ TASK 1: Performance - Bundle Optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  // ⚡ TASK 1: Performance - Turbopack (dev only)
  experimental: {
    optimizePackageImports: ['lucide-react', 'firebase', '@firebase/firestore'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self), interest-cohort=()' },
        ],
      },
      // Cache static assets for 1 year
      {
        source: '/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache optimized images
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=31536000' },
        ],
      },
      // API routes — no cache, CORS restricted
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },

  // ⚡ CRITICAL FIX: Required for Firebase Auth to work on custom domains
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://webmaa-app.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
