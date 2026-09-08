/**
 * Session client démo (localStorage) — TEMPORAIRE jusqu’à Spring Boot.
 * Le token/session pointe vers un user réel de la Demo API (db.json).
 */

export type PublicDemoSession = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
  token?: string;
  authenticated: true;
};

const STORAGE_KEY = "dg_demo_public_session";

export function readPublicDemoSessionRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parsePublicDemoSession(
  raw: string | null,
): PublicDemoSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PublicDemoSession>;
    if (!parsed?.id || !parsed?.name || !parsed?.email) return null;
    return {
      id: String(parsed.id),
      name: String(parsed.name),
      email: String(parsed.email),
      phone: String(parsed.phone || ""),
      role: parsed.role ? String(parsed.role) : undefined,
      token: parsed.token ? String(parsed.token) : String(parsed.id),
      authenticated: true,
    };
  } catch {
    return null;
  }
}

export function subscribePublicDemoSession(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("dg-public-session", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("dg-public-session", onChange);
  };
}

export function readPublicDemoSession(): PublicDemoSession | null {
  return parsePublicDemoSession(readPublicDemoSessionRaw());
}

export function writePublicDemoSession(session: PublicDemoSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("dg-public-session"));
}

export function clearPublicDemoSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("dg-public-session"));
}

/** En-têtes d’identité Demo API — jamais un userId dans le corps. */
export function publicSessionAuthHeaders(): Record<string, string> {
  const session = readPublicDemoSession();
  if (!session?.authenticated) return {};
  const token = session.token || session.id;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Construit une session locale à partir d’un user Demo API. */
export function sessionFromDemoUser(user: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}): PublicDemoSession {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role || "USER",
    token: user.id,
    authenticated: true,
  };
}

/**
 * Persist la session Demo après login/register.
 * Retourne la session lue (ou null si écriture invalide).
 */
export function establishPublicDemoSession(input: {
  user: {
    id: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
    role?: string | null;
  };
  token?: string | null;
}): PublicDemoSession | null {
  const name =
    (input.user.name || "").trim() ||
    [input.user.firstName, input.user.lastName].filter(Boolean).join(" ").trim() ||
    input.user.email;
  const session: PublicDemoSession = {
    ...sessionFromDemoUser({
      id: input.user.id,
      name,
      email: input.user.email,
      phone: input.user.phone || "",
      role: input.user.role || "USER",
    }),
    token: input.token || input.user.id,
  };
  writePublicDemoSession(session);
  const stored = readPublicDemoSession();
  if (!stored?.id || stored.id !== input.user.id) return null;
  return stored;
}

/**
 * @deprecated Ne plus utiliser — forçait tous les logins vers u-client.
 * Conservé uniquement pour compat temporaire ; préférer sessionFromDemoUser.
 */
export function createDemoClientSession(
  identifier: string,
): PublicDemoSession {
  const id = identifier.trim();
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id);
  return {
    id: "u-client",
    name: looksLikeEmail
      ? id.split("@")[0].replace(/[._]/g, " ")
      : "Client Démo",
    email: looksLikeEmail ? id : "client@demeureguinee.demo",
    phone: looksLikeEmail ? "" : id,
    role: "USER",
    token: "u-client",
    authenticated: true,
  };
}
