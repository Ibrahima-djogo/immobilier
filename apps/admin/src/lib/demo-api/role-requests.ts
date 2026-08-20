import { demoApiFetch } from "./client";
import { adminAuthHeaders } from "./admin-auth";
import { DEMO_API_URL } from "./config";

export type RoleRequestStatus =
  | "BROUILLON"
  | "EN_ATTENTE"
  | "EN_VERIFICATION"
  | "A_CORRIGER"
  | "APPROUVEE"
  | "REFUSEE";

export type PropertyTypeKey =
  | "TERRAIN"
  | "MAISON"
  | "VILLA"
  | "APPARTEMENT"
  | "BUREAU"
  | "COMMERCE";

export type OperationKey = "VENTE" | "LOCATION";

export type ProfileTypeKey = "PARTICULIER" | "MULTI_BIENS" | "PROFESSIONNEL";

export type CapabilityPreset =
  | "PROPRIETAIRE_PARTICULIER"
  | "PROPRIETAIRE_MULTI_BIENS"
  | "PROPRIETAIRE_PROFESSIONNEL"
  | "AGENCE_IMMOBILIERE"
  | "PROMOTEUR_IMMOBILIER"
  | "AMENAGEUR_LOTISSEUR"
  | "AUTRE_PROFESSIONNEL";

export type SectionReviewStatus =
  | "EN_ATTENTE"
  | "VERIFIE"
  | "A_CORRIGER"
  | "REFUSE";

export type SectionReview = {
  status: SectionReviewStatus;
  message?: string | null;
  updatedAt?: string | null;
  updatedByAdminId?: string | null;
};

export type AccountConfiguration = {
  role?: "PROPRIETAIRE" | "AGENCE";
  profileType?: ProfileTypeKey | null;
  activityType?: string | null;
  preset?: CapabilityPreset | string | null;
  allowedPropertyTypes?: PropertyTypeKey[] | string[];
  allowedOperations?: OperationKey[] | string[];
  allowedPropertyScopes?: PropertyScope[];
  capabilities?: Record<string, boolean>;
  reason?: string;
  configuredAt?: string | null;
  configuredByAdminId?: string | null;
  configuredByAdminName?: string | null;
  approvedAt?: string | null;
  approvedByAdminId?: string | null;
  approvedByAdminName?: string | null;
};

export type AccessPreview = {
  allowed: string[];
  denied: string[];
  typeLabels?: string[];
  operations?: string[];
  scopes?: PropertyScope[];
};

/** Projet déclaré : un type de bien, ses opérations et le volume annoncé. */
export type DeclaredPropertyIntent = {
  propertyType: PropertyTypeKey | string;
  operations: (OperationKey | string)[];
  quantityRange?: string | null;
};

/** Droit accordé : un type de bien et les opérations autorisées dessus. */
export type PropertyScope = {
  propertyType: PropertyTypeKey | string;
  operations: (OperationKey | string)[];
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
  holderName?: string | null;
  requirementLevel?: string | null;
  requirementReason?: string | null;
  /** Vraie exigence : une pièce facultative ne bloque pas la validation. */
  requirementMandatory?: boolean;
  demo?: boolean;
  createdAt: string;
  verifiedAt?: string | null;
};

