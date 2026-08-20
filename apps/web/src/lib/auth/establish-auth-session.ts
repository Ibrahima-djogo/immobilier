import { routes } from "@/lib/routes/app-routes";
import {
  establishPublicDemoSession,
  type PublicDemoSession,
} from "@/lib/auth/public-demo-session";
import type { AuthResponse } from "@/lib/demo-api/auth";

export function destinationForAuthRole(
  role: string,
  returnPath: string | null = null,
): string {
  if (returnPath) return returnPath;
  if (role === "PROPRIETAIRE") return routes.ownerDashboard;
  if (role === "AGENCE") return routes.agencyDashboard;
  return routes.userDashboard;
}

export function safeAuthReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.startsWith("/connexion") || raw.startsWith("/inscription")) return null;
  return raw;
}

/**
 * Même installation de session pour login classique et Accès Démo.
 */
export function establishSessionFromAuthResponse(
  result: AuthResponse,
): PublicDemoSession {
  if (!result?.user?.id) {
    throw new Error(
      "La connexion a été validée mais la session n'a pas pu être initialisée.",
    );
  }
  const session = establishPublicDemoSession({
    user: result.user,
    token: result.token,
  });
  if (!session) {
    throw new Error(
      "La connexion a été validée mais la session n'a pas pu être initialisée.",
    );
  }
  return session;
}
