import { env } from "@/lib/config/env";
import {
  ApiRequestError,
  type ApiErrorPayload,
} from "@/lib/api/types";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
};

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${env.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (response.status === 204) return undefined;

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || undefined;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 12_000,
  );

  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined;

  if (hasBody && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  headers.set("accept", "application/json");

  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    const payload = await readPayload(response);

    if (!response.ok) {
      const errorPayload =
        typeof payload === "object" && payload !== null
          ? (payload as ApiErrorPayload)
          : undefined;

      throw new ApiRequestError(
        errorPayload?.message ??
          (typeof payload === "string" ? payload : "La requête a échoué."),
        {
          status: response.status,
          code: errorPayload?.code,
          fieldErrors: errorPayload?.errors,
          traceId: errorPayload?.traceId,
        },
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiRequestError("Le serveur met trop de temps à répondre.", {
        status: 408,
        code: "REQUEST_TIMEOUT",
      });
    }

    throw new ApiRequestError(
      "Impossible de joindre le serveur. Vérifiez votre connexion.",
      {
        status: 0,
        code: "NETWORK_ERROR",
      },
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

export const api = {
  get<T>(path: string, options?: RequestOptions) {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return apiRequest<T>(path, { ...options, method: "POST", body });
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return apiRequest<T>(path, { ...options, method: "PATCH", body });
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return apiRequest<T>(path, { ...options, method: "PUT", body });
  },
  delete<T>(path: string, options?: RequestOptions) {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
  },
};
