/**
 * Commandes matériaux — contrat Demo API, demain Spring Boot.
 * Le navigateur n’envoie jamais de prix ni de stock.
 */

import { publicSessionAuthHeaders } from "@/lib/auth/public-demo-session";
import { siteWhatsappNumber } from "@/lib/config/site-contact";
import { DemoApiError, demoApiFetch } from "@/lib/demo-api/client";
import { formatGnf } from "@/lib/demo-api/mapToProperty";

import type { CheckoutCustomerDraft } from "./types";

export type MaterialOrderCustomer = {
  name: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  address: string;
  comment: string;
};

export type MaterialOrderItem = {
  productId: string;
  productName: string;
  unitName: string;
  unitSymbol: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type MaterialOrderStatusHistory = {
  status: string;
  changedAt: string;
  changedBy: string;
};

export type MaterialOrderVerification = {
  status: string;
  checkedBy?: string | null;
  checkedAt?: string | null;
  customerVerified?: boolean;
  stockVerified?: boolean;
  addressVerified?: boolean;
};

export type MaterialOrderPayment = {
  status: string;
  channel?: string | null;
  method?: string | null;
  provider?: string | null;
  amount?: number | null;
  currency?: string;
  providerPaymentId?: string | null;
  reference?: string | null;
  checkoutUrl?: string | null;
  whatsappUrl?: string | null;
  initiatedAt?: string | null;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
};

export type MaterialPaymentChannels = {
  onlineConfigured: boolean;
  onlineUnavailableReason?: string | null;
  onlineMethods: { code: string; label: string; currency?: string }[];
  agentConfigured: boolean;
};

export type MaterialOrderRelated = {
  id: string;
  reference: string;
  supplierId?: string | null;
  supplierName?: string;
  totalAmount: number;
  status: string;
  deliveryMode?: string | null;
  accessToken?: string;
};

export type MaterialOrder = {
  id: string;
  reference: string;
  userId?: string | null;
  supplierId?: string | null;
  supplierName?: string;
  checkoutGroupId?: string | null;
  relatedOrders?: MaterialOrderRelated[];
  customer: MaterialOrderCustomer;
  customerSnapshot?: MaterialOrderCustomer;
  items: MaterialOrderItem[];
  subtotal?: number;
  deliveryFee?: number | null;
  totalAmount: number;
  status: "EN_ATTENTE" | string;
  deliveryMode?: string | null;
  accessToken?: string;
  paymentIntent?: "PAY_ONLINE" | "PAY_AT_STORE" | null;
  paymentRequestedAt?: string | null;
  paymentRequested?: boolean;
  payment?: MaterialOrderPayment | null;
  verification?: MaterialOrderVerification | null;
  statusHistory?: MaterialOrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
};

export type CreateMaterialOrderInput = {
  customer: CheckoutCustomerDraft;
  items: { productId: string; quantity: number }[];
  deliveryMode: "RETRAIT_DEPOT" | "LIVRAISON";
  idempotencyKey: string;
};

export function isGuestOrder(order: Pick<MaterialOrder, "userId">) {
  return !order.userId;
}

export function orderSubtotal(order: MaterialOrder) {
  if (Number.isFinite(Number(order.subtotal))) return Number(order.subtotal);
  return (order.items || []).reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0,
  );
}

export function formatDeliveryFee(order: MaterialOrder) {
  if (order.deliveryMode === "RETRAIT_DEPOT") return "0 GNF";
  if (order.deliveryFee == null) return "À confirmer";
  return formatGnf(order.deliveryFee);
}

export function isDeliveryFeePending(order: MaterialOrder) {
  return order.deliveryMode === "LIVRAISON" && order.deliveryFee == null;
}

export function canPayOrder(order: MaterialOrder) {
  if (order.status === "PAYEE") return false;
  if (order.status !== "PAIEMENT_EN_ATTENTE") return false;
  if (isDeliveryFeePending(order)) return false;
  return true;
}

export function formatPaymentRecordStatus(status?: string | null) {
  if (status === "PAID" || status === "PAYEE") return "Payé";
  if (status === "PENDING_AGENT") return "En attente de confirmation";
  if (status === "AWAITING") return "Paiement en ligne en cours";
  if (status === "FAILED") return "Échoué";
  if (status === "CANCELLED") return "Annulé";
  if (status === "NONE" || !status) return "—";
  return status.replace(/_/g, " ");
}

