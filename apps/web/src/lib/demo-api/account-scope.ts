import { DemoApiError, demoApiFetch } from "./client";
import {
  labelPropertyType,
  normalizePropertyTypeKey,
  type PropertyTypeKey,
} from "@/lib/property/typeFields";

export type AccountOperation = "VENTE" | "LOCATION";

export const ALL_PROPERTY_TYPE_KEYS: PropertyTypeKey[] = [
  "TERRAIN",
  "MAISON",
  "VILLA",
  "APPARTEMENT",
  "BUREAU",
  "COMMERCE",
];

export const ALL_ACCOUNT_OPERATIONS: AccountOperation[] = [
  "VENTE",
  "LOCATION",
];

/** Scope relationnel : quelles opérations sont ouvertes pour quel type de bien. */
export type PropertyScope = {
  propertyType: string;
  operations: string[];
};

export type OwnerProfileScope = {
  id: string;
  userId: string;
  profileType: "PARTICULIER" | "MULTI_BIENS" | "PROFESSIONNEL" | string;
  verificationStatus: string;
  allowedPropertyTypes: PropertyTypeKey[] | string[];
  allowedOperations: AccountOperation[] | string[];
  allowedPropertyScopes?: PropertyScope[];
  capabilities?: Record<string, boolean>;
  preset?: string;
  configuredByAdminId?: string | null;
  configuredAt?: string | null;
  approvedAt?: string | null;
};

export type AccountScopeResponse = {
  userId: string;
  role: string;
  ownerProfile: OwnerProfileScope | null;
  agency: {
    id: string;
    activityType?: string | null;
    verificationStatus?: string | null;
    allowedPropertyTypes?: string[];
    allowedOperations?: string[];
    allowedPropertyScopes?: PropertyScope[];
    capabilities?: Record<string, boolean>;
    preset?: string;
    configuredAt?: string | null;
    configuredByAdminId?: string | null;
  } | null;
  history: unknown[];
  scopeRequests: AccountScopeRequest[];
};

export type AccountScopeRequest = {
  id: string;
  userId: string;
  requestedScopes?: PropertyScope[];
  requestedPropertyTypes: string[];
  requestedOperations: string[];
  reason: string | null;
  status: "EN_ATTENTE" | "A_CORRIGER" | "APPROUVEE" | "REFUSEE" | string;
  createdAt: string;
  adminMessage?: string | null;
};

export const accountScopeService = {
  get(userId: string) {
    return demoApiFetch<AccountScopeResponse>(
      `/users/${encodeURIComponent(userId)}/account-scope`,
    );
  },

  requestExtension(payload: {
    userId: string;
    /** Structure canonique : un type de bien + les opérations demandées. */
    requestedScopes: PropertyScope[];
    reason?: string;
  }) {
    const flat = scopesToFlat(payload.requestedScopes);
    return demoApiFetch<AccountScopeRequest>("/account-scope-requests", {
      method: "POST",
      body: JSON.stringify({
        userId: payload.userId,
        requestedScopes: payload.requestedScopes,
        // Listes plates dérivées : compatibilité avec l'admin V1.
        requestedPropertyTypes: flat.types,
        requestedOperations: flat.operations,
        reason: payload.reason,
      }),
    });
  },
};

export function resolveAllowedTypes(
  scope: AccountScopeResponse | null | undefined,
): string[] {
  if (!scope) return [];
  if (scope.ownerProfile?.allowedPropertyTypes?.length) {
    return scope.ownerProfile.allowedPropertyTypes;
  }
  if (scope.agency?.allowedPropertyTypes?.length) {
    return scope.agency.allowedPropertyTypes;
  }
  return [];
}

export function resolveAllowedOperations(
  scope: AccountScopeResponse | null | undefined,
): string[] {
  if (!scope) return [];
  if (scope.ownerProfile?.allowedOperations?.length) {
    return scope.ownerProfile.allowedOperations;
  }
  if (scope.agency?.allowedOperations?.length) {
    return scope.agency.allowedOperations;
  }
  return [];
}

/**
 * Scopes relationnels du compte. Si l'admin n'a configuré que les listes
 * plates, on retombe sur leur produit cartésien (comportement Demo API).
 */
export function resolveAllowedScopes(
  scope: AccountScopeResponse | null | undefined,
): PropertyScope[] {
  const relational =
    scope?.ownerProfile?.allowedPropertyScopes?.length
      ? scope.ownerProfile.allowedPropertyScopes
      : scope?.agency?.allowedPropertyScopes?.length
        ? scope.agency.allowedPropertyScopes
        : null;
  if (relational) {
    return relational
      .map((entry) => ({
        propertyType: String(entry.propertyType || "").toUpperCase(),
        operations: (entry.operations || []).map((op) =>
          String(op).toUpperCase(),
        ),
      }))
      .filter((entry) => entry.propertyType);
  }
  const types = resolveAllowedTypes(scope);
  const operations = resolveAllowedOperations(scope);
  if (!types.length) return [];
  return types.map((type) => ({
    propertyType: String(type).toUpperCase(),
    operations: operations.map((op) => String(op).toUpperCase()),
  }));
}

/**
 * Opérations autorisées pour un type de bien donné.
 * Retourne `null` quand le compte n'a aucun scope configuré (compte legacy :
 * l'API laisse passer, on ne restreint donc pas l'interface).
 */
export function operationsForPropertyType(
  scopes: PropertyScope[],
  propertyType: string,
): string[] | null {
  if (!scopes.length) return null;
  const key = normalizePropertyTypeKey(propertyType);
  const match = scopes.find(
    (entry) => normalizePropertyTypeKey(entry.propertyType) === key,
  );
  return match ? match.operations : [];
}

