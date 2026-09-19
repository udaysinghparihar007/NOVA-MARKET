import prisma from '@/lib/prisma';
import { CACHE_TAGS, createCachedFunction } from '@/lib/cache';
import type { Prisma } from '@prisma/client';
import type { ProductFilterInput } from '@/lib/validators';

const storefrontRelations = {
  category: {
    select: { id: true, name: true, slug: true },
  },
  images: {
    select: { url: true, altText: true },
    orderBy: { position: 'asc' as const },
  },
  inventory: {
    select: { available: true },
  },
  reviews: {
    select: { rating: true },
  },
} satisfies Prisma.ProductInclude;

const detailRelations = {
  category: true,
  images: {
    select: { url: true, altText: true, position: true },
    orderBy: { position: 'asc' as const },
  },
  variants: {
    orderBy: { position: 'asc' as const },
  },
  inventory: true,
  reviews: {
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      rating: true,
      title: true,
      content: true,
      verified: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ProductInclude;

type DecimalProduct = {
  price: Prisma.Decimal;
  comparePrice: Prisma.Decimal | null;
};

const serializeProduct = <T extends DecimalProduct>(product: T) => ({
  ...product,
  price: Number(product.price),
  comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
});

const getOrderBy = (
  sort: string | undefined,
  defaultOrder: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
): Prisma.ProductOrderByWithRelationInput => {
  switch (sort) {
    case 'price-low':
      return { price: 'asc' };
    case 'price-high':
      return { price: 'desc' };
    case 'name':
      return { name: 'asc' };
    case 'popular':
    case 'rating':
      return { reviews: { _count: 'desc' } };
    default:
      return defaultOrder;
  }
};

const getCategoryDescendantIds = async (categoryId: string) => {
  const categories = await prisma.category.findMany({
    select: { id: true, parentId: true },
  });
  const ids = new Set([categoryId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        changed = true;
      }
    }
  }

  return [...ids];
};

export const getProducts = createCachedFunction(
  async (filters?: Partial<ProductFilterInput>) => {
    const {
      category,
      minPrice,
      maxPrice,
      tags,
      active = true,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters || {};

    const where: Prisma.ProductWhereInput = {
      status: active ? 'PUBLISHED' : { not: 'PUBLISHED' },
      ...(category ? { category: { slug: category } } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(tags?.length ? { tags: { hasSome: tags } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
              { tags: { has: search.toLowerCase() } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sortBy === 'price'
        ? { price: sortOrder === 'asc' ? 'asc' : 'desc' }
        : sortBy === 'name'
          ? { name: sortOrder === 'asc' ? 'asc' : 'desc' }
          : sortBy === 'updatedAt'
            ? { updatedAt: sortOrder === 'asc' ? 'asc' : 'desc' }
            : { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: storefrontRelations,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map(serializeProduct),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },
  [CACHE_TAGS.products],
  300
);

export const getProduct = createCachedFunction(
  async (slug: string) => {
    const product = await prisma.product.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: storefrontRelations,
    });
    return product ? serializeProduct(product) : null;
  },
  [CACHE_TAGS.product],
  300
);

export const getProductById = createCachedFunction(
  async (id: string) => {
    const product = await prisma.product.findFirst({
      where: { id, status: 'PUBLISHED' },
      include: storefrontRelations,
    });
    return product ? serializeProduct(product) : null;
  },
  [CACHE_TAGS.product],
  300
);

export const getFeaturedProducts = createCachedFunction(
  async (limit = 8) => {
    const products = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: storefrontRelations,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return products.map(serializeProduct);
  },
  [CACHE_TAGS.products],
  600
);

export const getRelatedProducts = createCachedFunction(
  async (productId: string, categoryId: string, limit = 4) => {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        status: 'PUBLISHED',
        NOT: { id: productId },
      },
      include: storefrontRelations,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return products.map(serializeProduct);
  },
  [CACHE_TAGS.products],
  300
);

type SearchOptions = {
  query: string;
  page?: number;
  limit?: number;
  sort?: string;
  categoryFilter?: string;
  minPrice?: number;
  maxPrice?: number;
};

export const searchProducts = createCachedFunction(
  async (queryOrOptions: string | SearchOptions, legacyFilters: Partial<ProductFilterInput> = {}) => {
    const options: SearchOptions =
      typeof queryOrOptions === 'string'
        ? { query: queryOrOptions, ...legacyFilters }
        : queryOrOptions;
    const query = options.query.trim();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {
      status: 'PUBLISHED',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } },
      ],
      ...(options.categoryFilter
        ? { category: { slug: options.categoryFilter } }
        : {}),
      ...(options.minPrice !== undefined || options.maxPrice !== undefined
        ? {
            price: {
              ...(options.minPrice !== undefined ? { gte: options.minPrice } : {}),
              ...(options.maxPrice !== undefined ? { lte: options.maxPrice } : {}),
            },
          }
        : {}),
    };
    const orderBy =
      options.sort === 'price-low'
        ? { price: 'asc' as const }
        : options.sort === 'price-high'
          ? { price: 'desc' as const }
          : options.sort === 'name'
            ? { name: 'asc' as const }
            : { createdAt: 'desc' as const };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: storefrontRelations,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map(serializeProduct),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },
  [CACHE_TAGS.products],
  300
);

type CategoryProductOptions = {
  categoryId: string;
  page?: number;
  limit?: number;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
};

export const getProductsByCategory = createCachedFunction(
  async (options: CategoryProductOptions | string, legacyPage = 1, legacyLimit = 20) => {
    const normalized: CategoryProductOptions =
      typeof options === 'string'
        ? { categoryId: options, page: legacyPage, limit: legacyLimit }
        : options;
    const page = normalized.page || 1;
    const limit = normalized.limit || 20;
    const categoryIds = await getCategoryDescendantIds(normalized.categoryId);
    const where: Prisma.ProductWhereInput = {
      categoryId: { in: categoryIds },
      status: 'PUBLISHED',
      ...(normalized.minPrice !== undefined || normalized.maxPrice !== undefined
        ? {
            price: {
              ...(normalized.minPrice !== undefined ? { gte: normalized.minPrice } : {}),
              ...(normalized.maxPrice !== undefined ? { lte: normalized.maxPrice } : {}),
            },
          }
        : {}),
    };
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: storefrontRelations,
        orderBy: getOrderBy(normalized.sort),
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map(serializeProduct),
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    };
  },
  [CACHE_TAGS.products, CACHE_TAGS.categories],
  300
);

export const getAllProductsPaginated = createCachedFunction(
  async (options: {
    page?: number;
    limit?: number;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const where: Prisma.ProductWhereInput = {
      status: 'PUBLISHED',
      ...(options.minPrice !== undefined || options.maxPrice !== undefined
        ? {
            price: {
              ...(options.minPrice !== undefined ? { gte: options.minPrice } : {}),
              ...(options.maxPrice !== undefined ? { lte: options.maxPrice } : {}),
            },
          }
        : {}),
    };
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: storefrontRelations,
        orderBy: getOrderBy(options.sort),
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map(serializeProduct),
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    };
  },
  [CACHE_TAGS.products],
  300
);

export const getNewArrivals = createCachedFunction(
  async (limit = 8) => {
    const products = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: storefrontRelations,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return products.map(serializeProduct);
  },
  [CACHE_TAGS.products],
  300
);

export const getPopularProducts = createCachedFunction(
  async (limit = 8) => {
    const popular = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
    if (!popular.length) return [];

    const products = await prisma.product.findMany({
      where: { id: { in: popular.map(item => item.productId) }, status: 'PUBLISHED' },
      include: storefrontRelations,
    });
    return products.map(serializeProduct);
  },
  [CACHE_TAGS.products],
  600
);

export const getProductTags = createCachedFunction(
  async () => {
    const products = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { tags: true },
    });
    return [...new Set(products.flatMap(product => product.tags))].sort();
  },
  [CACHE_TAGS.products],
  3600
);

export const getProductPriceRange = createCachedFunction(
  async () => {
    const result = await prisma.product.aggregate({
      where: { status: 'PUBLISHED' },
      _min: { price: true },
      _max: { price: true },
    });
    return {
      min: result._min.price ? Number(result._min.price) : 0,
      max: result._max.price ? Number(result._max.price) : 0,
    };
  },
  [CACHE_TAGS.products],
  3600
);

export const getNewProducts = createCachedFunction(
  async (limit = 8) => {
    const products = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: storefrontRelations,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return products.map(serializeProduct);
  },
  [CACHE_TAGS.products],
  3600
);

export const getAllProducts = createCachedFunction(
  async () => {
    const products = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: storefrontRelations,
    });
    return products.map(serializeProduct);
  },
  [CACHE_TAGS.products],
  3600
);

export const getProductBySlug = createCachedFunction(
  async (slug: string) => {
    const product = await prisma.product.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: detailRelations,
    });
    return product ? serializeProduct(product) : null;
  },
  [CACHE_TAGS.product],
  3600
);

export const getCategoryBySlug = createCachedFunction(
  async (slug: string) =>
    prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
  [CACHE_TAGS.categories],
  3600
);
