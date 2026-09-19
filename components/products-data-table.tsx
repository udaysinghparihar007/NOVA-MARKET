// components/products-data-table.tsx

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteProduct } from '@/server/actions/products';

export interface ProductItem {
  id: string;
  name: string;
  image?: string;
  category?: string;
  sku: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'discontinued';
  slug?: string;
}

interface ProductsDataTableProps {
  data: ProductItem[];
  isLoading?: boolean;
  onEdit?: (product: ProductItem) => void;
  onDelete?: (productId: string) => void;
}

export function ProductsDataTable({
  data,
  isLoading,
  onEdit,
  onDelete,
}: ProductsDataTableProps) {
  const columns: ColumnDef<ProductItem>[] = [
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
            {row.original.image && (
              <Image src={row.original.image} alt="" fill className="object-cover" unoptimized={row.original.image.startsWith('/')} />
            )}
          </div>
          <div>
            <Link href={`/products/${row.original.slug || ''}`} className="font-medium hover:text-primary">
              {row.original.name}
            </Link>
            {row.original.category && <p className="text-xs text-muted-foreground">{row.original.category}</p>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => {
        const price = row.getValue('price') as number;
        return `$${price.toFixed(2)}`;
      },
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const value = row.getValue('status') as string;
        const statusStyles = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800',
          discontinued: 'bg-red-100 text-red-800',
        };
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[value as keyof typeof statusStyles]}`}
          >
            {value}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={`/admin/products/${row.original.id}/edit`} aria-label={`Edit ${row.original.name}`}>
              <Edit2 className="h-4 w-4" />
            </Link>
          </Button>
          <ProductDeleteButton
            productId={row.original.id}
            productName={row.original.name}
          />
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="py-8 text-center">Loading products...</div>;
  }

  function ProductDeleteButton({
    productId,
    productName,
  }: {
    productId: string;
    productName: string;
  }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    return (
      <button
        type="button"
        disabled={isPending}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        aria-label={`Delete ${productName}`}
        onClick={() => {
          if (!window.confirm(`Delete ${productName}? This cannot be undone.`)) return;
          startTransition(async () => {
            const result = await deleteProduct(productId);
            if (result.success) router.refresh();
          });
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return <DataTable columns={columns} data={data} />;
}
