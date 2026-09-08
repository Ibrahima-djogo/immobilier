/**
 * DEMO ONLY — accès aux réservations de stock.
 * Source de vérité : Demo API. localStorage = repli hors-ligne uniquement.
 */

import {
  apiCreateReservation,
  apiReleaseReservation,
} from "./material-api";
import { materialProductStorage } from "./product-storage";
import {
  forceRefreshMaterialStores,
  getMaterialSnapshot,
  isMaterialRemoteReady,
  patchSnapshot,
} from "./remote-cache";
import { materialStockStorage } from "./stock-storage";
import { unitRequiresInteger } from "./movements";
import { materialUnitStorage } from "./unit-storage";
import {
  DEFAULT_RESERVATION_HOURS,
  expiresAtFromHours,
  isReservationExpired,
  sumActiveReserved,
  type MaterialStockReservation,
} from "./reservations";
import { availableQuantity } from "./stocks";

export const MATERIAL_STOCK_RESERVATIONS_KEY =
  "demeure-guinee-admin-material-stock-reservations";

export type CreateMaterialStockReservationInput = {
  productId: string;
  quantity: number;
  durationHours?: number;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isMaterialStockReservation(
  value: unknown,
): value is MaterialStockReservation {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MaterialStockReservation>;
  return (
    typeof item.id === "string" &&
    typeof item.stockId === "string" &&
    typeof item.productId === "string" &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0 &&
    (item.status === "ACTIVE" ||
      item.status === "EXPIRED" ||
      item.status === "RELEASED" ||
      item.status === "CONSUMED") &&
    typeof item.expiresAt === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string" &&
    (item.orderId == null || typeof item.orderId === "string") &&
    (item.orderReference == null || typeof item.orderReference === "string")
  );
}

function readRaw(): MaterialStockReservation[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(MATERIAL_STOCK_RESERVATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMaterialStockReservation);
  } catch {
    return [];
  }
}

function writeAll(reservations: MaterialStockReservation[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    MATERIAL_STOCK_RESERVATIONS_KEY,
    JSON.stringify(reservations),
  );
}

function persistReservations(reservations: MaterialStockReservation[]) {
  writeAll(reservations);
  if (getMaterialSnapshot()) {
    patchSnapshot("reservations", reservations);
  }
}

function syncReservedQuantity(
  reservations: MaterialStockReservation[],
  stockId: string,
) {
  const reserved = sumActiveReserved(reservations, stockId);
  const stock = materialStockStorage.findById(stockId);
  if (stock && stock.reservedQuantity === reserved) return reserved;
  materialStockStorage.setReservedQuantity(stockId, reserved);
  return reserved;
}

function expireDueReservations(reservations: MaterialStockReservation[]) {
  const now = new Date();
  const touched = new Set<string>();
  let changed = false;
  const next = reservations.map((item) => {
    if (!isReservationExpired(item, now)) return item;
    changed = true;
    touched.add(item.stockId);
    return {
      ...item,
      status: "EXPIRED" as const,
      updatedAt: now.toISOString(),
    };
  });
  return { next, changed, touched };
}

export function ensureMaterialStockReservationStore(): MaterialStockReservation[] {
  const remote = getMaterialSnapshot()?.reservations;
  if (remote) return remote.map((item) => ({ ...item }));

  const existing = readRaw();
  const { next, changed, touched } = expireDueReservations(existing);
  if (changed) {
    for (const stockId of touched) {
      syncReservedQuantity(next, stockId);
    }
    writeAll(next);
  }
  return next.map((item) => ({ ...item }));
}

export const materialStockReservationStorage = {
  list(): MaterialStockReservation[] {
    return ensureMaterialStockReservationStore().sort((left, right) =>
      left.createdAt < right.createdAt ? 1 : -1,
    );
  },

  findById(id: string): MaterialStockReservation | undefined {
    return ensureMaterialStockReservationStore().find((item) => item.id === id);
  },

  listByProductId(productId: string): MaterialStockReservation[] {
    return materialStockReservationStorage
      .list()
      .filter((item) => item.productId === productId);
  },

  async create(
    input: CreateMaterialStockReservationInput,
  ): Promise<MaterialStockReservation> {
    if (isMaterialRemoteReady()) {
      const created = await apiCreateReservation(input);
      await forceRefreshMaterialStores();
      return created;
    }
    const product = materialProductStorage.findById(input.productId);
    if (!product) {
      throw new Error("Choisissez un matériau existant.");
    }

    const stock = materialStockStorage.findByProductId(input.productId);
    if (!stock) {
      throw new Error("Aucun stock n’est rattaché à ce matériau.");
    }

    const quantity = input.quantity;
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("La quantité réservée doit être strictement positive.");
    }

    const unit = materialUnitStorage.findById(product.unit);
    const unitId = unit?.id ?? product.unit;
    if (unitRequiresInteger(unitId) && !Number.isInteger(quantity)) {
      throw new Error("La quantité doit être un nombre entier pour cette unité.");
    }

    const reservations = ensureMaterialStockReservationStore();
    const reserved = sumActiveReserved(reservations, stock.id);
    const available = availableQuantity({
      quantity: stock.quantity,
      reservedQuantity: reserved,
    });
    if (quantity > available) {
      throw new Error(
        `Réservation refusée : seulement ${available} disponible(s) (physique ${stock.quantity}, déjà réservé ${reserved}).`,
      );
    }

    const hours = input.durationHours ?? DEFAULT_RESERVATION_HOURS;
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new Error("Indiquez une durée d’expiration valide.");
    }

    const now = new Date().toISOString();
    const reservation: MaterialStockReservation = {
      id: `msr-${Date.now()}`,
      stockId: stock.id,
      productId: product.id,
      quantity,
      status: "ACTIVE",
      expiresAt: expiresAtFromHours(hours),
      createdAt: now,
      updatedAt: now,
    };

    const next = [reservation, ...reservations];
    persistReservations(next);
    try {
      syncReservedQuantity(next, stock.id);
    } catch (error) {
      persistReservations(reservations);
      throw error;
    }
    return reservation;
  },

  async release(id: string): Promise<MaterialStockReservation> {
    if (isMaterialRemoteReady()) {
      const released = await apiReleaseReservation(id);
      await forceRefreshMaterialStores();
      return released;
    }
    const reservations = ensureMaterialStockReservationStore();
    const index = reservations.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error("Réservation introuvable.");
    }
    const current = reservations[index];
    if (current.status !== "ACTIVE") {
      throw new Error("Seule une réservation active peut être libérée.");
    }

    const released: MaterialStockReservation = {
      ...current,
      status: "RELEASED",
      updatedAt: new Date().toISOString(),
    };
    const next = [...reservations];
    next[index] = released;
    persistReservations(next);
    try {
      syncReservedQuantity(next, current.stockId);
    } catch (error) {
      persistReservations(reservations);
      throw error;
    }
    return released;
  },

  /** Recalcule reservedQuantity = somme des réservations ACTIVE du stock. */
  recalculateReservedQuantity(stockId: string): number {
    const remote = getMaterialSnapshot();
    if (remote) {
      const stock = remote.stocks.find((item) => item.id === stockId);
      return stock?.reservedQuantity ?? 0;
    }
    const reservations = ensureMaterialStockReservationStore();
    return syncReservedQuantity(reservations, stockId);
  },
};
