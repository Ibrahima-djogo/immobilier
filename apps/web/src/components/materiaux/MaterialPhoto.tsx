"use client";

import Image from "next/image";
import { useState } from "react";

import {
  getSafeMaterialImageSrc,
  MATERIAL_PLACEHOLDER,
  skipMaterialImageOptimization,
} from "@/lib/materiaux/image";

type MaterialPhotoProps = {
  imageUrl: string;
  alt: string;
  className?: string;
  sizes: string;
};

export function MaterialPhoto({
  imageUrl,
  alt,
  className,
  sizes,
}: MaterialPhotoProps) {
  const safeSrc = getSafeMaterialImageSrc(imageUrl);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const src = failedFor === imageUrl ? MATERIAL_PLACEHOLDER : safeSrc;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      unoptimized={skipMaterialImageOptimization(src)}
      onError={() => {
        if (src !== MATERIAL_PLACEHOLDER) {
          setFailedFor(imageUrl);
        }
      }}
    />
  );
}