export function formatPaymentChannel(channel?: string | null) {
  if (channel === "AGENT_WHATSAPP") return "Agent WhatsApp";
  if (channel === "ONLINE") return "Paiement en ligne";
  if (channel === "STORE") return "Paiement au magasin";
  return channel || "—";
}

export function formatPaymentIntent(intent?: string | null) {
  if (intent === "PAY_AT_STORE") return "Paiement au magasin";
  if (intent === "PAY_ONLINE") return "Paiement en ligne";
  return "Non choisi";
}

export function relatedOrderCount(order: MaterialOrder) {
  return 1 + (order.relatedOrders || []).length;
}

export function canCancelOwnOrder(order: MaterialOrder) {
  return order.status === "EN_ATTENTE" || order.status === "PAIEMENT_EN_ATTENTE";
}

export function canChooseStorePayment(order: MaterialOrder) {
  return (
    order.status === "PAIEMENT_EN_ATTENTE" &&
    order.deliveryMode === "RETRAIT_DEPOT" &&
    !isDeliveryFeePending(order)
  );
}

export function agentWhatsappHref(order: MaterialOrder) {
  const number = siteWhatsappNumber();
  if (!number) return null;
  const amount = Number(order.payment?.amount ?? order.totalAmount);
  const text = [
    "Bonjour Demeure Guinée,",
    "",
    "Je souhaite payer ma commande de matériaux avec l’aide d’un agent.",
    `Référence : ${order.reference}`,
    `Montant : ${amount.toLocaleString("fr-FR")} GNF`,
    order.deliveryMode === "LIVRAISON"
      ? "Mode : Livraison à domicile"
      : "Mode : Retrait au magasin",
    "",
    "Je vais envoyer la preuve de paiement ici.",
  ].join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function formatPaymentMethod(method?: string | null) {
  if (method === "PAY_AT_STORE") return "Paiement au magasin";
  if (method === "AGENT_WHATSAPP") return "Paiement avec agent";
  if (method === "orange_gn") return "Orange Money";
  if (method === "mtn_gn") return "MTN Mobile Money";
  if (method === "moov_gn") return "Moov Africa";
  if (method === "visa") return "Visa";
  if (method === "mastercard") return "Mastercard";
  if (method === "ONLINE") return "Paiement en ligne";
  return method || "—";
}

export function formatOrderPaymentStatus(order: MaterialOrder) {
  const paymentStatus = order.payment?.status;
  if (paymentStatus === "PENDING_AGENT") return "En attente de confirmation";
  if (paymentStatus === "PAID" || paymentStatus === "PAYEE") return "Payée";
  if (paymentStatus === "AWAITING") return "Paiement en ligne en cours";
  if (paymentStatus === "FAILED") return "Échoué";
  if (paymentStatus === "CANCELLED") return "Annulé";
  if (order.status === "PAIEMENT_EN_ATTENTE") {
    if (order.paymentIntent === "PAY_AT_STORE") return "À régler au magasin";
    if (order.paymentRequested || order.paymentRequestedAt) {
      return "Paiement demandé";
    }
    return "Paiement en attente";
  }
  return formatOrderStatus(order.status);
}

export function formatOrderPaymentDate(order: MaterialOrder) {
  const confirmed = order.payment?.confirmedAt;
  if (!confirmed) return "—";
  return formatOrderDate(confirmed);
}

function toApiCustomer(draft: CheckoutCustomerDraft): MaterialOrderCustomer {
  return {
    name: draft.nomComplet,
    phone: draft.telephone,
    email: draft.email,
    city: draft.ville,
    district: draft.quartier,
    address: draft.adresse,
    comment: draft.commentaire,
  };
}

export function friendlyOrderError(error: unknown) {
  if (error instanceof DemoApiError) {
    if (error.code === "INSUFFICIENT_STOCK" || error.status === 409) {
      return "Certains matériaux ne sont plus disponibles dans les quantités demandées.";
    }
    if (error.status === 0) {
      return "Le service est temporairement indisponible. Votre panier a été conservé.";
    }
    return error.message;
  }
  return "Impossible de créer la commande. Réessayez dans un instant.";
}

export async function createMaterialOrder(input: CreateMaterialOrderInput) {
  const result = await checkoutMaterialOrders(input);
  return result.orders[0];
}

export async function checkoutMaterialOrders(input: CreateMaterialOrderInput) {
  const authHeaders = publicSessionAuthHeaders();
  return demoApiFetch<{
    checkoutGroupId: string | null;
    orders: MaterialOrder[];
  }>("/materials/orders/checkout", {
    method: "POST",
    headers: {
      "X-Idempotency-Key": input.idempotencyKey,
      ...authHeaders,
    },
    body: JSON.stringify({
      customer: toApiCustomer(input.customer),
      items: input.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      deliveryMode: input.deliveryMode,
      idempotencyKey: input.idempotencyKey,
    }),
  });
}

export async function lookupMaterialOrder(input: {
  reference: string;
  telephone: string;
}) {
  return demoApiFetch<MaterialOrder>("/materials/orders/lookup", {
    method: "POST",
    body: JSON.stringify({
      reference: input.reference,
      phone: input.telephone,
    }),
  });
}

export async function loadMyMaterialOrders() {
  return demoApiFetch<MaterialOrder[]>("/materials/orders/my", {
    cache: "no-store",
    headers: {
      ...publicSessionAuthHeaders(),
    },
  });
}

export async function loadMyMaterialOrder(id: string) {
  const path = `/materials/orders/my/${encodeURIComponent(id)}?_=${Date.now()}`;
  return demoApiFetch<MaterialOrder>(path, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...publicSessionAuthHeaders(),
    },
  });
}

