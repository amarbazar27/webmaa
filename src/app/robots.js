export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/superadmin/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://messerbazar.com'}/sitemap.xml`,
  };
}