/** Listes plates dérivées d'un jeu de scopes couplés. */
export function scopesToFlat(scopes: PropertyScope[]): {
  types: string[];
  operations: string[];
} {
  const types: string[] = [];
  const operations: string[] = [];
  for (const scope of scopes) {
    const type = normalizePropertyTypeKey(scope.propertyType);
    if (type && !types.includes(type)) types.push(type);
    for (const op of scope.operations) {
      const key = String(op).toUpperCase();
      if (key && !operations.includes(key)) operations.push(key);
    }
  }
  return { types, operations };
}

/**
 * Delta réel d'une demande d'extension : on retire tout ce qui est déjà
 * accordé. Un type dont toutes les opérations sont actives disparaît.
 */
export function subtractScopes(
  requested: PropertyScope[],
  granted: PropertyScope[],
): PropertyScope[] {
  const out: PropertyScope[] = [];
  for (const scope of requested) {
    const type = normalizePropertyTypeKey(scope.propertyType);
    if (!type) continue;
    const already = operationsForPropertyType(granted, type) || [];
    const missing = scope.operations
      .map((op) => String(op).toUpperCase())
      .filter((op) => !already.includes(op));
    if (missing.length > 0) out.push({ propertyType: type, operations: missing });
  }
  return out;
}

function scopeSignature(scopes: PropertyScope[]): string {
  return scopes
    .map(
      (scope) =>
        `${normalizePropertyTypeKey(scope.propertyType)}:${[...scope.operations]
          .map((op) => String(op).toUpperCase())
          .sort()
          .join("+")}`,
    )
    .sort()
    .join("|");
}

/** Vrai si les deux jeux de scopes portent exactement les mêmes droits. */
export function sameScopes(a: PropertyScope[], b: PropertyScope[]): boolean {
  return scopeSignature(a) === scopeSignature(b);
}

/** Scopes portés par une demande, quel que soit son format d'origine. */
export function scopesOfRequest(request: AccountScopeRequest): PropertyScope[] {
  if (request.requestedScopes?.length) {
    return request.requestedScopes.map((scope) => ({
      propertyType: normalizePropertyTypeKey(scope.propertyType) || "",
      operations: (scope.operations || []).map((op) => String(op).toUpperCase()),
    }));
  }
  const operations = (request.requestedOperations || []).map((op) =>
    String(op).toUpperCase(),
  );
  return (request.requestedPropertyTypes || []).map((type) => ({
    propertyType: normalizePropertyTypeKey(type) || "",
    operations: [...operations],
  }));
}

export function labelOperation(op: string): string {
  const key = String(op || "")
    .trim()
    .toUpperCase();
  if (key === "LOCATION") return "Location";
  if (key === "VENTE") return "Vente";
  return op || "—";
}

export function formatScopeSummary(
  types: string[],
  operations: string[],
): string {
  const typePart = types.length
    ? types.map((t) => labelPropertyType(t)).join(", ")
    : "aucun type";
  const opPart = operations.length
    ? operations.map((o) => labelOperation(o)).join(", ")
    : "aucune opération";
  return `${typePart} · ${opPart}`;
}

/** « Vente · Location » — opérations d'un scope, dans un ordre stable. */
export function formatScopeOperations(operations: string[]): string {
  const keys = ALL_ACCOUNT_OPERATIONS.filter((op) =>
    operations.some((item) => String(item).toUpperCase() === op),
  );
  return keys.length ? keys.map(labelOperation).join(" · ") : "aucune opération";
}

export function isTerrainOnlyScope(types: string[]): boolean {
  return types.length === 1 && String(types[0]).toUpperCase() === "TERRAIN";
}

export function addPropertyCtaLabel(types: string[]): string {
  return isTerrainOnlyScope(types) ? "Ajouter un terrain" : "Ajouter un bien";
}

export type ScopeRestrictionKind =
  | "PROPERTY_TYPE_NOT_ALLOWED"
  | "OPERATION_NOT_ALLOWED"
  | null;

export function detectScopeRestriction(
  err: unknown,
): ScopeRestrictionKind {
  const code =
    err instanceof DemoApiError
      ? err.code
      : undefined;
  const message = err instanceof Error ? err.message : String(err ?? "");
  const haystack = `${code || ""} ${message}`.toUpperCase();
  if (haystack.includes("PROPERTY_TYPE_NOT_ALLOWED")) {
    return "PROPERTY_TYPE_NOT_ALLOWED";
  }
  if (haystack.includes("OPERATION_NOT_ALLOWED")) {
    return "OPERATION_NOT_ALLOWED";
  }
  return null;
}

export function scopeRestrictionMessage(
  err: unknown,
  extensionHref = "/proprietaire/biens?extension=1",
): { message: string; kind: ScopeRestrictionKind; extensionHref: string } {
  const kind = detectScopeRestriction(err);
  if (kind === "PROPERTY_TYPE_NOT_ALLOWED") {
    return {
      kind,
      extensionHref,
      message:
        "Ce type de bien n’est pas autorisé sur votre compte. Demandez une extension pour l’activer.",
    };
  }
  if (kind === "OPERATION_NOT_ALLOWED") {
    return {
      kind,
      extensionHref,
      message:
        "Cette opération (vente ou location) n’est pas autorisée sur votre compte. Demandez une extension pour l’activer.",
    };
  }
  return {
    kind: null,
    extensionHref,
    message:
      err instanceof Error
        ? err.message
        : "Impossible d’enregistrer — démarrez la Demo API (port 4000).",
  };
}
