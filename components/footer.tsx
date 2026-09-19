'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-white">
            <BrandMark className="h-9 w-9 rounded-xl" />
            <span>NOVA<span className="text-blue-400">/</span>MARKET</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
            Curated technology and everyday essentials for a more connected life.
          </p>
        </div>
        <div>
          <p className="font-semibold text-white">Explore</p>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <Link href="/products" className="block transition-colors hover:text-white">Shop all</Link>
            <Link href="/products?sort=newest" className="block transition-colors hover:text-white">New arrivals</Link>
            <Link href="/search" className="block transition-colors hover:text-white">Search</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white">Customer care</p>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <Link href="/cart" className="block transition-colors hover:text-white">Your cart</Link>
            <Link href="/profile" className="block transition-colors hover:text-white">Account</Link>
            <span className="block">Shipping & returns</span>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white">The fine print</p>
          <p className="mt-4 text-sm leading-6 text-slate-400">Thoughtful products. Clear pricing. No noise.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 text-xs text-slate-500">© 2026 Nova Market. All rights reserved.</div>
      </div>
    </footer>
  );
}
