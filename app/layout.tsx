// File: app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CartProvider } from '@/components/cart-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'NOVA/MARKET',
    template: '%s | NOVA/MARKET',
  },
  description:
    'A database-driven technology marketplace for thoughtful devices, computing, and audio.',
  keywords: ['technology marketplace', 'electronics', 'smartphones', 'laptops', 'audio'],
  authors: [{ name: 'NOVA/MARKET' }],
  creator: 'NOVA/MARKET',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'NOVA/MARKET',
    description: 'A technology marketplace for the way you live and work.',
    siteName: 'NOVA/MARKET',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOVA/MARKET',
    description: 'A technology marketplace for the way you live and work.',
    creator: '@novamarket',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
