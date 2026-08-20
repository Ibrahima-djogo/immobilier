import type {
  AccountRole,
  AuthSession,
} from "@/lib/auth/types";

const roleOrder: Record<AccountRole, number> = {
  UTILISATEUR: 1,
  PROPRIETAIRE: 2,
  AGENCE: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function isAccountOperational(session: AuthSession) {
  return session.authenticated && session.user?.status === "ACTIF";
}

export function hasRole(
  session: AuthSession,
  acceptedRoles: AccountRole[],
) {
  return Boolean(
    isAccountOperational(session) &&
      session.user &&
      acceptedRoles.includes(session.user.role),
  );
}

export function hasMinimumRole(
  session: AuthSession,
  minimumRole: AccountRole,
) {
  if (!isAccountOperational(session) || !session.user) return false;
  return roleOrder[session.user.role] >= roleOrder[minimumRole];
}

export function hasPermission(
  session: AuthSession,
  permission: string,
) {
  if (!isAccountOperational(session) || !session.user) return false;

  return (
    session.user.role === "SUPER_ADMIN" ||
    session.user.permissions.includes(permission)
  );
}

export function canPublish(session: AuthSession) {
  return hasRole(session, ["PROPRIETAIRE", "AGENCE", "SUPER_ADMIN"]);
}

export function canAccessAdministration(session: AuthSession) {
  return hasRole(session, ["ADMIN", "SUPER_ADMIN"]);
}

/**
 * Ces fonctions améliorent l'expérience front-end uniquement.
 * Le serveur Spring Boot doit refaire chaque contrôle de rôle,
 * statut, permission et propriété de la ressource.
 */
