/**
 * DEMO ONLY — accès aux fournisseurs de matériaux.
 * Source de vérité : Demo API. localStorage = repli hors-ligne uniquement.
 */

import {
  cloneMaterialSupplierSeeds,
  normalizeSupplierName,
  uniqueSupplierSlug,
  type MaterialSupplier,
  type MaterialSupplierStatus,
  type MaterialSupplierType,
} from "./suppliers";
import {
  apiCreateSupplier,
  apiDeleteSupplier,
  apiUpdateSupplier,
} from "./material-api";
import {
  forceRefreshMaterialStores,
  getMaterialSnapshot,
  isMaterialRemoteReady,
} from "./remote-cache";

export const MATERIAL_SUPPLIERS_KEY = "demeure-guinee-admin-material-suppliers";

export type CreateMaterialSupplierInput = {
  type: MaterialSupplierType;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  description?: string;
  verificationStatus?: MaterialSupplier["verificationStatus"];
  status?: MaterialSupplierStatus;
};

export type UpdateMaterialSupplierInput = Partial<CreateMaterialSupplierInput>;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isMaterialSupplier(value: unknown): value is MaterialSupplier {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MaterialSupplier>;
  return (
    typeof item.id === "string" &&
    (item.type === "PARTICULIER" || item.type === "PROFESSIONNEL") &&
    typeof item.name === "string" &&
    typeof item.slug === "string" &&
    typeof item.phone === "string" &&
    typeof item.email === "string" &&
    typeof item.address === "string" &&
    typeof item.city === "string" &&
    (item.district == null || typeof item.district === "string") &&
    typeof item.description === "string" &&
    (item.status === "ACTIF" || item.status === "INACTIF") &&
    (item.verificationStatus === "NON_VERIFIE" ||
      item.verificationStatus === "EN_VERIFICATION" ||
      item.verificationStatus === "VERIFIE") &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function readRaw(): MaterialSupplier[] | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(MATERIAL_SUPPLIERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isMaterialSupplier);
  } catch {
    return null;
  }
}

function writeAll(suppliers: MaterialSupplier[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(MATERIAL_SUPPLIERS_KEY, JSON.stringify(suppliers));
}

function assertUnique(
  suppliers: MaterialSupplier[],
  name: string,
  slug: string,
  excludeId?: string,
) {
  const normalized = normalizeSupplierName(name);
  if (
    suppliers.some(
      (item) =>
        item.id !== excludeId && normalizeSupplierName(item.name) === normalized,
    )
  ) {
    throw new Error("Un fournisseur porte déjà ce nom.");
  }
  if (suppliers.some((item) => item.id !== excludeId && item.slug === slug)) {
    throw new Error("Un fournisseur utilise déjà ce slug.");
  }
}

export function ensureMaterialSupplierStore(): MaterialSupplier[] {
  const remote = getMaterialSnapshot()?.suppliers;
  if (remote) return remote.map((item) => ({ ...item }));

  const existing = readRaw();
  const seeds = cloneMaterialSupplierSeeds();
  if (!existing || existing.length === 0) {
    writeAll(seeds);
    return seeds;
  }

  let changed = false;
  const next = [...existing];
  for (const seed of seeds) {
    const alreadyThere = next.some(
      (item) =>
        item.id === seed.id ||
        item.slug === seed.slug ||
        normalizeSupplierName(item.name) === normalizeSupplierName(seed.name),
    );
    if (!alreadyThere) {
      next.push(seed);
      changed = true;
    }
  }

  if (changed) writeAll(next);
  return next.map((item) => ({ ...item }));
}

export const materialSupplierStorage = {
  list(): MaterialSupplier[] {
    return ensureMaterialSupplierStore().sort((left, right) =>
      left.name.localeCompare(right.name, "fr", { sensitivity: "base" }),
    );
  },

  listActive(): MaterialSupplier[] {
    return materialSupplierStorage
      .list()
      .filter((supplier) => supplier.status === "ACTIF");
  },

  findById(id: string): MaterialSupplier | undefined {
    return ensureMaterialSupplierStore().find((item) => item.id === id);
  },

  async create(input: CreateMaterialSupplierInput): Promise<MaterialSupplier> {
    if (isMaterialRemoteReady()) {
      const created = await apiCreateSupplier(input);
      await forceRefreshMaterialStores();
      return created;
    }
    const suppliers = ensureMaterialSupplierStore();
    const name = input.name.trim();
    const slug = uniqueSupplierSlug(name, suppliers);
    assertUnique(suppliers, name, slug);

    const now = new Date().toISOString();
    const next: MaterialSupplier = {
      id: `ms-${Date.now()}`,
      type: input.type,
      name,
      slug,
      phone: input.phone?.trim() ?? "",
      email: input.email?.trim().toLowerCase() ?? "",
      address: input.address?.trim() ?? "",
      city: input.city?.trim() ?? "",
      district: input.district?.trim() ?? "",
      description: input.description?.trim() ?? "",
      history: [],
      status: input.status ?? "ACTIF",
      verificationStatus: "NON_VERIFIE",
      createdAt: now,
      updatedAt: now,
    };

    writeAll([next, ...suppliers]);
    return next;
  },

  async update(
    id: string,
    patch: UpdateMaterialSupplierInput,
  ): Promise<MaterialSupplier | undefined> {
    if (isMaterialRemoteReady()) {
      const updated = await apiUpdateSupplier(id, patch);
      await forceRefreshMaterialStores();
      return updated;
    }
    const suppliers = ensureMaterialSupplierStore();
    const index = suppliers.findIndex((item) => item.id === id);
    if (index < 0) return undefined;

    const current = suppliers[index];
    const name = patch.name?.trim() ?? current.name;
    const slug =
      patch.name !== undefined
        ? uniqueSupplierSlug(name, suppliers, id)
        : current.slug;
    assertUnique(suppliers, name, slug, id);

    const next: MaterialSupplier = {
      ...current,
      type: patch.type ?? current.type,
      name,
      slug,
      phone: patch.phone !== undefined ? patch.phone.trim() : current.phone,
      email:
        patch.email !== undefined
          ? patch.email.trim().toLowerCase()
          : current.email,
      address:
        patch.address !== undefined ? patch.address.trim() : current.address,
      city: patch.city !== undefined ? patch.city.trim() : current.city,
      district:
        patch.district !== undefined ? patch.district.trim() : current.district,
      verificationStatus:
        patch.verificationStatus ?? current.verificationStatus,
      description:
        patch.description !== undefined
          ? patch.description.trim()
          : current.description,
      status: patch.status ?? current.status,
      updatedAt: new Date().toISOString(),
    };
    suppliers[index] = next;
    writeAll(suppliers);
    return next;
  },

  async remove(id: string): Promise<boolean> {
    if (isMaterialRemoteReady()) {
      await apiDeleteSupplier(id);
      await forceRefreshMaterialStores();
      return true;
    }
    const suppliers = ensureMaterialSupplierStore();
    if (!suppliers.some((item) => item.id === id)) return false;
    writeAll(suppliers.filter((item) => item.id !== id));
    return true;
  },
};
