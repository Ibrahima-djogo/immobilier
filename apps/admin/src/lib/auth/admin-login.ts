import { adminLoginSchema, safeParseFields } from "@/lib/validation";
import type { AdminLoginPayload } from "./types";

/**
 * Point d’intégration prévu pour :
 *   POST /api/auth/admin/login
 *
 * Aujourd’hui : parcours frontend de démonstration uniquement.
 * Ne crée ni JWT, ni session, ni stockage local d’identité.
 */
export async function submitAdminLogin(
  payload: AdminLoginPayload,
): Promise<void> {
  // Placeholder pour le futur appel API :
  // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/login`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });

  void payload;

  // Simule la latence réseau sans authentifier réellement.
  await new Promise((resolve) => {
    window.setTimeout(resolve, 900);
  });
}

export type FieldErrors = {
  email?: string;
  password?: string;
};

export function validateAdminLoginForm(
  email: string,
  password: string,
): FieldErrors {
  const parsed = safeParseFields(adminLoginSchema, { email, password });
  if (parsed.ok) return {};
  return {
    email: parsed.errors.email,
    password: parsed.errors.password,
  };
}
