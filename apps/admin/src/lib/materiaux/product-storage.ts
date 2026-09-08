/**
 * DEMO ONLY — accès aux fiches catalogue de matériaux.
 * Source de vérité : Demo API. localStorage = repli hors-ligne uniquement.
 */

import { materialCategoryStorage } from "./category-storage";
import {
  cloneMaterialProductSeeds,
  normalizeProductName,
  uniqueProductSlug,
  type MaterialProduct,
  type MaterialProductStatus,
} from "./products";
import { slugifyCategoryName } from "./categories";
import { materialSupplierStorage } from "./supplier-storage";
import { materialUnitStorage } from "./unit-storage";
import type { MaterialSaleUnit } from "./units";
import {
  apiCreateProduct,
  apiDeleteProduct,
  apiUpdateProduct,
} from "./material-api";
import {
  forceRefreshMaterialStores,
  getMaterialSnapshot,
  isMaterialRemoteReady,
} from "./remote-cache";

export const MATERIAL_PRODUCTS_KEY = "demeure-guinee-admin-material-products";

export type CreateMaterialProductInput = {
  name: string;
  categoryId: string;
  description?: string;
  brand?: string;
  reference?: string;
  unit: MaterialSaleUnit;
  supplierId?: string;
  price: number;
  status?: MaterialProductStatus;
  imageUrl?: string;
};

export type UpdateMaterialProductInput = Partial<CreateMaterialProductInput>;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isMaterialProduct(value: unknown): value is MaterialProduct {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MaterialProduct>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.slug === "string" &&
    typeof item.categoryId === "string" &&
    typeof item.description === "string" &&
    typeof item.brand === "string" &&
    typeof item.reference === "string" &&
    typeof item.unit === "string" &&
    item.unit.length > 0 &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    (item.status === "ACTIF" || item.status === "INACTIF") &&
    typeof item.imageUrl === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function normalizeProduct(item: MaterialProduct): MaterialProduct {
  return {
    ...item,
    supplierId: typeof item.supplierId === "string" ? item.supplierId : "",
  };
}

function readRaw(): MaterialProduct[] | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(MATERIAL_PRODUCTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isMaterialProduct);
  } catch {
    return null;
  }
}

function writeAll(products: MaterialProduct[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(MATERIAL_PRODUCTS_KEY, JSON.stringify(products));
}

function assertUnique(
  products: MaterialProduct[],
  name: string,
  slug: string,
  excludeId?: string,
) {
  const normalized = normalizeProductName(name);
  if (
    products.some(
      (item) =>
        item.id !== excludeId && normalizeProductName(item.name) === normalized,
    )
  ) {
    throw new Error("Un matériau porte déjà ce nom.");
  }
  if (products.some((item) => item.id !== excludeId && item.slug === slug)) {
    throw new Error("Un matériau utilise déjà ce slug.");
  }
}

function assertCategory(categoryId: string) {
  const exists = materialCategoryStorage
    .list()
    .some((category) => category.id === categoryId);
  if (!exists) {
    throw new Error("Associez le matériau à une catégorie existante.");
  }
}

function assertUnit(unitId: string, options?: { allowInactive?: boolean }) {
  const unit = materialUnitStorage.findById(unitId);
  if (!unit) {
    throw new Error("Choisissez une unité de vente existante.");
  }
  if (!options?.allowInactive && unit.status === "INACTIF") {
    throw new Error("Cette unité est inactive. Choisissez une unité active.");
  }
}

function assertSupplier(
  supplierId: string,
  options?: { allowInactive?: boolean },
) {
  if (!supplierId) return;
  const supplier = materialSupplierStorage.findById(supplierId);
  if (!supplier) {
    throw new Error("Associez le matériau à un fournisseur existant.");
  }
  if (!options?.allowInactive && supplier.status === "INACTIF") {
    throw new Error(
      "Ce fournisseur est inactif. Choisissez un fournisseur actif.",
    );
  }
}

export function ensureMaterialProductStore(): MaterialProduct[] {
  const remote = getMaterialSnapshot()?.products;
  if (remote) return remote.map((item) => ({ ...item }));

  const existing = readRaw();
  const seeds = cloneMaterialProductSeeds();
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
        normalizeProductName(item.name) === normalizeProductName(seed.name),
    );
    if (!alreadyThere) {
      next.push(seed);
      changed = true;
    }
  }

  const normalized = next.map(normalizeProduct);
  const needsNormalize = next.some(
    (item) => typeof item.supplierId !== "string",
  );
  if (changed || needsNormalize) writeAll(normalized);
  return normalized.map((item) => ({ ...item }));
}

