// server/actions/products.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { createProductSchema, updateProductSchema } from '@/lib/validators';
import { requirePermission, PERMISSIONS } from '@/lib/roles';
import {
  uploadImageWithVariants,
  deleteImageWithVariants,
} from '@/lib/uploader';
import { sendLowStockAlert } from '@/lib/emails';
import { redirect } from 'next/navigation';
import type { ProductImage } from '@prisma/client';

type ProductImageInput = {
  id?: string;
  url: string;
  altText?: string;
  position?: number;
};

const readJson = <T>(value: FormDataEntryValue | null, fallback: T): T => {
  if (typeof value !== 'string' || !value) return fallback;
  return JSON.parse(value) as T;
};

const readNumber = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getProductInput = (formData: FormData) => ({
  name: String(formData.get('name') || ''),
  slug: slugify(String(formData.get('slug') || formData.get('name') || '')),
  description: String(formData.get('description') || ''),
  content: String(formData.get('content') || ''),
  brand: String(formData.get('brand') || '') || undefined,
  price: readNumber(formData.get('price')),
  compareAtPrice: readNumber(formData.get('compareAtPrice')),
  costPrice: readNumber(formData.get('costPrice')),
  sku: String(formData.get('sku') || ''),
  inventory: readNumber(formData.get('inventory')) ?? 0,
  categoryId: String(formData.get('categoryId') || ''),
  images: readJson<ProductImageInput[]>(formData.get('images'), []),
  variants: readJson<
    Array<{ name: string; value: string; price?: number | null }>
  >(formData.get('variants'), []),
  tags: readJson<string[]>(formData.get('tags'), []),
  status: String(formData.get('status') || 'DRAFT'),
  trackQuantity: formData.get('trackQuantity') === 'true',
  featured: formData.get('featured') === 'true',
  lowStockThreshold: readNumber(formData.get('lowStockThreshold')) ?? 10,
  weight: readNumber(formData.get('weight')),
  seoTitle: String(formData.get('seoTitle') || '') || undefined,
  seoDescription: String(formData.get('seoDescription') || '') || undefined,
});

const uploadFormImages = async (formData: FormData, productName: string) => {
  const files = formData
    .getAll('imageFiles')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const fileIds = formData.getAll('imageFileIds').filter((entry): entry is string => typeof entry === 'string');

  const uploaded = await Promise.all(
    files.map(async (file, index) => {
      const result = await uploadImageWithVariants(file, 'products');
      return {
        id: fileIds[index] || file.name,
        url: result.original.url,
        altText: `${productName} product image`,
      };
    })
  );

  return uploaded;
};

const orderImages = (
  existingImages: ProductImageInput[],
  uploadedImages: ProductImageInput[],
  order: string[]
) => {
  const byId = new Map(
    [...existingImages, ...uploadedImages]
      .filter(image => image.id || image.url)
      .map(image => [image.id || image.url, image])
  );
  return (order.length ? order : [...byId.keys()])
    .map(key => byId.get(key))
    .filter((image): image is ProductImageInput => Boolean(image));
};

const revalidateProductCatalog = () => {
  revalidateTag('products', 'max');
  revalidateTag('product', 'max');
  revalidateTag('categories', 'max');
  revalidateTag('category', 'max');
};

const deleteImageIfUnreferenced = async (image: ProductImage) => {
  const references = await prisma.productImage.count({
    where: { url: image.url, NOT: { id: image.id } },
  });
  if (references === 0) await deleteImageWithVariants(image.url);
};

