/**
 * Conservé pour référence / repli hors-ligne.
 * NE PLUS utiliser comme source de vérité : le catalogue public lit
 * GET /materials/catalog sur apps/demo-api.
 */

import type { CatalogSourceData } from "./types";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATEGORY_NAMES = [
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

const UNIT_SEEDS = [
  { id: "SAC", name: "Sac" },
  { id: "PIECE", name: "Pièce" },
  { id: "BARRE", name: "Barre" },
  { id: "KILOGRAMME", name: "Kilogramme" },
  { id: "TONNE", name: "Tonne" },
  { id: "M3", name: "m³" },
  { id: "LITRE", name: "Litre" },
  { id: "ROULEAU", name: "Rouleau" },
  { id: "CARTON", name: "Carton" },
  { id: "PALETTE", name: "Palette" },
  { id: "LOT", name: "Lot" },
] as const;

const PRODUCT_SEEDS = [
  {
    name: "Ciment 42.5",
    categoryId: "mc-ciment-et-liants",
    description:
      "Ciment Portland CEM II 42.5 adapté aux fondations, dalles et maçonnerie.",
    brand: "Dangote",
    reference: "CIM-425",
    unitId: "SAC",
    price: 100000,
    status: "ACTIF" as const,
    imageUrl: "",
  },
  {
    name: "Fer à béton 12 mm",
    categoryId: "mc-fer-et-acier",
    description: "Barre d’acier haute adhérence, diamètre 12 mm.",
    brand: "",
    reference: "FER-12",
    unitId: "BARRE",
    price: 45000,
    status: "ACTIF" as const,
    imageUrl: "",
  },
  {
    name: "Peinture intérieure 20 L",
    categoryId: "mc-peinture",
    description: "Peinture acrylique mate pour murs et plafonds intérieurs.",
    brand: "Seigneurie",
    reference: "PEI-20L",
    unitId: "LITRE",
    price: 350000,
    status: "ACTIF" as const,
    imageUrl: "",
  },
  {
    name: "Tuyau PVC 100 mm",
    categoryId: "mc-plomberie",
    description: "Tuyau PVC évacuation, diamètre 100 mm.",
    brand: "",
    reference: "PVC-100",
    unitId: "PIECE",
    price: 35000,
    status: "ACTIF" as const,
    imageUrl: "",
  },
  {
    name: "Carreau 60×60 cm",
    categoryId: "mc-carrelage-et-revetements",
    description: "Carrelage grès cérame 60 × 60 cm pour sols intérieurs.",
    brand: "",
    reference: "CAR-6060",
    unitId: "CARTON",
    price: 180000,
    status: "INACTIF" as const,
    imageUrl: "",
  },
] as const;

/** Ne plus figer de stock ici : la disponibilité vient exclusivement de demo-api. */

export function loadDemoCatalogSource(): CatalogSourceData {
  const categories = CATEGORY_NAMES.map((name) => {
    const slug = slugify(name);
    return {
      id: `mc-${slug}`,
      name,
      slug,
      status: "ACTIF" as const,
    };
  });

  const units = UNIT_SEEDS.map((unit) => ({
    id: unit.id,
    name: unit.name,
    status: "ACTIF" as const,
  }));

  const products = PRODUCT_SEEDS.map((seed) => {
    const slug = slugify(seed.name);
    return {
      id: `mp-${slug}`,
      slug,
      name: seed.name,
      categoryId: seed.categoryId,
      description: seed.description,
      brand: seed.brand,
      reference: seed.reference,
      unitId: seed.unitId,
      price: seed.price,
      imageUrl: seed.imageUrl,
      status: seed.status,
    };
  });

  const stocks = products.map((product) => ({
    productId: product.id,
    quantity: 0,
    reservedQuantity: 0,
    minimumQuantity: 0,
    status: "ACTIF" as const,
  }));

  return { products, categories, units, stocks };
}
