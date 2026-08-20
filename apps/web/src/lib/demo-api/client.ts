import { DEMO_API_URL } from "./config";

export { DEMO_API_URL };

export class DemoApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function demoApiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${DEMO_API_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new DemoApiError(
      `Impossible de joindre le serveur (${DEMO_API_URL}). Vérifiez que la Demo API tourne sur le port 4000.`,
      0,
    );
  }

  if (!response.ok) {
    let apiMessage = "";
    let apiCode: string | undefined;
    try {
      const body = (await response.json()) as {
        error?: string;
        code?: string;
        message?: string;
      };
      if (body.code) apiCode = String(body.code);
      if (body.error) apiMessage = body.error;
      else if (body.message) apiMessage = body.message;
      if (
        !apiCode &&
        apiMessage &&
        /^[A-Z][A-Z0-9_]+$/.test(apiMessage.trim())
      ) {
        apiCode = apiMessage.trim();
      }
    } catch {
      /* ignore */
    }

    if (response.status === 401) {
      throw new DemoApiError(
        apiMessage || "Identifiant ou mot de passe incorrect.",
        401,
        apiCode,
      );
    }
    if (response.status >= 500) {
      throw new DemoApiError(
        "Une erreur serveur est survenue. Réessayez dans un instant.",
        response.status,
        apiCode,
      );
    }
    throw new DemoApiError(
      apiMessage || `Erreur de connexion (${response.status}).`,
      response.status,
      apiCode,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
