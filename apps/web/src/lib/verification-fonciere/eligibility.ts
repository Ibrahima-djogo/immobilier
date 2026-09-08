import { normalizePropertyTypeKey } from "@/lib/property/typeFields";

/**
 * Éligibilité frontend à la vérification foncière officielle.
 * Distincte de `verified` (annonce) et de `legalVerificationStatus` (contrôle interne).
 */
export function isFonciereTerrainEligible(
  propertyType?: string | null,
  categorySlug?: string | null,
) {
  if (categorySlug && categorySlug.toLowerCase() === "terrain") return true;
  if (!propertyType) return false;
  return normalizePropertyTypeKey(propertyType) === "TERRAIN";
}