export const materialProductStorage = {
  list(): MaterialProduct[] {
    return ensureMaterialProductStore().sort((left, right) =>
      left.name.localeCompare(right.name, "fr", { sensitivity: "base" }),
    );
  },

  findById(id: string): MaterialProduct | undefined {
    return ensureMaterialProductStore().find((item) => item.id === id);
  },

  countByCategory(categoryId: string): number {
    return ensureMaterialProductStore().filter(
      (item) => item.categoryId === categoryId,
    ).length;
  },

  countByUnit(unitId: string): number {
    return ensureMaterialProductStore().filter((item) => item.unit === unitId)
      .length;
  },

  countBySupplier(supplierId: string): number {
    if (!supplierId) return 0;
    return ensureMaterialProductStore().filter(
      (item) => item.supplierId === supplierId,
    ).length;
  },

  listBySupplier(supplierId: string): MaterialProduct[] {
    if (!supplierId) return [];
    return materialProductStorage
      .list()
      .filter((item) => item.supplierId === supplierId);
  },

  async create(input: CreateMaterialProductInput): Promise<MaterialProduct> {
    if (isMaterialRemoteReady()) {
      const created = await apiCreateProduct(input);
      await forceRefreshMaterialStores();
      return created;
    }
    const products = ensureMaterialProductStore();
    const name = input.name.trim();
    const slug = uniqueProductSlug(name, products);
    if (slugifyCategoryName(name).length < 2) {
      throw new Error(
        "Le nom doit permettre de générer un identifiant (slug) valide.",
      );
    }
    const supplierId = input.supplierId?.trim() ?? "";
    assertCategory(input.categoryId);
    assertUnit(input.unit);
    assertSupplier(supplierId);
    assertUnique(products, name, slug);

    const now = new Date().toISOString();
    const next: MaterialProduct = {
      id: `mp-${Date.now()}`,
      name,
      slug,
      categoryId: input.categoryId,
      description: input.description?.trim() ?? "",
      brand: input.brand?.trim() ?? "",
      reference: input.reference?.trim() ?? "",
      unit: input.unit,
      supplierId,
      price: input.price,
      status: input.status ?? "ACTIF",
      imageUrl: input.imageUrl ?? "",
      createdAt: now,
      updatedAt: now,
    };

    writeAll([next, ...products]);
    return next;
  },

  async update(
    id: string,
    patch: UpdateMaterialProductInput,
  ): Promise<MaterialProduct | undefined> {
    if (isMaterialRemoteReady()) {
      const updated = await apiUpdateProduct(id, patch);
      await forceRefreshMaterialStores();
      return updated;
    }
    const products = ensureMaterialProductStore();
    const index = products.findIndex((item) => item.id === id);
    if (index < 0) return undefined;

    const current = products[index];
    const name = patch.name?.trim() ?? current.name;
    const slug =
      patch.name !== undefined
        ? uniqueProductSlug(name, products, id)
        : current.slug;
    const categoryId = patch.categoryId ?? current.categoryId;

    if (slugifyCategoryName(name).length < 2) {
      throw new Error(
        "Le nom doit permettre de générer un identifiant (slug) valide.",
      );
    }
    const unit = patch.unit ?? current.unit;
    const supplierId =
      patch.supplierId !== undefined
        ? patch.supplierId.trim()
        : (current.supplierId ?? "");
    assertCategory(categoryId);
    assertUnit(unit, { allowInactive: unit === current.unit });
    assertSupplier(supplierId, {
      allowInactive: supplierId === (current.supplierId ?? ""),
    });
    assertUnique(products, name, slug, id);

    const next: MaterialProduct = {
      ...current,
      name,
      slug,
      categoryId,
      description:
        patch.description !== undefined
          ? patch.description.trim()
          : current.description,
      brand: patch.brand !== undefined ? patch.brand.trim() : current.brand,
      reference:
        patch.reference !== undefined
          ? patch.reference.trim()
          : current.reference,
      unit,
      supplierId,
      price: patch.price ?? current.price,
      status: patch.status ?? current.status,
      imageUrl:
        patch.imageUrl !== undefined ? patch.imageUrl : current.imageUrl,
      updatedAt: new Date().toISOString(),
    };
    products[index] = next;
    writeAll(products);
    return next;
  },

  async remove(id: string): Promise<boolean> {
    if (isMaterialRemoteReady()) {
      await apiDeleteProduct(id);
      await forceRefreshMaterialStores();
      return true;
    }
    const products = ensureMaterialProductStore();
    if (!products.some((item) => item.id === id)) return false;
    writeAll(products.filter((item) => item.id !== id));
    return true;
  },
};
