export type ContentScope = "tous" | "biens" | "terrains" | "materiaux";

export const CONTENT_SCOPES: { value: ContentScope; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "biens", label: "Biens" },
  { value: "terrains", label: "Terrains" },
  { value: "materiaux", label: "Matériaux" },
];

function categoriesFromParams(searchParams: { get(name: string): string | null }) {
  return String(searchParams.get("categorie") || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function readContentScope(searchParams: {
  get(name: string): string | null;
}): ContentScope {
  const raw = String(searchParams.get("contenu") || "").trim().toLowerCase();
  if (
    raw === "tous" ||
    raw === "biens" ||
    raw === "terrains" ||
    raw === "materiaux"
  ) {
    return raw;
  }
  const categories = categoriesFromParams(searchParams);
  if (categories.length === 1 && categories[0] === "terrain") return "terrains";
  const operation = String(searchParams.get("operation") || "").trim();
  if (operation === "vente" || operation === "location") return "biens";
  return "tous";
}

export function applyContentScope(
  current: URLSearchParams,
  next: ContentScope,
) {
  const params = new URLSearchParams(current.toString());
  if (next === "tous") params.delete("contenu");
  else params.set("contenu", next);

  if (next === "materiaux") {
    params.delete("operation");
    params.delete("categorie");
    params.delete("ville");
    params.delete("quartier");
    params.delete("localisation");
    params.delete("chambres");
    params.delete("verifie");
  } else {
    params.delete("famille");
    params.delete("dispo");
  }

  params.set("page", "1");
  return params;
}

export function isTerrainCategory(slug: string) {
  return slug.toLowerCase() === "terrain";
}
