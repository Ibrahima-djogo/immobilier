import { demoApiFetch } from "./client";

export type RoleRequestStatus =
  | "BROUILLON"
  | "EN_ATTENTE"
  | "EN_VERIFICATION"
  | "A_CORRIGER"
  | "APPROUVEE"
  | "REFUSEE";

export type ActivityType =
  | "AGENCE_IMMOBILIERE"
  | "PROMOTEUR_IMMOBILIER"
  | "AMENAGEUR_LOTISSEUR"
  | "GESTIONNAIRE_IMMOBILIER"
  | "AUTRE_PROFESSIONNEL_IMMOBILIER"
  | "AUTRE"
  | null;

export type DeclaredPropertyIntentPayload = {
  propertyType: string;
  operations: ("VENTE" | "LOCATION")[];
  quantityRange: "ONE" | "TWO_TO_FIVE" | "MORE_THAN_FIVE" | null;
};

export type VerificationDocument = {
  id: string;
  documentType: string;
  label: string;
  fileName: string | null;
  fileUrl: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  side?: string | null;
  verificationStatus: string;
  rejectionReason: string | null;
  reference?: string | null;
  issuer?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  requirementLevel?: string;
  requirementReason?: string;
  createdAt: string;
};

export type RoleRequest = {
  id: string;
  reference: string;
  userId: string;
  requestedRole: "PROPRIETAIRE" | "AGENCE";
  activityType: ActivityType;
  status: RoleRequestStatus;
  verificationLevel?: string;
  personalInformation: Record<string, string | undefined>;
  companyInformation: Record<string, string | undefined> | null;
  representative: Record<string, string | undefined> | null;
  declarations: {
    accuracy?: boolean;
    authorization?: boolean;
    processing?: boolean;
    privacy?: boolean;
  };
  declaredPropertyIntents?: DeclaredPropertyIntentPayload[];
  declaredPropertyTypes?: string[];
  declaredOperations?: ("VENTE" | "LOCATION")[];
  declaredPortfolioSize?: "ONE" | "TWO_TO_FIVE" | "MORE_THAN_FIVE" | null;
  documentIds: string[];
  documents?: VerificationDocument[];
  correctionMessage: string | null;
  correctionTarget?: string | null;
  sectionReviews?: Record<
    string,
    {
      status?: string;
      message?: string | null;
      updatedAt?: string | null;
    }
  >;
  risk?: string;
  completeness: number;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  reviewedAt?: string | null;
  resubmittedAt?: string | null;
  /** Présent sur REFUSEE : resoumission uniquement si true. */
  canResubmit?: boolean;
  history: { id: string; at: string; label: string; reason?: string }[];
};

export type CreateRoleRequestPayload = {
  userId: string;
  requestedRole: "PROPRIETAIRE" | "AGENCE";
  activityType?: ActivityType;
  personalInformation?: Record<string, string>;
  companyInformation?: Record<string, string> | null;
  representative?: Record<string, string> | null;
  declarations?: RoleRequest["declarations"];
  declaredPropertyIntents?: DeclaredPropertyIntentPayload[];
  declaredPropertyTypes?: string[];
  declaredOperations?: ("VENTE" | "LOCATION")[];
  declaredPortfolioSize?: "ONE" | "TWO_TO_FIVE" | "MORE_THAN_FIVE" | null;
};

export const roleRequestService = {
  list(userId: string) {
    return demoApiFetch<RoleRequest[]>(
      `/role-requests?userId=${encodeURIComponent(userId)}`,
    );
  },

  get(id: string) {
    return demoApiFetch<RoleRequest>(
      `/role-requests/${encodeURIComponent(id)}`,
    );
  },

  create(payload: CreateRoleRequestPayload) {
    return demoApiFetch<RoleRequest>("/role-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id: string, patch: Partial<CreateRoleRequestPayload>) {
    return demoApiFetch<RoleRequest>(
      `/role-requests/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      },
    );
  },

  addDocument(
    id: string,
    payload: {
      documentType: string;
      label?: string;
      fileName?: string;
      fileUrl?: string;
      mimeType?: string;
      fileSize?: number;
      side?: string;
      reference?: string;
      issuer?: string;
      issuedAt?: string;
      expiresAt?: string;
      holderName?: string;
      required?: boolean;
    },
  ) {
    return demoApiFetch<VerificationDocument>(
      `/role-requests/${encodeURIComponent(id)}/documents`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  async uploadDocument(
    id: string,
    payload: {
      file: File;
      documentType: string;
      label?: string;
      side?: string;
      reference?: string;
      issuer?: string;
      issuedAt?: string;
      expiresAt?: string;
      required?: boolean;
      userId: string;
    },
  ) {
    const { DEMO_API_URL } = await import("./config");
    const form = new FormData();
    form.append("file", payload.file);
    form.append("documentType", payload.documentType);
    if (payload.label) form.append("label", payload.label);
    if (payload.side) form.append("side", payload.side);
    if (payload.reference) form.append("reference", payload.reference);
    if (payload.issuer) form.append("issuer", payload.issuer);
    if (payload.issuedAt) form.append("issuedAt", payload.issuedAt);
    if (payload.expiresAt) form.append("expiresAt", payload.expiresAt);
    if (payload.required === false) form.append("required", "false");

    const response = await fetch(
      `${DEMO_API_URL}/role-requests/${encodeURIComponent(id)}/documents/upload`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "X-User-Id": payload.userId,
        },
        body: form,
        cache: "no-store",
      },
    );
    if (!response.ok) {
      let message = `Upload impossible (${response.status})`;
      try {
        const body = (await response.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        /* ignore */
      }
      const { DemoApiError } = await import("./client");
      throw new DemoApiError(message, response.status);
    }
    return (await response.json()) as VerificationDocument;
  },

  deleteDocument(requestId: string, docId: string, userId: string) {
    return demoApiFetch<{ ok: boolean }>(
      `/role-requests/${encodeURIComponent(requestId)}/documents/${encodeURIComponent(docId)}`,
      {
        method: "DELETE",
        headers: { "X-User-Id": userId },
      },
    );
  },

  submit(id: string) {
    return demoApiFetch<RoleRequest>(
      `/role-requests/${encodeURIComponent(id)}/submit`,
      { method: "POST", body: "{}" },
    );
  },

  rules() {
    return demoApiFetch<Record<string, unknown>>("/meta/verification-rules");
  },
};

export function addPropertyLegalDocument(
  propertyId: string,
  payload: Record<string, unknown>,
) {
  return demoApiFetch<VerificationDocument>(
    `/properties/${encodeURIComponent(propertyId)}/legal-documents`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