export function orderItemCount(order: MaterialOrder) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

export async function loadMaterialOrder(id: string, accessToken?: string) {
  const params = new URLSearchParams({ _: String(Date.now()) });
  if (accessToken) params.set("acces", accessToken);
  const path = `/materials/orders/${encodeURIComponent(id)}?${params.toString()}`;
  return demoApiFetch<MaterialOrder>(path, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...publicSessionAuthHeaders(),
    },
  });
}

export function readAccessTokenFromSearch(
  searchParams: { get(name: string): string | null },
) {
  return String(searchParams.get("acces") || searchParams.get("token") || "").trim();
}

export function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `mo-key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatOrderDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatOrderStatus(status: string) {
  if (status === "EN_ATTENTE") return "En attente";
  if (status === "EN_VERIFICATION") return "En vérification";
  if (status === "VALIDEE") return "Validée";
  if (status === "PAIEMENT_EN_ATTENTE") return "Paiement en attente";
  if (status === "PAYEE") return "Payée";
  if (status === "EN_PREPARATION") return "En préparation";
  if (status === "PRETE") return "Prête";
  if (status === "EN_LIVRAISON") return "En livraison";
  if (status === "LIVREE") return "Livrée";
  if (status === "RETIRE_DEPOT") return "Retrait effectué";
  if (status === "ANNULEE") return "Annulée";
  if (status === "RESERVATION_EXPIREE") return "Réservation expirée";
  return status.replace(/_/g, " ");
}

export function formatVerificationStatus(status?: string | null) {
  if (status === "VERIFIEE") return "VÉRIFIÉ";
  if (status === "EN_VERIFICATION") return "EN VÉRIFICATION";
  if (status === "NON_VERIFIE") return "NON VÉRIFIÉ";
  return status ? status.replace(/_/g, " ") : "—";
}

export function formatDeliveryMode(mode?: string | null) {
  if (!mode) return "Non défini";

  switch (mode) {
    case "LIVRAISON":
      return "Livraison à domicile";

    case "RETRAIT_DEPOT":
      return "Retrait au magasin";

    default:
      return mode;
  }
}

export function formatOrderUnitPrice(item: MaterialOrderItem) {
  const unit = item.unitName || item.unitSymbol;
  return unit ? `${formatGnf(item.unitPrice)} / ${unit}` : formatGnf(item.unitPrice);
}

export function friendlyConfirmationError(error: unknown) {
  if (error instanceof DemoApiError) {
    if (error.status === 404) return "Commande introuvable.";
    if (error.status === 0 || error.status >= 500) {
      return "Impossible de récupérer votre commande pour le moment.";
    }
  }
  return "Impossible de récupérer votre commande pour le moment.";
}

export function friendlyPaymentError(error: unknown) {
  if (error instanceof DemoApiError) {
    if (error.code === "PAYMENT_NOT_CONFIGURED") {
      return "Le paiement en ligne n’est pas encore configuré. Aucun paiement n’a été enregistré.";
    }
    if (error.code === "DELIVERY_FEE_PENDING") {
      return "Les frais de livraison doivent encore être confirmés.";
    }
    if (error.code === "ALREADY_PAID") {
      return "Cette commande est déjà payée.";
    }
    if (error.code === "INVALID_ORDER_STATUS") {
      return "Cette commande n’est pas encore en attente de paiement.";
    }
    if (error.status === 403) {
      return "Vous ne pouvez pas payer cette commande.";
    }
    if (error.status === 409) {
      return error.message || "Ce paiement a déjà été traité.";
    }
    if (error.status > 0 && error.status < 500) return error.message;
    if (error.code) return error.message;
  }
  return "Impossible d’initier le paiement pour le moment.";
}

export async function loadPaymentChannels() {
  return demoApiFetch<MaterialPaymentChannels>("/materials/payments/methods", {
    cache: "no-store",
  });
}

export async function cancelOwnMaterialOrder(id: string, accessToken?: string) {
  return demoApiFetch<MaterialOrder>(
    `/materials/orders/${encodeURIComponent(id)}/customer-cancel`,
    {
      method: "POST",
      headers: {
        ...publicSessionAuthHeaders(),
      },
      body: JSON.stringify({
        ...(accessToken ? { accessToken } : {}),
      }),
    },
  );
}

export function friendlyCancelError(error: unknown) {
  if (error instanceof DemoApiError) {
    if (error.status === 403) {
      return "Vous ne pouvez pas annuler cette commande.";
    }
    if (error.status === 409) {
      return "Cette commande est déjà annulée.";
    }
    if (error.status > 0 && error.status < 500) return error.message;
  }
  return "Impossible d’annuler cette commande pour le moment.";
}

export async function chooseMaterialOrderPaymentIntent(
  id: string,
  intent: "PAY_ONLINE" | "PAY_AT_STORE",
  accessToken?: string,
) {
  return demoApiFetch<MaterialOrder>(
    `/materials/orders/${encodeURIComponent(id)}/payment-intent`,
    {
      method: "POST",
      headers: {
        ...publicSessionAuthHeaders(),
      },
      body: JSON.stringify({
        intent,
        ...(accessToken ? { accessToken } : {}),
      }),
    },
  );
}

export type MaterialNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  orderId?: string | null;
  orderReference?: string;
  href?: string;
  amount?: number | null;
};

export async function loadMyNotifications() {
  return demoApiFetch<MaterialNotification[]>("/notifications/my", {
    headers: {
      ...publicSessionAuthHeaders(),
    },
    cache: "no-store",
  });
}

export async function markNotificationRead(id: string) {
  return demoApiFetch<MaterialNotification>(
    `/notifications/${encodeURIComponent(id)}/read`,
    {
      method: "PATCH",
      headers: {
        ...publicSessionAuthHeaders(),
      },
    },
  );
}

export async function initiateMaterialOrderPayment(
  id: string,
  channel: "ONLINE" | "AGENT_WHATSAPP",
  accessToken?: string,
) {
  return demoApiFetch<
    MaterialOrder & { checkoutUrl?: string | null; whatsappUrl?: string | null }
  >(`/materials/orders/${encodeURIComponent(id)}/payments`, {
    method: "POST",
    headers: {
      ...publicSessionAuthHeaders(),
    },
    body: JSON.stringify({
      channel,
      ...(accessToken ? { accessToken } : {}),
    }),
  });
}

export async function verifyMaterialOrderPayment(
  id: string,
  accessToken?: string,
  paymentId?: string,
) {
  return demoApiFetch<MaterialOrder>(
    `/materials/orders/${encodeURIComponent(id)}/payments/verify`,
    {
      method: "POST",
      headers: {
        ...publicSessionAuthHeaders(),
      },
      body: JSON.stringify({
        ...(accessToken ? { accessToken } : {}),
        ...(paymentId ? { paymentId } : {}),
      }),
    },
  );
}

export function readOrderIdFromSearch(
  searchParams: { get(name: string): string | null },
  fallback = "",
) {
  return String(
    searchParams.get("commande") || searchParams.get("id") || fallback || "",
  ).trim();
}
