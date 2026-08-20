import type { ReactNode } from "react";

/**
 * Layout d’authentification admin — sans sidebar ni AdminShell.
 * Routes publiques du frontend administration : /connexion, /mot-de-passe-oublie.
 */
type AuthLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return children;
}
