/**
 * Unités de vente catalogue — modèle de démonstration frontend.
 * Les identifiants historiques (SAC, PIECE, …) sont conservés pour
 * ne pas casser les matériaux déjà enregistrés.
 * À remplacer par l’API Spring Boot lorsque le backend sera disponible.
 */

import {
  normalizeCategoryName,
  slugifyCategoryName,
} from "./categories";

export type MaterialUnitStatus = "ACTIF" | "INACTIF";

export type MaterialUnit = {
  id: string;
  name: string;
  symbol: string;
  slug: string;
  status: MaterialUnitStatus;
  createdAt: string;
  updatedAt: string;
};

/** @deprecated alias conservé pour les fiches produits (id d’unité). */
export type MaterialSaleUnit = string;

const SEED_CREATED_AT = "2026-08-01T10:00:00.000Z";

export const MATERIAL_UNIT_SEEDS: Array<
  Omit<MaterialUnit, "createdAt" | "updatedAt" | "status">
> = [
  { id: "SAC", name: "Sac", symbol: "sac", slug: "sac" },
  { id: "PIECE", name: "Pièce", symbol: "pce", slug: "piece" },
  { id: "BARRE", name: "Barre", symbol: "barre", slug: "barre" },
  { id: "KILOGRAMME", name: "Kilogramme", symbol: "kg", slug: "kilogramme" },
  { id: "TONNE", name: "Tonne", symbol: "t", slug: "tonne" },
  { id: "M3", name: "m³", symbol: "m³", slug: "metre-cube" },
  { id: "LITRE", name: "Litre", symbol: "L", slug: "litre" },
  { id: "ROULEAU", name: "Rouleau", symbol: "rl", slug: "rouleau" },
  { id: "CARTON", name: "Carton", symbol: "ctn", slug: "carton" },
  { id: "PALETTE", name: "Palette", symbol: "pal", slug: "palette" },
  { id: "LOT", name: "Lot", symbol: "lot", slug: "lot" },
];

export function slugifyUnitName(value: string) {
  return slugifyCategoryName(value);
}

export function normalizeUnitName(value: string) {
  return normalizeCategoryName(value);
}

export function uniqueUnitSlug(
  name: string,
  existing: MaterialUnit[],
  excludeId?: string,
) {
  const generated = slugifyUnitName(name);
  const base = generated.length >= 2 ? generated : "unite";
  const taken = (slug: string) =>
    existing.some((item) => item.slug === slug && item.id !== excludeId);
  if (!taken(base)) return base;
  let index = 2;
  while (taken(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function labelSaleUnit(unitId: string, units: MaterialUnit[] = []) {
  return units.find((item) => item.id === unitId)?.name ?? unitId;
}

export function selectableUnits(
  units: MaterialUnit[],
  currentUnitId?: string,
) {
  return units.filter(
    (unit) => unit.status === "ACTIF" || unit.id === currentUnitId,
  );
}

export function cloneMaterialUnitSeeds(): MaterialUnit[] {
  return MATERIAL_UNIT_SEEDS.map((seed) => ({
    ...seed,
    status: "ACTIF",
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_CREATED_AT,
  }));
}
