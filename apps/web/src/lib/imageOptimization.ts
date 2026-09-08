/** Shared image helpers — safe for Server and Client Components. */

/** Local demo placeholder shared by immobilier + immo. */
export const PROPERTY_PLACEHOLDER =
  "/images/properties/property-placeholder.jpg";

/** Fallback visible : le fichier PROPERTY_PLACEHOLDER n’existe pas dans public. */
export const PROPERTY_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85";

const ALLOWED_REMOTE_HOSTS = new Set(["images.unsplash.com"]);

const BLOCKED_REMOTE_HOSTS = new Set([
  "example.com",
  "www.example.com",
]);

export type GalleryMedia = {
  id: string;
  type: "IMAGE";
  url: string;
};

/** True when the URL is a local browser preview (data/blob). */
export function isLocalPreviewImage(src: string): boolean {
  return (
    typeof src === "string" &&
    (src.startsWith("data:") || src.startsWith("blob:"))
  );
}

/** True when the URL is a remote Unsplash asset. */
export function isUnsplashImage(src: string): boolean {
  return (
    typeof src === "string" &&
    src.startsWith("https://images.unsplash.com/")
  );
}

/**
 * Normalize any image value coming from Demo API / mocks.
 * Invalid or blocked hosts never reach next/image.
 */
function resolveFallback(fallback: string) {
  if (!fallback || fallback === PROPERTY_PLACEHOLDER) {
    return PROPERTY_IMAGE_FALLBACK;
  }
  return fallback;
}

export function getSafeImageSrc(
  value: unknown,
  fallback: string = PROPERTY_IMAGE_FALLBACK,
): string {
  const safeFallback = resolveFallback(fallback);
  if (typeof value !== "string") return safeFallback;
  const src = value.trim();
  if (!src || src === PROPERTY_PLACEHOLDER) return safeFallback;

  // Local public path
  if (src.startsWith("/") && !src.startsWith("//")) return src;

  // In-browser previews
  if (isLocalPreviewImage(src)) return src;

  try {
    const url = new URL(src);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return safeFallback;
    }
    const host = url.hostname.toLowerCase();
    if (BLOCKED_REMOTE_HOSTS.has(host)) return safeFallback;
    if (ALLOWED_REMOTE_HOSTS.has(host)) return src;
    // Unknown remote host: do not feed next/image (avoids unconfigured-host crash)
    return safeFallback;
  } catch {
    return safeFallback;
  }
}

function extractRawUrl(item: unknown): string | null {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && "url" in item) {
    const url = (item as { url?: unknown }).url;
    return typeof url === "string" ? url : null;
  }
  return null;
}

function extractRawId(item: unknown, index: number, ownerId: string): string {
  if (item && typeof item === "object" && "id" in item) {
    const id = (item as { id?: unknown }).id;
    if (typeof id === "string" && id.trim()) return id;
  }
  return `media-${ownerId}-${String(index + 1).padStart(3, "0")}`;
}

/**
 * Build a stable gallery list:
 * - keep real images
 * - collapse any number of invalid/placeholder entries into at most one fallback
 * - never use URL as identity
 */
export function toGalleryMedia(
  images: unknown,
  ownerId: string,
  fallback: string = PROPERTY_IMAGE_FALLBACK,
): GalleryMedia[] {
  const raw = Array.isArray(images) ? images : [];
  const real: GalleryMedia[] = [];
  let sawPlaceholderOrInvalid = false;
  let fallbackId = `fallback-${ownerId}`;

  raw.forEach((item, index) => {
    const rawUrl = extractRawUrl(item);
    const id = extractRawId(item, index, ownerId);
    if (!rawUrl) {
      sawPlaceholderOrInvalid = true;
      return;
    }
    const safe = getSafeImageSrc(rawUrl, "");
    if (!safe) {
      sawPlaceholderOrInvalid = true;
      return;
    }
    if (safe === PROPERTY_PLACEHOLDER) {
      sawPlaceholderOrInvalid = true;
      fallbackId = id.startsWith("media-") ? `fallback-${ownerId}` : id;
      return;
    }
    real.push({ id, type: "IMAGE", url: safe });
  });

  if (real.length === 0) {
    return [{ id: fallbackId, type: "IMAGE", url: fallback }];
  }

  // Do not append a placeholder when real photos already exist.
  void sawPlaceholderOrInvalid;
  return real;
}

/** First safe image from a list, or fallback. */
export function getSafeCoverImage(
  images: unknown,
  fallback: string = PROPERTY_IMAGE_FALLBACK,
  ownerId = "cover",
): string {
  return toGalleryMedia(images, ownerId, fallback)[0]?.url ?? fallback;
}

/**
 * Skip next/image optimization for blob/data previews and Unsplash in
 * development (optimizer often 504 locally). Production optimizes Unsplash.
 */
export function skipImageOptimization(src: string): boolean {
  if (isLocalPreviewImage(src)) return true;
  if (process.env.NODE_ENV === "development" && isUnsplashImage(src)) {
    return true;
  }
  return false;
}
