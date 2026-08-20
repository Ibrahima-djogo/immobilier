import type { Administrator } from "@/lib/administration/admin-accounts";

/** En-têtes Demo API pour identifier l’admin (RBAC côté serveur). */
export function adminAuthHeaders(
  admin:
    | Pick<Administrator, "email" | "id">
    | { email: string; id?: string | number }
    | null
    | undefined,
): Record<string, string> {
  if (!admin?.email) return {};
  const headers: Record<string, string> = { "X-Admin-Email": admin.email };
  if (admin.id != null) headers["X-Admin-Id"] = String(admin.id);
  return headers;
}
