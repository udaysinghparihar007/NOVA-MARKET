import { PrismaClient, ProductStatus, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const catalog = [
  {
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    description: 'A titanium smartphone with a pro camera system and A17 Pro chip.',
    content:
      'The iPhone 15 Pro combines a lightweight titanium design, an advanced camera system, and the A17 Pro chip for demanding everyday workflows.',
    price: 999.99,
    comparePrice: 1099.99,
    costPrice: 750,
    categorySlug: 'smartphones',
    sku: 'IPH15PRO-128-NT',
    tags: ['smartphone', 'apple', 'ios', 'premium'],
    seoTitle: 'iPhone 15 Pro | NOVA/MARKET',
    seoDescription:
      'Shop the iPhone 15 Pro with titanium design, advanced cameras, and A17 Pro performance.',
    images: [
      '/images/products/iphone-15-pro.svg',
      '/images/products/iphone-15-pro-alt.svg',
    ],
    variants: [
      ['Storage', '128GB', 0],
      ['Storage', '256GB', 100],
      ['Storage', '512GB', 300],
      ['Color', 'Natural Titanium', 0],
      ['Color', 'Blue Titanium', 0],
      ['Color', 'White Titanium', 0],
    ] as const,
  },
  {
    name: 'MacBook Air M2',
    slug: 'macbook-air-m2',
    description: 'A thin, capable laptop powered by the Apple M2 chip.',
    content:
      'MacBook Air with M2 delivers dependable performance, long battery life, and a quiet, portable design for work and study.',
    price: 1199.99,
    comparePrice: 1299.99,
    costPrice: 900,
    categorySlug: 'laptops',
    sku: 'MBA-M2-256-SG',
    tags: ['laptop', 'apple', 'macos', 'm2', 'productivity'],
    seoTitle: 'MacBook Air M2 | NOVA/MARKET',
    seoDescription:
      'Shop MacBook Air M2 for lightweight performance, long battery life, and everyday productivity.',
    images: [
      '/images/products/macbook-air-m2.svg',
      '/images/products/macbook-air-m2-alt.svg',
    ],
    variants: [] as const,
  },
  {
    name: 'Samsung Galaxy S24',
    slug: 'samsung-galaxy-s24',
    description: 'A flagship Android smartphone with an AI-powered camera.',
    content:
      'Galaxy S24 pairs a vivid display and long-lasting battery with intelligent camera features for work, communication, and creativity.',
    price: 899.99,
    comparePrice: 999.99,
    costPrice: 650,
    categorySlug: 'smartphones',
    sku: 'SGS24-256-PH',
    tags: ['smartphone', 'samsung', 'android', 'galaxy', 'mobile'],
    seoTitle: 'Samsung Galaxy S24 | NOVA/MARKET',
    seoDescription:
      'Discover the Samsung Galaxy S24 with an AI-powered camera and all-day battery life.',
    images: [
      '/images/products/samsung-galaxy-s24.svg',
      '/images/products/samsung-galaxy-s24-alt.svg',
    ],
    variants: [] as const,
  },
  {
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    description: 'Wireless headphones with active noise cancellation and rich sound.',
    content:
      'Enjoy immersive sound, active noise cancellation, and up to 30 hours of battery life for focused listening anywhere.',
    price: 199.99,
    comparePrice: 249.99,
    costPrice: 120,
    categorySlug: 'audio',
    sku: 'WH-NC-BLK-BT',
    tags: ['audio', 'headphones', 'wireless', 'bluetooth', 'noise-cancelling'],
    seoTitle: 'Wireless Noise-Cancelling Headphones | NOVA/MARKET',
    seoDescription:
      'Shop wireless headphones with active noise cancellation and 30-hour battery life.',
    images: [
      '/images/products/wireless-headphones.svg',
      '/images/products/wireless-headphones-alt.svg',
    ],
    variants: [] as const,
  },
] as const;

async function main() {
  console.log('Starting NOVA/MARKET seed...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: 'NOVA/MARKET Admin', role: UserRole.ADMIN },
    create: {
      email: adminEmail,
      name: 'NOVA/MARKET Admin',
      role: UserRole.ADMIN,
      password: await hash('admin123', 12),
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: { name: 'NOVA/MARKET Customer' },
    create: {
      email: 'customer@example.com',
      name: 'NOVA/MARKET Customer',
      role: UserRole.USER,
      password: await hash('customer123', 12),
    },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {
      name: 'Electronics',
      description: 'Consumer technology for work, communication, and play.',
      image: '/images/categories/electronics.svg',
      parentId: null,
    },
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Consumer technology for work, communication, and play.',
      image: '/images/categories/electronics.svg',
    },
  });

  const categoryData = [
    ['smartphones', 'Smartphones', 'Mobile devices for work and everyday life.'],
    ['laptops', 'Laptops', 'Portable computers for focused productivity.'],
    ['audio', 'Audio', 'Headphones and speakers for richer listening.'],
  ] as const;

  const categories = new Map<string, string>([['electronics', electronics.id]]);
  for (const [slug, name, description] of categoryData) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name, description, parentId: electronics.id },
      create: { slug, name, description, parentId: electronics.id },
    });
    categories.set(slug, category.id);
  }

  for (const item of catalog) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        content: item.content,
        price: item.price,
        comparePrice: item.comparePrice,
        costPrice: item.costPrice,
        categoryId: categories.get(item.categorySlug),
        status: ProductStatus.PUBLISHED,
        sku: item.sku,
        tags: [...item.tags],
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        content: item.content,
        price: item.price,
        comparePrice: item.comparePrice,
        costPrice: item.costPrice,
        categoryId: categories.get(item.categorySlug),
        status: ProductStatus.PUBLISHED,
        sku: item.sku,
        tags: [...item.tags],
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: item.images.map((url, position) => ({
        productId: product.id,
        url,
        position,
        altText: `${item.name} product image`,
      })),
    });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { quantity: 50, available: 50, reserved: 0 },
      create: { productId: product.id, quantity: 50, available: 50, reserved: 0 },
    });

    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    if (item.variants.length) {
      await prisma.productVariant.createMany({
        data: item.variants.map(([name, value, price], position) => ({
          productId: product.id,
          name,
          value,
          price,
          position,
        })),
      });
    }

    await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: customer.id,
          productId: product.id,
        },
      },
      update: {
        rating: 5,
        title: 'Excellent product',
        content: 'A reliable purchase with thoughtful design and fast delivery.',
        verified: true,
      },
      create: {
        userId: customer.id,
        productId: product.id,
        rating: 5,
        title: 'Excellent product',
        content: 'A reliable purchase with thoughtful design and fast delivery.',
        verified: true,
      },
    });
  }

  const customerCart = await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id },
  });
  const cartProducts = await prisma.product.findMany({
    where: { slug: { in: ['iphone-15-pro', 'macbook-air-m2'] } },
    select: { id: true },
  });
  await prisma.cartItem.deleteMany({ where: { cartId: customerCart.id } });
  await prisma.cartItem.createMany({
    data: cartProducts.map(product => ({
      cartId: customerCart.id,
      productId: product.id,
      quantity: 1,
    })),
  });

  console.log(`Seeded ${catalog.length} technology products.`);
  console.log(`Admin: ${admin.email}`);
}

main()
  .catch(error => {
    console.error('NOVA/MARKET seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
