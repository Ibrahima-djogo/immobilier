/**
 * Règles du panier public — lecture seule du stock.
 * N’écrit jamais quantity, reservedQuantity, mouvement ou réservation.
 */

import { formatGnf } from "@/lib/demo-api/mapToProperty";
import { materialPrice, materialStock } from "@/lib/materiaux/catalog";
import type { PublicCatalog, PublicMaterial } from "@/lib/materiaux/types";

import {
  CART_MESSAGES,
  type CartLine,
  type CartLineIssue,
  type MaterialCartItem,
} from "./types";

export type ParsedCartQuantity =
  | { ok: true; value: number }
  | { ok: false; error: string };

export type ResolvedCartLine = {
  productId: string;
  quantity: number;
  material: PublicMaterial | null;
  issue: CartLineIssue | null;
  issueMessage: string | null;
  unitPrice: number | null;
  subtotal: number;
};

export function parseCartQuantity(raw: string): ParsedCartQuantity {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: CART_MESSAGES.invalidQuantity };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: CART_MESSAGES.notNumeric };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 1) {
    return { ok: false, error: CART_MESSAGES.invalidQuantity };
  }
  return { ok: true, value };
}

export function canCoverQuantity(
  requested: number,
  availableQuantity: number,
) {
  return requested <= Math.max(0, availableQuantity);
}

export function nextCartQuantity(current: number, added: number) {
  return current + added;
}

function createCartItem(
  productId: string,
  quantity: number,
): MaterialCartItem {
  return {
    id: `cart-${productId}`,
    productId,
    quantity,
    addedAt: new Date().toISOString(),
  };
}

export function upsertCartLine(
  lines: CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  const index = lines.findIndex((item) => item.productId === productId);
  if (index < 0) {
    return [...lines, createCartItem(productId, quantity)];
  }
  const next = [...lines];
  next[index] = {
    ...next[index],
    quantity: next[index].quantity + quantity,
  };
  return next;
}

export function replaceCartQuantity(
  lines: CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  return lines.map((item) =>
    item.productId === productId ? { ...item, quantity } : item,
  );
}

export function removeCartLine(lines: CartLine[], productId: string): CartLine[] {
  return lines.filter((item) => item.productId !== productId);
}

export function cartLineCount(lines: CartLine[]) {
  return lines.length;
}

export function cartTotalQuantity(lines: CartLine[]) {
  return lines.reduce((sum, item) => sum + item.quantity, 0);
}

export function resolveCartLine(
  line: CartLine,
  catalog: PublicCatalog | null,
): ResolvedCartLine {
  if (!catalog) {
    return {
      productId: line.productId,
      quantity: line.quantity,
      material: null,
      issue: "UNAVAILABLE",
      issueMessage: CART_MESSAGES.loadError,
      unitPrice: null,
      subtotal: 0,
    };
  }

  const material =
    catalog.materials.find(
      (item) => item.id === line.productId || item.slug === line.productId,
    ) ?? null;

  if (!material) {
    return {
      productId: line.productId,
      quantity: line.quantity,
      material: null,
      issue: "UNAVAILABLE",
      issueMessage: CART_MESSAGES.unavailable,
      unitPrice: null,
      subtotal: 0,
    };
  }

  const available = Math.max(0, materialStock(material).available);
  const unitPrice = materialPrice(material);
  const subtotal = unitPrice * line.quantity;

  if (available <= 0) {
    return {
      productId: line.productId,
      quantity: line.quantity,
      material,
      issue: "INSUFFICIENT_STOCK",
      issueMessage: CART_MESSAGES.notEnough,
      unitPrice,
      subtotal,
    };
  }

  if (line.quantity > available) {
    return {
      productId: line.productId,
      quantity: line.quantity,
      material,
      issue: "INSUFFICIENT_STOCK",
      issueMessage: CART_MESSAGES.notEnough,
      unitPrice,
      subtotal,
    };
  }

  return {
    productId: line.productId,
    quantity: line.quantity,
    material,
    issue: null,
    issueMessage: null,
    unitPrice,
    subtotal,
  };
}

export function resolveCart(lines: CartLine[], catalog: PublicCatalog | null) {
  const resolved = lines.map((line) => resolveCartLine(line, catalog));
  const sellable = resolved.filter((line) => line.material && !line.issue);
  const total = sellable.reduce((sum, line) => sum + line.subtotal, 0);
  const estimatedTotal = resolved.reduce((sum, line) => sum + line.subtotal, 0);
  const articleCount = resolved.reduce((sum, line) => sum + line.quantity, 0);
  return {
    lines: resolved,
    total: estimatedTotal,
    sellableTotal: total,
    articleCount,
  };
}

export function formatCartMoney(amount: number) {
  return formatGnf(amount);
}
