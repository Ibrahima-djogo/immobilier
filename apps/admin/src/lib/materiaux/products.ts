/**
 * Matériaux de construction (fiche catalogue) — modèle de démonstration frontend.
 * À remplacer par l’API Spring Boot lorsque le backend sera disponible.
 */

import { formatGnf } from "@/lib/administration/demo-data";

import {
  normalizeCategoryName,
  slugifyCategoryName,
} from "./categories";
import type { MaterialSaleUnit } from "./units";

export type MaterialProductStatus = "ACTIF" | "INACTIF";

export type MaterialMediaImage = {
  id?: string;
  url: string;
  alt?: string;
};

export type MaterialPricing = {
  price: number;
  currency?: string;
  unit: string;
  packaging?: string;
};

export type MaterialStockSnapshot = {
  available: number;
  reserved?: number;
  sold?: number;
  minimum?: number;
  location?: string;
};

export type MaterialSupplierSnapshot = {
  id?: string;
  name: string;
  verified?: boolean;
  location?: string;
};

export type MaterialDelivery = {
  zones: string[];
  delay?: string;
  conditions?: string;
};

export type MaterialCategorySnapshot = {
  id?: string;
  slug?: string;
  name: string;
};

export type MaterialProduct = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  brand: string;
  reference: string;
  unit: MaterialSaleUnit;
  supplierId: string;
  price: number;
  status: MaterialProductStatus;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
  technicalDetails?: string;
  category?: MaterialCategorySnapshot;
  images?: MaterialMediaImage[];
  pricing?: MaterialPricing;
  stock?: MaterialStockSnapshot;
  supplier?: MaterialSupplierSnapshot;
  delivery?: MaterialDelivery;
};

const SEED_CREATED_AT = "2026-08-10T10:00:00.000Z";

const PRODUCT_SEEDS: Array<
  Omit<MaterialProduct, "id" | "slug" | "createdAt" | "updatedAt">
> = [
  {
    name: "Ciment 42.5",
    categoryId: "mc-ciment-et-liants",
    description:
      "Ciment Portland CEM II 42.5 adapté aux fondations, dalles et maçonnerie.",
    brand: "Dangote",
    reference: "CIM-425",
    unit: "SAC",
    supplierId: "",
    price: 100000,
    status: "ACTIF",
    imageUrl: "",
  },
  {
    name: "Fer à béton 12 mm",
    categoryId: "mc-fer-et-acier",
    description: "Barre d’acier haute adhérence, diamètre 12 mm.",
    brand: "",
    reference: "FER-12",
    unit: "BARRE",
    supplierId: "",
    price: 45000,
    status: "ACTIF",
    imageUrl: "",
  },
  {
    name: "Peinture intérieure 20 L",
    categoryId: "mc-peinture",
    description: "Peinture acrylique mate pour murs et plafonds intérieurs.",
    brand: "Seigneurie",
    reference: "PEI-20L",
    unit: "LITRE",
    supplierId: "",
    price: 350000,
    status: "ACTIF",
    imageUrl: "",
  },
  {
    name: "Tuyau PVC 100 mm",
    categoryId: "mc-plomberie",
    description: "Tuyau PVC évacuation, diamètre 100 mm.",
    brand: "",
    reference: "PVC-100",
    unit: "PIECE",
    supplierId: "",
    price: 35000,
    status: "ACTIF",
    imageUrl: "",
  },
  {
    name: "Carreau 60×60 cm",
    categoryId: "mc-carrelage-et-revetements",
    description: "Carrelage grès cérame 60 × 60 cm pour sols intérieurs.",
    brand: "",
    reference: "CAR-6060",
    unit: "CARTON",
    supplierId: "",
    price: 180000,
    status: "INACTIF",
    imageUrl: "",
  },
];

export function uniqueProductSlug(
  name: string,
  existing: MaterialProduct[],
  excludeId?: string,
) {
  const base = slugifyCategoryName(name) || "materiau";
  const taken = (slug: string) =>
    existing.some((item) => item.slug === slug && item.id !== excludeId);
  if (!taken(base)) return base;
  let index = 2;
  while (taken(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function normalizeProductName(value: string) {
  return normalizeCategoryName(value);
}

export function formatCatalogPrice(price: number, unitLabel: string) {
  return `${formatGnf(price)} / ${unitLabel}`;
}

export function productImages(
  product: Pick<MaterialProduct, "images" | "imageUrl" | "name">,
): MaterialMediaImage[] {
  if (product.images?.length) return product.images;
  if (product.imageUrl) {
    return [{ url: product.imageUrl, alt: product.name }];
  }
  return [];
}

export function productImageUrl(
  product: Pick<MaterialProduct, "images" | "imageUrl">,
) {
  return product.images?.[0]?.url || product.imageUrl || "";
}

export function productPrice(product: Pick<MaterialProduct, "pricing" | "price">) {
  return product.pricing?.price ?? product.price;
}

export function productUnit(
  product: Pick<MaterialProduct, "pricing" | "unit">,
) {
  return product.pricing?.unit?.trim() || product.unit;
}

export function productPricing(
  product: Pick<MaterialProduct, "pricing" | "price" | "unit">,
): MaterialPricing {
  return {
    price: productPrice(product),
    currency: product.pricing?.currency ?? "GNF",
    unit: productUnit(product),
    packaging: product.pricing?.packaging,
  };
}

export function presentMaterialProduct(
  product: MaterialProduct,
  extras?: {
    category?: MaterialCategorySnapshot;
    stock?: MaterialStockSnapshot;
    supplier?: MaterialSupplierSnapshot;
    unitLabel?: string;
  },
): MaterialProduct {
  const unitLabel = extras?.unitLabel || productUnit(product);
  return {
    ...product,
    category: product.category ?? extras?.category,
    images: productImages(product),
    pricing: {
      ...productPricing(product),
      unit: unitLabel,
    },
    stock: product.stock ?? extras?.stock,
    supplier: product.supplier ?? extras?.supplier,
  };
}

export function cloneMaterialProductSeeds(): MaterialProduct[] {
  return PRODUCT_SEEDS.map((seed) => {
    const slug = slugifyCategoryName(seed.name);
    return {
      ...seed,
      id: `mp-${slug}`,
      slug,
      createdAt: SEED_CREATED_AT,
      updatedAt: SEED_CREATED_AT,
    };
  });
}
