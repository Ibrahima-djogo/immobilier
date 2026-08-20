import {
  getSafeCoverImage,
  PROPERTY_PLACEHOLDER,
  toGalleryMedia,
} from "@/lib/imageOptimization";
import { formatAvailability, rentPeriodSuffix } from "@/lib/listing/listingTerms";
import type { AgentDetails, CategorySlug, Property } from "@/types/property";
import type { DemoListing, DemoProperty } from "./listings";

function categorySlugFromType(type: string): CategorySlug {
  const t = type.toLowerCase();
  if (t.includes("appart")) return "appartement";
  if (t.includes("villa")) return "villa";
  if (t.includes("terrain")) return "terrain";
  if (t.includes("bureau")) return "bureau";
  if (t.includes("commerce") || t.includes("local")) return "commerce";
  return "maison";
}

/** Formatteur monétaire des surfaces publiques (fiche + cartes). */
export function formatGnf(price: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(price)} GNF`;
}

/** Évite d’afficher u1 / ag1 / adm-1 au public. */
function looksLikeTechId(value: string | null | undefined): boolean {
  if (!value) return true;
  const v = value.trim();
  return /^(u|ag|adm|prop|ad)[-_]?\d+$/i.test(v) || /^(u|ag)\d+$/i.test(v);
}

function initialsFromName(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function resolveAgentFromListing(listing: DemoListing): AgentDetails {
  const adv = listing.advertiser;
  if (adv?.missing) {
    return {
      name: "Annonceur indisponible",
      agencyName: "",
      phone: "",
      whatsapp: "",
      initials: "?",
      verified: false,
      accountType: "",
      unavailable: true,
    };
  }

  const isAgency =
    adv?.type === "AGENCE" || listing.advertiserType === "AGENCE";
  const rawName = (adv?.name || listing.owner || "").trim();
  if (!rawName || looksLikeTechId(rawName)) {
    return {
      name: "Annonceur indisponible",
      agencyName: "",
      phone: "",
      whatsapp: "",
      initials: "?",
      verified: false,
      accountType: "",
      unavailable: true,
    };
  }

  const roleLabel = isAgency ? "Agence" : "Propriétaire";
  const verified = Boolean(adv?.verified);
  return {
    name: rawName,
    agencyName: roleLabel,
    phone: "",
    whatsapp: "",
    initials: adv?.initials || initialsFromName(rawName),
    verified,
    accountType: verified
      ? isAgency
        ? "Agence vérifiée"
        : "Propriétaire vérifié"
      : roleLabel,
    unavailable: false,
  };
}

/** Map Demo API listing (+ optional property) → public Property card/detail shape. */
export function mapDemoListingToProperty(
  listing: DemoListing,
  property?: DemoProperty | null,
): Property {
  const operationValue = listing.operation === "LOCATION" ? "location" : "vente";
  const operation =
    listing.operation === "LOCATION" ? ("À louer" as const) : ("À vendre" as const);
  const rawImages =
    property?.media?.length
      ? property.media
      : property?.images?.length
        ? property.images
        : listing.media?.length
          ? listing.media
          : listing.images || [];
  const gallery = toGalleryMedia(rawImages, listing.id, PROPERTY_PLACEHOLDER);
  const images = gallery.map((item) => item.url);
  const cover = getSafeCoverImage(rawImages, PROPERTY_PLACEHOLDER, listing.id);
  const areaNum = property?.area ?? 0;
  const type = listing.type || property?.type || "Villa";
  const city = property?.city || "";
  const district = property?.district || "";
  const location =
    property?.locationLabel ||
    [district, city].filter(Boolean).join(", ") ||
    "Guinée";
  const rentalTerms = listing.rentalTerms ?? null;
  const saleTerms = listing.saleTerms ?? null;
  // La périodicité vient des conditions de location ; « / mois » n'est plus
  // supposé pour toutes les annonces LOCATION.
  const pricePeriod =
    listing.operation === "LOCATION"
      ? rentPeriodSuffix(
          rentalTerms?.period ?? "MONTHLY",
          rentalTerms?.periodLabel,
        )
      : "";
  const availableFrom = rentalTerms?.availableFrom ?? saleTerms?.availableFrom;

  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    reference: listing.reference,
    publishedDate: listing.publishedAt
      ? new Date(listing.publishedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "",
    location,
    city: city.toLowerCase() || "conakry",
    district: district || city,
    price: formatGnf(listing.price),
    numericPrice: listing.price,
    pricePeriod: pricePeriod || undefined,
    operation,
    operationValue,
    category: type,
    categorySlug: categorySlugFromType(type),
    rooms: property?.bedrooms || undefined,
    bathrooms: property?.bathrooms || undefined,
    area: areaNum ? `${areaNum} m²` : "Non renseigné",
    numericArea: areaNum,
    availability: availableFrom
      ? formatAvailability(availableFrom)
      : property?.availability,
    rentalTerms,
    saleTerms,
    verified: true,
    featured: false,
    image: cover,
    gallery: images.length > 1 ? images : images.length === 1 ? images : undefined,
    description: listing.description || property?.description,
    agent: resolveAgentFromListing(listing),
    createdAt: listing.createdAt,
  };
}
