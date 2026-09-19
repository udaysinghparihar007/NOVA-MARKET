'use client';

import Image from 'next/image';
import { useState } from 'react';

type GalleryImage = { url: string; altText?: string | null };

export function ProductGallery({
  productName,
  images,
}: {
  productName: string;
  images: GalleryImage[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  if (!activeImage) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[2rem] bg-slate-100 text-sm text-muted-foreground">
        No product image available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-slate-100">
        <Image
          src={activeImage.url}
          alt={activeImage.altText || productName}
          fill
          priority
          className="object-cover"
          unoptimized={activeImage.url.startsWith('/')}
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-slate-100 ${
                index === activeIndex ? 'border-primary' : 'border-transparent'
              }`}
              aria-label={`View ${productName} image ${index + 1}`}
              aria-current={index === activeIndex}
            >
              <Image
                src={image.url}
                alt={image.altText || `${productName} image ${index + 1}`}
                fill
                className="object-cover"
                unoptimized={image.url.startsWith('/')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