export async function createProduct(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_CREATE);
    const input = getProductInput(formData);
    const uploadedImages = await uploadFormImages(formData, input.name);
    const imageOrder = formData.getAll('imageOrder').filter((entry): entry is string => typeof entry === 'string');
    input.images = orderImages(input.images, uploadedImages, imageOrder);
    const validatedData = createProductSchema.parse({
      ...input,
      price: input.price,
      images: input.images,
    });

    const [existingSku, existingSlug] = await Promise.all([
      prisma.product.findUnique({ where: { sku: validatedData.sku } }),
      prisma.product.findUnique({ where: { slug: validatedData.slug } }),
    ]);
    if (existingSku) return { success: false, error: 'SKU already exists' };
    if (existingSlug) return { success: false, error: 'Slug already exists' };
    if (validatedData.status === 'PUBLISHED' && !validatedData.images.length) {
      return { success: false, error: 'Published products require an image' };
    }

    const product = await prisma.$transaction(async tx => {
      const created = await tx.product.create({
        data: {
          name: validatedData.name,
          slug: validatedData.slug,
          description: validatedData.description,
          content: validatedData.content,
          brand: validatedData.brand,
          price: validatedData.price,
          comparePrice: validatedData.compareAtPrice,
          costPrice: validatedData.costPrice,
          sku: validatedData.sku,
          categoryId: validatedData.categoryId,
          tags: validatedData.tags,
          status: validatedData.status,
          trackQuantity: validatedData.trackQuantity,
          featured: validatedData.featured,
          lowStockThreshold: validatedData.lowStockThreshold,
          weight: validatedData.weight,
          seoTitle: validatedData.seoTitle,
          seoDescription: validatedData.seoDescription,
        },
      });

      await tx.productImage.createMany({
        data: validatedData.images.map((image, position) => ({
          productId: created.id,
          url: typeof image === 'string' ? image : image.url,
          altText: typeof image === 'string' ? validatedData.name : image.altText || validatedData.name,
          position,
        })),
      });

      await tx.inventory.create({
        data: {
          productId: created.id,
          quantity: validatedData.inventory ?? 0,
          available: validatedData.inventory ?? 0,
          reserved: 0,
        },
      });

      if (validatedData.variants.length) {
        await tx.productVariant.createMany({
          data: validatedData.variants.map((variant, position) => ({
            productId: created.id,
            name: variant.name,
            value: variant.value,
            price: variant.price ?? null,
            position,
          })),
        });
      }

      return created;
    });

    revalidateProductCatalog();
    return { success: true, product: { id: product.id, slug: product.slug } };
  } catch (error) {
    console.error('Create product error:', error);
    return { success: false, error: 'Failed to create product' };
  }
}

export async function updateProduct(productId: string, formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_UPDATE);
    const input = getProductInput(formData);
    const uploadedImages = await uploadFormImages(formData, input.name);
    const imageOrder = formData.getAll('imageOrder').filter((entry): entry is string => typeof entry === 'string');
    const inputImages = orderImages(input.images, uploadedImages, imageOrder);
    const validatedData = updateProductSchema.parse({
      ...input,
      images: inputImages,
    });

    // Check if SKU already exists for other products
    if (validatedData.sku) {
      const existingSku = await prisma.product.findFirst({
        where: {
          sku: validatedData.sku,
          NOT: { id: productId },
        },
      });

      if (existingSku) {
        return { success: false, error: 'SKU already exists' };
      }
    }

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true, inventory: true },
    });
    if (!existing) return { success: false, error: 'Product not found' };
    if (validatedData.status === 'PUBLISHED' && !validatedData.images?.length) {
      return { success: false, error: 'Published products require an image' };
    }

    const keptImages = (validatedData.images || []).filter(
      image => typeof image !== 'string' && image.id
    ) as ProductImageInput[];
    const keptIds = new Set(keptImages.map(image => image.id));
    const removedImages = existing.images.filter(image => !keptIds.has(image.id));

    const product = await prisma.$transaction(async tx => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          name: validatedData.name,
          slug: validatedData.slug,
          description: validatedData.description,
          content: validatedData.content,
          brand: validatedData.brand,
          price: validatedData.price,
          comparePrice: validatedData.compareAtPrice,
          costPrice: validatedData.costPrice,
          sku: validatedData.sku,
          categoryId: validatedData.categoryId,
          tags: validatedData.tags,
          status: validatedData.status,
          trackQuantity: validatedData.trackQuantity,
          featured: validatedData.featured,
          lowStockThreshold: validatedData.lowStockThreshold,
          weight: validatedData.weight,
          seoTitle: validatedData.seoTitle,
          seoDescription: validatedData.seoDescription,
        },
      });

      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productImage.createMany({
        data: (validatedData.images || []).map((image, position) => ({
          productId,
          url: typeof image === 'string' ? image : image.url,
          altText: typeof image === 'string' ? validatedData.name : image.altText || validatedData.name,
          position,
        })),
      });

      await tx.productVariant.deleteMany({ where: { productId } });
      if (validatedData.variants?.length) {
        await tx.productVariant.createMany({
          data: validatedData.variants.map((variant, position) => ({
            productId,
            name: variant.name,
            value: variant.value,
            price: variant.price ?? null,
            position,
          })),
        });
      }

      const inventory = existing.inventory[0];
      if (inventory) {
        await tx.inventory.update({
          where: { productId },
          data: {
            quantity: validatedData.inventory ?? 0,
            available: Math.max(0, (validatedData.inventory ?? 0) - inventory.reserved),
          },
        });
      } else {
        await tx.inventory.create({
          data: {
            productId,
            quantity: validatedData.inventory ?? 0,
            available: validatedData.inventory ?? 0,
            reserved: 0,
          },
        });
      }

      return updated;
    });

    await Promise.all(
      removedImages.map(image =>
        deleteImageIfUnreferenced(image).catch(error => {
          console.error(`Failed to delete removed image ${image.url}:`, error);
        })
      )
    );

    revalidateProductCatalog();
    return { success: true, product: { id: product.id, slug: product.slug } };
  } catch (error) {
    console.error('Update product error:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

export async function deleteProduct(productId: string) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_DELETE);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Delete product images from storage
    for (const image of product.images) {
      try {
        await deleteImageIfUnreferenced(image);
      } catch (error) {
        console.error(`Failed to delete image ${image.url}:`, error);
      }
    }

    // Delete product and associated records
    await prisma.product.delete({
      where: { id: productId },
    });

    revalidateTag('products', 'max');
    revalidateTag('product', 'max');
    revalidateTag('categories', 'max');

    return { success: true };
  } catch (error) {
    console.error('Delete product error:', error);
    return { success: false, error: 'Failed to delete product' };
  }
}

