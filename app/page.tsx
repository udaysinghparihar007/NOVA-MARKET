// File: app/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Headphones, Laptop, Smartphone, Sparkles, Star, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/product-grid';
import { ProductCard } from '@/components/product-card';
import { ProductGridSkeleton } from '@/components/product-grid-skeleton';
import { NewsletterForm } from '@/components/newsletter-form';
import { getFeaturedProducts, getNewProducts } from '@/server/queries/products';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Discover amazing products at unbeatable prices. Shop the latest trends and bestsellers.',
  openGraph: {
    title: 'NextJS E-commerce Store - Home',
    description: 'Discover amazing products at unbeatable prices',
    type: 'website',
  },
};

async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (!products.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No featured products available.</p>
      </div>
    );
  }

  return <ProductGrid products={products as any} />;
}

async function NewProducts() {
  const products = await getNewProducts();

  if (!products.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No new products available.</p>
      </div>
    );
  }

  return <ProductGrid products={products.slice(0, 4) as any} />;
}

export default function HomePage() {
  const trustItems = [
    { Icon: Truck, title: 'Free shipping', copy: 'On orders over $100' },
    { Icon: ShieldCheck, title: 'Secure payments', copy: 'Protected checkout' },
    { Icon: RotateCcw, title: '30-day returns', copy: 'Shop with confidence' },
    { Icon: Star, title: '4.9 / 5 rating', copy: 'Loved by our community' },
  ];
  const discoveryItems = [
    { Icon: Laptop, title: 'Work, beautifully', copy: 'Powerful tools for focused days.', href: '/category/electronics' },
    { Icon: Smartphone, title: 'Stay in sync', copy: 'The essentials that move with you.', href: '/category/electronics' },
    { Icon: Headphones, title: 'Find your frequency', copy: 'Immersive sound, wherever you are.', href: '/category/electronics' },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              <Sparkles className="h-3.5 w-3.5" /> The new standard in shopping
            </div>
            <h1 className="text-balance text-5xl font-bold leading-[1.03] text-white sm:text-6xl lg:text-7xl">
              Better tech for the way you <span className="text-blue-400">live now.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
              Discover considered electronics and everyday upgrades, selected for performance, design, and a little more joy.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full bg-blue-500 px-7 text-white hover:bg-blue-400">
                <Link href="/products">Shop the collection <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full border-white/20 bg-white/5 px-7 text-white hover:bg-white hover:text-slate-950">
                <Link href="/products?sort=newest">See what&apos;s new</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-blue-500/30 to-cyan-300/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-7 shadow-2xl">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span>Featured drop</span><span className="text-blue-300">01 / 03</span>
              </div>
              <div className="mt-8 flex aspect-square items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 via-slate-800 to-cyan-400/10">
                <Headphones className="h-40 w-40 text-blue-300 drop-shadow-[0_20px_35px_rgba(96,165,250,.25)] sm:h-52 sm:w-52" strokeWidth={1} />
              </div>
              <div className="mt-6 flex items-end justify-between gap-4">
                <div><p className="text-xl font-semibold text-white">Sound, refined.</p><p className="mt-1 text-sm text-slate-400">Premium audio for every moment.</p></div>
                <Link href="/products" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 transition-transform hover:scale-105"><ArrowUpRight className="h-5 w-5" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-4 py-7 sm:grid-cols-4 sm:px-6 lg:px-8">
          {trustItems.map(({ Icon, title, copy }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon className="h-5 w-5 shrink-0 text-primary" />
              <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{copy}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Curated for you</p><h2 className="mt-2 text-3xl font-bold sm:text-4xl">Featured essentials</h2></div>
            <Link href="/products" className="hidden items-center gap-2 text-sm font-semibold text-primary sm:flex">View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-12">
            <Suspense fallback={<ProductGridSkeleton />}>
              <FeaturedProducts />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="bg-slate-100/70 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Just landed</p><h2 className="mt-2 text-3xl font-bold sm:text-4xl">New arrivals</h2></div>
            <Link href="/products?sort=newest" className="hidden items-center gap-2 text-sm font-semibold text-primary sm:flex">Shop new <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-12">
            <Suspense fallback={<ProductGridSkeleton />}>
              <NewProducts />
            </Suspense>
          </div>
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {discoveryItems.map(({ Icon, title, copy, href }) => (
              <Link key={title} href={href} className="group rounded-2xl bg-slate-950 p-6 text-white transition-transform hover:-translate-y-1">
                <Icon className="h-8 w-8 text-blue-400" strokeWidth={1.5} />
                <h3 className="mt-10 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-400">{copy}</p>
                <ArrowUpRight className="mt-6 h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-blue-600 px-6 py-14 text-center sm:px-12">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Stay in the loop</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Good things, once in a while.</h2>
            <p className="mx-auto mt-4 max-w-xl text-blue-100">New drops, considered recommendations, and member-only offers. No clutter.</p>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
