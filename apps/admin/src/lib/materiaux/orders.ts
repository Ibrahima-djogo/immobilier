/**
 * Commandes matériaux — lecture Demo API.
 * Instantané historique : ne jamais recalculer les prix depuis le catalogue.
 */

import { formatGnf } from "@/lib/administration/demo-data";
import { DemoApiError } from "@/lib/demo-api/client";

export type MaterialOrderCustomer = {
  name: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  address: string;
  comment: string;
};

export type MaterialOrderItemStock = {
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  status: string;
  requestedQuantity?: number;
  reservedForOrder?: number;
  result?: string;
};

export type MaterialOrderItem = {
  productId: string;
  productName: string;
  unitName: string;
  unitSymbol: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  stock?: MaterialOrderItemStock;
};

export type MaterialOrderVerification = {
  status: string;
  checkedBy: string | null;
  checkedAt: string | null;
  customerVerified: boolean;
  stockVerified: boolean;
  addressVerified: boolean;
  notes: string;
};

export type MaterialOrderVerificationHistory = {
  action: string;
  changedAt: string;
  changedBy: string;
  fromAmount?: number | null;
  toAmount?: number | null;
  amount?: number | null;
  reference?: string | null;
  method?: string | null;
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

export type MaterialOrderStatusHistory = {
  status: string;
  changedAt: string;
  changedBy: string;
};

export type MaterialOrder = {
  id: string;
  reference: string;
  userId?: string | null;
  supplierId?: string | null;
  supplierName?: string;
  supplier?: { id: string; name: string; type?: string } | null;
  checkoutGroupId?: string | null;
  customer: MaterialOrderCustomer;
  customerSnapshot?: MaterialOrderCustomer;
  items: MaterialOrderItem[];
  subtotal?: number;
  deliveryFee?: number | null;
  totalAmount: number;
  status: string;
  deliveryMode?: string | null;
  verification?: MaterialOrderVerification;
  paymentIntent?: "PAY_ONLINE" | "PAY_AT_STORE" | null;
  paymentRequestedAt?: string | null;
  paymentRequested?: boolean;
  payment?: MaterialOrderPayment | null;
  statusHistory?: MaterialOrderStatusHistory[];
  verificationHistory?: MaterialOrderVerificationHistory[];
  createdAt: string;
  updatedAt: string;
};

export function emptyVerification(): MaterialOrderVerification {
  return {
    status: "NON_VERIFIE",
    checkedBy: null,
    checkedAt: null,
    customerVerified: false,
    stockVerified: false,
    addressVerified: false,
    notes: "",
  };
}

export function isVerificationChecklistComplete(order: MaterialOrder) {
  const verification = order.verification ?? emptyVerification();
  const stockOk =
    verification.stockVerified ||
    (order.items.length > 0 &&
      order.items.every((item) => item.stock?.result === "Disponible"));
  return (
    verification.customerVerified &&
    verification.addressVerified &&
    stockOk
  );
}

export function formatVerificationAction(action: string) {
  if (action === "COMMENCER_VERIFICATION") return "Vérification commencée";
  if (action === "CLIENT_VERIFIE") return "Client vérifié";
  if (action === "CLIENT_NON_VERIFIE") return "Client non vérifié";
  if (action === "ADRESSE_VERIFIEE") return "Adresse vérifiée";
  if (action === "ADRESSE_NON_VERIFIEE") return "Adresse non vérifiée";
  if (action === "STOCK_VERIFIE") return "Stock disponible";
  if (action === "STOCK_INSUFFISANT") return "Stock insuffisant";
  if (action === "MAJ_CHECKLIST") return "Note de vérification enregistrée";
  if (action === "CONFIRMER_VERIFICATION") return "Validation confirmée";
  if (action === "FRAIS_LIVRAISON_MODIFIES") return "Frais de livraison modifiés";
  if (action === "PAIEMENT_INITIE") return "Paiement initié";
  if (action === "PAIEMENT_ECHOUE") return "Paiement échoué";
  if (action === "PAIEMENT_ANNULE") return "Paiement annulé";
  if (action === "PAIEMENT_CONFIRME") return "Paiement confirmé";
  if (action === "PAIEMENT_DEMANDE") return "Paiement demandé";
  if (action === "PAIEMENT_MODE_CHOISI") return "Mode de paiement choisi";
  if (action === "ANNULATION_CLIENT") return "Annulation client";
  return action.replaceAll("_", " ");
}

export function formatHistoryAction(entry: MaterialOrderVerificationHistory) {
  if (entry.action === "FRAIS_LIVRAISON_MODIFIES") {
    const to = formatGnf(entry.toAmount ?? 0);
    if (entry.fromAmount == null) return `Frais de livraison : ${to}`;
    return `Frais de livraison : ${formatGnf(entry.fromAmount)} → ${to}`;
  }
  if (entry.action === "PAIEMENT_MODE_CHOISI") {
    const choice = formatPaymentIntent(entry.method);
    const extra = [
      entry.amount != null ? formatGnf(entry.amount) : null,
      choice !== "Non choisi" ? choice : null,
    ].filter(Boolean);
    return extra.length
      ? `Mode de paiement choisi (${extra.join(" · ")})`
      : "Mode de paiement choisi";
  }
  const label = formatVerificationAction(entry.action);
  if (entry.amount != null && Number.isFinite(Number(entry.amount))) {
    const extra = [formatGnf(entry.amount), entry.reference].filter(Boolean);
    return extra.length ? `${label} (${extra.join(" · ")})` : label;
  }
  return label;
}

export function formatPaymentIntent(intent?: string | null) {
  if (intent === "PAY_AT_STORE") return "Paiement au magasin";
  if (intent === "PAY_ONLINE") return "Paiement en ligne";
  return "Non choisi";
}

export function formatPaymentRequestState(order: MaterialOrder) {
  return order.paymentRequested || order.paymentRequestedAt
    ? "Envoyée"
    : "Non envoyée";
}

export function canConfirmStorePayment(order: MaterialOrder) {
  return (
    order.status === "PAIEMENT_EN_ATTENTE" &&
    order.paymentIntent === "PAY_AT_STORE" &&
    order.payment?.status !== "PAID"
  );
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

export function formatPaymentChannel(channel?: string | null) {
  if (channel === "AGENT_WHATSAPP") return "Agent WhatsApp";
  if (channel === "ONLINE") return "Paiement en ligne";
  if (channel === "STORE") return "Paiement au magasin";
  return channel || "—";
}

export function formatPaymentRecordStatus(status?: string | null) {
  if (status === "PAID") return "Payé";
  if (status === "PENDING_AGENT") return "En attente de confirmation";
  if (status === "AWAITING") return "Paiement en ligne en cours";
  if (status === "FAILED") return "Échoué";
  if (status === "CANCELLED") return "Annulé";
  if (status === "NONE" || !status) return "—";
  return status.replaceAll("_", " ");
}

export function isAgentPaymentPending(order: MaterialOrder) {
  return (
    order.status === "PAIEMENT_EN_ATTENTE" &&
    order.payment?.channel === "AGENT_WHATSAPP" &&
    order.payment?.status === "PENDING_AGENT"
  );
}

const DELIVERY_FEE_LOCKED = new Set([
  "PAYEE",
  "EN_PREPARATION",
  "PRETE",
  "EN_LIVRAISON",
  "LIVREE",
  "RETIRE_DEPOT",
  "ANNULEE",
  "RESERVATION_EXPIREE",
]);

export function canEditDeliveryFee(order: MaterialOrder) {
  return (
    order.deliveryMode === "LIVRAISON" && !DELIVERY_FEE_LOCKED.has(order.status)
  );
}

export function parseDeliveryFeeInput(raw: string) {
  const compact = raw.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.0+)?$/.test(compact)) return null;
  const amount = Number(compact);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
    return null;
  }
  return amount;
}

