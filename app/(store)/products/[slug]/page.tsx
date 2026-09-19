// File: app/(store)/products/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Star, Heart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import {
  getProductBySlug,
  getRelatedProducts,
} from '@/server/queries/products';
import { AddToCart } from '@/components/add-to-cart';
import { ProductCard } from '@/components/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/utils';
import { JsonLd } from '@/components/jsonld';
import { ProductGallery } from '@/components/product-gallery';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.name,
    description: product.description || undefined,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      type: 'website',
      images: product.images.map(img => ({
        url: img.url,
        width: 1200,
        height: 630,
        alt: product.name,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description || undefined,
      images: product.images.map(img => img.url),
    },
  };
}

export default async function ProductPage(props: ProductPageProps) {
  const params = await props.params;
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = product.categoryId
    ? await getRelatedProducts(product.id, product.categoryId)
    : [];

  const totalReviews = product.reviews.length;
  const averageRating =
    totalReviews > 0
      ? product.reviews.reduce((total, review) => total + review.rating, 0) /
        totalReviews
      : 0;
  const availableQuantity = product.inventory[0]?.available ?? 0;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map(img => img.url),
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'NOVA/MARKET',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability:
        availableQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'NOVA/MARKET',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      reviewCount: totalReviews,
    },
  };

  return (
    <>
      <JsonLd data={structuredData} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/products" className="hover:text-foreground">
                Products
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                href={`/category/${product.category?.slug}`}
                className="hover:text-foreground"
              >
                {product.category?.name}
              </Link>
            </li>
            <li>/</li>
            <li className="font-medium text-foreground">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          {/* Product Images */}
          <ProductGallery productName={product.name} images={product.images} />

          {/* Product Info */}
          <div className="space-y-7 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {product.brand || product.category?.name || 'Featured product'}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
                {product.name}
              </h1>
              <div className="mt-2 flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(averageRating)
                          ? 'fill-current text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {averageRating} ({totalReviews} reviews)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-4xl font-bold tracking-tight text-slate-950">
                  {formatPrice(product.price)}
                </span>
                {product.comparePrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                )}
              </div>
              {product.comparePrice && (
                <Badge variant="secondary">
                  Save{' '}
                  {Math.round(
                    ((Number(product.comparePrice) - Number(product.price)) /
                      Number(product.comparePrice)) *
                      100
                  )}
                  %
                </Badge>
              )}
            </div>

            <p className="text-base leading-7 text-muted-foreground">
              {product.description}
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Badge
                  variant="default"
                  className={
                    availableQuantity > 0
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                  }
                >
                  {availableQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                </Badge>
                {product.sku && (
                  <span className="text-sm text-muted-foreground">
                    SKU: {product.sku}
                  </span>
                )}
              </div>

              <AddToCart
                productId={product.id}
                showQuantitySelector
                maxQuantity={availableQuantity}
                disabled={availableQuantity <= 0}
              />

              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Heart className="mr-2 h-4 w-4" />
                  Add to Wishlist
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            <Separator />

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Truck className="mx-auto h-7 w-7 text-primary" />
                <p className="mt-2 text-sm font-medium">Free Shipping</p>
                <p className="text-xs text-muted-foreground">
                  On orders over $100
                </p>
              </div>
              <div>
                <Shield className="mx-auto h-7 w-7 text-primary" />
                <p className="mt-2 text-sm font-medium">Secure Payment</p>
                <p className="text-xs text-muted-foreground">100% protected</p>
              </div>
              <div>
                <RotateCcw className="mx-auto h-7 w-7 text-primary" />
                <p className="mt-2 text-sm font-medium">Easy Returns</p>
                <p className="text-xs text-muted-foreground">30-day policy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-xl bg-slate-100 p-1">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-8">
              <div className="prose max-w-none">
                <p>{product.content || product.description}</p>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-8">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-2 border-b py-2">
                  <span className="font-medium">SKU</span>
                  <span>{product.sku || 'Not specified'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b py-2">
                  <span className="font-medium">Category</span>
                  <span>{product.category?.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b py-2">
                  <span className="font-medium">Weight</span>
                  <span>{product.weight ? `${product.weight} lbs` : 'Not specified'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b py-2">
                  <span className="font-medium">Dimensions</span>
                  <span>Not specified</span>
                </div>
                {product.variants.map(variant => (
                  <div
                    key={variant.id}
                    className="grid grid-cols-2 gap-2 border-b py-2"
                  >
                    <span className="font-medium">{variant.name}</span>
                    <span>
                      {variant.value}
                      {variant.price ? ` (+${formatPrice(variant.price)})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-8">
              {product.reviews.length > 0 ? (
                <div className="space-y-5">
                  {product.reviews.map(review => (
                    <div key={review.id} className="rounded-2xl border p-5">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        {review.verified && (
                          <Badge variant="secondary">Verified purchase</Badge>
                        )}
                      </div>
                      {review.title && (
                        <h3 className="mt-3 font-semibold">{review.title}</h3>
                      )}
                      {review.content && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {review.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No reviews yet for this product.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="shipping" className="mt-8">
              <div className="prose max-w-none">
                <h3>Shipping Information</h3>
                <ul>
                  <li>Free standard shipping on orders over $100</li>
                  <li>Express shipping available for $15</li>
                  <li>Orders typically process within 1-2 business days</li>
                </ul>

                <h3>Return Policy</h3>
                <ul>
                  <li>30-day return window</li>
                  <li>Items must be in original condition</li>
                  <li>Free return shipping for defective items</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-8 text-2xl font-bold tracking-tight text-gray-900">
              Related Products
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map(relatedProduct => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  name={relatedProduct.name}
                  slug={relatedProduct.slug}
                  price={Number(relatedProduct.price)}
                  comparePrice={
                    relatedProduct.comparePrice
                      ? Number(relatedProduct.comparePrice)
                      : undefined
                  }
                  image={relatedProduct.images[0]?.url}
                  status={relatedProduct.status}
                  category={relatedProduct.category || undefined}
                  inStock={
                    relatedProduct.inventory?.[0]?.available
                      ? relatedProduct.inventory[0].available > 0
                      : true
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
