/**
 * Demo API partagée — TEMPORAIRE (remplacée par Spring Boot).
 */
export const DEMO_API_URL =
  process.env.NEXT_PUBLIC_DEMO_API_URL || "http://localhost:4000";

/**
 * Mode démonstration auth (OTP SMS désactivé).
 * Passer NEXT_PUBLIC_DEMO_MODE=false pour réactiver le parcours OTP futur.
 */
export const isDemoAuthMode =
  String(process.env.NEXT_PUBLIC_DEMO_MODE ?? "true").toLowerCase() !==
  "false";

/** Démo propriétaire (Mamadou Diallo). */
export const DEMO_OWNER_ID = "u1";

/** Démo agence (Habitat Conakry). */
export const DEMO_AGENCY_ID = "ag1";

/**
 * Compte utilisateur derrière l'agence démo. Les scopes sont portés par le
 * user, pas par l'agence : c'est cet id qu'attend /users/:id/account-scope.
 */
export const DEMO_AGENCY_USER_ID = "u-ag1";

export const DEMO_POLL_MS = 5000;