export function isVerificationSectionVisible(order: MaterialOrder) {
  return (order.verificationHistory ?? []).some(
    (entry) => entry.action !== "FRAIS_LIVRAISON_MODIFIES",
  );
}

export function formatPaymentStatus(order: MaterialOrder) {
  const paymentStatus = order.payment?.status;
  if (paymentStatus === "PENDING_AGENT" || isAgentPaymentPending(order)) {
    return "En attente de confirmation";
  }
  if (paymentStatus === "PAID" || paymentStatus === "PAYEE") return "Payée";
  if (paymentStatus === "AWAITING") return "Paiement en ligne en cours";
  if (paymentStatus === "FAILED") return "Échoué";
  if (paymentStatus === "CANCELLED") return "Annulé";
  if (
    order.status === "PAYEE" ||
    order.status === "EN_PREPARATION" ||
    order.status === "PRETE" ||
    order.status === "EN_LIVRAISON" ||
    order.status === "LIVREE" ||
    order.status === "RETIRE_DEPOT"
  ) {
    return "Payée";
  }
  if (order.status === "ANNULEE" || order.status === "RESERVATION_EXPIREE") {
    return "—";
  }
  if (order.status === "PAIEMENT_EN_ATTENTE") {
    if (order.paymentIntent === "PAY_AT_STORE") return "À régler au magasin";
    return "En attente";
  }
  return formatStatusLabelFallback(order.status);
}

