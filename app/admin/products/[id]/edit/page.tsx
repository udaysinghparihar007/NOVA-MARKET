import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ProductForm } from '@/components/admin/product-form';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, product] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    }),
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { position: 'asc' } },
        inventory: true,
      },
    }),
  ]);

  if (!product) notFound();
  return (
    <ProductForm
      categories={categories}
      product={{
        ...product,
        price: Number(product.price),
        comparePrice: product.comparePrice === null ? null : Number(product.comparePrice),
        costPrice: product.costPrice === null ? null : Number(product.costPrice),
        brand: product.brand,
        featured: product.featured,
        lowStockThreshold: product.lowStockThreshold,
        weight: product.weight === null ? null : Number(product.weight),
        variants: product.variants.map(variant => ({
          ...variant,
          price: variant.price === null ? null : Number(variant.price),
        })),
      }}
    />
  );
}
