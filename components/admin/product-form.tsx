'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import { createProduct, updateProduct } from '@/server/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Category = { id: string; name: string; slug: string; parentId: string | null };
type ExistingImage = { id: string; url: string; altText: string | null; position: number };
type Variant = { name: string; value: string; price: number | null };

type ProductFormProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  content: string | null;
  brand: string | null;
  price: number | string;
  comparePrice: number | string | null;
  costPrice: number | string | null;
  sku: string | null;
  categoryId: string | null;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  trackQuantity: boolean;
  featured: boolean;
  lowStockThreshold: number;
  weight: number | string | null;
  images: ExistingImage[];
  variants: Array<{ name: string; value: string; price: number | string | null }>;
  inventory: Array<{ quantity: number }>;
};

type ImageItem = ExistingImage & { file?: File; previewUrl?: string };

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductFormProduct;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [description, setDescription] = useState(product?.description || '');
  const [content, setContent] = useState(product?.content || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [compareAtPrice, setCompareAtPrice] = useState(String(product?.comparePrice ?? ''));
  const [costPrice, setCostPrice] = useState(String(product?.costPrice ?? ''));
  const [inventory, setInventory] = useState(String(product?.inventory[0]?.quantity ?? 0));
  const [weight, setWeight] = useState(String(product?.weight ?? ''));
  const [status, setStatus] = useState(product?.status || 'DRAFT');
  const [trackQuantity, setTrackQuantity] = useState(product?.trackQuantity ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [lowStockThreshold, setLowStockThreshold] = useState(String(product?.lowStockThreshold ?? 10));
  const [tags, setTags] = useState(product?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [variants, setVariants] = useState<Variant[]>(
    product?.variants.map(variant => ({
      name: variant.name,
      value: variant.value,
      price: variant.price === null ? null : Number(variant.price),
    })) || []
  );
  const [images, setImages] = useState<ImageItem[]>(
    product?.images
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(image => ({ ...image })) || []
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const hasImages = images.length > 0;
  const imagePayload = useMemo(
    () =>
      images.map((image, position) => ({
        id: image.id,
        url: image.url,
        altText: image.altText || name,
        position,
      })),
    [images, name]
  );

  const addFiles = (files: FileList | File[]) => {
    const valid = Array.from(files).filter(file => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPG, PNG, and WEBP images are supported.');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be 5 MB or smaller.');
        return false;
      }
      return true;
    });
    setImages(current => [
      ...current,
      ...valid.map(file => ({
        id: `new-${crypto.randomUUID()}`,
        url: '',
        altText: name,
        position: current.length,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeImage = (id: string) => {
    setImages(current => current.filter(image => image.id !== id));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages(current => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setTagInput('');
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData();
    formData.set('name', name);
    formData.set('slug', slug);
    formData.set('description', description);
    formData.set('content', content);
    formData.set('brand', brand);
    formData.set('categoryId', categoryId);
    formData.set('sku', sku);
    formData.set('price', price);
    formData.set('compareAtPrice', compareAtPrice);
    formData.set('costPrice', costPrice);
    formData.set('inventory', inventory);
    formData.set('weight', weight);
    formData.set('status', status);
    formData.set('trackQuantity', String(trackQuantity));
    formData.set('featured', String(featured));
    formData.set('lowStockThreshold', lowStockThreshold);
    formData.set('tags', JSON.stringify(tags));
    formData.set('variants', JSON.stringify(variants));
    formData.set('images', JSON.stringify(imagePayload.filter(image => image.url)));
    images.forEach(image => {
      formData.append('imageOrder', image.id);
      if (image.file) {
        formData.append('imageFiles', image.file);
        formData.append('imageFileIds', image.id);
      }
    });

    const result = product
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    if (!result.success) {
      setError(result.error || 'Unable to save product.');
      setSaving(false);
      return;
    }

    router.push('/admin/products');
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Dashboard / Products</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {product ? 'Edit Product' : 'Add Product'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Add the details and images for your product.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? 'Save Changes' : 'Save Product'}
          </Button>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
              <CardDescription>Use accurate, customer-facing product information.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <Field label="Product name" required>
                <Input value={name} onChange={event => setName(event.target.value)} required />
              </Field>
              <Field label="Slug" required>
                <Input
                  value={slug}
                  onChange={event => {
                    setSlugTouched(true);
                    setSlug(slugify(event.target.value));
                  }}
                  required
                />
              </Field>
              <Field label="Short description">
                <textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={description} onChange={event => setDescription(event.target.value)} />
              </Field>
              <Field label="Full description">
                <textarea className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={content} onChange={event => setContent(event.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Product details</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Field label="Category" required>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={categoryId} onChange={event => setCategoryId(event.target.value)} required>
                  <option value="">Select category</option>
                  {categories.map(category => <option key={category.id} value={category.id}>{category.parentId ? `↳ ${category.name}` : category.name}</option>)}
                </select>
              </Field>
              <Field label="SKU" required><Input value={sku} onChange={event => setSku(event.target.value)} required /></Field>
              <Field label="Brand"><Input value={brand} onChange={event => setBrand(event.target.value)} /></Field>
              <Field label="Price" required><Input type="number" min="0.01" step="0.01" value={price} onChange={event => setPrice(event.target.value)} required /></Field>
              <Field label="Compare-at price"><Input type="number" min="0" step="0.01" value={compareAtPrice} onChange={event => setCompareAtPrice(event.target.value)} /></Field>
              <Field label="Cost price"><Input type="number" min="0" step="0.01" value={costPrice} onChange={event => setCostPrice(event.target.value)} /></Field>
              <Field label="Weight"><Input type="number" min="0" step="0.01" value={weight} onChange={event => setWeight(event.target.value)} /></Field>
              <Field label="Stock quantity" required><Input type="number" min="0" step="1" value={inventory} onChange={event => setInventory(event.target.value)} required /></Field>
              <Field label="Low-stock alert"><Input type="number" min="0" step="1" value={lowStockThreshold} onChange={event => setLowStockThreshold(event.target.value)} /></Field>
              <div className="flex flex-col gap-3 self-end pb-2 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={trackQuantity} onChange={event => setTrackQuantity(event.target.checked)} /> Track inventory</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={event => setFeatured(event.target.checked)} /> Featured product</label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Variants</CardTitle><CardDescription>Add options such as storage, color, or configuration.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {variants.map((variant, index) => (
                <div key={`${variant.name}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto]">
                  <Input placeholder="Option" value={variant.name} onChange={event => setVariants(current => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} />
                  <Input placeholder="Value" value={variant.value} onChange={event => setVariants(current => current.map((item, i) => i === index ? { ...item, value: event.target.value } : item))} />
                  <Input type="number" min="0" step="0.01" placeholder="Price add-on" value={variant.price ?? ''} onChange={event => setVariants(current => current.map((item, i) => i === index ? { ...item, price: event.target.value ? Number(event.target.value) : null } : item))} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setVariants(current => current.filter((_, i) => i !== index))} aria-label="Remove variant"><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setVariants([...variants, { name: '', value: '', price: null }])}>Add variant</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2"><Input value={tagInput} placeholder="Add a tag" onChange={event => setTagInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag(); } }} /><Button type="button" variant="outline" onClick={addTag}>Add</Button></div>
              <div className="flex flex-wrap gap-2">{tags.map(tag => <Badge key={tag} variant="secondary">{tag}<button type="button" className="ml-1" onClick={() => setTags(tags.filter(item => item !== tag))} aria-label={`Remove ${tag}`}><X className="h-3 w-3" /></button></Badge>)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Product images</CardTitle><CardDescription>JPG, PNG, or WEBP. Maximum 5 MB each.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <button type="button" className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-10 text-center transition hover:border-primary hover:bg-blue-50/50" onClick={() => fileInputRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files); }}>
                <ImagePlus className="mb-3 h-8 w-8 text-primary" />
                <span className="font-semibold">Upload product images</span>
                <span className="mt-1 text-sm text-muted-foreground">Drag and drop or click to browse</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={event => { if (event.target.files) addFiles(event.target.files); event.target.value = ''; }} />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {images.map((image, index) => (
                  <div key={image.id} className="overflow-hidden rounded-xl border bg-slate-50">
                    <div className="relative aspect-square">
                      <Image src={image.previewUrl || image.url} alt={image.altText || `${name} image ${index + 1}`} fill className="object-cover" unoptimized={Boolean(image.previewUrl || image.url.startsWith('/'))} />
                      {index === 0 && <Badge className="absolute left-2 top-2">Primary</Badge>}
                    </div>
                    <div className="space-y-2 p-2">
                      <Input
                        value={image.altText || ''}
                        placeholder="Image alt text"
                        aria-label={`Alt text for image ${index + 1}`}
                        onChange={event =>
                          setImages(current =>
                            current.map(item =>
                              item.id === image.id
                                ? { ...item, altText: event.target.value }
                                : item
                            )
                          )
                        }
                        className="h-8 text-xs"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">{image.file?.name || 'Product image'}</span>
                      <div className="flex shrink-0 gap-1">
                        <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => moveImage(index, -1)} aria-label="Move image earlier"><ArrowUp className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" disabled={index === images.length - 1} onClick={() => moveImage(index, 1)} aria-label="Move image later"><ArrowDown className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(image.id)} aria-label="Delete image"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {!hasImages && <p className="text-center text-sm text-muted-foreground">Add at least one image before publishing.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
            <CardContent>
              <Field label="Status">
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={event => setStatus(event.target.value as typeof status)}>
                  <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
                </select>
              </Field>
              <p className="mt-3 text-xs text-muted-foreground">Only published products appear in the customer storefront.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-medium"><span>{label}{required && <span className="ml-1 text-red-500">*</span>}</span>{children}</label>;
}
