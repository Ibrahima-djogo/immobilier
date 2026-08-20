/**
 * Clés canoniques des types de biens, alignées sur `account-scopes.js`
 * (Demo API) et sur le front annonceur.
 */
export type PropertyTypeKey =
  | "VILLA"
  | "APPARTEMENT"
  | "MAISON"
  | "TERRAIN"
  | "BUREAU"
  | "COMMERCE";

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
