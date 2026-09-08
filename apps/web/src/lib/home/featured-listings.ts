/**
 * Présentation de la section « biens populaires » de l’accueil.
 * Ne modifie ni l’API, ni le catalogue /annonces.
 */

import { listingService, type DemoListing } from "@/lib/demo-api/listings";
import { mapDemoListingToProperty } from "@/lib/demo-api/mapToProperty";
import {
  getSafeImageSrc,
  PROPERTY_IMAGE_FALLBACK,
  PROPERTY_PLACEHOLDER,
} from "@/lib/imageOptimization";
import type { Property } from "@/types/property";

const TECHNICAL_TITLE =
  /\b(soumission|e2e|hack title|titre patch|patch ok|test statut|annonce admin|correction|check owner|bien test|alias fields|workflow fix|controle statut|no direct approve|admin complet|image sanitize|refus definitif|refus revisable|terrain scope|autoris[ée]e?\s+(après|apres)\s+extension|terrain autoris)\b|\btest\b|\d{8,}/i;

const TECHNICAL_SLUG =
  /\b(e2e|soumission|test-statut|workflow-fix|annonce-admin|correction|check-owner|bien-test|terrain-scope|alias-fields|test-image|villa-corr|villa-test|refus-|draft-pour)\b|\btest\b|\d{10,}/i;

const LOCATION_IN_TITLE = /(?:à|a)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,40})$/i;

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hasUsableType(listing: DemoListing) {
  return Boolean(listing.type?.trim());
}

function hasUsablePrice(listing: DemoListing) {
  return Number.isFinite(listing.price) && listing.price > 1;
}

function isGibberishTitle(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return true;
  if (/\s/.test(trimmed)) return false;
  if (/^(maison|villa|terrain|appartement|bureau|commerce)$/i.test(trimmed)) {
    return false;
  }
  return /^[a-z.\-_]{6,}$/i.test(trimmed);
}

function isTechnicalListing(listing: DemoListing) {
  const title = listing.title?.trim() ?? "";
  const slug = listing.slug?.trim() ?? "";
  return (
    TECHNICAL_TITLE.test(title) ||
    TECHNICAL_SLUG.test(slug) ||
    isGibberishTitle(title)
  );
}

function hasUserTitle(listing: DemoListing) {
  const title = listing.title?.trim() ?? "";
  if (title.length < 6) return false;
  if (isTechnicalListing(listing)) return false;
  return true;
}

export function isHomeReadyListing(listing: DemoListing) {
  if (listing.status && listing.status !== "PUBLIEE") return false;
  if (!hasUsableType(listing) || !hasUsablePrice(listing)) return false;
  if (isTechnicalListing(listing)) return false;
  return true;
}

function labelType(type: string) {
  const folded = fold(type);
  if (folded.includes("appart")) return "Appartement";
  if (folded.includes("villa")) return "Villa";
  if (folded.includes("terrain")) return "Terrain";
  if (folded.includes("bureau")) return "Bureau";
  if (folded.includes("commerce") || folded.includes("local")) return "Commerce";
  if (folded.includes("maison")) return "Maison";
  return type.trim() || "Bien";
}

function locationFromTitle(title: string) {
  const match = title.trim().match(LOCATION_IN_TITLE);
  const place = match?.[1]?.trim();
  if (!place) return "";
  return place.charAt(0).toUpperCase() + place.slice(1);
}

function polishUserTitle(title: string) {
  const trimmed = title.trim();
  if (trimmed !== trimmed.toLowerCase()) return trimmed;
  return trimmed.replace(/\b([a-zà-ÿ])/g, (letter) => letter.toUpperCase());
}

function professionalTitle(listing: DemoListing, location: string) {
  if (hasUserTitle(listing)) return polishUserTitle(listing.title);
  const type = labelType(listing.type);
  const place = location || "Conakry";
  if (listing.operation === "LOCATION") {
    return `${type} à louer à ${place}`;
  }
  return `${type} à vendre à ${place}`;
}

function professionalLocation(listing: DemoListing) {
  const fromTitle = locationFromTitle(listing.title ?? "");
  if (fromTitle) {
    return fromTitle.toLowerCase() === "conakry"
      ? "Conakry"
      : `${fromTitle}, Conakry`;
  }
  return "Conakry";
}

function professionalCover(listing: DemoListing) {
  const raw =
    listing.media?.find((item) => item.type === "IMAGE")?.url ??
    listing.images?.[0];
  const safe = getSafeImageSrc(raw, "");
  if (
    !safe ||
    safe === PROPERTY_PLACEHOLDER ||
    safe.startsWith("data:") ||
    safe.startsWith("blob:")
  ) {
    return PROPERTY_IMAGE_FALLBACK;
  }
  return safe;
}

export function toHomeProperty(listing: DemoListing): Property {
  const mapped = mapDemoListingToProperty(listing);
  const location = professionalLocation(listing);
  const category = labelType(listing.type);
  return {
    ...mapped,
    title: professionalTitle(listing, locationFromTitle(listing.title ?? "") || "Conakry"),
    category,
    location,
    image: professionalCover(listing),
    verified: Boolean(listing.advertiser?.verified || mapped.verified),
  };
}

export function pickHomeListings(listings: DemoListing[]): Property[] {
  return [...listings]
    .filter(isHomeReadyListing)
    .sort((left, right) => {
      const a = left.publishedAt || left.createdAt;
      const b = right.publishedAt || right.createdAt;
      return b.localeCompare(a);
    })
    .slice(0, 4)
    .map(toHomeProperty);
}

export async function loadHomeFeaturedListings() {
  const listings = await listingService.list({ publicOnly: true });
  return pickHomeListings(listings);
}
