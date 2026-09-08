/**
 * Catégories de matériaux de construction — modèle de démonstration frontend.
 * À remplacer par l’API Spring Boot lorsque le backend sera disponible.
 */

export type MaterialCategoryStatus = "ACTIF" | "INACTIF";

export type MaterialCategory = {
  id: string;
  name: string;
  slug: string;
  status: MaterialCategoryStatus;
  createdAt: string;
  updatedAt: string;
};

export const MATERIAL_CATEGORY_SEED_NAMES = [
  "Ciment et liants",
  "Sable et gravier",
  "Fer et acier",
  "Bois",
  "Briques et parpaings",
  "Toiture",
  "Carrelage et revêtements",
  "Peinture",
  "Plomberie",
  "Électricité",
  "Portes et fenêtres",
  "Quincaillerie",
  "Étanchéité",
] as const;

const SEED_CREATED_AT = "2026-08-01T10:00:00.000Z";

export function slugifyCategoryName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCategoryName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function uniqueCategorySlug(
  name: string,
  existing: MaterialCategory[],
  excludeId?: string,
) {
  const base = slugifyCategoryName(name) || "categorie";
  const taken = (slug: string) =>
    existing.some((item) => item.slug === slug && item.id !== excludeId);
  if (!taken(base)) return base;
  let index = 2;
  while (taken(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function formatCategoryDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function cloneMaterialCategorySeeds(): MaterialCategory[] {
  return MATERIAL_CATEGORY_SEED_NAMES.map((name) => {
    const slug = slugifyCategoryName(name);
    return {
      id: `mc-${slug}`,
      name,
      slug,
      status: "ACTIF",
      createdAt: SEED_CREATED_AT,
      updatedAt: SEED_CREATED_AT,
    };
  });
}
