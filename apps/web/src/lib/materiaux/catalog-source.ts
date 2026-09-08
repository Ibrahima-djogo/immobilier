/**
 * Catalogue public — lecture Demo API.
 * Demain : le même contrat via Spring Boot.
 */

import { DemoApiError, demoApiFetch } from "@/lib/demo-api/client";

import { hydratePublicCatalog, hydratePublicMaterial } from "./catalog";
import type { PublicCatalog, PublicMaterial } from "./types";

export async function loadPublicCatalog(): Promise<PublicCatalog> {
  const catalog = await demoApiFetch<PublicCatalog>("/materials/catalog");
  return hydratePublicCatalog(catalog);
}

export async function loadPublicMaterial(
  slug: string,
): Promise<PublicMaterial | undefined> {
  try {
    const material = await demoApiFetch<PublicMaterial>(
      `/materials/catalog/${encodeURIComponent(slug)}`,
    );
    return hydratePublicMaterial(material);
  } catch (error) {
    if (error instanceof DemoApiError && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}
