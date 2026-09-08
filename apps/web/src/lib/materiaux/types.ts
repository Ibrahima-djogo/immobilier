/**
 * Surface publique du catalogue matériaux.
 * Les structures imbriquées (images, pricing, stock, supplier, delivery)
 * préparent les écrans CDC. Elles sont optionnelles : les champs plats
 * (imageUrl, price, unitLabel, availableQuantity) restent la lecture courante.
 */

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

export type MaterialQuoteLineDraft = {
  productId: string;
  quantity: number;
};

/** Brouillon UI — aucune API n’est branchée sur ce type. */
export type MaterialQuoteRequest = {
  productId: string;
  quantity: number;
  message?: string;
  desiredDate?: string;
  items?: MaterialQuoteLineDraft[];
};

export type PublicMaterialAvailability =
  | "DISPONIBLE"
  | "STOCK_FAIBLE"
  | "RUPTURE";

export type PublicMaterialSort =
  | "pertinence"
  | "nom"
  | "prix-asc"
  | "prix-desc";

export type PublicMaterialCategory = {
  slug: string;
  name: string;
};

export type PublicMaterial = {
  id: string;
  slug: string;
  name: string;
  description: string;
  brand: string;
  reference: string;
  categorySlug: string;
  categoryName: string;
  unitLabel: string;
  price: number;
  imageUrl: string;
  quantity?: number;
  reservedQuantity?: number;
  availableQuantity: number;
  availability: PublicMaterialAvailability;
  status?: "ACTIF" | "INACTIF";
  category?: MaterialCategorySnapshot;
  model?: string;
  technicalDetails?: string;
  images?: MaterialMediaImage[];
  pricing?: MaterialPricing;
  stock?: MaterialStockSnapshot;
  /** Préparé pour un affichage futur — non exposé par les écrans actuels. */
  supplier?: MaterialSupplierSnapshot;
  delivery?: MaterialDelivery;
  /** Champs API existants, repliés ensuite dans `supplier`. */
  supplierId?: string;
  supplierName?: string;
};

export type PublicCatalog = {
  categories: PublicMaterialCategory[];
  materials: PublicMaterial[];
};

export type CatalogProductRecord = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  brand: string;
  reference: string;
  unitId: string;
  price: number;
  imageUrl: string;
  status: "ACTIF" | "INACTIF";
  model?: string;
  technicalDetails?: string;
  images?: MaterialMediaImage[];
  pricing?: MaterialPricing;
  supplier?: MaterialSupplierSnapshot;
  delivery?: MaterialDelivery;
};

export type CatalogCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  status: "ACTIF" | "INACTIF";
};

export type CatalogUnitRecord = {
  id: string;
  name: string;
  status: "ACTIF" | "INACTIF";
};

export type CatalogStockRecord = {
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity?: number;
  minimumQuantity: number;
  status: "ACTIF" | "INACTIF";
  soldQuantity?: number;
  location?: string;
};

export type CatalogSourceData = {
  products: CatalogProductRecord[];
  categories: CatalogCategoryRecord[];
  units: CatalogUnitRecord[];
  stocks: CatalogStockRecord[];
};
