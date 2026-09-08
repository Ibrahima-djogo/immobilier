/**
 * DEMO ONLY — accès aux catégories de matériaux.
 * Source de vérité : Demo API. localStorage = repli hors-ligne uniquement.
 */

import {
  cloneMaterialCategorySeeds,
  normalizeCategoryName,
  slugifyCategoryName,
  uniqueCategorySlug,
  type MaterialCategory,
  type MaterialCategoryStatus,
} from "./categories";
import {
  apiCreateCategory,
  apiDeleteCategory,
  apiUpdateCategory,
} from "./material-api";
import {
  forceRefreshMaterialStores,
  getMaterialSnapshot,
  isMaterialRemoteReady,
} from "./remote-cache";

export const MATERIAL_CATEGORIES_KEY = "demeure-guinee-admin-material-categories";

export type CreateMaterialCategoryInput = {
  name: string;
  status?: MaterialCategoryStatus;
};

export type UpdateMaterialCategoryInput = {
  name?: string;
  status?: MaterialCategoryStatus;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRaw(): MaterialCategory[] | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(MATERIAL_CATEGORIES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isMaterialCategory);
  } catch {
    return null;
  }
}

function isMaterialCategory(value: unknown): value is MaterialCategory {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MaterialCategory>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.slug === "string" &&
    (item.status === "ACTIF" || item.status === "INACTIF") &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function writeAll(categories: MaterialCategory[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    MATERIAL_CATEGORIES_KEY,
    JSON.stringify(categories),
  );
}

function assertUnique(
  categories: MaterialCategory[],
  name: string,
  slug: string,
  excludeId?: string,
) {
  const normalized = normalizeCategoryName(name);
  const duplicateName = categories.some(
    (item) =>
      item.id !== excludeId && normalizeCategoryName(item.name) === normalized,
  );
  if (duplicateName) {
    throw new Error("Une catégorie porte déjà ce nom.");
  }
  const duplicateSlug = categories.some(
    (item) => item.id !== excludeId && item.slug === slug,
  );
  if (duplicateSlug) {
    throw new Error("Une catégorie utilise déjà ce slug.");
  }
}

/** Initialise les 13 catégories de base au premier accès client. */
export function ensureMaterialCategoryStore(): MaterialCategory[] {
  const remote = getMaterialSnapshot()?.categories;
  if (remote) return remote.map((item) => ({ ...item }));

  const existing = readRaw();
  const seeds = cloneMaterialCategorySeeds();
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
        normalizeCategoryName(item.name) === normalizeCategoryName(seed.name),
    );
    if (!alreadyThere) {
      next.push(seed);
      changed = true;
    }
  }

  if (changed) writeAll(next);
  return next.map((item) => ({ ...item }));
}

export const materialCategoryStorage = {
  list(): MaterialCategory[] {
    return ensureMaterialCategoryStore().sort((left, right) =>
      left.name.localeCompare(right.name, "fr", { sensitivity: "base" }),
    );
  },

  async create(input: CreateMaterialCategoryInput): Promise<MaterialCategory> {
    if (isMaterialRemoteReady()) {
      const created = await apiCreateCategory(input);
      await forceRefreshMaterialStores();
      return created;
    }
    const categories = ensureMaterialCategoryStore();
    const name = input.name.trim();
    const slug = uniqueCategorySlug(name, categories);
    if (slugifyCategoryName(name).length < 2) {
      throw new Error(
        "Le nom doit permettre de générer un identifiant (slug) valide.",
      );
    }
    assertUnique(categories, name, slug);

    const now = new Date().toISOString();
    const next: MaterialCategory = {
      id: `mc-${Date.now()}`,
      name,
      slug,
      status: input.status ?? "ACTIF",
      createdAt: now,
      updatedAt: now,
    };

    writeAll([next, ...categories]);
    return next;
  },

  async update(
    id: string,
    patch: UpdateMaterialCategoryInput,
  ): Promise<MaterialCategory | undefined> {
    if (isMaterialRemoteReady()) {
      const updated = await apiUpdateCategory(id, patch);
      await forceRefreshMaterialStores();
      return updated;
    }
    const categories = ensureMaterialCategoryStore();
    const index = categories.findIndex((item) => item.id === id);
    if (index < 0) return undefined;

    const current = categories[index];
    const name = patch.name?.trim() ?? current.name;
    const slug =
      patch.name !== undefined
        ? uniqueCategorySlug(name, categories, id)
        : current.slug;

    if (slugifyCategoryName(name).length < 2) {
      throw new Error(
        "Le nom doit permettre de générer un identifiant (slug) valide.",
      );
    }
    assertUnique(categories, name, slug, id);

    const next: MaterialCategory = {
      ...current,
      name,
      slug,
      status: patch.status ?? current.status,
      updatedAt: new Date().toISOString(),
    };
    categories[index] = next;
    writeAll(categories);
    return next;
  },

  async remove(id: string): Promise<boolean> {
    if (isMaterialRemoteReady()) {
      await apiDeleteCategory(id);
      await forceRefreshMaterialStores();
      return true;
    }
    const categories = ensureMaterialCategoryStore();
    const exists = categories.some((item) => item.id === id);
    if (!exists) return false;
    writeAll(categories.filter((item) => item.id !== id));
    return true;
  },
};
