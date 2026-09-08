"use client";

import Image from "next/image";
import { useState } from "react";

import {
  getSafeImageSrc,
  PROPERTY_IMAGE_FALLBACK,
  skipImageOptimization,
} from "@/lib/imageOptimization";

type PropertyPhotoProps = {
  imageUrl: string;
  alt: string;
  className?: string;
  sizes: string;
};

export function PropertyPhoto({
  imageUrl,
  alt,
  className,
  sizes,
}: PropertyPhotoProps) {
  const safeSrc = getSafeImageSrc(imageUrl);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const src = failedFor === imageUrl ? PROPERTY_IMAGE_FALLBACK : safeSrc;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      unoptimized={skipImageOptimization(src)}
      onError={() => {
        if (src !== PROPERTY_IMAGE_FALLBACK) {
          setFailedFor(imageUrl);
        }
      }}
    />
  );
}
