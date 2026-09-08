/**
 * Client Demo API pour le module matériaux.
 * Source de vérité partagée — remplacée plus tard par Spring Boot.
 */

import { DemoApiError, demoApiFetch } from "@/lib/demo-api/client";

import type { MaterialCategory } from "./categories";
import type { MaterialProduct } from "./products";
import type { MaterialStock } from "./stocks";
import type { MaterialStockMovement } from "./movements";
import type { MaterialStockReservation } from "./reservations";
import type { MaterialSupplier } from "./suppliers";
import type { MaterialOrder } from "./orders";
import type { MaterialUnit } from "./units";

export type MaterialSnapshot = {
  categories: MaterialCategory[];
  units: MaterialUnit[];
  products: MaterialProduct[];
  suppliers: MaterialSupplier[];
  stocks: MaterialStock[];
  movements: MaterialStockMovement[];
  reservations: MaterialStockReservation[];
};

export function fetchMaterialSnapshot() {
  return demoApiFetch<MaterialSnapshot>("/materials");
}

export function apiCreateCategory(body: unknown) {
  return demoApiFetch<MaterialCategory>("/materials/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiUpdateCategory(id: string, body: unknown) {
  return demoApiFetch<MaterialCategory>(
    `/materials/categories/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export function apiDeleteCategory(id: string) {
  return demoApiFetch<void>(`/materials/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function apiCreateUnit(body: unknown) {
  return demoApiFetch<MaterialUnit>("/materials/units", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiUpdateUnit(id: string, body: unknown) {
  return demoApiFetch<MaterialUnit>(`/materials/units/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function apiDeleteUnit(id: string) {
  return demoApiFetch<void>(`/materials/units/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function apiCreateProduct(body: unknown) {
  return demoApiFetch<MaterialProduct>("/materials/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiUpdateProduct(id: string, body: unknown) {
  return demoApiFetch<MaterialProduct>(
    `/materials/products/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export function apiDeleteProduct(id: string) {
  return demoApiFetch<void>(`/materials/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function apiCreateSupplier(body: unknown) {
  return demoApiFetch<MaterialSupplier>("/materials/suppliers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiUpdateSupplier(id: string, body: unknown) {
  return demoApiFetch<MaterialSupplier>(
    `/materials/suppliers/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export function apiDeleteSupplier(id: string) {
  return demoApiFetch<void>(`/materials/suppliers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function apiUpdateStock(id: string, body: unknown) {
  return demoApiFetch<MaterialStock>(
    `/materials/stocks/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export function apiCreateMovement(body: unknown) {
  return demoApiFetch<MaterialStockMovement>("/materials/movements", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiCreateReservation(body: unknown) {
  return demoApiFetch<MaterialStockReservation>("/materials/reservations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function readMaterialApi<T>(path: string, init?: RequestInit) {
  try {
    return await demoApiFetch<T>(path, init);
  } catch (error) {
    if (error instanceof DemoApiError) throw error;
    throw new DemoApiError(
      "Impossible de joindre le serveur. Réessayez dans un instant.",
      0,
    );
  }
}

export function fetchMaterialReservations() {
  return readMaterialApi<MaterialStockReservation[]>("/materials/reservations");
}

export function fetchMaterialOrders() {
  return readMaterialApi<MaterialOrder[]>("/materials/orders");
}

export function fetchMaterialOrder(id: string) {
  return readMaterialApi<MaterialOrder>(
    `/materials/orders/${encodeURIComponent(id)}`,
  );
}

export function apiCancelMaterialOrder(id: string) {
  return readMaterialApi<MaterialOrder>(
    `/materials/orders/${encodeURIComponent(id)}/cancel`,
    { method: "POST" },
  );
}

export function apiUpdateOrderStatus(id: string, status: string) {
  return readMaterialApi<MaterialOrder>(
    `/materials/orders/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify({ status, changedBy: "admin" }) },
  );
}

export function apiUpdateOrderDeliveryMode(id: string, deliveryMode: string) {
  return readMaterialApi<MaterialOrder>(
    `/materials/orders/${encodeURIComponent(id)}/delivery-mode`,
    { method: "PATCH", body: JSON.stringify({ deliveryMode }) },
  );
}

export function apiUpdateOrderDeliveryFee(id: string, deliveryFee: number) {
  return readMaterialApi<MaterialOrder>(
    `/materials/orders/${encodeURIComponent(id)}/delivery-fee`,
    {
      method: "PATCH",
      body: JSON.stringify({ deliveryFee, changedBy: "admin" }),
    },
  );
}

export function apiConfirmAgentPayment(id: string) {
  return readMaterialApi<MaterialOrder>(
    `/materials/orders/${encodeURIComponent(id)}/payments/confirm-agent`,
    { method: "POST", body: JSON.stringify({ changedBy: "admin" }) },
  );
}

export function apiConfirmStorePayment(id: string) {
  return readMaterialApi<MaterialOrder>(
    `/materials/orders/${encodeURIComponent(id)}/payments/confirm-store`,
    { method: "POST", body: JSON.stringify({ changedBy: "admin" }) },
  );
}

export type MaterialAdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  orderId?: string | null;
  orderReference?: string;
  href?: string;
};

export function fetchAdminNotifications() {
  return readMaterialApi<MaterialAdminNotification[]>("/admin/notifications");
}

export function apiMarkNotificationRead(id: string) {
  return readMaterialApi<MaterialAdminNotification>(
    `/notifications/${encodeURIComponent(id)}/read`,
    { method: "PATCH" },
  );
}

export function apiUpdateOrderVerification(
  id: string,
  body: {
    customerVerified?: boolean;
    addressVerified?: boolean;
    stockVerified?: boolean;
    notes?: string;
  },
) {
  return readMaterialApi<MaterialOrder>(
    `/materials/orders/${encodeURIComponent(id)}/verification`,
    { method: "PATCH", body: JSON.stringify({ ...body, changedBy: "admin" }) },
  );
}

export function fetchMaterialQuotes() {
  return readMaterialApi<import("./quotes").MaterialQuote[]>("/materials/quotes");
}

export function fetchMaterialQuote(id: string) {
  return readMaterialApi<import("./quotes").MaterialQuote>(
    `/materials/quotes/${encodeURIComponent(id)}`,
  );
}

export function apiUpdateQuoteStatus(id: string, status: string) {
  return readMaterialApi<import("./quotes").MaterialQuote>(
    `/materials/quotes/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify({ status, changedBy: "admin" }) },
  );
}

export function apiCreateQuoteProposal(
  id: string,
  body: {
    supplierId: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
    deliveryFee?: number;
    delayDays?: number;
    conditions?: string;
    validUntil?: string;
    comment?: string;
  },
) {
  return readMaterialApi<import("./quotes").MaterialQuote>(
    `/materials/quotes/${encodeURIComponent(id)}/proposals`,
    { method: "POST", body: JSON.stringify({ ...body, changedBy: "admin" }) },
  );
}

export function apiReleaseReservation(id: string) {
  return demoApiFetch<MaterialStockReservation>(
    `/materials/reservations/${encodeURIComponent(id)}/release`,
    { method: "POST" },
  );
}