export async function toggleProductStatus(productId: string) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_UPDATE);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { status: true },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const newStatus = product.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { status: newStatus },
    });

    revalidateTag('products', 'max');
    revalidateTag('product', 'max');

    return { success: true, product: updatedProduct };
  } catch (error) {
    console.error('Toggle product status error:', error);
    return { success: false, error: 'Failed to toggle product status' };
  }
}

export async function updateProductInventory(
  productId: string,
  quantity: number,
  operation: 'SET' | 'ADD' | 'SUBTRACT' = 'SET'
) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_UPDATE);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Get or create inventory for this product
    let inventory = await prisma.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) {
      inventory = await prisma.inventory.create({
        data: {
          productId,
          quantity: 0,
          available: 0,
          reserved: 0,
        },
      });
    }

    let newQuantity = quantity;
    if (operation === 'ADD') {
      newQuantity = inventory.quantity + quantity;
    } else if (operation === 'SUBTRACT') {
      newQuantity = Math.max(0, inventory.quantity - quantity);
    }

    const updatedInventory = await prisma.inventory.update({
      where: { productId },
      data: {
        quantity: newQuantity,
        available: newQuantity - inventory.reserved,
      },
    });

    // Check if inventory is low (below 10)
    if (updatedInventory.available <= 10 && updatedInventory.available > 0) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await sendLowStockAlert(
          adminEmail,
          product.name,
          updatedInventory.available
        );
      }
    }

    revalidateTag('products', 'max');
    revalidateTag('inventory', 'max');

    return { success: true, inventory: updatedInventory };
  } catch (error) {
    console.error('Update product inventory error:', error);
    return { success: false, error: 'Failed to update product inventory' };
  }
}

export async function bulkUpdateProducts(productIds: string[], updates: any) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_UPDATE);

    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: updates,
    });

    revalidateTag('products', 'max');

    return { success: true };
  } catch (error) {
    console.error('Bulk update products error:', error);
    return { success: false, error: 'Failed to bulk update products' };
  }
}

export async function duplicateProduct(productId: string) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_CREATE);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const duplicatedProduct = await prisma.product.create({
      data: {
        name: `${product.name} (Copy)`,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        sku: `${product.sku}-copy-${Date.now()}`,
        slug: `${product.slug}-copy-${Date.now()}`,
        categoryId: product.categoryId,
        tags: product.tags,
        status: 'DRAFT',
        weight: product.weight,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        images: {
          create: product.images.map((img, index) => ({
            url: img.url,
            altText: img.altText,
            position: index,
          })),
        },
      },
      include: {
        images: true,
      },
    });

    revalidateTag('products', 'max');

    return { success: true, product: duplicatedProduct };
  } catch (error) {
    console.error('Duplicate product error:', error);
    return { success: false, error: 'Failed to duplicate product' };
  }
}

export async function uploadProductImages(productId: string, files: FileList) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_UPDATE);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const uploadPromises = Array.from(files).map(async file => {
      const result = await uploadImageWithVariants(file, 'products');
      return result.original.url;
    });

    const imageUrls = await Promise.all(uploadPromises);
    const maxPosition = Math.max(
      ...product.images.map(img => img.position),
      -1
    );

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: {
          create: imageUrls.map((url, index) => ({
            url,
            position: maxPosition + 1 + index,
            altText: product.name,
          })),
        },
      },
      include: {
        images: true,
      },
    });

    revalidateTag('products', 'max');
    revalidateTag('product', 'max');

    return { success: true, product: updatedProduct };
  } catch (error) {
    console.error('Upload product images error:', error);
    return { success: false, error: 'Failed to upload product images' };
  }
}

export async function deleteProductImage(productId: string, imageId: string) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_UPDATE);

    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.productId !== productId) {
      return { success: false, error: 'Image not found' };
    }

    try {
      await deleteImageIfUnreferenced(image);
    } catch (error) {
      console.error(`Failed to delete image from storage:`, error);
    }

    await prisma.productImage.delete({
      where: { id: imageId },
    });

    revalidateTag('products', 'max');
    revalidateTag('product', 'max');

    return { success: true };
  } catch (error) {
    console.error('Delete product image error:', error);
    return { success: false, error: 'Failed to delete product image' };
  }
}
