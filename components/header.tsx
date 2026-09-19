'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CartDrawer } from '@/components/cart-drawer';
import { BrandMark } from '@/components/brand-mark';

const navLinks = [
  { href: '/products', label: 'Shop all' },
  { href: '/products?sort=newest', label: 'New arrivals' },
  { href: '/category/electronics', label: 'Electronics' },
  { href: '/category/smartphones', label: 'Smartphones' },
  { href: '/category/laptops', label: 'Laptops' },
  { href: '/category/audio', label: 'Audio' },
];

export function Header() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9 rounded-xl" />
          <span className="text-xl font-bold tracking-tight">
            NOVA<span className="text-primary">/</span>MARKET
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          {session?.user?.role === 'ADMIN' && (
            <Link
              href="/admin/products"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex">
            <Link href="/search" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>

          {session?.user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="icon">
                <Link href="/profile" aria-label="Profile">
                  <UserRound className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          )}

          <CartDrawer />

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {session?.user ? (
                  <>
                    {session.user.role === 'ADMIN' && (
                      <Link
                        href="/admin/products"
                        className="text-sm font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="text-sm font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      className="text-left text-sm font-medium text-muted-foreground"
                      onClick={() => signOut()}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="text-sm font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
