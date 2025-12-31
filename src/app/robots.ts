import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Use explicit production URL for robots.txt
  const baseUrl = 'https://pudo-dartmasters.de';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/dashboard/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
