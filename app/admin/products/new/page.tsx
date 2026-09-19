import prisma from '@/lib/prisma';
import { ProductForm } from '@/components/admin/product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
  });

  return <ProductForm categories={categories} />;
}