export type AdminRoleRequest = {
  id: string;
  reference: string;
  userId: string;
  requestedRole: "PROPRIETAIRE" | "AGENCE";
  activityType: string | null;
  status: RoleRequestStatus;
  verificationLevel?: string;
  personalInformation: Record<string, string | undefined>;
  companyInformation: Record<string, string | undefined> | null;
  representative: Record<string, string | undefined> | null;
  declarations: Record<string, boolean | undefined>;
  documents?: VerificationDocument[];
  documentsCount?: number;
  correctionMessage: string | null;
  correctionTarget?: string | null;
  canResubmit?: boolean;
  risk?: string;
  completeness: number;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  history: {
    id: string;
    at: string;
    label: string;
    reason?: string;
    configuration?: unknown;
  }[];
  verificationNotice?: string;
  declaredPropertyIntents?: DeclaredPropertyIntent[];
  declaredPropertyTypes?: PropertyTypeKey[] | string[];
  declaredOperations?: OperationKey[] | string[];
  declaredPortfolioSize?: string | null;
  /** Dossier de démonstration (jeu de données interne). */
  demo?: boolean;
  demoLabel?: string | null;
  sectionReviews?: {
    identity?: SectionReview;
    documents?: SectionReview;
    declaredProfile?: SectionReview;
    company?: SectionReview;
    [key: string]: SectionReview | undefined;
  };
  /** Proposition système, non accordée. */
  proposedConfiguration?: AccountConfiguration | null;
  /** Configuration enregistrée par l’admin, pas encore appliquée au compte. */
  savedConfiguration?: AccountConfiguration | null;
  /** Configuration réellement active sur le compte (après approbation). */
  appliedConfiguration?: AccountConfiguration | null;
  accessPreview?: AccessPreview | null;
  canFinalize?: { ok: boolean; error?: string } | boolean;
};

export type AccountScopeResponse = {
  userId: string;
  role: string;
  ownerProfile: {
    id?: string;
    userId?: string;
    profileType?: string | null;
    verificationStatus?: string | null;
    allowedPropertyTypes?: string[];
    allowedOperations?: string[];
    allowedPropertyScopes?: PropertyScope[];
    capabilities?: Record<string, boolean>;
    preset?: string | null;
    configuredAt?: string | null;
    configuredByAdminId?: string | null;
    configuredByAdminName?: string | null;
    approvedAt?: string | null;
    approvedByAdminId?: string | null;
    approvedByAdminName?: string | null;
  } | null;
  agency: {
    id: string;
    activityType?: string | null;
    verificationStatus?: string | null;
    allowedPropertyTypes?: string[];
    allowedOperations?: string[];
    allowedPropertyScopes?: PropertyScope[];
    capabilities?: Record<string, boolean>;
    preset?: string | null;
    configuredAt?: string | null;
    configuredByAdminId?: string | null;
    configuredByAdminName?: string | null;
    approvedAt?: string | null;
    approvedByAdminId?: string | null;
    approvedByAdminName?: string | null;
  } | null;
  history?: {
    id: string;
    createdAt?: string;
    action?: string;
    reason?: string;
    before?: unknown;
    after?: unknown;
  }[];
  scopeRequests?: unknown[];
};

export const PROPERTY_TYPE_OPTIONS: {
  key: PropertyTypeKey;
  label: string;
}[] = [
  { key: "TERRAIN", label: "Terrain" },
  { key: "MAISON", label: "Maison" },
  { key: "VILLA", label: "Villa" },
  { key: "APPARTEMENT", label: "Appartement" },
  { key: "BUREAU", label: "Bureau" },
  { key: "COMMERCE", label: "Commerce" },
];

export const OPERATION_OPTIONS: { key: OperationKey; label: string }[] = [
  { key: "VENTE", label: "Vente" },
  { key: "LOCATION", label: "Location" },
];

export const PROFILE_TYPE_OPTIONS: { key: ProfileTypeKey; label: string }[] = [
  { key: "PARTICULIER", label: "Particulier" },
  { key: "MULTI_BIENS", label: "Multi-biens" },
  { key: "PROFESSIONNEL", label: "Professionnel" },
];

