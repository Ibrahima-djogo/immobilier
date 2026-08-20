import { demoApiFetch } from "./client";

export type ContactRequestStatus =
  | "NOUVELLE"
  | "PRISE_EN_CHARGE"
  | "PLANIFIEE"
  | "TERMINEE"
  | "ANNULEE";

export type ContactRequestType = "VISIT_REQUEST" | "INFO_REQUEST";

export type ContactRequest = {
  id: string;
  type: ContactRequestType;
  listingId: string;
  propertyId: string | null;
  listingTitle: string;
  listingReference: string;
  clientUserId: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  message: string;
  preferredDate: string | null;
  timeSlot: string | null;
  ownerId: string | null;
  agencyId: string | null;
  advertiserName: string | null;
  advertiserType: "PROPRIETAIRE" | "AGENCE" | null;
  status: ContactRequestStatus;
  createdAt: string;
  updatedAt: string;
  handledByAdminId?: string | null;
};

export type CreateVisitRequestInput = {
  listingId: string;
  propertyId?: string | null;
  clientUserId?: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  message: string;
  preferredDate?: string;
  timeSlot?: string;
};

export type ContactEventType = "PHONE_CLICK" | "WHATSAPP_CLICK" | "VISIT_REQUEST";

export const contactRequestService = {
  createVisit(input: CreateVisitRequestInput) {
    return demoApiFetch<ContactRequest>("/contact-requests", {
      method: "POST",
      body: JSON.stringify({
        type: "VISIT_REQUEST",
        ...input,
      }),
    });
  },

  trackEvent(input: {
    type: ContactEventType;
    listingId: string;
    userId?: string | null;
  }) {
    return demoApiFetch<{ ok: true }>("/contact-events", {
      method: "POST",
      body: JSON.stringify(input),
    }).catch(() => ({ ok: true as const }));
  },
};
