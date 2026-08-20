/** Shared image helpers — safe for Server and Client Components. */

/** Local demo placeholder shared by immobilier + immo. */
export const PROPERTY_PLACEHOLDER =
  "/images/properties/property-placeholder.jpg";

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

export function isLocalPreviewImage(src: string): boolean {
  return (
    typeof src === "string" &&
    (src.startsWith("data:") || src.startsWith("blob:"))
  );
}

export function isUnsplashImage(src: string): boolean {
  return (
    typeof src === "string" &&
    src.startsWith("https://images.unsplash.com/")
  );
}

export function getSafeImageSrc(
  value: unknown,
  fallback: string = PROPERTY_PLACEHOLDER,
): string {
  if (typeof value !== "string") return fallback;
  const src = value.trim();
  if (!src) return fallback;
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  if (isLocalPreviewImage(src)) return src;
  try {
    const url = new URL(src);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return fallback;
    }
    const host = url.hostname.toLowerCase();
    if (BLOCKED_REMOTE_HOSTS.has(host)) return fallback;
    if (ALLOWED_REMOTE_HOSTS.has(host)) return src;
    return fallback;
  } catch {
    return fallback;
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

export function toGalleryMedia(
  images: unknown,
  ownerId: string,
  fallback: string = PROPERTY_PLACEHOLDER,
): GalleryMedia[] {
  const raw = Array.isArray(images) ? images : [];
  const real: GalleryMedia[] = [];

  raw.forEach((item, index) => {
    const rawUrl = extractRawUrl(item);
    const id = extractRawId(item, index, ownerId);
    if (!rawUrl) return;
    const safe = getSafeImageSrc(rawUrl, "");
    if (!safe || safe === PROPERTY_PLACEHOLDER) return;
    real.push({ id, type: "IMAGE", url: safe });
  });

  if (real.length === 0) {
    return [{ id: `fallback-${ownerId}`, type: "IMAGE", url: fallback }];
  }
  return real;
}

export function getSafeCoverImage(
  images: unknown,
  fallback: string = PROPERTY_PLACEHOLDER,
  ownerId = "cover",
): string {
  return toGalleryMedia(images, ownerId, fallback)[0]?.url ?? fallback;
}

export function skipImageOptimization(src: string): boolean {
  if (isLocalPreviewImage(src)) return true;
  if (process.env.NODE_ENV === "development" && isUnsplashImage(src)) {
    return true;
  }
  return false;
}
