/**
 * DEMO ONLY — accès aux mouvements de stock.
 * Source de vérité : Demo API. localStorage = repli hors-ligne uniquement.
 */

import { apiCreateMovement } from "./material-api";
import { materialProductStorage } from "./product-storage";
import {
  forceRefreshMaterialStores,
  getMaterialSnapshot,
  isMaterialRemoteReady,
  patchSnapshot,
} from "./remote-cache";
import { materialStockStorage } from "./stock-storage";
import { materialSupplierStorage } from "./supplier-storage";
import { materialUnitStorage } from "./unit-storage";
import {
  previewMovement,
  unitRequiresInteger,
  type MaterialStockMovement,
  type MaterialStockMovementType,
} from "./movements";

export const MATERIAL_STOCK_MOVEMENTS_KEY =
  "demeure-guinee-admin-material-stock-movements";

export type CreateMaterialStockMovementInput = {
  productId: string;
  type: MaterialStockMovementType;
  quantity?: number;
  adjustmentTargetQuantity?: number;
  reason: string;
  note?: string;
  supplierId?: string;
  createdBy?: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isMaterialStockMovement(value: unknown): value is MaterialStockMovement {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MaterialStockMovement>;
  return (
    typeof item.id === "string" &&
    typeof item.stockId === "string" &&
    typeof item.productId === "string" &&
    (item.type === "ENTREE" ||
      item.type === "SORTIE" ||
      item.type === "AJUSTEMENT" ||
      item.type === "PERTE" ||
      item.type === "INVENTAIRE") &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0 &&
    typeof item.quantityBefore === "number" &&
    Number.isFinite(item.quantityBefore) &&
    typeof item.quantityAfter === "number" &&
    Number.isFinite(item.quantityAfter) &&
    item.quantityAfter >= 0 &&
    (item.adjustmentTargetQuantity === null ||
      (typeof item.adjustmentTargetQuantity === "number" &&
        Number.isFinite(item.adjustmentTargetQuantity))) &&
    typeof item.reason === "string" &&
    typeof item.note === "string" &&
    typeof item.supplierId === "string" &&
    typeof item.createdBy === "string" &&
    typeof item.createdAt === "string"
  );
}

function readRaw(): MaterialStockMovement[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(MATERIAL_STOCK_MOVEMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMaterialStockMovement);
  } catch {
    return [];
  }
}

function writeAll(movements: MaterialStockMovement[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    MATERIAL_STOCK_MOVEMENTS_KEY,
    JSON.stringify(movements),
  );
}

export function ensureMaterialStockMovementStore(): MaterialStockMovement[] {
  const remote = getMaterialSnapshot()?.movements;
  if (remote) return remote.map((item) => ({ ...item }));
  const existing = readRaw();
  return existing.map((item) => ({ ...item }));
}

function assertIntegerIfRequired(productId: string, value: number, label: string) {
  const product = materialProductStorage.findById(productId);
  if (!product) return;
  const unit = materialUnitStorage.findById(product.unit);
  const unitId = unit?.id ?? product.unit;
  if (unitRequiresInteger(unitId) && !Number.isInteger(value)) {
    throw new Error(`${label} doit être un nombre entier pour cette unité.`);
  }
}

export const materialStockMovementStorage = {
  list(): MaterialStockMovement[] {
    return ensureMaterialStockMovementStore().sort((left, right) =>
      left.createdAt < right.createdAt ? 1 : -1,
    );
  },

  findById(id: string): MaterialStockMovement | undefined {
    return ensureMaterialStockMovementStore().find((item) => item.id === id);
  },

  listByProductId(productId: string): MaterialStockMovement[] {
    return materialStockMovementStorage
      .list()
      .filter((item) => item.productId === productId);
  },

  async create(
    input: CreateMaterialStockMovementInput,
  ): Promise<MaterialStockMovement> {
    if (isMaterialRemoteReady()) {
      const created = await apiCreateMovement(input);
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

    const reason = input.reason.trim();
    if (!reason) {
      throw new Error("Indiquez le motif du mouvement.");
    }

    const supplierId = input.supplierId?.trim() ?? "";
    if (supplierId) {
      if (input.type !== "ENTREE") {
        throw new Error("Le fournisseur n’est renseigné que pour une entrée.");
      }
      if (!materialSupplierStorage.findById(supplierId)) {
        throw new Error("Choisissez un fournisseur existant.");
      }
    }

    const preview = previewMovement({
      type: input.type,
      quantityBefore: stock.quantity,
      quantity: input.quantity,
      adjustmentTargetQuantity: input.adjustmentTargetQuantity,
    });

    assertIntegerIfRequired(product.id, preview.quantity, "La quantité");
    if (preview.adjustmentTargetQuantity != null) {
      assertIntegerIfRequired(
        product.id,
        preview.adjustmentTargetQuantity,
        "La quantité constatée",
      );
    }

    const movement: MaterialStockMovement = {
      id: `msm-${Date.now()}`,
      stockId: stock.id,
      productId: product.id,
      type: input.type,
      quantity: preview.quantity,
      quantityBefore: preview.quantityBefore,
      quantityAfter: preview.quantityAfter,
      adjustmentTargetQuantity: preview.adjustmentTargetQuantity,
      reason,
      note: input.note?.trim() ?? "",
      supplierId,
      createdBy: input.createdBy?.trim() ?? "",
      createdAt: new Date().toISOString(),
    };

    const existing = ensureMaterialStockMovementStore();
    writeAll([movement, ...existing]);

    try {
      const updated = await materialStockStorage.update(stock.id, {
        quantity: preview.quantityAfter,
      });
      if (!updated) {
        throw new Error("Impossible de mettre à jour le stock.");
      }
    } catch (error) {
      writeAll(existing);
      throw error;
    }

    if (getMaterialSnapshot()) {
      patchSnapshot("movements", [movement, ...existing]);
    }

    return movement;
  },
};
