/**
 * DEMO ONLY — accès au stock des matériaux.
 * Source de vérité : Demo API. localStorage = repli hors-ligne uniquement.
 * quantity n’est jamais modifiée par une réservation.
 */

import { materialProductStorage } from "./product-storage";
import type { MaterialProduct } from "./products";
import {
  emptyStockForProduct,
  type MaterialStock,
  type MaterialStockStatus,
} from "./stocks";
import { apiUpdateStock } from "./material-api";
import {
  forceRefreshMaterialStores,
  getMaterialSnapshot,
  isMaterialRemoteReady,
  patchSnapshot,
} from "./remote-cache";

export const MATERIAL_STOCKS_KEY = "demeure-guinee-admin-material-stocks";

export type CreateMaterialStockInput = {
  productId: string;
  quantity?: number;
  minimumQuantity?: number;
  location?: string;
  status?: MaterialStockStatus;
};

export type UpdateMaterialStockInput = {
  quantity?: number;
  minimumQuantity?: number;
  location?: string;
  status?: MaterialStockStatus;
};

export type MaterialStockRow = {
  product: MaterialProduct;
  stock: MaterialStock;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isFiniteQuantity(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isMaterialStock(value: unknown): value is MaterialStock {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MaterialStock>;
  return (
    typeof item.id === "string" &&
    typeof item.productId === "string" &&
    item.productId.length > 0 &&
    isFiniteQuantity(item.quantity) &&
    isFiniteQuantity(item.reservedQuantity) &&
    isFiniteQuantity(item.minimumQuantity) &&
    typeof item.location === "string" &&
    (item.status === "ACTIF" || item.status === "INACTIF") &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function readRaw(): MaterialStock[] | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(MATERIAL_STOCKS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isMaterialStock);
  } catch {
    return null;
  }
}

function writeAll(stocks: MaterialStock[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(MATERIAL_STOCKS_KEY, JSON.stringify(stocks));
}

function persistStocks(stocks: MaterialStock[]) {
  writeAll(stocks);
  if (getMaterialSnapshot()) {
    patchSnapshot("stocks", stocks);
  }
}

function withoutPersistedAvailable(stock: MaterialStock): MaterialStock {
  const next = { ...stock };
  delete next.availableQuantity;
  return next;
}

function assertQuantity(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} doit être un nombre supérieur ou égal à 0.`);
  }
}

function assertProduct(productId: string) {
  const product = materialProductStorage.findById(productId);
  if (!product) {
    throw new Error("Le stock doit être rattaché à un matériau existant.");
  }
  return product;
}

export function ensureMaterialStockStore(): MaterialStock[] {
  const remote = getMaterialSnapshot()?.stocks;
  if (remote) return remote.map((item) => ({ ...item }));

  const products = materialProductStorage.list();
  const productIds = new Set(products.map((item) => item.id));
  const existing = readRaw() ?? [];
  const kept = existing.filter((item) => productIds.has(item.productId));
  const knownProducts = new Set(kept.map((item) => item.productId));

  let changed = kept.length !== existing.length;
  const next = [...kept];
  for (const product of products) {
    if (knownProducts.has(product.id)) continue;
    next.push(emptyStockForProduct(product.id));
    changed = true;
  }

  if (changed || existing.length === 0) writeAll(next);
  return next.map((item) => ({ ...item }));
}

export const materialStockStorage = {
  list(): MaterialStock[] {
    return ensureMaterialStockStore().sort((left, right) =>
      left.updatedAt < right.updatedAt ? 1 : -1,
    );
  },

  listRows(): MaterialStockRow[] {
    const stocks = ensureMaterialStockStore();
    return materialProductStorage.list().map((product) => ({
      product,
      stock:
        stocks.find((item) => item.productId === product.id) ??
        emptyStockForProduct(product.id),
    }));
  },

  findById(id: string): MaterialStock | undefined {
    return ensureMaterialStockStore().find((item) => item.id === id);
  },

  findByProductId(productId: string): MaterialStock | undefined {
    if (!materialProductStorage.findById(productId)) return undefined;
    return (
      ensureMaterialStockStore().find((item) => item.productId === productId) ??
      emptyStockForProduct(productId)
    );
  },

  locations(): string[] {
    const values = new Set<string>();
    for (const item of ensureMaterialStockStore()) {
      const location = item.location.trim();
      if (location) values.add(location);
    }
    return [...values].sort((left, right) =>
      left.localeCompare(right, "fr", { sensitivity: "base" }),
    );
  },

  create(input: CreateMaterialStockInput): MaterialStock {
    assertProduct(input.productId);
    const stocks = ensureMaterialStockStore();
    if (stocks.some((item) => item.productId === input.productId)) {
      throw new Error("Ce matériau a déjà une fiche de stock.");
    }
    const quantity = input.quantity ?? 0;
    const minimumQuantity = input.minimumQuantity ?? 0;
    assertQuantity(quantity, "La quantité");
    assertQuantity(minimumQuantity, "Le seuil minimum");

    const now = new Date().toISOString();
    const next: MaterialStock = {
      id: `mst-${input.productId}`,
      productId: input.productId,
      quantity,
      reservedQuantity: 0,
      minimumQuantity,
      location: input.location?.trim() ?? "",
      status: input.status ?? "ACTIF",
      createdAt: now,
      updatedAt: now,
    };
    persistStocks([next, ...stocks]);
    return next;
  },

  async update(
    id: string,
    patch: UpdateMaterialStockInput,
  ): Promise<MaterialStock | undefined> {
    if (isMaterialRemoteReady() && patch.quantity === undefined) {
      const updated = await apiUpdateStock(id, patch);
      await forceRefreshMaterialStores();
      return updated;
    }
    const stocks = ensureMaterialStockStore();
    const index = stocks.findIndex((item) => item.id === id);
    if (index < 0) return undefined;

    const current = stocks[index];
    assertProduct(current.productId);
    const quantity = patch.quantity ?? current.quantity;
    const minimumQuantity = patch.minimumQuantity ?? current.minimumQuantity;
    assertQuantity(quantity, "La quantité");
    assertQuantity(minimumQuantity, "Le seuil minimum");
    if (quantity < current.reservedQuantity) {
      throw new Error(
        "La quantité physique ne peut pas passer sous la quantité réservée.",
      );
    }

    const next: MaterialStock = withoutPersistedAvailable({
      ...current,
      quantity,
      minimumQuantity,
      location:
        patch.location !== undefined ? patch.location.trim() : current.location,
      status: patch.status ?? current.status,
      reservedQuantity: current.reservedQuantity,
      updatedAt: new Date().toISOString(),
    });
    stocks[index] = next;
    persistStocks(stocks);
    return next;
  },

  async updateByProductId(
    productId: string,
    patch: UpdateMaterialStockInput,
  ): Promise<MaterialStock> {
    if (isMaterialRemoteReady()) {
      const current = materialStockStorage.findByProductId(productId);
      if (!current) {
        throw new Error("Le stock doit être rattaché à un matériau existant.");
      }
      const updated = await apiUpdateStock(current.id, {
        minimumQuantity: patch.minimumQuantity,
        location: patch.location,
        status: patch.status,
      });
      await forceRefreshMaterialStores();
      return updated;
    }
    const current = materialStockStorage.findByProductId(productId);
    if (!current) {
      throw new Error("Le stock doit être rattaché à un matériau existant.");
    }
    const stocks = ensureMaterialStockStore();
    if (!stocks.some((item) => item.id === current.id)) {
      return materialStockStorage.create({
        productId,
        quantity: patch.quantity ?? current.quantity,
        minimumQuantity: patch.minimumQuantity ?? current.minimumQuantity,
        location: patch.location ?? current.location,
        status: patch.status ?? current.status,
      });
    }
    const updated = await materialStockStorage.update(current.id, patch);
    if (!updated) {
      throw new Error("Impossible de mettre à jour cette fiche de stock.");
    }
    return updated;
  },

  /**
   * Recalcule le réservé à partir des réservations ACTIVE.
   * Ne touche jamais quantity.
   */
  setReservedQuantity(id: string, reservedQuantity: number): MaterialStock {
    const stocks = ensureMaterialStockStore();
    const index = stocks.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error("Fiche de stock introuvable.");
    }
    if (!Number.isFinite(reservedQuantity) || reservedQuantity < 0) {
      throw new Error("La quantité réservée ne peut pas être négative.");
    }
    const current = stocks[index];
    if (reservedQuantity > current.quantity) {
      throw new Error(
        "La quantité réservée ne peut pas dépasser le stock physique.",
      );
    }
    const next: MaterialStock = withoutPersistedAvailable({
      ...current,
      reservedQuantity,
      quantity: current.quantity,
      updatedAt: new Date().toISOString(),
    });
    stocks[index] = next;
    persistStocks(stocks);
    return next;
  },
};
