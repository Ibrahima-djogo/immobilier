/**
 * Couche données vérification foncière.
 * Legacy local storage removed.
 * Data source is now Demo API.
 */

import { demoApiFetch } from "@/lib/demo-api/client";
import type { FonciereVerificationStatus } from "./types";
import type { FonciereVerificationRequest } from "./types";

export type FonciereClientRecord = FonciereVerificationRequest & {
  propertyLocation?: string;
  propertyImage?: string;
  propertySlug?: string;
  propertyReference?: string;
  assignedAgentName?: string;
  internalNotes?: string;
};

export type FonciereAdminMeta = {
  assignedAgentName: string;
  internalNotes: string;
};

function metaFrom(record?: FonciereClientRecord | null): FonciereAdminMeta {
  return {
    assignedAgentName: record?.assignedAgentName || "",
    internalNotes: record?.internalNotes || "",
  };
}

export async function listFonciereRequests(): Promise<FonciereClientRecord[]> {
  const items = await demoApiFetch<FonciereClientRecord[]>(
    "/fonciere-verifications",
  );
  return [...items].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export async function findFonciereRequest(
  id: string,
): Promise<FonciereClientRecord | undefined> {
  if (!id.trim()) return undefined;
  try {
    return await demoApiFetch<FonciereClientRecord>(
      `/fonciere-verifications/${encodeURIComponent(id)}`,
    );
  } catch {
    return undefined;
  }
}

export async function getFonciereAdminMeta(
  id: string,
): Promise<FonciereAdminMeta> {
  const record = await findFonciereRequest(id);
  return metaFrom(record);
}

export async function saveFonciereAdminMeta(
  id: string,
  patch: Partial<FonciereAdminMeta>,
): Promise<FonciereAdminMeta> {
  const record = await demoApiFetch<FonciereClientRecord>(
    `/fonciere-verifications/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
  );
  return metaFrom(record);
}

export async function updateFonciereAdminStatus(
  id: string,
  status: FonciereVerificationStatus,
  message: string,
  actorId = "admin",
): Promise<FonciereClientRecord | undefined> {
  try {
    return await demoApiFetch<FonciereClientRecord>(
      `/fonciere-verifications/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, message, actorId }),
      },
    );
  } catch {
    return undefined;
  }
}
