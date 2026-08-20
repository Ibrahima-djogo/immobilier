import {
  ownerAds as seedAds,
  ownerContacts as seedContacts,
  ownerProperties as seedProperties,
  type AdStatus,
  type OwnerAd,
  type OwnerContact,
  type OwnerProperty,
  type PropertyStatus,
} from "@/lib/proprietaire/demo-data";
import {
  type PropertyVideo,
  toPersistableVideos,
} from "@/lib/property/videos";

const KEYS = {
  properties: "demeure_guinee_owner_properties",
  ads: "demeure_guinee_owner_ads",
  contacts: "demeure_guinee_owner_contacts",
  profile: "demeure_guinee_owner_profile",
} as const;

export type OwnerProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  neighborhood: string;
  bio: string;
};

const defaultOwnerProfile: OwnerProfile = {
  firstName: "Mamadou",
  lastName: "Diallo",
  email: "mamadou.diallo@example.com",
  phone: "+224 622 45 78 90",
  city: "Conakry",
  neighborhood: "Kipé",
  bio: "Propriétaire sur Demeure Guinée. Je gère mes biens et annonces depuis mon espace dédié.",
};

export type OwnerAdRecord = OwnerAd & {
  summary?: string;
};

export type OwnerContactRecord = OwnerContact & {
  note?: string;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode — fail silently for front-only demo
  }
}

export function getOwnerProperties(): OwnerProperty[] {
  const list = readJson(KEYS.properties, seedProperties);
  return list.map((item) => ({
    ...item,
    videos: item.videos ?? [],
  }));
}

export function setOwnerProperties(properties: OwnerProperty[]) {
  writeJson(KEYS.properties, properties);
}

export function getOwnerAds(): OwnerAdRecord[] {
  return readJson(KEYS.ads, seedAds as OwnerAdRecord[]);
}

export function setOwnerAds(ads: OwnerAdRecord[]) {
  writeJson(KEYS.ads, ads);
}

export function getOwnerContacts(): OwnerContactRecord[] {
  return readJson(KEYS.contacts, seedContacts as OwnerContactRecord[]);
}

export function setOwnerContacts(contacts: OwnerContactRecord[]) {
  writeJson(KEYS.contacts, contacts);
}

export function getOwnerProfile(): OwnerProfile {
  return readJson(KEYS.profile, defaultOwnerProfile);
}

export function setOwnerProfile(profile: OwnerProfile) {
  writeJson(KEYS.profile, profile);
}

export function slugifyTitle(title: string) {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `bien-${Date.now()}`;
}

