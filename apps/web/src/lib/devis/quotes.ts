import { publicSessionAuthHeaders } from "@/lib/auth/public-demo-session";
import { demoApiFetch } from "@/lib/demo-api/client";
import type {
  MaterialQuoteLineDraft,
  MaterialQuoteRequest,
} from "@/lib/materiaux/types";

export type { MaterialQuoteLineDraft, MaterialQuoteRequest };

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
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitName: string;
    supplierName?: string;
  }[];
  comment: string;
  status: string;
  history: { status: string; changedAt: string; changedBy: string; note?: string }[];
  proposals: {
    id: string;
    supplierId: string;
    supplierName: string;
    items: { productName: string; quantity: number; unitPrice: number; subtotal: number }[];
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    delayDays: number | null;
    conditions: string;
    validUntil: string | null;
    comment: string;
    status: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

export function formatQuoteStatus(status: string) {
  if (status === "BROUILLON") return "Brouillon";
  if (status === "DEMANDE") return "Demande";
  if (status === "EN_ETUDE") return "En étude";
  if (status === "PROPOSITION") return "Proposition";
  if (status === "ACCEPTEE") return "Acceptée";
  if (status === "REFUSEE") return "Refusée";
  if (status === "EXPIREE") return "Expirée";
  if (status === "ANNULEE") return "Annulée";
  return status.replace(/_/g, " ");
}

export async function loadMyQuotes() {
  return demoApiFetch<MaterialQuote[]>("/materials/quotes/my", {
    cache: "no-store",
    headers: { ...publicSessionAuthHeaders() },
  });
}

export async function loadMyQuote(id: string) {
  return demoApiFetch<MaterialQuote>(
    `/materials/quotes/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: { ...publicSessionAuthHeaders() },
    },
  );
}

export async function createQuoteRequest(input: {
  items: { productId: string; quantity: number }[];
  comment?: string;
  customer?: { name?: string; city?: string; company?: string };
}) {
  return demoApiFetch<MaterialQuote>("/materials/quotes", {
    method: "POST",
    headers: { ...publicSessionAuthHeaders() },
    body: JSON.stringify(input),
  });
}

export async function respondToQuoteProposal(
  quoteId: string,
  proposalId: string,
  action: "accept" | "refuse",
) {
  return demoApiFetch<MaterialQuote>(
    `/materials/quotes/${encodeURIComponent(quoteId)}/proposals/${encodeURIComponent(proposalId)}/${action}`,
    {
      method: "POST",
      headers: { ...publicSessionAuthHeaders() },
      body: JSON.stringify({}),
    },
  );
}
