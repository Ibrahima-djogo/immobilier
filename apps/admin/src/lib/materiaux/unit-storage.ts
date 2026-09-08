/**
 * DEMO ONLY — accès aux unités de vente.
 * Source de vérité : Demo API. localStorage = repli hors-ligne uniquement.
 */

import {
  cloneMaterialUnitSeeds,
  normalizeUnitName,
  uniqueUnitSlug,
  type MaterialUnit,
  type MaterialUnitStatus,
} from "./units";
import { apiCreateUnit, apiDeleteUnit, apiUpdateUnit } from "./material-api";
import {
  forceRefreshMaterialStores,
  getMaterialSnapshot,
  isMaterialRemoteReady,
} from "./remote-cache";

export const MATERIAL_UNITS_KEY = "demeure-guinee-admin-material-units";

export type CreateMaterialUnitInput = {
  name: string;
  symbol?: string;
  status?: MaterialUnitStatus;
};

export type UpdateMaterialUnitInput = {
  name?: string;
  symbol?: string;
  status?: MaterialUnitStatus;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isMaterialUnit(value: unknown): value is MaterialUnit {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MaterialUnit>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.symbol === "string" &&
    typeof item.slug === "string" &&
    (item.status === "ACTIF" || item.status === "INACTIF") &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function readRaw(): MaterialUnit[] | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(MATERIAL_UNITS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isMaterialUnit);
  } catch {
    return null;
  }
}

function writeAll(units: MaterialUnit[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(MATERIAL_UNITS_KEY, JSON.stringify(units));
}

function assertUnique(
  units: MaterialUnit[],
  name: string,
  slug: string,
  excludeId?: string,
) {
  const normalized = normalizeUnitName(name);
  if (
    units.some(
      (item) =>
        item.id !== excludeId && normalizeUnitName(item.name) === normalized,
    )
  ) {
    throw new Error("Une unité porte déjà ce nom.");
  }
  if (units.some((item) => item.id !== excludeId && item.slug === slug)) {
    throw new Error("Une unité utilise déjà ce slug.");
  }
}

export function ensureMaterialUnitStore(): MaterialUnit[] {
  const remote = getMaterialSnapshot()?.units;
  if (remote) return remote.map((item) => ({ ...item }));

  const existing = readRaw();
  const seeds = cloneMaterialUnitSeeds();
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
        normalizeUnitName(item.name) === normalizeUnitName(seed.name),
    );
    if (!alreadyThere) {
      next.push(seed);
      changed = true;
    }
  }

  if (changed) writeAll(next);
  return next.map((item) => ({ ...item }));
}

export const materialUnitStorage = {
  list(): MaterialUnit[] {
    return ensureMaterialUnitStore().sort((left, right) =>
      left.name.localeCompare(right.name, "fr", { sensitivity: "base" }),
    );
  },

  listActive(): MaterialUnit[] {
    return materialUnitStorage
      .list()
      .filter((unit) => unit.status === "ACTIF");
  },

  findById(id: string): MaterialUnit | undefined {
    return ensureMaterialUnitStore().find((item) => item.id === id);
  },

  async create(input: CreateMaterialUnitInput): Promise<MaterialUnit> {
    if (isMaterialRemoteReady()) {
      const created = await apiCreateUnit(input);
      await forceRefreshMaterialStores();
      return created;
    }
    const units = ensureMaterialUnitStore();
    const name = input.name.trim();
    const slug = uniqueUnitSlug(name, units);
    assertUnique(units, name, slug);

    const now = new Date().toISOString();
    const next: MaterialUnit = {
      id: `mu-${Date.now()}`,
      name,
      symbol: input.symbol?.trim() ?? "",
      slug,
      status: input.status ?? "ACTIF",
      createdAt: now,
      updatedAt: now,
    };

    writeAll([next, ...units]);
    return next;
  },

  async update(
    id: string,
    patch: UpdateMaterialUnitInput,
  ): Promise<MaterialUnit | undefined> {
    if (isMaterialRemoteReady()) {
      const updated = await apiUpdateUnit(id, patch);
      await forceRefreshMaterialStores();
      return updated;
    }
    const units = ensureMaterialUnitStore();
    const index = units.findIndex((item) => item.id === id);
    if (index < 0) return undefined;

    const current = units[index];
    const name = patch.name?.trim() ?? current.name;
    const slug =
      patch.name !== undefined
        ? uniqueUnitSlug(name, units, id)
        : current.slug;

    assertUnique(units, name, slug, id);

    const next: MaterialUnit = {
      ...current,
      name,
      slug,
      symbol:
        patch.symbol !== undefined ? patch.symbol.trim() : current.symbol,
      status: patch.status ?? current.status,
      updatedAt: new Date().toISOString(),
    };
    units[index] = next;
    writeAll(units);
    return next;
  },

  async remove(id: string): Promise<boolean> {
    if (isMaterialRemoteReady()) {
      await apiDeleteUnit(id);
      await forceRefreshMaterialStores();
      return true;
    }
    const units = ensureMaterialUnitStore();
    if (!units.some((item) => item.id === id)) return false;
    writeAll(units.filter((item) => item.id !== id));
    return true;
  },
};
