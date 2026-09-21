// File: app/robots.ts
import { MetadataRoute } from 'next';
import { requireUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? requireUrl('NEXT_PUBLIC_APP_URL')
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/products',
          '/products/*',
          '/category',
          '/category/*',
          '/search',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api',
          '/api/*',
          '/profile',
          '/orders',
          '/orders/*',
          '/cart',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/products',
          '/products/*',
          '/category',
          '/category/*',
          '/search',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api',
          '/api/*',
          '/profile',
          '/orders',
          '/orders/*',
          '/cart',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
