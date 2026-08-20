import { demoApiFetch } from "./client";
import { adminAuthHeaders } from "./admin-auth";

export type ContactRequestStatus =
  | "NOUVELLE"
  | "PRISE_EN_CHARGE"
  | "PLANIFIEE"
  | "TERMINEE"
  | "ANNULEE";

export type AdminContactRequest = {
  id: string;
  type: "VISIT_REQUEST" | "INFO_REQUEST";
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

export const adminContactService = {
  list(admin: { email: string }, status?: string) {
    const query =
      status && status !== "TOUS"
        ? `?status=${encodeURIComponent(status)}`
        : "";
    return demoApiFetch<AdminContactRequest[]>(
      `/admin/contact-requests${query}`,
      { headers: adminAuthHeaders(admin) },
    );
  },

  get(admin: { email: string }, id: string) {
    return demoApiFetch<AdminContactRequest>(
      `/admin/contact-requests/${encodeURIComponent(id)}`,
      { headers: adminAuthHeaders(admin) },
    );
  },

  updateStatus(
    admin: { email: string; id?: string | number },
    id: string,
    status: ContactRequestStatus,
  ) {
    return demoApiFetch<AdminContactRequest>(
      `/admin/contact-requests/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: adminAuthHeaders(admin),
        body: JSON.stringify({ status }),
      },
    );
  },
};
