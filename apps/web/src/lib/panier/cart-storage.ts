/**
 * Persistance navigateur du panier matériaux.
 * Persiste uniquement productId / quantity / addedAt — jamais nom, prix, image, stock.
 */

import {
  removeCartLine,
  replaceCartQuantity,
  upsertCartLine,
} from "./cart";
import type { MaterialCartItem, StoredCartItem } from "./types";

export const MATERIAL_CART_KEY = "demeure-guinee-material-cart";
const LEGACY_CART_KEY = "demeure-guinee-web-material-cart";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function toQuantity(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (Number.isInteger(parsed) && parsed >= 1) return parsed;
  }
  return null;
}

function hydrateItem(value: unknown): MaterialCartItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<MaterialCartItem> & { id?: string };
  const productId =
    typeof item.productId === "string" && item.productId.length > 0
      ? item.productId
      : typeof item.id === "string" && item.id.startsWith("cart-")
        ? item.id.slice(5)
        : "";
  const quantity = toQuantity(item.quantity);
  if (!productId || quantity == null) return null;
  return {
    id:
      typeof item.id === "string" && item.id.length > 0
        ? item.id
        : `cart-${productId}`,
    productId,
    quantity,
    addedAt:
      typeof item.addedAt === "string" && item.addedAt.length > 0
        ? item.addedAt
        : new Date().toISOString(),
  };
}

function parseStored(raw: string | null): unknown {
  if (!raw) return null;
  try {
    let parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const wrapped = parsed as { items?: unknown; lines?: unknown };
      if (Array.isArray(wrapped.items)) return wrapped.items;
      if (Array.isArray(wrapped.lines)) return wrapped.lines;
    }
    return parsed;
  } catch {
    return null;
  }
}

function hydrateList(value: unknown): MaterialCartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(hydrateItem)
    .filter((item): item is MaterialCartItem => item !== null);
}

function toStoredItem(item: MaterialCartItem): StoredCartItem {
  return {
    productId: item.productId,
    quantity: item.quantity,
    addedAt: item.addedAt,
  };
}

function persist(items: MaterialCartItem[]) {
  if (!canUseStorage()) return;
  try {
    const payload = JSON.stringify(items.map(toStoredItem));
    window.localStorage.setItem(MATERIAL_CART_KEY, payload);
    window.localStorage.removeItem(LEGACY_CART_KEY);
  } catch {
    // Quota / mode privé : le panier reste en mémoire pour la session.
  }
}

function readFromKey(key: string): MaterialCartItem[] {
  if (!canUseStorage()) return [];
  return hydrateList(parseStored(window.localStorage.getItem(key)));
}

export function getCart(): MaterialCartItem[] {
  if (!canUseStorage()) return [];
  try {
    const official = readFromKey(MATERIAL_CART_KEY);
    if (official.length > 0) return official;

    const legacy = readFromKey(LEGACY_CART_KEY);
    if (legacy.length > 0) {
      persist(legacy);
      return legacy;
    }

    return official;
  } catch {
    return [];
  }
}

export function addItem(
  productId: string,
  quantity: number,
): MaterialCartItem[] {
  const next = upsertCartLine(getCart(), productId, quantity);
  persist(next);
  return next;
}

export function removeItem(productId: string): MaterialCartItem[] {
  const next = removeCartLine(getCart(), productId);
  persist(next);
  return next;
}

export function updateQuantity(
  productId: string,
  quantity: number,
): MaterialCartItem[] {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return getCart();
  }
  const next = replaceCartQuantity(getCart(), productId, quantity);
  persist(next);
  return next;
}

export function clearCart(): MaterialCartItem[] {
  persist([]);
  return [];
}

export function pruneUnknownItems(knownProductIds: string[]): MaterialCartItem[] {
  const known = new Set(knownProductIds);
  const current = getCart();
  const next = current.filter((item) => known.has(item.productId));
  if (next.length !== current.length) {
    persist(next);
  }
  return next;
}

export function writeCart(items: MaterialCartItem[]) {
  persist(items);
}