export const PRESET_OPTIONS: { key: CapabilityPreset; label: string }[] = [
  { key: "PROPRIETAIRE_PARTICULIER", label: "Propriétaire particulier" },
  { key: "PROPRIETAIRE_MULTI_BIENS", label: "Propriétaire multi-biens" },
  { key: "PROPRIETAIRE_PROFESSIONNEL", label: "Propriétaire professionnel" },
  { key: "AGENCE_IMMOBILIERE", label: "Agence immobilière" },
  { key: "PROMOTEUR_IMMOBILIER", label: "Promoteur immobilier" },
  { key: "AMENAGEUR_LOTISSEUR", label: "Aménageur / lotisseur" },
  { key: "AUTRE_PROFESSIONNEL", label: "Autre professionnel" },
];

export const ACTIVITY_TYPE_OPTIONS: { key: string; label: string }[] = [
  { key: "AGENCE_IMMOBILIERE", label: "Agence immobilière" },
  { key: "PROMOTEUR_IMMOBILIER", label: "Promoteur immobilier" },
  { key: "AMENAGEUR_LOTISSEUR", label: "Aménageur / lotisseur" },
  { key: "GESTIONNAIRE_IMMOBILIER", label: "Gestionnaire immobilier" },
  {
    key: "AUTRE_PROFESSIONNEL_IMMOBILIER",
    label: "Autre professionnel immobilier",
  },
];

export const PORTFOLIO_SIZE_LABELS: Record<string, string> = {
  ONE: "1 bien",
  TWO_TO_FIVE: "2 à 5 biens",
  MORE_THAN_FIVE: "Plus de 5 biens",
};

export function propertyTypeLabel(key: string): string {
  return PROPERTY_TYPE_OPTIONS.find((o) => o.key === key)?.label || key;
}

export function operationLabel(key: string): string {
  return OPERATION_OPTIONS.find((o) => o.key === key)?.label || key;
}

export function presetLabel(key?: string | null): string {
  if (!key) return "—";
  return PRESET_OPTIONS.find((o) => o.key === key)?.label || key;
}

export function activityTypeLabel(key?: string | null): string {
  if (!key) return "—";
  return ACTIVITY_TYPE_OPTIONS.find((o) => o.key === key)?.label || key;
}

export function profileTypeLabel(key?: string | null): string {
  if (!key) return "—";
  return PROFILE_TYPE_OPTIONS.find((o) => o.key === key)?.label || key;
}

/** Comparaison stable de deux jeux de scopes (état « non enregistré »). */
export function sameScopes(a: PropertyScope[], b: PropertyScope[]): boolean {
  const normalize = (list: PropertyScope[]) =>
    JSON.stringify(
      [...list]
        .map((scope) => ({
          propertyType: String(scope.propertyType),
          operations: [...scope.operations].map(String).sort(),
        }))
        .sort((x, y) => x.propertyType.localeCompare(y.propertyType)),
    );
  return normalize(a) === normalize(b);
}

/**
 * Les fichiers de vérification sont servis par la Demo API : le lien doit être
 * absolu, sinon « Voir » pointerait sur l’origine de l’administration (404).
 */
