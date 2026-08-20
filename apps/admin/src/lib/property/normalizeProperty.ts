/**
 * Normalisation Property — unique source de lecture pour immobilier + immo.
 * Convertit les alias historiques vers le modèle canonique.
 */

export type PropertyMedia = {
  id: string;
  type: string;
  url: string;
};

export type CanonicalProperty = {
  id: string;
  slug: string;
  reference: string;
  title: string;
  type: string;
  operation: string;
  price: number;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms?: number;
  amenities: string[];
  condition?: string;
  availability?: string;
  city: string;
  commune: string;
  district: string;
  landmark: string;
  adminAddress: string;
  coordinates: { lat: number; lng: number } | null;
  locationLabel: string | null;
  locationConfirmed: boolean;
  ownerId: string | null;
  agencyId: string | null;
  createdByAdminId?: string | null;
  updatedByAdminId?: string | null;
  images: string[];
  media: PropertyMedia[];
  videos: { id: string; url: string; title?: string }[];
  description: string;
  status?: string;
  mandateType?: string | null;
  clientDisplayName?: string | null;
  clientReference?: string | null;
  views?: number;
  contacts?: number;
  completeness?: number;
};

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const n = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function optionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizePropertyMedia(raw: Record<string, unknown>): PropertyMedia[] {
  const media = Array.isArray(raw.media) ? raw.media : [];
  const fromMedia = media
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const url = firstString(rec.url, rec.src);
      if (!url) return null;
      return {
        id: firstString(rec.id) || `media-${index}`,
        type: firstString(rec.type) || "IMAGE",
        url,
      };
    })
    .filter((item): item is PropertyMedia => Boolean(item));

  if (fromMedia.length > 0) return fromMedia;

  const images = Array.isArray(raw.images)
    ? raw.images
    : Array.isArray(raw.photos)
      ? raw.photos
      : [];
  return images
    .map((item, index) => {
      const url =
        typeof item === "string"
          ? item
          : item && typeof item === "object"
            ? firstString((item as Record<string, unknown>).url)
            : "";
      if (!url) return null;
      return { id: `img-${index}`, type: "IMAGE", url };
    })
    .filter((item): item is PropertyMedia => Boolean(item));
}

function resolveCoordinates(
  raw: Record<string, unknown>,
): { lat: number; lng: number } | null {
  const nested = raw.coordinates;
  if (nested && typeof nested === "object") {
    const rec = nested as Record<string, unknown>;
    const lat = Number(rec.lat ?? rec.latitude);
    const lng = Number(rec.lng ?? rec.lon ?? rec.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  const lat = Number(raw.latitude ?? raw.lat);
  const lng = Number(raw.longitude ?? raw.lng ?? raw.lon);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  return null;
}

export function normalizeProperty(raw: unknown): CanonicalProperty {
  const src =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const nested =
    src.location && typeof src.location === "object"
      ? (src.location as Record<string, unknown>)
      : {};
  const city = firstString(src.city, src.ville, nested.city, nested.ville);
  const commune = firstString(
    src.commune,
    src.municipality,
    nested.commune,
    nested.municipality,
  );
  const district = firstString(
    src.district,
    src.quartier,
    src.quarter,
    src.neighborhood,
    nested.district,
    nested.quartier,
    nested.quarter,
  );
  const landmark = firstString(
    src.landmark,
    src.repere,
    src.landmarkLabel,
    nested.landmark,
    nested.repere,
  );
  const adminAddress = firstString(
    src.adminAddress,
    src.administrativeAddress,
    src.adresseAdministrative,
    src.address,
  );
  const locationLabel =
    firstString(src.locationLabel, src.mapLabel, src.libelleCarte) ||
    [district, commune, city].filter(Boolean).join(", ") ||
    null;
  const media = normalizePropertyMedia(src);
  const images = media.map((item) => item.url);
  const videos = Array.isArray(src.videos)
    ? (src.videos as CanonicalProperty["videos"])
    : [];

  return {
    id: firstString(src.id),
    slug: firstString(src.slug),
    reference: firstString(src.reference),
    title: firstString(src.title),
    type: firstString(src.type) || "Villa",
    operation: firstString(src.operation) || "VENTE",
    price: firstNumber(src.price),
    area: firstNumber(src.area, src.surface, src.surfaceArea),
    bedrooms: optionalInt(src.bedrooms),
    bathrooms: optionalInt(src.bathrooms),
    rooms: optionalInt(src.rooms) ?? undefined,
    amenities: Array.isArray(src.amenities) ? (src.amenities as string[]) : [],
    condition: firstString(src.condition) || undefined,
    availability: firstString(src.availability) || undefined,
    city,
    commune,
    district,
    landmark,
    adminAddress:
      adminAddress || [district, commune, city].filter(Boolean).join(", "),
    coordinates: resolveCoordinates(src),
    locationLabel,
    locationConfirmed: Boolean(src.locationConfirmed),
    ownerId: (src.ownerId as string | null) ?? null,
    agencyId: (src.agencyId as string | null) ?? null,
    createdByAdminId: (src.createdByAdminId as string | null) ?? null,
    updatedByAdminId: (src.updatedByAdminId as string | null) ?? null,
    images,
    media,
    videos,
    description: firstString(src.description, src.propertyDescription),
    status: firstString(src.status) || undefined,
    mandateType: (src.mandateType as string | null) ?? null,
    clientDisplayName: (src.clientDisplayName as string | null) ?? null,
    clientReference: (src.clientReference as string | null) ?? null,
    views: firstNumber(src.views),
    contacts: firstNumber(src.contacts),
    completeness: firstNumber(src.completeness),
  };
}

export function normalizeProperties(raw: unknown): CanonicalProperty[] {
  return Array.isArray(raw) ? raw.map((item) => normalizeProperty(item)) : [];
}
