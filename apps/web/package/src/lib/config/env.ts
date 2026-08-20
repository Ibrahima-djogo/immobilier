function cleanUrl(value: string | undefined, fallback: string) {
  const normalized = (value ?? fallback).trim().replace(/\/+$/, "");
  return normalized || fallback;
}

export const env = {
  apiBaseUrl: cleanUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL,
    "http://localhost:8080/api/v1",
  ),
  siteUrl: cleanUrl(
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://localhost:3000",
  ),
  appEnvironment:
    process.env.NEXT_PUBLIC_APP_ENVIRONMENT ?? "development",
} as const;

export function isProduction() {
  return env.appEnvironment === "production";
}
