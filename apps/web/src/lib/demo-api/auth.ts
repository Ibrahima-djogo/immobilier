import { demoApiFetch, DemoApiError } from "./client";
import { DEMO_API_URL, isDemoAuthMode } from "./config";

export type DemoAuthUser = {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone: string;
  role: "USER" | "PROPRIETAIRE" | "AGENCE" | string;
  status: string;
  roleVerified?: boolean;
  documentsVerified?: boolean;
  phoneVerified?: boolean;
  verificationMethod?: string | null;
  verificationStatus?: string | null;
};

export type AuthResponse = {
  user: DemoAuthUser;
  token: string;
  demoMode?: boolean;
  otpRequired?: boolean;
  note?: string;
};

export type AuthConfig = {
  demoMode: boolean;
  otpRequired: boolean;
  otpChannel: string | null;
  note?: string;
};

/** Endpoint auth canonique Demo API. */
export const AUTH_LOGIN_PATH = "/api/auth/login";

function normalizeLoginIdentifier(raw: string): {
  identifier: string;
  email?: string;
} {
  const identifier = String(raw || "").trim();
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  if (looksLikeEmail) {
    const email = identifier.toLowerCase();
    return { identifier: email, email };
  }
  return { identifier };
}

export const authService = {
  /** true = pas d’OTP SMS (simulation). */
  isDemoMode() {
    return isDemoAuthMode;
  },

  config() {
    return demoApiFetch<AuthConfig>("/api/auth/config");
  },

  register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) {
    return demoApiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        email: String(payload.email || "").trim().toLowerCase(),
      }),
    });
  },

  login(payload: { identifier: string; password: string }) {
    const { identifier, email } = normalizeLoginIdentifier(payload.identifier);
    // Ne pas trim/normaliser le mot de passe — doit rester exact (ex. Demo1234!)
    const password = String(payload.password ?? "");
    const body = {
      identifier,
      ...(email ? { email } : {}),
      password,
    };
    const url = `${DEMO_API_URL}${AUTH_LOGIN_PATH}`;

    if (process.env.NODE_ENV === "development") {
      console.log("LOGIN URL", url);
      console.log("LOGIN REQUEST", {
        identifier: body.identifier,
        email: body.email,
        passwordLength: password.length,
      });
    }

    return demoApiFetch<AuthResponse>(AUTH_LOGIN_PATH, {
      method: "POST",
      body: JSON.stringify(body),
    })
      .then((data) => {
        if (process.env.NODE_ENV === "development") {
          console.log("LOGIN RESPONSE STATUS", 200);
          console.log("LOGIN RESPONSE", data);
        }
        return data;
      })
      .catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.log(
            "LOGIN RESPONSE STATUS",
            error instanceof DemoApiError ? error.status : "unknown",
          );
          console.log("LOGIN RESPONSE", error);
        }
        throw error;
      });
  },

  me(userId: string) {
    return demoApiFetch<{ user: DemoAuthUser; demoMode?: boolean }>(
      "/api/auth/me",
      {
        headers: { "X-User-Id": userId },
      },
    );
  },

  logout() {
    return demoApiFetch<{ ok: boolean }>("/api/auth/logout", {
      method: "POST",
      body: "{}",
    });
  },

  /**
   * Accès Démo (NEXT_PUBLIC_DEMO_MODE uniquement côté UI).
   * POST /api/auth/demo-login — whitelist serveur + DEMO_MODE.
   */
  demoLogin(userId: string) {
    return demoApiFetch<AuthResponse>("/api/auth/demo-login", {
      method: "POST",
      body: JSON.stringify({ userId: String(userId || "").trim() }),
    });
  },
};

export { DemoApiError };
export { DEMO_API_URL } from "./config";
