import { adminAuthHeaders } from "./admin-auth";
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
  createdByAdminId?: string | null;
  updatedByAdminId?: string | null;
  approvedByAdminId?: string | null;
  publishedByAdminId?: string | null;
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
  createdByAdminId?: string | null;
  updatedByAdminId?: string | null;
  images: string[];
  media?: { id: string; type: "IMAGE" | string; url: string }[];
  videos?: { id: string; url: string; title?: string }[];
  description: string;
  status?: string;
};

export type DemoBundle = {
  listing: DemoListing | null;
  property: DemoProperty | null;
  owner: Record<string, unknown> | null;
  agency: Record<string, unknown> | null;
  propertyMissing: boolean;
  advertiserMissing: boolean;
};

type AdminIdentity = { email: string; id: string | number };

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
      property: data.property
        ? (normalizeProperty(data.property) as DemoProperty)
        : null,
    };
  },

  create(payload: Record<string, unknown>) {
    return demoApiFetch<DemoListing>("/listings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /** Création administrative (ANNONCES_ECRITURE). */
  createAsAdmin(payload: Record<string, unknown>, admin: AdminIdentity) {
    return demoApiFetch<DemoListing>("/admin/listings", {
      method: "POST",
      headers: adminAuthHeaders(admin),
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
    admin?: AdminIdentity | null,
  ) {
    return demoApiFetch<DemoListing>(
      `/listings/${encodeURIComponent(id)}/status`,
      {
        method: "POST",
        headers: admin ? adminAuthHeaders(admin) : {},
        body: JSON.stringify(input),
      },
    );
  },

  /** EN_ATTENTE → PUBLIEE (MODERATION). */
  approve(id: string, admin: AdminIdentity, input?: { note?: string }) {
    return demoApiFetch<DemoListing>(
      `/listings/${encodeURIComponent(id)}/approve`,
      {
        method: "POST",
        headers: adminAuthHeaders(admin),
        body: JSON.stringify(input || {}),
      },
    );
  },

  /** BROUILLON → PUBLIEE (ANNONCES_PUBLICATION). */
  publishDirect(id: string, admin: AdminIdentity, input?: { note?: string }) {
    return demoApiFetch<DemoListing>(
      `/listings/${encodeURIComponent(id)}/publish`,
      {
        method: "POST",
        headers: adminAuthHeaders(admin),
        body: JSON.stringify(input || {}),
      },
    );
  },

  requestCorrection(id: string, admin: AdminIdentity, note: string) {
    return demoApiFetch<DemoListing>(
      `/listings/${encodeURIComponent(id)}/request-correction`,
      {
        method: "POST",
        headers: adminAuthHeaders(admin),
        body: JSON.stringify({ note }),
      },
    );
  },

  reject(
    id: string,
    admin: AdminIdentity,
    input: {
      note: string;
      canResubmit?: boolean;
      resubmitRequiresVerifiedAdvertiser?: boolean;
    },
  ) {
    return demoApiFetch<DemoListing>(
      `/listings/${encodeURIComponent(id)}/reject`,
      {
        method: "POST",
        headers: adminAuthHeaders(admin),
        body: JSON.stringify(input),
      },
    );
  },

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

  /** Création admin pour un propriétaire / une agence (BIENS_ECRITURE). */
  async createAsAdmin(payload: Record<string, unknown>, admin: AdminIdentity) {
    const data = await demoApiFetch<DemoProperty>("/admin/properties", {
      method: "POST",
      headers: adminAuthHeaders(admin),
      body: JSON.stringify(payload),
    });
    return normalizeProperty(data) as DemoProperty;
  },

  async updateAsAdmin(
    id: string,
    patch: Record<string, unknown>,
    admin: AdminIdentity,
  ) {
    const data = await demoApiFetch<DemoProperty>(
      `/admin/properties/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: adminAuthHeaders(admin),
        body: JSON.stringify(patch),
      },
    );
    return normalizeProperty(data) as DemoProperty;
  },
};

export type DemoUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  roleVerified?: boolean;
  documentsVerified?: boolean;
  reportsCount?: number;
  createdAt?: string;
  lastLogin?: string;
  avatarUrl?: string | null;
};

export type DemoAgency = {
  id: string;
  userId?: string;
  name: string;
  initials?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  verified?: boolean;
  documentsVerified?: boolean;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  reportsCount?: number;
  status?: string;
  validatedAt?: string;
  createdAt?: string;
  logoUrl?: string | null;
};

export type DemoAdminAccount = {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  status: string;
};

export const directoryService = {
  users() {
    return demoApiFetch<DemoUser[]>("/users");
  },
  user(id: string) {
    return demoApiFetch<DemoUser>(`/users/${encodeURIComponent(id)}`);
  },
  agencies() {
    return demoApiFetch<DemoAgency[]>("/agencies");
  },
  agency(id: string) {
    return demoApiFetch<DemoAgency>(`/agencies/${encodeURIComponent(id)}`);
  },
  admins() {
    return demoApiFetch<DemoAdminAccount[]>("/admin/admins");
  },
};
