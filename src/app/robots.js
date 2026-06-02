export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/superadmin/'],
    },
    sitemap: 'https://daripallah.com/sitemap.xml',
  };
}

