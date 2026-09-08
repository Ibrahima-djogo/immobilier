import { DemoApiError } from "@/lib/demo-api/client";

export type MaterialQuoteStatus =
  | "BROUILLON"
  | "DEMANDE"
  | "EN_ETUDE"
  | "PROPOSITION"
  | "ACCEPTEE"
  | "REFUSEE"
  | "EXPIREE"
  | "ANNULEE";

export type MaterialQuoteItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitName: string;
  unitSymbol: string;
  supplierId?: string | null;
  supplierName?: string;
  unitPrice?: number;
  subtotal?: number;
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

export type MaterialQuoteProposal = {
  id: string;
  requestId: string;
  supplierId: string;
  supplierName: string;
  items: MaterialQuoteItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  delayDays: number | null;
  conditions: string;
  validUntil: string | null;
  comment: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type MaterialQuote = {
  id: string;
  reference: string;
  userId?: string | null;
  customer: {
    name: string;
    phone?: string;
    email?: string;
    city?: string;
    company?: string;
  };
  items: MaterialQuoteItem[];
  comment: string;
  status: MaterialQuoteStatus | string;
  history: { status: string; changedAt: string; changedBy: string; note?: string }[];
  proposals: MaterialQuoteProposal[];
  createdAt: string;
  updatedAt: string;
};

export const QUOTE_STATUS_FILTERS = [
  "BROUILLON",
  "DEMANDE",
  "EN_ETUDE",
  "PROPOSITION",
  "ACCEPTEE",
  "REFUSEE",
  "EXPIREE",
  "ANNULEE",
] as const;

export function formatQuoteDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function quoteAmount(quote: MaterialQuote) {
  const accepted = (quote.proposals || []).find((item) => item.status === "ACCEPTEE");
  const first = (quote.proposals || [])[0];
  return accepted?.totalAmount ?? first?.totalAmount ?? null;
}

export function matchesQuoteSearch(quote: MaterialQuote, rawQuery: string) {
  const needle = rawQuery.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    quote.reference,
    quote.customer?.name,
    quote.customer?.company,
    quote.comment,
    ...(quote.proposals || []).map((item) => item.supplierName),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function friendlyQuoteLoadError(error: unknown) {
  if (error instanceof DemoApiError) {
    if (error.status === 404) return "Cette demande de devis est introuvable.";
    if (error.status > 0 && error.status < 500) return error.message;
  }
  return "Impossible de charger les devis.";
}
