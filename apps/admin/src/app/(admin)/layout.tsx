import type { ReactNode } from "react";

/**
 * Groupe de routes administratives.
 * Les pages utilisent AdminShell individuellement.
 * Le contrôle d’accès réel (ADMIN / SUPER_ADMIN) sera branché ici plus tard.
 */
type AdminLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AdminLayout({ children }: AdminLayoutProps) {
  return children;
}