export function demoApiFileUrl(fileUrl?: string | null): string | null {
  if (!fileUrl) return null;
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `${DEMO_API_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

/** Produit croisé types × opérations — utilisé quand aucun scope explicite. */
export function scopesFromFlat(
  types: (PropertyTypeKey | string)[] = [],
  operations: (OperationKey | string)[] = [],
): PropertyScope[] {
  return types.map((propertyType) => ({
    propertyType,
    operations: [...operations],
  }));
}

export function scopesFromIntents(
  intents: DeclaredPropertyIntent[] = [],
  fallbackOperations: (OperationKey | string)[] = [],
): PropertyScope[] {
  return intents.map((intent) => ({
    propertyType: intent.propertyType,
    operations:
      intent.operations && intent.operations.length > 0
        ? [...intent.operations]
        : [...fallbackOperations],
  }));
}

export function scopeOperations(
  scopes: PropertyScope[],
  propertyType: string,
): (OperationKey | string)[] {
  return scopes.find((s) => s.propertyType === propertyType)?.operations || [];
}

export function scopesToFlat(scopes: PropertyScope[] = []) {
  const types: string[] = [];
  const operations: string[] = [];
  for (const scope of scopes) {
    if (!types.includes(String(scope.propertyType))) {
      types.push(String(scope.propertyType));
    }
    for (const op of scope.operations) {
      if (!operations.includes(String(op))) operations.push(String(op));
    }
  }
  return { types, operations };
}

export function formatIntent(intent: DeclaredPropertyIntent): string {
  const ops = (intent.operations || []).map((o) => operationLabel(String(o)));
  const volume = intent.quantityRange
    ? PORTFOLIO_SIZE_LABELS[intent.quantityRange] || intent.quantityRange
    : null;
  return [
    propertyTypeLabel(String(intent.propertyType)),
    ops.length > 0 ? ops.join(" + ") : "—",
    volume,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function buildAccessPreview(config: {
  role?: string | null;
  allowedPropertyScopes?: PropertyScope[];
  allowedPropertyTypes?: string[];
  allowedOperations?: string[];
}): AccessPreview {
  const scopes =
    config.allowedPropertyScopes && config.allowedPropertyScopes.length > 0
      ? config.allowedPropertyScopes
      : scopesFromFlat(
          config.allowedPropertyTypes || [],
          config.allowedOperations || [],
        );
  const flat = scopesToFlat(scopes);
  const typeLabels = flat.types.map(propertyTypeLabel);
  const allowed = [
    config.role === "AGENCE" ? "Espace Agence" : "Espace Propriétaire",
    config.role === "AGENCE" ? "Portefeuille biens" : "Mes biens",
    ...scopes.map((scope) => {
      const ops = (scope.operations || []).map((o) => operationLabel(String(o)));
      return `Ajouter / gérer : ${propertyTypeLabel(String(scope.propertyType))}${
        ops.length > 0 ? ` (${ops.join(" + ")})` : ""
      }`;
    }),
    "Soumettre une annonce à modération",
  ];
  const denied = [
    ...PROPERTY_TYPE_OPTIONS.filter((o) => !flat.types.includes(o.key)).map(
      (o) => `Type ${o.label}`,
    ),
    ...scopes.flatMap((scope) =>
      OPERATION_OPTIONS.filter(
        (o) =>
          (scope.operations || []).length > 0 &&
          !scope.operations.includes(o.key),
      ).map(
        (o) =>
          `${o.label} sur ${propertyTypeLabel(String(scope.propertyType))}`,
      ),
    ),
    "Publication directe sans modération",
  ];
  return {
    allowed,
    denied,
    typeLabels,
    operations: flat.operations,
    scopes,
  };
}

type AdminRef = { email: string; id?: string | number };

export type RoleDecisionPayload = {
  decision: "APPROUVER" | "CORRIGER" | "REFUSER";
  reason?: string;
  configuration?: {
    profileType?: ProfileTypeKey | string | null;
    preset?: CapabilityPreset | string | null;
    activityType?: string | null;
    allowedPropertyTypes?: string[];
    allowedOperations?: string[];
    allowedPropertyScopes?: PropertyScope[];
  };
  correctionTarget?: string | null;
  canResubmit?: boolean;
};

export const adminRoleRequestService = {
  list(admin: AdminRef, params?: { status?: string; role?: string }) {
    const q = new URLSearchParams();
    if (params?.status && params.status !== "TOUS") {
      q.set("status", params.status);
    }
    if (params?.role && params.role !== "TOUS") {
      q.set("role", params.role);
    }
    const qs = q.toString();
    return demoApiFetch<AdminRoleRequest[]>(
      `/admin/role-requests${qs ? `?${qs}` : ""}`,
      { headers: adminAuthHeaders(admin) },
    );
  },

  get(admin: AdminRef, id: string) {
    return demoApiFetch<AdminRoleRequest>(
      `/admin/role-requests/${encodeURIComponent(id)}`,
      { headers: adminAuthHeaders(admin) },
    );
  },

  reviewDocument(
    admin: AdminRef,
    requestId: string,
    docId: string,
    payload: { verificationStatus: string; rejectionReason?: string },
  ) {
    return demoApiFetch<VerificationDocument>(
      `/admin/role-requests/${encodeURIComponent(requestId)}/documents/${encodeURIComponent(docId)}`,
      {
        method: "PATCH",
        headers: adminAuthHeaders(admin),
        body: JSON.stringify(payload),
      },
    );
  },

  reviewSection(
    admin: AdminRef,
    requestId: string,
    sectionKey: string,
    payload: { status: SectionReviewStatus; message?: string },
  ) {
    return demoApiFetch<SectionReview>(
      `/admin/role-requests/${encodeURIComponent(requestId)}/sections/${encodeURIComponent(sectionKey)}`,
      {
        method: "PATCH",
        headers: adminAuthHeaders(admin),
        body: JSON.stringify(payload),
      },
    );
  },

  /**
   * Enregistre la configuration préparée par l’admin sans rien approuver :
   * le rôle, le profil propriétaire et l’agence restent inchangés.
   */
  saveAccountConfiguration(
    admin: AdminRef,
    requestId: string,
    payload: {
      preset: CapabilityPreset | string;
      profileType?: ProfileTypeKey | string | null;
      activityType?: string | null;
      allowedPropertyScopes: PropertyScope[];
    },
  ) {
    return demoApiFetch<AdminRoleRequest>(
      `/admin/role-requests/${encodeURIComponent(requestId)}/account-configuration`,
      {
        method: "PATCH",
        headers: adminAuthHeaders(admin),
        body: JSON.stringify(payload),
      },
    );
  },

  decide(admin: AdminRef, requestId: string, payload: RoleDecisionPayload) {
    return demoApiFetch<AdminRoleRequest>(
      `/admin/role-requests/${encodeURIComponent(requestId)}/decision`,
      {
        method: "POST",
        headers: adminAuthHeaders(admin),
        body: JSON.stringify(payload),
      },
    );
  },

  accountScope(userId: string) {
    return demoApiFetch<AccountScopeResponse>(
      `/users/${encodeURIComponent(userId)}/account-scope`,
    );
  },

  updateAccountScope(
    admin: AdminRef,
    userId: string,
    payload: {
      profileType?: ProfileTypeKey | string | null;
      preset?: CapabilityPreset | string | null;
      activityType?: string | null;
      allowedPropertyTypes: string[];
      allowedOperations: string[];
      allowedPropertyScopes?: PropertyScope[];
      reason?: string;
    },
  ) {
    return demoApiFetch<{
      kind: "OWNER" | "AGENCY";
      ownerProfile?: AccountScopeResponse["ownerProfile"];
      agency?: AccountScopeResponse["agency"];
    }>(`/admin/users/${encodeURIComponent(userId)}/account-scope`, {
      method: "PATCH",
      headers: adminAuthHeaders(admin),
      body: JSON.stringify(payload),
    });
  },

  propertyLegalDocs(admin: AdminRef, propertyId: string) {
    return demoApiFetch<{
      propertyId: string;
      legalVerificationStatus: string;
      documents: VerificationDocument[];
      notice: string;
    }>(`/admin/properties/${encodeURIComponent(propertyId)}/legal-documents`, {
      headers: adminAuthHeaders(admin),
    });
  },

  setPropertyLegalStatus(
    admin: AdminRef,
    propertyId: string,
    legalVerificationStatus: string,
  ) {
    return demoApiFetch<{
      propertyId: string;
      legalVerificationStatus: string;
    }>(`/admin/properties/${encodeURIComponent(propertyId)}/legal-status`, {
      method: "PATCH",
      headers: adminAuthHeaders(admin),
      body: JSON.stringify({ legalVerificationStatus }),
    });
  },
};
