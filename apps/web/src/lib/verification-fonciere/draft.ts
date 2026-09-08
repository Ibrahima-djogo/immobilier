/**
 * Contexte de navigation + création de dossier via Demo API.
 * Legacy local storage removed.
 * Data source is now Demo API.
 */

import { routes } from "@/lib/routes/app-routes";
import { FONCIERE_PROPERTY_CONTEXT_KEY } from "./constants";
import { createFonciereRequest } from "./storage";
import {
  type FonciereRequestMode,
  type FonciereVerificationRequest,
  type VerificationRequester,
} from "./types";

export type FoncierePropertyContext = {
  propertyId: string;
  propertyTitle: string;
  propertyType: string;
  location: string;
  reference: string;
  image: string;
  slug?: string;
  ownerId?: string;
  ownerName?: string;
  agencyId?: string;
  agencyName?: string;
  advertiserType?: "PROPRIETAIRE" | "AGENCE";
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function persistFoncierePropertyContext(context: FoncierePropertyContext) {
  if (!canUseStorage()) return;
  window.sessionStorage.setItem(
    FONCIERE_PROPERTY_CONTEXT_KEY,
    JSON.stringify(context),
  );
}

export function readFoncierePropertyContext(): FoncierePropertyContext | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(FONCIERE_PROPERTY_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FoncierePropertyContext;
    if (!parsed?.propertyId || !parsed?.propertyTitle) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function createFonciereDraftRequest(input: {
  property: FoncierePropertyContext;
  requester: VerificationRequester;
  requestMode: FonciereRequestMode;
}): Promise<FonciereVerificationRequest> {
  return createFonciereRequest({
    propertyId: input.property.propertyId,
    propertyTitle: input.property.propertyTitle,
    propertyType: input.property.propertyType || "TERRAIN",
    requesterId: input.requester.userId,
    requesterName: input.requester.fullName,
    ownerId: input.property.ownerId || "",
    ownerName: input.property.ownerName || "",
    agencyId: input.property.agencyId || "",
    agencyName: input.property.agencyName || "",
    advertiserType: input.property.advertiserType,
    requestMode: input.requestMode,
    requester: input.requester,
    propertyLocation: input.property.location,
    propertyImage: input.property.image,
    propertySlug: input.property.slug,
    propertyReference: input.property.reference,
  });
}

export function fonciereRequestHref(propertyId: string) {
  const params = new URLSearchParams({ bien: propertyId });
  return `${routes.fonciereRequest}?${params.toString()}`;
}
