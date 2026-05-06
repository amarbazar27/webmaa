export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/superadmin/'],
    },
    sitemap: 'https://webmaa.vercel.app/sitemap.xml',
  };
}
