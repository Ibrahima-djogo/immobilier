/**
 * Types préparatoires pour l’authentification administration.
 * Aucune session serveur ni JWT n’est implémenté ici.
 */

/** Rôles de sécurité (accès). Les profils détaillés vivent dans admin-accounts. */
export type AdminRole = "ADMIN" | "SUPER_ADMIN";

/** Rôles non autorisés à l’espace administration. */
export type PublicUserRole = "CLIENT" | "PROPRIETAIRE" | "AGENCE";

export type AdminLoginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

/**
 * Forme attendue du futur POST /api/auth/admin/login.
 * Ne pas utiliser comme preuve d’authentification réelle aujourd’hui.
 */
export type AdminLoginResponse = {
  user: {
    id: string;
    email: string;
    displayName: string;
    roles: AdminRole[];
    permissions: string[];
  };
  token?: string;
  session?: string;
};

export function toSecurityRole(
  role: string,
): AdminRole {
  return role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";
}