export function uniquePropertySlug(title: string, existing: OwnerProperty[]) {
  const base = slugifyTitle(title);
  if (!existing.some((item) => item.slug === base)) return base;
  let index = 2;
  while (existing.some((item) => item.slug === `${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

const TYPE_LABELS: Record<string, string> = {
  VILLA: "Villa",
  APPARTEMENT: "Appartement",
  MAISON: "Maison",
  TERRAIN: "Terrain",
  BUREAU: "Bureau",
};

export function labelPropertyType(type: string) {
  return TYPE_LABELS[type] ?? type;
}

export function computeCompleteness(input: {
  title: string;
  location: string;
  price: number;
  area: number;
  description: string;
  imagesCount: number;
}) {
  let score = 0;
  if (input.title.trim()) score += 20;
  if (input.location.trim()) score += 20;
  if (input.price > 0) score += 15;
  if (input.area > 0) score += 15;
  if (input.description.trim().length > 20) score += 15;
  if (input.imagesCount > 0) score += 15;
  return Math.min(100, score);
}

export function formatUpdatedAt(date = new Date()) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function addOwnerProperty(
  property: Omit<OwnerProperty, "id" | "slug" | "views" | "contacts" | "completeness" | "status"> & {
    status?: PropertyStatus;
    slug?: string;
    videos?: PropertyVideo[];
  },
) {
  const current = getOwnerProperties();
  const location = property.location;
  const slug = property.slug ?? uniquePropertySlug(property.title, current);
  const videos = toPersistableVideos(property.videos ?? []);
  const next: OwnerProperty = {
    id: `p-${Date.now()}`,
    slug,
    title: property.title,
    type: property.type,
    operation: property.operation,
    location,
    city: property.city,
    commune: property.commune,
    quarter: property.quarter,
    landmark: property.landmark,
    latitude: property.latitude ?? null,
    longitude: property.longitude ?? null,
    locationLabel: property.locationLabel ?? null,
    locationDisplayName: property.locationDisplayName ?? null,
    locationConfirmed: Boolean(property.locationConfirmed),
    price: property.price,
    area: property.area,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    status: property.status ?? "BROUILLON",
    completeness: computeCompleteness({
      title: property.title,
      location,
      price: property.price,
      area: property.area,
      description: property.description,
      imagesCount: property.images.length,
    }),
    views: 0,
    contacts: 0,
    images: property.images.length
      ? property.images
      : [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=86",
        ],
    videos,
    description: property.description,
  };
  const list = [next, ...current];
  setOwnerProperties(list);
  return next;
}

export function updateOwnerProperty(
  slug: string,
  patch: Partial<Omit<OwnerProperty, "id" | "slug">>,
) {
  const current = getOwnerProperties();
  const list = current.map((item) => {
    if (item.slug !== slug) return item;
    const merged = {
      ...item,
      ...patch,
      videos:
        patch.videos !== undefined
          ? toPersistableVideos(patch.videos)
          : item.videos ?? [],
    };
    return {
      ...merged,
      completeness: computeCompleteness({
        title: merged.title,
        location: merged.location,
        price: merged.price,
        area: merged.area,
        description: merged.description,
        imagesCount: merged.images.length,
      }),
    };
  });
  setOwnerProperties(list);
  return list.find((item) => item.slug === slug) ?? null;
}

export function addOwnerAd(
  ad: Omit<OwnerAdRecord, "id" | "views" | "favorites" | "contacts" | "updatedAt" | "status"> & {
    status?: AdStatus;
    summary?: string;
    operation?: "VENTE" | "LOCATION";
    price?: number;
  },
) {
  const current = getOwnerAds();
  const next: OwnerAdRecord = {
    id: `a-${Date.now()}`,
    propertySlug: ad.propertySlug,
    title: ad.title,
    status: ad.status ?? "BROUILLON",
    operation: ad.operation,
    price: ad.price,
    views: 0,
    favorites: 0,
    contacts: 0,
    updatedAt: formatUpdatedAt(),
    summary: ad.summary,
    rejectionReason: ad.rejectionReason,
  };
  const list = [next, ...current];
  setOwnerAds(list);
  return next;
}

/** Annonces « vivantes » : empêchent un doublon de publication pour le même bien. */
export function findActiveAdForProperty(propertySlug: string) {
  return (
    getOwnerAds().find(
      (ad) =>
        ad.propertySlug === propertySlug &&
        (ad.status === "PUBLIEE" || ad.status === "EN_ATTENTE"),
    ) ?? null
  );
}

export function getPropertyPublicationLabel(propertySlug: string) {
  const ads = getOwnerAds().filter((ad) => ad.propertySlug === propertySlug);
  if (ads.some((ad) => ad.status === "PUBLIEE")) {
    return { label: "Annonce publiée", tone: "published" as const, ad: ads.find((a) => a.status === "PUBLIEE")! };
  }
  if (ads.some((ad) => ad.status === "EN_ATTENTE")) {
    return { label: "Annonce en attente", tone: "pending" as const, ad: ads.find((a) => a.status === "EN_ATTENTE")! };
  }
  if (ads.some((ad) => ad.status === "REJETEE")) {
    return { label: "Annonce refusée", tone: "rejected" as const, ad: ads.find((a) => a.status === "REJETEE")! };
  }
  if (ads.some((ad) => ad.status === "BROUILLON")) {
    return { label: "Annonce brouillon", tone: "draft" as const, ad: ads.find((a) => a.status === "BROUILLON")! };
  }
  return { label: "Non publié", tone: "none" as const, ad: null };
}

export function updateOwnerAd(id: string, patch: Partial<Omit<OwnerAdRecord, "id">>) {
  const current = getOwnerAds();
  const list = current.map((item) =>
    item.id === id
      ? { ...item, ...patch, updatedAt: formatUpdatedAt() }
      : item,
  );
  setOwnerAds(list);
  return list.find((item) => item.id === id) ?? null;
}

export function deleteOwnerProperty(slug: string) {
  const current = getOwnerProperties();
  const next = current.filter((item) => item.slug !== slug);
  setOwnerProperties(next);
  const ads = getOwnerAds().filter((ad) => ad.propertySlug !== slug);
  setOwnerAds(ads);
  return next;
}

export function deleteOwnerAd(id: string) {
  const current = getOwnerAds();
  const next = current.filter((item) => item.id !== id);
  setOwnerAds(next);
  return next;
}

export function updateOwnerContact(
  id: string,
  patch: Partial<Omit<OwnerContactRecord, "id">>,
) {
  const current = getOwnerContacts();
  const list = current.map((item) => (item.id === id ? { ...item, ...patch } : item));
  setOwnerContacts(list);
  return list.find((item) => item.id === id) ?? null;
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
