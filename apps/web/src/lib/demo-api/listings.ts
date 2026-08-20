import { demoApiFetch } from "./client";
import {
  normalizeProperties,
  normalizeProperty,
} from "@/lib/property/normalizeProperty";
import type { RentalTerms, SaleTerms } from "@/lib/listing/listingTerms";

export type DemoAdStatus =
  | "BROUILLON"
  | "EN_ATTENTE"
  | "PUBLIEE"
  | "REFUSEE"
  | "SUSPENDUE"
  | "A_CORRIGER"
  | "EXPIREE"
  | "ARCHIVEE";

export type DemoAdvertiser = {
  id: string | null;
  type: "PROPRIETAIRE" | "AGENCE" | null;
  name: string | null;
  verified: boolean;
  initials: string;
  logo?: string | null;
  missing: boolean;
};

export type DemoListing = {
  id: string;
  reference: string;
  slug: string;
  propertyId: string;
  title: string;
  owner: string;
  advertiserType: "PROPRIETAIRE" | "AGENCE";
  ownerId?: string | null;
  agencyId?: string | null;
  /** Enrichi par Demo API — source préférée pour l’affichage public */
  advertiser?: DemoAdvertiser;
  type: string;
  operation: "VENTE" | "LOCATION";
  price: number;
  /** Conditions de location (operation = LOCATION). */
  rentalTerms?: RentalTerms | null;
  /** Conditions de vente (operation = VENTE) — le montant reste `price`. */
  saleTerms?: SaleTerms | null;
  description: string;
  status: DemoAdStatus;
  createdAt: string;
  submittedAt: string | null;
  updatedAt: string;
  publishedAt: string | null;
  moderationNote?: string | null;
  rejectionReason?: string | null;
  canResubmit?: boolean;
  resubmitRequiresVerifiedAdvertiser?: boolean;
  views: number;
  favorites: number;
  contacts: number;
  reports?: number;
  risk?: number;
  images: string[];
  media?: { id: string; type: "IMAGE" | string; url: string }[];
  videos: { id: string; url: string; title?: string }[];
  history: { id: string; date: string; label: string }[];
};

export type DemoProperty = {
  id: string;
  slug: string;
  reference: string;
  title: string;
  type: string;
  operation: "VENTE" | "LOCATION" | string;
  price: number;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms?: number;
  amenities?: string[];
  condition?: string;
  availability?: string;
  city: string;
  commune: string;
  district: string;
  landmark?: string;
  adminAddress?: string;
  coordinates?: { lat: number; lng: number } | null;
  locationLabel?: string | null;
  locationConfirmed?: boolean;
  ownerId?: string | null;
  agencyId?: string | null;
  images: string[];
  media?: { id: string; type: "IMAGE" | string; url: string }[];
  videos?: { id: string; url: string; title?: string; type?: string; isPrimary?: boolean }[];
  description: string;
  status?: "ACTIF" | "BROUILLON" | "ARCHIVE" | string;
  mandateType?: string | null;
  clientDisplayName?: string | null;
  clientReference?: string | null;
  views?: number;
  contacts?: number;
  completeness?: number;
  /** Vérification juridique du bien (≠ compte vérifié) */
  legalVerificationStatus?:
    | "NON_SOUMIS"
    | "EN_ATTENTE"
    | "VERIFIE"
    | "A_CORRIGER"
    | "REFUSE"
    | string;
  legalDocumentIds?: string[];
};

export type DemoBundle = {
  listing: DemoListing | null;
  property: DemoProperty | null;
  owner: Record<string, unknown> | null;
  agency: Record<string, unknown> | null;
  advertiser?: DemoAdvertiser | null;
  propertyMissing: boolean;
  advertiserMissing: boolean;
};

export const listingService = {
  list(params?: {
    publicOnly?: boolean;
    ownerId?: string;
    agencyId?: string;
    status?: string;
  }) {
    const q = new URLSearchParams();
    if (params?.publicOnly) q.set("public", "1");
    if (params?.ownerId) q.set("ownerId", params.ownerId);
    if (params?.agencyId) q.set("agencyId", params.agencyId);
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return demoApiFetch<DemoListing[]>(`/listings${qs ? `?${qs}` : ""}`);
  },

  get(idOrSlug: string) {
    return demoApiFetch<DemoListing>(`/listings/${encodeURIComponent(idOrSlug)}`);
  },

  async bundle(idOrSlug: string) {
    const data = await demoApiFetch<DemoBundle>(
      `/listings/${encodeURIComponent(idOrSlug)}/bundle`,
    );
    return {
      ...data,
      property: data.property ? (normalizeProperty(data.property) as DemoProperty) : null,
    };
  },

  create(payload: Record<string, unknown>) {
    return demoApiFetch<DemoListing>("/listings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id: string, patch: Record<string, unknown>) {
    return demoApiFetch<DemoListing>(`/listings/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  setStatus(
    id: string,
    input: {
      status: DemoAdStatus;
      note?: string;
      actor?: string;
      canResubmit?: boolean;
      resubmitRequiresVerifiedAdvertiser?: boolean;
    },
  ) {
    return demoApiFetch<DemoListing>(
      `/listings/${encodeURIComponent(id)}/status`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },

  /** Seule transition EN_ATTENTE → PUBLIEE (admin). */
  approve(id: string, input?: { note?: string; actor?: string }) {
    return demoApiFetch<DemoListing>(
      `/listings/${encodeURIComponent(id)}/approve`,
      {
        method: "POST",
        body: JSON.stringify(input || { actor: "SUPER_ADMIN" }),
      },
    );
  },

  /** Renvoi A_CORRIGER | REFUSEE(canResubmit) → EN_ATTENTE */
  resubmit(id: string, input?: { actor?: string }) {
    return demoApiFetch<DemoListing>(
      `/listings/${encodeURIComponent(id)}/resubmit`,
      {
        method: "POST",
        body: JSON.stringify(input || {}),
      },
    );
  },
};

export const propertyService = {
  async list(params?: { ownerId?: string; agencyId?: string }) {
    const q = new URLSearchParams();
    if (params?.ownerId) q.set("ownerId", params.ownerId);
    if (params?.agencyId) q.set("agencyId", params.agencyId);
    const qs = q.toString();
    const data = await demoApiFetch<DemoProperty[]>(
      `/properties${qs ? `?${qs}` : ""}`,
    );
    return normalizeProperties(data) as DemoProperty[];
  },

  async get(idOrSlug: string) {
    const data = await demoApiFetch<DemoProperty>(
      `/properties/${encodeURIComponent(idOrSlug)}`,
    );
    return normalizeProperty(data) as DemoProperty;
  },

  async create(payload: Record<string, unknown>) {
    const data = await demoApiFetch<DemoProperty>("/properties", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeProperty(data) as DemoProperty;
  },

  async update(idOrSlug: string, patch: Record<string, unknown>) {
    const data = await demoApiFetch<DemoProperty>(
      `/properties/${encodeURIComponent(idOrSlug)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      },
    );
    return normalizeProperty(data) as DemoProperty;
  },

  remove(idOrSlug: string) {
    return demoApiFetch<{ ok: boolean; id: string }>(
      `/properties/${encodeURIComponent(idOrSlug)}`,
      { method: "DELETE" },
    );
  },
};
