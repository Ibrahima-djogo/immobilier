/**
 * Fournisseurs de matériaux — modèle de démonstration frontend.
 * À remplacer par l’API Spring Boot lorsque le backend sera disponible.
 */

import {
  normalizeCategoryName,
  slugifyCategoryName,
} from "./categories";

export const MATERIAL_SUPPLIER_TYPES = [
  "PARTICULIER",
  "PROFESSIONNEL",
] as const;

export type MaterialSupplierType = (typeof MATERIAL_SUPPLIER_TYPES)[number];

export type MaterialSupplierStatus = "ACTIF" | "INACTIF";

export type MaterialSupplierVerification =
  | "NON_VERIFIE"
  | "EN_VERIFICATION"
  | "VERIFIE";

export type MaterialSupplier = {
  id: string;
  type: MaterialSupplierType;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district?: string;
  description: string;
  status: MaterialSupplierStatus;
  verificationStatus: MaterialSupplierVerification;
  history?: MaterialSupplierHistoryEntry[];
  productCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type MaterialSupplierHistoryEntry = {
  action: string;
  changedAt: string;
  changedBy: string;
  changes?: Record<string, { from?: unknown; to?: unknown }>;
};

const SEED_CREATED_AT = "2026-08-15T10:00:00.000Z";

export const MATERIAL_SUPPLIER_SEEDS: Array<
  Omit<MaterialSupplier, "id" | "slug" | "createdAt" | "updatedAt">
> = [
  {
    type: "PROFESSIONNEL",
    name: "Société Matériaux Conakry",
    phone: "+224 622 10 20 30",
    email: "contact@materiaux-conakry.example",
    address: "Quartier Minière, Dixinn",
    city: "Conakry",
    district: "Minière",
    description: "Grossiste en ciment, fer et granulats.",
    status: "ACTIF",
    verificationStatus: "NON_VERIFIE",
  },
  {
    type: "PROFESSIONNEL",
    name: "Dépôt Kipé",
    phone: "+224 621 44 55 66",
    email: "",
    address: "Route de Kipé",
    city: "Conakry",
    district: "Kipé",
    description: "Dépôt de peinture, plomberie et quincaillerie.",
    status: "ACTIF",
    verificationStatus: "NON_VERIFIE",
  },
  {
    type: "PARTICULIER",
    name: "Mamadou Bah",
    phone: "+224 620 11 00 44",
    email: "",
    address: "",
    city: "Coyah",
    district: "",
    description: "Revendeur indépendant de sable et gravier.",
    status: "INACTIF",
    verificationStatus: "NON_VERIFIE",
  },
];

export function slugifySupplierName(value: string) {
  return slugifyCategoryName(value);
}

export function normalizeSupplierName(value: string) {
  return normalizeCategoryName(value);
}

export function uniqueSupplierSlug(
  name: string,
  existing: MaterialSupplier[],
  excludeId?: string,
) {
  const generated = slugifySupplierName(name);
  const base = generated.length >= 2 ? generated : "fournisseur";
  const taken = (slug: string) =>
    existing.some((item) => item.slug === slug && item.id !== excludeId);
  if (!taken(base)) return base;
  let index = 2;
  while (taken(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function labelSupplierType(type: string) {
  if (type === "PROFESSIONNEL") return "Professionnel";
  if (type === "PARTICULIER") return "Particulier";
  return type;
}

export function labelSupplier(supplierId: string, suppliers: MaterialSupplier[]) {
  return suppliers.find((item) => item.id === supplierId)?.name ?? "";
}

export function selectableSuppliers(
  suppliers: MaterialSupplier[],
  currentSupplierId?: string,
) {
  return suppliers.filter(
    (supplier) =>
      supplier.status === "ACTIF" || supplier.id === currentSupplierId,
  );
}

export function cloneMaterialSupplierSeeds(): MaterialSupplier[] {
  const created: MaterialSupplier[] = [];
  for (const seed of MATERIAL_SUPPLIER_SEEDS) {
    const slug = uniqueSupplierSlug(seed.name, created);
    created.push({
      ...seed,
      id: `ms-${slug}`,
      slug,
      createdAt: SEED_CREATED_AT,
      updatedAt: SEED_CREATED_AT,
    });
  }
  return created;
}
