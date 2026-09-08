/**
 * Images catalogue matériaux.
 * L’URL vient de demo-api (imageUrl). Ce fichier ne mappe aucun produit.
 */

import { getSafeImageSrc, skipImageOptimization } from "@/lib/imageOptimization";

export const MATERIAL_PLACEHOLDER = "/materials/placeholder.jpg";

export function getSafeMaterialImageSrc(value: unknown) {
  const src = getSafeImageSrc(value, MATERIAL_PLACEHOLDER);
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return MATERIAL_PLACEHOLDER;
  }
  return src;
}

export function skipMaterialImageOptimization(src: string) {
  return skipImageOptimization(src);
}