export function formatOrderWorkflowLabel(order: MaterialOrder) {
  return formatStatusLabelFallback(order.status);
}

function formatStatusLabelFallback(status: string) {
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
  return status.replaceAll("_", " ");
}

export function canCancelMaterialOrder(order: MaterialOrder) {
  return (
    order.status === "EN_ATTENTE" ||
    order.status === "EN_VERIFICATION" ||
    order.status === "VALIDEE" ||
    order.status === "PAIEMENT_EN_ATTENTE"
  );
}

export function formatDeliveryMode(mode?: string | null) {
  if (mode === "LIVRAISON") return "Livraison à domicile";
  if (mode === "RETRAIT_DEPOT") return "Retrait au magasin";
  return "Non défini";
}

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
  if (order.deliveryMode === "RETRAIT_DEPOT") return formatGnf(0);
  if (order.deliveryFee == null) return "À confirmer";
  return formatGnf(order.deliveryFee);
}

export function formatCustomerKind(order: Pick<MaterialOrder, "userId">) {
  return isGuestOrder(order) ? "Client invité" : "Client connecté";
}

export function orderLineCount(order: MaterialOrder) {
  return order.items.length;
}

export function formatOrderLineCount(order: MaterialOrder) {
  const count = orderLineCount(order);
  return count <= 1 ? `${count} article` : `${count} articles`;
}

export function formatOrderAmount(amount: number) {
  return formatGnf(amount);
}

export function formatOrderItemQuantity(item: MaterialOrderItem) {
  const unit = item.unitName || item.unitSymbol || "unité";
  return `${item.quantity} ${unit}`;
}

export function formatOrderUnitPrice(item: MaterialOrderItem) {
  const unit = item.unitName || item.unitSymbol || "unité";
  return `${formatGnf(item.unitPrice)} / ${unit}`;
}

export function formatOrderDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Non renseigné";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUS_FILTERS = [
  "EN_ATTENTE",
  "EN_VERIFICATION",
  "VALIDEE",
  "PAIEMENT_EN_ATTENTE",
  "PAYEE",
  "EN_PREPARATION",
  "PRETE",
  "EN_LIVRAISON",
  "LIVREE",
  "RETIRE_DEPOT",
  "ANNULEE",
  "RESERVATION_EXPIREE",
] as const;

export function orderStatusOptions() {
  return [...ORDER_STATUS_FILTERS];
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function matchesOrderSearch(order: MaterialOrder, rawQuery: string) {
  const needle = rawQuery.trim().toLowerCase();
  if (!needle) return true;
  const phone = order.customer.phone || "";
  const haystack =
    `${order.reference} ${order.customer.name} ${order.customer.email || ""} ${phone} ${order.supplierName || ""}`.toLowerCase();
  if (haystack.includes(needle)) return true;
  const needleDigits = digitsOnly(needle);
  if (needleDigits.length >= 3) {
    return digitsOnly(phone).includes(needleDigits);
  }
  return false;
}

export function sortOrders(orders: MaterialOrder[], direction: "recent" | "oldest") {
  const factor = direction === "oldest" ? 1 : -1;
  return [...orders].sort((left, right) => {
    const a = new Date(left.createdAt).getTime();
    const b = new Date(right.createdAt).getTime();
    return (a - b) * factor;
  });
}

export function friendlyOrderLoadError(
  error: unknown,
  kind: "list" | "detail" = "list",
) {
  const fallback =
    kind === "detail"
      ? "Impossible de charger cette commande. Réessayez dans un instant."
      : "Impossible de charger les commandes";
  if (error instanceof DemoApiError) {
    if (error.status === 404) return "Cette commande est introuvable.";
    if (error.status === 0 || error.status >= 500) return fallback;
    if (/^Demo API \d+/.test(error.message)) return fallback;
    return error.message;
  }
  return fallback;
}
