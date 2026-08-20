/** Présentation Property — valeurs manquantes sans faux fallbacks métier. */

export const EMPTY_LABEL = "Non renseigné";

export function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return true;
}

/** Affiche la vraie valeur ou "Non renseigné" — jamais "—" ni ville inventée. */
export function displayValue(
  value: unknown,
  emptyLabel: string = EMPTY_LABEL,
): string {
  if (!hasValue(value)) return emptyLabel;
  if (typeof value === "number") return String(value);
  return String(value).trim();
}

export function isTerrainType(type: string | null | undefined): boolean {
  return /terrain/i.test(String(type || ""));
}

export function formatCoordinates(
  coordinates: { lat: number; lng: number } | null | undefined,
): string | null {
  if (!coordinates) return null;
  const lat = Number(coordinates.lat);
  const lng = Number(coordinates.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function propertyAdminAddress(property: {
  adminAddress?: string | null;
  district?: string | null;
  commune?: string | null;
  city?: string | null;
}): string {
  const existing = String(property.adminAddress || "").trim();
  if (existing) return existing;
  return (
    [property.district, property.commune, property.city]
      .map((v) => String(v || "").trim())
      .filter(Boolean)
      .join(", ")
  );
}

export function propertyLocationLabel(property: {
  locationLabel?: string | null;
  district?: string | null;
  commune?: string | null;
  city?: string | null;
}): string {
  const existing = String(property.locationLabel || "").trim();
  if (existing) return existing;
  return (
    [property.district, property.commune, property.city]
      .map((v) => String(v || "").trim())
      .filter(Boolean)
      .join(", ")
  );
}
