'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type FeaturedProduct = {
  name: string;
  slug: string;
  images: Array<{
    url: string;
    altText?: string | null;
  }>;
};

export function FeaturedDropSlider({
  products,
}: {
  products: FeaturedProduct[];
}) {
  const [activeIndex, setActiveIndex] = useState(() => {
    const iphoneIndex = products.findIndex((product) =>
      product.slug.includes('iphone')
    );

    return iphoneIndex >= 0 ? iphoneIndex : 0;
  });

  const product = products[activeIndex];
  const image = product?.images[0];

  useEffect(() => {
    if (products.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % products.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [products.length]);

  if (!product) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[40px] bg-gradient-to-br from-blue-500/20 via-slate-800 to-cyan-400/10">
        <Headphones
          className="h-40 w-40 text-blue-300 sm:h-52 sm:w-52"
          strokeWidth={1}
        />
      </div>
    );
  }

  const goTo = (direction: -1 | 1) => {
    setActiveIndex(
      (current) => (current + direction + products.length) % products.length
    );
  };

  return (
    <div className="relative isolate overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-7 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span>Featured drop</span>

        <span className="text-blue-300">
          {String(activeIndex + 1).padStart(2, '0')} /{' '}
          {String(products.length).padStart(2, '0')}
        </span>
      </div>

      {/* Product */}
      <Link
        href={`/products/${product.slug}`}
        className="group block"
      >
        {/* Image container */}
        <div className="relative mt-8 flex aspect-square overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-500/20 via-slate-800 to-cyan-400/10">
          {image ? (
            <Image
              key={product.slug}
              src={image.url}
              alt={image.altText || product.name}
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 480px"
              unoptimized={image.url.startsWith('/')}
              className="object-contain p-8 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Headphones
                className="h-40 w-40 text-blue-300 sm:h-52 sm:w-52"
                strokeWidth={1}
              />
            </div>
          )}

          {/* Navigation buttons */}
          {products.length > 1 && (
            <div className="absolute inset-x-4 bottom-4 flex justify-between">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full bg-white/90 text-slate-950 hover:bg-white"
                aria-label="Previous featured product"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  goTo(-1);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full bg-white/90 text-slate-950 hover:bg-white"
                aria-label="Next featured product"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  goTo(1);
                }}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Product information */}
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xl font-semibold text-white">
              {product.name}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Curated technology for every moment.
            </p>
          </div>

          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 transition-transform group-hover:scale-105">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </Link>

      {/* Pagination dots */}
      {products.length > 1 && (
        <div
          className="mt-5 flex justify-center gap-1.5"
          aria-label="Featured products"
        >
          {products.map((item, index) => (
            <button
              key={item.slug}
              type="button"
              aria-label={`Show ${item.name}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex
                  ? 'w-7 bg-blue-400'
                  : 'w-1.5 bg-slate-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}