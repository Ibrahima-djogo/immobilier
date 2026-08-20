/**
 * Champs affichés / validés selon le type de bien.
 * Clés = valeurs du formulaire (VILLA, TERRAIN, …).
 */
export type PropertyTypeKey =
  | "VILLA"
  | "APPARTEMENT"
  | "MAISON"
  | "TERRAIN"
  | "BUREAU"
  | "COMMERCE";

export type PropertyTypeFields = {
  surface: boolean;
  bedrooms: boolean;
  bathrooms: boolean;
};

export const PROPERTY_TYPE_FIELDS: Record<PropertyTypeKey, PropertyTypeFields> =
  {
    MAISON: { surface: true, bedrooms: true, bathrooms: true },
    VILLA: { surface: true, bedrooms: true, bathrooms: true },
    APPARTEMENT: { surface: true, bedrooms: true, bathrooms: true },
    TERRAIN: { surface: true, bedrooms: false, bathrooms: false },
    BUREAU: { surface: true, bedrooms: false, bathrooms: true },
    COMMERCE: { surface: true, bedrooms: false, bathrooms: true },
  };

export function normalizePropertyTypeKey(type: string): PropertyTypeKey {
  const raw = String(type || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (raw.includes("TERRAIN")) return "TERRAIN";
  if (raw.includes("APPART")) return "APPARTEMENT";
  if (raw.includes("VILLA")) return "VILLA";
  if (raw.includes("MAISON")) return "MAISON";
  if (raw.includes("BUREAU")) return "BUREAU";
  if (raw.includes("COMMERCE") || raw.includes("LOCAL")) return "COMMERCE";
  return "VILLA";
}

export function getPropertyTypeFields(type: string): PropertyTypeFields {
  return PROPERTY_TYPE_FIELDS[normalizePropertyTypeKey(type)];
}

export function labelPropertyType(type: string): string {
  switch (normalizePropertyTypeKey(type)) {
    case "APPARTEMENT":
      return "Appartement";
    case "MAISON":
      return "Maison";
    case "TERRAIN":
      return "Terrain";
    case "BUREAU":
      return "Bureau";
    case "COMMERCE":
      return "Commerce";
    default:
      return "Villa";
  }
}

/** Parse chambre/SDB : null si le type ne les utilise pas. */
export function parseOptionalRooms(
  type: string,
  kind: "bedrooms" | "bathrooms",
  raw: string | number | null | undefined,
): number | null {
  const fields = getPropertyTypeFields(type);
  if (!fields[kind]) return null;
  if (raw === "" || raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
}

export function shouldShowRoomCount(
  type: string,
  value: number | null | undefined,
): boolean {
  const fields = getPropertyTypeFields(type);
  if (!fields.bedrooms && !fields.bathrooms) {
    // TERRAIN etc. — never show 0 chambre
    return false;
  }
  return value != null && value !== undefined;
}
